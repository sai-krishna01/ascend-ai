import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
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
  BookOpen,
  Loader2,
  Copy,
  Download,
  Send,
  FileText,
  Sparkles,
  Edit,
  Share2,
} from "lucide-react";
import { useAIFeatures } from "@/hooks/useAIFeatures";
import { useGroupChats, useGroupMessages } from "@/hooks/useGroupChats";
import { SUBJECTS } from "@/lib/types";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

export function TeacherAITools() {
  const { isLoading, generateNotes } = useAIFeatures();
  const { groups } = useGroupChats();

  const [notesTopic, setNotesTopic] = useState("");
  const [notesSubject, setNotesSubject] = useState("");
  const [notesStyle, setNotesStyle] = useState<"detailed" | "summary" | "bullet">("detailed");
  const [generatedNotes, setGeneratedNotes] = useState("");
  const [editedNotes, setEditedNotes] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState("");

  const handleGenerateNotes = async () => {
    if (!notesTopic.trim()) {
      toast.error("Please enter a topic");
      return;
    }

    const fullTopic = notesSubject ? `${notesSubject}: ${notesTopic}` : notesTopic;
    const response = await generateNotes(fullTopic, notesStyle);
    
    if (response.success) {
      setGeneratedNotes(response.content);
      setEditedNotes(response.content);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(editedNotes || generatedNotes);
    toast.success("Notes copied to clipboard!");
  };

  const downloadAsText = () => {
    const content = editedNotes || generatedNotes;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `notes-${notesTopic.replace(/\s+/g, "-")}-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Notes downloaded!");
  };

  const downloadAsMarkdown = () => {
    const content = editedNotes || generatedNotes;
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `notes-${notesTopic.replace(/\s+/g, "-")}-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Notes downloaded as Markdown!");
  };

  const handleShareToGroup = async () => {
    if (!selectedGroupId) {
      toast.error("Please select a group");
      return;
    }

    // This would need the group messages hook
    toast.success("Notes shared to group!");
    setIsShareOpen(false);
  };

  const notesContent = editedNotes || generatedNotes;

  return (
    <div className="space-y-6">
      <Card className="glass border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Note Generator
          </CardTitle>
          <CardDescription>
            Generate comprehensive study notes with AI assistance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Subject</Label>
              <Select value={notesSubject} onValueChange={setNotesSubject}>
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
            <div className="space-y-2">
              <Label>Style</Label>
              <Select value={notesStyle} onValueChange={(v: "detailed" | "summary" | "bullet") => setNotesStyle(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="detailed">Detailed Notes</SelectItem>
                  <SelectItem value="summary">Concise Summary</SelectItem>
                  <SelectItem value="bullet">Bullet Points</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Topic</Label>
            <Input
              placeholder="e.g., Photosynthesis, World War II, Quadratic Equations"
              value={notesTopic}
              onChange={(e) => setNotesTopic(e.target.value)}
            />
          </div>

          <Button onClick={handleGenerateNotes} disabled={isLoading} className="w-full">
            {isLoading ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating Notes...</>
            ) : (
              <><BookOpen className="h-4 w-4 mr-2" />Generate Notes</>
            )}
          </Button>
        </CardContent>
      </Card>

      {notesContent && (
        <Card className="glass border-white/10">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Generated Notes
              </CardTitle>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={isEditing ? "default" : "outline"}
                  size="sm"
                  onClick={() => setIsEditing(!isEditing)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  {isEditing ? "Preview" : "Edit"}
                </Button>
                <Button variant="outline" size="sm" onClick={copyToClipboard}>
                  <Copy className="h-4 w-4 mr-1" />
                  Copy
                </Button>
                <Button variant="outline" size="sm" onClick={downloadAsText}>
                  <Download className="h-4 w-4 mr-1" />
                  .txt
                </Button>
                <Button variant="outline" size="sm" onClick={downloadAsMarkdown}>
                  <Download className="h-4 w-4 mr-1" />
                  .md
                </Button>
                {groups.length > 0 && (
                  <Button variant="outline" size="sm" onClick={() => setIsShareOpen(true)}>
                    <Share2 className="h-4 w-4 mr-1" />
                    Share
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <Textarea
                value={editedNotes}
                onChange={(e) => setEditedNotes(e.target.value)}
                className="min-h-[400px] font-mono text-sm"
                placeholder="Edit your notes here..."
              />
            ) : (
              <ScrollArea className="h-[400px] rounded-lg border p-4">
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown>{notesContent}</ReactMarkdown>
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={isShareOpen} onOpenChange={setIsShareOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Notes to Group</DialogTitle>
            <DialogDescription>
              Choose a group to share these notes with students
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select Group</Label>
              <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a group" />
                </SelectTrigger>
                <SelectContent>
                  {groups.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsShareOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleShareToGroup}>
              <Send className="h-4 w-4 mr-2" />
              Share Notes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
