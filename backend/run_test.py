import asyncio
from services.mongodb_service import MongoDBService
from core.debate_engine import run_debate

async def main():
    db = MongoDBService()
    twin = await db.get_twin("twin_77d993a0")
    session = await db.get_session("a32cbcde-5e06-4f81-bffb-eb537d9d5179")
    try:
        await run_debate(session, twin)
    except Exception as e:
        import traceback
        traceback.print_exc()

asyncio.run(main())
