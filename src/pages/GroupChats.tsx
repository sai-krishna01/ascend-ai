import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { GroupChatList } from "@/components/chat/GroupChatList";
import { GroupChatInterface } from "@/components/chat/GroupChatInterface";
import { useAuth } from "@/hooks/useAuth";
import { useAISettings } from "@/hooks/useAISettings";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function GroupChats() {
  const { isLoading: authLoading, isAuthenticated, user, role } = useAuth();
  const { isLoading: settingsLoading, canAccessAIGroupChat } = useAISettings();
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  // Reset selected group when user changes (logout/login)
  useEffect(() => {
    setSelectedGroupId(null);
  }, [user?.id]);

  if (authLoading || settingsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  // Check AI access based on role permissions
  const aiEnabled = canAccessAIGroupChat();
  const isAdmin = role === "admin" || role === "founder";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 pt-20 pb-8">
        <div className="container px-4">
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold">Group Chats</h1>
            <p className="text-muted-foreground">
              Collaborate with classmates and get AI assistance
              {!aiEnabled && !isAdmin && (
                <span className="text-destructive ml-2">(AI assistance is currently disabled)</span>
              )}
            </p>
          </div>
          
          <div className="grid lg:grid-cols-3 gap-6 h-[calc(100vh-12rem)]">
            <div className={`${selectedGroupId ? "hidden lg:block" : ""} lg:col-span-1`}>
              <GroupChatList
                selectedGroupId={selectedGroupId}
                onSelectGroup={setSelectedGroupId}
              />
            </div>
            <div className={`${selectedGroupId ? "" : "hidden lg:block"} lg:col-span-2`}>
              {selectedGroupId ? (
                <GroupChatInterface 
                  groupId={selectedGroupId} 
                  onBack={() => setSelectedGroupId(null)}
                  aiEnabled={aiEnabled}
                />
              ) : (
                <Card className="h-full flex items-center justify-center">
                  <CardContent className="text-center py-12">
                    <p className="text-lg font-medium mb-2">Select a group to start chatting</p>
                    <p className="text-sm text-muted-foreground">
                      Or create a new group with the + button
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
