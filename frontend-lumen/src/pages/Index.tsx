import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { isAuthenticated } from "@/lib/api";
import { LogoMark } from "@/components/brand/Logo";
import { AuroraBackground } from "@/components/brand/AuroraBackground";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isAuthenticated()) navigate("/projects");
      else navigate("/login");
    }, 350);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-background overflow-hidden">
      <AuroraBackground variant="subtle" />

      <div className="relative flex flex-col items-center animate-fade-in">
        <div className="animate-float">
          <LogoMark size={72} animated />
        </div>
        <h1 className="mt-6 text-3xl font-display font-semibold tracking-tight">
          <span className="gradient-text">Lumen</span>
        </h1>
        <p className="mt-2 text-sm text-muted-foreground tracking-wide">
          Preparing your build studio…
        </p>

        <div className="mt-8 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse delay-200" />
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse delay-500" />
        </div>
      </div>
    </div>
  );
};

export default Index;
