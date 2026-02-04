import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Users, RefreshCw, Loader2, Edit2, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { AppRole } from "@/lib/types";

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
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newRole, setNewRole] = useState<AppRole>("student");
  const [isSaving, setIsSaving] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await onRefresh();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleEditRole = (user: User) => {
    setEditingUser(user);
    setNewRole(user.role as AppRole);
  };

  const handleSaveRole = async () => {
    if (!editingUser) return;
    
    setIsSaving(true);
    try {
      // Delete existing role
      await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", editingUser.user_id);
      
      // Insert new role
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: editingUser.user_id, role: newRole });
      
      if (error) throw error;
      
      toast.success(`Role updated to ${newRole}`);
      setEditingUser(null);
      onRefresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to update role");
    } finally {
      setIsSaving(false);
    }
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

  const getRoleColor = (role: string) => {
    switch (role) {
      case "founder":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "admin":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "teacher":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      default:
        return "";
    }
  };

  return (
    <>
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
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No users found</p>
              </div>
            ) : (
              users.map((user) => (
                <div 
                  key={user.id} 
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 rounded-lg bg-secondary/50 gap-2 sm:gap-4 group hover:bg-secondary/70 transition-colors"
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
                    <Badge 
                      variant={getRoleBadgeVariant(user.role)} 
                      className={`capitalize text-[10px] sm:text-xs ${getRoleColor(user.role)}`}
                    >
                      {user.role}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 sm:h-8 sm:w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleEditRole(user)}
                      title="Edit Role"
                    >
                      <Edit2 className="w-3 h-3 sm:w-4 sm:h-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Role Dialog */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Edit User Role
            </DialogTitle>
            <DialogDescription>
              Change the role for {editingUser?.full_name || "this user"}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Current Role</label>
              <Badge variant={getRoleBadgeVariant(editingUser?.role || "")} className="capitalize">
                {editingUser?.role}
              </Badge>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">New Role</label>
              <Select value={newRole} onValueChange={(v) => setNewRole(v as AppRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">
                    <span className="flex items-center gap-2">
                      <span>🎓</span> Student
                    </span>
                  </SelectItem>
                  <SelectItem value="teacher">
                    <span className="flex items-center gap-2">
                      <span>👨‍🏫</span> Teacher
                    </span>
                  </SelectItem>
                  <SelectItem value="admin">
                    <span className="flex items-center gap-2">
                      <span>🛡️</span> Admin
                    </span>
                  </SelectItem>
                  <SelectItem value="founder">
                    <span className="flex items-center gap-2">
                      <span>👑</span> Founder
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingUser(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveRole} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
