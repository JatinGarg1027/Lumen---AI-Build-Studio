import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Lightbulb, Database, FileEdit, Loader2 } from "lucide-react";
import { ChatEvent, ChatEventType } from "@/lib/types";
import { cn } from "@/lib/utils";

export const ChatEventRenderer = ({
  event,
  isLoading,
}: {
  event: ChatEvent;
  isLoading?: boolean;
}) => {
  switch (event.type) {
    case ChatEventType.THOUGHT:
      return (
        <div className="flex items-center gap-2 text-muted-foreground text-[13px] font-normal">
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
          ) : (
            <Lightbulb className="w-4 h-4" />
          )}
          <span className="italic">{event.content}</span>
        </div>
      );

    case ChatEventType.TOOL_LOG:
      return <CollapsibleEvent icon={<Database className="w-4 h-4" />} label="Read" event={event} />;

    case ChatEventType.FILE_EDIT:
      return (
        <CollapsibleEvent
          icon={
            isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
            ) : (
              <FileEdit className="w-4 h-4" />
            )
          }
          label={isLoading ? "Editing" : "Edited"}
          event={event}
          hideToggle
          forceSingleLine={isLoading}
        />
      );

    case ChatEventType.MESSAGE:
      return (
        <div
          className={cn(
            "prose prose-sm dark:prose-invert max-w-none leading-relaxed text-foreground",
            "prose-headings:font-display prose-headings:tracking-tight",
            "prose-code:bg-muted prose-code:rounded prose-code:px-1.5 prose-code:py-0.5 prose-code:font-mono prose-code:text-[12px] prose-code:before:content-none prose-code:after:content-none",
            "prose-pre:bg-muted prose-pre:border prose-pre:border-border/60 prose-pre:rounded-xl",
            "prose-p:my-2 prose-ul:my-2 prose-ol:my-2",
            "prose-a:text-primary prose-a:no-underline hover:prose-a:underline",
            "prose-strong:text-foreground prose-strong:font-semibold",
          )}
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{event.content}</ReactMarkdown>
          {isLoading && <span className="streaming-cursor align-middle" />}
        </div>
      );

    default:
      return null;
  }
};

const CollapsibleEvent = ({
  icon,
  label,
  event,
  hideToggle = false,
  forceSingleLine = false,
}: {
  icon: React.ReactNode;
  label: string;
  event: ChatEvent;
  hideToggle?: boolean;
  forceSingleLine?: boolean;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const files =
    event.type === ChatEventType.FILE_EDIT
      ? ([event.filePath].filter(Boolean) as string[])
      : (event.metadata?.split(",") || []).filter(Boolean).map((f) => f.trim());

  if (files.length === 0) return null;

  const hasMultipleFiles = files.length > 1;
  const showButton = !hideToggle && hasMultipleFiles && !forceSingleLine;

  return (
    <div className="flex flex-col gap-2 my-1">
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="text-muted-foreground shrink-0">{icon}</div>
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="text-muted-foreground text-[13px] font-medium shrink-0">{label}</span>
            <span className="bg-muted text-foreground text-[12px] px-2 py-0.5 rounded-md font-mono border border-border/60 truncate">
              {files[0].split("/").pop()}
            </span>
            {!isExpanded && hasMultipleFiles && (
              <span className="text-muted-foreground text-[11px] whitespace-nowrap">
                +{files.length - 1} more
              </span>
            )}
          </div>
        </div>

        {showButton && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-muted-foreground hover:text-foreground text-[11px] font-medium bg-muted/50 px-2 py-0.5 rounded-md border border-border/60 transition-colors ml-4 shrink-0"
          >
            {isExpanded ? "Hide" : "Show"}
          </button>
        )}
      </div>

      {isExpanded && hasMultipleFiles && !forceSingleLine && (
        <div className="flex flex-col gap-1.5 pl-7">
          {files.slice(1).map((file, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-200"
            >
              <span className="bg-muted text-foreground text-[12px] px-2 py-0.5 rounded-md font-mono border border-border/60 truncate">
                {file.split("/").pop()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
