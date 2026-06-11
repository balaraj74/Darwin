from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional


class SocialLinks(BaseModel):
    """Public profile links for the founder."""
    github: Optional[str] = None
    linkedin: Optional[str] = None
    instagram: Optional[str] = None
    portfolio: Optional[str] = None
    twitter: Optional[str] = None


class UserProfile(BaseModel):
    """Extended user profile stored alongside Firebase Auth identity."""
    display_name: Optional[str] = None
    bio: Optional[str] = None
    photo_url: Optional[str] = None           # Firebase Storage URL (replaces base64)
    social_links: SocialLinks = Field(default_factory=SocialLinks)
    gitlab_token: Optional[str] = None
    gitlab_namespace: Optional[str] = None
    last_crawled_at: Optional[datetime] = None


class UserInDB(BaseModel):
    """User record stored in Firestore. Firebase Auth manages password/identity."""
    id: str                                   # Firebase UID
    email: EmailStr
    created_at: datetime
    profile: UserProfile = Field(default_factory=UserProfile)


class UserRegisterRequest(BaseModel):
    """Body for /auth/register — client sends Firebase ID token after sign-up."""
    id_token: str
    display_name: Optional[str] = None


class UserLoginRequest(BaseModel):
    """Body for /auth/login — client sends Firebase ID token after sign-in."""
    id_token: str


class AuthResponse(BaseModel):
    """Returned after successful auth — frontend uses Firebase token directly."""
    user_id: str
    email: str
    display_name: Optional[str] = None
    photo_url: Optional[str] = None
    is_new_user: bool = False
