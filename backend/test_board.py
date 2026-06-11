import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from core.digital_twin import DigitalTwin
from services.mongodb_service import MongoDBService
from core.debate_engine import run_debate

async def main():
    db = MongoDBService()
    session = await db.get_session("a32cbcde-5e06-4f81-bffb-eb537d9d5179")
    if session.status == "failed":
        print("Session status is failed.")
    print(session.dict())

asyncio.run(main())
