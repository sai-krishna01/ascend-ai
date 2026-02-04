import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Check, Loader2, Star, Sparkles, Crown } from "lucide-react";

interface PricingPlan {
  id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  billing_period: string;
  features: string[];
  is_popular: boolean;
  sort_order: number;
}

export default function Pricing() {
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPlans = async () => {
      const { data, error } = await supabase
        .from("pricing_plans")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (error) {
        console.error("Error fetching plans:", error);
        toast.error("Failed to load pricing plans");
      } else {
        // Parse features from JSONB
        const parsedPlans = (data || []).map((plan: any) => ({
          ...plan,
          features: Array.isArray(plan.features) ? plan.features : JSON.parse(plan.features || "[]"),
        }));
        setPlans(parsedPlans);
      }
      setIsLoading(false);
    };

    fetchPlans();
  }, []);

  const handleSelectPlan = async (planId: string) => {
    if (!isAuthenticated) {
      toast.info("Please sign in to subscribe to a plan");
      navigate("/auth");
      return;
    }

    setSelectedPlan(planId);
    
    // For free plan, just create subscription
    const plan = plans.find(p => p.id === planId);
    if (plan && plan.price === 0) {
      try {
        const { error } = await supabase.from("user_subscriptions").insert({
          user_id: user?.id,
          plan_id: planId,
          status: "active",
        });

        if (error) throw error;
        toast.success(`Successfully subscribed to ${plan.name} plan!`);
        navigate("/dashboard");
      } catch (error) {
        console.error("Subscription error:", error);
        toast.error("Failed to subscribe. Please try again.");
      }
    } else {
      // For paid plans, show coming soon message
      toast.info("Payment integration coming soon! For now, enjoy the Free plan.");
    }
    
    setSelectedPlan(null);
  };

  const getPlanIcon = (name: string) => {
    switch (name.toLowerCase()) {
      case "pro":
        return <Star className="h-6 w-6" />;
      case "premium":
        return <Crown className="h-6 w-6" />;
      default:
        return <Sparkles className="h-6 w-6" />;
    }
  };

  const formatPrice = (price: number, currency: string) => {
    if (price === 0) return "Free";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency,
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-16 container px-4">
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Choose Your <span className="text-primary">Learning Plan</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Start learning for free or unlock premium features with our affordable plans
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : plans.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No pricing plans available at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {plans.map((plan) => (
              <Card
                key={plan.id}
                className={`relative glass border-white/10 flex flex-col ${
                  plan.is_popular ? "border-primary shadow-lg shadow-primary/20 scale-105" : ""
                }`}
              >
                {plan.is_popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
                    Most Popular
                  </Badge>
                )}
                <CardHeader className="text-center pb-4">
                  <div className={`mx-auto mb-4 p-3 rounded-full ${plan.is_popular ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>
                    {getPlanIcon(plan.name)}
                  </div>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="text-center mb-6">
                    <span className="text-4xl font-bold">{formatPrice(plan.price, plan.currency)}</span>
                    {plan.price > 0 && (
                      <span className="text-muted-foreground">/{plan.billing_period}</span>
                    )}
                  </div>
                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full"
                    variant={plan.is_popular ? "default" : "outline"}
                    onClick={() => handleSelectPlan(plan.id)}
                    disabled={selectedPlan === plan.id}
                  >
                    {selectedPlan === plan.id ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : plan.price === 0 ? (
                      "Get Started Free"
                    ) : (
                      "Subscribe Now"
                    )}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold mb-4">Frequently Asked Questions</h2>
          <div className="max-w-2xl mx-auto space-y-4 text-left">
            <div className="p-4 rounded-lg bg-secondary/50">
              <h3 className="font-medium mb-2">Can I change my plan later?</h3>
              <p className="text-sm text-muted-foreground">
                Yes! You can upgrade or downgrade your plan at any time.
              </p>
            </div>
            <div className="p-4 rounded-lg bg-secondary/50">
              <h3 className="font-medium mb-2">Is there a free trial?</h3>
              <p className="text-sm text-muted-foreground">
                Our Free plan is always available with basic features. Try it out before upgrading!
              </p>
            </div>
            <div className="p-4 rounded-lg bg-secondary/50">
              <h3 className="font-medium mb-2">What payment methods do you accept?</h3>
              <p className="text-sm text-muted-foreground">
                We accept UPI, credit/debit cards, and net banking (coming soon).
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
