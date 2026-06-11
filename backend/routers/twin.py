"""
Module: twin.py
Description: Twin router — fetch, update, and submit startup idea for Founder Twin.

Author:  KAIRON / Founder Twin
Created: 2025-06-09
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from models.founder import DigitalTwin
from services.firestore_service import FirestoreService
from utils.logger import get_logger

logger = get_logger(__name__)
router = APIRouter(prefix="/twin", tags=["twin"])
db = FirestoreService()

class UpdateTwinRequest(BaseModel):
    # For now, allow manual updates to critical hard constraints
    budget_inr: int | None = None
    technical_skills: list[str] | None = None

class StartupIdeaRequest(BaseModel):
    startup_idea: str

@router.get("/by-user/{user_id}", response_model=DigitalTwin)
async def get_twin_by_user(user_id: str) -> DigitalTwin:
    twin = await db.get_twin_by_user(user_id)
    if not twin:
        raise HTTPException(status_code=404, detail="No twin found for user")
    return twin

@router.get("/{twin_id}", response_model=DigitalTwin)
async def get_twin(twin_id: str) -> DigitalTwin:
    twin = await db.get_twin(twin_id)
    if not twin:
        raise HTTPException(status_code=404, detail="Twin not found")
    return twin

@router.patch("/{twin_id}", response_model=DigitalTwin)
async def update_twin(twin_id: str, req: UpdateTwinRequest) -> DigitalTwin:
    twin = await db.get_twin(twin_id)
    if not twin:
        raise HTTPException(status_code=404, detail="Twin not found")
    
    if req.budget_inr is not None:
        twin.profile.hard_constraints.budget_inr = req.budget_inr
    if req.technical_skills is not None:
        twin.profile.hard_constraints.technical_skills = req.technical_skills
        
    await db.save_twin(twin)
    return twin

@router.post("/{twin_id}/idea", response_model=DigitalTwin)
async def submit_idea(twin_id: str, req: StartupIdeaRequest) -> DigitalTwin:
    twin = await db.get_twin(twin_id)
    if not twin:
        raise HTTPException(status_code=404, detail="Twin not found")
    
    twin.startup_idea = req.startup_idea
    await db.save_twin(twin)
    return twin
