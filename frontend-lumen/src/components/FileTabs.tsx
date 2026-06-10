import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileTabsProps {
  openTabs: string[];
  activeTab: string | null;
  onSelectTab: (path: string) => void;
  onCloseTab: (path: string) => void;
}

const getFileName = (path: string) => path.split("/").pop() || path;

const getFileColor = (path: string) => {
  const ext = path.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "tsx":
    case "ts":
      return "bg-sky-400";
    case "jsx":
    case "js":
      return "bg-yellow-400";
    case "css":
      return "bg-pink-400";
    case "json":
      return "bg-emerald-400";
    case "md":
      return "bg-purple-400";
    case "html":
      return "bg-orange-400";
    default:
      return "bg-muted-foreground";
  }
};

export function FileTabs({ openTabs, activeTab, onSelectTab, onCloseTab }: FileTabsProps) {
  if (openTabs.length === 0) return null;

  return (
    <div
      className="flex items-center border-b border-border/60 bg-panel overflow-x-auto"
      role="tablist"
      aria-label="Open files"
    >
      {openTabs.map((path) => {
        const isActive = activeTab === path;
        return (
          <div
            key={path}
            role="tab"
            aria-selected={isActive}
            tabIndex={0}
            className={cn(
              "group flex items-center gap-2 px-3 py-2 text-xs cursor-pointer transition-all min-w-0 relative",
              "border-r border-border/40",
              isActive
                ? "bg-background text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/40",
            )}
            onClick={() => onSelectTab(path)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") onSelectTab(path);
            }}
            data-testid={`file-tab-${getFileName(path)}`}
          >
            <span className={cn("shrink-0 w-1.5 h-1.5 rounded-full", getFileColor(path))} />
            <span className="truncate max-w-[140px] font-mono">{getFileName(path)}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCloseTab(path);
              }}
              aria-label={`Close ${getFileName(path)}`}
              className={cn(
                "shrink-0 p-0.5 rounded hover:bg-muted/70 transition-opacity",
                isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100",
              )}
            >
              <X className="w-3 h-3" />
            </button>
            {isActive && (
              <span
                aria-hidden="true"
                className="absolute bottom-0 inset-x-0 h-0.5 bg-aurora"
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
