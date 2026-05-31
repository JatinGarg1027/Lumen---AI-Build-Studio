import React, { useState, useEffect } from "react";
import { Check, Sparkles, Zap, Shield, Loader2, CreditCard, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { api, getUserInfo } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface UpgradeDialogProps {
  trigger?: React.ReactNode;
}

interface SubscriptionState {
  plan: {
    id: number;
    name: string;
    maxProjects: number;
    maxTokenPerDay: number;
    unlimitedAi: boolean;
    price: string;
  } | null;
  status: string;
  currentPeriodEnd: string | null;
  tokensUsedThisCycle: number;
}

export function UpgradeDialog({ trigger }: UpgradeDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [subLoading, setSubLoading] = useState(false);
  const [subscription, setSubscription] = useState<SubscriptionState | null>(null);

  useEffect(() => {
    if (open) {
      fetchSubscription();
    }
  }, [open]);

  const fetchSubscription = async () => {
    setSubLoading(true);
    try {
      const data = await api.getSubscription();
      setSubscription(data);
    } catch (error) {
      console.error("Failed to fetch subscription:", error);
      toast({
        title: "Subscription Status",
        description: "Failed to load your current subscription details.",
        variant: "destructive",
      });
    } finally {
      setSubLoading(false);
    }
  };

  const handleSubscribe = async (planId: number, planName: string) => {
    setLoading(true);
    try {
      toast({
        title: "Redirecting...",
        description: `Preparing your checkout session for ${planName} plan.`,
      });
      const data = await api.createCheckoutSession(planId);
      if (data && data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (error: any) {
      console.error("Checkout failed:", error);
      toast({
        title: "Checkout Error",
        description: error.message || "Failed to initiate payment checkout.",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const handleManageBilling = async () => {
    setLoading(true);
    try {
      toast({
        title: "Redirecting...",
        description: "Opening Stripe Customer Portal to manage billing.",
      });
      const data = await api.openCustomerPortal();
      if (data && data.portalUrl) {
        window.location.href = data.portalUrl;
      } else {
        throw new Error("No customer portal URL returned");
      }
    } catch (error: any) {
      console.error("Portal error:", error);
      toast({
        title: "Billing Portal Error",
        description: error.message || "Failed to open billing customer portal.",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const isCurrentPlan = (planId: number) => {
    if (!subscription || !subscription.plan) {
      return planId === 1; // Default to Free (ID 1) if no active subscription
    }
    return subscription.plan.id === planId && subscription.status.toLowerCase() === "active";
  };

  const plans = [
    {
      id: 1,
      name: "Free",
      price: "$0",
      description: "Perfect for testing and simple widgets",
      features: [
        "1 Active Project limit",
        "10,000 AI Tokens / day",
        "5 Deployment Previews",
        "Community Discord support",
      ],
      icon: Zap,
      cta: "Current Plan",
      gradient: "from-slate-500/10 to-slate-500/5 border-slate-500/20",
      accentColor: "text-slate-400",
    },
    {
      id: 2,
      name: "Starter",
      price: "$9",
      period: "/month",
      description: "Great for building small personal apps",
      features: [
        "3 Active Projects limit",
        "50,000 AI Tokens / day",
        "20 Deployment Previews",
        "Priority component generation",
      ],
      icon: Zap,
      cta: "Upgrade to Starter",
      gradient: "from-blue-500/10 to-indigo-500/5 border-blue-500/20 hover:border-blue-500/40",
      accentColor: "text-blue-400",
    },
    {
      id: 3,
      name: "Pro",
      price: "$29",
      period: "/month",
      description: "Our most popular plan for power users",
      features: [
        "10 Active Projects limit",
        "250,000 AI Tokens / day",
        "100 Deployment Previews",
        "Unlimited Advanced AI",
        "Dedicated premium support",
      ],
      icon: Sparkles,
      cta: "Upgrade to Pro",
      recommended: true,
      gradient: "from-amber-500/20 to-orange-500/10 border-orange-500/50 shadow-lg shadow-orange-500/5 ring-1 ring-orange-500/20 hover:border-orange-500",
      accentColor: "text-orange-400",
    },
    {
      id: 4,
      name: "Enterprise",
      price: "$99",
      period: "/month",
      description: "For teams and high-scale generation",
      features: [
        "100 Active Projects limit",
        "1,000,000 AI Tokens / day",
        "1,000 Deployment Previews",
        "Unlimited Advanced AI",
        "Custom deployment targets",
        "Dedicated account representative",
      ],
      icon: Shield,
      cta: "Upgrade to Enterprise",
      gradient: "from-purple-500/10 to-pink-500/5 border-purple-500/20 hover:border-purple-500/40",
      accentColor: "text-purple-400",
    },
  ];

  const hasPaidPlan = subscription && subscription.plan && subscription.plan.id > 1 && subscription.status.toLowerCase() === "active";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="h-8 text-xs font-medium">
            Upgrade
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-5xl bg-background/95 backdrop-blur-xl border border-border/60 text-foreground overflow-y-auto max-h-[90vh] md:max-h-[85vh] p-6 sm:p-8">
        <DialogHeader className="text-center sm:text-left flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border/40 pb-6 mb-6">
          <div>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-orange-400 bg-clip-text text-transparent flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-orange-400 animate-pulse" />
              Upgrade to Premium
            </DialogTitle>
            <DialogDescription className="text-muted-foreground mt-1">
              Select the plan that matches your building speed and token requirements.
            </DialogDescription>
          </div>

          {hasPaidPlan && (
            <Button
              onClick={handleManageBilling}
              disabled={loading}
              className="w-full sm:w-auto h-9 gap-2 text-xs bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:from-orange-600 hover:to-amber-600 shadow-md font-semibold"
            >
              {loading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CreditCard className="w-3.5 h-3.5" />
              )}
              Manage Billing & Subscription
              <ExternalLink className="w-3 h-3 opacity-80" />
            </Button>
          )}
        </DialogHeader>

        {subLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Checking subscription details...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {subscription?.plan && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl border border-border/40 bg-muted/20 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground font-medium">Current Status:</span>
                    <Badge variant={hasPaidPlan ? "default" : "secondary"} className="capitalize text-[10px] font-bold">
                      {subscription.status.toLowerCase()}
                    </Badge>
                  </div>
                  <h4 className="font-bold text-sm">
                    Plan: <span className="text-primary">{subscription.plan.name}</span>
                    {subscription.currentPeriodEnd && (
                      <span className="text-xs text-muted-foreground font-normal ml-2">
                        (Renews on {new Date(subscription.currentPeriodEnd).toLocaleDateString()})
                      </span>
                    )}
                  </h4>
                </div>
                <div className="text-left sm:text-right space-y-0.5">
                  <div className="text-xs text-muted-foreground">
                    Tokens Used This Cycle: <span className="font-semibold text-foreground">{subscription.tokensUsedThisCycle.toLocaleString()}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Daily Token Limit: <span className="font-semibold text-foreground">
                      {subscription.plan.maxTokenPerDay === 1000000 ? "1,000,000" : subscription.plan.maxTokenPerDay.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              {plans.map((plan) => {
                const isCurrent = isCurrentPlan(plan.id);
                const Icon = plan.icon;

                return (
                  <div
                    key={plan.id}
                    className={cn(
                      "relative flex flex-col justify-between p-5 rounded-2xl border transition-all duration-300",
                      plan.gradient,
                      plan.recommended && "scale-[1.02] md:scale-100 xl:scale-[1.03] z-10"
                    )}
                  >
                    {plan.recommended && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Badge className="bg-gradient-to-r from-orange-500 to-amber-500 text-white border-none py-0.5 px-3 text-[9px] font-bold tracking-wider uppercase flex items-center gap-1 shadow-md">
                          <Sparkles className="w-2.5 h-2.5" />
                          Most Popular
                        </Badge>
                      </div>
                    )}

                    <div className="space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-lg">{plan.name}</h3>
                          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed min-h-[32px]">
                            {plan.description}
                          </p>
                        </div>
                        <div className={cn("p-2 rounded-lg bg-background/50 border border-border/40", plan.accentColor)}>
                          <Icon className="w-4 h-4" />
                        </div>
                      </div>

                      <div className="flex items-baseline gap-1 py-1 border-b border-border/40">
                        <span className="text-3xl font-extrabold tracking-tight">{plan.price}</span>
                        {plan.period && (
                          <span className="text-xs text-muted-foreground">{plan.period}</span>
                        )}
                      </div>

                      <ul className="space-y-2.5 text-xs">
                        {plan.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-muted-foreground">
                            <Check className={cn("w-3.5 h-3.5 shrink-0 mt-0.5", plan.accentColor)} />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-6">
                      {isCurrent ? (
                        <Button
                          disabled
                          className="w-full h-9 text-xs font-semibold bg-muted text-muted-foreground hover:bg-muted border border-border/30"
                        >
                          Current Plan
                        </Button>
                      ) : plan.id === 1 ? (
                        <Button
                          disabled
                          className="w-full h-9 text-xs font-semibold"
                          variant="secondary"
                        >
                          Default Tier
                        </Button>
                      ) : (
                        <Button
                          onClick={() => handleSubscribe(plan.id, plan.name)}
                          disabled={loading}
                          className={cn(
                            "w-full h-9 text-xs font-semibold shadow-md transition-all active:scale-[0.98]",
                            plan.recommended
                              ? "bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white border-none"
                              : "bg-background hover:bg-muted border border-border/60 text-foreground"
                          )}
                        >
                          {loading ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            plan.cta
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
