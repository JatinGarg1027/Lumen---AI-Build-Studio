import { useState, useRef, useEffect } from "react";
import {
  Send,
  Loader2,
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  Copy,
  RotateCcw,
  Lock,
  Wand2,
  LayoutDashboard,
  ShoppingBag,
  Smile,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { useStreamParser } from "../hooks/use-stream-parser";
import { ChatEventRenderer } from "./ChatEventRenderer";
import { ChatEvent } from "@/lib/types";
import { LogoMark } from "@/components/brand/Logo";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
  createdAt?: string;
  events?: ChatEvent[];
  editedFiles?: string[];
}

interface ChatPanelProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  isStreaming: boolean;
  isLoading?: boolean;
  readOnly?: boolean;
}

const SUGGESTED_PROMPTS = [
  {
    icon: LayoutDashboard,
    title: "SaaS landing page",
    prompt:
      "Build a modern landing page for an AI note-taking app with hero, feature grid, testimonials and pricing.",
  },
  {
    icon: ShoppingBag,
    title: "Storefront",
    prompt:
      "Create a minimal e-commerce product page with image gallery, variant selector and a sticky add-to-cart bar.",
  },
  {
    icon: Wand2,
    title: "Interactive demo",
    prompt:
      "Make a delightful playground that visualises a sorting algorithm with controls to choose bubble, quick or merge sort.",
  },
  {
    icon: Smile,
    title: "Surprise me",
    prompt: "Surprise me with a creative single-page app that demos something fun and shareable.",
  },
];

export function ChatPanel({
  messages,
  onSendMessage,
  isStreaming,
  isLoading,
  readOnly,
}: ChatPanelProps) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const submit = (value: string) => {
    if (!value.trim() || isStreaming) return;
    onSendMessage(value.trim());
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submit(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit(input);
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const ta = e.target;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 200)}px`;
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto" data-testid="chat-messages-container">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="text-xs">Loading conversation…</span>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <EmptyState onPrompt={submit} readOnly={readOnly} />
        ) : (
          <div className="flex flex-col">
            {messages.map((message) => (
              <MessageItem
                key={message.id}
                message={message}
                isStreaming={isStreaming && !!message.isStreaming}
              />
            ))}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 p-3 sm:p-4 border-t border-border/60 bg-background">
        <form
          onSubmit={handleSubmit}
          className={cn(
            "relative rounded-2xl border border-border/70 bg-card/60 backdrop-blur-sm",
            "transition-all focus-within:border-primary/60 focus-within:shadow-glow/30",
            readOnly && "opacity-70",
          )}
        >
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder={
              readOnly
                ? "You have view-only access to this project"
                : "Describe what you want Lumen to build…"
            }
            className="min-h-[56px] max-h-[200px] pr-14 pl-4 py-3.5 resize-none bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm placeholder:text-muted-foreground/70 rounded-2xl"
            disabled={isStreaming || readOnly}
            rows={1}
            data-testid="chat-input"
            aria-label="Chat input"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || isStreaming || readOnly}
            aria-label="Send message"
            data-testid="chat-send-button"
            className={cn(
              "absolute right-2 bottom-2 h-9 w-9 rounded-xl border-0",
              !input.trim() || isStreaming || readOnly
                ? "bg-muted text-muted-foreground"
                : "btn-aurora",
            )}
          >
            {isStreaming ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </form>

        <div className="flex items-center mt-2 px-1">
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            {readOnly ? (
              <>
                <Lock className="w-3 h-3" /> Read-only access
              </>
            ) : (
              <>
                <Sparkles className="w-3 h-3 text-accent" />
                <span>Lumen · AI engineer</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================ */
/* Empty state with suggested prompts                           */
/* ============================================================ */

function EmptyState({
  onPrompt,
  readOnly,
}: {
  onPrompt: (p: string) => void;
  readOnly?: boolean;
}) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-6 sm:p-8">
      <div className="relative mb-5">
        <div className="absolute -inset-3 rounded-full bg-aurora-soft blur-xl opacity-80" />
        <div className="relative">
          <LogoMark size={56} animated />
        </div>
      </div>
      <h3 className="font-display text-xl font-semibold mb-1.5">
        What shall we <span className="gradient-text">build</span> today?
      </h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-7">
        {readOnly
          ? "You have read-only access to this conversation."
          : "Describe an idea, tweak an existing project, or pick one of these starters:"}
      </p>

      {!readOnly && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md">
          {SUGGESTED_PROMPTS.map((s) => (
            <button
              key={s.title}
              onClick={() => onPrompt(s.prompt)}
              className="group text-left p-3 rounded-xl border border-border/60 bg-card/40 hover:bg-card hover:border-border hover:-translate-y-0.5 hover:shadow-soft transition-all"
              data-testid={`prompt-${s.title.toLowerCase().replace(/\s+/g, "-")}`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-7 h-7 rounded-lg bg-aurora-soft border border-border/40 flex items-center justify-center text-primary">
                  <s.icon className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-semibold text-foreground">{s.title}</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                {s.prompt}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================================================ */
/* Message item                                                  */
/* ============================================================ */

function MessageItem({ message, isStreaming }: { message: ChatMessage; isStreaming: boolean }) {
  const { toast } = useToast();
  const liveEvents = useStreamParser(message.content || "");
  const eventsToRender =
    message.events && message.events.length > 0 ? message.events : liveEvents;

  return (
    <div
      className={cn(
        "px-5 sm:px-6 py-5 border-b border-border/40 animate-fade-in",
        message.role === "user" ? "bg-transparent" : "bg-muted/20",
      )}
      data-testid={`message-${message.role}`}
    >
      <div className="max-w-3xl mx-auto">
        {message.role === "user" ? (
          <div className="flex flex-col items-end gap-1.5">
            <div className="bg-chat-user border border-primary/20 text-foreground text-sm py-2.5 px-4 rounded-2xl rounded-tr-md max-w-[90%]">
              <p className="leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>
            </div>
            {message.createdAt && (
              <span className="text-[10px] text-muted-foreground px-1 uppercase tracking-wider">
                {format(new Date(message.createdAt), "HH:mm")}
              </span>
            )}
          </div>
        ) : (
          <div className="flex gap-3">
            <div className="shrink-0">
              <LogoMark size={28} />
            </div>
            <div className="flex-1 min-w-0 space-y-3">
              <div className="flex flex-col gap-3">
                {eventsToRender.map((event, idx) => {
                  const isLast = idx === eventsToRender.length - 1;
                  return (
                    <ChatEventRenderer
                      key={idx}
                      event={event}
                      isLoading={isStreaming && isLast}
                    />
                  );
                })}
              </div>

              {!message.isStreaming && eventsToRender.length > 0 && (
                <div className="flex items-center gap-0.5 pt-1 -ml-1.5">
                  <IconButton label="Regenerate" data-testid="msg-regenerate">
                    <RotateCcw className="w-3.5 h-3.5" />
                  </IconButton>
                  <IconButton label="Helpful" data-testid="msg-thumbs-up">
                    <ThumbsUp className="w-3.5 h-3.5" />
                  </IconButton>
                  <IconButton label="Not helpful" data-testid="msg-thumbs-down">
                    <ThumbsDown className="w-3.5 h-3.5" />
                  </IconButton>
                  <IconButton
                    label="Copy"
                    data-testid="msg-copy"
                    onClick={() => {
                      navigator.clipboard.writeText(message.content || "");
                      toast({ title: "Copied to clipboard" });
                    }}
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </IconButton>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function IconButton({
  label,
  children,
  onClick,
  ...rest
}: {
  label: string;
  children: React.ReactNode;
  onClick?: () => void;
} & Record<string, unknown>) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
      {...rest}
    >
      {children}
    </button>
  );
}
