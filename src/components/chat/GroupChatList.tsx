import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  Plus,
  MessageSquare,
  Bot,
  BookOpen,
  GraduationCap,
  Loader2,
  Search,
} from "lucide-react";
import { GroupChat, useGroupChats } from "@/hooks/useGroupChats";
import { SUBJECTS } from "@/lib/types";

interface GroupChatListProps {
  onSelectGroup: (groupId: string) => void;
  selectedGroupId?: string | null;
}

export function GroupChatList({ onSelectGroup, selectedGroupId }: GroupChatListProps) {
  const { groups, isLoading, createGroup } = useGroupChats();
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [newGroup, setNewGroup] = useState({
    name: "",
    description: "",
    type: "custom" as "custom" | "subject" | "course",
    subject: "",
    aiEnabled: true,
  });

  const filteredGroups = groups.filter(
    (g) =>
      g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.subject?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateGroup = async () => {
    if (!newGroup.name.trim()) return;

    setIsCreating(true);
    const groupId = await createGroup(
      newGroup.name,
      newGroup.description,
      newGroup.type,
      newGroup.subject || undefined,
      newGroup.aiEnabled
    );

    if (groupId) {
      setIsCreateOpen(false);
      setNewGroup({
        name: "",
        description: "",
        type: "custom",
        subject: "",
        aiEnabled: true,
      });
    }
    setIsCreating(false);
  };

  const getGroupIcon = (group: GroupChat) => {
    switch (group.type) {
      case "subject":
        return <BookOpen className="h-5 w-5" />;
      case "course":
        return <GraduationCap className="h-5 w-5" />;
      default:
        return <Users className="h-5 w-5" />;
    }
  };

  return (
    <Card className="h-full glass border-white/10">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Group Chats
          </CardTitle>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                New
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Group</DialogTitle>
                <DialogDescription>
                  Start a new group chat with students and teachers
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Group Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Physics Study Group"
                    value={newGroup.name}
                    onChange={(e) =>
                      setNewGroup({ ...newGroup, name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="What's this group about?"
                    value={newGroup.description}
                    onChange={(e) =>
                      setNewGroup({ ...newGroup, description: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Group Type</Label>
                  <Select
                    value={newGroup.type}
                    onValueChange={(value: "custom" | "subject" | "course") =>
                      setNewGroup({ ...newGroup, type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="custom">Custom Group</SelectItem>
                      <SelectItem value="subject">Subject Based</SelectItem>
                      <SelectItem value="course">Course Based</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {(newGroup.type === "subject" || newGroup.type === "course") && (
                  <div className="space-y-2">
                    <Label>Subject</Label>
                    <Select
                      value={newGroup.subject}
                      onValueChange={(value) =>
                        setNewGroup({ ...newGroup, subject: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select subject" />
                      </SelectTrigger>
                      <SelectContent>
                        {SUBJECTS.map((s) => (
                          <SelectItem key={s.id} value={s.name}>
                            {s.icon} {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable AI Assistant</Label>
                    <p className="text-xs text-muted-foreground">
                      Allow @AI mentions for help
                    </p>
                  </div>
                  <Switch
                    checked={newGroup.aiEnabled}
                    onCheckedChange={(checked) =>
                      setNewGroup({ ...newGroup, aiEnabled: checked })
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateGroup} disabled={isCreating || !newGroup.name.trim()}>
                  {isCreating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Group"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        <div className="relative mt-2">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search groups..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <ScrollArea className="h-[calc(100%-140px)]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredGroups.length === 0 ? (
            <div className="text-center py-8 px-4">
              <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">
                {searchQuery ? "No groups found" : "No groups yet"}
              </p>
              <p className="text-sm text-muted-foreground/70">
                Create a new group to start chatting
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredGroups.map((group) => (
                <button
                  key={group.id}
                  onClick={() => onSelectGroup(group.id)}
                  className={`w-full p-4 text-left hover:bg-accent/50 transition-colors ${
                    selectedGroupId === group.id ? "bg-accent" : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      {getGroupIcon(group)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{group.name}</span>
                        {group.ai_enabled && (
                          <Bot className="h-3 w-3 text-primary shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {group.description || group.subject || "No description"}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs py-0">
                          {group.type}
                        </Badge>
                        {group.subject && (
                          <span className="text-xs text-muted-foreground">
                            {group.subject}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
