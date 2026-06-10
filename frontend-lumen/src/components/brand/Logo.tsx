import { cn } from "@/lib/utils";

interface LogoMarkProps {
  className?: string;
  size?: number;
  animated?: boolean;
}

/**
 * Lumen brand mark — a prism / aurora pyramid.
 * Uses inline SVG with gradient + subtle inner glow.
 */
export function LogoMark({ className, size = 36, animated = false }: LogoMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="lumen-grad" x1="2" y1="4" x2="38" y2="36" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="hsl(238 78% 58%)" />
          <stop offset="50%" stopColor="hsl(280 65% 60%)" />
          <stop offset="100%" stopColor="hsl(14 95% 64%)" />
        </linearGradient>
        <linearGradient id="lumen-inner" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="white" stopOpacity="0.95" />
          <stop offset="100%" stopColor="white" stopOpacity="0.55" />
        </linearGradient>
        <radialGradient id="lumen-glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="white" stopOpacity="0.6" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Outer rounded square */}
      <rect x="1" y="1" width="38" height="38" rx="10" fill="url(#lumen-grad)" />

      {/* Subtle inner glow */}
      <circle cx="20" cy="21" r="14" fill="url(#lumen-glow)" opacity="0.6" />

      {/* Prism triangle */}
      <path
        d="M11 28 L20 10 L29 28 Z"
        stroke="url(#lumen-inner)"
        strokeWidth="1.6"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Inner light core */}
      <circle cx="20" cy="22" r="2.4" fill="white" className={animated ? "animate-pulse" : undefined} />

      {/* Light beams */}
      <path d="M20 22 L20 31" stroke="white" strokeWidth="1.3" strokeLinecap="round" opacity="0.85" />
      <path d="M20 22 L13 28" stroke="white" strokeWidth="1.1" strokeLinecap="round" opacity="0.55" />
      <path d="M20 22 L27 28" stroke="white" strokeWidth="1.1" strokeLinecap="round" opacity="0.55" />
    </svg>
  );
}

interface LogoProps {
  className?: string;
  iconSize?: number;
  showWordmark?: boolean;
  variant?: "default" | "compact";
  animated?: boolean;
}

export function Logo({
  className,
  iconSize = 32,
  showWordmark = true,
  variant = "default",
  animated = false,
}: LogoProps) {
  return (
    <div className={cn("inline-flex items-center gap-2.5", className)} data-testid="lumen-logo">
      <LogoMark size={iconSize} animated={animated} />
      {showWordmark && (
        <div className="flex flex-col leading-none">
          <span className="font-display text-[17px] font-semibold tracking-tight text-foreground">
            Lumen
          </span>
          {variant === "default" && (
            <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-medium mt-0.5">
              Build Studio
            </span>
          )}
        </div>
      )}
    </div>
  );
}
