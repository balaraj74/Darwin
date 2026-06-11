"""
Module: gitlab_service.py
Description: GitLab REST API v4 integration. Creates projects, milestones, epics (as labels),
             and sprint issues. This is the execution layer — real infrastructure.

Author:  Balaraj
Created: 2026-06-10

Dependencies: httpx, config.constants, models.execution
Exports: GitLabService
"""

import httpx
from models.execution import GitLabOutput, GitLabIssue
from config.constants import GITLAB_API_BASE, GITLAB_EPIC_LABEL_COLOR
from utils.logger import get_logger
from utils.errors import GitLabError

logger = get_logger(__name__)


class GitLabService:
    """
    Creates a full GitLab project structure from the execution engine's output.

    Creates in order: project → milestones → epic labels → issues.
    All operations verified before proceeding to the next step.
    """

    def __init__(self, token: str, namespace: str) -> None:
        """
        Initialize with GitLab personal access token.

        Args:
            token: GitLab PAT with 'api' scope.
            namespace: GitLab username or group name.
        """
        self._token = token
        self._namespace = namespace
        self._headers = {
            "PRIVATE-TOKEN": token,
            "Content-Type": "application/json",
        }

    async def create_project(
        self,
        name: str,
        description: str,
        milestones: list[str],
        epics: list[str],
        issues: list[dict],
        note: str,
    ) -> GitLabOutput:
        """
        Create a complete GitLab project with milestones, epics, and issues.

        Args:
            name: Project name.
            description: Project description (from PRD).
            milestones: List of milestone names.
            epics: List of epic names (created as labels).
            issues: List of issue dicts from execution engine.
            note: Explains how structure reflects founder profile.

        Returns:
            GitLabOutput with project URL and all created items.

        Raises:
            GitLabError: If any critical API call fails.
        """
        async with httpx.AsyncClient(timeout=30.0) as client:
            # 1. Create project
            project = await self._create_project(client, name, description)
            project_id = project["id"]
            project_url = project["web_url"]
            logger.info("GitLab project created", extra={"url": project_url})

            # 2. Create milestones
            milestone_ids: dict[str, int] = {}
            for ms_name in milestones:
                ms = await self._create_milestone(client, project_id, ms_name)
                milestone_ids[ms_name] = ms["id"]
            logger.info("Milestones created", extra={"count": len(milestone_ids)})

            # 3. Create epic labels
            for epic_name in epics:
                await self._create_label(client, project_id, epic_name, GITLAB_EPIC_LABEL_COLOR)
            logger.info("Epic labels created", extra={"count": len(epics)})

            # 4. Create issues
            created_issues: list[GitLabIssue] = []
            for issue_data in issues:
                milestone_id = milestone_ids.get(issue_data.get("milestone", ""))
                labels = list(issue_data.get("labels", []))
                epic = issue_data.get("epic", "")
                if epic:
                    labels.append(epic)

                issue_res = await self._create_issue(
                    client=client,
                    project_id=project_id,
                    title=issue_data["title"],
                    description=issue_data["description"],
                    milestone_id=milestone_id,
                    labels=labels,
                    estimated_hours=issue_data.get("estimated_hours", 0),
                )
                created_issues.append(
                    GitLabIssue(
                        iid=issue_res.get("iid"),
                        title=issue_data["title"],
                        description=issue_data["description"],
                        milestone=issue_data.get("milestone", ""),
                        epic=epic,
                        estimated_hours=issue_data.get("estimated_hours", 0),
                        labels=issue_data.get("labels", []),
                    )
                )
            logger.info("Issues created", extra={"count": len(created_issues)})

            return GitLabOutput(
                project_url=project_url,
                project_id=project_id,
                milestones_created=milestones,
                epics_created=epics,
                issues_created=created_issues,
                note=note,
            )

    async def _create_project(self, client: httpx.AsyncClient, name: str, description: str) -> dict:
        namespace_id = await self._get_namespace_id(client)
        response = await client.post(
            f"{GITLAB_API_BASE}/projects",
            headers=self._headers,
            json={
                "name": name,
                "namespace_id": namespace_id,
                "description": description,
                "visibility": "private",
                "initialize_with_readme": True,
            },
        )
        if response.status_code not in (200, 201):
            raise GitLabError(
                "PROJECT_CREATE_FAILED",
                f"GitLab project creation failed ({response.status_code}): {response.text}",
            )
        return response.json()

    async def _get_namespace_id(self, client: httpx.AsyncClient) -> int:
        response = await client.get(
            f"{GITLAB_API_BASE}/namespaces",
            headers=self._headers,
            params={"search": self._namespace},
        )
        if response.status_code != 200:
            raise GitLabError(
                "NAMESPACE_API_FAILED",
                f"Failed to fetch namespace ({response.status_code}): {response.text}"
            )
            
        namespaces = response.json()
        if not namespaces or not isinstance(namespaces, list):
            raise GitLabError(
                "NAMESPACE_NOT_FOUND",
                f"GitLab namespace '{self._namespace}' not found. Please check if your token has 'api' scope and the namespace is correct.",
            )
            
        # Try to match the exact path, otherwise fallback to the first result
        for ns in namespaces:
            if ns.get("path") == self._namespace:
                return ns["id"]
                
        return namespaces[0]["id"]

    async def _create_milestone(
        self, client: httpx.AsyncClient, project_id: int, title: str
    ) -> dict:
        response = await client.post(
            f"{GITLAB_API_BASE}/projects/{project_id}/milestones",
            headers=self._headers,
            json={"title": title},
        )
        if response.status_code not in (200, 201):
            raise GitLabError(
                "MILESTONE_CREATE_FAILED",
                f"Milestone '{title}' creation failed: {response.text}",
            )
        return response.json()

    async def _create_label(
        self, client: httpx.AsyncClient, project_id: int, name: str, color: str
    ) -> dict:
        response = await client.post(
            f"{GITLAB_API_BASE}/projects/{project_id}/labels",
            headers=self._headers,
            json={"name": name, "color": color},
        )
        # Labels may already exist — 409 is acceptable
        return response.json()

    async def _create_issue(
        self,
        client: httpx.AsyncClient,
        project_id: int,
        title: str,
        description: str,
        milestone_id: int | None,
        labels: list[str],
        estimated_hours: int,
    ) -> dict:
        body: dict = {
            "title": title,
            "description": f"{description}\n\n**Estimated:** {estimated_hours}h",
            "labels": ",".join(filter(None, labels)),
        }
        if milestone_id:
            body["milestone_id"] = milestone_id
        response = await client.post(
            f"{GITLAB_API_BASE}/projects/{project_id}/issues",
            headers=self._headers,
            json=body,
        )
        if response.status_code not in (200, 201):
            raise GitLabError(
                "ISSUE_CREATE_FAILED",
                f"Issue '{title}' creation failed: {response.text}",
            )
        return response.json()

    async def commit_files(self, project_id: int, files: list[dict], commit_message: str) -> dict:
        """
        Commit multiple files to the main branch.

        Args:
            project_id: GitLab project ID
            files: list of dicts with 'file_path' and 'content'
            commit_message: Commit message
        """
        actions = []
        for f in files:
            path = f["file_path"]
            action = "update" if path.lower() == "readme.md" else "create"
            actions.append({
                "action": action,
                "file_path": path,
                "content": f["content"]
            })
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{GITLAB_API_BASE}/projects/{project_id}/repository/commits",
                headers=self._headers,
                json={
                    "branch": "main",
                    "commit_message": commit_message,
                    "actions": actions
                }
            )
            if response.status_code not in (200, 201):
                logger.error("Commit failed", extra={"status": response.status_code, "text": response.text})
                raise GitLabError("COMMIT_FAILED", f"Commit failed: {response.text}")
            return response.json()

