import base64
from email.message import EmailMessage
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from app.core.config import settings

class EmailService:
    def __init__(self, access_token: str, refresh_token: str = None):
        self.creds = Credentials(
            token=access_token,
            refresh_token=refresh_token,
            client_id=settings.GOOGLE_CLIENT_ID,
            client_secret=settings.GOOGLE_CLIENT_SECRET,
            token_uri="https://oauth2.googleapis.com/token"
        )
        self.service = build('gmail', 'v1', credentials=self.creds)
        
    def send_report_email(self, to_email: str, pdf_bytes: bytes, csv_bytes: bytes, excel_bytes: bytes, period: str):
        message = EmailMessage()
        message.set_content(f"Hello,\n\nPlease find attached your financial report for {period}.\n\nBest,\nInboxSpend AI")
        message["To"] = to_email
        message["From"] = "me"
        message["Subject"] = f"Your Financial Report - {period}"
        
        if pdf_bytes:
            message.add_attachment(
                pdf_bytes,
                maintype='application',
                subtype='pdf',
                filename=f"Report_{period}.pdf"
            )
            
        if csv_bytes:
            message.add_attachment(
                csv_bytes,
                maintype='text',
                subtype='csv',
                filename=f"Report_{period}.csv"
            )
            
        if excel_bytes:
            message.add_attachment(
                excel_bytes,
                maintype='application',
                subtype='vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                filename=f"Report_{period}.xlsx"
            )
            
        encoded_message = base64.urlsafe_b64encode(message.as_bytes()).decode()
        create_message = {'raw': encoded_message}
        
        self.service.users().messages().send(userId="me", body=create_message).execute()
        return True
