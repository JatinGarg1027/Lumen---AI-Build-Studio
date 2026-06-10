import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Loader2, Lock, Mail, ArrowRight } from "lucide-react";
import { api, setAuthToken, setUserInfo } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { LogoMark } from "@/components/brand/Logo";

export function LoginModal() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        title: "Missing credentials",
        description: "Please enter both email and password",
        variant: "destructive",
      });
      return;
    }
    setIsLoading(true);
    try {
      const response = await api.login({ username: email, password });
      setAuthToken(response.token);
      if (response.user) setUserInfo(response.user);
      toast({ title: "Welcome back!", description: "You're signed in." });
      navigate("/projects");
    } catch (error) {
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Invalid credentials",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="flex flex-col items-center mb-7">
        <div className="lg:hidden mb-5">
          <LogoMark size={44} />
        </div>
        <h2 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-center">
          Welcome back
        </h2>
        <p className="mt-1.5 text-sm text-muted-foreground text-center">
          Sign in to pick up where you left off.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
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
              className="pl-10 h-12 bg-background/60 border-border/70 rounded-xl text-sm focus-visible:ring-2 focus-visible:ring-ring"
              disabled={isLoading}
              data-testid="login-email-input"
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-sm font-medium">
              Password
            </Label>
            <button
              type="button"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              onClick={() =>
                toast({
                  title: "Password reset",
                  description: "Reach out to support to reset your password.",
                })
              }
            >
              Forgot?
            </button>
          </div>
          <div className="relative group">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 h-12 bg-background/60 border-border/70 rounded-xl text-sm focus-visible:ring-2 focus-visible:ring-ring"
              disabled={isLoading}
              data-testid="login-password-input"
            />
          </div>
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-12 rounded-xl text-sm font-semibold btn-aurora border-0 group"
          data-testid="login-submit-button"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Signing in…
            </>
          ) : (
            <>
              Sign in
              <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
            </>
          )}
        </Button>

        <div className="relative py-2">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border/60" />
          </div>
          <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
            <span className="bg-card px-3 text-muted-foreground">or</span>
          </div>
        </div>

        <Link
          to="/signup"
          className="inline-flex w-full items-center justify-center h-12 rounded-xl text-sm font-medium border border-border/70 bg-background/40 hover:bg-background/80 hover:border-border transition-all"
          data-testid="login-go-to-signup"
        >
          Create a new account
        </Link>
      </form>

      <p className="text-center text-xs text-muted-foreground mt-7">
        By signing in, you agree to Lumen's Terms &amp; Privacy.
      </p>
    </AuthLayout>
  );
}
