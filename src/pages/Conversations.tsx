import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Filter, MoreVertical, Phone, MessageCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const conversations = [
  {
    id: "conv-001",
    user: "Rajesh Kumar",
    avatar: "RK",
    status: "ongoing",
    lastMessage: "Diabetes ke bare mein aur janna chahta hun",
    timestamp: "2 min ago",
    latency: 120,
    sentiment: "positive",
    unread: 2
  },
  {
    id: "conv-002", 
    user: "Priya Singh",
    avatar: "PS",
    status: "completed",
    lastMessage: "Dhanyawad, bahut helpful tha",
    timestamp: "5 min ago", 
    latency: 89,
    sentiment: "positive",
    unread: 0
  },
  {
    id: "conv-003",
    user: "Anonymous User",
    avatar: "AU",
    status: "escalated",
    lastMessage: "Main doctor se baat karna chahta hun",
    timestamp: "10 min ago",
    latency: 200,
    sentiment: "negative", 
    unread: 1
  }
];

const liveMessages = [
  {
    conversationId: "conv-001",
    timestamp: "14:35:42",
    type: "user",
    text: "Kya diabetes mein rice kha sakte hain?",
    user: "Rajesh Kumar"
  },
  {
    conversationId: "conv-001", 
    timestamp: "14:35:45",
    type: "ai_typing",
    text: "",
    user: "AI Assistant"
  }
];

export default function Conversations() {
  const [selectedConversation, setSelectedConversation] = useState(conversations[0]);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [messages, setMessages] = useState(liveMessages);
  const [isTyping, setIsTyping] = useState(true);

  // Simulate real-time message updates
  useEffect(() => {
    const interval = setInterval(() => {
      if (isTyping) {
        setMessages(prev => [
          ...prev.filter(m => m.type !== "ai_typing"),
          {
            conversationId: "conv-001",
            timestamp: new Date().toLocaleTimeString(),
            type: "ai_final", 
            text: "Haan ji, rice thoda kam quantity mein le sakte hain. Brown rice better option hai.",
            user: "AI Assistant"
          }
        ]);
        setIsTyping(false);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isTyping]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ongoing": return "bg-success/20 text-success border-success/30";
      case "completed": return "bg-muted/20 text-muted-foreground border-muted/30";
      case "escalated": return "bg-destructive/20 text-destructive border-destructive/30";
      default: return "bg-muted/20 text-muted-foreground border-muted/30";
    }
  };

  const getSentimentEmoji = (sentiment: string) => {
    switch (sentiment) {
      case "positive": return "😊";
      case "negative": return "😕"; 
      case "neutral": return "😐";
      default: return "🤔";
    }
  };

  const filteredConversations = conversations.filter(conv => {
    if (filter !== "all" && conv.status !== filter) return false;
    if (searchQuery && !conv.user.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-background p-6">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
          Live Conversations
        </h1>
        <p className="text-muted-foreground">Real-time conversation monitoring and support</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-200px)]">
        {/* Conversations List */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-1"
        >
          <Card className="h-full p-4">
            <div className="space-y-4 mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search conversations..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <Tabs value={filter} onValueChange={setFilter}>
                <TabsList className="grid w-full grid-cols-4 text-xs">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="ongoing">Live</TabsTrigger>
                  <TabsTrigger value="completed">Done</TabsTrigger>
                  <TabsTrigger value="escalated">Alert</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="space-y-2 overflow-y-auto max-h-[calc(100%-140px)]">
              {filteredConversations.map((conv, index) => (
                <motion.div
                  key={conv.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                    selectedConversation.id === conv.id ? 'border-primary/50 bg-primary/5' : 'border-border hover:border-primary/30'
                  }`}
                  onClick={() => setSelectedConversation(conv)}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground font-medium text-sm">
                        {conv.avatar}
                      </div>
                      {conv.status === "ongoing" && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-success rounded-full border-2 border-background animate-pulse" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm truncate">{conv.user}</p>
                        {conv.unread > 0 && (
                          <Badge className="bg-primary text-primary-foreground h-5 w-5 rounded-full text-xs p-0 flex items-center justify-center">
                            {conv.unread}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{conv.lastMessage}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-muted-foreground">{conv.timestamp}</span>
                        <div className="flex items-center gap-1">
                          <span className="text-xs">{getSentimentEmoji(conv.sentiment)}</span>
                          <Badge className={getStatusColor(conv.status)} style={{ fontSize: '9px', padding: '1px 4px' }}>
                            {conv.latency}ms
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Conversation Stream */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-3"
        >
          <Card className="h-full p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground font-medium">
                  {selectedConversation.avatar}
                </div>
                <div>
                  <h2 className="text-lg font-semibold">{selectedConversation.user}</h2>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(selectedConversation.status)}>
                      {selectedConversation.status}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {getSentimentEmoji(selectedConversation.sentiment)} {selectedConversation.sentiment}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" size="icon">
                  <Phone className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 max-h-[calc(100vh-350px)]">
              <AnimatePresence>
                {messages
                  .filter(msg => msg.conversationId === selectedConversation.id)
                  .map((msg, index) => (
                    <motion.div
                      key={`${msg.timestamp}-${index}`}
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -20, scale: 0.95 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className={`flex gap-3 ${msg.type === 'user' ? 'justify-start' : 'justify-start'}`}
                    >
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center text-sm">
                        {msg.type === 'user' ? '🗣️' : '🤖'}
                      </div>
                      
                      <div className="flex-1 max-w-[80%]">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium">{msg.user}</span>
                          <span className="text-xs text-muted-foreground">{msg.timestamp}</span>
                          {msg.type !== 'user' && msg.type !== 'ai_typing' && (
                            <Badge className="bg-success/20 text-success text-xs">
                              {selectedConversation.latency}ms
                            </Badge>
                          )}
                        </div>
                        
                        {msg.type === 'ai_typing' ? (
                          <motion.div 
                            className="bg-primary/10 p-3 rounded-lg border border-primary/20"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                          >
                            <div className="flex items-center gap-1">
                              <div className="flex gap-1">
                                <motion.div 
                                  className="w-2 h-2 bg-primary rounded-full"
                                  animate={{ scale: [1, 1.2, 1] }}
                                  transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                                />
                                <motion.div 
                                  className="w-2 h-2 bg-primary rounded-full"
                                  animate={{ scale: [1, 1.2, 1] }}
                                  transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                                />
                                <motion.div 
                                  className="w-2 h-2 bg-primary rounded-full"
                                  animate={{ scale: [1, 1.2, 1] }}
                                  transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                                />
                              </div>
                              <span className="text-xs text-muted-foreground ml-2">AI is typing...</span>
                            </div>
                          </motion.div>
                        ) : (
                          <div className={`p-3 rounded-lg ${
                            msg.type === 'user' 
                              ? 'bg-muted/50 text-foreground' 
                              : 'bg-primary/10 text-foreground border border-primary/20'
                          }`}>
                            <p className="text-sm">{msg.text}</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
              </AnimatePresence>
            </div>

            <div className="mt-4 p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MessageCircle className="h-4 w-4" />
                <span>Live conversation monitoring active</span>
                <div className="w-2 h-2 bg-success rounded-full animate-pulse ml-auto" />
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}