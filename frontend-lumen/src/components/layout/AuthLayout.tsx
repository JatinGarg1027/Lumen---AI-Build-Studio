import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { AuroraBackground } from "@/components/brand/AuroraBackground";
import { Logo } from "@/components/brand/Logo";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Sparkles, ShieldCheck, Zap } from "lucide-react";

interface AuthLayoutProps {
  children: ReactNode;
  /** Title shown in the marketing column */
  heading?: string;
  subheading?: string;
}

/**
 * Two-column auth layout:
 * - Left: marketing / value props (hidden on mobile)
 * - Right: form card
 */
export function AuthLayout({ children, heading, subheading }: AuthLayoutProps) {
  const points = [
    {
      icon: Sparkles,
      title: "Build with conversation",
      desc: "Describe what you want, see it generated, refine in real-time.",
    },
    {
      icon: Zap,
      title: "Preview & deploy instantly",
      desc: "One-click sandbox previews — share your work in seconds.",
    },
    {
      icon: ShieldCheck,
      title: "Production-ready output",
      desc: "Clean, typed code you can take with you. Zero lock-in.",
    },
  ];

  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      <AuroraBackground variant="vivid" className="opacity-60" />

      <Link
        to="#main"
        className="skip-link"
        data-testid="skip-to-main"
      >
        Skip to main content
      </Link>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between p-5 sm:p-7">
        <Link to="/" aria-label="Lumen home" className="focus-visible:rounded-lg">
          <Logo iconSize={32} />
        </Link>
        <ThemeToggle />
      </header>

      <main
        id="main"
        className="relative z-10 grid lg:grid-cols-2 gap-12 lg:gap-16 px-5 sm:px-8 lg:px-16 pb-12 pt-4"
      >
        {/* Left — marketing */}
        <section className="hidden lg:flex flex-col justify-center max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-aurora-soft border border-border/60 text-xs font-medium w-fit mb-6">
            <span className="pulse-dot" />
            <span>AI build studio · public beta</span>
          </div>
          <h1 className="font-display text-5xl xl:text-6xl font-semibold tracking-tight leading-[1.05] mb-5">
            Ship ideas <br />
            <span className="gradient-text">at the speed of thought.</span>
          </h1>
          {(heading || subheading) && (
            <p className="text-base text-muted-foreground leading-relaxed mb-10 max-w-md">
              {subheading ||
                "Lumen pairs you with an AI engineer. Describe the app, watch it write the code, preview it live, and deploy in one click."}
            </p>
          )}
          {!heading && !subheading && (
            <p className="text-base text-muted-foreground leading-relaxed mb-10 max-w-md">
              Lumen pairs you with an AI engineer. Describe the app, watch it write the code,
              preview it live, and deploy in one click.
            </p>
          )}

          <ul className="space-y-5">
            {points.map((p, i) => (
              <li
                key={p.title}
                className="flex items-start gap-4 animate-slide-up"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="shrink-0 mt-0.5 w-9 h-9 rounded-xl bg-aurora-soft border border-border/50 flex items-center justify-center">
                  <p.icon className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{p.title}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">{p.desc}</p>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-12 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="flex -space-x-2">
              {["238 78% 58%", "280 65% 60%", "14 95% 64%"].map((c, i) => (
                <div
                  key={i}
                  className="w-7 h-7 rounded-full ring-2 ring-background"
                  style={{ background: `hsl(${c})` }}
                />
              ))}
            </div>
            <span>Trusted by makers, indie hackers and product teams.</span>
          </div>
        </section>

        {/* Right — form */}
        <section className="flex items-center justify-center min-h-[calc(100vh-200px)]">
          <div className="relative w-full max-w-md">
            {/* Gradient halo */}
            <div
              aria-hidden="true"
              className="absolute -inset-8 rounded-[2rem] bg-aurora-soft blur-2xl opacity-80"
            />
            <div className="relative glass-strong rounded-2xl shadow-lifted p-7 sm:p-9">
              {children}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
