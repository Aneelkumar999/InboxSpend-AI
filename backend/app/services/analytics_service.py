import os
import json
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel, Field
from tenacity import retry, stop_after_attempt, wait_exponential
from dotenv import load_dotenv

try:
    from google import genai
    from google.genai import types
except ImportError:
    genai = None
    types = None

from app.db.models import Expense
from app.schemas.expense import FinancialInsights

logger = logging.getLogger(__name__)

class FinancialAnalyticsEngine:
    def __init__(self):
        load_dotenv()
        self.api_key = os.environ.get("GEMINI_API_KEY")
        if not self.api_key:
            logger.warning("GEMINI_API_KEY is not set. Analytics generation will fail.")
        if genai:
            self.client = genai.Client(api_key=self.api_key)
        else:
            self.client = None

    def _aggregate_data(self, db: Session, user_id: str) -> Dict[str, Any]:
        """Pre-calculate basic stats to save AI context window & processing power."""
        now = datetime.now()
        thirty_days_ago = now - timedelta(days=30)
        sixty_days_ago = now - timedelta(days=60)
        
        # Last 30 days
        last_30_expenses = db.query(Expense).filter(
            Expense.user_id == user_id,
            Expense.date >= thirty_days_ago
        ).all()
        
        # Previous 30 days
        prev_30_expenses = db.query(Expense).filter(
            Expense.user_id == user_id,
            Expense.date >= sixty_days_ago,
            Expense.date < thirty_days_ago
        ).all()
        
        def summarize(expenses):
            total = sum(float(e.amount) for e in expenses)
            categories = {}
            merchants = {}
            weekend_spend = 0.0
            
            for e in expenses:
                amt = float(e.amount)
                cat = e.category or "Others"
                categories[cat] = categories.get(cat, 0.0) + amt
                
                mer = e.merchant or "Unknown"
                merchants[mer] = merchants.get(mer, 0.0) + amt
                
                if e.date.weekday() >= 5: # Saturday or Sunday
                    weekend_spend += amt
                    
            return {
                "total": total,
                "categories": categories,
                "merchants": merchants,
                "weekend_spend": weekend_spend,
                "count": len(expenses)
            }
            
        current_stats = summarize(last_30_expenses)
        previous_stats = summarize(prev_30_expenses)
        
        # Look for duplicates in last 30 days (same amount, same merchant, within 2 days)
        duplicates = []
        for i, e1 in enumerate(last_30_expenses):
            for e2 in last_30_expenses[i+1:]:
                if e1.merchant == e2.merchant and e1.amount == e2.amount and abs((e1.date - e2.date).days) <= 2:
                    duplicates.append(f"Identical charge of {e1.amount} at {e1.merchant} on {e1.date.strftime('%Y-%m-%d')} and {e2.date.strftime('%Y-%m-%d')}")
                    
        return {
            "current_30_days": current_stats,
            "previous_30_days": previous_stats,
            "potential_duplicates": list(set(duplicates))[:5] # cap at 5 unique
        }

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        reraise=True
    )
    def generate_insights(self, db: Session, user_id: str) -> FinancialInsights:
        if not self.client or not self.api_key:
            raise ValueError("Gemini client not initialized or API key missing.")
            
        aggregated_data = self._aggregate_data(db, user_id)
        
        prompt = f"""
        You are an expert, highly intelligent financial advisor. Your job is to analyze a user's recent spending data and generate insightful, actionable, natural-language summaries.
        
        Analyze the following aggregated spending data for the last 30 days compared to the previous 30 days:
        {json.dumps(aggregated_data, indent=2)}
        
        Task:
        1. Create 3-5 concise, natural-language 'summaries' about the most significant changes (e.g. "Your food spending increased by 20%", "You spent more on weekends this month").
        2. Create a 'budget_prediction' for the next 30 days based on the 'current_30_days' total and trends. State a predicted amount.
        3. Identify any 'abnormal_spending' (e.g. a single merchant taking up a massive % of the budget, or huge category spikes). If none, return an empty list.
        4. Identify likely 'recurring_subscriptions' based on the merchants in the data (e.g. Netflix, Spotify, Amazon Prime). If none, return an empty list.
        5. Check the 'potential_duplicates' array and summarize them in 'duplicate_transactions'. If none, return an empty list.
        
        Format your response EXACTLY matching the requested JSON schema.
        """
        
        try:
            response = self.client.models.generate_content(
                model='gemini-3.5-flash',
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=FinancialInsights,
                    temperature=0.2
                ),
            )
            
            data = json.loads(response.text)
            return FinancialInsights(**data)
            
        except Exception as e:
            logger.error(f"Error generating insights with AI: {e}")
            # Fallback/default if AI fails completely
            return FinancialInsights(
                summaries=["Unable to generate AI insights at this time."],
                budget_prediction="N/A",
                abnormal_spending=[],
                recurring_subscriptions=[],
                duplicate_transactions=[]
            )
