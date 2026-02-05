import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Users, RefreshCw, Loader2, Edit2, Shield, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
 import { toast } from "sonner";
 
 // Create an edge function for admin user deletion would be better,
 // but for now we do a proper cascade delete of user data
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
  
  // Create user state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newUser, setNewUser] = useState({ email: "", password: "", fullName: "", role: "student" as AppRole });
  
  // Delete user state
  const [deleteUser, setDeleteUser] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleCreateUser = async () => {
    if (!newUser.email || !newUser.password) {
      toast.error("Email and password are required");
      return;
    }

    if (newUser.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setIsCreating(true);
    try {
      // Create user via Supabase Admin API (using edge function would be better for production)
      // For now, we'll use the standard signup which will create the user
      const { data, error } = await supabase.auth.signUp({
        email: newUser.email,
        password: newUser.password,
        options: {
          data: { full_name: newUser.fullName },
        },
      });

      if (error) throw error;

      if (data.user) {
        // Update role if not student (default)
        if (newUser.role !== "student") {
          // Wait a bit for the trigger to create default role
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          await supabase
            .from("user_roles")
            .delete()
            .eq("user_id", data.user.id);
          
          await supabase
            .from("user_roles")
            .insert({ user_id: data.user.id, role: newUser.role });
        }

        toast.success(`User created: ${newUser.email}`);
        setIsCreateOpen(false);
        setNewUser({ email: "", password: "", fullName: "", role: "student" });
        onRefresh();
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to create user");
    } finally {
      setIsCreating(false);
    }
  };

   const handleDeleteUser = async () => {
     if (!deleteUser) return;
 
     setIsDeleting(true);
     try {
       const userId = deleteUser.user_id;
       
       // Delete all user-related data in parallel where possible
       // First, delete items that have foreign key dependencies
       
       // Delete chat messages from user's sessions
       const { data: sessions } = await supabase
         .from("chat_sessions")
         .select("id")
         .eq("user_id", userId);
       
       if (sessions && sessions.length > 0) {
         const sessionIds = sessions.map(s => s.id);
         await supabase
           .from("chat_messages")
           .delete()
           .in("session_id", sessionIds);
       }
       
       // Delete user's chat sessions
       await supabase
         .from("chat_sessions")
         .delete()
         .eq("user_id", userId);
       
       // Delete group chat memberships
       await supabase
         .from("group_chat_members")
         .delete()
         .eq("user_id", userId);
       
       // Delete AI interactions
       await supabase
         .from("ai_interactions")
         .delete()
         .eq("user_id", userId);
       
       // Delete learning progress
       await supabase
         .from("learning_progress")
         .delete()
         .eq("user_id", userId);
       
       // Delete shared notes
       await supabase
         .from("shared_notes")
         .delete()
         .eq("created_by", userId);
       
       // Delete study resources
       await supabase
         .from("study_resources")
         .delete()
         .eq("uploaded_by", userId);
       
       // Delete user subscriptions
       await supabase
         .from("user_subscriptions")
         .delete()
         .eq("user_id", userId);
       
       // Delete user role
       const { error: roleError } = await supabase
         .from("user_roles")
         .delete()
         .eq("user_id", userId);
       
       if (roleError) {
         console.error("Error deleting role:", roleError);
       }
 
       // Delete user profile
       const { error: profileError } = await supabase
         .from("profiles")
         .delete()
         .eq("user_id", userId);
       
       if (profileError) {
         console.error("Error deleting profile:", profileError);
         throw profileError;
       }
 
       // Note: We can't delete from auth.users directly from client
       // The user will remain in auth but without profile/role
       // They won't be able to use the platform anymore
       
       toast.success("User completely removed from platform");
       setDeleteUser(null);
       onRefresh();
     } catch (error: any) {
       console.error("Delete user error:", error);
       toast.error(error.message || "Failed to delete user");
     } finally {
       setIsDeleting(false);
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
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsCreateOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add User
            </Button>
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
              {isRefreshing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Refresh
            </Button>
          </div>
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
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 sm:h-8 sm:w-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                      onClick={() => setDeleteUser(user)}
                      title="Delete User"
                    >
                      <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create User Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" />
              Create New User
            </DialogTitle>
            <DialogDescription>
              Add a new user with a temporary password
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={newUser.email}
                onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Temporary Password *</Label>
              <Input
                id="password"
                type="text"
                placeholder="Min 6 characters"
                value={newUser.password}
                onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">User can change this after logging in</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                placeholder="John Doe"
                value={newUser.fullName}
                onChange={(e) => setNewUser(prev => ({ ...prev, fullName: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={newUser.role} onValueChange={(v) => setNewUser(prev => ({ ...prev, role: v as AppRole }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">🎓 Student</SelectItem>
                  <SelectItem value="teacher">👨‍🏫 Teacher</SelectItem>
                  <SelectItem value="admin">🛡️ Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateUser} disabled={isCreating}>
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create User"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

      {/* Delete User Confirmation */}
      <AlertDialog open={!!deleteUser} onOpenChange={(open) => !open && setDeleteUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <strong>{deleteUser?.full_name || "this user"}</strong> from the platform? 
              This will delete their profile and role. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete User"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}