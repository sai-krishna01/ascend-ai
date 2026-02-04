import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { AIFeaturesPanel } from "@/components/ai/AIFeaturesPanel";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

export default function AITools() {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
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
