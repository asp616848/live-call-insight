import { useState } from "react";
import { motion } from "framer-motion";
import { Save, Eye, EyeOff, TestTube, Palette, Bot, Key, Monitor, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/contexts/ThemeContext";

export default function Settings() {
  const { theme, setTheme, themeColor, setThemeColor } = useTheme();
  const [showApiKey, setShowApiKey] = useState(false);
  const [showS3Secret, setShowS3Secret] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [testConnection, setTestConnection] = useState(false);
  const [isWorkInProgress, setIsWorkInProgress] = useState(false);
  
  const [settings, setSettings] = useState({
    // Agent Configuration
    greeting: "Namaste! Main aapki kaise madad kar sakta hun?",
    fallbackResponse: "Maaf kariye, main samjha nahi. Kya aap phir se keh sakte hain?",
    maxSilence: 5,
    languageModel: "gpt-4",
    
    // Personalization
    animationsEnabled: true,
    nameFormat: "formal",
    
    // API & S3
    apiKey: "sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    s3AccessKey: "",
    s3SecretKey: "",
    s3Bucket: "",
    s3PathPrefix: "call-logs/",
    
    // Appearance
    waveformEnabled: true,
    customCursor: true,
    fontFamily: "Inter",
  });

  const handleSave = () => {
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleTestConnection = () => {
    setTestConnection(true);
    setTimeout(() => setTestConnection(false), 3000);
  };

  const themeColors = [
    { name: "Purple", value: "purple", color: "bg-purple-500" },
    { name: "Blue", value: "blue", color: "bg-blue-500" },
    { name: "Green", value: "green", color: "bg-green-500" },
    { name: "Orange", value: "orange", color: "bg-orange-500" }
  ];

  if (isWorkInProgress) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <Bot className="h-16 w-16 mx-auto text-primary mb-4" />
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Work in Progress
          </h1>
          <p className="text-muted-foreground mt-2">
            This settings page is currently under construction.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-4xl mx-auto">
        <Tabs defaultValue="agent" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="agent" className="flex items-center gap-2">
              <Bot className="h-4 w-4" />
              Agent
            </TabsTrigger>
            <TabsTrigger value="personalization" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Personalization
            </TabsTrigger>
            <TabsTrigger value="api" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              API & S3
            </TabsTrigger>
            <TabsTrigger value="appearance" className="flex items-center gap-2">
              <Monitor className="h-4 w-4" />
              Appearance
            </TabsTrigger>
          </TabsList>

          <TabsContent value="agent">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="p-6 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Agent Configuration</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="greeting">Default Greeting</Label>
                      <Textarea
                        id="greeting"
                        value={settings.greeting}
                        onChange={(e) => setSettings(prev => ({ ...prev, greeting: e.target.value }))}
                        className="mt-2"
                        rows={2}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="fallback">Fallback Response</Label>
                      <Textarea
                        id="fallback"
                        value={settings.fallbackResponse}
                        onChange={(e) => setSettings(prev => ({ ...prev, fallbackResponse: e.target.value }))}
                        className="mt-2"
                        rows={2}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="silence">Max Silence Time (seconds)</Label>
                      <div className="mt-2 px-3">
                        <Slider
                          value={[settings.maxSilence]}
                          onValueChange={(value) => setSettings(prev => ({ ...prev, maxSilence: value[0] }))}
                          max={30}
                          min={1}
                          step={1}
                          className="w-full"
                        />
                        <div className="flex justify-between text-sm text-muted-foreground mt-1">
                          <span>1s</span>
                          <span>{settings.maxSilence}s</span>
                          <span>30s</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="model">Language Model</Label>
                      <Select value={settings.languageModel} onValueChange={(value) => setSettings(prev => ({ ...prev, languageModel: value }))}>
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="gpt-4">GPT-4 (Latest)</SelectItem>
                          <SelectItem value="gpt-3.5">GPT-3.5 Turbo</SelectItem>
                          <SelectItem value="claude">Claude 3</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="personalization">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="p-6 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Personalization</h3>
                  
                  <div className="space-y-6">
                    <div>
                      <Label>Theme Color</Label>
                      <div className="mt-3 grid grid-cols-4 gap-3">
                        {themeColors.map((color) => (
                          <motion.div
                            key={color.value}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={`p-3 rounded-lg border cursor-pointer transition-all ${
                              themeColor === color.value ? 'border-primary/50 bg-primary/5' : 'border-border hover:border-primary/30'
                            }`}
                            onClick={() => setThemeColor(color.value)}
                          >
                            <div className="flex items-center gap-2">
                              <div className={`w-4 h-4 rounded-full ${color.color}`} />
                              <span className="text-sm">{color.name}</span>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Enable Animations</Label>
                        <p className="text-sm text-muted-foreground">Smooth transitions and effects</p>
                      </div>
                      <Switch
                        checked={settings.animationsEnabled}
                        onCheckedChange={(checked) => setSettings(prev => ({ ...prev, animationsEnabled: checked }))}
                      />
                    </div>
                    
                    <div>
                      <Label>Name Display Format</Label>
                      <Select value={settings.nameFormat} onValueChange={(value) => setSettings(prev => ({ ...prev, nameFormat: value }))}>
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="formal">Formal (Mr./Ms. Last Name)</SelectItem>
                          <SelectItem value="casual">Casual (First Name)</SelectItem>
                          <SelectItem value="full">Full Name</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="api">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="p-6 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">API & S3 Integration</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="apikey">OpenAI API Key</Label>
                      <div className="relative mt-2">
                        <Input
                          id="apikey"
                          type={showApiKey ? "text" : "password"}
                          value={settings.apiKey}
                          onChange={(e) => setSettings(prev => ({ ...prev, apiKey: e.target.value }))}
                          className="pr-10"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full"
                          onClick={() => setShowApiKey(!showApiKey)}
                        >
                          {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    
                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-3">S3 Configuration</h4>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="s3access">Access Key</Label>
                          <Input
                            id="s3access"
                            value={settings.s3AccessKey}
                            onChange={(e) => setSettings(prev => ({ ...prev, s3AccessKey: e.target.value }))}
                            placeholder="AKIA..."
                            className="mt-2"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="s3secret">Secret Key</Label>
                          <div className="relative mt-2">
                            <Input
                              id="s3secret"
                              type={showS3Secret ? "text" : "password"}
                              value={settings.s3SecretKey}
                              onChange={(e) => setSettings(prev => ({ ...prev, s3SecretKey: e.target.value }))}
                              placeholder="Secret key"
                              className="pr-10"
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute right-0 top-0 h-full"
                              onClick={() => setShowS3Secret(!showS3Secret)}
                            >
                              {showS3Secret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <div>
                          <Label htmlFor="s3bucket">Bucket Name</Label>
                          <Input
                            id="s3bucket"
                            value={settings.s3Bucket}
                            onChange={(e) => setSettings(prev => ({ ...prev, s3Bucket: e.target.value }))}
                            placeholder="my-call-logs-bucket"
                            className="mt-2"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="s3path">Path Prefix</Label>
                          <Input
                            id="s3path"
                            value={settings.s3PathPrefix}
                            onChange={(e) => setSettings(prev => ({ ...prev, s3PathPrefix: e.target.value }))}
                            placeholder="call-logs/"
                            className="mt-2"
                          />
                        </div>
                      </div>
                      
                      <Button
                        className="mt-4"
                        variant="outline"
                        onClick={handleTestConnection}
                        disabled={testConnection}
                      >
                        <TestTube className="h-4 w-4 mr-2" />
                        {testConnection ? "Testing..." : "Test Connection"}
                      </Button>
                      
                      {testConnection && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-3"
                        >
                          <Badge className="bg-success/20 text-success border-success/30">
                            <Check className="h-3 w-3 mr-1" />
                            Connection successful!
                          </Badge>
                        </motion.div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="appearance">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="p-6 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Appearance Settings</h3>
                  
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Show Waveform Visualization</Label>
                        <p className="text-sm text-muted-foreground">Display audio waveforms during calls</p>
                      </div>
                      <Switch
                        checked={settings.waveformEnabled}
                        onCheckedChange={(checked) => setSettings(prev => ({ ...prev, waveformEnabled: checked }))}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Custom Cursor</Label>
                        <p className="text-sm text-muted-foreground">Animated cursor with gradient trail</p>
                      </div>
                      <Switch
                        checked={settings.customCursor}
                        onCheckedChange={(checked) => setSettings(prev => ({ ...prev, customCursor: checked }))}
                      />
                    </div>
                    
                    <div>
                      <Label>Font Family</Label>
                      <Select value={settings.fontFamily} onValueChange={(value) => setSettings(prev => ({ ...prev, fontFamily: value }))}>
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Inter">Inter (Default)</SelectItem>
                          <SelectItem value="Roboto">Roboto</SelectItem>
                          <SelectItem value="Poppins">Poppins</SelectItem>
                          <SelectItem value="Montserrat">Montserrat</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Dark Mode</Label>
                        <p className="text-sm text-muted-foreground">Toggle between light and dark themes</p>
                      </div>
                      <Switch
                        checked={theme === 'dark'}
                        onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                      />
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>

        <motion.div
          className="flex justify-end mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Button 
            onClick={handleSave}
            className="relative overflow-hidden"
            disabled={saveSuccess}
          >
            {saveSuccess ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Saved!
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  initial={{ x: "-100%" }}
                  animate={{ x: "100%" }}
                  transition={{ duration: 0.6 }}
                />
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </motion.div>
      </div>
    </>
  );
}