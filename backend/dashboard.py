import os
import json

def get_dashboard_with_latest_convo():
    import glob

    json_folder = os.path.join(os.path.dirname(__file__), "convoJson")
    files = sorted(glob.glob(os.path.join(json_folder, "*.json")), key=os.path.getmtime, reverse=True)

    if not files:
        return {"error": "No conversations found."}

    total_duration = 0
    total_latency = 0
    total_calls = 0
    sentiments = {"positive": 0, "neutral": 0, "negative": 0}
    sentiment_score_total = 0
    sentiment_score_map = {"positive": 1, "neutral": 0.5, "negative": 0}

    latest_data = None

    for file_path in files:
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        summary = data.get("summary", {})
        sentiment = summary.get("sentiment")
        duration = summary.get("duration_seconds") or 0
        latency = summary.get("average_ai_response_latency") or 0

        if sentiment in sentiments:
            sentiments[sentiment] += 1
            sentiment_score_total += sentiment_score_map[sentiment]

        total_duration += duration
        total_latency += latency
        total_calls += 1

        if not latest_data:
            latest_data = data  # full JSON of latest conversation

    latest_summary = latest_data.get("summary", {})
    latest_messages = latest_data.get("messages", [])

    avg_sentiment_score = round((sentiment_score_total / total_calls) * 10, 1) if total_calls else None
    avg_latency = round(total_latency / total_calls, 2) if total_calls else None

    return {
        "metrics": {
            "total_calls": total_calls,
            "average_response_latency_ms": int(avg_latency * 1000) if avg_latency else None,
            "average_sentiment_score_10": avg_sentiment_score,
            "sentiment_breakdown": sentiments,
            "latest_call_summary": {
                "duration": f"{int(latest_summary['duration_seconds']//60):02}:{int(latest_summary['duration_seconds']%60):02}" if latest_summary else None,
                "agent": "AI Assistant",
                "purpose": latest_summary.get("overview", "Unknown"),
                "sentiment": latest_summary.get("sentiment", "neutral"),
                "user_tone": latest_summary.get("user_tone", ""),
                "concerns": latest_summary.get("concerns", []),
            }
        },
        "latest_conversation": latest_messages
    }
