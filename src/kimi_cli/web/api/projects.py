"""Projects API routes."""

from __future__ import annotations

from typing import Any
from uuid import UUID

from fastapi import APIRouter, HTTPException, status

from kimi_cli.web.models import (
    CreateProjectRequest,
    ProjectSummary,
    UpdateProjectRequest,
)
from kimi_cli.web.store.projects import (
    create_project,
    delete_project,
    get_project_by_id,
    load_all_projects,
    update_project,
)
from kimi_cli.web.store.sessions import load_sessions_page

router = APIRouter(prefix="/api/projects", tags=["projects"])


def _compute_project_metadata(projects: list[Any]) -> list[ProjectSummary]:
    """Compute session_count and last_updated for each project."""
    # Load all sessions (reasonable limit for desktop use)
    sessions = load_sessions_page(limit=10000, offset=0, archived=None)

    # Aggregate by work_dir
    stats: dict[str, dict[str, Any]] = {}
    for session in sessions:
        wd = session.work_dir or ""
        if wd not in stats:
            stats[wd] = {"count": 0, "last_updated": None}
        stats[wd]["count"] += 1
        if session.last_updated:
            if stats[wd]["last_updated"] is None or session.last_updated > stats[wd]["last_updated"]:
                stats[wd]["last_updated"] = session.last_updated

    result = []
    for project in projects:
        stat = stats.get(project.path, {"count": 0, "last_updated": None})
        result.append(
            ProjectSummary(
                project_id=project.project_id,
                name=project.name,
                path=project.path,
                description=project.description,
                created_at=project.created_at,
                updated_at=project.updated_at,
                settings=project.settings,
                session_count=stat["count"],
                last_updated=stat["last_updated"],
            )
        )

    # Sort by last_updated desc (most active first)
    result.sort(key=lambda p: p.last_updated or p.created_at, reverse=True)
    return result


@router.get("/")
async def list_projects() -> list[ProjectSummary]:
    """List all projects with computed session metadata."""
    projects = load_all_projects()
    return _compute_project_metadata(projects)


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_new_project(request: CreateProjectRequest) -> ProjectSummary:
    """Create a new project from a folder path."""
    try:
        project = create_project(request)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    summaries = _compute_project_metadata([project])
    return summaries[0]


@router.get("/{project_id}")
async def get_project(project_id: UUID) -> ProjectSummary:
    """Get a single project by ID."""
    project = get_project_by_id(project_id)
    if project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    summaries = _compute_project_metadata([project])
    return summaries[0]


@router.put("/{project_id}")
async def update_existing_project(
    project_id: UUID, request: UpdateProjectRequest
) -> ProjectSummary:
    """Update project name, description, or settings."""
    project = update_project(project_id, request)
    if project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    summaries = _compute_project_metadata([project])
    return summaries[0]


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_existing_project(project_id: UUID) -> None:
    """Delete a project. Sessions are NOT deleted."""
    if not delete_project(project_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
