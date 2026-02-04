import { usePlatformSettings } from "@/hooks/usePlatformSettings";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2, Construction } from "lucide-react";
import { Link } from "react-router-dom";

interface MaintenanceWrapperProps {
  children: React.ReactNode;
  allowAdmin?: boolean;
}

export function MaintenanceWrapper({ children, allowAdmin = true }: MaintenanceWrapperProps) {
  const { isMaintenanceMode, maintenanceMessage, isLoading } = usePlatformSettings();
  const { role, isLoading: authLoading } = useAuth();

  // Show loading while checking settings
  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // If maintenance mode is enabled
  if (isMaintenanceMode) {
    // Allow admins/founders to bypass
    const isAdmin = role === "admin" || role === "founder";
    if (allowAdmin && isAdmin) {
      return (
        <>
        <div className="fixed top-0 left-0 right-0 z-50 bg-destructive text-destructive-foreground py-2 px-4 text-center text-sm font-medium">
          ⚠️ Maintenance mode is active. You can access because you're an admin.
        </div>
          <div className="pt-10">{children}</div>
        </>
      );
    }

    // Show maintenance page for non-admins
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-lg w-full text-center">
          <CardContent className="py-12">
            <Construction className="w-16 h-16 mx-auto text-primary mb-4" />
            <h1 className="text-2xl font-bold mb-4">Under Maintenance</h1>
            <p className="text-muted-foreground mb-6">
              {maintenanceMessage || "We are currently performing maintenance. Please check back later."}
            </p>
            <div className="flex gap-3 justify-center">
              <Button asChild variant="outline">
                <Link to="/auth">Sign In</Link>
              </Button>
              <Button asChild>
                <Link to="/contact">Contact Support</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
