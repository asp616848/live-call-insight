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

def strip_basic_markdown(text):
        text = re.sub(r'```[\s\S]*?```', '', text)  # Remove code blocks
        text = re.sub(r'`[^`]+`', '', text)  # Remove inline code
        text = re.sub(r'\[([^\]]+)\]\([^\)]+\)', r'\1', text)  # Remove links
        text = re.sub(r'\*\*([^*]+)\*\*', r'\1', text)  # Remove bold
        text = re.sub(r'\*([^*]+)\*', r'\1', text)  # Remove italic
        text = re.sub(r'^[#>]+\s*', '', text, flags=re.MULTILINE)  # Remove headers/quotes
        return text.strip()

def parse_log_file(filepath, skip_gemini: bool = False):
    # Lazily create model client only when needed
    gemini_model = None
    if not skip_gemini:
        try:
            gemini_model = genai.GenerativeModel("gemini-2.5-flash")
        except Exception:
            gemini_model = None
    
    with open(filepath, "r", encoding="utf-8") as f:
        lines = f.readlines()

    call_start, call_end, stream_sid = None, None, None
    sentences = []
    current_ai_sentence, current_user_sentence = [], []
    # We'll compute AI response latency as the delta between when the user finished
    # speaking (last_user_dt) and when the AI starts responding (ai_start_dt).
    last_user_dt = None
    last_user_timestamp = None
    last_ai_timestamp = None
    latencies = []
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

        match = re.match(r"\[(?P<ts>[\d\-: ]+)\]\s*(.+?):\s*(.+)", line)
        if match:
            ts_raw, speaker_type, text = match.group(1), match.group(2), match.group(3)
            # ts_raw may be either 'HH:MM:SS' or 'YYYY-MM-DD HH:MM:SS'
            ts_raw = ts_raw.strip()
            if re.match(r"\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}", ts_raw):
                # full timestamp present (common in transcript_ files)
                full_timestamp_str = ts_raw.replace(' ', 'T')
                try:
                    timestamp_dt = datetime.fromisoformat(full_timestamp_str)
                except Exception:
                    # fallback: parse with datetime.strptime
                    timestamp_dt = datetime.strptime(ts_raw, "%Y-%m-%d %H:%M:%S")
            else:
                # only time provided; combine with call_start date if available
                if call_start:
                    date_part = call_start.split('T')[0]
                else:
                    # fallback to today
                    date_part = datetime.now().date().isoformat()
                full_timestamp_str = f"{date_part}T{ts_raw}"
                try:
                    timestamp_dt = datetime.fromisoformat(full_timestamp_str)
                except Exception:
                    timestamp_dt = datetime.strptime(ts_raw, "%H:%M:%S")

            # Normalize speaker labels: various logs may use 'Assistant', 'Assistant (chunk)', 'AI (chunk)', etc.
            s_low = speaker_type.lower()
            is_ai = any(k in s_low for k in ("ai", "assistant", "ai (chunk)", "assistant (chunk)"))
            is_user = any(k in s_low for k in ("user", "villager", "caller"))

            if is_ai:
                if current_user_sentence:
                    # Apply grammar correction to every user message before appending
                    user_text_raw = "".join(current_user_sentence)
                    if gemini_model and not skip_gemini:
                        user_text_response = gemini_model.generate_content(f"Fix grammar and punctuations in the hindi text and then convert it to latin hindi, and then return just the text without any formatting or explanation: {user_text_raw}")
                        cleaned_user_text = strip_basic_markdown(user_text_response.text)
                    else:
                        # fallback: basic cleanup only
                        cleaned_user_text = strip_basic_markdown(user_text_raw)
                    print(cleaned_user_text)
                    # record the user end timestamp (string) used in the JSON
                    sentences.append({"speaker": "user", "text": cleaned_user_text, "timestamp": last_user_timestamp})
                    # also set the last_user_dt so we can compute AI latency when AI starts
                    try:
                        last_user_dt = datetime.fromisoformat(last_user_timestamp)
                    except Exception:
                        last_user_dt = None
                    current_user_sentence = []

                # If there's a gap >2s and we have an ongoing AI sentence, close it
                if last_ai_timestamp and (timestamp_dt - datetime.fromisoformat(last_ai_timestamp)).seconds > 2:
                    if current_ai_sentence:
                        sentences.append({"speaker": "ai", "text": " ".join(current_ai_sentence), "timestamp": last_ai_timestamp})
                        current_ai_sentence = []


                # If starting a new AI sentence, capture its start timestamp and compute latency
                if not current_ai_sentence:
                    last_ai_timestamp = timestamp_dt.isoformat()
                    ai_start_dt = timestamp_dt
                    if last_user_dt:
                        try:
                            delta = (ai_start_dt - last_user_dt).total_seconds()
                            # only record non-negative latencies
                            if delta >= 0:
                                latencies.append(delta)
                        except Exception:
                            pass

                current_ai_sentence.append(text.strip())
            elif is_user:
                if current_ai_sentence:
                    sentences.append({"speaker": "ai", "text": " ".join(current_ai_sentence), "timestamp": last_ai_timestamp})
                    current_ai_sentence = []
                user_text = text.strip()
                if "<noise>" in user_text.lower():
                    noise_count += 1

                # Always update last_user_timestamp to the latest seen user line
                last_user_timestamp = timestamp_dt.isoformat()

                if not current_user_sentence:
                    # start a new grouped user sentence
                    current_user_sentence = [user_text]
                else:
                    current_user_sentence.append(user_text)
    
    
    
    
    if current_ai_sentence:
        sentences.append({"speaker": "ai", "text": " ".join(current_ai_sentence), "timestamp": last_ai_timestamp})

    if current_user_sentence:
        user_text_raw = "".join(current_user_sentence)
        if gemini_model and not skip_gemini:
            user_text_response = gemini_model.generate_content(f"fix grammar and punctuations in the hindi text and return just the text without any formatting or explanation: {user_text_raw}")
            cleaned_user_text = strip_basic_markdown(user_text_response.text)
        else:
            cleaned_user_text = strip_basic_markdown(user_text_raw)
        print(cleaned_user_text)
        # finalize the last user sentence and ensure last_user_dt is set
        try:
            last_user_dt = datetime.fromisoformat(last_user_timestamp)
        except Exception:
            last_user_dt = None
        sentences.append({"speaker": "user", "text": cleaned_user_text, "timestamp": last_user_timestamp})

    # Metrics
    start_dt = datetime.fromisoformat(call_start) if call_start else None
    end_dt = datetime.fromisoformat(call_end) if call_end else None
    duration = (end_dt - start_dt).total_seconds() if start_dt and end_dt else None
    # Average AI response latency in seconds (from user end -> AI start)
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
        if gemini_model and not skip_gemini:
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
        else:
            gemini_analysis = {}
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
    convo_dir = os.path.join(os.path.dirname(__file__), "../convoJson")
    files = sorted(
        glob.glob(os.path.join(convo_dir, "*.json")),
        key=os.path.getmtime,
        reverse=True
    )[:n]

    recent_logs = []
    for file_path in files:
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)

            convo = data.get("conversation") or []
            # Only include conversations with more than 2 turns
            if len(convo) <= 2:
                # skip tiny/empty conversations
                continue

            recent_logs.append({
                "summary": data.get("summary"),
                "conversation": convo[-6:]  # optional: last 6 turns
            })
        except Exception:
            # If a file can't be read or parsed, skip it
            continue
    return recent_logs


def parse_all_logs():
    input_folder = os.path.join(os.path.dirname(__file__), "../processed_logs")
    output_folder = os.path.join(os.path.dirname(__file__), "../convoJson")
    os.makedirs(output_folder, exist_ok=True)

    for fname in os.listdir(input_folder):
        # Skip directories and hidden files
        full_path = os.path.join(input_folder, fname)
        if os.path.isfile(full_path) and not fname.startswith('.'):
            # Generate JSON filename - if it has .txt extension, replace it, otherwise add .json
            if fname.endswith(".txt"):
                json_fname = fname.replace(".txt", ".json")
            else:
                json_fname = f"{fname}.json"
            
            json_path = os.path.join(output_folder, json_fname)
            if not os.path.exists(json_path):
                print(f"Parsing {fname}...")
                try:
                    parsed_json = parse_log_file(full_path)
                    # If parsed output contains an error (e.g., Gemini quota), skip saving
                    has_error = False
                    if isinstance(parsed_json, dict):
                        if parsed_json.get("error"):
                            has_error = True
                        summary = parsed_json.get("summary")
                        if isinstance(summary, dict) and summary.get("error"):
                            has_error = True

                    if has_error:
                        print(f"Skipping save for {fname} due to error in analysis")
                        continue

                    # Ensure parsed conversation is sufficiently long (>2 turns)
                    convo = parsed_json.get("conversation") or []
                    if len(convo) <= 2:
                        print(f"Skipping save for {fname} because conversation is too short ({len(convo)} turns)")
                        continue

                    with open(json_path, "w", encoding="utf-8") as f:
                        json.dump(parsed_json, f, indent=2, ensure_ascii=False)
                    print(f"Successfully parsed {fname} -> {json_fname}")
                except Exception as e:
                    print(f"Error parsing {fname}: {e}")
            else:
                # If JSON already exists but contains an error, remove it so it doesn't pollute results
                try:
                    with open(json_path, "r", encoding="utf-8") as f:
                        existing = json.load(f)
                    has_error = False
                    if isinstance(existing, dict):
                        if existing.get("error"):
                            has_error = True
                        summary = existing.get("summary")
                        if isinstance(summary, dict) and summary.get("error"):
                            has_error = True
                    # Also remove already-saved tiny convos since they shouldn't exist
                    convo = existing.get("conversation") or []
                    if has_error or len(convo) <= 2:
                        try:
                            os.remove(json_path)
                            reason = ("error in analysis" if has_error else f"too short ({len(convo)} turns)")
                            print(f"Removed existing JSON for {fname} due to {reason}: {os.path.basename(json_path)}")
                        except Exception as e:
                            print(f"Failed to remove {json_path}: {e}")
                    else:
                        print(f"Skipping {fname}, JSON already exists.")
                except Exception as e:
                    print(f"Could not inspect existing JSON for {fname}: {e}")

if __name__ == "__main__":
    parse_all_logs()