import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Loader2, Mail, User, Lock, ArrowRight, Check } from "lucide-react";
import { api, setAuthToken, setUserInfo } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { LogoMark } from "@/components/brand/Logo";
import { cn } from "@/lib/utils";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !email || !password) {
      toast({
        title: "Missing details",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.signup({ name, username: email, password });
      setAuthToken(response.token);
      setUserInfo(response.user);
      toast({ title: "Welcome to Lumen!", description: "Your studio is ready." });
      navigate("/projects");
    } catch (error) {
      toast({
        title: "Signup failed",
        description: error instanceof Error ? error.message : "Could not create account",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Lightweight password strength heuristic
  const strength = (() => {
    let s = 0;
    if (password.length >= 8) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[0-9]/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    return s; // 0-4
  })();
  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"][strength];
  const strengthColor = ["bg-muted", "bg-destructive", "bg-warning", "bg-primary", "bg-success"][strength];

  return (
    <AuthLayout>
      <div className="flex flex-col items-center mb-7">
        <div className="lg:hidden mb-5">
          <LogoMark size={44} />
        </div>
        <h2 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-center">
          Create your studio
        </h2>
        <p className="mt-1.5 text-sm text-muted-foreground text-center">
          Free to start. No credit card required.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm font-medium">
            Full name
          </Label>
          <div className="relative group">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
            <Input
              id="name"
              type="text"
              autoComplete="name"
              placeholder="Jane Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="pl-10 h-12 bg-background/60 border-border/70 rounded-xl text-sm"
              disabled={isLoading}
              data-testid="signup-name-input"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium">
            Email
          </Label>
          <div className="relative group">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 h-12 bg-background/60 border-border/70 rounded-xl text-sm"
              disabled={isLoading}
              data-testid="signup-email-input"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium">
            Password
          </Label>
          <div className="relative group">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 h-12 bg-background/60 border-border/70 rounded-xl text-sm"
              disabled={isLoading}
              data-testid="signup-password-input"
            />
          </div>

          {password.length > 0 && (
            <div className="pt-2 space-y-1.5" aria-live="polite">
              <div className="grid grid-cols-4 gap-1.5">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={cn(
                      "h-1 rounded-full transition-colors",
                      i <= strength ? strengthColor : "bg-muted",
                    )}
                  />
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground">
                Strength: <span className="font-medium text-foreground">{strengthLabel || "—"}</span>
              </p>
            </div>
          )}
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-12 rounded-xl text-sm font-semibold btn-aurora border-0 group"
          data-testid="signup-submit-button"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating account…
            </>
          ) : (
            <>
              Create account
              <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
            </>
          )}
        </Button>
      </form>

      <ul className="mt-6 grid grid-cols-1 gap-2 text-xs text-muted-foreground">
        {["1 free project", "Live preview deployments", "Take your code anywhere"].map((p) => (
          <li key={p} className="flex items-center gap-2">
            <Check className="w-3.5 h-3.5 text-success" />
            <span>{p}</span>
          </li>
        ))}
      </ul>

      <p className="text-center text-sm text-muted-foreground mt-7">
        Already have an account?{" "}
        <Link to="/login" className="text-foreground font-medium hover:gradient-text transition-all">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
