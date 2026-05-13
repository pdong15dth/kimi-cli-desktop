import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import type { Project } from "@/hooks/useProjects";
import type { Session } from "@/lib/api/models";
import { formatRelativeTime } from "@/hooks/utils";

type ProjectDetailProps = {
  project: Project;
  sessions: Session[];
  selectedSessionId: string | null;
  onBack: () => void;
  onSelectSession: (sessionId: string) => void;
  onNewSession: (project: Project) => void;
  onOpenFolder: (project: Project) => void;
};

export function ProjectDetail({
  project,
  sessions,
  selectedSessionId,
  onBack,
  onSelectSession,
  onNewSession,
  onOpenFolder,
}: ProjectDetailProps) {
  return (
    <div className="flex h-full w-full flex-col bg-background">
      {/* Project Header */}
      <div className="flex items-center gap-2 border-b border-border/60 px-3 py-2 overflow-hidden">
        <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8" onClick={onBack}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="min-w-0 flex-1 overflow-hidden">
          <h2 className="truncate font-semibold text-sm">{project.name}</h2>
          <button
            className="block w-full truncate text-xs text-muted-foreground hover:text-foreground hover:underline text-left"
            title={project.path}
            onClick={() => onOpenFolder(project)}
          >
            {project.path}
          </button>
        </div>
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-auto">
        {sessions.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center p-6">
            <p className="text-sm text-muted-foreground">No sessions yet</p>
            <Button size="sm" onClick={() => onNewSession(project)}>
              <Plus className="mr-1 h-4 w-4" />
              Start a session
            </Button>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-border/60">
            {sessions.map((session) => (
              <button
                key={session.sessionId}
                onClick={() => onSelectSession(session.sessionId)}
                className={`flex flex-col gap-1 px-4 py-3 text-left transition-colors hover:bg-muted/50 ${
                  selectedSessionId === session.sessionId ? "bg-muted" : ""
                }`}
              >
                <span className="text-sm font-medium truncate">
                  {session.title || "Untitled Session"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {session.lastUpdated
                    ? formatRelativeTime(new Date(session.lastUpdated))
                    : "Unknown"}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
