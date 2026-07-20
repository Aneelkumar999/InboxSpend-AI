import re
from datetime import datetime, timezone
import base64
import html
import logging
import concurrent.futures
from typing import List
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from app.core.config import settings
from app.schemas.expense import ExpenseCreate
from app.services.ai_service import AIParsingService

logger = logging.getLogger(__name__)

# Generic regex patterns for MVP (Fallback)
AMOUNT_REGEX = re.compile(r'([₹$£€]|Rs\.?|INR)\s*(\d+(?:,\d{3})*(?:\.\d{2})?)', re.IGNORECASE)
MERCHANT_REGEX = re.compile(r'(?:from|to)\s+([A-Za-z0-9\s]+?)\s*(?:on|for|amount|\$|via|using)', re.IGNORECASE)

class GmailService:
    def __init__(self, access_token: str, refresh_token: str = None):
        self.creds = Credentials(
            token=access_token,
            refresh_token=refresh_token,
            client_id=settings.GOOGLE_CLIENT_ID,
            client_secret=settings.GOOGLE_CLIENT_SECRET,
            token_uri="https://oauth2.googleapis.com/token"
        )
        self.service = build('gmail', 'v1', credentials=self.creds)
        self.ai_service = AIParsingService()
        
    def fetch_message_ids(self, max_results: int = 15) -> List[str]:
        query = (
            "(subject:receipt OR subject:payment OR subject:invoice OR subject:order) "
            "OR (from:phonepe OR from:paytm OR from:googlepay OR subject:\"paid Rs\" "
            "OR subject:\"sent Rs\" OR subject:\"UPI\")"
        )
        try:
            results = self.service.users().messages().list(userId='me', q=query, maxResults=max_results).execute()
            messages = results.get('messages', [])
            return [msg['id'] for msg in messages]
        except Exception as e:
            logger.error(f"Error fetching message IDs: {e}")
            return []
            
    def fetch_and_parse_messages(self, message_ids: List[str]) -> List[ExpenseCreate]:
        expenses = []
        # Use ThreadPoolExecutor to run tasks concurrently
        with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
            # Submit all process tasks to executor
            future_to_msg_id = {executor.submit(self._process_message, msg_id): msg_id for msg_id in message_ids}
            for future in concurrent.futures.as_completed(future_to_msg_id):
                try:
                    expense = future.result()
                    if expense:
                        expenses.append(expense)
                except Exception as e:
                    logger.error(f"Error processing message concurrently: {e}")
        return expenses

    def fetch_recent_receipts(self, max_results: int = 20) -> List[ExpenseCreate]:
        """Legacy compatibility method"""
        message_ids = self.fetch_message_ids(max_results)
        return self.fetch_and_parse_messages(message_ids)

    def _classify_category(self, text: str) -> str:
        text = text.lower()
        categories = {
            "Food": ["zomato", "swiggy", "uber eats", "restaurant", "mcdonalds", "starbucks", "dominos", "pizza", "food", "cafe", "doordash"],
            "Shopping": ["amazon", "flipkart", "myntra", "casekaro", "order", "shopee", "ebay", "walmart", "target", "apparel", "clothing", "store", "buy", "payu"],
            "Travel": ["uber", "ola", "makemytrip", "flight", "train", "irctc", "hotel", "airbnb", "booking.com", "taxi", "bus", "redbus"],
            "Bills": ["electricity", "water", "broadband", "internet", "utility", "mobile recharge", "jio", "airtel", "vi", "bill"],
            "Subscriptions": ["netflix", "prime", "spotify", "youtube premium", "hotstar", "subscription", "membership", "google one", "chatgpt"],
            "Education": ["udemy", "coursera", "school", "college", "tuition", "course", "unacademy", "byjus"],
            "Healthcare": ["pharmacy", "hospital", "clinic", "medplus", "apollo", "1mg", "health", "doctor"],
            "Entertainment": ["bookmyshow", "movie", "cinema", "ticket", "event", "game", "google play", "steam", "playstation"],
        }
        
        for category, keywords in categories.items():
            for keyword in keywords:
                if keyword in text:
                    return category
        
        return "Others"

    def _process_message(self, msg_id: str) -> ExpenseCreate | None:
        try:
            service = build('gmail', 'v1', credentials=self.creds)
            message = service.users().messages().get(userId='me', id=msg_id, format='full').execute()
            
            payload = message.get('payload', {})
            headers = payload.get('headers', [])
            
            subject = ""
            sender = ""
            date_str = ""
            
            for header in headers:
                name = header['name'].lower()
                if name == 'subject':
                    subject = header['value']
                elif name == 'from':
                    sender = header['value']
                elif name == 'date':
                    date_str = header['value']
                    
            try:
                from email.utils import parsedate_to_datetime
                msg_date = parsedate_to_datetime(date_str)
            except Exception:
                msg_date = datetime.now()
                
            snippet = message.get('snippet', '')
            body = self._get_body(payload)
            full_text = f"{subject} {snippet} {body}"
            
            # --- PHASE 3: AI PARSING ---
            try:
                ai_receipt = self.ai_service.parse_receipt(full_text)
                
                # Check confidence score
                if ai_receipt.confidence_score >= 0.6:
                    return ExpenseCreate(
                        message_id=msg_id,
                        merchant=ai_receipt.merchant[:255] if ai_receipt.merchant else "Unknown",
                        amount=ai_receipt.amount,
                        date=msg_date,
                        category=ai_receipt.category,
                        email_subject=subject[:255],
                        sender=sender[:255],
                        snippet=snippet[:255],
                        currency=ai_receipt.currency,
                        payment_method=ai_receipt.payment_method,
                        order_id=ai_receipt.order_id,
                        invoice_number=ai_receipt.invoice_number,
                        items=[item.model_dump() for item in ai_receipt.items] if ai_receipt.items else None,
                        tax=ai_receipt.tax,
                        discount=ai_receipt.discount,
                        is_subscription=ai_receipt.is_subscription,
                        billing_cycle=ai_receipt.billing_cycle,
                        confidence_score=ai_receipt.confidence_score
                    )
                else:
                    logger.warning(f"AI returned low confidence ({ai_receipt.confidence_score}) for {msg_id}. Falling back to Regex.")
            except Exception as e:
                logger.error(f"AI parsing failed for {msg_id}: {e}. Falling back to Regex.")
                
            # --- FALLBACK: REGEX PARSING ---
            amount_match = AMOUNT_REGEX.search(full_text)
            if amount_match:
                currency = amount_match.group(1).strip()
                amount = float(amount_match.group(2).replace(',', ''))
                if currency == '$':
                    amount *= 83.0  # Basic conversion rate for MVP
            else:
                amount = None
            
            merchant_match = MERCHANT_REGEX.search(full_text)
            merchant = merchant_match.group(1).strip() if merchant_match else None
            
            if not merchant:
                merchant = sender.split('<')[0].strip() if '<' in sender else sender

            category = self._classify_category(full_text)

            if amount:
                return ExpenseCreate(
                    message_id=msg_id,
                    merchant=merchant[:255],
                    amount=amount,
                    date=msg_date,
                    category=category,
                    email_subject=subject[:255],
                    sender=sender[:255],
                    snippet=snippet[:255],
                    currency="INR", # Fallback default
                    confidence_score=0.1 # Low confidence for fallback
                )
            return None
        except Exception as e:
            logger.error(f"Error processing message {msg_id}: {e}")
            return None

    def _decode_data(self, data: str) -> str:
        if not data:
            return ""
        data += "=" * (-len(data) % 4)
        return base64.urlsafe_b64decode(data).decode('utf-8', errors='ignore')

    def _get_body(self, payload: dict) -> str:
        body = ""
        if 'parts' in payload:
            for part in payload['parts']:
                mime_type = part.get('mimeType')
                if mime_type == 'text/plain':
                    data = part['body'].get('data')
                    body += self._decode_data(data)
                elif mime_type == 'text/html':
                    data = part['body'].get('data')
                    html_text = self._decode_data(data)
                    body += re.sub(r'<[^>]+>', ' ', html_text)
                elif 'parts' in part:
                    body += self._get_body(part)
        else:
            data = payload.get('body', {}).get('data')
            text = self._decode_data(data)
            if payload.get('mimeType') == 'text/html':
                text = re.sub(r'<[^>]+>', ' ', text)
            body += text
            
        return html.unescape(body)
