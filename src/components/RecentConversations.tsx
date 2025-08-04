import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from 'lucide-react';

// Types based on the API response
interface Conversation {
  summary: {
    filename: string;
    stream_sid: string;
    call_started: string;
    call_ended: string;
    duration_seconds: number;
    average_ai_response_latency: number;
    sentiment: 'positive' | 'neutral' | 'negative';
    concerns: string[];
    overview: string;
    user_tone: string;
  };
  conversation: {
    speaker: 'user' | 'ai';
    text: string;
  }[];
}

// API fetch function
async function fetchRecentConversations(): Promise<Conversation[]> {
  try {
    const response = await fetch('http://127.0.0.1:5000/logs');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Failed to fetch recent conversations:", error);
    throw error;
  }
}

export const RecentConversations = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRecentConversations()
      .then(data => {
        setConversations(data);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load conversations. Is the backend server running?');
        setLoading(false);
      });
  }, []);

  const getSentimentBadgeVariant = (sentiment: 'positive' | 'neutral' | 'negative') => {
    switch (sentiment) {
      case 'positive': return 'default';
      case 'neutral': return 'secondary';
      case 'negative': return 'destructive';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <div className="lg:col-span-1 space-y-6">
        <h3 className="text-lg font-semibold gradient-text px-6">Recent Conversations</h3>
        <div className="space-y-4 px-6">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="lg:col-span-1 space-y-6">
        <h3 className="text-lg font-semibold gradient-text px-6">Recent Conversations</h3>
        <Alert variant="destructive" className="mx-6">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <motion.div 
      className="lg:col-span-1 space-y-6 flex flex-col h-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.6 }}
    >
      <h3 className="text-lg font-semibold gradient-text px-6">Recent Conversations</h3>
      <ScrollArea className="flex-grow pr-6 pl-6">
        <div className="space-y-4">
          {conversations.map((convo) => (
            <div key={convo.summary.stream_sid} className="glass p-4 rounded-lg border border-border/20">
              <div className="flex justify-between items-start gap-2">
                <p className="text-sm text-muted-foreground flex-grow">{convo.summary.overview}</p>
                <Badge variant={getSentimentBadgeVariant(convo.summary.sentiment)} className="capitalize">
                  {convo.summary.sentiment}
                </Badge>
              </div>
              <div className="mt-3 text-xs text-muted-foreground space-y-1">
                <div className="flex justify-between">
                  <span>Duration: <strong>{Math.round(convo.summary.duration_seconds)}s</strong></span>
                  <span>Latency: <strong>{Math.round(convo.summary.average_ai_response_latency * 1000)}ms</strong></span>
                </div>
                <div>
                  <span>Tone: <strong className="capitalize">{convo.summary.user_tone}</strong></span>
                </div>
                {convo.summary.concerns.length > 0 && (
                  <div>
                    <span>Concerns: <strong className="capitalize">{convo.summary.concerns.join(', ')}</strong></span>
                  </div>
                )}
              </div>
              <div className="mt-4 pt-3 border-t border-border/20">
                <h4 className="text-xs font-semibold mb-2">Transcript Snippet:</h4>
                <div className="text-xs space-y-1.5 text-muted-foreground">
                  {convo.conversation.slice(-5).map((msg, index) => (
                    <p key={index} className="truncate">
                      <span className={`font-semibold capitalize ${msg.speaker === 'user' ? 'text-blue-400' : 'text-purple-400'}`}>{msg.speaker}: </span>
                      {msg.text}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </motion.div>
  );
};
