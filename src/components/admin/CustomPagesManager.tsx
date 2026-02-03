import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { FileText, Edit, Save, X } from "lucide-react";

interface CustomPage {
  id: string;
  slug: string;
  title: string;
  content: string;
  is_published: boolean;
  updated_at: string;
}

interface CustomPagesManagerProps {
  pages: CustomPage[];
  onUpdatePage: (id: string, updates: Partial<CustomPage>) => void;
}

export function CustomPagesManager({ pages, onUpdatePage }: CustomPagesManagerProps) {
  const [editingPage, setEditingPage] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: "", content: "" });

  const startEditing = (page: CustomPage) => {
    setEditingPage(page.id);
    setEditForm({ title: page.title, content: page.content });
  };

  const saveEdit = (id: string) => {
    onUpdatePage(id, editForm);
    setEditingPage(null);
  };

  const cancelEdit = () => {
    setEditingPage(null);
    setEditForm({ title: "", content: "" });
  };

  return (
    <Card className="glass border-white/10">
      <CardHeader>
        <CardTitle>Custom Pages</CardTitle>
        <CardDescription>Manage About and Contact page content</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {pages.map((page) => (
          <div key={page.id} className="p-4 rounded-lg bg-secondary/50">
            {editingPage === page.id ? (
              <div className="space-y-4">
                <div>
                  <Label htmlFor={`title-${page.id}`}>Page Title</Label>
                  <Input
                    id={`title-${page.id}`}
                    value={editForm.title}
                    onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor={`content-${page.id}`}>Content</Label>
                  <Textarea
                    id={`content-${page.id}`}
                    value={editForm.content}
                    onChange={(e) => setEditForm(prev => ({ ...prev, content: e.target.value }))}
                    rows={6}
                    className="mt-1"
                  />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => saveEdit(page.id)}>
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={cancelEdit}>
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    <span className="font-medium">{page.title}</span>
                    <span className="text-xs text-muted-foreground">/{page.slug}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`published-${page.id}`} className="text-sm">Published</Label>
                      <Switch
                        id={`published-${page.id}`}
                        checked={page.is_published}
                        onCheckedChange={(checked) => onUpdatePage(page.id, { is_published: checked })}
                      />
                    </div>
                    <Button size="sm" variant="outline" onClick={() => startEditing(page)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">{page.content}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Last updated: {new Date(page.updated_at).toLocaleString()}
                </p>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
