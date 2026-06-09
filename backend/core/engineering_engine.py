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
    project_id: int,
    prd: PRD,
    tech_arch: TechArchitecture,
    gitlab_token: str,
    gitlab_namespace: str
):
    """
    Runs the engineering team pipeline and commits to GitLab.
    """
    logger.info("Starting AI Engineering Team", extra={"project_id": project_id})
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
        logger.info("Lead Engineer completed file tree", extra={"files": len(file_tree.files)})
        
        # 2. Developers generate code concurrently
        tasks = []
        for file_path in file_tree.files:
            tasks.append(gemini.generate_json(DEVELOPER_PROMPT.format(
                prd_json=prd_json,
                arch_json=arch_json,
                file_path=file_path
            )))
            
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
            await gitlab_svc.commit_files(
                project_id=project_id,
                files=code_files,
                commit_message="Initial MVP Scaffolding by Darwin AI Engineering Team"
            )
            logger.info("Engineering Team committed code to GitLab", extra={"files_committed": len(code_files)})
            
    except Exception as e:
        logger.error("Engineering Team failed", extra={"error": str(e)})
