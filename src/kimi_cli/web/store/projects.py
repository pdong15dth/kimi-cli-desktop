"""Project storage — file-based JSON store in ~/.kimi/projects.json."""

from __future__ import annotations

import json
from datetime import UTC, datetime
from pathlib import Path
from typing import Any
from uuid import UUID, uuid4

from kimi_cli.web.models import CreateProjectRequest, Project, UpdateProjectRequest

PROJECTS_FILE = Path.home() / ".kimi" / "projects.json"


def _ensure_projects_file() -> None:
    PROJECTS_FILE.parent.mkdir(parents=True, exist_ok=True)
    if not PROJECTS_FILE.exists():
        PROJECTS_FILE.write_text("[]", encoding="utf-8")


def _load_raw() -> list[dict[str, Any]]:
    _ensure_projects_file()
    try:
        data = json.loads(PROJECTS_FILE.read_text(encoding="utf-8"))
        if not isinstance(data, list):
            return []
        return data
    except (json.JSONDecodeError, OSError):
        return []


def _save_raw(data: list[dict[str, Any]]) -> None:
    _ensure_projects_file()
    PROJECTS_FILE.write_text(
        json.dumps(data, indent=2, default=str, ensure_ascii=False),
        encoding="utf-8",
    )


def _row_to_project(row: dict[str, Any]) -> Project:
    return Project(
        project_id=UUID(row["project_id"]),
        name=row["name"],
        path=row["path"],
        description=row.get("description"),
        created_at=datetime.fromisoformat(row["created_at"]),
        updated_at=datetime.fromisoformat(row["updated_at"]),
        settings=row.get("settings", {}),
    )


def _project_to_row(project: Project) -> dict[str, Any]:
    return {
        "project_id": str(project.project_id),
        "name": project.name,
        "path": project.path,
        "description": project.description,
        "created_at": project.created_at.isoformat(),
        "updated_at": project.updated_at.isoformat(),
        "settings": project.settings,
    }


def load_all_projects() -> list[Project]:
    """Load all projects from disk."""
    return [_row_to_project(row) for row in _load_raw()]


def get_project_by_id(project_id: UUID) -> Project | None:
    """Find a project by its ID."""
    for row in _load_raw():
        if UUID(row["project_id"]) == project_id:
            return _row_to_project(row)
    return None


def get_project_by_path(path: str) -> Project | None:
    """Find a project by its folder path."""
    resolved = Path(path).expanduser().resolve()
    for row in _load_raw():
        if Path(row["path"]).expanduser().resolve() == resolved:
            return _row_to_project(row)
    return None


def create_project(request: CreateProjectRequest) -> Project:
    """Create a new project."""
    path = Path(request.path).expanduser().resolve()
    if not path.exists():
        if request.create_dir:
            path.mkdir(parents=True, exist_ok=True)
        else:
            raise ValueError(f"Path does not exist: {path}")

    # Deduplicate by resolved path
    existing = get_project_by_path(str(path))
    if existing is not None:
        return existing

    name = request.name or path.name or "Untitled Project"
    now = datetime.now(UTC)
    project = Project(
        project_id=uuid4(),
        name=name,
        path=str(path),
        description=request.description,
        created_at=now,
        updated_at=now,
        settings=request.settings,
    )

    rows = _load_raw()
    rows.append(_project_to_row(project))
    _save_raw(rows)
    return project


def update_project(project_id: UUID, request: UpdateProjectRequest) -> Project | None:
    """Update an existing project."""
    rows = _load_raw()
    for i, row in enumerate(rows):
        if UUID(row["project_id"]) == project_id:
            if request.name is not None:
                row["name"] = request.name
            if request.description is not None:
                row["description"] = request.description
            if request.settings is not None:
                row["settings"] = request.settings
            row["updated_at"] = datetime.now(UTC).isoformat()
            _save_raw(rows)
            return _row_to_project(row)
    return None


def delete_project(project_id: UUID) -> bool:
    """Delete a project by ID. Does NOT delete sessions."""
    rows = _load_raw()
    new_rows = [row for row in rows if UUID(row["project_id"]) != project_id]
    if len(new_rows) == len(rows):
        return False
    _save_raw(new_rows)
    return True
