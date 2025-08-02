import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Phone, Clock, MessageCircle, Activity, Users, TrendingUp } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { CustomCursor } from './CustomCursor';
import { BackgroundAnimation } from './BackgroundAnimation';
import { LatencyGauge } from './LatencyGauge';
import { TranscriptFeed } from './TranscriptFeed';
import { MetricsCard } from './MetricsCard';

// Mock data for the demo
const mockMessages = [
  {
    timestamp: "2025-08-02 03:00:02,000",
    type: "user" as const,
    text: "Job chahiye, hain ka?"
  },
  {
    timestamp: "2025-08-02 03:00:02,100", 
    type: "ai_chunk" as const,
    text: "Haan ji, sahi ba."
  },
  {
    timestamp: "2025-08-02 03:00:03,000",
    type: "ai_final" as const,
    text: "Haan ji, sahi ba. Verma ji aap jaisan ke liye Khelo India stadium aur local opportunity laawat hain.",
    sentiment: "positive" as const
  },
  {
    timestamp: "2025-08-02 03:00:05,500",
    type: "user" as const,
    text: "Kaisan apply kare hain?"
  },
  {
    timestamp: "2025-08-02 03:00:06,200",
    type: "ai_final" as const,
    text: "Application process bada simple hai. Aap online portal pe ja kar apan details submit kar sakte hain. Documents bhi upload karna padega.",
    sentiment: "neutral" as const
  },
  {
    timestamp: "2025-08-02 03:00:08,000",
    type: "user" as const,
    text: "Konsi documents lagega?"
  },
  {
    timestamp: "2025-08-02 03:00:08,300",
    type: "ai_chunk" as const,
    text: "Aadhar card, education certificate..."
  },
  {
    timestamp: "2025-08-02 03:00:09,100",
    type: "ai_final" as const,
    text: "Aadhar card, education certificate, aur experience letter lagega. Age limit bhi hai - 18 se 35 tak.",
    sentiment: "neutral" as const
  }
];

export const Dashboard = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentLatency, setCurrentLatency] = useState(340);
  const [displayedMessages, setDisplayedMessages] = useState(mockMessages.slice(0, 3));

  // Simulate real-time data updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Update latency with some variation
      setCurrentLatency(prev => {
        const variation = (Math.random() - 0.5) * 100;
        return Math.max(200, Math.min(2000, prev + variation));
      });
    }, 2000);

    // Simulate new messages
    const messageInterval = setInterval(() => {
      if (displayedMessages.length < mockMessages.length) {
        setDisplayedMessages(prev => [
          ...prev,
          mockMessages[prev.length]
        ]);
      }
    }, 5000);

    return () => {
      clearInterval(interval);
      clearInterval(messageInterval);
    };
  }, [displayedMessages.length]);

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <BackgroundAnimation />
      <CustomCursor />
      
      <div className="flex h-screen relative z-10">
        {/* Sidebar */}
        <Sidebar 
          collapsed={sidebarCollapsed} 
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
        />

        {/* Main Content */}
        <motion.main 
          className="flex-1 p-6 space-y-6 overflow-y-auto"
          animate={{
            marginLeft: sidebarCollapsed ? 0 : 0,
          }}
          transition={{ duration: 0.3 }}
        >
          {/* Header */}
          <motion.div
            className="flex items-center justify-between"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div>
              <h1 className="text-3xl font-bold gradient-text">Call Analytics Dashboard</h1>
              <p className="text-muted-foreground mt-1">Real-time AI conversation insights</p>
            </div>
            
            <motion.div 
              className="flex items-center gap-2 text-sm text-muted-foreground"
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <div className="w-2 h-2 rounded-full bg-green-success animate-pulse" />
              Live monitoring active
            </motion.div>
          </motion.div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricsCard
              title="Active Calls"
              value="1"
              subtitle="Currently in progress"
              icon={Phone}
              trend="neutral"
              color="purple"
              delay={0.1}
            />
            <MetricsCard
              title="Avg. Response Time"
              value={`${Math.round(currentLatency)}ms`}
              subtitle="Last 5 minutes"
              icon={Clock}
              trend={currentLatency < 500 ? 'up' : currentLatency > 1000 ? 'down' : 'neutral'}
              trendValue={currentLatency < 500 ? '12% faster' : currentLatency > 1000 ? '8% slower' : 'stable'}
              color="cyan"
              delay={0.2}
            />
            <MetricsCard
              title="Messages"
              value={displayedMessages.length}
              subtitle="Total exchanged"
              icon={MessageCircle}
              trend="up"
              trendValue="+3 new"
              color="green"
              delay={0.3}
            />
            <MetricsCard
              title="Sentiment Score"
              value="8.4/10"
              subtitle="Overall positive"
              icon={TrendingUp}
              trend="up"
              trendValue="+0.3 today"
              color="orange"
              delay={0.4}
            />
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
            {/* Latency Gauge */}
            <div className="lg:col-span-1">
              <LatencyGauge latency={currentLatency} />
            </div>

            {/* Transcript Feed */}
            <div className="lg:col-span-2">
              <TranscriptFeed messages={displayedMessages} isLive={true} />
            </div>
          </div>

          {/* Additional Info Panel */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <div className="glass rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-4 gradient-text">Call Summary</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duration:</span>
                  <span>00:02:17</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Agent:</span>
                  <span>AI Assistant</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Purpose:</span>
                  <span>Job Inquiry</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Resolution:</span>
                  <span className="text-green-success">In Progress</span>
                </div>
              </div>
            </div>

            <div className="glass rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-4 gradient-text">Performance</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Response Quality</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className={`w-2 h-2 rounded-full ${
                          i <= 4 ? 'bg-green-success' : 'bg-muted'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Comprehension</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className={`w-2 h-2 rounded-full ${
                          i <= 5 ? 'bg-green-success' : 'bg-muted'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Speed</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className={`w-2 h-2 rounded-full ${
                          i <= 3 ? 'bg-orange-warning' : 'bg-muted'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="glass rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-4 gradient-text">Next Actions</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-purple-glow" />
                  <span>Follow up with documents</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-cyan-accent" />
                  <span>Schedule application review</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-success" />
                  <span>Send confirmation email</span>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.main>
      </div>
    </div>
  );
};