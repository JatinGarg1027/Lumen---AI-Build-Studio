import { AlertCircle, X, Wrench, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";

export interface RuntimeError {
  message: string;
  source?: string;
  lineno?: number;
  colno?: number;
  filename?: string;
  stack?: string;
}

interface RuntimeErrorAlertProps {
  error: RuntimeError | null;
  onDismiss: () => void;
  onFix: (error: RuntimeError) => void;
}

export function RuntimeErrorAlert({ error, onDismiss, onFix }: RuntimeErrorAlertProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!error) return null;

  return (
    <div
      className="absolute bottom-4 right-4 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300"
      role="alert"
    >
      <div className="w-[400px] glass-strong rounded-2xl shadow-lifted overflow-hidden border border-destructive/30">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-destructive/10 border-b border-destructive/20">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-destructive/15 flex items-center justify-center shrink-0">
              <AlertCircle className="w-4 h-4 text-destructive" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">Issues detected</h3>
              <p className="text-xs text-destructive">1 error found</p>
            </div>
          </div>
          <button
            onClick={onDismiss}
            aria-label="Dismiss error"
            className="text-muted-foreground hover:text-foreground transition-colors"
            data-testid="runtime-error-dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <button
            className="group w-full text-left"
            onClick={() => setIsExpanded(!isExpanded)}
            aria-expanded={isExpanded}
          >
            <div className="flex items-start gap-2">
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
              ) : (
                <ChevronRight className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-destructive/15 text-destructive border border-destructive/20">
                    {error.source || "Runtime"}
                  </span>
                  {error.filename && (
                    <span
                      className="text-[11px] text-muted-foreground truncate max-w-[200px]"
                      title={error.filename}
                    >
                      on {error.filename.split("/").pop()}
                    </span>
                  )}
                </div>
                <p
                  className={cn(
                    "text-xs font-mono text-foreground/90 break-words leading-relaxed",
                    !isExpanded && "line-clamp-2",
                  )}
                >
                  {error.message}
                </p>
              </div>
            </div>
          </button>

          {isExpanded && error.stack && (
            <div className="mt-3 pl-6">
              <div className="p-3 bg-muted/40 rounded-lg border border-border/50">
                <pre className="text-[10px] text-muted-foreground whitespace-pre-wrap font-mono overflow-auto max-h-[200px]">
                  {error.stack}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-muted/30 flex items-center justify-between border-t border-border/50">
          <button
            onClick={onDismiss}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2"
          >
            Dismiss
          </button>
          <Button
            size="sm"
            onClick={() => onFix(error)}
            className="h-8 px-3 text-xs font-semibold btn-aurora rounded-lg border-0 gap-1.5"
            data-testid="runtime-error-fix"
          >
            <Wrench className="w-3.5 h-3.5" />
            Fix with AI
          </Button>
        </div>
      </div>
    </div>
  );
}
