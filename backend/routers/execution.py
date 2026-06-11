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
from services.firestore_service import FirestoreService
from services.gitlab_service import GitLabService
from utils.logger import get_logger
from utils.errors import ExecutionError

logger = get_logger(__name__)
router = APIRouter(prefix="/execution", tags=["execution"])
db = FirestoreService()


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

    gitlab_token = request.gitlab_token
    gitlab_namespace = request.gitlab_namespace
    
    if twin.user_id and (not gitlab_token or not gitlab_namespace):
        user = await db.get_user_by_id(twin.user_id)
        if user:
            gitlab_token = gitlab_token or user.profile.gitlab_token
            gitlab_namespace = gitlab_namespace or user.profile.gitlab_namespace

    try:
        package = await run_execution_engine(
            twin=twin,
            decision=session.decision,
            session_id=request.session_id,
            gitlab_token=gitlab_token,
            gitlab_namespace=gitlab_namespace,
        )
        await db.save_execution_package(package)
        
        # If GitLab repo was created, trigger the engineering team in the background
        if gitlab_token and package.gitlab_output and package.gitlab_output.project_id > 0:
            background_tasks.add_task(
                run_engineering_team,
                project_id=package.gitlab_output.project_id,
                prd=package.prd,
                tech_arch=package.tech_architecture,
                gitlab_token=gitlab_token,
                gitlab_namespace=gitlab_namespace
            )
            
        logger.info("Execution complete", extra={"session_id": request.session_id})
        return package

    except ExecutionError as e:
        logger.error("Execution failed", extra={"code": e.code, "message": e.message})
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{session_id}/gitlab", response_model=ExecutionPackage)
async def create_gitlab_project(session_id: str, background_tasks: BackgroundTasks) -> ExecutionPackage:
    """
    Manually create the GitLab project and trigger the engineering team if it wasn't done during initial execution.
    """
    session = await db.get_session(session_id)
    if not session or not session.decision:
        raise HTTPException(status_code=404, detail="Session not found")
        
    twin = await db.get_twin(session.twin_id)
    if not twin or not twin.user_id:
        raise HTTPException(status_code=404, detail="Founder twin not found")
        
    user = await db.get_user_by_id(twin.user_id)
    if not user or not user.profile.gitlab_token or not user.profile.gitlab_namespace:
        raise HTTPException(status_code=400, detail="GitLab token and namespace not configured in profile")
        
    package = await db.get_execution_package(session_id)
    if not package:
        raise HTTPException(status_code=404, detail="Execution package not found")
        
    if package.gitlab_output and package.gitlab_output.project_id > 0:
        if package.gitlab_output.engineering_status not in ["in_progress", "completed"]:
            package.gitlab_output.engineering_status = "in_progress"
            await db.save_execution_package(package)
            background_tasks.add_task(
                run_engineering_team,
                session_id=session_id,
                project_id=package.gitlab_output.project_id,
                prd=package.prd,
                tech_arch=package.tech_architecture,
                gitlab_token=user.profile.gitlab_token,
                gitlab_namespace=user.profile.gitlab_namespace
            )
        return package # Already created
        
    gitlab_token = user.profile.gitlab_token
    gitlab_namespace = user.profile.gitlab_namespace
    
    # Run the GitLab Service
    try:
        gitlab_svc = GitLabService(token=gitlab_token, namespace=gitlab_namespace)
        
        # Convert Pydantic models to dicts for GitLabService
        issues_dicts = [i.model_dump() for i in package.gitlab_output.issues_created] if package.gitlab_output else []
        milestones = package.gitlab_output.milestones_created if package.gitlab_output else []
        epics = package.gitlab_output.epics_created if package.gitlab_output else []
        note = package.gitlab_output.note if package.gitlab_output else ""
        
        gitlab_output = await gitlab_svc.create_project(
            name=package.prd.product_name.lower().replace(" ", "-"),
            description=package.prd.problem_statement,
            milestones=milestones,
            epics=epics,
            issues=issues_dicts,
            note=note,
        )
        
        package.gitlab_output = gitlab_output
        await db.save_execution_package(package)
        
        if gitlab_output.project_id > 0:
            background_tasks.add_task(
                run_engineering_team,
                session_id=session_id,
                project_id=gitlab_output.project_id,
                prd=package.prd,
                tech_arch=package.tech_architecture,
                gitlab_token=gitlab_token,
                gitlab_namespace=gitlab_namespace
            )
            
        logger.info("Manual GitLab project creation complete", extra={"session_id": session_id})
        return package
        
    except Exception as e:
        logger.error("GitLab creation failed", extra={"error": str(e)})
        raise HTTPException(status_code=500, detail=f"Failed to create GitLab project: {str(e)}")
