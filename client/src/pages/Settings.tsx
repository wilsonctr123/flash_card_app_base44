import { useState, useRef } from "react";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useSettings } from "@/hooks/useSettings";
import { useAuth } from "@/hooks/useAuth";
import { Bell, User, Clock, Download, Upload, Palette, Loader2 } from "lucide-react";

export default function Settings() {
  const { settings, isLoading, updateSettings, setTheme, setDailyGoal, setAutoAdvance, 
          setShowAnswerImmediately, setAlgorithm, setStudyReminders, setDailyStreakReminder,
          setPerformanceAlerts, setReminderTime, setCardAnimations, setDisplayName,
          resetProgress, exportData, importData, deleteAccount } = useSettings();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [displayNameInput, setDisplayNameInput] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize display name when settings load
  useState(() => {
    if (settings?.displayName) {
      setDisplayNameInput(settings.displayName);
    }
  });

  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    try {
      await setDisplayName(displayNameInput || null);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/json") {
      toast({
        title: "Invalid file type",
        description: "Please select a JSON file",
        variant: "destructive",
      });
      return;
    }

    await importData(file);
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleResetProgress = async () => {
    setIsResetting(true);
    try {
      await resetProgress();
      setShowResetDialog(false);
    } finally {
      setIsResetting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") return;
    
    setIsDeleting(true);
    try {
      await deleteAccount();
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div>
        <Header 
          title="Settings" 
          description="Customize your learning experience and preferences"
          showCreateButton={false}
        />
        <div className="max-w-4xl mx-auto space-y-8">
          <Card className="border-border">
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header 
        title="Settings" 
        description="Customize your learning experience and preferences"
        showCreateButton={false}
      />

      <div className="max-w-4xl mx-auto space-y-8">
        {/* Profile Settings */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User size={20} />
              Profile Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Display Name</Label>
                <Input 
                  id="name" 
                  value={displayNameInput || settings?.displayName || ""} 
                  onChange={(e) => setDisplayNameInput(e.target.value)}
                  placeholder="Enter your display name"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  value={user?.email || ""} 
                  disabled
                  className="bg-muted"
                />
              </div>
            </div>
            <Button 
              className="gradient-primary text-foreground" 
              onClick={handleSaveProfile}
              disabled={isSavingProfile}
            >
              {isSavingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </CardContent>
        </Card>

        {/* Study Settings */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock size={20} />
              Study Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Daily Study Goal</Label>
                  <p className="text-sm text-muted-foreground">Number of cards to review per day</p>
                </div>
                <Select 
                  value={settings?.dailyGoal?.toString() || "25"} 
                  onValueChange={(value) => setDailyGoal(parseInt(value))}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 cards</SelectItem>
                    <SelectItem value="25">25 cards</SelectItem>
                    <SelectItem value="50">50 cards</SelectItem>
                    <SelectItem value="100">100 cards</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label>Auto-advance cards</Label>
                  <p className="text-sm text-muted-foreground">Automatically show next card after rating</p>
                </div>
                <Switch 
                  checked={settings?.autoAdvance ?? true} 
                  onCheckedChange={setAutoAdvance}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label>Show answer immediately</Label>
                  <p className="text-sm text-muted-foreground">Skip the "click to reveal" step</p>
                </div>
                <Switch 
                  checked={settings?.showAnswerImmediately ?? false} 
                  onCheckedChange={setShowAnswerImmediately}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label>Spaced repetition algorithm</Label>
                  <p className="text-sm text-muted-foreground">Algorithm used for scheduling reviews</p>
                </div>
                <Select 
                  value={settings?.algorithm || "sm2"} 
                  onValueChange={(value) => setAlgorithm(value as 'sm2' | 'fsrs' | 'anki')}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sm2">SM-2 (Classic)</SelectItem>
                    <SelectItem value="fsrs">FSRS (Modern)</SelectItem>
                    <SelectItem value="anki">Anki Algorithm</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell size={20} />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Study reminders</Label>
                  <p className="text-sm text-muted-foreground">Get notified when you have cards to review</p>
                </div>
                <Switch 
                  checked={settings?.studyReminders ?? true} 
                  onCheckedChange={setStudyReminders}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label>Daily study streak</Label>
                  <p className="text-sm text-muted-foreground">Reminder to maintain your study streak</p>
                </div>
                <Switch 
                  checked={settings?.dailyStreakReminder ?? true} 
                  onCheckedChange={setDailyStreakReminder}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label>Performance alerts</Label>
                  <p className="text-sm text-muted-foreground">Alerts when accuracy drops below threshold</p>
                </div>
                <Switch 
                  checked={settings?.performanceAlerts ?? true} 
                  onCheckedChange={setPerformanceAlerts}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label>Reminder time</Label>
                  <p className="text-sm text-muted-foreground">When to send study reminders</p>
                </div>
                <Select 
                  value={settings?.reminderTime || "18:00"} 
                  onValueChange={setReminderTime}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="09:00">9:00 AM</SelectItem>
                    <SelectItem value="12:00">12:00 PM</SelectItem>
                    <SelectItem value="18:00">6:00 PM</SelectItem>
                    <SelectItem value="20:00">8:00 PM</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette size={20} />
              Appearance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Theme</Label>
                <p className="text-sm text-muted-foreground">Choose your preferred theme</p>
              </div>
              <Select 
                value={settings?.theme || "light"} 
                onValueChange={(value) => setTheme(value as 'light' | 'dark' | 'system')}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label>Card animations</Label>
                <p className="text-sm text-muted-foreground">Enable smooth card transitions</p>
              </div>
              <Switch 
                checked={settings?.cardAnimations ?? true} 
                onCheckedChange={setCardAnimations}
              />
            </div>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Data Management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button 
                variant="outline" 
                className="flex items-center gap-2"
                onClick={exportData}
              >
                <Download size={16} />
                Export All Data
              </Button>
              <Button 
                variant="outline" 
                className="flex items-center gap-2"
                onClick={handleImportClick}
              >
                <Upload size={16} />
                Import Data
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileImport}
                className="hidden"
              />
            </div>
            
            <Separator />
            
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
              <h3 className="font-semibold text-destructive mb-2">Danger Zone</h3>
              <p className="text-sm text-muted-foreground mb-4">
                These actions cannot be undone. Please be careful.
              </p>
              <div className="space-y-2">
                <Button 
                  variant="outline" 
                  className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => setShowResetDialog(true)}
                >
                  Reset All Progress
                </Button>
                <Button 
                  variant="destructive"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  Delete Account
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reset Progress Dialog */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset All Progress?</AlertDialogTitle>
            <AlertDialogDescription>
              This will reset all your flashcard progress, including review counts, intervals, and success rates. 
              Your cards and topics will remain, but all learning progress will be lost.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleResetProgress}
              disabled={isResetting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isResetting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Reset Progress
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Account Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Your Account?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <span>This will permanently delete your account and all associated data, including:</span>
              <ul className="list-disc list-inside mt-2">
                <li>All flashcards and topics</li>
                <li>Study history and progress</li>
                <li>Settings and preferences</li>
              </ul>
              <span className="font-semibold text-destructive">This action cannot be undone.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="delete-confirm">Type "DELETE" to confirm</Label>
            <Input
              id="delete-confirm"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Type DELETE to confirm"
              className="mt-2"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteConfirmText("")}>
              Cancel
            </AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={deleteConfirmText !== "DELETE" || isDeleting}
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Account
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}