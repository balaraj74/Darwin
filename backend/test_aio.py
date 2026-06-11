import asyncio
from google import genai
from config.env import settings

async def main():
    client = genai.Client(api_key=settings.gemini_api_key)
    response = await client.aio.models.generate_content(
        model='gemini-2.5-flash',
        contents='test'
    )
    print(response.text)

asyncio.run(main())
