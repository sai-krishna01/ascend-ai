 import { useEffect, useState } from "react";
 import { useParams, Navigate } from "react-router-dom";
 import { supabase } from "@/integrations/supabase/client";
 import { Header } from "@/components/layout/Header";
 import { Footer } from "@/components/layout/Footer";
 import { Loader2 } from "lucide-react";
 import ReactMarkdown from "react-markdown";
 
 interface CustomPageData {
   id: string;
   title: string;
   content: string;
   slug: string;
   is_published: boolean;
 }
 
 export default function CustomPage() {
   const { slug } = useParams<{ slug: string }>();
   const [page, setPage] = useState<CustomPageData | null>(null);
   const [isLoading, setIsLoading] = useState(true);
   const [notFound, setNotFound] = useState(false);
 
   useEffect(() => {
     const fetchPage = async () => {
       if (!slug) {
         setNotFound(true);
         setIsLoading(false);
         return;
       }
 
       const { data, error } = await supabase
         .from("custom_pages")
         .select("*")
         .eq("slug", slug)
         .eq("is_published", true)
         .maybeSingle();
 
       if (error || !data) {
         setNotFound(true);
       } else {
         setPage(data as CustomPageData);
       }
       setIsLoading(false);
     };
 
     fetchPage();
   }, [slug]);
 
   if (isLoading) {
     return (
       <div className="min-h-screen flex items-center justify-center">
         <Loader2 className="w-8 h-8 animate-spin text-primary" />
       </div>
     );
   }
 
   if (notFound) {
     return <Navigate to="/404" replace />;
   }
 
   return (
     <div className="min-h-screen bg-background flex flex-col">
       <Header />
       
       <main className="flex-1 pt-24 pb-12">
         <div className="container px-4 max-w-4xl mx-auto">
           <h1 className="text-3xl sm:text-4xl font-bold mb-6">{page?.title}</h1>
           <div className="prose prose-lg dark:prose-invert max-w-none">
             <ReactMarkdown>{page?.content || ""}</ReactMarkdown>
           </div>
         </div>
       </main>
 
       <Footer />
     </div>
   );
 }