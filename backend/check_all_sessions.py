import asyncio
from services.mongodb_service import MongoDBService

async def main():
    db = MongoDBService()
    sessions = await db.get_sessions_for_twin("twin_77d993a0")
    for s in sessions:
        if s.decision:
            print(f"Session {s.session_id}: status={s.status}, decision={s.decision.decision}, rounds={len(s.rounds)}")
        else:
            print(f"Session {s.session_id}: status={s.status}, decision=None, rounds={len(s.rounds)}")

if __name__ == "__main__":
    asyncio.run(main())
