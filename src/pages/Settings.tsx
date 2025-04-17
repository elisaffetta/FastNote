
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Switch,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { 
  ArrowLeft, 
  Sun, 
  Moon, 
  Volume2, 
  Bell, 
  Languages, 
  Upload, 
  Download, 
  Save 
} from "lucide-react";

const Settings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Theme settings
  const [theme, setTheme] = useState("light");
  
  // Voice settings
  const [autoTranscribe, setAutoTranscribe] = useState(true);
  const [voiceLanguage, setVoiceLanguage] = useState("en-US");
  
  // Notification settings
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [reminderNotifications, setReminderNotifications] = useState(true);
  
  // Export/Import settings
  const [exportFormat, setExportFormat] = useState("json");

  const handleSaveSettings = () => {
    // In a real app, this would persist settings to localStorage or backend
    toast({
      title: "Settings saved",
      description: "Your preferences have been updated.",
    });
  };

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
    // In a real app, this would apply the theme
    document.documentElement.classList.toggle("dark", theme === "light");
  };

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-3xl">
      <header className="flex justify-between items-center mb-6">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => navigate("/")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <h1 className="text-2xl font-bold">Settings</h1>
        <Button onClick={handleSaveSettings}>
          <Save className="h-4 w-4 mr-2" /> Save
        </Button>
      </header>

      <div className="space-y-6">
        {/* Appearance */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Appearance</h2>
          
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              {theme === "light" ? (
                <Sun className="h-5 w-5 mr-2 text-amber-500" />
              ) : (
                <Moon className="h-5 w-5 mr-2 text-indigo-400" />
              )}
              <span>Dark Mode</span>
            </div>
            <Switch 
              checked={theme === "dark"} 
              onCheckedChange={toggleTheme} 
            />
          </div>
        </Card>

        {/* Voice Settings */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Voice Settings</h2>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <Volume2 className="h-5 w-5 mr-2 text-primary" />
                <span>Auto-Transcribe</span>
              </div>
              <Switch 
                checked={autoTranscribe} 
                onCheckedChange={setAutoTranscribe} 
              />
            </div>
            
            <Separator />
            
            <div className="flex flex-col space-y-2">
              <label className="flex items-center">
                <Languages className="h-5 w-5 mr-2 text-primary" />
                <span>Recognition Language</span>
              </label>
              <Select 
                value={voiceLanguage}
                onValueChange={setVoiceLanguage}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en-US">English (US)</SelectItem>
                  <SelectItem value="en-GB">English (UK)</SelectItem>
                  <SelectItem value="es-ES">Spanish</SelectItem>
                  <SelectItem value="fr-FR">French</SelectItem>
                  <SelectItem value="de-DE">German</SelectItem>
                  <SelectItem value="it-IT">Italian</SelectItem>
                  <SelectItem value="ja-JP">Japanese</SelectItem>
                  <SelectItem value="ko-KR">Korean</SelectItem>
                  <SelectItem value="zh-CN">Chinese (Simplified)</SelectItem>
                  <SelectItem value="ru-RU">Russian</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Notifications */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Notifications</h2>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <Bell className="h-5 w-5 mr-2 text-primary" />
                <span>Enable Notifications</span>
              </div>
              <Switch 
                checked={notificationsEnabled} 
                onCheckedChange={setNotificationsEnabled} 
              />
            </div>
            
            {notificationsEnabled && (
              <>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="pl-7">Reminder Notifications</span>
                  <Switch 
                    checked={reminderNotifications} 
                    onCheckedChange={setReminderNotifications} 
                  />
                </div>
              </>
            )}
          </div>
        </Card>

        {/* Data Management */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Data Management</h2>
          
          <div className="space-y-4">
            <div className="flex flex-col space-y-2">
              <label className="flex items-center">
                <Download className="h-5 w-5 mr-2 text-primary" />
                <span>Export Format</span>
              </label>
              <Select 
                value={exportFormat}
                onValueChange={setExportFormat}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="json">JSON</SelectItem>
                  <SelectItem value="txt">Plain Text</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="pdf">PDF</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1">
                <Download className="h-4 w-4 mr-2" /> Export Notes
              </Button>
              <Button variant="outline" className="flex-1">
                <Upload className="h-4 w-4 mr-2" /> Import Notes
              </Button>
            </div>
          </div>
        </Card>

        {/* Version info */}
        <div className="text-center text-sm text-muted-foreground">
          SonicNoteHaven v1.0.0
        </div>
      </div>
    </div>
  );
};

export default Settings;
