import os
import re
import json
from datetime import datetime
from statistics import mean
from dotenv import load_dotenv
import google.generativeai as genai
import glob

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

def parse_log_file(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        lines = f.readlines()

    call_start, call_end, stream_sid = None, None, None
    sentences = []
    current_ai_sentence, current_user_sentence = [], []
    last_timestamp, latencies = None, []
    noise_count = 0

    for line in lines:
        line = line.strip()

        if line.startswith("Call started at:"):
            call_start = line.replace("Call started at:", "").strip()
            continue
        elif line.startswith("Call ended at:"):
            call_end = line.replace("Call ended at:", "").strip()
            continue
        elif line.startswith("Stream SID:"):
            stream_sid = line.replace("Stream SID:", "").strip()
            continue

        match = re.match(r"\[(\d{2}:\d{2}:\d{2})\] (.+?): (.+)", line)
        if match:
            timestamp_str, speaker_type, text = match.groups()
            # Combine with call_start date to form a full timestamp
            full_timestamp_str = f"{call_start.split('T')[0]}T{timestamp_str}"
            
            timestamp = datetime.strptime(timestamp_str, "%H:%M:%S")

            if "AI (chunk)" in speaker_type:
                if current_user_sentence:
                    sentences.append({"speaker": "user", "text": "".join(current_user_sentence), "timestamp": last_user_timestamp})
                    current_user_sentence = []

                if last_timestamp and (timestamp - last_timestamp).seconds > 2:
                    if current_ai_sentence:
                        sentences.append({"speaker": "ai", "text": " ".join(current_ai_sentence), "timestamp": last_ai_timestamp})
                        current_ai_sentence = []
                
                if not current_ai_sentence:
                    last_ai_timestamp = full_timestamp_str

                current_ai_sentence.append(text.strip())
                if last_timestamp:
                    latencies.append((timestamp - last_timestamp).total_seconds())
                last_timestamp = timestamp

            elif "User" in speaker_type:
                if current_ai_sentence:
                    sentences.append({"speaker": "ai", "text": " ".join(current_ai_sentence), "timestamp": last_ai_timestamp})
                    current_ai_sentence = []

                user_text = text.strip()
                if "<noise>" in user_text.lower():
                    noise_count += 1
                
                if not current_user_sentence:
                    last_user_timestamp = full_timestamp_str
                
                current_user_sentence.append(user_text)
    gemini_model = genai.GenerativeModel("gemini-1.5-flash")
    
    def strip_basic_markdown(text):
        text = re.sub(r'```[\s\S]*?```', '', text)  # Remove code blocks
        text = re.sub(r'`[^`]+`', '', text)  # Remove inline code
        text = re.sub(r'\[([^\]]+)\]\([^\)]+\)', r'\1', text)  # Remove links
        text = re.sub(r'\*\*([^*]+)\*\*', r'\1', text)  # Remove bold
        text = re.sub(r'\*([^*]+)\*', r'\1', text)  # Remove italic
        text = re.sub(r'^[#>]+\s*', '', text, flags=re.MULTILINE)  # Remove headers/quotes
        return text.strip()
    
    
    if current_ai_sentence:
        sentences.append({"speaker": "ai", "text": " ".join(current_ai_sentence), "timestamp": last_ai_timestamp})
    
    user_text = gemini_model.generate_content(f"fix grammar in the hindi text and return just the text without any formatting or explanation: {''.join(current_user_sentence)}")
    cleaned_user_text = strip_basic_markdown(user_text)
    if current_user_sentence:
        sentences.append({"speaker": "user", "text": cleaned_user_text, "timestamp": last_user_timestamp})

    # Metrics
    start_dt = datetime.fromisoformat(call_start) if call_start else None
    end_dt = datetime.fromisoformat(call_end) if call_end else None
    duration = (end_dt - start_dt).total_seconds() if start_dt and end_dt else None
    avg_latency = round(mean(latencies), 2) if latencies else None

    conversation_text = "\n".join(f"{s['speaker']}: {s['text']}" for s in sentences)

    # Gemini API call for analysis
    
    prompt = f"""
    You are analyzing a human-AI phone conversation.
    Given the conversation below, return the analysis in JSON format
    with the following keys only:
    - sentiment: one of ["positive", "neutral", "negative"]
    - concerns: list of user’s main social or emotional concerns
    - overview: a short summary of the call in 2-3 sentences
    - user_tone: description of the tone or urgency in the user's queries
    - emotion: a single word describing the user's primary emotion (e.g., 'anxious', 'relieved', 'confused')
    - sentiment_score: a numerical score from 0 (very negative) to 10 (very positive)

    Conversation:
    {conversation_text}

    Respond ONLY with valid JSON. Do not wrap the response in markdown or extra explanation.

    Example:
    {{
    "sentiment": "neutral",
    "concerns": ["loan repayment", "crop loss"],
    "overview": "User discussed loan difficulties and crop failures...",
    "user_tone": "frustrated but hopeful",
    "emotion": "anxious",
    "sentiment_score": 2.5
    }}
    """

    try:
        response = gemini_model.generate_content(prompt)
        # print(response.text)

        # Extract JSON from inside the ```json ... ``` block
        match = re.search(r"```json\s*(\{.*?\})\s*```", response.text, re.DOTALL)
        if match:
            json_str = match.group(1)
            gemini_analysis = json.loads(json_str)
        else:
            # fallback if model didn’t wrap in ```json
            gemini_analysis = json.loads(response.text.strip())
    except Exception as e:
        gemini_analysis = {"error": str(e)}


    summary = {
        "filename": os.path.basename(filepath),
        "stream_sid": stream_sid,
        "call_started": call_start,
        "call_ended": call_end,
        "duration_seconds": duration,
        "average_ai_response_latency": avg_latency,
        "noise_count": noise_count,
        "total_user_messages": len([s for s in sentences if s["speaker"] == "user"]),
        "total_ai_responses": len([s for s in sentences if s["speaker"] == "ai"]),
        **gemini_analysis
    }


    return {
        "summary": summary,
        "conversation": sentences
    }

def get_last_n_conversations(n=10):
    convo_dir = os.path.join(os.path.dirname(__file__), "convoJson")
    files = sorted(
        glob.glob(os.path.join(convo_dir, "*.json")),
        key=os.path.getmtime,
        reverse=True
    )[:n]

    recent_logs = []
    for file_path in files:
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            recent_logs.append({
                "summary": data.get("summary"),
                "conversation": data.get("conversation")[-6:]  # optional: last 6 turns
            })
    return recent_logs


def parse_all_logs():
    input_folder = os.path.join(os.path.dirname(__file__), "processed_logs")
    output_folder = os.path.join(os.path.dirname(__file__), "convoJson")
    os.makedirs(output_folder, exist_ok=True)

    for fname in os.listdir(input_folder):
        if fname.endswith(".txt"):
            json_path = os.path.join(output_folder, fname.replace(".txt", ".json"))
            if not os.path.exists(json_path):
                print(f"Parsing {fname}...")
                full_path = os.path.join(input_folder, fname)
                parsed_json = parse_log_file(full_path)

                with open(json_path, "w", encoding="utf-8") as f:
                    json.dump(parsed_json, f, indent=2, ensure_ascii=False)
            else:
                print(f"Skipping {fname}, JSON already exists.")

if __name__ == "__main__":
    parse_all_logs()