export type CallAnalysis = {
  call_id: string;
  start_time: string;
  end_time: string;
  duration_ms: number;
  agent: string;
  ai_transcript: string[];
  total_messages: number;
  noise_count: number;
};

export function parseLogToJson(logContent: string): CallAnalysis {
  const lines = logContent.split("\n");

  let startTime = "";
  let endTime = "";
  let streamSid = "";
  const aiChunks: string[] = [];
  let aiMergedUtterances: string[] = [];
  let currentUtterance: string[] = [];
  let noiseCount = 0;
  let totalMessages = 0;

  const pushUtterance = () => {
    if (currentUtterance.length > 0) {
      aiMergedUtterances.push(currentUtterance.join(" ").trim());
      currentUtterance = [];
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith("Call started at:")) {
      startTime = trimmed.split("Call started at:")[1].trim();
    } else if (trimmed.startsWith("Call ended at:")) {
      endTime = trimmed.split("Call ended at:")[1].trim();
    } else if (trimmed.startsWith("Stream SID:")) {
      streamSid = trimmed.split("Stream SID:")[1].trim();
    } else if (trimmed.includes("AI (chunk):")) {
      const text = trimmed.split("AI (chunk):")[1].trim();
      if (text.match(/^\[.*\]$/)) {
        // Skip mode indicators like "[Current Mode: Pure Bhojpuri]"
        continue;
      }
      currentUtterance.push(text);
    } else if (trimmed.startsWith("User:")) {
      pushUtterance();
      totalMessages++;
      if (trimmed.toLowerCase().includes("noise")) {
        noiseCount++;
      }
    }
  }

  pushUtterance(); // Push remaining utterance if any

  const durationMs =
    new Date(endTime).getTime() - new Date(startTime).getTime();

  return {
    call_id: streamSid,
    start_time: startTime,
    end_time: endTime,
    duration_ms: durationMs,
    agent: "TranzMit",
    ai_transcript: aiMergedUtterances,
    total_messages: aiMergedUtterances.length + totalMessages,
    noise_count: noiseCount,
  };
}