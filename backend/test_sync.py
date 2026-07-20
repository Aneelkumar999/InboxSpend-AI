import os
from dotenv import load_dotenv

load_dotenv()

from app.db.database import SessionLocal
from app.db.models import User
from app.services.gmail_service import GmailService

db = SessionLocal()
user = db.query(User).filter(User.access_token.isnot(None)).first()

if not user:
    print("No user with access token found.")
else:
    print(f"Testing sync for user: {user.email}")
    service = GmailService(access_token=user.access_token, refresh_token=user.refresh_token)
    
    # Just fetch 5 messages for a quick test
    msg_ids = service.fetch_message_ids(max_results=5)
    print(f"Found {len(msg_ids)} messages to test.")
    
    if msg_ids:
        expenses = service.fetch_and_parse_messages(msg_ids)
        print(f"Successfully processed {len(expenses)} expenses concurrently.")
