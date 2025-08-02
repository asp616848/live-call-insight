import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Bot, Clock, Smile, Frown, Meh } from 'lucide-react';

interface Message {
  timestamp: string;
  type: 'user' | 'ai_chunk' | 'ai_final';
  text: string;
  sentiment?: 'positive' | 'neutral' | 'negative' | 'confusion';
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
  const date = new Date(timestamp.replace(',', '.'));
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
  const [displayedMessages, setDisplayedMessages] = useState<Message[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isAutoScroll, setIsAutoScroll] = useState(true);

  useEffect(() => {
    if (messages.length > displayedMessages.length) {
      const newMessages = messages.slice(displayedMessages.length);
      
      newMessages.forEach((message, index) => {
        setTimeout(() => {
          setDisplayedMessages(prev => [...prev, message]);
        }, index * 300); // Stagger message appearance
      });
    }
  }, [messages, displayedMessages.length]);

  useEffect(() => {
    if (isAutoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [displayedMessages, isAutoScroll]);

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
          <span>{new Date().toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Message Feed */}
      <div 
        ref={scrollRef}
        className="flex-1 space-y-4 overflow-y-auto pr-2"
        onScroll={handleScroll}
        style={{ scrollBehavior: isAutoScroll ? 'smooth' : 'auto' }}
      >
        <AnimatePresence>
          {displayedMessages.map((message, index) => {
            const isUser = message.type === 'user';
            const isChunk = message.type === 'ai_chunk';
            const sentiment = getSentimentIcon(message.sentiment);
            
            return (
              <motion.div
                key={`${message.timestamp}-${index}`}
                className={`flex gap-3 ${isUser ? 'flex-row' : 'flex-row'}`}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ 
                  duration: 0.4, 
                  ease: "easeOut",
                  delay: 0.1 
                }}
              >
                {/* Avatar */}
                <motion.div
                  className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                    isUser 
                      ? 'bg-gradient-to-br from-cyan-accent/20 to-cyan-accent/40 border border-cyan-accent/30' 
                      : 'bg-gradient-to-br from-purple-glow/20 to-purple-glow/40 border border-purple-glow/30'
                  }`}
                  whileHover={{ scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  {isUser ? (
                    <User className="w-5 h-5 text-cyan-accent" />
                  ) : (
                    <Bot className="w-5 h-5 text-purple-glow" />
                  )}
                </motion.div>

                {/* Message Content */}
                <div className="flex-1 min-w-0">
                  {/* Message Header */}
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium">
                      {isUser ? 'User' : 'AI Assistant'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatTimestamp(message.timestamp)}
                    </span>
                    {isChunk && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-orange-warning/20 text-orange-warning">
                        partial
                      </span>
                    )}
                  </div>

                  {/* Message Bubble */}
                  <motion.div
                    className={`p-4 rounded-2xl relative overflow-hidden ${
                      isUser
                        ? 'bg-cyan-accent/10 border border-cyan-accent/20'
                        : 'bg-purple-glow/10 border border-purple-glow/20'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    {/* Glow effect on hover */}
                    <motion.div
                      className={`absolute inset-0 ${
                        isUser ? 'bg-cyan-accent/5' : 'bg-purple-glow/5'
                      } opacity-0 hover:opacity-100 transition-opacity duration-300`}
                    />
                    
                    <p className="text-sm relative z-10 leading-relaxed">
                      {message.text}
                    </p>

                    {/* Sentiment indicator for AI messages */}
                    {!isUser && message.sentiment && (
                      <motion.div
                        className="flex items-center gap-2 mt-3 pt-3 border-t border-border/30"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                      >
                        <sentiment.icon className={`w-4 h-4 ${sentiment.color}`} />
                        <span className={`text-xs ${sentiment.color}`}>
                          {sentiment.label}
                        </span>
                      </motion.div>
                    )}
                  </motion.div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Typing indicator for live updates */}
        {isLive && (
          <motion.div
            className="flex gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-glow/20 to-purple-glow/40 border border-purple-glow/30 flex items-center justify-center">
              <Bot className="w-5 h-5 text-purple-glow" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium mb-1">AI Assistant</div>
              <div className="p-4 rounded-2xl bg-purple-glow/10 border border-purple-glow/20">
                <div className="flex gap-1">
                  {[1, 2, 3].map((i) => (
                    <motion.div
                      key={i}
                      className="w-2 h-2 rounded-full bg-purple-glow"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{
                        repeat: Infinity,
                        duration: 1.4,
                        delay: i * 0.2,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Auto-scroll indicator */}
      {!isAutoScroll && (
        <motion.button
          className="absolute bottom-20 right-6 p-2 rounded-full bg-primary/20 text-primary border border-primary/30 text-xs"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            setIsAutoScroll(true);
            if (scrollRef.current) {
              scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
            }
          }}
        >
          ↓ Jump to bottom
        </motion.button>
      )}
    </motion.div>
  );
};