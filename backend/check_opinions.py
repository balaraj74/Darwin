import asyncio
from services.mongodb_service import MongoDBService

async def main():
    db = MongoDBService()
    s = await db.get_session("95a8cd78-4f23-400f-adc4-ddff3f85fc2f")
    if s:
        for i, r in enumerate(s.rounds):
            for op in r:
                print(f"Agent: {op.agent}, round: {op.round}")
            break

if __name__ == "__main__":
    asyncio.run(main())
