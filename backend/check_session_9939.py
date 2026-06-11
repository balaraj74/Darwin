import asyncio
from services.mongodb_service import MongoDBService

async def main():
    db = MongoDBService()
    s = await db.get_session("9939a883-5b85-4f0b-acf9-ea2e2aea3365")
    if s:
        print(f"Status: {s.status}")
        print(f"Decision: {s.decision}")
        print(f"Rounds: {len(s.rounds)}")
        for i, r in enumerate(s.rounds):
            print(f"Round {i+1}: {len(r)}")

if __name__ == "__main__":
    asyncio.run(main())
