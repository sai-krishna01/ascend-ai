 import { useState } from "react";
 import { supabase } from "@/integrations/supabase/client";
 import { toast } from "sonner";
 import { Loader2, Plus, Trash2 } from "lucide-react";
 import {
   AlertDialog,
   AlertDialogAction,
   AlertDialogCancel,
   AlertDialogContent,
   AlertDialogDescription,
   AlertDialogFooter,
   AlertDialogHeader,
   AlertDialogTitle,
 } from "@/components/ui/alert-dialog";
 import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogFooter,
   DialogHeader,
   DialogTitle,
   DialogTrigger,
 } from "@/components/ui/dialog";
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
   onRefresh?: () => void;
 }

 export function CustomPagesManager({ pages, onUpdatePage, onRefresh }: CustomPagesManagerProps) {
   const [editingPage, setEditingPage] = useState<string | null>(null);
   const [editForm, setEditForm] = useState({ title: "", content: "" });
   const [isCreateOpen, setIsCreateOpen] = useState(false);
   const [isCreating, setIsCreating] = useState(false);
   const [newPage, setNewPage] = useState({ title: "", slug: "", content: "" });
   const [deletingPage, setDeletingPage] = useState<CustomPage | null>(null);
   const [isDeleting, setIsDeleting] = useState(false);

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
 
   const handleCreatePage = async () => {
     if (!newPage.title.trim() || !newPage.slug.trim()) {
       toast.error("Title and slug are required");
       return;
     }
 
     // Validate slug format
     const slugRegex = /^[a-z0-9-]+$/;
     if (!slugRegex.test(newPage.slug)) {
       toast.error("Slug must be lowercase letters, numbers, and hyphens only");
       return;
     }
 
     setIsCreating(true);
     try {
       const { error } = await supabase
         .from("custom_pages")
         .insert({
           title: newPage.title.trim(),
           slug: newPage.slug.trim(),
           content: newPage.content.trim() || "Content goes here...",
           is_published: false,
         });
 
       if (error) {
         if (error.code === "23505") {
           toast.error("A page with this slug already exists");
         } else {
           throw error;
         }
       } else {
         toast.success("Page created successfully");
         setIsCreateOpen(false);
         setNewPage({ title: "", slug: "", content: "" });
         onRefresh?.();
       }
     } catch (error: any) {
       toast.error(error.message || "Failed to create page");
     } finally {
       setIsCreating(false);
     }
   };
 
   const handleDeletePage = async () => {
     if (!deletingPage) return;
 
     setIsDeleting(true);
     try {
       const { error } = await supabase
         .from("custom_pages")
         .delete()
         .eq("id", deletingPage.id);
 
       if (error) throw error;
 
       toast.success("Page deleted successfully");
       setDeletingPage(null);
       onRefresh?.();
     } catch (error: any) {
       toast.error(error.message || "Failed to delete page");
     } finally {
       setIsDeleting(false);
     }
   };

  return (
    <Card className="glass border-white/10">
       <CardHeader className="flex flex-row items-center justify-between">
         <div>
           <CardTitle>Custom Pages</CardTitle>
           <CardDescription>Manage custom pages (accessible at /p/slug)</CardDescription>
         </div>
         <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
           <DialogTrigger asChild>
             <Button size="sm">
               <Plus className="w-4 h-4 mr-1" />
               New Page
             </Button>
           </DialogTrigger>
           <DialogContent>
             <DialogHeader>
               <DialogTitle>Create New Page</DialogTitle>
               <DialogDescription>
                 Create a new custom page. It will be available at /p/your-slug
               </DialogDescription>
             </DialogHeader>
             <div className="space-y-4 py-4">
               <div className="space-y-2">
                 <Label htmlFor="new-title">Page Title</Label>
                 <Input
                   id="new-title"
                   placeholder="e.g., Terms of Service"
                   value={newPage.title}
                   onChange={(e) => setNewPage(prev => ({ ...prev, title: e.target.value }))}
                 />
               </div>
               <div className="space-y-2">
                 <Label htmlFor="new-slug">URL Slug</Label>
                 <div className="flex items-center gap-2">
                   <span className="text-muted-foreground text-sm">/p/</span>
                   <Input
                     id="new-slug"
                     placeholder="e.g., terms-of-service"
                     value={newPage.slug}
                     onChange={(e) => setNewPage(prev => ({ 
                       ...prev, 
                       slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') 
                     }))}
                   />
                 </div>
               </div>
               <div className="space-y-2">
                 <Label htmlFor="new-content">Initial Content</Label>
                 <Textarea
                   id="new-content"
                   placeholder="Page content (you can edit later)"
                   rows={4}
                   value={newPage.content}
                   onChange={(e) => setNewPage(prev => ({ ...prev, content: e.target.value }))}
                 />
               </div>
             </div>
             <DialogFooter>
               <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                 Cancel
               </Button>
               <Button onClick={handleCreatePage} disabled={isCreating}>
                 {isCreating ? (
                   <>
                     <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                     Creating...
                   </>
                 ) : (
                   "Create Page"
                 )}
               </Button>
             </DialogFooter>
           </DialogContent>
         </Dialog>
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
                       <span className="text-xs text-muted-foreground">/p/{page.slug}</span>
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
                       <Button 
                         size="sm" 
                         variant="ghost" 
                         className="text-destructive hover:text-destructive"
                         onClick={() => setDeletingPage(page)}
                       >
                         <Trash2 className="w-4 h-4" />
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
 
       {/* Delete Confirmation */}
       <AlertDialog open={!!deletingPage} onOpenChange={(open) => !open && setDeletingPage(null)}>
         <AlertDialogContent>
           <AlertDialogHeader>
             <AlertDialogTitle>Delete Page</AlertDialogTitle>
             <AlertDialogDescription>
               Are you sure you want to delete "{deletingPage?.title}"? This action cannot be undone.
             </AlertDialogDescription>
           </AlertDialogHeader>
           <AlertDialogFooter>
             <AlertDialogCancel>Cancel</AlertDialogCancel>
             <AlertDialogAction
               onClick={handleDeletePage}
               disabled={isDeleting}
               className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
             >
               {isDeleting ? (
                 <>
                   <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                   Deleting...
                 </>
               ) : (
                 "Delete"
               )}
             </AlertDialogAction>
           </AlertDialogFooter>
         </AlertDialogContent>
       </AlertDialog>
     </Card>
  );
}
