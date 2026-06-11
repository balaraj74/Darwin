import asyncio
from utils.auth import _get_firebase_app
from firebase_admin import auth

async def main():
    try:
        app = _get_firebase_app()
        print("App initialized:", app.project_id)
        # This will fail because token is fake, but we want to see the EXACT error
        await asyncio.to_thread(auth.verify_id_token, "fake_token_123")
    except Exception as e:
        print("Verification failed with:", str(e), type(e))

if __name__ == "__main__":
    asyncio.run(main())
