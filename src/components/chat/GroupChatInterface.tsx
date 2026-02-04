import { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Send, 
  Paperclip, 
  Smile, 
  Bot, 
  Users, 
  ArrowLeft,
  Loader2,
  Link as LinkIcon,
  FileText,
  Image as ImageIcon,
} from "lucide-react";
import { GroupChat, GroupMessage, useGroupMessages } from "@/hooks/useGroupChats";
import { useAIFeatures } from "@/hooks/useAIFeatures";
import { useAuth } from "@/hooks/useAuth";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

interface GroupChatInterfaceProps {
  group: GroupChat;
  onBack: () => void;
}

export function GroupChatInterface({ group, onBack }: GroupChatInterfaceProps) {
  const { user } = useAuth();
  const { messages, isLoading, sendMessage, sendAIMessage } = useGroupMessages(group.id);
  const { answerInGroupChat, isLoading: aiLoading } = useAIFeatures();
  
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isSending) return;

    const messageContent = input.trim();
    setInput("");
    setIsSending(true);

    try {
      // Check if AI is mentioned
      const aiMentioned = messageContent.toLowerCase().includes("@ai") || 
                          messageContent.toLowerCase().includes("@mentor");

      const sent = await sendMessage(messageContent);
      
      if (sent && aiMentioned && group.ai_enabled) {
        // AI responds to mention
        const cleanQuestion = messageContent.replace(/@ai|@mentor/gi, "").trim();
        const aiResponse = await answerInGroupChat(cleanQuestion, group.subject || group.name);
        await sendAIMessage(aiResponse);
      }
    } catch (error) {
      console.error("Send error:", error);
      toast.error("Failed to send message");
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
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
            className={`rounded-2xl px-4 py-2 ${
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
          </div>
        </div>
      </div>
    );
  };

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
                {group.ai_enabled && (
                  <Badge variant="outline" className="text-xs">
                    <Bot className="h-3 w-3 mr-1" />
                    AI Enabled
                  </Badge>
                )}
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {group.subject && `${group.subject} • `}
                Type @AI or @Mentor to ask questions
              </p>
            </div>
          </div>
          <Button variant="outline" size="icon">
            <Users className="h-4 w-4" />
          </Button>
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
                Start the conversation or ask AI for help!
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
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0"
              onClick={handleShareLink}
            >
              <LinkIcon className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0"
              disabled
              title="File upload coming soon"
            >
              <Paperclip className="h-5 w-5" />
            </Button>
            <Input
              ref={inputRef}
              placeholder="Type a message... (@AI for help)"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isSending}
              className="flex-1"
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isSending}
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
