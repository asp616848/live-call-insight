import Sentiment from "sentiment";
import { fetchGeminiSummary } from "./fetchGeminiSummary";
const sentiment = new Sentiment();

export async function analyzeCall({
  structured,
  noiseCount,
  startTime,
  endTime,
  streamSid
}) {
  const totalMessages = structured.length;
  const durationMs = new Date(endTime).getTime() - new Date(startTime).getTime();
  const aiMessages = structured.filter(m => m.speaker === "AI");
  const avgLatency = durationMs / (aiMessages.length || 1);

  const userText = structured
    .filter(m => m.speaker === "User")
    .map(m => m.text)
    .join(" ");
  const sentimentScore = sentiment.analyze(userText).score;

  const summaryPrompt = `This is a call between an AI agent and a person. Summarize the call briefly and comment on response quality, comprehension, and speed:\n\n${JSON.stringify(
    structured,
    null,
    2
  )}`;

  const geminiRes = await fetchGeminiSummary(summaryPrompt);

  return {
    call_id: streamSid,
    start_time: startTime,
    end_time: endTime,
    duration_ms: durationMs,
    total_messages: totalMessages,
    noise_count: noiseCount,
    avg_ai_response_latency_ms: Math.round(avgLatency),
    agent: "TranzMit",
    purpose: "Job Inquiry", // If you want dynamic, extract from Gemini
    sentiment_score: sentimentScore,
    call_summary: geminiRes.summary,
    performance: {
      response_quality: geminiRes.quality,
      comprehension: geminiRes.comprehension,
      speed: geminiRes.speed
    }
  };
}
