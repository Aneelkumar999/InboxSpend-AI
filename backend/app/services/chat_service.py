import os
import json
import logging
from typing import List, Dict, Any, Generator
from sqlalchemy.orm import Session
from sqlalchemy import text
from dotenv import load_dotenv
from tenacity import retry, stop_after_attempt, wait_exponential

try:
    from google import genai
    from google.genai import types
except ImportError:
    genai = None
    types = None

from app.db.models import Expense, ChatSession, ChatMessage

logger = logging.getLogger(__name__)

class AIChatEngine:
    def __init__(self):
        load_dotenv()
        self.api_key = os.environ.get("GEMINI_API_KEY")
        if not self.api_key:
            logger.warning("GEMINI_API_KEY is not set.")
        if genai:
            self.client = genai.Client(api_key=self.api_key)
        else:
            self.client = None
            
        self.db_schema = """
        Table: expenses
        Columns:
        - id (UUID)
        - user_id (UUID)
        - message_id (String)
        - merchant (String)
        - amount (Numeric)
        - date (DateTime)
        - category (String: Food, Shopping, Travel, Bills, Subscriptions, Education, Healthcare, Entertainment, Others)
        - currency (String)
        - payment_method (String)
        - order_id (String)
        - tax (Numeric)
        - discount (Numeric)
        - is_subscription (Boolean)
        """
    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10), reraise=True)
    def detect_intent(self, query: str) -> str:
        if not self.client: return "GENERAL_CHAT"
        
        prompt = f"""
        Classify the intent of the following user query about their personal finances into exactly one of two categories: 'DATA_QUERY' or 'GENERAL_CHAT'.
        - Use 'DATA_QUERY' if the user is asking a specific question that requires fetching real data from a database (e.g., "How much did I spend on Swiggy?", "Show my travel expenses").
        - Use 'GENERAL_CHAT' if the user is making a general statement, asking a generic financial advice question not tied to their exact data, or just saying hello.
        
        Query: "{query}"
        
        Return ONLY the classification string.
        """
        response = self.client.models.generate_content(
            model='gemini-3.5-flash',
            contents=prompt,
        )
        result = response.text.strip().upper()
        return "DATA_QUERY" if "DATA_QUERY" in result else "GENERAL_CHAT"

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10), reraise=True)
    def generate_sql(self, query: str) -> str:
        prompt = f"""
        You are a Postgres SQL generator. Generate a safe SQL query based on the user's request.
        
        {self.db_schema}
        
        CRITICAL RULES:
        1. You MUST ONLY generate a `SELECT` statement. No updates, inserts, deletes, or drops.
        2. You MUST include a WHERE clause that filters by `user_id = :user_id`. This is absolutely mandatory.
        3. Do NOT wrap the SQL in markdown code blocks. Just return the raw SQL query.
        
        User Request: "{query}"
        """
        response = self.client.models.generate_content(
            model='gemini-3.5-flash',
            contents=prompt,
        )
        sql = response.text.strip()
        if sql.startswith("```sql"):
            sql = sql[6:]
        if sql.startswith("```"):
            sql = sql[3:]
        if sql.endswith("```"):
            sql = sql[:-3]
        return sql.strip()

    def execute_sql(self, db: Session, sql: str, user_id: str) -> List[Dict]:
        sql_upper = sql.upper()
        forbidden_keywords = ["INSERT", "UPDATE", "DELETE", "DROP", "ALTER", "TRUNCATE", "GRANT", "REVOKE", "COMMIT", "ROLLBACK"]
        
        if not sql_upper.startswith("SELECT"):
            raise ValueError("Query must start with SELECT.")
            
        for keyword in forbidden_keywords:
            if f" {keyword} " in f" {sql_upper} ":
                raise ValueError(f"Forbidden SQL keyword detected: {keyword}")
                
        if ":user_id" not in sql:
            raise ValueError("SQL query missing mandatory :user_id binding for security.")
            
        result = db.execute(text(sql).bindparams(user_id=user_id))
        
        rows = []
        for row in result.mappings():
            row_dict = {}
            for k, v in row.items():
                if isinstance(v, (int, float, str, bool)):
                    row_dict[k] = v
                else:
                    row_dict[k] = str(v)
            rows.append(row_dict)
            
        return rows

    def stream_response(self, user_query: str, history: List[ChatMessage], db_results: List[Dict] = None) -> Generator[str, None, None]:
        if not self.client:
            yield "AI service is currently unavailable."
            return

        context_str = ""
        if db_results is not None:
            context_str = f"Database Query Results:\n{json.dumps(db_results, indent=2)}\n\nInstructions: Answer the user's query based ONLY on the database results provided. You MUST cite the specific transactions (e.g. mention the merchant, date, or amount) to prove your answer. Format using beautiful Markdown."
        
        # Build history according to gemini API structure
        history_prompts = []
        # Exclude the current query from history as we will append it
        for msg in history:
            role = "user" if msg.role == "user" else "model"
            history_prompts.append({"role": role, "parts": [{"text": msg.content}]})

        prompt = f"{context_str}\nUser Query: {user_query}"
        history_prompts.append({"role": "user", "parts": [{"text": prompt}]})

        @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10), reraise=True)
        def _get_stream():
            return self.client.models.generate_content_stream(
                model='gemini-3.5-flash',
                contents=history_prompts,
            )

        try:
            response_stream = _get_stream()
            for chunk in response_stream:
                if chunk.text:
                    yield chunk.text
        except Exception as e:
            logger.error(f"Error streaming response: {e}")
            yield f"Error generating response: {str(e)}"
