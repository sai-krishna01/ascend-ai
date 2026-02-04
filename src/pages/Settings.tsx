import { useState, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { USER_LEVELS, UNIVERSITIES, UserLevel, Language } from "@/lib/types";
import { 
  User, 
  Settings as SettingsIcon, 
  Shield, 
  Bell,
  Loader2,
  Save,
  ArrowLeft
} from "lucide-react";

export default function Settings() {
  const { user, profile, isLoading, isAuthenticated, updateProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    full_name: "",
    user_level: "school" as UserLevel,
    preferred_language: "english" as Language,
    university: "",
  });

  // Initialize form data when profile loads
  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || "",
        user_level: profile.user_level as UserLevel || "school",
        preferred_language: profile.preferred_language as Language || "english",
        university: profile.university || "",
      });
    }
  }, [profile]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const { error } = await updateProfile(formData);
      if (!error) {
        toast.success("Profile updated successfully!");
      }
    } catch (error) {
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20 pb-8">
        <div className="container px-4 max-w-4xl">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate("/dashboard")}
            className="mb-4 gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>

          <div className="mb-6 sm:mb-8">
            <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
              <SettingsIcon className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Settings</h1>
            </div>
            <p className="text-muted-foreground text-sm sm:text-base">
              Manage your account settings and preferences
            </p>
          </div>

          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-3 mb-6">
              <TabsTrigger value="profile" className="gap-1.5 text-xs sm:text-sm">
                <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Profile</span>
              </TabsTrigger>
              <TabsTrigger value="preferences" className="gap-1.5 text-xs sm:text-sm">
                <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Preferences</span>
              </TabsTrigger>
              <TabsTrigger value="account" className="gap-1.5 text-xs sm:text-sm">
                <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Account</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="glass border-white/10">
                  <CardHeader>
                    <CardTitle className="text-lg">Profile Information</CardTitle>
                    <CardDescription>Update your personal details</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="full_name">Full Name</Label>
                      <Input
                        id="full_name"
                        placeholder="Your name"
                        value={formData.full_name}
                        onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={user?.email || ""}
                        disabled
                        className="bg-muted"
                      />
                      <p className="text-xs text-muted-foreground">
                        Email cannot be changed
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="user_level">Education Level</Label>
                      <Select 
                        value={formData.user_level} 
                        onValueChange={(value: UserLevel) => setFormData(prev => ({ ...prev, user_level: value }))}
                      >
                        <SelectTrigger id="user_level">
                          <SelectValue placeholder="Select your level" />
                        </SelectTrigger>
                        <SelectContent>
                          {USER_LEVELS.map((level) => (
                            <SelectItem key={level.id} value={level.id}>
                              <span className="flex items-center gap-2">
                                <span>{level.icon}</span>
                                <span>{level.name}</span>
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="university">University (Optional)</Label>
                      <Select 
                        value={formData.university || "none"} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, university: value === "none" ? "" : value }))}
                      >
                        <SelectTrigger id="university">
                          <SelectValue placeholder="Select your university" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {UNIVERSITIES.map((uni) => (
                            <SelectItem key={uni.id} value={uni.id}>
                              {uni.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <Button onClick={handleSaveProfile} disabled={isSaving} className="gap-2">
                      {isSaving ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            <TabsContent value="preferences">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="glass border-white/10">
                  <CardHeader>
                    <CardTitle className="text-lg">Preferences</CardTitle>
                    <CardDescription>Customize your learning experience</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="preferred_language">Preferred Language</Label>
                      <Select 
                        value={formData.preferred_language} 
                        onValueChange={(value: Language) => setFormData(prev => ({ ...prev, preferred_language: value }))}
                      >
                        <SelectTrigger id="preferred_language">
                          <SelectValue placeholder="Select language" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="english">🇬🇧 English</SelectItem>
                          <SelectItem value="hindi">🇮🇳 हिंदी (Hindi)</SelectItem>
                          <SelectItem value="telugu">🏛️ తెలుగు (Telugu)</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        AI responses will be in this language when possible
                      </p>
                    </div>

                    <Button onClick={handleSaveProfile} disabled={isSaving} className="gap-2">
                      {isSaving ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          Save Preferences
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            <TabsContent value="account">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <Card className="glass border-white/10">
                  <CardHeader>
                    <CardTitle className="text-lg">Account Information</CardTitle>
                    <CardDescription>View your account details</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center py-2">
                      <span className="text-muted-foreground">Account ID</span>
                      <span className="font-mono text-xs truncate max-w-[200px]">{user?.id}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center py-2">
                      <span className="text-muted-foreground">Joined</span>
                      <span>{profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : "N/A"}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center py-2">
                      <span className="text-muted-foreground">Last Updated</span>
                      <span>{profile?.updated_at ? new Date(profile.updated_at).toLocaleDateString() : "N/A"}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass border-destructive/20">
                  <CardHeader>
                    <CardTitle className="text-lg text-destructive">Danger Zone</CardTitle>
                    <CardDescription>Irreversible actions</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 py-2">
                      <div>
                        <p className="font-medium">Sign Out</p>
                        <p className="text-sm text-muted-foreground">Log out of your account</p>
                      </div>
                      <Button variant="destructive" onClick={handleSignOut}>
                        Sign Out
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
}
