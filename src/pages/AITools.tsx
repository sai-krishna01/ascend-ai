import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { AIFeaturesPanel } from "@/components/ai/AIFeaturesPanel";
import { useAuth } from "@/hooks/useAuth";
import { useAISettings } from "@/hooks/useAISettings";
import { Navigate } from "react-router-dom";
import { Loader2, Ban } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AITools() {
  const { isLoading: authLoading, isAuthenticated } = useAuth();
  const { isLoading: settingsLoading, canAccessAITools } = useAISettings();

  if (authLoading || settingsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  // Check if AI Tools is enabled
  if (!canAccessAITools()) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        
        <main className="flex-1 pt-20 pb-8 flex items-center justify-center">
          <Card className="max-w-md mx-4">
            <CardContent className="py-12 text-center">
              <Ban className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-bold mb-2">AI Tools Unavailable</h2>
              <p className="text-muted-foreground mb-6">
                AI Tools are currently disabled by the administrator. Please check back later or contact support for more information.
              </p>
              <Button asChild>
                <a href="/dashboard">Go to Dashboard</a>
              </Button>
            </CardContent>
          </Card>
        </main>

        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 pt-20 pb-8">
        <div className="container px-4">
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold">AI Learning Tools</h1>
            <p className="text-muted-foreground">
              Use AI to solve doubts, generate quizzes, create notes, and more
            </p>
          </div>
          <AIFeaturesPanel />
        </div>
      </main>

      <Footer />
    </div>
  );
}
