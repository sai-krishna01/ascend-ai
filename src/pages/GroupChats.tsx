import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { GroupChatList } from "@/components/chat/GroupChatList";
import { GroupChatInterface } from "@/components/chat/GroupChatInterface";
import { GroupChat } from "@/hooks/useGroupChats";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

export default function GroupChats() {
  const { isLoading, isAuthenticated } = useAuth();
  const [selectedGroup, setSelectedGroup] = useState<GroupChat | null>(null);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 pt-20 pb-8">
        <div className="container px-4 h-[calc(100vh-180px)]">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
            <div className={`${selectedGroup ? "hidden md:block" : ""} md:col-span-1`}>
              <GroupChatList
                onSelectGroup={setSelectedGroup}
                selectedGroupId={selectedGroup?.id}
              />
            </div>
            <div className={`${selectedGroup ? "" : "hidden md:block"} md:col-span-2`}>
              {selectedGroup ? (
                <GroupChatInterface
                  group={selectedGroup}
                  onBack={() => setSelectedGroup(null)}
                />
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <p className="text-lg font-medium">Select a group to start chatting</p>
                    <p className="text-sm text-muted-foreground/70">
                      Or create a new group with the + button
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
