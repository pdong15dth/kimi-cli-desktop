import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { getApiBaseUrl } from "./utils";

export type Project = {
  projectId: string;
  name: string;
  path: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  settings: Record<string, unknown>;
  sessionCount: number;
  lastUpdated?: string;
};

export type CreateProjectRequest = {
  path: string;
  name?: string;
  description?: string;
  createDir?: boolean;
};

export type UpdateProjectRequest = {
  name?: string;
  description?: string;
  settings?: Record<string, unknown>;
};

export type UseProjectsReturn = {
  projects: Project[];
  isLoading: boolean;
  error: string | null;
  refreshProjects: () => Promise<void>;
  createProject: (request: CreateProjectRequest) => Promise<Project | null>;
  updateProject: (
    projectId: string,
    request: UpdateProjectRequest,
  ) => Promise<Project | null>;
  deleteProject: (projectId: string) => Promise<boolean>;
};

function parseProject(data: unknown): Project {
  const d = data as Record<string, unknown>;
  return {
    projectId: String(d.project_id ?? d.projectId),
    name: String(d.name),
    path: String(d.path),
    description: d.description ? String(d.description) : undefined,
    createdAt: String(d.created_at ?? d.createdAt),
    updatedAt: String(d.updated_at ?? d.updatedAt),
    settings: (d.settings as Record<string, unknown>) ?? {},
    sessionCount: Number(d.session_count ?? d.sessionCount ?? 0),
    lastUpdated: d.last_updated ?? d.lastUpdated
      ? String(d.last_updated ?? d.lastUpdated)
      : undefined,
  };
}

export function useProjects(): UseProjectsReturn {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshProjects = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const base = getApiBaseUrl();
      const response = await fetch(`${base}/api/projects/`);
      if (!response.ok) {
        throw new Error(`Failed to load projects: ${response.status}`);
      }
      const data = (await response.json()) as unknown[];
      setProjects(data.map(parseProject));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      toast.error("Failed to load projects", { description: message });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createProject = useCallback(
    async (request: CreateProjectRequest): Promise<Project | null> => {
      try {
        const base = getApiBaseUrl();
        const response = await fetch(`${base}/api/projects/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            path: request.path,
            name: request.name,
            description: request.description,
            create_dir: request.createDir ?? false,
          }),
        });
        if (!response.ok) {
          const data = (await response.json()) as { detail?: string };
          throw new Error(data.detail ?? `HTTP ${response.status}`);
        }
        const data = (await response.json()) as unknown;
        const project = parseProject(data);
        setProjects((prev) => [project, ...prev]);
        return project;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        toast.error("Failed to create project", { description: message });
        return null;
      }
    },
    [],
  );

  const updateProject = useCallback(
    async (
      projectId: string,
      request: UpdateProjectRequest,
    ): Promise<Project | null> => {
      try {
        const base = getApiBaseUrl();
        const response = await fetch(`${base}/api/projects/${encodeURIComponent(projectId)}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(request),
        });
        if (!response.ok) {
          const data = (await response.json()) as { detail?: string };
          throw new Error(data.detail ?? `HTTP ${response.status}`);
        }
        const data = (await response.json()) as unknown;
        const project = parseProject(data);
        setProjects((prev) =>
          prev.map((p) => (p.projectId === projectId ? project : p)),
        );
        return project;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        toast.error("Failed to update project", { description: message });
        return null;
      }
    },
    [],
  );

  const deleteProject = useCallback(
    async (projectId: string): Promise<boolean> => {
      try {
        const base = getApiBaseUrl();
        const response = await fetch(
          `${base}/api/projects/${encodeURIComponent(projectId)}`,
          { method: "DELETE" },
        );
        if (!response.ok) {
          const data = (await response.json()) as { detail?: string };
          throw new Error(data.detail ?? `HTTP ${response.status}`);
        }
        setProjects((prev) => prev.filter((p) => p.projectId !== projectId));
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        toast.error("Failed to delete project", { description: message });
        return false;
      }
    },
    [],
  );

  useEffect(() => {
    refreshProjects();
  }, [refreshProjects]);

  return {
    projects,
    isLoading,
    error,
    refreshProjects,
    createProject,
    updateProject,
    deleteProject,
  };
}
