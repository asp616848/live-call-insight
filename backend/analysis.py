import os
import json
import textwrap
import langextract as lx
from dotenv import load_dotenv

load_dotenv()
API_KEY = os.getenv("GEMINI_API_KEY")
if not API_KEY:
    raise ValueError("GEMINI_API_KEY missing")

def analyze_conversation_with_langextract(filepath):
    """
    Analyze conversation JSON file using LangExtract to extract concerns, 
    action items, and emotions with proper attributes.
    """
    with open(filepath, "r", encoding="utf-8") as f:
        data = json.load(f)

    conversation = data.get("conversation", [])
    summary_metrics = data.get("summary", {})

    # Extract only user messages for analysis (concerns come from users)
    user_messages = [msg for msg in conversation if msg.get("speaker") == "user"]
    ai_messages = [msg for msg in conversation if msg.get("speaker") == "ai"]
    
    # Combine all conversation text for context
    full_transcript = "\n".join(
        f"{msg.get('speaker', '').upper()}: {msg.get('text', '')}" 
        for msg in conversation
    )

    # Define extraction prompt
    prompt = textwrap.dedent("""
    From the conversation transcript, extract in order of appearance:
    - concern: user-mentioned problems, issues, or complaints
    - action_item: AI's promises, solutions, or policy mentions (include amounts/numbers)
    - emotion: exact words/phrases showing the user's emotional state
    Use exact text spans without paraphrasing. Provide meaningful attributes for context.
    """)

    # Create examples based on the provided format
    examples = [
        lx.data.ExampleData(
            text=(
                "USER: सबसे बड़ी प्रॉब्लम तो यह है कि खेती करते हुए किसान का लोन जो है वह माफ ही नहीं होता "
                "बहाज इतना हाई है कि हम चुका ही नहीं पाते\n"
                "AI: ₹2000 crore ke projects laaye hain कि कisan log के लिए"
            ),
            extractions=[
                lx.data.Extraction(
                    extraction_class="concern",
                    extraction_text="किसान का लोन जो है वह माफ ही नहीं होता",
                    attributes={"type": "loan forgiveness", "severity": "high", "domain": "agriculture"}
                ),
                lx.data.Extraction(
                    extraction_class="concern", 
                    extraction_text="बहाज इतना हाई है कि हम चुका ही नहीं पाते",
                    attributes={"type": "loan repayment", "severity": "high", "domain": "agriculture"}
                ),
                lx.data.Extraction(
                    extraction_class="action_item",
                    extraction_text="₹2000 crore ke projects laaye hain",
                    attributes={"type": "policy", "amount": "₹2000 crore", "beneficiary": "farmers"}
                ),
                lx.data.Extraction(
                    extraction_class="emotion",
                    extraction_text="सबसे बड़ी प्रॉब्लम",
                    attributes={"feeling": "distress", "intensity": "high"}
                )
            ]
        )
    ]

    # Run LangExtract analysis
    result = lx.extract(
        text_or_documents=full_transcript,
        prompt_description=prompt,
        examples=examples,
        model_id="gemini-2.5-flash-lite",
        extraction_passes=2,
        max_workers=4,
        max_char_buffer=800
    )

    def serialize(obj):
        """Serialize extraction objects to JSON-compatible format"""
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

    # Serialize extractions
    extractions = [serialize(ext) for ext in result.extractions]
    
    # Generate visualization HTML
    visualization_html = lx.visualize(result)

    return {
        "metrics": summary_metrics,
        "extractions": extractions,
        "visualization_html": visualization_html,
        "conversation_summary": {
            "total_messages": len(conversation),
            "user_messages": len(user_messages), 
            "ai_messages": len(ai_messages),
            "extracted_entities": len(extractions)
        }
    }