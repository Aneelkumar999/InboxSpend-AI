from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Any, Optional
from datetime import datetime, timezone, timedelta

from app.db.database import get_db
from app.db.models import User, Expense
from app.api.dependencies import get_current_user
from app.schemas.expense import ExpenseResponse, DashboardResponse, ChartData, FinancialInsights, SubscriptionResponse, JunkFeeResponse, JunkFeeOffender, WrappedResponse
from app.services.gmail_service import GmailService
from app.services.analytics_service import FinancialAnalyticsEngine

router = APIRouter()

@router.get("/", response_model=List[ExpenseResponse])
def get_expenses(
    skip: int = Query(0),
    limit: int = Query(50),
    category: Optional[str] = Query(None),
    merchant: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    sort_by: str = Query("date"),
    sort_order: str = Query("desc"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    query = db.query(Expense).filter(Expense.user_id == current_user.id)
    
    if category:
        query = query.filter(Expense.category == category)
    if merchant:
        query = query.filter(Expense.merchant.ilike(f"%{merchant}%"))
    if search:
        query = query.filter(
            (Expense.merchant.ilike(f"%{search}%")) |
            (Expense.email_subject.ilike(f"%{search}%")) |
            (Expense.category.ilike(f"%{search}%"))
        )
    if start_date:
        query = query.filter(Expense.date >= start_date)
    if end_date:
        query = query.filter(Expense.date <= end_date)
        
    if sort_by == "amount":
        query = query.order_by(Expense.amount.desc() if sort_order == "desc" else Expense.amount.asc())
    elif sort_by == "merchant":
        query = query.order_by(Expense.merchant.desc() if sort_order == "desc" else Expense.merchant.asc())
    elif sort_by == "category":
        query = query.order_by(Expense.category.desc() if sort_order == "desc" else Expense.category.asc())
    else:
        query = query.order_by(Expense.date.desc() if sort_order == "desc" else Expense.date.asc())

    return query.offset(skip).limit(limit).all()

@router.post("/sync")
def sync_expenses(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    if not current_user.access_token:
        raise HTTPException(status_code=400, detail="User has not connected Gmail properly (missing access token)")
        
    gmail_service = GmailService(
        access_token=current_user.access_token, 
        refresh_token=current_user.refresh_token
    )
    message_ids = gmail_service.fetch_message_ids(max_results=50)
    
    if not message_ids:
        return {"message": "Sync complete. 0 emails found."}
        
    existing_records = db.query(Expense.message_id).filter(
        Expense.user_id == current_user.id,
        Expense.message_id.in_(message_ids)
    ).all()
    
    existing_ids = {r[0] for r in existing_records}
    new_ids = [m for m in message_ids if m not in existing_ids]
    
    if not new_ids:
        return {"message": "Sync complete. 0 new expenses found."}
        
    extracted_expenses = gmail_service.fetch_and_parse_messages(new_ids)
    
    saved_count = 0
    for exp_create in extracted_expenses:
        # Check again just in case of race condition
        existing = db.query(Expense).filter(
            Expense.user_id == current_user.id,
            Expense.message_id == exp_create.message_id
        ).first()
        
        if not existing:
            new_exp = Expense(
                user_id=current_user.id,
                **exp_create.model_dump()
            )
            db.add(new_exp)
            saved_count += 1
            
    db.commit()
    return {"message": f"Sync complete. {saved_count} new expenses found."}

@router.get("/dashboard", response_model=DashboardResponse)
def get_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    now = datetime.now()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = today_start - timedelta(days=today_start.weekday())
    month_start = today_start.replace(day=1)
    
    prev_month_end = month_start - timedelta(days=1)
    prev_month_start = prev_month_end.replace(day=1)
    
    if now.day <= prev_month_end.day:
        prev_month_to_date = prev_month_start.replace(day=now.day, hour=now.hour, minute=now.minute)
    else:
        prev_month_to_date = prev_month_end.replace(hour=now.hour, minute=now.minute)
    
    def get_sum(start_date, end_date=None):
        query = db.query(func.sum(Expense.amount)).filter(
            Expense.user_id == current_user.id,
            Expense.date >= start_date
        )
        if end_date:
            query = query.filter(Expense.date <= end_date)
        return float(query.scalar() or 0)

    total_expense = float(db.query(func.sum(Expense.amount)).filter(
        Expense.user_id == current_user.id
    ).scalar() or 0)
    
    monthly_expense = get_sum(month_start)
    prev_monthly_expense = get_sum(prev_month_start, prev_month_to_date)
    
    monthly_growth = 0.0
    if prev_monthly_expense > 0:
        monthly_growth = ((monthly_expense - prev_monthly_expense) / prev_monthly_expense) * 100

    highest_merchant_row = db.query(
        Expense.merchant, func.sum(Expense.amount).label("total")
    ).filter(Expense.user_id == current_user.id).group_by(Expense.merchant).order_by(func.sum(Expense.amount).desc()).first()
    highest_merchant = highest_merchant_row[0] if highest_merchant_row else None
    
    highest_category_row = db.query(
        Expense.category, func.sum(Expense.amount).label("total")
    ).filter(Expense.user_id == current_user.id).group_by(Expense.category).order_by(func.sum(Expense.amount).desc()).first()
    highest_category = highest_category_row[0] if highest_category_row else None

    first_expense = db.query(Expense).filter(Expense.user_id == current_user.id).order_by(Expense.date.asc()).first()
    avg_daily_spend = 0.0
    if first_expense and total_expense > 0:
        days_diff = (now - first_expense.date).days
        days_diff = max(days_diff, 1)
        avg_daily_spend = total_expense / days_diff

    six_months_ago = now - timedelta(days=180)
    monthly_chart_rows = db.query(
        func.to_char(Expense.date, 'Mon YY').label('month_label'),
        func.date_trunc('month', Expense.date).label('month'),
        func.sum(Expense.amount).label('total')
    ).filter(
        Expense.user_id == current_user.id,
        Expense.date >= six_months_ago.replace(day=1)
    ).group_by('month_label', 'month').order_by('month').all()
    monthly_chart = [ChartData(label=row[0], value=float(row[2])) for row in monthly_chart_rows]

    four_weeks_ago = week_start - timedelta(weeks=3)
    weekly_chart_rows = db.query(
        func.date_trunc('week', Expense.date).label('week'),
        func.sum(Expense.amount).label('total')
    ).filter(
        Expense.user_id == current_user.id,
        Expense.date >= four_weeks_ago
    ).group_by('week').order_by('week').all()
    weekly_chart = [ChartData(label=row[0].strftime('%b %d'), value=float(row[1])) for row in weekly_chart_rows]

    category_pie_rows = db.query(
        Expense.category, func.sum(Expense.amount).label('total')
    ).filter(Expense.user_id == current_user.id).group_by(Expense.category).all()
    category_pie = [ChartData(label=row[0] or "Others", value=float(row[1])) for row in category_pie_rows]

    merchant_chart_rows = db.query(
        Expense.merchant, func.sum(Expense.amount).label('total')
    ).filter(Expense.user_id == current_user.id).group_by(Expense.merchant).order_by(func.sum(Expense.amount).desc()).limit(5).all()
    merchant_chart = [ChartData(label=row[0], value=float(row[1])) for row in merchant_chart_rows]

    return {
        "today_expense": get_sum(today_start),
        "weekly_expense": get_sum(week_start),
        "monthly_expense": monthly_expense,
        "total_expense": total_expense,
        "highest_merchant": highest_merchant,
        "highest_category": highest_category,
        "avg_daily_spend": avg_daily_spend,
        "monthly_growth": monthly_growth,
        "monthly_chart": monthly_chart,
        "weekly_chart": weekly_chart,
        "category_pie": category_pie,
        "merchant_chart": merchant_chart
    }

@router.get("/subscriptions", response_model=List[SubscriptionResponse])
def get_subscriptions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    subs = db.query(Expense).filter(
        Expense.user_id == current_user.id,
        Expense.is_subscription == True
    ).order_by(Expense.date.desc()).all()
    
    grouped = {}
    for sub in subs:
        if sub.merchant not in grouped:
            grouped[sub.merchant] = []
        grouped[sub.merchant].append(sub)
        
    responses = []
    now = datetime.now(timezone.utc)
    for merchant, merchant_subs in grouped.items():
        latest = merchant_subs[0]
        
        is_active = False
        latest_date = latest.date
        if latest_date.tzinfo is None:
             latest_date = latest_date.replace(tzinfo=timezone.utc)
             
        if (now - latest_date).days <= 65:
             is_active = True
             
        current_amount = latest.amount
        last_amount = current_amount
        price_increased = False
        amount_difference = 0
        
        if len(merchant_subs) > 1:
            previous = merchant_subs[1]
            last_amount = previous.amount
            if current_amount > last_amount:
                price_increased = True
                amount_difference = current_amount - last_amount
                
        responses.append(
            SubscriptionResponse(
                merchant=merchant,
                category=latest.category or "Others",
                billing_cycle=latest.billing_cycle,
                last_amount=last_amount,
                current_amount=current_amount,
                price_increased=price_increased,
                amount_difference=amount_difference,
                last_payment_date=latest.date,
                is_active=is_active
            )
        )
        
    return responses

@router.get("/junk-fees", response_model=JunkFeeResponse)
def get_junk_fees(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    # Get all expenses with junk fees
    fees_expenses = db.query(Expense).filter(
        Expense.user_id == current_user.id,
        Expense.junk_fees > 0
    ).order_by(Expense.date.desc()).all()
    
    total_fees = sum(exp.junk_fees for exp in fees_expenses) if fees_expenses else 0.0
    
    # Group by merchant
    grouped = {}
    for exp in fees_expenses:
        grouped[exp.merchant] = grouped.get(exp.merchant, 0.0) + float(exp.junk_fees)
        
    offenders = [JunkFeeOffender(merchant=m, total_fees=f) for m, f in grouped.items()]
    offenders.sort(key=lambda x: x.total_fees, reverse=True)
    
    return JunkFeeResponse(
        total_junk_fees=float(total_fees),
        top_offenders=offenders[:10], # Top 10 worst offenders
        recent_fees=fees_expenses[:20] # Last 20 instances
    )

@router.get("/wrapped", response_model=WrappedResponse)
def get_wrapped(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    # 1. Total Spent
    total_spent = db.query(func.sum(Expense.amount)).filter(Expense.user_id == current_user.id).scalar() or 0.0

    # 2. Top Merchant
    top_merchant_row = db.query(
        Expense.merchant, func.sum(Expense.amount).label("total")
    ).filter(Expense.user_id == current_user.id).group_by(Expense.merchant).order_by(func.sum(Expense.amount).desc()).first()
    
    top_merchant = top_merchant_row[0] if top_merchant_row else "Unknown"
    top_merchant_amount = float(top_merchant_row[1]) if top_merchant_row else 0.0

    # 3. Top Category
    top_category_row = db.query(
        Expense.category, func.sum(Expense.amount).label("total")
    ).filter(Expense.user_id == current_user.id).group_by(Expense.category).order_by(func.sum(Expense.amount).desc()).first()
    
    top_category = top_category_row[0] if top_category_row else "Unknown"

    # 4. Late Night Purchases (Midnight to 5 AM)
    # Note: Extracting hour depends on the timezone of the DB. We'll use simple extraction.
    late_night_count = db.query(func.count(Expense.id)).filter(
        Expense.user_id == current_user.id,
        func.extract('hour', Expense.date) >= 0,
        func.extract('hour', Expense.date) <= 5
    ).scalar() or 0

    # 5. Busiest Day of Week
    busiest_day_row = db.query(
        func.extract('isodow', Expense.date).label("dow"), func.count(Expense.id).label("count")
    ).filter(Expense.user_id == current_user.id).group_by("dow").order_by(func.count(Expense.id).desc()).first()
    
    days_map = {1: "Monday", 2: "Tuesday", 3: "Wednesday", 4: "Thursday", 5: "Friday", 6: "Saturday", 7: "Sunday"}
    busiest_day = days_map.get(int(busiest_day_row[0]), "Unknown") if busiest_day_row and busiest_day_row[0] else "Unknown"

    return WrappedResponse(
        total_spent=float(total_spent),
        top_merchant=top_merchant,
        top_merchant_amount=top_merchant_amount,
        top_category=top_category,
        late_night_purchases=late_night_count,
        busiest_day=busiest_day
    )

@router.get("/insights", response_model=FinancialInsights)
def get_insights(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    engine = FinancialAnalyticsEngine()
    return engine.generate_insights(db, str(current_user.id))

