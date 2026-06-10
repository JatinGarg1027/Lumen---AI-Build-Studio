import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { ArrowLeft, Compass } from "lucide-react";
import { AuroraBackground } from "@/components/brand/AuroraBackground";
import { LogoMark } from "@/components/brand/Logo";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-background overflow-hidden">
      <AuroraBackground variant="subtle" />

      <div className="relative z-10 text-center max-w-md px-6 animate-slide-up">
        <Link to="/" className="inline-flex justify-center mb-8">
          <LogoMark size={56} animated />
        </Link>

        <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground mb-3">
          Error · 404
        </p>
        <h1 className="font-display text-5xl sm:text-6xl font-semibold tracking-tight mb-4">
          <span className="gradient-text">Off the map.</span>
        </h1>
        <p className="text-base text-muted-foreground mb-8 leading-relaxed">
          We couldn't find <code className="font-mono text-xs px-1.5 py-0.5 rounded bg-muted">{location.pathname}</code>.
          The page may have been moved or renamed.
        </p>

        <div className="flex items-center justify-center gap-3">
          <Link
            to="/projects"
            className="inline-flex items-center gap-2 h-11 px-5 rounded-xl btn-aurora text-sm font-semibold text-white"
            data-testid="notfound-home-button"
          >
            <Compass className="w-4 h-4" />
            Go to projects
          </Link>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 h-11 px-5 rounded-xl text-sm font-medium border border-border/70 bg-card/50 hover:bg-card transition-colors"
            data-testid="notfound-back-button"
          >
            <ArrowLeft className="w-4 h-4" />
            Go back
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
