import os
import json
import re
from functools import lru_cache
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

CONVO_DIR = os.path.join(os.path.dirname(__file__), "../convoJson")
CACHE_DIR = os.path.join(CONVO_DIR, "_sentiment_cache")
os.makedirs(CACHE_DIR, exist_ok=True)

SENTIMENT_MODEL_NAME = "gemini-2.5-flash"

@lru_cache(maxsize=64)
def _cached_sentiment_analysis(filename: str):
    # Disk cache path (strip .json and make a .sentiment.json to avoid collisions)
    safe_name = os.path.splitext(filename)[0] + ".sentiment.json"
    disk_cache_path = os.path.join(CACHE_DIR, safe_name)

    # Try disk cache first
    if os.path.exists(disk_cache_path):
        try:
            with open(disk_cache_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception:
            pass  # fall through to regeneration

    filepath = os.path.join(CONVO_DIR, filename)
    if not os.path.exists(filepath):
        return {"error": "File not found"}
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except Exception as e:
        return {"error": f"Failed to load file: {e}"}

    conversation = data.get("conversation", [])
    if not conversation:
        return {"error": "Conversation empty"}

    user_sentences = [c for c in conversation if c.get("speaker") == "user"]
    ai_sentences = [c for c in conversation if c.get("speaker") == "ai"]

    # Build numbered lists to help model stay aligned
    def build_numbered(sentences):
        lines = []
        for i, s in enumerate(sentences, start=1):
            text = s.get("text", "").replace('\n', ' ').strip()
            if len(text) > 500:  # truncate overly long content
                text = text[:500] + "..."
            lines.append(f"{i}. {text}")
        return "\n".join(lines)

    user_block = build_numbered(user_sentences)
    ai_block = build_numbered(ai_sentences)

    model = genai.GenerativeModel(SENTIMENT_MODEL_NAME)

    prompt = f"""
You are a precise sentiment scoring engine. Score each sentence independently for sentiment on a 0 to 10 float scale where:
0 = extremely negative/distressed
2 = clearly negative
5 = neutral / mixed / informational
8 = clearly positive / supportive
10 = extremely positive / delighted / strongly reassuring

IMPORTANT:
- Judge ONLY the emotional valence contained in the sentence itself (not future context).
- Keep cultural / language nuances (text may be transliterated Hindi) and focus on user feeling or AI tone.
- Return STRICT JSON with this exact schema:
{{
  "user": [{{"index": <number>, "score": <float>}} ...],
  "ai": [{{"index": <number>, "score": <float>}} ...]
}}
Do NOT include the sentence text in the JSON (frontend already has it). Ensure indices align with numbering below.
If a sentence is purely procedural or neutral, score near 5.

User sentences:
{user_block}

AI sentences:
{ai_block}

Return ONLY JSON. No markdown.
"""

    try:
        response = model.generate_content(prompt)
        raw = response.text.strip()
        # Attempt to extract JSON
        match = re.search(r"\{[\s\S]*\}$", raw)
        json_str = match.group(0) if match else raw
        parsed = json.loads(json_str)
        # Basic validation
        if not isinstance(parsed, dict) or 'user' not in parsed or 'ai' not in parsed:
            return {"error": "Malformed response"}
        # Persist to disk cache
        try:
            with open(disk_cache_path, 'w', encoding='utf-8') as f:
                json.dump(parsed, f, ensure_ascii=False, indent=2)
        except Exception:
            pass
        return parsed
    except Exception as e:
        return {"error": str(e)}


def get_sentiment_flow(filename: str):
    """Public wrapper with cache control."""
    return _cached_sentiment_analysis(filename)
