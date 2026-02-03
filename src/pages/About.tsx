import { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

export default function About() {
  const [pageData, setPageData] = useState<{ title: string; content: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPage = async () => {
      const { data } = await supabase
        .from("custom_pages")
        .select("title, content")
        .eq("slug", "about")
        .eq("is_published", true)
        .single();
      
      if (data) {
        setPageData(data);
      }
      setIsLoading(false);
    };

    fetchPage();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-16 container px-4">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : pageData ? (
          <div className="max-w-3xl mx-auto">
            <h1 className="text-3xl sm:text-4xl font-bold mb-8 text-center">{pageData.title}</h1>
            <div className="prose prose-invert max-w-none">
              {pageData.content.split('\n').map((paragraph, index) => (
                <p key={index} className="text-muted-foreground text-lg leading-relaxed mb-4">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Page not found</p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
