import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  HelpCircle,
  FileQuestion,
  Brain,
  Lightbulb,
  BookOpen,
  Loader2,
  Copy,
  Download,
  Sparkles,
  FileText,
  FileType,
  Upload,
  Paperclip,
  X,
  Link as LinkIcon,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAIFeatures } from "@/hooks/useAIFeatures";
import { useFileUpload, UploadedFile } from "@/hooks/useFileUpload";
import { SUBJECTS } from "@/lib/types";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

export function AIFeaturesPanel() {
  const {
    isLoading,
    solveDoubt,
    generateQuiz,
    generatePracticeQuestions,
    explainConcept,
    getRecommendations,
    generateNotes,
  } = useAIFeatures();

  const { uploadFile, isUploading, getFileIcon, formatFileSize } = useFileUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState("doubt");
  const [result, setResult] = useState<string>("");
  const [attachedFiles, setAttachedFiles] = useState<UploadedFile[]>([]);
  const [externalLink, setExternalLink] = useState("");

  // Doubt solving state
  const [doubtQuestion, setDoubtQuestion] = useState("");
  const [doubtSubject, setDoubtSubject] = useState("");

  // Quiz state
  const [quizTopic, setQuizTopic] = useState("");
  const [quizCount, setQuizCount] = useState("5");
  const [quizDifficulty, setQuizDifficulty] = useState<"easy" | "medium" | "hard">("medium");

  // Practice state
  const [practiceTopic, setPracticeTopic] = useState("");
  const [practiceCount, setPracticeCount] = useState("10");

  // Explain state
  const [explainConcept_, setExplainConcept] = useState("");
  const [explainLevel, setExplainLevel] = useState("school");

  // Notes state
  const [notesTopic, setNotesTopic] = useState("");
  const [notesStyle, setNotesStyle] = useState<"detailed" | "summary" | "bullet">("detailed");

  // Recommendations state
  const [recSubject, setRecSubject] = useState("");

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    for (const file of Array.from(files)) {
      const uploadedFile = await uploadFile(file);
      if (uploadedFile) {
        setAttachedFiles(prev => [...prev, uploadedFile]);
        toast.success(`${file.name} uploaded successfully`);
      }
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const addExternalLink = () => {
    if (!externalLink.trim()) return;
    
    try {
      new URL(externalLink);
      // Add as a "file" reference
      setAttachedFiles(prev => [...prev, {
        name: externalLink,
        url: externalLink,
        type: "external/link",
        size: 0,
      }]);
      setExternalLink("");
      toast.success("Link added");
    } catch {
      toast.error("Please enter a valid URL");
    }
  };

  const getContextFromAttachments = (): string => {
    if (attachedFiles.length === 0) return "";
    
    const fileList = attachedFiles.map(f => {
      if (f.type === "external/link") {
        return `- External resource: ${f.url}`;
      }
      return `- File: ${f.name} (${f.type})`;
    }).join("\n");
    
    return `\n\nAttached context:\n${fileList}`;
  };

  const handleSolveDoubt = async () => {
    if (!doubtQuestion.trim()) {
      toast.error("Please enter your question");
      return;
    }
    const contextInfo = getContextFromAttachments();
    const fullQuestion = doubtQuestion + contextInfo;
    const response = await solveDoubt(fullQuestion, doubtSubject);
    if (response.success) setResult(response.content);
  };

  const handleGenerateQuiz = async () => {
    if (!quizTopic.trim()) {
      toast.error("Please enter a topic");
      return;
    }
    const response = await generateQuiz(quizTopic, parseInt(quizCount), quizDifficulty);
    if (response.success) setResult(response.content);
  };

  const handlePractice = async () => {
    if (!practiceTopic.trim()) {
      toast.error("Please enter a topic");
      return;
    }
    const response = await generatePracticeQuestions(practiceTopic, parseInt(practiceCount));
    if (response.success) setResult(response.content);
  };

  const handleExplain = async () => {
    if (!explainConcept_.trim()) {
      toast.error("Please enter a concept");
      return;
    }
    const response = await explainConcept(explainConcept_, explainLevel);
    if (response.success) setResult(response.content);
  };

  const handleNotes = async () => {
    if (!notesTopic.trim()) {
      toast.error("Please enter a topic");
      return;
    }
    const response = await generateNotes(notesTopic, notesStyle);
    if (response.success) setResult(response.content);
  };

  const handleRecommendations = async () => {
    if (!recSubject.trim()) {
      toast.error("Please select a subject");
      return;
    }
    const response = await getRecommendations(recSubject, []);
    if (response.success) setResult(response.content);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(result);
    toast.success("Copied to clipboard!");
  };

  const downloadAsText = () => {
    const blob = new Blob([result], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mentorai-${activeTab}-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Downloaded as TXT!");
  };

  const downloadAsMarkdown = () => {
    const blob = new Blob([result], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mentorai-${activeTab}-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Downloaded as Markdown!");
  };

  const downloadAsDoc = () => {
    // Create HTML that Word can open
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>MentorAI - ${activeTab}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; }
          h1, h2, h3 { color: #333; }
          pre { background: #f4f4f4; padding: 10px; border-radius: 5px; }
          code { background: #f4f4f4; padding: 2px 6px; border-radius: 3px; }
        </style>
      </head>
      <body>
        <h1>MentorAI - ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h1>
        <div>${result.replace(/\n/g, '<br>')}</div>
      </body>
      </html>
    `;
    const blob = new Blob([htmlContent], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mentorai-${activeTab}-${Date.now()}.doc`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Downloaded as DOC!");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
      <Card className="glass border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Learning Tools
          </CardTitle>
          <CardDescription>
            Use AI to solve doubts, generate quizzes, and more
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-3 lg:grid-cols-6 mb-4 h-auto">
              <TabsTrigger value="doubt" className="text-xs py-2">
                <HelpCircle className="h-3 w-3 mr-1" />
                <span className="hidden sm:inline">Doubt</span>
              </TabsTrigger>
              <TabsTrigger value="quiz" className="text-xs py-2">
                <FileQuestion className="h-3 w-3 mr-1" />
                <span className="hidden sm:inline">Quiz</span>
              </TabsTrigger>
              <TabsTrigger value="practice" className="text-xs py-2">
                <Brain className="h-3 w-3 mr-1" />
                <span className="hidden sm:inline">Practice</span>
              </TabsTrigger>
              <TabsTrigger value="explain" className="text-xs py-2">
                <Lightbulb className="h-3 w-3 mr-1" />
                <span className="hidden sm:inline">Explain</span>
              </TabsTrigger>
              <TabsTrigger value="notes" className="text-xs py-2">
                <BookOpen className="h-3 w-3 mr-1" />
                <span className="hidden sm:inline">Notes</span>
              </TabsTrigger>
              <TabsTrigger value="recommend" className="text-xs py-2">
                <Sparkles className="h-3 w-3 mr-1" />
                <span className="hidden sm:inline">Tips</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="doubt" className="space-y-4">
              <div className="space-y-2">
                <Label>Subject (optional)</Label>
                <Select value={doubtSubject} onValueChange={setDoubtSubject}>
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
                <Label>Your Question</Label>
                <Textarea
                  placeholder="Type your doubt or question here..."
                  value={doubtQuestion}
                  onChange={(e) => setDoubtQuestion(e.target.value)}
                  rows={4}
                />
              </div>

              {/* File Upload Section */}
              <div className="space-y-2">
                <Label>Attach Files or Links (optional)</Label>
                <div className="flex gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".pdf,.doc,.docx,.txt,image/*"
                    multiple
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4 mr-1" />
                    )}
                    Upload File
                  </Button>
                  <div className="flex-1 flex gap-2">
                    <Input
                      placeholder="Paste YouTube or resource link..."
                      value={externalLink}
                      onChange={(e) => setExternalLink(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addExternalLink}
                    >
                      <LinkIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Attached Files List */}
                {attachedFiles.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {attachedFiles.map((file, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1 px-2 py-1">
                        <span>{getFileIcon(file.type)}</span>
                        <span className="max-w-[150px] truncate text-xs">
                          {file.type === "external/link" ? new URL(file.url).hostname : file.name}
                        </span>
                        {file.size > 0 && (
                          <span className="text-xs text-muted-foreground">
                            ({formatFileSize(file.size)})
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <Button onClick={handleSolveDoubt} disabled={isLoading} className="w-full">
                {isLoading ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Solving...</>
                ) : (
                  <><HelpCircle className="h-4 w-4 mr-2" />Solve Doubt</>
                )}
              </Button>
            </TabsContent>

            <TabsContent value="quiz" className="space-y-4">
              <div className="space-y-2">
                <Label>Topic</Label>
                <Input
                  placeholder="e.g., Photosynthesis, Newton's Laws"
                  value={quizTopic}
                  onChange={(e) => setQuizTopic(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Questions</Label>
                  <Select value={quizCount} onValueChange={setQuizCount}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3</SelectItem>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Difficulty</Label>
                  <Select value={quizDifficulty} onValueChange={(v: "easy" | "medium" | "hard") => setQuizDifficulty(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleGenerateQuiz} disabled={isLoading} className="w-full">
                {isLoading ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating...</>
                ) : (
                  <><FileQuestion className="h-4 w-4 mr-2" />Generate Quiz</>
                )}
              </Button>
            </TabsContent>

            <TabsContent value="practice" className="space-y-4">
              <div className="space-y-2">
                <Label>Topic</Label>
                <Input
                  placeholder="e.g., Quadratic Equations"
                  value={practiceTopic}
                  onChange={(e) => setPracticeTopic(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Number of Questions</Label>
                <Select value={practiceCount} onValueChange={setPracticeCount}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="15">15</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handlePractice} disabled={isLoading} className="w-full">
                {isLoading ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating...</>
                ) : (
                  <><Brain className="h-4 w-4 mr-2" />Generate Practice</>
                )}
              </Button>
            </TabsContent>

            <TabsContent value="explain" className="space-y-4">
              <div className="space-y-2">
                <Label>Concept to Explain</Label>
                <Input
                  placeholder="e.g., DNA Replication, Supply & Demand"
                  value={explainConcept_}
                  onChange={(e) => setExplainConcept(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Your Level</Label>
                <Select value={explainLevel} onValueChange={setExplainLevel}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="primary">Primary (Class 1-5)</SelectItem>
                    <SelectItem value="school">School (Class 6-10)</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="degree">Degree</SelectItem>
                    <SelectItem value="pg">Post Graduation</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleExplain} disabled={isLoading} className="w-full">
                {isLoading ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Explaining...</>
                ) : (
                  <><Lightbulb className="h-4 w-4 mr-2" />Explain Concept</>
                )}
              </Button>
            </TabsContent>

            <TabsContent value="notes" className="space-y-4">
              <div className="space-y-2">
                <Label>Topic</Label>
                <Input
                  placeholder="e.g., French Revolution"
                  value={notesTopic}
                  onChange={(e) => setNotesTopic(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Style</Label>
                <Select value={notesStyle} onValueChange={(v: "detailed" | "summary" | "bullet") => setNotesStyle(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="detailed">Detailed Notes</SelectItem>
                    <SelectItem value="summary">Summary</SelectItem>
                    <SelectItem value="bullet">Bullet Points</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleNotes} disabled={isLoading} className="w-full">
                {isLoading ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating...</>
                ) : (
                  <><BookOpen className="h-4 w-4 mr-2" />Generate Notes</>
                )}
              </Button>
            </TabsContent>

            <TabsContent value="recommend" className="space-y-4">
              <div className="space-y-2">
                <Label>Current Subject</Label>
                <Select value={recSubject} onValueChange={setRecSubject}>
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
              <Button onClick={handleRecommendations} disabled={isLoading} className="w-full">
                {isLoading ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Analyzing...</>
                ) : (
                  <><Sparkles className="h-4 w-4 mr-2" />Get Recommendations</>
                )}
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card className="glass border-white/10">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle>Result</CardTitle>
            {result && (
              <div className="flex gap-2 flex-wrap">
                <Button variant="outline" size="sm" onClick={copyToClipboard}>
                  <Copy className="h-4 w-4 mr-1" />
                  Copy
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={downloadAsText}>
                      <FileText className="h-4 w-4 mr-2" />
                      Download as .txt
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={downloadAsMarkdown}>
                      <FileType className="h-4 w-4 mr-2" />
                      Download as .md
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={downloadAsDoc}>
                      <FileText className="h-4 w-4 mr-2" />
                      Download as .doc
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] rounded-lg border p-4">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">AI is working on it...</p>
              </div>
            ) : result ? (
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown>{result}</ReactMarkdown>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Sparkles className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">
                  Choose a tool and generate content
                </p>
                <p className="text-sm text-muted-foreground/70">
                  Results will appear here
                </p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
