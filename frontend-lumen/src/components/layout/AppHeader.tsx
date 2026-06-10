import { ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { LogOut, User2 } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

interface AppHeaderProps {
  user: { name?: string; username?: string } | null;
  onLogout: () => void;
  rightSlot?: ReactNode;
  showLogo?: boolean;
  compact?: boolean;
}

export function AppHeader({ user, onLogout, rightSlot, showLogo = true, compact = false }: AppHeaderProps) {
  const initial = user?.name?.charAt(0).toUpperCase() || user?.username?.charAt(0).toUpperCase() || "U";

  return (
    <header
      className={`sticky top-0 z-30 border-b border-border/60 bg-background/70 backdrop-blur-xl ${
        compact ? "h-14" : "h-16"
      }`}
      data-testid="app-header"
    >
      <div className="container max-w-screen-2xl flex h-full items-center justify-between gap-4">
        {showLogo && (
          <Link
            to="/projects"
            aria-label="Go to projects"
            className="rounded-lg focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            data-testid="app-header-logo"
          >
            <Logo iconSize={30} />
          </Link>
        )}

        <div className="flex items-center gap-2">
          {rightSlot}
          <ThemeToggle size="sm" />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full hover:bg-muted/60"
                aria-label="Account menu"
                data-testid="user-menu-trigger"
              >
                <Avatar className="h-9 w-9 ring-2 ring-border/50">
                  <AvatarFallback className="bg-aurora-soft text-foreground font-semibold text-sm">
                    {initial}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60 glass-strong">
              <DropdownMenuLabel className="font-normal">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-aurora-soft text-foreground text-sm font-semibold">
                      {initial}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col min-w-0">
                    <span className="font-semibold text-sm truncate">{user?.name || "User"}</span>
                    <span className="text-xs text-muted-foreground truncate">{user?.username || ""}</span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled className="text-xs">
                <User2 className="w-4 h-4 mr-2" />
                Profile settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={onLogout}
                className="text-destructive focus:text-destructive cursor-pointer"
                data-testid="user-menu-logout"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
