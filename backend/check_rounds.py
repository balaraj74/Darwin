import asyncio
import json
from services.mongodb_service import MongoDBService

async def main():
    db = MongoDBService()
    session = await db.get_session("95a8cd78-4f23-400f-adc4-ddff3f85fc2f")
    if session:
        print(f"Rounds count: {len(session.rounds)}")
        for i, r in enumerate(session.rounds):
            print(f"Round {i+1} has {len(r)} opinions.")

if __name__ == "__main__":
    asyncio.run(main())
