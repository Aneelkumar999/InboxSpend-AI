import httpx
from fastapi import HTTPException

def verify_google_access_token(access_token: str) -> dict:
    try:
        response = httpx.get(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            headers={"Authorization": f"Bearer {access_token}"}
        )
        if response.status_code != 200:
            raise ValueError("Invalid Google access token")
        return response.json()
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid Google access token")
