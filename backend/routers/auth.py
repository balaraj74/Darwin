from fastapi import APIRouter, HTTPException, Depends, status
import uuid
from datetime import datetime, timedelta
from typing import Optional
from models.user import UserCreate, UserLogin, Token, UserInDB
from services.mongodb_service import MongoDBService
from utils.auth import verify_password, create_access_token, get_password_hash, ACCESS_TOKEN_EXPIRE_MINUTES

router = APIRouter(prefix="/auth", tags=["auth"])
db = MongoDBService()

@router.post("/register", response_model=Token)
async def register(user: UserCreate):
    existing_user = await db.get_user_by_email(user.email)
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    hashed_password = get_password_hash(user.password)
    user_in_db = UserInDB(
        id=user_id,
        email=user.email,
        hashed_password=hashed_password,
        created_at=datetime.utcnow()
    )
    await db.save_user(user_in_db)
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user_in_db.id}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer", "user_id": user_in_db.id}

@router.post("/login", response_model=Token)
async def login(user: UserLogin):
    user_in_db = await db.get_user_by_email(user.email)
    if not user_in_db or not verify_password(user.password, user_in_db.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user_in_db.id}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer", "user_id": user_in_db.id}
