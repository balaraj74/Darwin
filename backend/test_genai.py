import asyncio
from google import genai
from google.genai import types
import os

async def main():
    # Use the key from .env manually for testing
    from config.env import settings
    client = genai.Client(api_key=settings.gemini_api_key)
    
    response = client.models.generate_content(
        model='gemini-3-flash-preview',
        contents="Say hello in JSON { \"message\": \"hello\" }",
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            temperature=0.2
        )
    )
    print(response.text)

asyncio.run(main())
