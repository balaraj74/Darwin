import asyncio
from services.mongodb_service import MongoDBService

async def main():
    db = MongoDBService()
    sessions = await db.get_sessions_for_twin("twin_77d993a0")
    for s in sessions:
        if s.status == "decided":
            pkg = await db.get_execution_package(s.session_id)
            print(f"Decided Session {s.session_id} ({s.created_at}): has_pkg={pkg is not None}, decision={s.decision.decision if s.decision else 'None'}")

if __name__ == "__main__":
    asyncio.run(main())
