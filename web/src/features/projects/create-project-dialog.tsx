import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { isTauri } from "@/lib/tauri";
import { FolderOpen, Loader2 } from "lucide-react";

type CreateProjectDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (path: string, name?: string, description?: string) => Promise<void>;
};

export function CreateProjectDialog({
  open,
  onOpenChange,
  onConfirm,
}: CreateProjectDialogProps) {
  const [path, setPath] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setPath("");
      setName("");
      setDescription("");
    }
  }, [open]);

  // Auto-fill name from path
  useEffect(() => {
    if (!name && path) {
      const base = path.replace(/\\/g, "/").split("/").filter(Boolean).pop();
      if (base) setName(base);
    }
  }, [path, name]);

  const pickFolder = useCallback(async () => {
    if (!isTauri()) return;
    try {
      const { open } = await import("@tauri-apps/plugin-dialog");
      const selected = await open({ directory: true });
      if (selected && typeof selected === "string") {
        setPath(selected);
      }
    } catch (err) {
      console.error("[CreateProjectDialog] Folder picker failed:", err);
    }
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!path.trim()) return;
    setIsLoading(true);
    try {
      await onConfirm(path.trim(), name.trim() || undefined, description.trim() || undefined);
      onOpenChange(false);
    } finally {
      setIsLoading(false);
    }
  }, [path, name, description, onConfirm, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New Project</DialogTitle>
          <DialogDescription>
            Choose a folder to create a new project.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label htmlFor="project-path" className="text-sm font-medium">Folder Path</label>
            <div className="flex gap-2">
              <Input
                id="project-path"
                placeholder="/path/to/your/project"
                value={path}
                onChange={(e) => setPath(e.target.value)}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={pickFolder}
                title="Browse folder"
              >
                <FolderOpen className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid gap-2">
            <label htmlFor="project-name" className="text-sm font-medium">Name</label>
            <Input
              id="project-name"
              placeholder="Project name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <label htmlFor="project-description" className="text-sm font-medium">Description</label>
            <Input
              id="project-description"
              placeholder="Optional description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!path.trim() || isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Project"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
