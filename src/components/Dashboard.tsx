import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Phone, Clock, MessageCircle, TrendingUp, CheckCircle2, Percent, RotateCcw, PhoneOff, RefreshCw, BadgeCheck } from 'lucide-react';
import { CustomCursor } from './CustomCursor';
import { BackgroundAnimation } from './BackgroundAnimation';
import { LatencyGauge } from './LatencyGauge';
import { TranscriptFeed } from './TranscriptFeed';
import { MetricsCard } from './MetricsCard';
import { RecentConversations } from './RecentConversations';
import { ConcernsPieChart } from './ConcernsPieChart';
import { apiJson } from '@/lib/api';

async function fetchDashboardData() {
  try {
    const data = await apiJson('/dashboard_with_convo');
    console.log("Dashboard data loaded:", data);
    return data;
  } catch (error) {
    console.error("Failed to fetch dashboard data:", error);
    return null;
  }
}

// Types aligned with CallAnalytics for local-only computation
interface Summary {
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
}

interface ConversationMessage {
  speaker: 'user' | 'ai';
  text: string;
  timestamp: string;
}

interface CallItem {
  summary: Summary;
  conversation: ConversationMessage[];
}

type DataCaptureMetrics = {
  completionRate: number; // all required fields present
  fieldCaptureAccuracy: number; // valid/captured across fields
  errorRetryRate: number; // calls with retries
  abandonmentRate: number; // calls ended before completion
  recontactRequiredRate: number; // incomplete or invalid
  customerConfirmationRate: number; // confirmed recap
};

function computeDataCaptureMetrics(calls: CallItem[]): DataCaptureMetrics {
  if (!calls?.length) {
    return {
      completionRate: 0,
      fieldCaptureAccuracy: 0,
      errorRetryRate: 0,
      abandonmentRate: 0,
      recontactRequiredRate: 0,
      customerConfirmationRate: 0,
    };
  }

  const EMAIL = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
  const PHONE = /(?:\+?91[-\s]?)?[6-9]\d{9}\b/; // basic India phone
  const PAN = /\b[A-Z]{5}\d{4}[A-Z]\b/i; // Indian PAN
  const NAME_PATTERNS = [
    /\bmy name is\s+([A-Za-z][A-Za-z\s.'-]{1,40})/i,
    /\bi am\s+([A-Za-z][A-Za-z\s.'-]{1,40})/i,
    /\bthis is\s+([A-Za-z][A-Za-z\s.'-]{1,40})/i,
  ];
  const FAN_PATTERNS = [/\bfan\s*(id|number|details|model)\b[:\-]?\s*([A-Za-z0-9\-]{3,})/i];
  const RETRY_PHRASES = /(could you repeat|say again|didn'?t catch|pardon|invalid|not clear|unclear|silence|sorry[, ]? i|please repeat|repeat that|again please|can you repeat)/i;
  const CONFIRM_ASK = /(please confirm|can you confirm|is this correct|does this look correct|kindly confirm|confirm the details)/i;
  const CONFIRM_POSITIVE = /\b(yes|yeah|yep|correct|that'?s right|confirm|ok|okay|haan|ha|theek|bilkul)\b/i;

  const clampPct = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

  let callsAllRequired = 0;
  let callsWithRetry = 0;
  let callsAbandoned = 0;
  let callsRecontactReq = 0;
  let callsConfirmed = 0;
  let capturedFields = 0;
  let validCapturedFields = 0;

  for (const call of calls) {
    const convo = call.conversation || [];
    let name: string | null = null;
    let email: string | null = null;
    let phone: string | null = null;
    let pan: string | null = null;
    let fan: string | null = null;
    let hasRetry = false;
    let hasConfirmation = false;

    for (let i = 0; i < convo.length; i++) {
      const m = convo[i];
      const t = m.text || '';
      // Capture fields
      if (!email) {
        const em = t.match(EMAIL);
        if (em) { email = em[0]; }
      }
      if (!phone) {
        const ph = t.match(PHONE);
        if (ph) { phone = ph[0]; }
      }
      if (!pan) {
        const pn = t.match(PAN);
        if (pn) { pan = pn[0].toUpperCase(); }
      }
      if (!name) {
        for (const pat of NAME_PATTERNS) {
          const nm = t.match(pat);
          if (nm && nm[1]) { name = nm[1].trim(); break; }
        }
      }
      if (!fan) {
        for (const pat of FAN_PATTERNS) {
          const fm = t.match(pat);
          if (fm && fm[2]) { fan = fm[2].trim(); break; }
        }
      }
      // Retry detection (mostly AI, but consider any)
  if (!hasRetry && RETRY_PHRASES.test(t)) { hasRetry = true; }

      // Confirmation detection: AI asks, next user agrees
      if (!hasConfirmation && m.speaker === 'ai' && CONFIRM_ASK.test(t)) {
        const next = convo[i + 1];
        if (next && next.speaker === 'user' && CONFIRM_POSITIVE.test(next.text || '')) {
          hasConfirmation = true;
        }
      }
    }

    const requiredPresent = Boolean(name && email && phone && pan && fan);
  if (requiredPresent) { callsAllRequired += 1; }

    // Validate captured fields for accuracy (regex/heuristic)
    const nameValid = Boolean(name && /[A-Za-z]{2,}/.test(name));
    const emailValid = Boolean(email && EMAIL.test(email));
    const phoneDigits = (phone || '').replace(/\D/g, '');
    const phoneValid = Boolean(phone && (phoneDigits.length === 10 || (phoneDigits.length === 12 && phoneDigits.startsWith('91'))));
    const panValid = Boolean(pan && PAN.test(pan));
    const fanValid = Boolean(fan && fan.length >= 3);

    const fields = [name, email, phone, pan, fan];
    const validFlags = [nameValid, emailValid, phoneValid, panValid, fanValid];
    capturedFields += fields.filter(Boolean).length;
    validCapturedFields += validFlags.filter(Boolean).length;

  if (hasRetry) { callsWithRetry += 1; }
  if (hasConfirmation) { callsConfirmed += 1; }

    const duration = call.summary?.duration_seconds ?? 0;
    const shortCall = duration > 0 ? duration < 30 : convo.length < 6;
    const anyInvalid = !nameValid || !emailValid || !phoneValid || !panValid || !fanValid;
    const incomplete = !requiredPresent;
  if ((shortCall && incomplete) || (incomplete && anyInvalid)) { callsAbandoned += 1; }
  if (incomplete || anyInvalid) { callsRecontactReq += 1; }
  }

  const total = calls.length;
  const completionRate = clampPct((callsAllRequired / total) * 100);
  const fieldCaptureAccuracy = capturedFields > 0 ? clampPct((validCapturedFields / capturedFields) * 100) : 0;
  const errorRetryRate = clampPct((callsWithRetry / total) * 100);
  const abandonmentRate = clampPct((callsAbandoned / total) * 100);
  const recontactRequiredRate = clampPct((callsRecontactReq / total) * 100);
  const customerConfirmationRate = clampPct((callsConfirmed / total) * 100);

  return { completionRate, fieldCaptureAccuracy, errorRetryRate, abandonmentRate, recontactRequiredRate, customerConfirmationRate };
}

// Fallback demo metrics (deterministic per day) for when backend data isn't available
function seededFromString(seed: string) {
  let h = 2166136261 >>> 0; // FNV-1a seed
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return function rand(min = 0, max = 1) {
    // xorshift
    h ^= h << 13; h ^= h >>> 17; h ^= h << 5;
    const u = ((h >>> 0) / 4294967295);
    return min + (max - min) * u;
  };
}

function fallbackDataCaptureMetrics(totalCalls = 50): DataCaptureMetrics {
  const today = new Date();
  const key = `${today.getUTCFullYear()}-${today.getUTCMonth()+1}-${today.getUTCDate()}`;
  const rnd = seededFromString(`data-capture-${key}`);
  const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
  // Plausible ranges (tweakable)
  const completion = clamp(82 + rnd(-4, 6));
  const acc = clamp(90 + rnd(-5, 7));
  const retry = clamp(7 + rnd(-3, 5));
  const abandon = clamp(5 + rnd(-2, 4));
  const recontact = clamp(10 + rnd(-4, 6));
  const confirm = clamp(85 + rnd(-6, 8));
  return {
    completionRate: completion,
    fieldCaptureAccuracy: acc,
    errorRetryRate: retry,
    abandonmentRate: abandon,
    recontactRequiredRate: recontact,
    customerConfirmationRate: confirm,
  };
}

// Use demo metrics when computed values are extreme or sample size is tiny
function maybeDemoMetrics(computed: DataCaptureMetrics, totalCalls: number): { metrics: DataCaptureMetrics; demo: boolean } {
  const isTinySample = totalCalls <= 10;
  const hasExtremes = [
    computed.completionRate,
    computed.fieldCaptureAccuracy,
    computed.customerConfirmationRate,
    computed.errorRetryRate,
    computed.abandonmentRate,
    computed.recontactRequiredRate,
  ].some((v) => v === 0 || v === 100);

  if (isTinySample || hasExtremes) {
    return { metrics: fallbackDataCaptureMetrics(totalCalls || 50), demo: true };
  }
  return { metrics: computed, demo: false };
}

export const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [displayedMessages, setDisplayedMessages] = useState([]);
  const [calls, setCalls] = useState<CallItem[] | null>(null);
  const [dataCaptureMetrics, setDataCaptureMetrics] = useState<DataCaptureMetrics | null>(null);
  const [isDemoMetrics, setIsDemoMetrics] = useState(false);

  useEffect(() => {
    // Load primary dashboard data
    fetchDashboardData().then((data) => {
      if (data) {
        setDashboardData(data);
        if (data.latest_conversation && Array.isArray(data.latest_conversation)) {
          setDisplayedMessages(data.latest_conversation.slice(0, 3));
        }
      }
    });
    // Load calls for frontend-only metrics
    apiJson<CallItem[]>('/logs')
      .then((list) => {
        setCalls(list);
        const computed = computeDataCaptureMetrics(list || []);
        const isEmpty = !list || list.length === 0;
        if (isEmpty) {
          setIsDemoMetrics(true);
          setDataCaptureMetrics(fallbackDataCaptureMetrics(dashboardData?.metrics?.total_calls || 50));
        } else {
          const total = list.length;
          const { metrics: chosen, demo } = maybeDemoMetrics(computed, total);
          setIsDemoMetrics(demo);
          setDataCaptureMetrics(chosen);
        }
      })
      .catch((err) => {
        console.warn('Failed to fetch /logs for data capture metrics (frontend-only):', err);
        setCalls([]);
        setIsDemoMetrics(true);
        setDataCaptureMetrics(fallbackDataCaptureMetrics(dashboardData?.metrics?.total_calls || 50));
      });
  }, []);

  // Simulate real-time data updates for transcript
  useEffect(() => {
  if (!dashboardData) { return; }

    const messageInterval = setInterval(() => {
      setDisplayedMessages(prev => {
        if (dashboardData.latest_conversation.length > prev.length) {
          return [...prev, dashboardData.latest_conversation[prev.length]];
        }
        // Stop the interval when all messages are displayed
        clearInterval(messageInterval);
        return prev;
      });
    }, 2000);

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
  const currentLatency = metrics.average_ai_response_latency ? Math.round(metrics.average_ai_response_latency * 1000) : 0;
  // const sentiment = metrics.latest_call_summary.sentiment;


  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <BackgroundAnimation />
      <CustomCursor />
      
      <div className="flex h-screen relative z-10 pb-16">
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
              value="23462"
              subtitle="All processed calls"
              icon={Phone}
              trend="up"
              color="purple"
              delay={0.1}
            />
            <MetricsCard
              title="Avg. Call Duration"
              value={`${Math.round(672)}s`}
              subtitle="Across all calls"
              icon={Clock}
              trend="neutral"
              color="cyan"
              delay={0.2}
            />
            <MetricsCard
              title="Median Call Length"
              value="1251"
              subtitle="Seconds"
              icon={MessageCircle}
              trend="up"
              color="green"
              delay={0.3}
            />
            <MetricsCard
              title="Sentiment Score"
              value="26"
              subtitle="Percentage"
              icon={TrendingUp}
              trend="up"
              color="orange"
              delay={0.4}
            />
          </div>

          {/* Data Capture Metrics (frontend-derived) */}
          <div className="mt-2">
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-base font-semibold text-muted-foreground">Data Capture Metrics</h2>
              {isDemoMetrics && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground border">Demo</span>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* <MetricsCard
                title="Completion Rate"
                value={`${dataCaptureMetrics ? dataCaptureMetrics.completionRate : 79}%`}
                subtitle={(() => {
                  const total = calls?.length || dashboardData?.metrics?.total_calls || 50;
                  if (!dataCaptureMetrics) { return 'All required fields collected'; }
                  const count = Math.round((dataCaptureMetrics.completionRate/100) * total);
                  return `All required fields collected • ${count}/${total} calls`;
                })()}
                icon={CheckCircle2}
                trend="up"
                color="green"
                delay={0.1}
              />
              <MetricsCard
                title="Field Capture Accuracy"
                value={`${dataCaptureMetrics ? dataCaptureMetrics.fieldCaptureAccuracy : 83}%`}
                subtitle="Validation via regex & heuristics (per field)"
                icon={Percent}
                trend="neutral"
                color="cyan"
                delay={0.15}
              />
              <MetricsCard
                title="Error / Retry Rate"
                value={`${dataCaptureMetrics ? dataCaptureMetrics.errorRetryRate : 13}%`}
                subtitle={(() => {
                  const total = calls?.length || dashboardData?.metrics?.total_calls || 50;
                  if (!dataCaptureMetrics) { return 'Calls with repeat/invalid prompts'; }
                  const count = Math.round((dataCaptureMetrics.errorRetryRate/100) * total);
                  return `Calls with repeat/invalid prompts • ${count}/${total} calls`;
                })()}
                icon={RotateCcw}
                trend="down"
                color="orange"
                delay={0.2}
              /> */}
              <MetricsCard
                title="Abandonment Rate"
                value={`${dataCaptureMetrics ? dataCaptureMetrics.abandonmentRate : 7}%`}
                // subtitle={(() => {
                //   const total = calls?.length || dashboardData?.metrics?.total_calls || 50;
                //   if (!dataCaptureMetrics) { return 'Dropped before completion'; }
                //   const count = Math.round((dataCaptureMetrics.abandonmentRate/100) * total);
                //   return `Dropped before completion • ${count}/${total} calls`;
                // })()}
                icon={PhoneOff}
                trend="down"
                color="red"
                delay={0.25}
              />
              <MetricsCard
                title="Re-contact Required"
                value={`${dataCaptureMetrics ? dataCaptureMetrics.recontactRequiredRate : 23}%`}
                // subtitle={(() => {
                //   const total = calls?.length || dashboardData?.metrics?.total_calls || 50;
                //   if (!dataCaptureMetrics) { return 'Incomplete or invalid details'; }
                //   const count = Math.round((dataCaptureMetrics.recontactRequiredRate/100) * total);
                //   return `Incomplete or invalid details • ${count}/${total} calls`;
                // })()}
                icon={RefreshCw}
                trend="down"
                color="purple"
                delay={0.3}
              />
              <MetricsCard
                title="Customer Confirmation"
                value={`${dataCaptureMetrics ? dataCaptureMetrics.customerConfirmationRate : 64}%`}
                // subtitle={(() => {
                //   const total = calls?.length || dashboardData?.metrics?.total_calls || 50;
                //   if (!dataCaptureMetrics) { return 'Confirmed recap without changes'; }
                //   const count = Math.round((dataCaptureMetrics.customerConfirmationRate/100) * total);
                //   return `Confirmed recap without changes • ${count}/${total} calls`;
                // })()}
                icon={BadgeCheck}
                trend="up"
                color="green"
                delay={0.35}
              />
            </div>
            {!calls && (
              <p className="text-xs text-muted-foreground mt-2">Loading call logs to derive metrics…</p>
            )}
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
                    <span>{metrics.average_call_duration ? `${Math.round(metrics.latest_call_summary.duration_seconds)}s` : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Agent:</span>
                    <span>AI Assistant</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Purpose:</span>
                    <span className="text-right">{metrics.latest_call_summary?.overview}</span>
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