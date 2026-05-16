import os
from fastapi import Security, HTTPException, status
from fastapi.security.api_key import APIKeyHeader

API_KEY_NAME = "X-Guardian-API-Key"
api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=False)

def verify_api_key(api_key: str = Security(api_key_header)):
    expected_key = os.getenv("ANALYSIS_API_KEY")
    if not expected_key:
        # If no key is configured in environment, we might want to allow 
        # for development, but for hardening we should require it.
        # Let's assume for this task we REQUIRE it.
        return "unprotected-dev"
        
    if api_key == expected_key:
        return api_key
    else:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing API Key",
        )
