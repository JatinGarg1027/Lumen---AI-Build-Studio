import { useState } from "react";
import {
  ChevronRight,
  ChevronDown,
  File,
  Folder,
  FolderOpen,
  FileCode,
  FileJson,
  FileText,
  Image as ImageIcon,
} from "lucide-react";
import { FileNode } from "@/lib/api";
import { cn } from "@/lib/utils";

interface FileTreeProps {
  files: FileNode[];
  selectedPath: string | null;
  onSelectFile: (path: string) => void;
  isLoading?: boolean;
}

const getFileIcon = (name: string) => {
  const ext = name.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "ts":
    case "tsx":
    case "js":
    case "jsx":
      return FileCode;
    case "json":
      return FileJson;
    case "md":
    case "txt":
      return FileText;
    case "png":
    case "jpg":
    case "jpeg":
    case "svg":
    case "gif":
      return ImageIcon;
    default:
      return File;
  }
};

const getFileColor = (name: string) => {
  const ext = name.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "ts":
    case "tsx":
      return "text-sky-500 dark:text-sky-400";
    case "js":
    case "jsx":
      return "text-yellow-500 dark:text-yellow-400";
    case "json":
      return "text-emerald-500 dark:text-emerald-400";
    case "css":
    case "scss":
      return "text-pink-500 dark:text-pink-400";
    case "html":
      return "text-orange-500 dark:text-orange-400";
    case "md":
      return "text-purple-500 dark:text-purple-400";
    default:
      return "text-muted-foreground";
  }
};

interface FileTreeItemProps {
  node: FileNode;
  depth: number;
  selectedPath: string | null;
  onSelectFile: (path: string) => void;
}

function FileTreeItem({ node, depth, selectedPath, onSelectFile }: FileTreeItemProps) {
  const [isExpanded, setIsExpanded] = useState(depth < 2);

  const isDirectory = node.type === "directory";
  const isSelected = selectedPath === node.path;
  const FileIcon = isDirectory ? (isExpanded ? FolderOpen : Folder) : getFileIcon(node.name);
  const fileColor = isDirectory ? "text-amber-500 dark:text-amber-400" : getFileColor(node.name);

  const handleClick = () => {
    if (isDirectory) setIsExpanded(!isExpanded);
    else onSelectFile(node.path);
  };

  return (
    <div>
      <div
        role="treeitem"
        aria-selected={isSelected}
        aria-expanded={isDirectory ? isExpanded : undefined}
        tabIndex={0}
        className={cn("file-tree-item text-[13px]", isSelected && "active")}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        onClick={handleClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleClick();
          }
        }}
        data-testid={`file-tree-${node.path}`}
      >
        {isDirectory ? (
          isExpanded ? (
            <ChevronDown className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
          )
        ) : (
          <span className="w-3.5" />
        )}
        <FileIcon className={cn("w-4 h-4 shrink-0", fileColor)} />
        <span className="truncate">{node.name}</span>
      </div>

      {isDirectory && isExpanded && node.children && (
        <div role="group">
          {node.children.map((child) => (
            <FileTreeItem
              key={child.path}
              node={child}
              depth={depth + 1}
              selectedPath={selectedPath}
              onSelectFile={onSelectFile}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function FileTree({ files, selectedPath, onSelectFile, isLoading }: FileTreeProps) {
  if (isLoading) {
    return (
      <div className="p-3 space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-2 animate-pulse">
            <div className="w-4 h-4 bg-muted rounded" />
            <div className="h-3 bg-muted rounded flex-1" style={{ width: `${50 + i * 10}%` }} />
          </div>
        ))}
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground text-sm">No files yet</div>
    );
  }

  return (
    <nav role="tree" aria-label="File tree" className="py-2">
      {files.map((node) => (
        <FileTreeItem
          key={node.path}
          node={node}
          depth={0}
          selectedPath={selectedPath}
          onSelectFile={onSelectFile}
        />
      ))}
    </nav>
  );
}
