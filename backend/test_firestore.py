import asyncio
from google.cloud import firestore

async def main():
    try:
        db = firestore.AsyncClient(project="darwinagent")
        docs = await db.collection("users").limit(1).get()
        print("Connected! Docs:", len(docs))
    except Exception as e:
        print("Error:", e)

asyncio.run(main())
