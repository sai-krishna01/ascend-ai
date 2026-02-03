import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAdminData } from "@/hooks/useAdminData";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminStats } from "@/components/admin/AdminStats";
import { UserManagement } from "@/components/admin/UserManagement";
import { PlatformSettings } from "@/components/admin/PlatformSettings";
import { CustomPagesManager } from "@/components/admin/CustomPagesManager";
import { AlertsManager } from "@/components/admin/AlertsManager";
import { 
  Users, 
  Settings, 
  BarChart3,
  Shield,
  FileText,
  Bell,
  Loader2,
  AlertTriangle
} from "lucide-react";

export default function AdminPanel() {
  const { user, role, isLoading: authLoading, isAuthenticated } = useAuth();
  const { 
    settings, 
    pages, 
    alerts, 
    users, 
    stats, 
    isLoading: dataLoading,
    updateSetting,
    updatePage,
    createAlert,
    updateAlert,
    deleteAlert,
    refetch
  } = useAdminData();

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  const isAdmin = role === "admin" || role === "founder";

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 pb-8 container px-4">
          <Card className="max-w-md mx-auto text-center">
            <CardContent className="py-12">
              <AlertTriangle className="w-16 h-16 mx-auto text-destructive mb-4" />
              <h2 className="text-xl font-bold mb-2">Access Denied</h2>
              <p className="text-muted-foreground mb-4">
                You don't have permission to access the admin panel.
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

  const activeAlertsCount = alerts.filter(a => a.is_active).length;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20 pb-8">
        <div className="container px-4">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Shield className="w-8 h-8 text-primary" />
              <h1 className="text-2xl sm:text-3xl font-bold">Admin Panel</h1>
            </div>
            <p className="text-muted-foreground">
              Manage content, users, and platform settings
            </p>
          </div>

          {/* Real-time Stats */}
          <AdminStats 
            totalUsers={stats.totalUsers}
            totalSessions={stats.totalSessions}
            activeToday={stats.activeToday}
            pendingAlerts={activeAlertsCount}
          />

          {/* Admin Tabs */}
          <Tabs defaultValue="users" className="w-full">
            <TabsList className="grid w-full max-w-2xl grid-cols-5 mb-6">
              <TabsTrigger value="users" className="text-xs sm:text-sm">
                <Users className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Users</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="text-xs sm:text-sm">
                <Settings className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Settings</span>
              </TabsTrigger>
              <TabsTrigger value="pages" className="text-xs sm:text-sm">
                <FileText className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Pages</span>
              </TabsTrigger>
              <TabsTrigger value="alerts" className="text-xs sm:text-sm">
                <Bell className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Alerts</span>
              </TabsTrigger>
              <TabsTrigger value="analytics" className="text-xs sm:text-sm">
                <BarChart3 className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Analytics</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="users">
              <UserManagement users={users} onRefresh={refetch} />
            </TabsContent>

            <TabsContent value="settings">
              <PlatformSettings settings={settings} onUpdateSetting={updateSetting} />
            </TabsContent>

            <TabsContent value="pages">
              <CustomPagesManager pages={pages} onUpdatePage={updatePage} />
            </TabsContent>

            <TabsContent value="alerts">
              <AlertsManager 
                alerts={alerts}
                onCreateAlert={createAlert}
                onUpdateAlert={updateAlert}
                onDeleteAlert={deleteAlert}
              />
            </TabsContent>

            <TabsContent value="analytics">
              <Card className="glass border-white/10">
                <CardContent className="py-12 text-center">
                  <BarChart3 className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground mb-4">
                    Detailed analytics dashboard coming soon
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Current Stats: {stats.totalUsers} users, {stats.totalSessions} total sessions
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
}
