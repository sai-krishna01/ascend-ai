import { forwardRef } from "react";
import { usePlatformSettings } from "@/hooks/usePlatformSettings";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Construction } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

interface MaintenanceWrapperProps {
  children: React.ReactNode;
  allowAdmin?: boolean;
}

export const MaintenanceWrapper = forwardRef<HTMLDivElement, MaintenanceWrapperProps>(
  function MaintenanceWrapper({ children, allowAdmin = true }, ref) {
    const { isMaintenanceMode, maintenanceMessage, isLoading } = usePlatformSettings();
    const { role, isLoading: authLoading, isAuthenticated } = useAuth();
    const location = useLocation();

    // Always allow access to auth page (login is needed for admins)
    const isAuthPage = location.pathname === "/auth";
    
    // Show loading while checking settings
    if (isLoading || authLoading) {
      return (
        <div ref={ref} className="min-h-screen flex items-center justify-center bg-background">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      );
    }

    // If maintenance mode is enabled
    if (isMaintenanceMode) {
      // Allow admins/founders to bypass
      const isAdmin = role === "admin" || role === "founder";
      
      // Always allow access to auth page so admins can log in
      if (isAuthPage) {
        return <div ref={ref}>{children}</div>;
      }
      
      if (allowAdmin && isAdmin) {
        return (
          <div ref={ref}>
            <div className="fixed top-0 left-0 right-0 z-50 bg-destructive text-destructive-foreground py-2 px-4 text-center text-sm font-medium">
              ⚠️ Maintenance mode is active. You can access because you're an admin.
            </div>
            <div className="pt-10">{children}</div>
          </div>
        );
      }

      // Show maintenance page for non-admins (even if authenticated but not admin)
      return (
        <div ref={ref} className="min-h-screen flex items-center justify-center bg-background p-4">
          <Card className="max-w-lg w-full text-center">
            <CardContent className="py-12">
              <Construction className="w-16 h-16 mx-auto text-primary mb-4" />
              <h1 className="text-2xl font-bold mb-4">Under Maintenance</h1>
              <p className="text-muted-foreground mb-6">
                {maintenanceMessage || "We are currently performing maintenance. Please check back later."}
              </p>
              <div className="flex gap-3 justify-center">
                {!isAuthenticated ? (
                  <Button asChild variant="outline">
                    <Link to="/auth">Admin Login</Link>
                  </Button>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Only administrators can access the platform during maintenance.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return <div ref={ref}>{children}</div>;
  }
);
