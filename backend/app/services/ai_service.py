import os
import json
import logging
from dotenv import load_dotenv
from typing import Optional, List
from pydantic import BaseModel, Field
# pyrefly: ignore [missing-import]
from tenacity import retry, stop_after_attempt, wait_exponential

try:
    from google import genai
    # pyrefly: ignore [missing-import]
    from google.genai import types
except ImportError:
    genai = None
    types = None

logger = logging.getLogger(__name__)

def default_quantity() -> int: return 1
def default_currency() -> str: return "USD"
def default_false() -> bool: return False
def default_confidence() -> float: return 1.0

class ParsedItem(BaseModel):
    name: str = Field(description="Name of the item purchased")
    price: float = Field(description="Price of the item")
    quantity: Optional[int] = Field(default_factory=default_quantity, description="Quantity purchased")

class ParsedReceipt(BaseModel):
    merchant: str = Field(description="Name of the merchant or store")
    amount: float = Field(description="Total amount of the receipt or invoice")
    category: str = Field(description="Category of the expense (e.g., Food, Shopping, Travel, Bills, Subscriptions, Education, Healthcare, Entertainment, Others)")
    currency: Optional[str] = Field(default_factory=default_currency, description="Currency code (e.g., USD, INR, EUR)")
    payment_method: Optional[str] = Field(default=None, description="Payment method used (e.g., Credit Card, UPI, PayPal, Cash)")
    order_id: Optional[str] = Field(default=None, description="Order ID or transaction ID")
    invoice_number: Optional[str] = Field(default=None, description="Invoice number if available")
    items: Optional[List[ParsedItem]] = Field(default=None, description="List of individual items purchased")
    tax: Optional[float] = Field(default=None, description="Total tax amount")
    discount: Optional[float] = Field(default=None, description="Total discount amount")
    is_subscription: Optional[bool] = Field(default_factory=default_false, description="True if this looks like a recurring subscription payment")
    billing_cycle: Optional[str] = Field(default=None, description="Billing cycle if this is a subscription (e.g. Monthly, Annual, Weekly)")
    confidence_score: Optional[float] = Field(default_factory=default_confidence, description="Your confidence score in the extraction accuracy from 0.0 to 1.0")

class AIParsingService:
    def __init__(self):
        load_dotenv()
        self.api_key = os.environ.get("GEMINI_API_KEY")
        if not self.api_key:
            logger.warning("GEMINI_API_KEY is not set. AI parsing will fail.")
        if genai:
            self.client = genai.Client(api_key=self.api_key)
        else:
            self.client = None
        
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        reraise=True
    )
    def parse_receipt(self, email_text: str) -> ParsedReceipt:
        if not self.client or not self.api_key:
            raise ValueError("Gemini client not initialized or API key missing.")
            
        prompt = f"""
        You are an expert financial data extraction system. Your task is to extract structured receipt and invoice data from raw email text.
        
        Extract the following information and output it EXACTLY as requested by the JSON schema:
        - merchant: Name of the seller
        - amount: Total numerical amount (do not include currency symbols in the number, e.g. 10.50)
        - category: Classify as Food, Shopping, Travel, Bills, Subscriptions, Education, Healthcare, Entertainment, or Others
        - currency: Currency code (e.g. INR, USD)
        - payment_method: Credit Card, UPI, PayPal, etc.
        - order_id: Any order ID
        - invoice_number: Any invoice number
        - items: A list of the specific items bought, with their price and quantity
        - tax: Total tax
        - discount: Total discount
        - is_subscription: True if recurring payment
        - billing_cycle: If is_subscription is True, the billing cycle (Monthly, Annual, Weekly). Null otherwise.
        - confidence_score: A number from 0.0 to 1.0 evaluating how confident you are in the accuracy.
        
        Raw Email Text:
        ---
        {email_text}
        ---
        """
        
        try:
            response = self.client.models.generate_content(
                model='gemini-3.5-flash',
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=ParsedReceipt,
                    temperature=0.0
                ),
            )
            
            data = json.loads(response.text)
            return ParsedReceipt(**data)
            
        except Exception as e:
            logger.error(f"Error parsing receipt with AI: {e}")
            raise e
