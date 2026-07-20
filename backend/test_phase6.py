import os
import sys
from app.db.database import SessionLocal
from app.db.models import User
from app.services.pdf_service import PDFService
from app.services.report_service import ReportService

def test():
    db = SessionLocal()
    user = db.query(User).first()
    if not user:
        print("No user found")
        return
        
    print(f"Testing for user: {user.email}")
    
    print("1. Testing ReportService (CSV)")
    report_service = ReportService(db)
    csv_bytes = report_service.generate_csv(str(user.id))
    print(f"CSV generated: {len(csv_bytes)} bytes")
    
    print("2. Testing ReportService (Excel)")
    excel_bytes = report_service.generate_excel(str(user.id))
    print(f"Excel generated: {len(excel_bytes)} bytes")
    
    print("3. Testing PDFService")
    pdf_service = PDFService(db)
    pdf_bytes = pdf_service.generate_pdf(str(user.id))
    print(f"PDF generated: {len(pdf_bytes)} bytes")
    
    print("Testing complete.")

if __name__ == "__main__":
    test()
