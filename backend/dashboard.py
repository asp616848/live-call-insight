import os
import json
import glob
from statistics import mean

def get_dashboard_with_latest_convo():
    convo_dir = os.path.join(os.path.dirname(__file__), "convoJson")
    files = glob.glob(os.path.join(convo_dir, "*.json"))

    if not files:
        return {
            "metrics": {
                "total_calls": 0,
                "average_call_duration": 0,
                "average_sentiment_score": 0,
                "average_ai_response_latency": 0,
            },
            "latest_conversation": None
        }

    # Sort files by modification time to find the latest one
    latest_file = max(files, key=os.path.getmtime)

    all_summaries = []
    for file_path in files:
        with open(file_path, "r", encoding="utf-8") as f:
            try:
                data = json.load(f)
                if "summary" in data:
                    all_summaries.append(data["summary"])
            except json.JSONDecodeError:
                print(f"Warning: Could not decode JSON from {file_path}")
                continue

    # Calculate aggregate metrics
    total_calls = len(all_summaries)
    
    durations = [s.get("duration_seconds") for s in all_summaries if s.get("duration_seconds") is not None]
    average_call_duration = mean(durations) if durations else 0

    sentiment_map = {"positive": 1, "neutral": 0, "negative": -1}
    sentiments = [sentiment_map.get(s.get("sentiment", "neutral").lower()) for s in all_summaries]
    average_sentiment_score = mean(sentiments) if sentiments else 0

    latencies = [s.get("average_ai_response_latency") for s in all_summaries if s.get("average_ai_response_latency") is not None]
    average_ai_response_latency = mean(latencies) if latencies else 0

    # Load latest conversation details
    with open(latest_file, "r", encoding="utf-8") as f:
        latest_data = json.load(f)

    # The summary in the metrics is an aggregation, but we also pass the specific summary of the latest call
    latest_summary = latest_data.get("summary", {})
    
    # Combine aggregated metrics with the latest conversation data
    dashboard_data = {
        "metrics": {
            "total_calls": total_calls,
            "average_call_duration": round(average_call_duration, 2),
            "average_sentiment_score": round(average_sentiment_score, 2),
            "average_ai_response_latency": round(average_ai_response_latency, 2),
            "latest_call_summary": latest_summary 
        },
        "latest_conversation": latest_data.get("conversation")
    }

    return dashboard_data

if __name__ == '__main__':
    # For testing the function
    dashboard_data = get_dashboard_with_latest_convo()
    print(json.dumps(dashboard_data, indent=2))
