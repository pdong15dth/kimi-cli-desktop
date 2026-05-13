"""API routes."""

from kimi_cli.web.api import config, open_in, projects, sessions

config_router = config.router
projects_router = projects.router
sessions_router = sessions.router
work_dirs_router = sessions.work_dirs_router
open_in_router = open_in.router

__all__ = [
    "config_router",
    "open_in_router",
    "projects_router",
    "sessions_router",
    "work_dirs_router",
]
