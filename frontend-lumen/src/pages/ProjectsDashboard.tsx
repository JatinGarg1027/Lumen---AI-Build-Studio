import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  Loader2,
  MoreVertical,
  Trash,
  Download,
  Edit,
  Sparkles,
  LayoutGrid,
  List,
  FolderOpen,
  Clock3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  api,
  removeAuthToken,
  removeUserInfo,
  getUserInfo,
} from "@/lib/api";
import { ProjectSummaryResponse } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { generateGradient, cn } from "@/lib/utils";
import { UpgradeDialog } from "@/components/UpgradeDialog";
import { AppHeader } from "@/components/layout/AppHeader";
import { AuroraBackground } from "@/components/brand/AuroraBackground";

type ViewMode = "grid" | "list";

export function ProjectsDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [projects, setProjects] = useState<ProjectSummaryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [view, setView] = useState<ViewMode>("list");

  const [isCreating, setIsCreating] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [projectToRename, setProjectToRename] = useState<ProjectSummaryResponse | null>(null);
  const [renameName, setRenameName] = useState("");

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const data = await api.getProjects();
      setProjects(data);
    } catch (error) {
      console.error("Failed to fetch projects:", error);
      toast({
        title: "Error",
        description: "Failed to load projects. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;
    setIsCreating(true);
    try {
      const newProject = await api.createProject(newProjectName);
      setProjects([newProject, ...projects]);
      setNewProjectName("");
      setIsDialogOpen(false);
      toast({ title: "Project created", description: `“${newProject.name}” is ready.` });
    } catch (error) {
      console.error("Failed to create project:", error);
      toast({
        title: "Error",
        description: "Failed to create project",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteProject = async (e: React.MouseEvent, projectId: number) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this project? This action cannot be undone.")) return;
    try {
      await api.deleteProject(projectId.toString());
      setProjects(projects.filter((p) => p.id !== projectId));
      toast({ title: "Project deleted" });
    } catch (error) {
      console.error("Failed to delete:", error);
      toast({ title: "Error", description: "Failed to delete project", variant: "destructive" });
    }
  };

  const handleDownloadProject = async (e: React.MouseEvent, projectId: number) => {
    e.stopPropagation();
    try {
      const blob = await api.downloadProjectZip(projectId.toString());
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

  const handleRenameClick = (e: React.MouseEvent, project: ProjectSummaryResponse) => {
    e.stopPropagation();
    setProjectToRename(project);
    setRenameName(project.name);
    setIsRenameDialogOpen(true);
  };

  const handleRenameSubmit = async () => {
    if (!projectToRename || !renameName.trim()) return;
    try {
      await api.updateProject(projectToRename.id.toString(), renameName);
      setProjects(
        projects.map((p) => (p.id === projectToRename.id ? { ...p, name: renameName } : p)),
      );
      setIsRenameDialogOpen(false);
      setProjectToRename(null);
      toast({ title: "Project renamed" });
    } catch (error) {
      console.error("Failed to rename:", error);
      toast({ title: "Error", description: "Failed to rename project", variant: "destructive" });
    }
  };

  const handleLogout = () => {
    removeAuthToken();
    removeUserInfo();
    navigate("/login");
  };

  const filteredProjects = useMemo(
    () =>
      projects.filter((project) =>
        project.name.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [projects, searchQuery],
  );

  const userInfo = getUserInfo();
  const firstName = userInfo?.name?.split(" ")[0];

  return (
    <div className="min-h-screen bg-background">
      <AppHeader user={userInfo} onLogout={handleLogout} />

      <main className="container max-w-screen-2xl py-8 sm:py-10">
        {/* Hero strip */}
        <section className="relative overflow-hidden rounded-2xl glass-panel mb-10 px-6 sm:px-10 py-8 sm:py-10">
          <AuroraBackground variant="subtle" className="opacity-40" />
          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground font-medium mb-2">
                {firstName ? `Welcome back, ${firstName}` : "Welcome back"}
              </p>
              <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight">
                Your build <span className="gradient-text">studio</span>.
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground mt-2 max-w-xl">
                Open a project to keep iterating, or start fresh — describe an idea and let Lumen
                scaffold the first version for you.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <UpgradeDialog
                trigger={
                  <Button
                    variant="outline"
                    className="gap-2 h-10 rounded-xl border-border/70 bg-card/50 hover:bg-card font-medium"
                    data-testid="upgrade-button"
                  >
                    <Sparkles className="w-4 h-4 text-accent" />
                    Upgrade
                  </Button>
                }
              />

              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    className="h-10 px-5 rounded-xl btn-aurora text-sm font-semibold border-0 gap-2"
                    data-testid="new-project-button"
                  >
                    <Plus className="w-4 h-4" />
                    New project
                  </Button>
                </DialogTrigger>
                <DialogContent className="glass-strong sm:max-w-md rounded-2xl">
                  <DialogHeader>
                    <DialogTitle className="font-display text-xl">Create a new project</DialogTitle>
                    <DialogDescription>
                      Give it a name to get started. You can rename it anytime.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                    <Input
                      placeholder="e.g. Acme dashboard, Notes AI…"
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleCreateProject()}
                      className="h-11 rounded-xl"
                      autoFocus
                      data-testid="new-project-name-input"
                    />
                  </div>
                  <DialogFooter className="gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                      className="rounded-xl"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateProject}
                      disabled={isCreating || !newProjectName.trim()}
                      className="rounded-xl btn-aurora border-0"
                      data-testid="new-project-create-confirm"
                    >
                      {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Create project
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </section>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search projects…"
                className="pl-10 h-10 rounded-xl bg-card/60 border-border/70"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search projects"
                data-testid="projects-search-input"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground hidden sm:inline">
              {loading ? "…" : `${filteredProjects.length} ${filteredProjects.length === 1 ? "project" : "projects"}`}
            </span>
            <div className="flex items-center bg-muted/50 rounded-xl p-1 border border-border/40">
              <button
                onClick={() => setView("grid")}
                aria-label="Grid view"
                aria-pressed={view === "grid"}
                data-testid="view-grid-button"
                className={cn(
                  "p-1.5 rounded-lg transition-colors",
                  view === "grid"
                    ? "bg-background text-foreground shadow-soft"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setView("list")}
                aria-label="List view"
                aria-pressed={view === "list"}
                data-testid="view-list-button"
                className={cn(
                  "p-1.5 rounded-lg transition-colors",
                  view === "list"
                    ? "bg-background text-foreground shadow-soft"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Rename dialog */}
        <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
          <DialogContent className="glass-strong sm:max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle className="font-display text-xl">Rename project</DialogTitle>
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
                disabled={!renameName.trim() || renameName === projectToRename?.name}
                className="rounded-xl btn-aurora border-0"
              >
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Projects */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div
                key={i}
                className="rounded-2xl border border-border/50 bg-card/50 overflow-hidden animate-pulse"
              >
                <div className="aspect-[16/10] bg-muted/60" />
                <div className="p-4 space-y-2">
                  <div className="h-4 w-2/3 rounded bg-muted/60" />
                  <div className="h-3 w-1/3 rounded bg-muted/40" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredProjects.length === 0 ? (
          <EmptyState
            isSearch={!!searchQuery}
            onCreate={() => setIsDialogOpen(true)}
            onClear={() => setSearchQuery("")}
          />
        ) : view === "grid" ? (
          <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
            data-testid="projects-grid"
          >
            {filteredProjects.map((project, idx) => (
              <ProjectCard
                key={project.id}
                project={project}
                index={idx}
                onOpen={() => navigate(`/projects/${project.id}`)}
                onRename={(e) => handleRenameClick(e, project)}
                onDownload={(e) => handleDownloadProject(e, project.id)}
                onDelete={(e) => handleDeleteProject(e, project.id)}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-border/60 overflow-hidden bg-card/50" data-testid="projects-list">
            <ul className="divide-y divide-border/50">
              {filteredProjects.map((project) => (
                <ProjectRow
                  key={project.id}
                  project={project}
                  onOpen={() => navigate(`/projects/${project.id}`)}
                  onRename={(e) => handleRenameClick(e, project)}
                  onDownload={(e) => handleDownloadProject(e, project.id)}
                  onDelete={(e) => handleDeleteProject(e, project.id)}
                />
              ))}
            </ul>
          </div>
        )}
      </main>
    </div>
  );
}

/* ============================================================ */
/* Sub-components                                                */
/* ============================================================ */

function EmptyState({
  isSearch,
  onCreate,
  onClear,
}: {
  isSearch: boolean;
  onCreate: () => void;
  onClear: () => void;
}) {
  return (
    <div className="text-center py-20 rounded-2xl border border-dashed border-border/70 bg-card/30">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-aurora-soft border border-border/60 mb-5">
        <FolderOpen className="w-6 h-6 text-primary" />
      </div>
      <h3 className="font-display text-xl font-semibold mb-1.5">
        {isSearch ? "No matches" : "Your studio is empty"}
      </h3>
      <p className="text-sm text-muted-foreground mb-7 max-w-sm mx-auto">
        {isSearch
          ? "Try a different search, or clear the filter to see everything."
          : "Spin up your first project — describe what you want to build and Lumen will scaffold it."}
      </p>
      <div className="flex items-center justify-center gap-2">
        {isSearch ? (
          <Button onClick={onClear} variant="outline" className="rounded-xl">
            Clear search
          </Button>
        ) : (
          <Button onClick={onCreate} className="rounded-xl btn-aurora border-0 gap-2">
            <Plus className="w-4 h-4" />
            Create your first project
          </Button>
        )}
      </div>
    </div>
  );
}

interface ProjectCardActions {
  project: ProjectSummaryResponse;
  onOpen: () => void;
  onRename: (e: React.MouseEvent) => void;
  onDownload: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
}

function ProjectCard({
  project,
  index,
  onOpen,
  onRename,
  onDownload,
  onDelete,
}: ProjectCardActions & { index: number }) {
  return (
    <article
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      data-testid={`project-card-${project.id}`}
      className="group relative cursor-pointer rounded-2xl border border-border/60 bg-card/60 backdrop-blur-md overflow-hidden hover:-translate-y-1 hover:shadow-lifted hover:border-border transition-all duration-300 animate-slide-up"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      {/* Thumbnail */}
      <div className="aspect-[16/10] relative overflow-hidden">
        {project.thumbnailUrl ? (
          <img
            src={project.thumbnailUrl}
            alt={project.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div
            className="w-full h-full transition-transform duration-500 group-hover:scale-105"
            style={generateGradient(project.name)}
            aria-hidden="true"
          />
        )}
        {/* Subtle vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60" />
        {/* Role chip */}
        {project.role && (
          <span
            className={cn(
              "absolute top-3 left-3 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md backdrop-blur",
              project.role === "OWNER"
                ? "bg-primary/90 text-primary-foreground"
                : project.role === "EDITOR"
                  ? "bg-warning/90 text-warning-foreground"
                  : "bg-background/80 text-foreground border border-border/60",
            )}
          >
            {project.role}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-[15px] tracking-tight truncate group-hover:text-primary transition-colors">
            {project.name}
          </h3>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Project actions"
                data-testid={`project-actions-${project.id}`}
                className="h-7 w-7 -mt-1 -mr-1.5 text-muted-foreground hover:text-foreground"
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="glass-strong">
              <DropdownMenuItem onClick={onRename} className="cursor-pointer">
                <Edit className="w-4 h-4 mr-2" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDownload} className="cursor-pointer">
                <Download className="w-4 h-4 mr-2" />
                Download
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={onDelete}
                className="text-destructive focus:text-destructive cursor-pointer"
              >
                <Trash className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <p className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Clock3 className="w-3 h-3" />
          Updated {new Date(project.createdAt).toLocaleDateString()}
        </p>
      </div>
    </article>
  );
}

function ProjectRow({ project, onOpen, onRename, onDownload, onDelete }: ProjectCardActions) {
  return (
    <li
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      data-testid={`project-row-${project.id}`}
      className="group flex items-center gap-4 px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors"
    >
      <div
        className="w-12 h-12 rounded-xl shrink-0 overflow-hidden ring-1 ring-border/50"
        aria-hidden="true"
      >
        {project.thumbnailUrl ? (
          <img src={project.thumbnailUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full" style={generateGradient(project.name)} />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
            {project.name}
          </h3>
          {project.role && (
            <span
              className={cn(
                "text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded",
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
        </div>
        <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
          <Clock3 className="w-3 h-3" />
          Updated {new Date(project.createdAt).toLocaleDateString()}
        </p>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Project actions"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <MoreVertical className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="glass-strong">
          <DropdownMenuItem onClick={onRename} className="cursor-pointer">
            <Edit className="w-4 h-4 mr-2" />
            Rename
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onDownload} className="cursor-pointer">
            <Download className="w-4 h-4 mr-2" />
            Download
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={onDelete}
            className="text-destructive focus:text-destructive cursor-pointer"
          >
            <Trash className="w-4 h-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  );
}
