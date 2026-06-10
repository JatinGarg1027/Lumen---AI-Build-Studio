import { useState, useEffect, useCallback } from "react";
import { FileTree } from "./FileTree";
import { CodeEditor } from "./CodeEditor";
import { FileTabs } from "./FileTabs";
import { api, FileNode, OPEN_TABS_KEY, ACTIVE_TAB_KEY } from "@/lib/api";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, RotateCcw, FileCode, FolderTree } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CodePanelProps {
  projectId: string;
  updatedFiles: Map<string, string>;
  isStreaming?: boolean;
  viewMode?: "code" | "preview";
}

function findFileInTree(files: FileNode[], targetPath: string): boolean {
  for (const node of files) {
    if (node.path === targetPath) return true;
    if (node.children && findFileInTree(node.children, targetPath)) return true;
  }
  return false;
}

const getTabsKey = (projectId: string) => `${OPEN_TABS_KEY}_${projectId}`;
const getActiveTabKey = (projectId: string) => `${ACTIVE_TAB_KEY}_${projectId}`;

export function CodePanel({
  projectId,
  updatedFiles,
  isStreaming = false,
  viewMode = "preview",
}: CodePanelProps) {
  const [files, setFiles] = useState<FileNode[]>([]);
  const [openTabs, setOpenTabs] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>("");
  const [isLoadingTree, setIsLoadingTree] = useState(true);
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [treeError, setTreeError] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  useEffect(() => {
    const savedTabs = localStorage.getItem(getTabsKey(projectId));
    const savedActiveTab = localStorage.getItem(getActiveTabKey(projectId));
    if (savedTabs) {
      try {
        const tabs = JSON.parse(savedTabs);
        if (Array.isArray(tabs) && tabs.length > 0) {
          setOpenTabs(tabs);
          setActiveTab(savedActiveTab || tabs[0]);
          return;
        }
      } catch (e) {
        console.error("Failed to parse saved tabs:", e);
      }
    }
  }, [projectId]);

  useEffect(() => {
    if (openTabs.length > 0) localStorage.setItem(getTabsKey(projectId), JSON.stringify(openTabs));
    else localStorage.removeItem(getTabsKey(projectId));
  }, [openTabs, projectId]);

  useEffect(() => {
    if (activeTab) localStorage.setItem(getActiveTabKey(projectId), activeTab);
    else localStorage.removeItem(getActiveTabKey(projectId));
  }, [activeTab, projectId]);

  useEffect(() => {
    let active = true;
    let timerId: NodeJS.Timeout | null = null;
    let backupTimerId: NodeJS.Timeout | null = null;

    const loadFiles = async (showLoading = true) => {
      if (showLoading) setIsLoadingTree(true);
      setTreeError(null);
      try {
        const fileTree = await api.getFiles(projectId);
        if (!active) return;
        setFiles(fileTree);

        if (openTabs.length === 0 && fileTree.length > 0) {
          const defaultPaths = [
            "src/pages/Index.tsx",
            "pages/Index.tsx",
            "src/App.tsx",
            "src/main.tsx",
          ];
          let foundDefault = false;
          for (const defaultPath of defaultPaths) {
            if (findFileInTree(fileTree, defaultPath)) {
              setOpenTabs([defaultPath]);
              setActiveTab(defaultPath);
              foundDefault = true;
              break;
            }
          }
          if (!foundDefault) {
            const findFirstFile = (nodes: FileNode[]): string | null => {
              for (const node of nodes) {
                if (node.type === "file") return node.path;
                if (node.children) {
                  const childPath = findFirstFile(node.children);
                  if (childPath) return childPath;
                }
              }
              return null;
            };
            const firstFile = findFirstFile(fileTree);
            if (firstFile) {
              setOpenTabs([firstFile]);
              setActiveTab(firstFile);
            }
          }
        }
      } catch (error) {
        if (!active) return;
        const errorMsg = error instanceof Error ? error.message : "Unknown error loading files";
        setTreeError(`Failed to load files: ${errorMsg}`);
        setFiles([]);
      } finally {
        if (active) setIsLoadingTree(false);
      }
    };

    if (!isStreaming && viewMode === "code") {
      loadFiles(files.length === 0);
      timerId = setTimeout(() => loadFiles(false), 1000);
      backupTimerId = setTimeout(() => loadFiles(false), 3000);
    }

    return () => {
      active = false;
      if (timerId) clearTimeout(timerId);
      if (backupTimerId) clearTimeout(backupTimerId);
    };
  }, [projectId, isStreaming, viewMode, openTabs.length]);

  useEffect(() => {
    if (!activeTab) {
      setFileContent("");
      setFileError(null);
      return;
    }
    if (updatedFiles.has(activeTab)) {
      setFileContent(updatedFiles.get(activeTab)!);
      setFileError(null);
      return;
    }
    const loadContent = async () => {
      setIsLoadingFile(true);
      setFileError(null);
      try {
        const content = await api.getFileContent(projectId, activeTab);
        setFileContent(content);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Unknown error";
        setFileError(`Failed to load file: ${errorMsg}`);
        setFileContent("// Error loading file");
      } finally {
        setIsLoadingFile(false);
      }
    };
    loadContent();
  }, [projectId, activeTab, updatedFiles]);

  useEffect(() => {
    if (activeTab && updatedFiles.has(activeTab)) {
      setFileContent(updatedFiles.get(activeTab)!);
    }
  }, [activeTab, updatedFiles]);

  const handleSelectFile = useCallback(
    (path: string) => {
      if (!openTabs.includes(path)) setOpenTabs((prev) => [...prev, path]);
      setActiveTab(path);
    },
    [openTabs],
  );

  const handleCloseTab = useCallback(
    (path: string) => {
      setOpenTabs((prev) => {
        const newTabs = prev.filter((t) => t !== path);
        if (activeTab === path) {
          const closingIndex = prev.indexOf(path);
          const newActiveIndex = Math.min(closingIndex, newTabs.length - 1);
          setActiveTab(newTabs[newActiveIndex] || null);
        }
        return newTabs;
      });
    },
    [activeTab],
  );

  const handleSelectTab = useCallback((path: string) => setActiveTab(path), []);

  const handleRetryLoadFiles = useCallback(() => {
    const loadFiles = async () => {
      setIsLoadingTree(true);
      setTreeError(null);
      try {
        const fileTree = await api.getFiles(projectId);
        setFiles(fileTree);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Unknown error";
        setTreeError(`Failed to load files: ${errorMsg}`);
      } finally {
        setIsLoadingTree(false);
      }
    };
    loadFiles();
  }, [projectId]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-1 min-h-0">
        {/* File Tree */}
        <aside className="w-60 shrink-0 border-r border-border/60 overflow-y-auto bg-panel flex flex-col">
          <div className="panel-header">
            <div className="flex items-center gap-2">
              <FolderTree className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Files
              </span>
            </div>
          </div>

          {treeError && (
            <div className="p-3 m-2">
              <Alert variant="destructive" className="mb-2 rounded-xl">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">{treeError}</AlertDescription>
              </Alert>
              <Button
                onClick={handleRetryLoadFiles}
                size="sm"
                variant="outline"
                className="w-full text-xs rounded-lg"
                disabled={isLoadingTree}
              >
                <RotateCcw className="w-3 h-3 mr-1" />
                Retry
              </Button>
            </div>
          )}

          {isLoadingTree && files.length === 0 && !treeError && (
            <div className="p-3 space-y-2">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="flex items-center gap-2 animate-pulse">
                  <div className="w-3 h-3 rounded bg-muted" />
                  <div
                    className="h-3 rounded bg-muted flex-1"
                    style={{ maxWidth: `${50 + i * 8}%` }}
                  />
                </div>
              ))}
            </div>
          )}

          {!isLoadingTree && files.length === 0 && !treeError && (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground text-xs text-center px-3">
              <FileCode className="w-6 h-6 mb-2 opacity-40" />
              No files yet — chat with Lumen to generate code.
            </div>
          )}

          {files.length > 0 && (
            <FileTree
              files={files}
              selectedPath={activeTab}
              onSelectFile={handleSelectFile}
              isLoading={isLoadingTree}
            />
          )}
        </aside>

        {/* Editor */}
        <div className="flex-1 flex flex-col min-w-0">
          <FileTabs
            openTabs={openTabs}
            activeTab={activeTab}
            onSelectTab={handleSelectTab}
            onCloseTab={handleCloseTab}
          />

          <div className="flex-1 overflow-hidden">
            {fileError && (
              <div className="p-4">
                <Alert variant="destructive" className="rounded-xl">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{fileError}</AlertDescription>
                </Alert>
              </div>
            )}

            {isLoadingFile && (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                <span className="inline-flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  Loading file…
                </span>
              </div>
            )}

            {!isLoadingFile && !activeTab && (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8 text-center">
                <FileCode className="w-10 h-10 mb-3 opacity-40" />
                <p className="text-sm">Select a file from the tree to view its contents</p>
              </div>
            )}

            {!isLoadingFile && activeTab && (
              <CodeEditor content={fileContent} filePath={activeTab} isLoading={false} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
