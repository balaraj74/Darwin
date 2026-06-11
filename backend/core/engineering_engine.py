"""
Module: engineering_engine.py
Description: The AI Engineering Team. Automatically scaffolds the MVP based on the PRD
             and pushes the source code to the generated GitLab project.

Author:  KAIRON / Founder Twin
Created: 2026-06-10
"""

import asyncio
from models.execution import PRD, TechArchitecture
from models.engineering import FileTree, CodeFile
from services.gemini_service import GeminiService
from services.gitlab_service import GitLabService
from utils.logger import get_logger

logger = get_logger(__name__)

LEAD_ENGINEER_PROMPT = """
You are the Lead Engineer. Your job is to define the exact file structure needed for a lean MVP.

PRD:
{prd_json}

TECH ARCHITECTURE:
{arch_json}

RULES:
- Return ONLY valid JSON matching this schema: {{"files": ["path/to/file1", "path/to/file2"]}}
- Do NOT include more than 8 files total. Keep it extremely lean.
- Include essential scaffolding: e.g. package.json, src/app/page.tsx, src/app/layout.tsx, src/app/globals.css
- DO NOT use markdown blocks like ```json. Just raw JSON.
"""

DEVELOPER_PROMPT = """
You are a Senior Full-Stack Engineer. Your job is to write the complete source code for a specific file.

PRD:
{prd_json}

TECH ARCHITECTURE:
{arch_json}

FILE PATH:
{file_path}

RULES:
- Write the complete, production-ready code for this file.
- Implement the features described in the PRD relevant to this file.
- Use the Tech Architecture specified.
- Return ONLY valid JSON matching this schema: {{"file_path": "{file_path}", "content": "..."}}
- Content must be escaped properly for JSON.
- DO NOT use markdown blocks like ```json. Just raw JSON.
"""

async def run_engineering_team(
    session_id: str,
    project_id: int,
    prd: PRD,
    tech_arch: TechArchitecture,
    gitlab_token: str,
    gitlab_namespace: str
):
    """
    Runs the engineering team pipeline and commits to GitLab.
    """
    from services.firestore_service import FirestoreService
    db = FirestoreService()
    
    # Update status to in_progress
    package = await db.get_execution_package(session_id)
    if package and package.gitlab_output:
        package.gitlab_output.engineering_status = "in_progress"
        await db.save_execution_package(package)
        
    async def _log(msg: str):
        logger.info(msg, extra={"project_id": project_id})
        pkg = await db.get_execution_package(session_id)
        if pkg and pkg.gitlab_output:
            if getattr(pkg.gitlab_output, "engineering_logs", None) is None:
                pkg.gitlab_output.engineering_logs = []
            pkg.gitlab_output.engineering_logs.append(msg)
            await db.save_execution_package(pkg)
        
    await _log("Starting AI Engineering Team...")
    gemini = GeminiService()
    
    try:
        prd_json = prd.model_dump_json(indent=2)
        arch_json = tech_arch.model_dump_json(indent=2)
        
        # 1. Lead Engineer generates file list
        tree_raw = await gemini.generate_json(LEAD_ENGINEER_PROMPT.format(
            prd_json=prd_json,
            arch_json=arch_json
        ))
        
        file_tree = FileTree(**tree_raw)
        await _log(f"Lead Engineer finalized architecture with {len(file_tree.files)} essential MVP files.")
        
        # 2. Developers generate code concurrently
        await _log("Assigning files to AI Developers for concurrent implementation...")
        async def _generate_file(f_path: str):
            res = await gemini.generate_json(DEVELOPER_PROMPT.format(
                prd_json=prd_json,
                arch_json=arch_json,
                file_path=f_path
            ))
            await _log(f"Developer finished implementing: {f_path}")
            return res

        tasks = []
        for file_path in file_tree.files:
            tasks.append(_generate_file(file_path))
            
        code_results = await asyncio.gather(*tasks)
        
        # Validate results
        code_files = []
        for result in code_results:
            try:
                code_file = CodeFile(**result)
                code_files.append({"file_path": code_file.file_path, "content": code_file.content})
            except Exception as e:
                logger.error("Failed to parse code file", extra={"error": str(e), "raw": result})
                
        # 3. Commit to GitLab
        if code_files:
            gitlab_svc = GitLabService(token=gitlab_token, namespace=gitlab_namespace)
            
            # Auto-close issues
            closes_text = ""
            if package and package.gitlab_output:
                issue_iids = [i.iid for i in package.gitlab_output.issues_created if i.iid is not None]
                if issue_iids:
                    closes_text = "\n\n" + ", ".join([f"Closes #{iid}" for iid in issue_iids])
                    
            await gitlab_svc.commit_files(
                project_id=project_id,
                files=code_files,
                commit_message=f"Initial MVP Scaffolding by Darwin AI Engineering Team{closes_text}"
            )
            await _log(f"Committed {len(code_files)} files to GitLab main branch.")
            
        if package and package.gitlab_output:
            package.gitlab_output.engineering_status = "completed"
            await db.save_execution_package(package)
            await _log("AI Engineering fully complete!")
            
    except Exception as e:
        await _log(f"Engineering Team encountered an error: {str(e)}")
        if package and package.gitlab_output:
            package.gitlab_output.engineering_status = "failed"
            package.gitlab_output.engineering_error = str(e)
            await db.save_execution_package(package)
