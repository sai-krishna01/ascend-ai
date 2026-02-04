import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Loader2, Trash2, Sparkles, History, X, Paperclip, Link2, FileText, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePersistentChat } from "@/hooks/usePersistentChat";
import { useChatSessions } from "@/hooks/useChatSessions";
import { useFileUpload } from "@/hooks/useFileUpload";
import { AIMode, UserLevel, AI_MODES, USER_LEVELS } from "@/lib/types";
import { useAuth } from "@/hooks/useAuth";
import ReactMarkdown from "react-markdown";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ChatInterfaceProps {
  mode: AIMode;
  level: UserLevel;
  subject?: string;
  language?: string;
  onBack: () => void;
  existingSessionId?: string;
}

interface Attachment {
  type: "file" | "link";
  name: string;
  url?: string;
  fileType?: string;
}

export function ChatInterface({ 
  mode, 
  level, 
  subject, 
  language, 
  onBack,
  existingSessionId 
}: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkTitle, setLinkTitle] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isAuthenticated } = useAuth();
  const { uploadFile, isUploading } = useFileUpload();

  const { messages, isLoading, sendMessage, clearChat, isInitialized } = usePersistentChat({
    mode,
    level,
    subject,
    language,
    existingSessionId,
  });

  const { sessions, deleteSession } = useChatSessions();

  const currentMode = AI_MODES.find(m => m.id === mode);
  const currentLevel = USER_LEVELS.find(l => l.id === level);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (const file of Array.from(files)) {
      // Upload file
      const uploaded = await uploadFile(file);
      if (uploaded) {
        setAttachments(prev => [...prev, {
          type: "file",
          name: uploaded.name,
          url: uploaded.url,
          fileType: uploaded.type,
        }]);
      }
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleAddLink = () => {
    if (!linkUrl.trim()) {
      toast.error("Please enter a URL");
      return;
    }

    // Validate URL
    try {
      new URL(linkUrl);
    } catch {
      toast.error("Please enter a valid URL");
      return;
    }

    setAttachments(prev => [...prev, {
      type: "link",
      name: linkTitle || linkUrl,
      url: linkUrl,
    }]);

    setLinkUrl("");
    setLinkTitle("");
    setLinkDialogOpen(false);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && attachments.length === 0) || isLoading) return;

    // Build message with attachments context
    let messageContent = input.trim();
    
    if (attachments.length > 0) {
      const attachmentInfo = attachments.map(att => {
        if (att.type === "file") {
          return `[Attached file: ${att.name}${att.url ? ` - ${att.url}` : ""}]`;
        } else {
          return `[Attached link: ${att.name} - ${att.url}]`;
        }
      }).join("\n");
      
      messageContent = attachmentInfo + (messageContent ? `\n\n${messageContent}` : "\n\nPlease analyze the attached content.");
    }

    sendMessage(messageContent);
    setInput("");
    setAttachments([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const suggestedPrompts = [
    mode === "teacher" && "Explain the concept of photosynthesis",
    mode === "teacher" && "What is the Pythagorean theorem?",
    mode === "mentor" && "How do I prepare for my first job interview?",
    mode === "mentor" && "What skills should I learn for a career in tech?",
    mode === "interviewer" && "Start a mock interview for a software developer role",
    mode === "interviewer" && "Ask me behavioral interview questions",
    mode === "examiner" && "Test me on basic programming concepts",
    mode === "examiner" && "Give me a math quiz",
  ].filter(Boolean) as string[];

  // Show loading while initializing existing session
  if (existingSessionId && !isInitialized) {
    return (
      <div className="flex flex-col h-[calc(100vh-4rem)] max-h-[800px] bg-card rounded-2xl shadow-elevated border overflow-hidden items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading conversation...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-h-[800px] bg-card rounded-2xl shadow-elevated border overflow-hidden">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.doc,.docx,.txt,image/*"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Header */}
      <div className="flex items-center justify-between px-3 sm:px-4 py-3 border-b bg-secondary/50">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Button variant="ghost" size="sm" onClick={onBack} className="shrink-0">
            ← Back
          </Button>
          <div className="h-6 w-px bg-border hidden sm:block" />
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-lg sm:text-xl">{currentMode?.icon}</span>
            <div className="min-w-0">
              <h3 className="font-semibold text-sm truncate">{currentMode?.name}</h3>
              <p className="text-xs text-muted-foreground truncate">
                {currentLevel?.name} {subject && `• ${subject}`}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {isAuthenticated && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowHistory(!showHistory)} 
              className="text-muted-foreground"
              title="Chat History"
            >
              <History className="w-4 h-4" />
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={clearChat} className="text-muted-foreground" title="New Chat">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Chat History Sidebar */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="absolute inset-y-0 left-0 w-72 bg-card border-r shadow-lg z-10 flex flex-col"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h3 className="font-semibold">Chat History</h3>
              <Button variant="ghost" size="icon" onClick={() => setShowHistory(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {sessions.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-8">
                  No chat history yet
                </p>
              ) : (
                sessions.map((session) => (
                  <div
                    key={session.id}
                    className="group flex items-center justify-between p-2 rounded-lg hover:bg-secondary transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="text-sm">
                        {session.mode === "teacher" ? "👨‍🏫" : 
                         session.mode === "mentor" ? "🧭" : 
                         session.mode === "interviewer" ? "🎯" : "📝"}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">
                          {session.title || session.subject || session.mode}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(session.updated_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSession(session.id);
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4 sm:p-8">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl gradient-primary flex items-center justify-center mb-4"
            >
              <Sparkles className="w-7 h-7 sm:w-8 sm:h-8 text-primary-foreground" />
            </motion.div>
            <h3 className="font-semibold text-base sm:text-lg mb-2">
              Hello! I'm your {currentMode?.name}
            </h3>
            <p className="text-muted-foreground text-xs sm:text-sm mb-4 max-w-md">
              {currentMode?.description}. You can attach files (PDF, DOC, images) or links for context!
            </p>
            
            {/* Suggested prompts */}
            <div className="grid gap-2 w-full max-w-md">
              {suggestedPrompts.slice(0, 3).map((prompt, index) => (
                <motion.button
                  key={prompt}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => sendMessage(prompt)}
                  className="p-2.5 sm:p-3 text-left text-xs sm:text-sm rounded-xl bg-secondary hover:bg-secondary/80 transition-colors border"
                >
                  {prompt}
                </motion.button>
              ))}
            </div>
          </div>
        ) : (
          <>
            <AnimatePresence mode="popLayout">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[90%] sm:max-w-[85%] rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3 ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary"
                    }`}
                  >
                    {message.role === "assistant" ? (
                      <div className="prose-mentor text-xs sm:text-sm">
                        <ReactMarkdown>{message.content || "..."}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-xs sm:text-sm whitespace-pre-wrap">{message.content}</p>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="bg-secondary rounded-2xl px-4 py-3">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="px-3 sm:px-4 py-2 border-t bg-secondary/30">
          <div className="flex flex-wrap gap-2">
            {attachments.map((att, index) => (
              <div
                key={index}
                className="flex items-center gap-2 bg-background rounded-lg px-3 py-1.5 text-sm"
              >
                {att.type === "file" ? (
                  att.fileType?.startsWith("image/") ? (
                    <ImageIcon className="w-4 h-4 text-blue-500" />
                  ) : (
                    <FileText className="w-4 h-4 text-orange-500" />
                  )
                ) : (
                  <Link2 className="w-4 h-4 text-green-500" />
                )}
                <span className="truncate max-w-[150px]">{att.name}</span>
                <button
                  onClick={() => removeAttachment(index)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-3 sm:p-4 border-t bg-background/50">
        <div className="flex gap-2">
          {/* Attachment buttons */}
          <div className="flex gap-1 shrink-0">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-11 w-11 sm:h-12 sm:w-12"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              title="Attach file"
            >
              {isUploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Paperclip className="w-4 h-4" />
              )}
            </Button>
            
            <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-11 w-11 sm:h-12 sm:w-12"
                  title="Add link"
                >
                  <Link2 className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Link</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="link-url">URL</Label>
                    <Input
                      id="link-url"
                      placeholder="https://example.com or YouTube link"
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="link-title">Title (optional)</Label>
                    <Input
                      id="link-title"
                      placeholder="Link description"
                      value={linkTitle}
                      onChange={(e) => setLinkTitle(e.target.value)}
                    />
                  </div>
                  <Button onClick={handleAddLink} className="w-full">
                    Add Link
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            rows={1}
            className="flex-1 resize-none rounded-xl border bg-background px-3 sm:px-4 py-2.5 sm:py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            style={{ minHeight: "44px", maxHeight: "120px" }}
          />
          <Button
            type="submit"
            disabled={(!input.trim() && attachments.length === 0) || isLoading}
            className="h-11 w-11 sm:h-12 sm:w-12 rounded-xl shrink-0"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
            ) : (
              <Send className="w-4 h-4 sm:w-5 sm:h-5" />
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
