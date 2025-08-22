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

# ...existing code...
@lru_cache(maxsize=64)
def _cached_sentiment_analysis(filename: str):
    # Normalize filename to a convoJson json file name
    try:
        base = os.path.basename(filename or "").strip()
        if base.endswith(".txt"):
            base = base[:-4] + ".json"
        elif not base.endswith(".json"):
            base = base + ".json"
        filename = base
    except Exception:
        pass

    # existing disk cache lookup remains unchanged
    # ...existing code...
    filepath = os.path.join(CONVO_DIR, filename)
    if not os.path.exists(filepath):
        return {"error": "File not found"}

    def robustify(parsed_obj, user_sentences_local, ai_sentences_local):
        """Ensure both user & ai arrays exist, non-empty, and aligned in length.
        If one side missing or empty, synthesize neutral baseline (5.0) matching other length.
        If lengths differ, pad shorter with last running average (baseline 5)."""
        if not isinstance(parsed_obj, dict):
            return parsed_obj
        parsed_obj.setdefault('user', [])
        parsed_obj.setdefault('ai', [])
        fallback_meta = parsed_obj.get('meta', {}) or {}
        # Build baseline if one side empty but other has content
        user_len = len(parsed_obj['user'])
        ai_len = len(parsed_obj['ai'])
        # Helper to compute running avg
        def running_avg(series):
            if not series: return 5.0
            total = 0.0
            for i, item in enumerate(series, start=1):
                total += float(item.get('score', 5))
            return total / len(series)
        if user_len == 0 and ai_len > 0:
            baseline = running_avg(parsed_obj['ai']) if ai_len else 5.0
            parsed_obj['user'] = [{"index": i+1, "score": round(baseline,2)} for i in range(ai_len)]
            fallback_meta['user_baseline_injected'] = True
        if ai_len == 0 and user_len > 0:
            baseline = running_avg(parsed_obj['user']) if user_len else 5.0
            parsed_obj['ai'] = [{"index": i+1, "score": round(baseline,2)} for i in range(user_len)]
            fallback_meta['ai_baseline_injected'] = True
        # Recompute lengths after baseline injection
        user_len = len(parsed_obj['user'])
        ai_len = len(parsed_obj['ai'])
        if user_len == 0 and ai_len == 0:
            # Completely empty: synthesize single neutral point
            parsed_obj['user'] = [{"index":1, "score":5.0}]
            parsed_obj['ai'] = [{"index":1, "score":5.0}]
            fallback_meta['both_baseline_injected'] = True
        # Pad shorter side
        user_len = len(parsed_obj['user'])
        ai_len = len(parsed_obj['ai'])
        if user_len != ai_len:
            target = max(user_len, ai_len)
            def pad(series):
                if not series:
                    last_avg = 5.0
                else:
                    total = 0.0
                    for i, item in enumerate(series, start=1):
                        total += float(item.get('score',5))
                    last_avg = total / len(series)
                start_idx = series[-1]['index'] + 1 if series else 1
                for idx in range(start_idx, target+1):
                    series.append({"index": idx, "score": round(last_avg,2)})
            if user_len < target:
                pad(parsed_obj['user'])
                fallback_meta['user_padded'] = True
            if ai_len < target:
                pad(parsed_obj['ai'])
                fallback_meta['ai_padded'] = True
        # Ensure indices sequential starting at 1
        for key in ['user','ai']:
            parsed_obj[key].sort(key=lambda x: x.get('index', 0))
            for i, item in enumerate(parsed_obj[key], start=1):
                item['index'] = i
        parsed_obj['meta'] = {**parsed_obj.get('meta', {}), **fallback_meta}
        return parsed_obj

    # Try disk cache first
    if os.path.exists(disk_cache_path):
        try:
            with open(disk_cache_path, 'r', encoding='utf-8') as f:
                cached = json.load(f)
            # We still need convo sentences to know true counts for robustify; load convo file quickly
            convo_path = os.path.join(CONVO_DIR, filename)
            user_sentences_local, ai_sentences_local = [], []
            if os.path.exists(convo_path):
                try:
                    with open(convo_path, 'r', encoding='utf-8') as cf:
                        convo_data = json.load(cf)
                        convo_list = convo_data.get('conversation', [])
                        user_sentences_local = [c for c in convo_list if c.get('speaker')=='user']
                        ai_sentences_local = [c for c in convo_list if c.get('speaker')=='ai']
                except Exception:
                    pass
            robust = robustify(cached, user_sentences_local, ai_sentences_local)
            return robust
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
        # Return neutral baseline for empty convo
        empty_parsed = {"user": [{"index":1,"score":5.0}], "ai": [{"index":1,"score":5.0}], "meta": {"both_baseline_injected": True}}
        try:
            with open(disk_cache_path, 'w', encoding='utf-8') as f:
                json.dump(empty_parsed, f, ensure_ascii=False, indent=2)
        except Exception:
            pass
        return empty_parsed

    user_sentences = [c for c in conversation if c.get("speaker") == "user"]
    ai_sentences = [c for c in conversation if c.get("speaker") == "ai"]

    # Heuristic fallback sentiment (very simple lexical scoring)
    neg_words = {"problem","samasya","karz","loan","byaj","mafi","nahi","nahin","burden","loss","damage","fail","issue","confused","anxious"}
    pos_words = {"achha","theek","fayda","hope","sahi","improve","kam","kamkar","solution","help","support","relief","relieved"}
    def heuristic_score(text: str) -> float:
        if not text:
            return 5.0
        t = text.lower()
        neg = sum(1 for w in neg_words if w in t)
        pos = sum(1 for w in pos_words if w in t)
        if neg==0 and pos==0:
            return 5.0
        raw = 5.0 + (pos - neg) * 1.2  # shift by difference
        return max(0.0, min(10.0, raw))

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

        fallback_meta = {"user_fallback": False, "ai_fallback": False}

        # If model returned empty arrays but we have sentences, build heuristic list
        def build_fallback(series_name: str, sentences_list):
            return [{"index": i+1, "score": round(heuristic_score(s.get('text','')),2)} for i, s in enumerate(sentences_list)]

        if (not parsed['user']) and user_sentences:
            parsed['user'] = build_fallback('user', user_sentences)
            fallback_meta['user_fallback'] = True
        # If model returned fewer than actual sentences, append heuristic scores for missing
        if user_sentences and len(parsed['user']) < len(user_sentences):
            existing_indices = {p['index'] for p in parsed['user'] if 'index' in p}
            for i, s in enumerate(user_sentences, start=1):
                if i not in existing_indices:
                    parsed['user'].append({"index": i, "score": round(heuristic_score(s.get('text','')),2)})
            parsed['user'].sort(key=lambda x: x['index'])
            fallback_meta['user_fallback'] = True

        if (not parsed['ai']) and ai_sentences:
            parsed['ai'] = build_fallback('ai', ai_sentences)
            fallback_meta['ai_fallback'] = True
        if ai_sentences and len(parsed['ai']) < len(ai_sentences):
            existing_indices = {p['index'] for p in parsed['ai'] if 'index' in p}
            for i, s in enumerate(ai_sentences, start=1):
                if i not in existing_indices:
                    parsed['ai'].append({"index": i, "score": round(heuristic_score(s.get('text','')),2)})
            parsed['ai'].sort(key=lambda x: x['index'])
            fallback_meta['ai_fallback'] = True

        parsed = robustify(parsed, user_sentences, ai_sentences)
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
