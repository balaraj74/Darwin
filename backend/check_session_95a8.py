import asyncio
from services.mongodb_service import MongoDBService

async def main():
    db = MongoDBService()
    s = await db.get_session("95a8cd78-4f23-400f-adc4-ddff3f85fc2f")
    if s:
        print(f"created_at: {s.created_at}")
        print(f"Decision: {s.decision.decision if s.decision else None}")
        print(f"original_idea: {s.decision.original_idea[:30] if s.decision else None}")

if __name__ == "__main__":
    asyncio.run(main())
