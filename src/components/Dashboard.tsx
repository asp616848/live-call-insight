import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Phone, Clock, MessageCircle, TrendingUp } from 'lucide-react';
import { CustomCursor } from './CustomCursor';
import { BackgroundAnimation } from './BackgroundAnimation';
import { LatencyGauge } from './LatencyGauge';
import { TranscriptFeed } from './TranscriptFeed';
import { MetricsCard } from './MetricsCard';
import { RecentConversations } from './RecentConversations';
import { ConcernsPieChart } from './ConcernsPieChart';

const hardcodedData = {
  metrics: {
    total_calls: 33147, // 125,
    average_call_duration: 242, // 85,
    average_ai_response_latency: 0.45,
    latest_call_summary: {
      sentiment: 'Concerned',
      sentiment_score: 7.4, // 4.2,
      duration_seconds: 123,
      overview: 'Discussing farmer issues with irrigation and seeking solutions.',
    },
  },
  latest_conversation: [
    {
      "speaker": "user",
      "text": "Hello.",
      "timestamp": "2025-08-03T20:43:30"
    },
    {
      "speaker": "ai",
      "text": "Namaskar Bhaiya, hum Sunita Devi bolat hain, Rajesh Verma ji ke taraf se. Kaise hain aap? Hum aapke chinta ke baare mein jaanana chahat hain, aapke yahan sabse badi samasya ka baa?",
      "timestamp": "2025-08-03T20:43:30"
    },
    {
      "speaker": "user",
      "text": "चिंताएँ तो काफी हैं, आप यह बताइए कि राजीव जी, हम लोग किसान लोगों के लिए क्या कर रहे हैं? हम बड़े ही दिक्कत में हैं।",
      "timestamp": "2025-08-03T20:43:46"
    },
    {
      "speaker": "ai",
      "text": "Hum aapke dikkat ke baare mein samajh sakte hain, Bhaiya. Aap kisan hain ka? Hum sun rahe hain ki sinchai ki samasya hai.",
      "timestamp": "2025-08-03T20:43:56"
    },
    {
      "speaker": "user",
      "text": "Yes, I am a farmer. The biggest problem is the irrigation system. We don't get enough water for our crops.",
      "timestamp": "2025-08-03T20:44:15"
    },
    {
      "speaker": "ai",
      "text": "I understand. Rajesh Verma ji has started a new program for water conservation and better irrigation. We can provide you with details.",
      "timestamp": "2025-08-03T20:44:25"
    }
  ]
};

export const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState<any>(hardcodedData);
  const [displayedMessages, setDisplayedMessages] = useState<any[]>([]);

  useEffect(() => {
    if (dashboardData) {
      setDisplayedMessages(dashboardData.latest_conversation);
    }
  }, [dashboardData]);

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">Loading dashboard...</p>
          <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-primary mt-4 mx-auto"></div>
        </div>
      </div>
    );
  }

  const { metrics } = dashboardData;
  const currentLatency = metrics.average_ai_response_latency ? Math.round(metrics.average_ai_response_latency * 1000) : 0;
  const sentiment = metrics.latest_call_summary.sentiment;


  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <BackgroundAnimation />
      <CustomCursor />
      
      <div className="flex h-screen relative z-10">

        {/* Main Content */}
        <motion.main 
          className="flex-1 p-6 space-y-6 overflow-y-auto"
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
              <h1 className="text-3xl font-bold gradient-text">TranzMit Engineering</h1>
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
              title="Total Calls"
              value={metrics.total_calls}
              subtitle="All processed calls"
              icon={Phone}
              trend="up"
              color="purple"
              delay={0.1}
            />
            <MetricsCard
              title="Avg. Call Duration"
              value={`${Math.round(metrics.average_call_duration)}s`}
              subtitle="Across all calls"
              icon={Clock}
              trend="neutral"
              color="cyan"
              delay={0.2}
            />
            <MetricsCard
              title="Latest Convo Length"
              value={dashboardData.latest_conversation?.length || 0}
              subtitle="[Number of exchanges]"
              icon={MessageCircle}
              trend="up"
              color="green"
              delay={0.3}
            />
            <MetricsCard
              title="Sentiment Score"
              value={metrics.latest_call_summary.sentiment_score?.toFixed(1)}
              subtitle="From 0 to 10"
              icon={TrendingUp}
              trend="up"
              color="orange"
              delay={0.4}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-250px)]">
            {/* Left Column */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              <div className="flex-grow-[3] h-0">
                <TranscriptFeed messages={displayedMessages} isLive={true} />
              </div>
              <div className="flex-grow-[2] h-0">
                <ConcernsPieChart />
              </div>
            </div>
            
            {/* Right Column */}
            <div className="lg:col-span-1 space-y-6 h-full flex flex-col">
              <div className="flex-grow-0">
                <LatencyGauge latency={currentLatency} />
              </div>
              <motion.div
                className="glass rounded-2xl p-6 flex-grow"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
              >
                <h3 className="text-lg font-semibold mb-4 gradient-text">Call Summary</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Duration:</span>
                    <span>{metrics.latest_call_summary.duration_seconds ? `${Math.round(metrics.latest_call_summary.duration_seconds)}s` : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Agent:</span>
                    <span>AI Assistant</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Purpose:</span>
                    <span className="text-right">{metrics.latest_call_summary.overview}</span>
                  </div>
                </div>
              </motion.div>
              <div className="flex-shrink-0 h-1/3">
                <RecentConversations />
              </div>
            </div>
          </div>
        </motion.main>
      </div>
    </div>
  );
};