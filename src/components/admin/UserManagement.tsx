import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, RefreshCw, Loader2 } from "lucide-react";
import { useState } from "react";

interface User {
  id: string;
  user_id: string;
  full_name: string | null;
  user_level: string;
  role: string;
  created_at: string;
}

interface UserManagementProps {
  users: User[];
  onRefresh: () => void;
}

export function UserManagement({ users, onRefresh }: UserManagementProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await onRefresh();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "founder":
        return "default";
      case "admin":
        return "default";
      case "teacher":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <Card className="glass border-white/10">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 pb-4">
        <div>
          <CardTitle className="text-base sm:text-lg">User Management</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Manage users, roles, and permissions ({users.length} total)
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
          {isRefreshing ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-2" />
          )}
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 sm:space-y-3 max-h-[400px] overflow-y-auto">
          {users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No users found
            </div>
          ) : (
            users.map((user) => (
              <div 
                key={user.id} 
                className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 rounded-lg bg-secondary/50 gap-2 sm:gap-4"
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <Users className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm sm:text-base truncate">{user.full_name || "Unnamed User"}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Joined {new Date(user.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-10 sm:ml-0">
                  <Badge variant="secondary" className="capitalize text-[10px] sm:text-xs">
                    {user.user_level}
                  </Badge>
                  <Badge variant={getRoleBadgeVariant(user.role)} className="capitalize text-[10px] sm:text-xs">
                    {user.role}
                  </Badge>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
