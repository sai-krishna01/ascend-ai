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
    if (!user?.id) return null;

    try {
      const { data, error } = await supabase
        .from("group_chats")
        .insert({
          name,
          description,
          type,
          subject: subject || null,
          created_by: user.id,
          ai_enabled: aiEnabled,
        })
        .select()
        .single();

      if (error) throw error;

      // Add creator as admin member
      await supabase.from("group_chat_members").insert({
        group_id: data.id,
        user_id: user.id,
        role: "admin",
      });

      toast.success("Group created successfully!");
      await fetchGroups();
      return data.id;
    } catch (error) {
      console.error("Error creating group:", error);
      toast.error("Failed to create group");
      return null;
    }
  }, [user?.id, fetchGroups]);

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

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  return {
    groups,
    isLoading,
    createGroup,
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
