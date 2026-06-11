import asyncio
from google.cloud import firestore
import os

os.environ["GOOGLE_CLOUD_PROJECT"] = "darwinagent"
async def main():
    try:
        db = firestore.AsyncClient(project="darwinagent", database="(default)")
        docs = await db.collection("users").limit(1).get()
        print("Connected! Docs:", len(docs))
    except Exception as e:
        print("Error:", e)

asyncio.run(main())
