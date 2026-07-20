import pandas as pd
from typing import List, Optional
from sqlalchemy.orm import Session
from app.db.models import Expense
import io

class ReportService:
    def __init__(self, db: Session):
        self.db = db

    def get_expenses_df(self, user_id: str, start_date=None, end_date=None) -> pd.DataFrame:
        query = self.db.query(Expense).filter(Expense.user_id == user_id)
        if start_date:
            query = query.filter(Expense.date >= start_date)
        if end_date:
            query = query.filter(Expense.date <= end_date)
            
        expenses = query.all()
        
        data = []
        for e in expenses:
            data.append({
                "Date": e.date.strftime("%Y-%m-%d"),
                "Merchant": e.merchant,
                "Amount": float(e.amount),
                "Category": e.category,
                "Currency": e.currency,
                "Payment Method": e.payment_method,
                "Is Subscription": e.is_subscription
            })
            
        df = pd.DataFrame(data)
        if not df.empty:
            df['Date'] = pd.to_datetime(df['Date'])
            df = df.sort_values(by='Date', ascending=False)
        return df

    def generate_csv(self, user_id: str, start_date=None, end_date=None) -> bytes:
        df = self.get_expenses_df(user_id, start_date, end_date)
        if df.empty:
            return b"Date,Merchant,Amount,Category,Currency,Payment Method,Is Subscription\n"
        return df.to_csv(index=False).encode('utf-8')

    def generate_excel(self, user_id: str, start_date=None, end_date=None) -> bytes:
        df = self.get_expenses_df(user_id, start_date, end_date)
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            if df.empty:
                pd.DataFrame(columns=["Date", "Merchant", "Amount", "Category", "Currency", "Payment Method", "Is Subscription"]).to_excel(writer, index=False, sheet_name='Expenses')
            else:
                df.to_excel(writer, index=False, sheet_name='Expenses')
                
                # Create Summary Sheet
                summary_df = df.groupby('Category')['Amount'].sum().reset_index()
                summary_df.to_excel(writer, index=False, sheet_name='Category Summary')
                
        return output.getvalue()
