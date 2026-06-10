import { cn } from "@/lib/utils";

interface AuroraBackgroundProps {
  className?: string;
  variant?: "subtle" | "vivid";
}

/**
 * Decorative animated aurora blobs for hero / auth backgrounds.
 * Pointer-events: none — purely visual.
 */
export function AuroraBackground({ className, variant = "subtle" }: AuroraBackgroundProps) {
  const opacity = variant === "vivid" ? "opacity-70" : "opacity-50";
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        opacity,
        className,
      )}
    >
      {/* Blob 1 — cobalt */}
      <div
        className="absolute -top-32 -left-24 w-[520px] h-[520px] animate-blob"
        style={{
          background: "radial-gradient(circle, hsl(238 90% 68% / 0.45) 0%, transparent 65%)",
          filter: "blur(60px)",
        }}
      />
      {/* Blob 2 — violet */}
      <div
        className="absolute top-1/3 -right-32 w-[560px] h-[560px] animate-blob"
        style={{
          background: "radial-gradient(circle, hsl(280 75% 68% / 0.45) 0%, transparent 65%)",
          filter: "blur(70px)",
          animationDelay: "-6s",
        }}
      />
      {/* Blob 3 — coral */}
      <div
        className="absolute -bottom-32 left-1/3 w-[480px] h-[480px] animate-blob"
        style={{
          background: "radial-gradient(circle, hsl(14 95% 68% / 0.4) 0%, transparent 65%)",
          filter: "blur(65px)",
          animationDelay: "-12s",
        }}
      />
      {/* Fine grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.07] dark:opacity-[0.10]"
        style={{
          backgroundImage:
            "linear-gradient(to right, hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--foreground)) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage: "radial-gradient(ellipse at center, black 40%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse at center, black 40%, transparent 75%)",
        }}
      />
    </div>
  );
}
