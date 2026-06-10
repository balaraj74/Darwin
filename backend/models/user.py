from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional, Dict

class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class SocialLinks(BaseModel):
    """Public profile links for the founder."""
    github: Optional[str] = None
    linkedin: Optional[str] = None
    instagram: Optional[str] = None
    portfolio: Optional[str] = None
    twitter: Optional[str] = None

class UserProfile(BaseModel):
    """Extended user profile stored alongside auth credentials."""
    display_name: Optional[str] = None
    bio: Optional[str] = None
    profile_photo_b64: Optional[str] = None  # base64-encoded image stored in MongoDB
    social_links: SocialLinks = Field(default_factory=SocialLinks)
    last_crawled_at: Optional[datetime] = None

class UserInDB(BaseModel):
    id: str
    email: EmailStr
    hashed_password: str
    created_at: datetime
    profile: UserProfile = Field(default_factory=UserProfile)

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
