import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Phone, Clock, MessageCircle, Activity, Users, TrendingUp } from 'lucide-react';
import { CustomCursor } from './CustomCursor';
import { BackgroundAnimation } from './BackgroundAnimation';
import { LatencyGauge } from './LatencyGauge';
import { TranscriptFeed } from './TranscriptFeed';
import { MetricsCard } from './MetricsCard';
import { RecentConversations } from './RecentConversations';

async function fetchDashboardData() {
  try {
    const response = await fetch('http://127.0.0.1:5000/dashboard_with_convo');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log("Dashboard data loaded:", data);
    return data;
  } catch (error) {
    console.error("Failed to fetch dashboard data:", error);
    return null;
  }
}

export const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [displayedMessages, setDisplayedMessages] = useState([]);

  useEffect(() => {
    fetchDashboardData().then((data) => {
      if (data) {
        setDashboardData(data);
        setDisplayedMessages(data.latest_conversation.slice(0, 3));
      }
    });
  }, []);

  // Simulate real-time data updates for transcript
  useEffect(() => {
    if (!dashboardData) return;

    const messageInterval = setInterval(() => {
      setDisplayedMessages(prev => {
        if (dashboardData.latest_conversation.length > prev.length) {
          return [...prev, dashboardData.latest_conversation[prev.length]];
        }
        // Optional: loop the conversation for demo purposes
        if (dashboardData.latest_conversation.length === prev.length) {
            return dashboardData.latest_conversation.slice(0, 3);
        }
        return prev;
      });
    }, 5000);

    return () => {
      clearInterval(messageInterval);
    };
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
  const currentLatency = metrics.average_response_latency_ms || 0;
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
              value={sentiment}
              subtitle="Latest call"
              icon={TrendingUp}
              trend="up"
              trendValue="+0.3 today"
              color="orange"
              delay={0.4}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-250px)]">
            {/* Transcript Feed */}
            <div className="lg:col-span-2 h-full">
              <TranscriptFeed messages={displayedMessages} isLive={true} />
            </div>

            {/* Right Column */}
            <div className="lg:col-span-1 space-y-6 h-full flex flex-col">
              <LatencyGauge latency={currentLatency} />
              <motion.div
                className="glass rounded-2xl p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
              >
                <h3 className="text-lg font-semibold mb-4 gradient-text">Call Summary</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Duration:</span>
                    <span>{metrics.latest_call_summary.duration}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Agent:</span>
                    <span>{metrics.latest_call_summary.agent}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Purpose:</span>
                    <span className="text-right">{metrics.latest_call_summary.purpose}</span>
                  </div>
                </div>
              </motion.div>
              <RecentConversations />
            </div>
          </div>
        </motion.main>
      </div>
    </div>
  );
};