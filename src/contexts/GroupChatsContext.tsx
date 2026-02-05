import React, { createContext, useContext, useState, useCallback, useEffect, useMemo, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

export interface GroupChat {
  id: string;
  name: string;
  description: string | null;
  type: "custom" | "subject" | "course";
  subject: string | null;
  created_by: string;
  avatar_url: string | null;
  is_active: boolean;
  ai_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: "admin" | "moderator" | "member";
  joined_at: string;
  last_read_at: string | null;
}

interface GroupChatsContextType {
  groups: GroupChat[];
  isLoading: boolean;
  createGroup: (
    name: string,
    description: string,
    type: "custom" | "subject" | "course",
    subject?: string,
    aiEnabled?: boolean
  ) => Promise<string | null>;
  deleteGroup: (groupId: string) => Promise<boolean>;
  joinGroup: (groupId: string) => Promise<boolean>;
  leaveGroup: (groupId: string) => Promise<boolean>;
  addMemberToGroup: (groupId: string, userId: string, role?: "admin" | "moderator" | "member") => Promise<boolean>;
  removeMemberFromGroup: (groupId: string, userId: string) => Promise<boolean>;
  getGroupMembers: (groupId: string) => Promise<GroupMember[]>;
  refetch: () => Promise<void>;
}

const GroupChatsContext = createContext<GroupChatsContextType | null>(null);

export function GroupChatsProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [groups, setGroups] = useState<GroupChat[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [previousUserId, setPreviousUserId] = useState<string | null>(null);

  // Clear state when user changes (logout or switch)
  useEffect(() => {
    const currentUserId = user?.id || null;
    
    if (previousUserId !== currentUserId) {
      // User changed - clear all cached groups immediately
      setGroups([]);
      setPreviousUserId(currentUserId);
    }
  }, [user?.id, previousUserId]);

  const fetchGroups = useCallback(async () => {
    if (!user?.id) {
      setGroups([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      // Fetch groups where user is creator OR member (RLS handles this)
      const { data, error } = await supabase
        .from("group_chats")
        .select("*")
        .eq("is_active", true)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      setGroups((data as GroupChat[]) || []);
    } catch (error) {
      console.error("Error fetching groups:", error);
      setGroups([]);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  const createGroup = useCallback(
    async (
      name: string,
      description: string,
      type: "custom" | "subject" | "course",
      subject?: string,
      aiEnabled: boolean = true
    ): Promise<string | null> => {
      if (!user?.id) {
        toast.error("You must be logged in to create a group");
        return null;
      }

      const trimmedName = name.trim();
      if (!trimmedName) {
        toast.error("Group name is required");
        return null;
      }

      try {
        // Check for duplicate
        const { data: existing } = await supabase
          .from("group_chats")
          .select("id")
          .eq("name", trimmedName)
          .eq("created_by", user.id)
          .eq("is_active", true)
          .maybeSingle();

        if (existing) {
          toast.error("You already have a group with this name");
          return null;
        }

        const { data: groupData, error: groupError } = await supabase
          .from("group_chats")
          .insert({
            name: trimmedName,
            description: description.trim() || null,
            type,
            subject: subject || null,
            created_by: user.id,
            ai_enabled: aiEnabled,
            is_active: true,
          })
          .select("*")
          .single();

        if (groupError) throw new Error(groupError.message);
        if (!groupData) throw new Error("Group was not created");

        // Add creator as admin
        await supabase.from("group_chat_members").insert({
          group_id: groupData.id,
          user_id: user.id,
          role: "admin",
        });

        // Update local state
        setGroups((prev) => {
          if (prev.some((g) => g.id === groupData.id)) return prev;
          return [groupData as GroupChat, ...prev];
        });

        toast.success("Group created successfully!");
        return groupData.id;
      } catch (error: any) {
        console.error("Error creating group:", error);
        toast.error(error?.message || "Failed to create group");
        return null;
      }
    },
    [user?.id]
  );

  const deleteGroup = useCallback(
    async (groupId: string): Promise<boolean> => {
      if (!user?.id) {
        toast.error("You must be logged in");
        return false;
      }

      // Optimistic removal
      const groupToDelete = groups.find((g) => g.id === groupId);
      setGroups((prev) => prev.filter((g) => g.id !== groupId));

      try {
        // Call backend function for cascade delete
        const { data, error } = await supabase.functions.invoke("group-chat-ops", {
          body: { action: "delete_group", groupId },
        });

        if (error) throw error;
        if (!data?.ok) throw new Error(data?.error || "Delete failed");

        toast.success("Group deleted");
        return true;
      } catch (error: any) {
        console.error("Error deleting group:", error);
        // Revert
        if (groupToDelete) {
          setGroups((prev) => [groupToDelete, ...prev]);
        }
        toast.error(error.message || "Failed to delete group");
        return false;
      }
    },
    [user?.id, groups]
  );

  const joinGroup = useCallback(
    async (groupId: string): Promise<boolean> => {
      if (!user?.id) {
        toast.error("You must be logged in");
        return false;
      }

      try {
        const { error } = await supabase.from("group_chat_members").insert({
          group_id: groupId,
          user_id: user.id,
          role: "member",
        });

        if (error) {
          if (error.code === "23505") {
            toast.info("You're already a member");
            return true;
          }
          throw error;
        }

        toast.success("Joined group!");
        return true;
      } catch (error) {
        console.error("Error joining group:", error);
        toast.error("Failed to join group");
        return false;
      }
    },
    [user?.id]
  );

  const leaveGroup = useCallback(
    async (groupId: string): Promise<boolean> => {
      if (!user?.id) return false;

      try {
        const { error } = await supabase.from("group_chat_members").delete().eq("group_id", groupId).eq("user_id", user.id);

        if (error) throw error;

        toast.success("Left group");
        await fetchGroups();
        return true;
      } catch (error) {
        console.error("Error leaving group:", error);
        toast.error("Failed to leave group");
        return false;
      }
    },
    [user?.id, fetchGroups]
  );

  const addMemberToGroup = useCallback(
    async (groupId: string, userId: string, memberRole: "admin" | "moderator" | "member" = "member"): Promise<boolean> => {
      if (!user?.id) return false;

      try {
        const { data, error } = await supabase.functions.invoke("group-chat-ops", {
          body: { action: "add_member", groupId, userId, role: memberRole },
        });

        if (error) throw error;
        if (!data?.ok) throw new Error(data?.error || "Failed");

        toast.success("Member added!");
        return true;
      } catch (error: any) {
        console.error("Error adding member:", error);
        toast.error(error.message || "Failed to add member");
        return false;
      }
    },
    [user?.id]
  );

  const removeMemberFromGroup = useCallback(
    async (groupId: string, userId: string): Promise<boolean> => {
      if (!user?.id) return false;

      try {
        const { data, error } = await supabase.functions.invoke("group-chat-ops", {
          body: { action: "remove_member", groupId, userId },
        });

        if (error) throw error;
        if (!data?.ok) throw new Error(data?.error || "Failed");

        toast.success("Member removed");
        return true;
      } catch (error: any) {
        console.error("Error removing member:", error);
        toast.error(error.message || "Failed to remove member");
        return false;
      }
    },
    [user?.id]
  );

  const getGroupMembers = useCallback(async (groupId: string): Promise<GroupMember[]> => {
    try {
      const { data, error } = await supabase.from("group_chat_members").select("*").eq("group_id", groupId);

      if (error) throw error;
      return (data as GroupMember[]) || [];
    } catch (error) {
      console.error("Error fetching members:", error);
      return [];
    }
  }, []);

  // Real-time subscription (singleton) - refetch on auth change
  useEffect(() => {
    // Always clean up previous subscriptions
    let channel: ReturnType<typeof supabase.channel> | null = null;

    if (!user?.id || !isAuthenticated) {
      // Clear groups when not authenticated
      setGroups([]);
      setIsLoading(false);
      return;
    }

    // Fetch fresh data for new user
    fetchGroups();

    channel = supabase
      .channel(`group-chats-provider-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "group_chats",
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newGroup = payload.new as GroupChat;
            setGroups((prev) => {
              if (prev.find((g) => g.id === newGroup.id)) return prev;
              return [newGroup, ...prev];
            });
          } else if (payload.eventType === "UPDATE") {
            const updated = payload.new as GroupChat;
            setGroups((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
          } else if (payload.eventType === "DELETE") {
            const deletedId = payload.old?.id;
            if (deletedId) {
              setGroups((prev) => prev.filter((g) => g.id !== deletedId));
            }
          }
        }
      )
      .subscribe();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [user?.id, isAuthenticated, fetchGroups]);

  const value = useMemo(
    () => ({
      groups,
      isLoading,
      createGroup,
      deleteGroup,
      joinGroup,
      leaveGroup,
      addMemberToGroup,
      removeMemberFromGroup,
      getGroupMembers,
      refetch: fetchGroups,
    }),
    [groups, isLoading, createGroup, deleteGroup, joinGroup, leaveGroup, addMemberToGroup, removeMemberFromGroup, getGroupMembers, fetchGroups]
  );

  return <GroupChatsContext.Provider value={value}>{children}</GroupChatsContext.Provider>;
}

export function useGroupChatsContext() {
  const context = useContext(GroupChatsContext);
  if (!context) {
    throw new Error("useGroupChatsContext must be used within GroupChatsProvider");
  }
  return context;
}
