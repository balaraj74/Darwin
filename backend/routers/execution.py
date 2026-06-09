"""
Module: execution.py
Description: Execution router — triggers all 5 output generation from a decided session.

Author:  KAIRON / Founder Twin
Created: 2025-06-09
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Optional
from models.execution import ExecutionPackage
from core.execution_engine import run_execution_engine
from core.engineering_engine import run_engineering_team
from services.mongodb_service import MongoDBService
from utils.logger import get_logger
from utils.errors import ExecutionError

logger = get_logger(__name__)
router = APIRouter(prefix="/execution", tags=["execution"])
db = MongoDBService()


class RunExecutionRequest(BaseModel):
    session_id: str
    gitlab_token: Optional[str] = None
    gitlab_namespace: Optional[str] = None


@router.post("/run", response_model=ExecutionPackage)
async def run_execution(request: RunExecutionRequest, background_tasks: BackgroundTasks) -> ExecutionPackage:
    """
    Generate all execution outputs for a decided board session.

    Args:
        request: session_id plus optional GitLab credentials.
        background_tasks: FastAPI background tasks.

    Returns:
        ExecutionPackage with PRD, financial model, pitch, architecture, GitLab.

    Raises:
        HTTPException 404: Session not found or debate not complete.
        HTTPException 500: Execution failed.
    """
    session = await db.get_session(request.session_id)
    if not session or not session.decision:
        raise HTTPException(
            status_code=404,
            detail="Session not found or debate not yet complete",
        )

    twin = await db.get_twin(session.twin_id)
    if not twin:
        raise HTTPException(status_code=404, detail="Founder twin not found")

    try:
        package = await run_execution_engine(
            twin=twin,
            decision=session.decision,
            session_id=request.session_id,
            gitlab_token=request.gitlab_token,
            gitlab_namespace=request.gitlab_namespace,
        )
        await db.save_execution_package(package)
        
        # If GitLab repo was created, trigger the engineering team in the background
        if request.gitlab_token and package.gitlab_output and package.gitlab_output.project_id > 0:
            background_tasks.add_task(
                run_engineering_team,
                project_id=package.gitlab_output.project_id,
                prd=package.prd,
                tech_arch=package.tech_architecture,
                gitlab_token=request.gitlab_token,
                gitlab_namespace=request.gitlab_namespace
            )
            
        logger.info("Execution complete", extra={"session_id": request.session_id})
        return package

    except ExecutionError as e:
        logger.error("Execution failed", extra={"code": e.code, "message": e.message})
        raise HTTPException(status_code=500, detail=str(e))
