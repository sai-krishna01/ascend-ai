import { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { 
  Send, 
  Paperclip, 
  Bot, 
  Users, 
  ArrowLeft,
  Loader2,
  Link as LinkIcon,
  FileText,
  Image as ImageIcon,
  X,
  Trash2,
  MoreVertical,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { GroupMessage, useGroupMessages, useGroupChats } from "@/hooks/useGroupChats";
import { useAIFeatures } from "@/hooks/useAIFeatures";
import { useAuth } from "@/hooks/useAuth";
import { useFileUpload, UploadedFile } from "@/hooks/useFileUpload";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

interface GroupChatInterfaceProps {
  groupId: string;
  onBack: () => void;
  aiEnabled?: boolean;
}

export function GroupChatInterface({ groupId, onBack, aiEnabled = true }: GroupChatInterfaceProps) {
  const { user, role } = useAuth();
  const { groups, deleteGroup } = useGroupChats();
  const group = groups.find(g => g.id === groupId);
  const { messages, isLoading, sendMessage, sendAIMessage } = useGroupMessages(groupId);
  const { answerInGroupChat, isLoading: aiLoading } = useAIFeatures();
  const { uploadFile, isUploading, getFileIcon, formatFileSize } = useFileUpload();
  
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [pendingFile, setPendingFile] = useState<UploadedFile | null>(null);
  const [replyTo, setReplyTo] = useState<{ id: string; content: string; senderName: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check if user can delete this group
  const isAdmin = role === "admin" || role === "founder";
  const isCreator = group?.created_by === user?.id;
  const canDelete = isAdmin || isCreator;

  const handleDeleteGroup = async () => {
    if (!canDelete) return;
    setIsDeleting(true);
    const success = await deleteGroup(groupId);
    setIsDeleting(false);
    if (success) {
      onBack();
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if ((!input.trim() && !pendingFile) || isSending) return;

    let messageContent = input.trim();
    
    // Add reply context
    if (replyTo) {
      messageContent = `> Replying to ${replyTo.senderName}: "${replyTo.content.slice(0, 50)}${replyTo.content.length > 50 ? '...' : ''}"\n\n${messageContent}`;
    }
    
    setInput("");
    setReplyTo(null);
    setIsSending(true);

    try {
      // If there's a pending file, send it first
      if (pendingFile) {
        await sendMessage(
          pendingFile.name,
          "file",
          pendingFile.url,
          pendingFile.name,
          pendingFile.type
        );
        setPendingFile(null);
      }

      // Send text message if any
      if (messageContent) {
        // Check if AI is mentioned
        const aiMentioned = messageContent.toLowerCase().includes("@ai") || 
                            messageContent.toLowerCase().includes("@mentor");

        const sent = await sendMessage(messageContent);
        
        // Only trigger AI if globally enabled and group has AI enabled
        if (sent && aiMentioned && aiEnabled && group?.ai_enabled) {
          // AI responds to mention
          const cleanQuestion = messageContent.replace(/@ai|@mentor/gi, "").trim();
          const aiResponse = await answerInGroupChat(cleanQuestion, group?.subject || group?.name || "general");
          await sendAIMessage(aiResponse);
        }
      }
    } catch (error) {
      console.error("Send error:", error);
      toast.error("Failed to send message");
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  const handleReply = (msg: GroupMessage) => {
    setReplyTo({
      id: msg.id,
      content: msg.content,
      senderName: msg.sender_name || (msg.sender_type === "ai" ? "MentorAI" : "User"),
    });
    inputRef.current?.focus();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const uploaded = await uploadFile(file);
    if (uploaded) {
      setPendingFile(uploaded);
      toast.success(`${file.name} ready to send`);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleShareLink = useCallback(async () => {
    const link = prompt("Enter a link to share:");
    if (link && link.trim()) {
      // Validate URL
      try {
        new URL(link);
        await sendMessage(link.trim(), "link");
      } catch {
        toast.error("Please enter a valid URL");
      }
    }
  }, [sendMessage]);

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString([], { 
      hour: "2-digit", 
      minute: "2-digit" 
    });
  };

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const renderMessage = (msg: GroupMessage) => {
    const isAI = msg.sender_type === "ai";
    const isSystem = msg.sender_type === "system";
    const isOwnMessage = msg.user_id === user?.id;

    if (isSystem) {
      return (
        <div key={msg.id} className="text-center py-2">
          <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
            {msg.content}
          </span>
        </div>
      );
    }

    return (
      <div
        key={msg.id}
        className={`flex gap-3 ${isOwnMessage ? "flex-row-reverse" : ""}`}
      >
        <Avatar className={`h-8 w-8 ${isAI ? "bg-primary" : ""}`}>
          <AvatarFallback className={isAI ? "bg-primary text-primary-foreground" : ""}>
            {isAI ? <Bot className="h-4 w-4" /> : getInitials(msg.sender_name)}
          </AvatarFallback>
        </Avatar>

        <div className={`max-w-[70%] ${isOwnMessage ? "items-end" : "items-start"}`}>
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-medium ${isAI ? "text-primary" : "text-foreground"}`}>
              {isAI ? "MentorAI" : msg.sender_name || "User"}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatTime(msg.created_at)}
            </span>
            {isAI && <Badge variant="secondary" className="text-xs py-0">AI</Badge>}
          </div>

          <div
            className={`rounded-2xl px-4 py-2 group relative ${
              isOwnMessage
                ? "bg-primary text-primary-foreground rounded-br-md"
                : isAI
                ? "bg-primary/10 border border-primary/20 rounded-bl-md"
                : "bg-muted rounded-bl-md"
            }`}
          >
            {msg.message_type === "link" ? (
              <a
                href={msg.content}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-blue-500 hover:underline"
              >
                <LinkIcon className="h-4 w-4" />
                {msg.content}
              </a>
            ) : msg.message_type === "file" ? (
              <a
                href={msg.file_url || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:underline"
              >
                {msg.file_type?.startsWith("image/") ? (
                  <ImageIcon className="h-4 w-4" />
                ) : (
                  <FileText className="h-4 w-4" />
                )}
                {msg.file_name || "Download file"}
              </a>
            ) : isAI ? (
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>
            ) : (
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
            )}
            {/* Reply button */}
            <button
              onClick={() => handleReply(msg)}
              className="absolute -bottom-5 right-0 opacity-0 group-hover:opacity-100 transition-opacity text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
            >
              ↩ Reply
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (!group) {
    return (
      <Card className="flex flex-col h-full items-center justify-center">
        <CardContent className="text-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading group...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col h-full glass border-white/10">
      <CardHeader className="pb-2 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onBack} className="md:hidden">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                {group.name}
                {aiEnabled && group.ai_enabled && (
                  <Badge variant="outline" className="text-xs">
                    <Bot className="h-3 w-3 mr-1" />
                    AI Enabled
                  </Badge>
                )}
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {group.subject && `${group.subject} • `}
                {aiEnabled && group.ai_enabled ? "Type @AI or @Mentor to ask questions" : "Chat with your group"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon">
              <Users className="h-4 w-4" />
            </Button>
            {canDelete && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem
                        onSelect={(e) => e.preventDefault()}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Group
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Group</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{group.name}"? This action cannot be undone and all messages will be lost.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDeleteGroup}
                          disabled={isDeleting}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {isDeleting ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Deleting...
                            </>
                          ) : (
                            "Delete"
                          )}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No messages yet</p>
              <p className="text-sm text-muted-foreground/70">
                {aiEnabled && group.ai_enabled 
                  ? "Start the conversation or ask AI for help!" 
                  : "Start the conversation!"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map(renderMessage)}
              {(isSending || aiLoading) && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">
                    {aiLoading ? "AI is thinking..." : "Sending..."}
                  </span>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        <Separator />

        <div className="p-4">
          {/* Reply indicator */}
          {replyTo && (
            <div className="mb-2 flex items-center gap-2 p-2 bg-primary/10 rounded-lg border-l-2 border-primary">
              <span className="text-primary text-sm">↩</span>
              <div className="flex-1 min-w-0">
                <span className="text-xs text-muted-foreground">Replying to {replyTo.senderName}</span>
                <p className="text-sm truncate">{replyTo.content}</p>
              </div>
              <button
                onClick={() => setReplyTo(null)}
                className="text-muted-foreground hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Pending file indicator */}
          {pendingFile && (
            <div className="mb-2 flex items-center gap-2 p-2 bg-muted rounded-lg">
              <span>{getFileIcon(pendingFile.type)}</span>
              <span className="text-sm flex-1 truncate">{pendingFile.name}</span>
              <span className="text-xs text-muted-foreground">
                {formatFileSize(pendingFile.size)}
              </span>
              <button
                onClick={() => setPendingFile(null)}
                className="text-muted-foreground hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0"
              onClick={handleShareLink}
            >
              <LinkIcon className="h-5 w-5" />
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".pdf,.doc,.docx,.txt,image/*"
              className="hidden"
            />
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Paperclip className="h-5 w-5" />
              )}
            </Button>
            <Input
              ref={inputRef}
              placeholder={aiEnabled && group.ai_enabled ? "Type a message... (@AI for help)" : "Type a message..."}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isSending}
              className="flex-1"
            />
            <Button
              onClick={handleSend}
              disabled={(!input.trim() && !pendingFile) || isSending}
              size="icon"
              className="shrink-0"
            >
              {isSending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
