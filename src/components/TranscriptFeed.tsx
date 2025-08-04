import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Bot, Clock, Smile, Frown, Meh } from 'lucide-react';

interface Message {
  speaker: 'user' | 'ai';
  text: string;
  timestamp: string;
}

interface TranscriptFeedProps {
  messages: Message[];
  isLive?: boolean;
}

const getSentimentIcon = (sentiment?: string) => {
  switch (sentiment) {
    case 'positive': return { icon: Smile, color: 'text-green-success', label: '😊 Positive' };
    case 'negative': return { icon: Frown, color: 'text-red-danger', label: '😕 Negative' };
    case 'confusion': return { icon: Meh, color: 'text-orange-warning', label: '😕 Confusion' };
    default: return { icon: Meh, color: 'text-cyan-accent', label: '🙂 Neutral' };
  }
};

const formatTimestamp = (timestamp: string) => {
  if (!timestamp) return "00:00:00.000";
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return "00:00:00.000";
  
  const timeString = date.toLocaleTimeString('en-US', { 
    hour12: false, 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit'
  });
  const ms = date.getMilliseconds().toString().padStart(3, '0');
  return `${timeString}.${ms}`;
};

export const TranscriptFeed = ({ messages, isLive = true }: TranscriptFeedProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isAutoScroll, setIsAutoScroll] = useState(true);

  useEffect(() => {
    if (isAutoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isAutoScroll]);

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 50;
      setIsAutoScroll(isNearBottom);
    }
  };

  return (
    <motion.div
      className="glass rounded-3xl p-6 h-full flex flex-col overflow-hidden"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      {/* Background glow */}
      <div className="absolute inset-0 bg-gradient-to-t from-cyan-accent/5 via-transparent to-purple-glow/5 pointer-events-none rounded-3xl" />
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6 relative">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-success animate-pulse" />
            <h3 className="text-lg font-semibold gradient-text">Live Transcript</h3>
          </div>
          {isLive && (
            <motion.span
              className="text-xs px-2 py-1 rounded-full bg-green-success/20 text-green-success border border-green-success/30"
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              LIVE
            </motion.span>
          )}
        </div>
        
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span>{formatTimestamp(new Date().toISOString())}</span>
        </div>
      </div>

      {/* Transcript Body */}
      <div 
        ref={scrollRef} 
        className="flex-1 overflow-y-auto pr-4 -mr-4 space-y-6"
        onScroll={handleScroll}
      >
        <AnimatePresence initial={false}>
          {messages.map((message, index) => (
            <motion.div
              key={index}
              layout
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="flex items-start gap-4"
            >
              <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${
                message.speaker === 'user' ? 'bg-purple-glow/20 text-purple-glow' : 'bg-cyan-accent/20 text-cyan-accent'
              }`}>
                {message.speaker === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-sm capitalize">
                    {message.speaker === 'user' ? 'Customer' : 'AI Assistant'}
                  </p>
                  <p className="text-xs text-muted-foreground">{formatTimestamp(message.timestamp)}</p>
                </div>
                <div className="mt-1 text-muted-foreground text-sm leading-relaxed">
                  {message.text}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};