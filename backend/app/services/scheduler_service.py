import logging
from datetime import datetime, timedelta
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from sqlalchemy.orm import Session
from app.db.database import SessionLocal
from app.db.models import ReportSchedule, User
from app.services.pdf_service import PDFService
from app.services.report_service import ReportService
from app.services.email_service import EmailService

logger = logging.getLogger(__name__)

class SchedulerService:
    def __init__(self):
        self.scheduler = BackgroundScheduler()

    def start(self):
        # Run daily at 8:00 AM to check if we need to send reports
        self.scheduler.add_job(
            self.process_scheduled_reports,
            CronTrigger(hour=8, minute=0),
            id='process_scheduled_reports',
            replace_existing=True
        )
        self.scheduler.start()
        logger.info("Scheduler started.")

    def stop(self):
        self.scheduler.shutdown()
        logger.info("Scheduler stopped.")

    def process_scheduled_reports(self):
        db: Session = SessionLocal()
        try:
            now = datetime.now()
            schedules = db.query(ReportSchedule).filter(ReportSchedule.is_active == True).all()
            
            for schedule in schedules:
                user = db.query(User).filter(User.id == schedule.user_id).first()
                if not user or not user.access_token:
                    continue
                    
                # Determine if we should send today based on frequency
                send_today = False
                period_label = ""
                start_date = None
                end_date = None
                
                if schedule.frequency == "monthly" and now.day == 1:
                    send_today = True
                    # Previous month
                    end_date = now.replace(day=1, hour=0, minute=0, second=0) - timedelta(seconds=1)
                    start_date = end_date.replace(day=1)
                    period_label = start_date.strftime("%B %Y")
                elif schedule.frequency == "yearly" and now.day == 1 and now.month == 1:
                    send_today = True
                    # Previous year
                    end_date = now.replace(day=1, month=1, hour=0, minute=0, second=0) - timedelta(seconds=1)
                    start_date = end_date.replace(day=1, month=1)
                    period_label = start_date.strftime("%Y")
                elif schedule.frequency == "weekly" and now.weekday() == 0:
                    send_today = True
                    # Previous week
                    end_date = now.replace(hour=0, minute=0, second=0) - timedelta(seconds=1)
                    start_date = end_date - timedelta(days=6)
                    period_label = f"Week of {start_date.strftime('%B %d, %Y')}"
                    
                if send_today:
                    self._send_report(db, user, schedule.email_to, start_date, end_date, period_label)
                    
        except Exception as e:
            logger.error(f"Error processing scheduled reports: {e}")
        finally:
            db.close()

    def _send_report(self, db: Session, user: User, to_email: str, start_date, end_date, period_label):
        pdf_service = PDFService(db)
        report_service = ReportService(db)
        email_service = EmailService(access_token=user.access_token, refresh_token=user.refresh_token)
        
        pdf_bytes = pdf_service.generate_pdf(str(user.id), start_date, end_date, period_label)
        csv_bytes = report_service.generate_csv(str(user.id), start_date, end_date)
        excel_bytes = report_service.generate_excel(str(user.id), start_date, end_date)
        
        email_service.send_report_email(to_email, pdf_bytes, csv_bytes, excel_bytes, period_label)
        logger.info(f"Sent {period_label} report to {to_email}")

scheduler_service = SchedulerService()
