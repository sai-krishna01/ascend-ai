import { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Send, Mail, MessageSquare } from "lucide-react";

export default function Contact() {
  const [pageData, setPageData] = useState<{ title: string; content: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const { toast } = useToast();

  useEffect(() => {
    const fetchPage = async () => {
      const { data } = await supabase
        .from("custom_pages")
        .select("title, content")
        .eq("slug", "contact")
        .eq("is_published", true)
        .single();
      
      if (data) {
        setPageData(data);
      }
      setIsLoading(false);
    };

    fetchPage();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    
    // Simulate sending (you can integrate with an actual email service)
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast({
      title: "Message sent!",
      description: "Thank you for reaching out. We'll get back to you soon.",
    });
    
    setFormData({ name: "", email: "", message: "" });
    setIsSending(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-16 container px-4">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl sm:text-4xl font-bold mb-4 text-center">
              {pageData?.title || "Contact Us"}
            </h1>
            {pageData?.content && (
              <p className="text-muted-foreground text-lg text-center mb-12 max-w-2xl mx-auto">
                {pageData.content}
              </p>
            )}
            
            <div className="grid md:grid-cols-2 gap-8">
              <Card className="glass border-white/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-primary" />
                    Send us a message
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Your name"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="your@email.com"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="message">Message</Label>
                      <Textarea
                        id="message"
                        value={formData.message}
                        onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                        placeholder="How can we help you?"
                        rows={5}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={isSending}>
                      {isSending ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <Send className="w-4 h-4 mr-2" />
                      )}
                      Send Message
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card className="glass border-white/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="w-5 h-5 text-primary" />
                    Other ways to reach us
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="font-medium mb-2">Email Support</h3>
                    <p className="text-muted-foreground">support@mentorai.com</p>
                  </div>
                  <div>
                    <h3 className="font-medium mb-2">Response Time</h3>
                    <p className="text-muted-foreground">We typically respond within 24-48 hours</p>
                  </div>
                  <div>
                    <h3 className="font-medium mb-2">Office Hours</h3>
                    <p className="text-muted-foreground">Monday - Friday, 9am - 6pm IST</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
