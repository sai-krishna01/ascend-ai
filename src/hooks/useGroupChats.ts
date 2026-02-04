import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "./useAuth";

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
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

export interface GroupMessage {
  id: string;
  group_id: string;
  user_id: string | null;
  sender_name: string | null;
  sender_type: "user" | "ai" | "system";
  content: string;
  message_type: "text" | "file" | "link" | "ai_response";
  file_url: string | null;
  file_name: string | null;
  file_type: string | null;
  created_at: string;
}

export function useGroupChats() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<GroupChat[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchGroups = useCallback(async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("group_chats")
        .select("*")
        .eq("is_active", true)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      setGroups((data as GroupChat[]) || []);
    } catch (error) {
      console.error("Error fetching groups:", error);
      toast.error("Failed to load groups");
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  const createGroup = useCallback(async (
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

    try {
      console.log("Creating group:", { name, description, type, subject, aiEnabled, userId: user.id });
      
      // Step 1: Create the group
      const { data: groupData, error: groupError } = await supabase
        .from("group_chats")
        .insert({
          name: name.trim(),
          description: description.trim() || null,
          type,
          subject: subject || null,
          created_by: user.id,
          ai_enabled: aiEnabled,
          is_active: true,
        })
        .select("*")
        .single();

      if (groupError) {
        console.error("Group creation error:", groupError);
        throw new Error(groupError.message || "Failed to create group");
      }

      if (!groupData) {
        throw new Error("Group was not created properly");
      }

      console.log("Group created successfully:", groupData.id);

      // Step 2: Add creator as admin member
      // Use a small delay to ensure the group is fully committed
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const { error: memberError } = await supabase
        .from("group_chat_members")
        .insert({
          group_id: groupData.id,
          user_id: user.id,
          role: "admin",
        });

      if (memberError) {
        console.error("Member insert error:", memberError);
        // Log but don't throw - the creator can still see via created_by policy
        toast.warning("Group created, but you may need to refresh to see it");
      } else {
        console.log("Member added successfully");
        toast.success("Group created successfully!");
      }
      
      // Add the new group to the local state immediately
      setGroups(prev => [groupData as GroupChat, ...prev]);
      
      return groupData.id;
    } catch (error: any) {
      console.error("Error creating group:", error);
      const message = error?.message || "Failed to create group";
      toast.error(message);
      return null;
    }
  }, [user?.id]);

  const deleteGroup = useCallback(async (groupId: string): Promise<boolean> => {
    if (!user?.id) {
      toast.error("You must be logged in to delete a group");
      return false;
    }

    try {
      // Delete the group (cascade will handle members and messages via RLS)
      const { error } = await supabase
        .from("group_chats")
        .delete()
        .eq("id", groupId);

      if (error) throw error;

      toast.success("Group deleted successfully");
      setGroups(prev => prev.filter(g => g.id !== groupId));
      return true;
    } catch (error: any) {
      console.error("Error deleting group:", error);
      toast.error(error.message || "Failed to delete group");
      return false;
    }
  }, [user?.id]);

  const joinGroup = useCallback(async (groupId: string): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      const { error } = await supabase
        .from("group_chat_members")
        .insert({
          group_id: groupId,
          user_id: user.id,
          role: "member",
        });

      if (error) {
        if (error.code === "23505") {
          toast.info("You're already a member of this group");
          return true;
        }
        throw error;
      }

      toast.success("Joined group successfully!");
      return true;
    } catch (error) {
      console.error("Error joining group:", error);
      toast.error("Failed to join group");
      return false;
    }
  }, [user?.id]);

  const leaveGroup = useCallback(async (groupId: string): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      const { error } = await supabase
        .from("group_chat_members")
        .delete()
        .eq("group_id", groupId)
        .eq("user_id", user.id);

      if (error) throw error;

      toast.success("Left group successfully");
      await fetchGroups();
      return true;
    } catch (error) {
      console.error("Error leaving group:", error);
      toast.error("Failed to leave group");
      return false;
    }
  }, [user?.id, fetchGroups]);

  const getGroupMembers = useCallback(async (groupId: string): Promise<GroupMember[]> => {
    try {
      const { data, error } = await supabase
        .from("group_chat_members")
        .select("*")
        .eq("group_id", groupId);

      if (error) throw error;
      return (data as unknown as GroupMember[]) || [];
    } catch (error) {
      console.error("Error fetching members:", error);
      return [];
    }
  }, []);

  // Realtime subscription for groups
  useEffect(() => {
    if (!user?.id) return;

    fetchGroups();

    const channel = supabase
      .channel("group-chats-realtime")
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
            setGroups(prev => {
              if (prev.find(g => g.id === newGroup.id)) return prev;
              return [newGroup, ...prev];
            });
          } else if (payload.eventType === "UPDATE") {
            const updatedGroup = payload.new as GroupChat;
            setGroups(prev => prev.map(g => g.id === updatedGroup.id ? updatedGroup : g));
          } else if (payload.eventType === "DELETE") {
            const deletedId = payload.old?.id;
            if (deletedId) {
              setGroups(prev => prev.filter(g => g.id !== deletedId));
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, fetchGroups]);

  return {
    groups,
    isLoading,
    createGroup,
    deleteGroup,
    joinGroup,
    leaveGroup,
    getGroupMembers,
    refetch: fetchGroups,
  };
}

export function useGroupMessages(groupId: string | null) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchMessages = useCallback(async () => {
    if (!groupId) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("group_chat_messages")
        .select("*")
        .eq("group_id", groupId)
        .order("created_at", { ascending: true })
        .limit(100);

      if (error) throw error;
      setMessages((data as GroupMessage[]) || []);
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setIsLoading(false);
    }
  }, [groupId]);

  const sendMessage = useCallback(async (
    content: string,
    messageType: "text" | "file" | "link" = "text",
    fileUrl?: string,
    fileName?: string,
    fileType?: string
  ): Promise<boolean> => {
    if (!groupId || !user?.id) return false;

    try {
      const { error } = await supabase
        .from("group_chat_messages")
        .insert({
          group_id: groupId,
          user_id: user.id,
          sender_name: user.email?.split("@")[0] || "User",
          sender_type: "user",
          content,
          message_type: messageType,
          file_url: fileUrl || null,
          file_name: fileName || null,
          file_type: fileType || null,
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
      return false;
    }
  }, [groupId, user?.id, user?.email]);

  const sendAIMessage = useCallback(async (content: string): Promise<boolean> => {
    if (!groupId) return false;

    try {
      const { error } = await supabase
        .from("group_chat_messages")
        .insert({
          group_id: groupId,
          user_id: null,
          sender_name: "MentorAI",
          sender_type: "ai",
          content,
          message_type: "ai_response",
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Error sending AI message:", error);
      return false;
    }
  }, [groupId]);

  // Real-time subscription
  useEffect(() => {
    if (!groupId) return;

    fetchMessages();

    const channel = supabase
      .channel(`group-messages-${groupId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "group_chat_messages",
          filter: `group_id=eq.${groupId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as GroupMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId, fetchMessages]);

  return {
    messages,
    isLoading,
    sendMessage,
    sendAIMessage,
    refetch: fetchMessages,
  };
}