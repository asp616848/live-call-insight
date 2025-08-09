import os
import json
import glob
from statistics import mean
import google.generativeai as genai
import re

def get_dashboard_with_latest_convo():
    convo_dir = os.path.join(os.path.dirname(__file__), "../convoJson")
    files = glob.glob(os.path.join(convo_dir, "*.json"))

    if not files:
        return {
            "metrics": {
                "total_calls": 0,
                "average_call_duration": 0,
                "average_sentiment_score": 0,
                "average_ai_response_latency": 0,
                "latest_call_summary": {}
            },
            "latest_conversation": []
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
        "latest_conversation": latest_data.get("conversation", [])
    }

    return dashboard_data

def get_top_concerns():
    """
    Analyzes all conversation summaries to find the top 3 concerns.
    """
    convo_dir = os.path.join(os.path.dirname(__file__), "../convoJson")
    files = glob.glob(os.path.join(convo_dir, "*.json"))

    if not files:
        return []

    all_concerns = []
    for file_path in files:
        with open(file_path, "r", encoding="utf-8") as f:
            try:
                data = json.load(f)
                if "summary" in data and "concerns" in data["summary"]:
                    all_concerns.extend(data["summary"]["concerns"])
            except json.JSONDecodeError:
                print(f"Warning: Could not decode JSON from {file_path}")
                continue
    
    if not all_concerns:
        return []

    # Configure the Gemini API
    # Make sure to set your GOOGLE_API_KEY environment variable
    try:
        genai.configure(api_key=os.environ["GEMINI_API_KEY"])
        model = genai.GenerativeModel('gemini-2.5-flash-lite')
    except Exception as e:
        print(f"Error configuring Gemini API: {e}")
        return [{"error": "Gemini API not configured"}]

    prompt = f"""
    From the following list of concerns, identify the top 3 most frequent or significant themes.
    Return your answer as a JSON object where keys are the concern and values are their counts.
    Do not use markdown formatting.

    Concerns list: {json.dumps(all_concerns)}
    """

    try:
        response = model.generate_content(prompt)
        
        # Clean the response to extract the JSON part
        text_response = response.text
        print(text_response)
        # Use regex to find the JSON block
        json_match = re.search(r'\{.*\}', text_response, re.DOTALL)
        if json_match:
            json_str = json_match.group(0)
            top_concerns = json.loads(json_str)
            # Format for the chart: [{ name: "concern", value: count }]
            return [{"name": k, "value": v} for k, v in top_concerns.items()]
        else:
            return [{"error": "Could not parse Gemini response"}]

    except Exception as e:
        print(f"Error calling Gemini API: {e}")
        return [{"error": "Failed to get insights from Gemini"}]


if __name__ == '__main__':
    # For testing the function
    dashboard_data = get_dashboard_with_latest_convo()
    print(json.dumps(dashboard_data, indent=2))
    top_concerns = get_top_concerns()
    print(json.dumps(top_concerns, indent=2))
