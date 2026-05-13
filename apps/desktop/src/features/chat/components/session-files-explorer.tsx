import { useCallback, useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  FileText,
  Folder,
  FolderOpen,
  Loader2,
  PanelRightClose,
  RefreshCw,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { SessionFileEntry } from "@/hooks/useSessions";
import { cn } from "@/lib/utils";

type TreeNode = {
  name: string;
  path: string;
  type: "directory" | "file";
  size?: number;
  children: TreeNode[];
  isExpanded: boolean;
  isLoading: boolean;
};

type SessionFilesExplorerProps = {
  className?: string;
  sessionId: string;
  workDir?: string | null;
  onClose: () => void;
  onListSessionDirectory?: (
    sessionId: string,
    path?: string,
  ) => Promise<SessionFileEntry[]>;
  onGetSessionFileUrl?: (sessionId: string, path: string) => string;
};

function joinSessionPath(basePath: string, name: string): string {
  return basePath === "." ? name : `${basePath}/${name}`;
}

function updateNodeInTree(
  nodes: TreeNode[],
  targetPath: string,
  updater: (node: TreeNode) => TreeNode,
): TreeNode[] {
  return nodes.map((node) => {
    if (node.path === targetPath) {
      return updater(node);
    }
    if (node.children.length > 0) {
      return { ...node, children: updateNodeInTree(node.children, targetPath, updater) };
    }
    return node;
  });
}

function sortEntries(entries: TreeNode[]): TreeNode[] {
  return [...entries].sort((a, b) => {
    if (a.type === b.type) {
      return a.name.localeCompare(b.name);
    }
    return a.type === "directory" ? -1 : 1;
  });
}

export function SessionFilesExplorer({
  className,
  sessionId,
  workDir,
  onClose,
  onListSessionDirectory,
}: SessionFilesExplorerProps) {
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [isLoadingRoot, setIsLoadingRoot] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const loadPath = useCallback(
    async (path: string) => {
      if (!onListSessionDirectory) return;
      const reqId = ++requestIdRef.current;

      if (path === ".") setIsLoadingRoot(true);
      setError(null);

      try {
        const entries = await onListSessionDirectory(sessionId, path);
        if (reqId !== requestIdRef.current) return;

        const children: TreeNode[] = sortEntries(
          entries.map((entry) => ({
            name: entry.name,
            path: joinSessionPath(path, entry.name),
            type: entry.type,
            size: entry.size,
            children: [],
            isExpanded: false,
            isLoading: false,
          })),
        );

        if (path === ".") {
          setTree(children);
        } else {
          setTree((prev) =>
            updateNodeInTree(prev, path, (node) => ({
              ...node,
              children,
              isLoading: false,
              isExpanded: true,
            })),
          );
        }
      } catch (err) {
        if (reqId !== requestIdRef.current) return;
        setError(err instanceof Error ? err.message : "Failed to load files");
      } finally {
        if (reqId === requestIdRef.current && path === ".") {
          setIsLoadingRoot(false);
        } else if (reqId === requestIdRef.current) {
          setTree((prev) =>
            updateNodeInTree(prev, path, (node) => ({ ...node, isLoading: false })),
          );
        }
      }
    },
    [onListSessionDirectory, sessionId],
  );

  useEffect(() => {
    loadPath(".");
  }, [loadPath]);

  const handleToggle = useCallback(
    (node: TreeNode) => {
      if (node.type !== "directory") return;

      if (node.isExpanded) {
        setTree((prev) =>
          updateNodeInTree(prev, node.path, (n) => ({ ...n, isExpanded: false })),
        );
      } else {
        if (node.children.length === 0) {
          setTree((prev) =>
            updateNodeInTree(prev, node.path, (n) => ({ ...n, isLoading: true })),
          );
          loadPath(node.path);
        } else {
          setTree((prev) =>
            updateNodeInTree(prev, node.path, (n) => ({ ...n, isExpanded: true })),
          );
        }
      }
    },
    [loadPath],
  );

  const handleRefresh = useCallback(() => {
    loadPath(".");
  }, [loadPath]);

  const renderNode = (node: TreeNode, level: number): React.ReactNode => {
    const isDir = node.type === "directory";
    const pl = level * 12;

    return (
      <div key={node.path}>
        <div
          className={cn(
            "group flex h-[22px] select-none items-center pr-2 text-[13px] leading-none",
            "cursor-pointer text-foreground hover:bg-[color-mix(in_oklch,var(--accent)_40%,transparent)]",
          )}
          style={{ paddingLeft: pl }}
          onClick={() => isDir && handleToggle(node)}
        >
          {isDir ? (
            <span
              className="mr-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center text-muted-foreground"
              onClick={(e) => {
                e.stopPropagation();
                handleToggle(node);
              }}
            >
              {node.isLoading ? (
                <Loader2 className="size-3 animate-spin" />
              ) : node.isExpanded ? (
                <ChevronDown className="size-3" />
              ) : (
                <ChevronRight className="size-3" />
              )}
            </span>
          ) : (
            <span className="mr-0.5 inline-block h-4 w-4 shrink-0" />
          )}

          {isDir ? (
            node.isExpanded ? (
              <FolderOpen className="mr-1.5 size-4 shrink-0 text-muted-foreground" />
            ) : (
              <Folder className="mr-1.5 size-4 shrink-0 text-muted-foreground" />
            )
          ) : (
            <FileText className="mr-1.5 size-4 shrink-0 text-muted-foreground" />
          )}

          <span className="min-w-0 flex-1 truncate">{node.name}</span>
        </div>

        {isDir && node.isExpanded && (
          <div>
            {node.children.length === 0 && !node.isLoading ? (
              <div className="h-[22px] pl-6 text-[13px] text-muted-foreground" style={{ paddingLeft: pl + 24 }}>
                Empty folder
              </div>
            ) : (
              node.children.map((child) => renderNode(child, level + 1))
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside className={cn("flex h-full min-h-0 flex-col bg-background", className)}>
      {/* Header — giống VS Code */}
      <div className="group/header flex h-[35px] shrink-0 items-center justify-between px-3">
        <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Explorer
        </span>
        <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover/header:opacity-100">
          <button
            type="button"
            className="inline-flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground"
            onClick={handleRefresh}
            disabled={isLoadingRoot}
            title="Refresh"
          >
            <RefreshCw className={cn("size-3", isLoadingRoot && "animate-spin")} />
          </button>
          <button
            type="button"
            className="inline-flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground"
            onClick={onClose}
            title="Close"
          >
            <PanelRightClose className="size-3" />
          </button>
        </div>
      </div>

      {/* Folder name breadcrumb (nếu có workDir) */}
      {workDir && (
        <div className="px-3 pb-1.5">
          <span className="truncate text-[11px] text-muted-foreground" title={workDir}>
            {workDir}
          </span>
        </div>
      )}

      <ScrollArea className="min-h-0 flex-1">
        {isLoadingRoot && tree.length === 0 ? (
          <div className="flex min-h-40 flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-5 animate-spin" />
            <span>Loading files...</span>
          </div>
        ) : error ? (
          <div className="m-3 rounded border border-destructive/20 bg-destructive/5 p-3 text-sm">
            <div className="font-medium text-foreground">Failed to load files</div>
            <p className="mt-1 text-muted-foreground">{error}</p>
            <button
              className="mt-2 rounded border px-2 py-1 text-xs hover:bg-accent"
              onClick={handleRefresh}
            >
              Try again
            </button>
          </div>
        ) : tree.length === 0 ? (
          <div className="flex min-h-40 flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
            <Folder className="size-5" />
            <span>No files in workspace.</span>
          </div>
        ) : (
          <div className="py-1">{tree.map((node) => renderNode(node, 0))}</div>
        )}
      </ScrollArea>
    </aside>
  );
}
