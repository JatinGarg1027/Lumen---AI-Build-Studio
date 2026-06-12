import { useState, useEffect, useRef } from "react";
import { Play, Loader2, ExternalLink, RefreshCw, Globe, MonitorSmartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api, PREVIEW_URL_KEY } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

import { RuntimeErrorAlert, RuntimeError } from "@/components/RuntimeErrorAlert";
import { LogoMark } from "@/components/brand/Logo";

interface PreviewPanelProps {
  projectId: string;
  runtimeError: RuntimeError | null;
  onDismiss: () => void;
  onFix: (error: RuntimeError) => void;
  isAiFixing?: boolean;
}

export function PreviewPanel({ projectId, runtimeError, onDismiss, onFix, isAiFixing }: PreviewPanelProps) {
  const storageKey = `${PREVIEW_URL_KEY}-${projectId}`;
  const [previewUrl, setPreviewUrl] = useState<string | null>(() => localStorage.getItem(storageKey));
  const [isDeploying, setIsDeploying] = useState(false);
  const { toast } = useToast();

  const handleDeploy = async () => {
    setIsDeploying(true);
    try {
      const response = await api.deploy(projectId);
      setPreviewUrl(response.previewUrl);
      localStorage.setItem(storageKey, response.previewUrl);
      toast({ title: "Preview ready", description: "Your sandbox is live." });
    } catch (error) {
      toast({
        title: "Deployment failed",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsDeploying(false);
    }
  };

  const prevIsAiFixing = useRef(isAiFixing);
  useEffect(() => {
    if (prevIsAiFixing.current && !isAiFixing) {
      handleDeploy();
    }
    prevIsAiFixing.current = isAiFixing;
  }, [isAiFixing]);

  const handleRefresh = () => {
    const iframe = document.querySelector("iframe");
    if (iframe) iframe.src = iframe.src;
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* URL bar */}
      <div className="h-12 shrink-0 flex items-center gap-2 px-3 border-b border-border/60 bg-panel">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleRefresh}
          disabled={!previewUrl}
          className="h-7 w-7 text-muted-foreground hover:text-foreground"
          aria-label="Refresh preview"
          data-testid="preview-refresh"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </Button>

        <div className="flex-1 flex items-center h-8 px-3 rounded-lg bg-muted/40 border border-border/40 text-xs text-muted-foreground min-w-0">
          <div className="flex items-center gap-1.5 mr-2 shrink-0">
            <span className={`w-2 h-2 rounded-full ${previewUrl ? "bg-success" : "bg-muted-foreground/40"}`} />
            <Globe className="w-3 h-3" />
          </div>
          <span className="truncate font-mono">{previewUrl || "No preview yet — click Run"}</span>
        </div>

        <div className="flex items-center gap-1">
          {previewUrl && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => window.open(previewUrl, "_blank")}
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              aria-label="Open preview in new tab"
              data-testid="preview-external"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </Button>
          )}
          <Button
            onClick={handleDeploy}
            disabled={isDeploying}
            size="sm"
            className="h-7 px-3 text-xs font-semibold btn-aurora rounded-lg border-0"
            data-testid="preview-deploy"
          >
            {isDeploying ? (
              <>
                <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                Deploying
              </>
            ) : (
              <>
                <Play className="w-3 h-3 mr-1.5" />
                Run preview
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Preview area */}
      <div className="flex-1 bg-muted/40 relative">
        {previewUrl ? (
          <iframe
            src={previewUrl}
            className="w-full h-full border-0 bg-white"
            title="Application preview"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          />
        ) : isDeploying ? (
          <DeployingState />
        ) : (
          <EmptyPreviewState onDeploy={handleDeploy} />
        )}

        {isAiFixing && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center text-center p-8 z-50 animate-in fade-in duration-200">
            <div className="relative mb-5">
              <div className="absolute -inset-4 rounded-full bg-primary/20 blur-2xl opacity-80 animate-pulse" />
              <div className="relative w-16 h-16 rounded-2xl glass border border-border/60 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
            </div>
            <h3 className="font-display text-lg font-semibold mb-1">
              ✨ AI Auto-Healing Active
            </h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              An error was detected in your application. The AI is automatically correcting the code and redeploying.
            </p>
          </div>
        )}
      </div>

      <RuntimeErrorAlert error={runtimeError} onDismiss={onDismiss} onFix={onFix} />
    </div>
  );
}

function EmptyPreviewState({ onDeploy }: { onDeploy: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-mesh">
      <div className="relative mb-5">
        <div className="absolute -inset-4 rounded-full bg-aurora-soft blur-2xl opacity-80" />
        <div className="relative w-16 h-16 rounded-2xl glass border border-border/60 flex items-center justify-center">
          <MonitorSmartphone className="w-7 h-7 text-primary" />
        </div>
      </div>
      <h3 className="font-display text-xl font-semibold mb-1.5">
        Live preview <span className="gradient-text">waiting</span>
      </h3>
      <p className="text-sm text-muted-foreground max-w-xs mb-6">
        Deploy a sandbox preview to see your project running in real time.
      </p>
      <Button
        onClick={onDeploy}
        className="rounded-xl btn-aurora border-0 gap-2 h-10 px-5 text-sm font-semibold"
      >
        <Play className="w-4 h-4" />
        Run preview
      </Button>
    </div>
  );
}

function DeployingState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-mesh">
      <div className="relative mb-5">
        <div className="absolute -inset-4 rounded-full bg-aurora-soft blur-2xl opacity-80 animate-pulse" />
        <div className="relative">
          <LogoMark size={56} animated />
        </div>
      </div>
      <h3 className="font-display text-xl font-semibold mb-1.5">
        Deploying your <span className="gradient-text">preview</span>
      </h3>
      <p className="text-sm text-muted-foreground max-w-xs">
        Building and spinning up a sandbox — this usually takes a few seconds.
      </p>
      <div className="mt-5 flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
        <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse delay-200" />
        <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse delay-500" />
      </div>
    </div>
  );
}
