import os
import re
import textwrap
from datetime import datetime
from statistics import mean
import langextract as lx
from dotenv import load_dotenv

load_dotenv()
API_KEY = os.getenv("GEMINI_API_KEY")
if not API_KEY:
    raise ValueError("GEMINI_API_KEY missing")

def parse_and_compute_metrics(lines):
    call_start = call_end = None
    sentences = []
    current = {"speaker": None, "text": [], "timestamp": None}
    last_ts = None
    latencies = []
    noise_count = 0

    for line in lines:
        line = line.strip()
        if line.startswith("Call started at:"):
            call_start = line.split("Call started at:")[1].strip()
            continue
        if line.startswith("Call ended at:"):
            call_end = line.split("Call ended at:")[1].strip()
            continue

        m = re.match(r"\[(\d{2}:\d{2}:\d{2})\] (.+?): (.+)", line)
        if not m:
            continue

        ts_str, speaker_tag, text = m.groups()
        ts = datetime.strptime(ts_str, "%H:%M:%S")
        full_ts = f"{call_start.split('T')[0]}T{ts_str}"
        role = "ai" if "AI (chunk)" in speaker_tag else "user"

        if current["speaker"] != role and current["speaker"]:
            sentences.append({
                "speaker": current["speaker"],
                "text": " ".join(current["text"]).strip(),
                "timestamp": current["timestamp"]
            })
            current = {"speaker": role, "text": [], "timestamp": full_ts}
        elif not current["text"]:
            current["timestamp"] = full_ts

        current["speaker"] = role
        current["text"].append(text.strip())

        if role == "ai":
            if last_ts:
                latencies.append((ts - last_ts).total_seconds())
            last_ts = ts
        else:
            if "<noise>" in text.lower():
                noise_count += 1

    if current["text"]:
        sentences.append({
            "speaker": current["speaker"],
            "text": " ".join(current["text"]).strip(),
            "timestamp": current["timestamp"]
        })

    metrics = {}
    if call_start and call_end:
        metrics["duration_seconds"] = (datetime.fromisoformat(call_end) -
                                       datetime.fromisoformat(call_start)).total_seconds()
    metrics["average_ai_latency"] = round(mean(latencies), 2) if latencies else None
    metrics["noise_count"] = noise_count
    metrics["total_user_turns"] = sum(1 for s in sentences if s["speaker"] == "user")
    metrics["total_ai_turns"] = sum(1 for s in sentences if s["speaker"] == "ai")

    return sentences, metrics, call_start, call_end

def analyze_conversation_with_langextract(filepath):
    import json
    
    with open(filepath, "r", encoding="utf-8") as f:
        data = json.load(f)

    conversation = data.get("conversation", [])
    summary_metrics = data.get("summary", {})

    # assemble transcript text for LangExtract
    transcript = "\n".join(f"{s.get('speaker', '')}: {s.get('text', '')}" for s in conversation)

    prompt = textwrap.dedent("""
    From the transcript, extract in order:
    - concern: user-mentioned issues.
    - action_item: AI’s follow-up actions; include "policy" or "amount" if present.
    - emotion: exact words showing the user's primary emotion.
    Use exact extraction spans without paraphrasing or overlap.
    Provide contextual attributes like topic or amount.
    """)

    examples = [
        lx.data.ExampleData(
            text=(
                "User: किसान का लोन जो है वह माफ ही नहीं होता "
                "बहाज इतना हाई है कि हम चुका ही नहीं पाते\n"
                "AI (chunk): ₹2000 crore ke projects laaye hain"
            ),
            extractions=[
                lx.data.Extraction("concern", "किसान का लोन जो है वह माफ ही नहीं होता"),
                lx.data.Extraction("concern", "बहाज इतना हाई है कि हम चुका ही नहीं पाते"),
                lx.data.Extraction("action_item", "₹2000 crore ke projects laaye hain")
                # solution item
            ]
        )
    ]

    result = lx.extract(
        text_or_documents=transcript,
        prompt_description=prompt,
        examples=examples,
        model_id="gemini-2.5-flash",
        extraction_passes=2,
        max_workers=4,
        max_char_buffer=800
    )

    def serialize(obj):
        import enum
        if isinstance(obj, enum.Enum):
            return obj.name
        elif hasattr(obj, '__dict__'):
            return {k: serialize(v) for k, v in vars(obj).items()}
        elif isinstance(obj, list):
            return [serialize(v) for v in obj]
        elif isinstance(obj, dict):
            return {k: serialize(v) for k, v in obj.items()}
        else:
            return obj

    extractions = [serialize(ext) for ext in result.extractions]
    html = lx.visualize(result)   # OK to keep as HTML string

    return {
        "metrics": summary_metrics,
        "extractions": extractions,
        "visualization_html": html
    }
