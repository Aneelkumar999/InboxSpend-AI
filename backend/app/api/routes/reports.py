from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks, Response
from sqlalchemy.orm import Session
from typing import Any, List
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel

from app.db.database import get_db
from app.db.models import User, ReportSchedule
from app.api.dependencies import get_current_user
from app.services.report_service import ReportService
from app.services.pdf_service import PDFService
from app.services.email_service import EmailService

router = APIRouter()

class ScheduleCreate(BaseModel):
    frequency: str
    email_to: str

class ScheduleResponse(BaseModel):
    id: str
    frequency: str
    email_to: str
    is_active: bool

def get_date_range(period: str):
    now = datetime.now()
    if period == "monthly":
        start_date = now.replace(day=1, hour=0, minute=0, second=0)
        end_date = now
        period_label = now.strftime("%B %Y")
    elif period == "yearly":
        start_date = now.replace(day=1, month=1, hour=0, minute=0, second=0)
        end_date = now
        period_label = now.strftime("%Y")
    else:
        start_date = None
        end_date = None
        period_label = "All Time"
    return start_date, end_date, period_label

@router.get("/download")
def download_report(
    format: str = Query(..., description="pdf, csv, or excel"),
    period: str = Query("monthly", description="monthly, yearly, or all"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Response:
    start_date, end_date, period_label = get_date_range(period)
    
    if format == "csv":
        report_service = ReportService(db)
        csv_bytes = report_service.generate_csv(str(current_user.id), start_date, end_date)
        return Response(
            content=csv_bytes,
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=Report_{period_label.replace(' ', '_')}.csv"}
        )
    elif format == "excel":
        report_service = ReportService(db)
        excel_bytes = report_service.generate_excel(str(current_user.id), start_date, end_date)
        return Response(
            content=excel_bytes,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename=Report_{period_label.replace(' ', '_')}.xlsx"}
        )
    elif format == "pdf":
        pdf_service = PDFService(db)
        pdf_bytes = pdf_service.generate_pdf(str(current_user.id), start_date, end_date, period_label)
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=Report_{period_label.replace(' ', '_')}.pdf"}
        )
    else:
        raise HTTPException(status_code=400, detail="Invalid format")

@router.post("/email")
def email_report(
    email_to: str = Query(...),
    period: str = Query("monthly"),
    background_tasks: BackgroundTasks = BackgroundTasks(),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    if not current_user.access_token:
        raise HTTPException(status_code=400, detail="Gmail not connected")
        
    start_date, end_date, period_label = get_date_range(period)
    
    def send_task():
        db_session = SessionLocal()
        try:
            pdf_service = PDFService(db_session)
            report_service = ReportService(db_session)
            email_service = EmailService(access_token=current_user.access_token, refresh_token=current_user.refresh_token)
            
            pdf_bytes = pdf_service.generate_pdf(str(current_user.id), start_date, end_date, period_label)
            csv_bytes = report_service.generate_csv(str(current_user.id), start_date, end_date)
            excel_bytes = report_service.generate_excel(str(current_user.id), start_date, end_date)
            
            email_service.send_report_email(email_to, pdf_bytes, csv_bytes, excel_bytes, period_label)
        finally:
            db_session.close()

    from app.db.database import SessionLocal
    background_tasks.add_task(send_task)
    return {"message": f"Report for {period_label} is being generated and emailed to {email_to}."}

@router.post("/schedule")
def create_schedule(
    schedule_data: ScheduleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    if schedule_data.frequency not in ["monthly", "yearly", "weekly"]:
        raise HTTPException(status_code=400, detail="Invalid frequency")
        
    existing = db.query(ReportSchedule).filter(
        ReportSchedule.user_id == current_user.id,
        ReportSchedule.frequency == schedule_data.frequency,
        ReportSchedule.email_to == schedule_data.email_to
    ).first()
    
    if existing:
        existing.is_active = True
        db.commit()
        return {"message": "Schedule reactivated."}
        
    new_schedule = ReportSchedule(
        user_id=current_user.id,
        frequency=schedule_data.frequency,
        email_to=schedule_data.email_to
    )
    db.add(new_schedule)
    db.commit()
    return {"message": "Schedule created."}

@router.get("/schedule")
def list_schedules(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    schedules = db.query(ReportSchedule).filter(ReportSchedule.user_id == current_user.id).all()
    return [
        {
            "id": str(s.id),
            "frequency": s.frequency,
            "email_to": s.email_to,
            "is_active": s.is_active
        }
        for s in schedules
    ]
