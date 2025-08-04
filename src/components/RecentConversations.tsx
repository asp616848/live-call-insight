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
    sentiment_score: number;
    concerns: string[];
    overview: string;
    user_tone: string;
  };
  conversation: {
    speaker: 'user' | 'ai';
    text: string;
  }[];
}

interface RecentConversationsProps {
  conversations: Conversation[];
}

export const RecentConversations = ({ conversations }: RecentConversationsProps) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (conversations && conversations.length > 0) {
      setLoading(false);
    } else {
      // Optional: handle case where conversations are not passed or empty
      setLoading(false);
      setError("No conversations available.");
    }
  }, [conversations]);

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
                  <span>Duration: <strong>{convo.summary.duration_seconds ? `${Math.round(convo.summary.duration_seconds)}s` : 'N/A'}</strong></span>
                  <span>Latency: <strong>{convo.summary.average_ai_response_latency ? `${Math.round(convo.summary.average_ai_response_latency * 1000)}ms` : 'N/A'}</strong></span>
                </div>
                <div>
                  <span>Tone: <strong className="capitalize">{convo.summary.user_tone}</strong></span>
                </div>
                {convo.summary.concerns && convo.summary.concerns.length > 0 && (
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
