import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { Project } from "@/hooks/useProjects";
import { Folder, FolderOpen, MoreVertical, Pencil, Trash2 } from "lucide-react";

type ProjectCardProps = {
  project: Project;
  onOpen: (project: Project) => void;
  onOpenFolder: (project: Project) => void;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
};

export function ProjectCard({ project, onOpen, onOpenFolder, onEdit, onDelete }: ProjectCardProps) {
  const formatRelativeTime = (dateStr?: string) => {
    if (!dateStr) return "Never";
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const displayPath = (path: string) => {
    const home = typeof window !== "undefined" && window.location?.pathname?.startsWith("/Users/")
      ? `/Users/${path.split("/")[2]}`
      : null;
    if (home && path.startsWith(home)) {
      return `~${path.slice(home.length)}`;
    }
    return path;
  };

  return (
    <div
      className={cn(
        "group relative flex flex-col gap-3 rounded-lg border border-border/60 bg-card p-4",
        "transition-all duration-200 hover:border-border hover:shadow-sm cursor-pointer",
      )}
      onClick={() => onOpen(project)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted">
            <Folder className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="min-w-0">
            <h3 className="truncate font-semibold text-sm">{project.name}</h3>
            <p className="truncate text-xs text-muted-foreground" title={project.path}>
              {displayPath(project.path)}
            </p>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onOpenFolder(project); }}>
              <FolderOpen className="mr-2 h-4 w-4" />
              Open Folder
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(project); }}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={(e) => { e.stopPropagation(); onDelete(project); }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {project.description && (
        <p className="text-xs text-muted-foreground line-clamp-2">{project.description}</p>
      )}

      <div className="mt-auto flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {project.sessionCount} session{project.sessionCount === 1 ? "" : "s"}
        </span>
        <span>{formatRelativeTime(project.lastUpdated)}</span>
      </div>
    </div>
  );
}
