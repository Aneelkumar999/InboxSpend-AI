import os
import json
from dotenv import load_dotenv

load_dotenv()

from app.db.database import SessionLocal
from app.db.models import User
from app.services.chat_service import AIChatEngine

print("Starting script...", flush=True)

db = SessionLocal()
user = db.query(User).first()

if not user:
    print("No user found.", flush=True)
else:
    print("User found. Init engine...", flush=True)
    engine = AIChatEngine()
    print("Engine init done.", flush=True)
    
    query = "How much did I spend on Uber?"
    
    print("Calling detect_intent...", flush=True)
    intent = engine.detect_intent(query)
    print(f"Intent detected: {intent}", flush=True)
    
    if intent == "DATA_QUERY":
        print("Calling generate_sql...", flush=True)
        sql = engine.generate_sql(query)
        print(f"Generated SQL: {sql}", flush=True)
        
        try:
            print("Executing SQL...", flush=True)
            results = engine.execute_sql(db, sql, str(user.id))
            print(f"Execution Results: {json.dumps(results, indent=2)}")
            
            print("AI Response:")
            for chunk in engine.stream_response(query, [], results):
                print(chunk, end="", flush=True)
            print()
            
        except Exception as e:
            print(f"Error executing: {e}")
