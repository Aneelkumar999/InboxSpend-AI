from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime
from typing import Optional, List
from decimal import Decimal

class ExpenseBase(BaseModel):
    merchant: str
    amount: Decimal
    date: datetime
    category: Optional[str] = "Others"
    email_subject: Optional[str] = None
    sender: Optional[str] = None
    snippet: Optional[str] = None
    currency: Optional[str] = "USD"
    payment_method: Optional[str] = None
    order_id: Optional[str] = None
    invoice_number: Optional[str] = None
    items: Optional[List[dict]] = None
    tax: Optional[Decimal] = None
    discount: Optional[Decimal] = None
    is_subscription: Optional[bool] = False
    billing_cycle: Optional[str] = None
    junk_fees: Optional[Decimal] = None
    confidence_score: Optional[Decimal] = None

class ExpenseCreate(ExpenseBase):
    message_id: str

class ExpenseResponse(ExpenseBase):
    id: UUID
    user_id: UUID
    message_id: str
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class SubscriptionResponse(BaseModel):
    merchant: str
    category: str
    billing_cycle: Optional[str]
    last_amount: Decimal
    current_amount: Decimal
    price_increased: bool
    amount_difference: Decimal
    last_payment_date: datetime
    is_active: bool

class ChartData(BaseModel):
    label: str
    value: float

class DashboardResponse(BaseModel):
    today_expense: float
    weekly_expense: float
    monthly_expense: float
    total_expense: float
    highest_merchant: Optional[str] = None
    highest_category: Optional[str] = None
    avg_daily_spend: float
    monthly_growth: float
    monthly_chart: List[ChartData]
    weekly_chart: List[ChartData]
    category_pie: List[ChartData]
    merchant_chart: List[ChartData]

class FinancialInsights(BaseModel):
    summaries: List[str]
    budget_prediction: str
    abnormal_spending: List[str]
    recurring_subscriptions: List[str]
    duplicate_transactions: List[str]

class JunkFeeOffender(BaseModel):
    merchant: str
    total_fees: float

class JunkFeeResponse(BaseModel):
    total_junk_fees: float
    top_offenders: List[JunkFeeOffender]
    recent_fees: List[ExpenseResponse]

class WrappedResponse(BaseModel):
    total_spent: float
    top_merchant: str
    top_merchant_amount: float
    top_category: str
    late_night_purchases: int
    busiest_day: str
