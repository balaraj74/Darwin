import asyncio
from services.firestore_service import FirestoreService
from core.debate_engine import run_debate
from models.board import BoardSession
import uuid
from datetime import datetime, timezone

async def test():
    db = FirestoreService()
    docs = await db._run(db._col("twins").limit(1).get)
    if not docs:
        print("No twins found")
        return
    twin_id = docs[0].id
    twin = await db.get_twin(twin_id)
    print(f"Testing with Twin: {twin.twin_id}")
    
    session = BoardSession(
        session_id=str(uuid.uuid4()),
        twin_id=twin.twin_id,
        status="debating",
        created_at=datetime.now(timezone.utc).isoformat(),
    )
    
    try:
        session = await run_debate(session, twin)
        print("SUCCESS!")
    except Exception as e:
        import traceback
        traceback.print_exc()

asyncio.run(test())
