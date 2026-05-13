import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ProjectCard } from "./project-card";
import { CreateProjectDialog } from "./create-project-dialog";
import type { Project } from "@/hooks/useProjects";
import { Plus, FolderOpen } from "lucide-react";

type ProjectDashboardProps = {
  projects: Project[];
  isLoading: boolean;
  onOpenProject: (project: Project) => void;
  onOpenFolder: (project: Project) => void;
  onCreateProject: (path: string, name?: string, description?: string) => Promise<void>;
  onEditProject: (project: Project) => void;
  onDeleteProject: (project: Project) => void;
};

export function ProjectDashboard({
  projects,
  isLoading,
  onOpenProject,
  onOpenFolder,
  onCreateProject,
  onEditProject,
  onDeleteProject,
}: ProjectDashboardProps) {
  const [createOpen, setCreateOpen] = useState(false);

  const handleCreate = useCallback(
    async (path: string, name?: string, description?: string) => {
      await onCreateProject(path, name, description);
    },
    [onCreateProject],
  );

  return (
    <div className="flex h-full w-full flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/60 px-6 py-4">
        <div>
          <h1 className="text-xl font-semibold">Projects</h1>
          <p className="text-sm text-muted-foreground">
            Manage your workspaces and chat sessions
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {isLoading && projects.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-muted-foreground">Loading projects...</div>
          </div>
        ) : projects.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <FolderOpen className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <h2 className="text-lg font-medium">No projects yet</h2>
              <p className="text-sm text-muted-foreground">
                Create your first project to get started
              </p>
            </div>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {projects.map((project) => (
              <ProjectCard
                key={project.projectId}
                project={project}
                onOpen={onOpenProject}
                onOpenFolder={onOpenFolder}
                onEdit={onEditProject}
                onDelete={onDeleteProject}
              />
            ))}
          </div>
        )}
      </div>

      <CreateProjectDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onConfirm={handleCreate}
      />
    </div>
  );
}
