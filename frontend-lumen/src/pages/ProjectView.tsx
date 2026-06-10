import { useState, useCallback, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Code,
  Sparkles,
  MoreVertical,
  Trash,
  Download,
  Edit,
  ArrowLeft,
  Share2,
  Eye,
} from "lucide-react";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { ChatPanel, ChatMessage } from "@/components/ChatPanel";
import { CodePanel } from "@/components/CodePanel";
import { PreviewPanel } from "@/components/PreviewPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  api,
  isAuthenticated,
  removeAuthToken,
  getUserInfo,
  removeUserInfo,
} from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

import { RuntimeErrorAlert, RuntimeError } from "@/components/RuntimeErrorAlert";
import { generateGradient, cn } from "@/lib/utils";
import { ProjectResponse } from "@/lib/types";
import { ShareDialog } from "@/components/ShareDialog";
import { UpgradeDialog } from "@/components/UpgradeDialog";
import { LogoMark } from "@/components/brand/Logo";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { useIsMobile } from "@/hooks/use-mobile";

type ViewMode = "code" | "preview";
type MobileTab = "chat" | "workspace";

export function ProjectView() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("preview");
  const [updatedFiles, setUpdatedFiles] = useState<Map<string, string>>(new Map());
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [runtimeError, setRuntimeError] = useState<RuntimeError | null>(null);
  const [project, setProject] = useState<ProjectResponse | null>(null);
  const [mobileTab, setMobileTab] = useState<MobileTab>("chat");

  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [renameName, setRenameName] = useState("");

  const currentEditedFilesRef = useRef<string[]>([]);

  useEffect(() => {
    if (!isAuthenticated()) navigate("/login");
  }, [navigate]);

  useEffect(() => {
    if (!projectId) return;
    const loadData = async () => {
      setIsLoadingHistory(true);
      try {
        const [history, projectData] = await Promise.all([
          api.getChatHistory(projectId),
          api.getProject(projectId),
        ]);
        const formattedMessages: ChatMessage[] = history.map((msg) => ({
          id: msg.id.toString(),
          role: msg.role === "USER" ? "user" : "assistant",
          content: msg.content,
          createdAt: msg.createdAt,
          events: msg.events,
        }));
        setMessages(formattedMessages);
        setProject(projectData);
      } catch (error) {
        console.error("Failed to load project data:", error);
        toast({
          title: "Error",
          description: "Failed to load project data",
          variant: "destructive",
        });
      } finally {
        setIsLoadingHistory(false);
      }
    };
    loadData();
  }, [projectId, toast]);

  const handleLogout = () => {
    removeAuthToken();
    removeUserInfo();
    navigate("/login");
  };

  const handleSendMessage = useCallback(
    (content: string) => {
      if (!projectId) return;
      currentEditedFilesRef.current = [];

      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        role: "user",
        content,
      };
      setMessages((prev) => [...prev, userMessage]);
      setIsStreaming(true);

      const aiMessageId = (Date.now() + 1).toString();
      const aiMessage: ChatMessage = {
        id: aiMessageId,
        role: "assistant",
        content: "",
        isStreaming: true,
        editedFiles: [],
      };
      setMessages((prev) => [...prev, aiMessage]);

      // Auto-switch to workspace on mobile so user sees code/preview
      if (isMobile) setMobileTab("workspace");

      const cleanup = api.streamChat(
        projectId,
        content,
        (chunk) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === aiMessageId
                ? { ...msg, content: msg.content + chunk, isStreaming: true }
                : msg,
            ),
          );
        },
        (path, fileContent) => {
          setUpdatedFiles((prev) => new Map(prev).set(path, fileContent));
          if (!currentEditedFilesRef.current.includes(path)) {
            currentEditedFilesRef.current.push(path);
          }
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === aiMessageId
                ? { ...msg, editedFiles: [...currentEditedFilesRef.current] }
                : msg,
            ),
          );
        },
        () => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === aiMessageId
                ? { ...msg, isStreaming: false, editedFiles: [...currentEditedFilesRef.current] }
                : msg,
            ),
          );
          setIsStreaming(false);
        },
        (error) => {
          toast({
            title: "Chat error",
            description: error.message,
            variant: "destructive",
          });
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === aiMessageId
                ? { ...msg, content: "Sorry, an error occurred.", isStreaming: false }
                : msg,
            ),
          );
          setIsStreaming(false);
        },
      );

      return cleanup;
    },
    [projectId, toast, isMobile],
  );

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const data = event.data;
      if (data?.type === "PreviewError") {
        const error = data.payload;
        setRuntimeError({
          message: error.message,
          source: data.subType,
          stack: error.stack,
          filename: error.source,
          lineno: error.lineno,
          colno: error.colno,
        });
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const handleFixError = useCallback(
    (error: RuntimeError) => {
      const prompt = `I encountered a ${error.source || "runtime error"} in my application:

Error Message: ${error.message}
${error.filename ? `File: ${error.filename}` : ""}
${error.lineno ? `Line: ${error.lineno}` : ""}

Stack Trace:
${error.stack || "No stack trace available"}

Please analyze this error and fix the code to resolve it.`;
      handleSendMessage(prompt);
      setRuntimeError(null);
    },
    [handleSendMessage],
  );

  const handleDeleteProject = async () => {
    if (!projectId) return;
    if (!confirm("Delete this project? This action cannot be undone.")) return;
    try {
      await api.deleteProject(projectId);
      navigate("/projects");
      toast({ title: "Project deleted" });
    } catch (error) {
      console.error("Failed to delete:", error);
      toast({ title: "Error", description: "Failed to delete project", variant: "destructive" });
    }
  };

  const handleDownloadProject = async () => {
    if (!projectId) return;
    try {
      const blob = await api.downloadProjectZip(projectId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `project-${projectId}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast({ title: "Download started" });
    } catch (error) {
      console.error("Failed to download:", error);
      toast({ title: "Error", description: "Failed to download project", variant: "destructive" });
    }
  };

  const openRenameDialog = () => {
    if (project) {
      setRenameName(project.name);
      setIsRenameDialogOpen(true);
    }
  };

  const handleRenameSubmit = async () => {
    if (!projectId || !renameName.trim()) return;
    try {
      const updated = await api.updateProject(projectId, renameName);
      setProject((prev) => (prev ? { ...prev, name: updated.name } : null));
      setIsRenameDialogOpen(false);
      toast({ title: "Project renamed" });
    } catch (error) {
      console.error("Failed to rename:", error);
      toast({ title: "Error", description: "Failed to rename project", variant: "destructive" });
    }
  };

  if (!projectId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Invalid project ID</p>
      </div>
    );
  }

  const userInfo = getUserInfo();
  const initial = userInfo?.name?.charAt(0).toUpperCase() || "U";
  const readOnly = project?.role === "VIEWER";

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      {/* ============== Header ============== */}
      <header className="h-14 shrink-0 border-b border-border/60 bg-background/80 backdrop-blur-xl flex items-center px-3 sm:px-4 gap-2 sm:gap-3">
        {/* Left: back + project identity */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/projects")}
          aria-label="Back to projects"
          data-testid="back-to-projects"
          className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>

        <div className="hidden sm:flex items-center shrink-0">
          <LogoMark size={24} />
        </div>
        <span aria-hidden="true" className="hidden sm:block h-5 w-px bg-border/70 mx-1" />

        <div className="flex items-center gap-2 min-w-0 flex-1 sm:flex-initial">
          {project ? (
            <>
              <div
                className="w-7 h-7 rounded-lg shadow-soft shrink-0 ring-1 ring-border/50"
                style={generateGradient(project.name)}
                aria-hidden="true"
              />
              <div className="flex flex-col min-w-0">
                <span className="font-semibold text-[13px] truncate leading-tight">
                  {project.name}
                </span>
                <span className="hidden sm:block text-[10px] text-muted-foreground leading-tight">
                  Last saved · auto-sync
                </span>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-muted animate-pulse" />
              <span className="text-[13px] text-muted-foreground">Loading…</span>
            </div>
          )}

          {!readOnly && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  aria-label="Project options"
                  data-testid="project-options-trigger"
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="glass-strong">
                <DropdownMenuItem onClick={openRenameDialog} className="cursor-pointer">
                  <Edit className="w-4 h-4 mr-2" />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDownloadProject} className="cursor-pointer">
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleDeleteProject}
                  className="text-destructive focus:text-destructive cursor-pointer"
                >
                  <Trash className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Center: View toggle (desktop only) */}
        <div className="hidden md:flex items-center bg-muted/40 rounded-xl p-0.5 mx-auto border border-border/40">
          <button
            onClick={() => setViewMode("preview")}
            className={cn(
              "flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium transition-all rounded-lg",
              viewMode === "preview"
                ? "bg-background text-foreground shadow-soft"
                : "text-muted-foreground hover:text-foreground",
            )}
            data-testid="viewmode-preview-button"
            aria-pressed={viewMode === "preview"}
          >
            <Eye className="w-3.5 h-3.5" />
            Preview
          </button>
          <button
            onClick={() => setViewMode("code")}
            className={cn(
              "flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium transition-all rounded-lg",
              viewMode === "code"
                ? "bg-background text-foreground shadow-soft"
                : "text-muted-foreground hover:text-foreground",
            )}
            data-testid="viewmode-code-button"
            aria-pressed={viewMode === "code"}
          >
            <Code className="w-3.5 h-3.5" />
            Code
          </button>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-1.5 ml-auto">
          {project?.role && (
            <span
              className={cn(
                "hidden sm:inline-flex text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md",
                project.role === "OWNER"
                  ? "bg-primary/15 text-primary"
                  : project.role === "EDITOR"
                    ? "bg-warning/15 text-warning"
                    : "bg-muted text-muted-foreground",
              )}
            >
              {project.role}
            </span>
          )}

          <ShareDialog
            projectId={projectId}
            trigger={
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs font-medium rounded-lg border-border/70 gap-1.5"
                disabled={readOnly}
                data-testid="share-button"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Share</span>
              </Button>
            }
          />
          {!readOnly && (
            <>
              <UpgradeDialog
                trigger={
                  <Button
                    variant="outline"
                    size="sm"
                    className="hidden md:inline-flex h-8 text-xs rounded-lg gap-1.5 border-border/70 font-medium"
                    data-testid="upgrade-button"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-accent" />
                    Upgrade
                  </Button>
                }
              />
              <Button
                size="sm"
                className="h-8 text-xs font-semibold rounded-lg btn-aurora border-0"
                data-testid="publish-button"
              >
                Publish
              </Button>
            </>
          )}

          <span aria-hidden="true" className="h-6 w-px bg-border/70 mx-1 hidden sm:block" />

          <ThemeToggle size="sm" className="hidden sm:inline-flex" />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full"
                aria-label="Account menu"
                data-testid="user-menu-trigger"
              >
                <Avatar className="h-7 w-7 ring-2 ring-border/40">
                  <AvatarFallback className="bg-aurora-soft text-foreground text-[11px] font-semibold">
                    {initial}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="glass-strong">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium leading-none">{userInfo?.name || "User"}</p>
                <p className="text-xs text-muted-foreground mt-1 truncate">{userInfo?.username}</p>
              </div>
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-destructive focus:text-destructive cursor-pointer"
                data-testid="user-menu-logout"
              >
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* ============== Mobile workspace tab switcher ============== */}
      <div className="md:hidden border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="grid grid-cols-2">
          <button
            onClick={() => setMobileTab("chat")}
            className={cn(
              "py-2.5 text-xs font-semibold transition-colors",
              mobileTab === "chat"
                ? "text-foreground border-b-2 border-primary"
                : "text-muted-foreground border-b-2 border-transparent",
            )}
            data-testid="mobile-tab-chat"
          >
            Chat
          </button>
          <button
            onClick={() => setMobileTab("workspace")}
            className={cn(
              "py-2.5 text-xs font-semibold transition-colors",
              mobileTab === "workspace"
                ? "text-foreground border-b-2 border-primary"
                : "text-muted-foreground border-b-2 border-transparent",
            )}
            data-testid="mobile-tab-workspace"
          >
            {viewMode === "preview" ? "Preview" : "Code"}
          </button>
        </div>
        {mobileTab === "workspace" && (
          <div className="flex items-center justify-center bg-muted/30 px-3 py-1.5">
            <div className="flex items-center bg-card/80 rounded-xl p-0.5 border border-border/40">
              <button
                onClick={() => setViewMode("preview")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1 text-xs font-medium transition-all rounded-lg",
                  viewMode === "preview"
                    ? "bg-background text-foreground shadow-soft"
                    : "text-muted-foreground",
                )}
              >
                <Eye className="w-3 h-3" /> Preview
              </button>
              <button
                onClick={() => setViewMode("code")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1 text-xs font-medium transition-all rounded-lg",
                  viewMode === "code"
                    ? "bg-background text-foreground shadow-soft"
                    : "text-muted-foreground",
                )}
              >
                <Code className="w-3 h-3" /> Code
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ============== Main content ============== */}
      <div className="flex-1 overflow-hidden">
        {/* Desktop: resizable split */}
        <div className="hidden md:block h-full">
          <ResizablePanelGroup direction="horizontal" className="h-full">
            <ResizablePanel defaultSize={36} minSize={26} maxSize={50}>
              <div className="h-full border-r border-border/60 bg-panel">
                <ChatPanel
                  messages={messages}
                  onSendMessage={handleSendMessage}
                  isStreaming={isStreaming}
                  isLoading={isLoadingHistory}
                  readOnly={readOnly}
                />
              </div>
            </ResizablePanel>
            <ResizableHandle className="w-px bg-border/60 hover:bg-primary/50 transition-colors" />
            <ResizablePanel defaultSize={64} minSize={50} maxSize={74}>
              <div className="h-full relative">
                <div className={cn("h-full absolute inset-0", viewMode !== "code" && "hidden")}>
                  <CodePanel
                    projectId={projectId}
                    updatedFiles={updatedFiles}
                    isStreaming={isStreaming}
                    viewMode={viewMode}
                  />
                </div>
                <div className={cn("h-full absolute inset-0", viewMode !== "preview" && "hidden")}>
                  <PreviewPanel
                    projectId={projectId}
                    runtimeError={runtimeError}
                    onDismiss={() => setRuntimeError(null)}
                    onFix={handleFixError}
                  />
                </div>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>

        {/* Mobile: single-view tabs */}
        <div className="md:hidden h-full">
          <div className={cn("h-full", mobileTab === "chat" ? "block" : "hidden")}>
            <ChatPanel
              messages={messages}
              onSendMessage={handleSendMessage}
              isStreaming={isStreaming}
              isLoading={isLoadingHistory}
              readOnly={readOnly}
            />
          </div>
          <div className={cn("h-full", mobileTab === "workspace" ? "block" : "hidden")}>
            <div className="h-full relative">
              <div className={cn("h-full absolute inset-0", viewMode !== "code" && "hidden")}>
                <CodePanel
                  projectId={projectId}
                  updatedFiles={updatedFiles}
                  isStreaming={isStreaming}
                  viewMode={viewMode}
                />
              </div>
              <div className={cn("h-full absolute inset-0", viewMode !== "preview" && "hidden")}>
                <PreviewPanel
                  projectId={projectId}
                  runtimeError={runtimeError}
                  onDismiss={() => setRuntimeError(null)}
                  onFix={handleFixError}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rename Dialog */}
      <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <DialogContent className="glass-strong rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display">Rename project</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={renameName}
              onChange={(e) => setRenameName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleRenameSubmit()}
              className="h-11 rounded-xl"
              autoFocus
            />
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setIsRenameDialogOpen(false)}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={handleRenameSubmit}
              disabled={!renameName.trim() || renameName === project?.name}
              className="rounded-xl btn-aurora border-0"
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
