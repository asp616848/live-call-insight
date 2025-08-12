import os
import json
import textwrap
import hashlib
import langextract as lx
from dotenv import load_dotenv

load_dotenv()
API_KEY = os.getenv("GEMINI_API_KEY")
if not API_KEY:
    raise ValueError("GEMINI_API_KEY missing")

def get_cache_key(filepath):
    """Generate a unique cache key based on file content and modification time"""
    try:
        # Get file modification time and content hash
        mtime = os.path.getmtime(filepath)
        with open(filepath, 'rb') as f:
            content_hash = hashlib.md5(f.read()).hexdigest()
        
        # Create cache key from filename, mtime, and content hash
        filename = os.path.basename(filepath)
        cache_key = f"{filename}_{mtime}_{content_hash}"
        return cache_key
    except Exception as e:
        print(f"Error generating cache key: {e}")
        return None

def get_cache_dir():
    """Get or create the cache directory"""
    cache_dir = os.path.join(os.path.dirname(__file__), "langextract_cache")
    os.makedirs(cache_dir, exist_ok=True)
    return cache_dir

def load_from_cache(cache_key):
    """Load analysis results from cache if available"""
    if not cache_key:
        return None
    
    cache_dir = get_cache_dir()
    cache_file = os.path.join(cache_dir, cache_key, "analysis_result.json")
    
    try:
        if os.path.exists(cache_file):
            with open(cache_file, 'r', encoding='utf-8') as f:
                cached_data = json.load(f)
            
            # Load the visualization HTML separately
            html_file = os.path.join(cache_dir, cache_key, "visualization.html")
            if os.path.exists(html_file):
                with open(html_file, 'r', encoding='utf-8') as f:
                    cached_data["visualization_html"] = f.read()
            
            print(f"Loaded analysis from cache: {cache_key}")
            return cached_data
    except Exception as e:
        print(f"Error loading from cache: {e}")
    
    return None

def save_to_cache(cache_key, analysis_result):
    """Save analysis results to cache"""
    if not cache_key:
        return
    
    cache_dir = get_cache_dir()
    call_cache_dir = os.path.join(cache_dir, cache_key)
    os.makedirs(call_cache_dir, exist_ok=True)
    
    try:
        # Save the main analysis data (without HTML to avoid JSON issues)
        cache_data = analysis_result.copy()
        visualization_html = cache_data.pop("visualization_html", "")
        
        cache_file = os.path.join(call_cache_dir, "analysis_result.json")
        with open(cache_file, 'w', encoding='utf-8') as f:
            json.dump(cache_data, f, indent=2, ensure_ascii=False)
        
        # Save visualization HTML separately
        if visualization_html:
            html_file = os.path.join(call_cache_dir, "visualization.html")
            with open(html_file, 'w', encoding='utf-8') as f:
                f.write(visualization_html)
        
        # Also save the extraction files in the cache directory
        extraction_file = os.path.join(call_cache_dir, "extraction_results.jsonl")
        if os.path.exists("extraction_results.jsonl"):
            import shutil
            shutil.copy2("extraction_results.jsonl", extraction_file)
        
        print(f"Saved analysis to cache: {cache_key}")
    except Exception as e:
        print(f"Error saving to cache: {e}")

def clean_cache(max_age_days=7):
    """Clean up cache entries older than max_age_days"""
    import time
    import shutil
    
    cache_dir = get_cache_dir()
    current_time = time.time()
    max_age_seconds = max_age_days * 24 * 60 * 60
    
    try:
        for cache_entry in os.listdir(cache_dir):
            cache_path = os.path.join(cache_dir, cache_entry)
            if os.path.isdir(cache_path):
                # Check the age of the cache directory
                cache_age = current_time - os.path.getctime(cache_path)
                if cache_age > max_age_seconds:
                    shutil.rmtree(cache_path)
                    print(f"Removed old cache entry: {cache_entry}")
    except Exception as e:
        print(f"Error cleaning cache: {e}")

def list_cache_entries():
    """List all cache entries for debugging"""
    cache_dir = get_cache_dir()
    try:
        entries = [d for d in os.listdir(cache_dir) if os.path.isdir(os.path.join(cache_dir, d))]
        return sorted(entries)
    except Exception as e:
        print(f"Error listing cache entries: {e}")
        return []

def analyze_conversation_with_langextract(filepath):
    """
    Analyze conversation JSON file using LangExtract to extract concerns, 
    action items, and emotions with proper attributes.
    Uses caching to avoid re-analyzing unchanged files.
    """
    # Check cache first
    cache_key = get_cache_key(filepath)
    cached_result = load_from_cache(cache_key)
    if cached_result:
        return cached_result
    
    print(f"Processing new analysis for: {os.path.basename(filepath)}")
    
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

    # Expanded and diversified examples for stronger guidance
    examples = [
        # ORIGINAL SHORT EXAMPLE (kept)
        lx.data.ExampleData(
            text=(
                "USER: sabse badi problem to yah hai ki kheti karte hue kisan ka loan jo hai vah maaf hi nahi hota \n"
                "USER: byaaj itna high hai ki hum chuka hi nahi paate\n"
                "AI: ₹2000 crore ke projects laaye hain ki kisan log ke liye"
            ),
            extractions=[
                lx.data.Extraction(
                    extraction_class="concern",
                    extraction_text="kisan ka loan jo hai vah maaf hi nahi hota",
                    attributes={"type": "loan forgiveness", "severity": "high", "domain": "agriculture"}
                ),
                lx.data.Extraction(
                    extraction_class="concern",
                    extraction_text="byaaj itna high hai ki hum chuka hi nahi paate",
                    attributes={"type": "loan repayment", "severity": "high", "domain": "agriculture"}
                ),
                lx.data.Extraction(
                    extraction_class="action_item",
                    extraction_text="₹2000 crore ke projects laaye hain",
                    attributes={"type": "policy", "amount": "₹2000 crore", "beneficiary": "farmers"}
                ),
                lx.data.Extraction(
                    extraction_class="emotion",
                    extraction_text="sabse badi problem",
                    attributes={"feeling": "distress", "intensity": "high"}
                )
            ]
        ),
        # LONG AGRICULTURE + IRRIGATION
        lx.data.ExampleData(
            text=(
                "USER: pichle teen saal se nahar mein paani hi nahi aaya, fasal baar-baar sukh jaati hai.\n"
                "USER: borewell ka kharcha utha nahi paate, diesel itna mehnga hai.\n"
                "AI: is season 18 nayi micro-irrigation scheme sanction hui hain jinmein ₹75 crore allocate hua hai.\n"
                "AI: saath hi solar pump subsidy 60% tak badhayi jaayegi.\n"
                "USER: hum log to bilkul hatash ho gaye hain."
            ),
            extractions=[
                lx.data.Extraction(
                    extraction_class="concern",
                    extraction_text="nahar mein paani hi nahi aaya",
                    attributes={"type": "irrigation failure", "duration": "3 years", "impact": "crop loss"}
                ),
                lx.data.Extraction(
                    extraction_class="concern",
                    extraction_text="fasal baar-baar sukh jaati hai",
                    attributes={"type": "crop damage", "frequency": "repeated", "severity": "high"}
                ),
                lx.data.Extraction(
                    extraction_class="concern",
                    extraction_text="borewell ka kharcha utha nahi paate",
                    attributes={"type": "input affordability", "resource": "borewell", "cause": "high cost"}
                ),
                lx.data.Extraction(
                    extraction_class="concern",
                    extraction_text="diesel itna mehnga hai",
                    attributes={"type": "fuel cost", "currency_context": "INR", "effect": "irrigation limitation"}
                ),
                lx.data.Extraction(
                    extraction_class="action_item",
                    extraction_text="18 nayi micro-irrigation scheme sanction hui hain",
                    attributes={"type": "irrigation scheme", "count": 18, "funding": "₹75 crore"}
                ),
                lx.data.Extraction(
                    extraction_class="action_item",
                    extraction_text="solar pump subsidy 60% tak badhayi jaayegi",
                    attributes={"type": "subsidy", "rate": "60%", "beneficiary": "farmers"}
                ),
                lx.data.Extraction(
                    extraction_class="emotion",
                    extraction_text="hum log to bilkul hatash ho gaye hain",
                    attributes={"feeling": "hopelessness", "intensity": "high"}
                )
            ]
        ),
        # HEALTH + ACCESS
        lx.data.ExampleData(
            text=(
                "USER: hamare gaon ke prathamik swasthya kendra mein doctor hafton nahi aata.\n"
                "USER: dawaiyan bhi zyadatar out of stock rehti hain.\n"
                "AI: agle quarter mein 12 naye doctor post honge aur essential medicines ka buffer stock 3x kiya jaayega.\n"
                "USER: log darte hain ki emergency mein kaun madad karega."
            ),
            extractions=[
                lx.data.Extraction(
                    extraction_class="concern",
                    extraction_text="doctor hafton nahi aata",
                    attributes={"type": "staff absenteeism", "facility": "primary health center", "frequency": "weeks"}
                ),
                lx.data.Extraction(
                    extraction_class="concern",
                    extraction_text="dawaiyan bhi zyadatar out of stock rehti hain",
                    attributes={"type": "medicine shortage", "availability": "low", "impact": "treatment delay"}
                ),
                lx.data.Extraction(
                    extraction_class="action_item",
                    extraction_text="12 naye doctor post honge",
                    attributes={"type": "staff deployment", "count": 12, "timeline": "next quarter"}
                ),
                lx.data.Extraction(
                    extraction_class="action_item",
                    extraction_text="buffer stock 3x kiya jaayega",
                    attributes={"type": "inventory increase", "multiplier": "3x", "category": "essential medicines"}
                ),
                lx.data.Extraction(
                    extraction_class="emotion",
                    extraction_text="log darte hain",
                    attributes={"feeling": "fear", "context": "medical emergency"}
                )
            ]
        ),
        # EDUCATION + INFRASTRUCTURE
        lx.data.ExampleData(
            text=(
                "USER: school mein abhi bhi tin ki chhat hai jo har baarish mein tapakti hai.\n"
                "USER: bacche bheegte hain aur kai baar class band karni padti hai.\n"
                "AI: 45 classroom renovation tender issue hua hai aur ₹9 crore allocate ho chuka hai.\n"
                "AI: saath hi smart board ki pilot 6 classrooms mein shuru hogi."
            ),
            extractions=[
                lx.data.Extraction(
                    extraction_class="concern",
                    extraction_text="tin ki chhat hai jo har baarish mein tapakti hai",
                    attributes={"type": "infrastructure decay", "problem": "leaking roof", "frequency": "every rain"}
                ),
                lx.data.Extraction(
                    extraction_class="concern",
                    extraction_text="bacche bheegte hain",
                    attributes={"type": "student discomfort", "impact": "health risk", "age_group": "school children"}
                ),
                lx.data.Extraction(
                    extraction_class="concern",
                    extraction_text="class band karni padti hai",
                    attributes={"type": "instruction disruption", "effect": "lost learning time"}
                ),
                lx.data.Extraction(
                    extraction_class="action_item",
                    extraction_text="45 classroom renovation tender issue hua hai",
                    attributes={"type": "renovation", "count": 45, "budget": "₹9 crore"}
                ),
                lx.data.Extraction(
                    extraction_class="action_item",
                    extraction_text="smart board ki pilot 6 classrooms mein shuru hogi",
                    attributes={"type": "technology pilot", "count": 6, "equipment": "smart board"}
                )
            ]
        ),
        # ROADS + TRANSPORT
        lx.data.ExampleData(
            text=(
                "USER: mukhya sadak par itne gaddhe hain ki ambulance bhi phas jaati hai.\n"
                "USER: pichle saal bhi shikayat ki thi koi aaya hi nahi.\n"
                "AI: is mahine drone survey pura ho jaayega aur 32 km stretch ka resurfacing order ho chuka hai.\n"
                "USER: log naraaz hain ab."
            ),
            extractions=[
                lx.data.Extraction(
                    extraction_class="concern",
                    extraction_text="mukhya sadak par itne gaddhe hain",
                    attributes={"type": "road potholes", "severity": "high", "impact": "vehicle delay"}
                ),
                lx.data.Extraction(
                    extraction_class="concern",
                    extraction_text="ambulance bhi phas jaati hai",
                    attributes={"type": "emergency obstruction", "service": "ambulance", "risk": "health"}
                ),
                lx.data.Extraction(
                    extraction_class="concern",
                    extraction_text="pichle saal bhi shikayat ki thi koi aaya hi nahi",
                    attributes={"type": "unaddressed complaint", "duration": "1 year", "response": "none"}
                ),
                lx.data.Extraction(
                    extraction_class="action_item",
                    extraction_text="drone survey pura ho jaayega",
                    attributes={"type": "survey", "method": "drone", "timeline": "this month"}
                ),
                lx.data.Extraction(
                    extraction_class="action_item",
                    extraction_text="32 km stretch ka resurfacing order ho chuka hai",
                    attributes={"type": "road resurfacing", "length": "32 km", "status": "ordered"}
                ),
                lx.data.Extraction(
                    extraction_class="emotion",
                    extraction_text="log naraaz hain",
                    attributes={"feeling": "anger", "intensity": "medium"}
                )
            ]
        ),
        # WATER + DRINKING SUPPLY
        lx.data.ExampleData(
            text=(
                "USER: peene ke paani mein badbu aati hai aur peela rang hota hai.\n"
                "USER: bacchon ko pet dard ki shikayat badh gayi hai.\n"
                "AI: hum teen naye filtration unit laga rahe hain aur purane pipe 5 km tak badalenge.\n"
                "AI: Water quality weekly testing bhi shuru hogi."
            ),
            extractions=[
                lx.data.Extraction(
                    extraction_class="concern",
                    extraction_text="peene ke paani mein badbu aati hai",
                    attributes={"type": "water contamination", "symptom": "odor", "use": "drinking"}
                ),
                lx.data.Extraction(
                    extraction_class="concern",
                    extraction_text="peela rang hota hai",
                    attributes={"type": "water discoloration", "color": "yellow", "indicator": "possible iron"}
                ),
                lx.data.Extraction(
                    extraction_class="concern",
                    extraction_text="bacchon ko pet dard ki shikayat badh gayi hai",
                    attributes={"type": "health issue", "group": "children", "symptom": "stomach pain"}
                ),
                lx.data.Extraction(
                    extraction_class="action_item",
                    extraction_text="teen naye filtration unit laga rahe hain",
                    attributes={"type": "infrastructure install", "count": 3, "purpose": "filtration"}
                ),
                lx.data.Extraction(
                    extraction_class="action_item",
                    extraction_text="purane pipe 5 km tak badalenge",
                    attributes={"type": "pipe replacement", "length": "5 km", "status": "planned"}
                ),
                lx.data.Extraction(
                    extraction_class="action_item",
                    extraction_text="Water quality weekly testing bhi shuru hogi",
                    attributes={"type": "monitoring", "frequency": "weekly", "target": "water quality"}
                )
            ]
        ),
        # CORRUPTION + ADMIN
        lx.data.ExampleData(
            text=(
                "USER: ration card update karaane ke liye babu ne 500 rupaye maange.\n"
                "USER: bina paise ke file aage badhti hi nahi.\n"
                "AI: hum ek helpline launch kar rahe hain aur sabhi aavedan online track honge.\n"
                "AI: Corruption complaints ko 72 ghante mein prathamik jaanch hogi."
            ),
            extractions=[
                lx.data.Extraction(
                    extraction_class="concern",
                    extraction_text="ration card update karaane ke liye babu ne 500 rupaye maange",
                    attributes={"type": "bribe demand", "amount": "500", "currency": "INR"}
                ),
                lx.data.Extraction(
                    extraction_class="concern",
                    extraction_text="bina paise ke file aage badhti hi nahi",
                    attributes={"type": "process blockage", "cause": "bribe refusal", "impact": "delay"}
                ),
                lx.data.Extraction(
                    extraction_class="action_item",
                    extraction_text="ek helpline launch kar rahe hain",
                    attributes={"type": "grievance mechanism", "channel": "helpline", "status": "launching"}
                ),
                lx.data.Extraction(
                    extraction_class="action_item",
                    extraction_text="aavedan online track honge",
                    attributes={"type": "process digitization", "benefit": "transparency", "scope": "all applications"}
                ),
                lx.data.Extraction(
                    extraction_class="action_item",
                    extraction_text="Corruption complaints ko 72 ghante mein prathamik jaanch hogi",
                    attributes={"type": "investigation SLA", "sla_hours": 72, "category": "corruption"}
                )
            ]
        ),
        # INSURANCE + COMPENSATION
        lx.data.ExampleData(
            text=(
                "USER: fasal bima ka claim daale cheh mahine ho gaye koi status nahi.\n"
                "USER: toofan mein pura chana gir gaya tha.\n"
                "AI: 11,200 lambit claim hum is mahine ke ant tak settle karenge aur SMS alert enable honge.\n"
                "USER: ab vishwas hi nahi raha system par."
            ),
            extractions=[
                lx.data.Extraction(
                    extraction_class="concern",
                    extraction_text="fasal bima ka claim daale cheh mahine ho gaye koi status nahi",
                    attributes={"type": "insurance delay", "duration": "6 months", "status": "no update"}
                ),
                lx.data.Extraction(
                    extraction_class="concern",
                    extraction_text="toofan mein pura chana gir gaya tha",
                    attributes={"type": "storm damage", "crop": "chana", "loss_extent": "total"}
                ),
                lx.data.Extraction(
                    extraction_class="action_item",
                    extraction_text="11,200 lambit claim hum is mahine ke ant tak settle karenge",
                    attributes={"type": "claim settlement", "count": 11200, "timeline": "month end"}
                ),
                lx.data.Extraction(
                    extraction_class="action_item",
                    extraction_text="SMS alert enable honge",
                    attributes={"type": "status notification", "channel": "SMS", "benefit": "transparency"}
                ),
                lx.data.Extraction(
                    extraction_class="emotion",
                    extraction_text="vishwas hi nahi raha",
                    attributes={"feeling": "loss of trust", "intensity": "high"}
                )
            ]
        ),
        # FERTILIZER SHORTAGE
        lx.data.ExampleData(
            text=(
                "USER: khaad lene subah chaar baje line mein lagte hain phir bhi do bori se zyada nahi dete.\n"
                "USER: black mein log mehnga bech rahe hain.\n"
                "AI: agle hafte 600 ton atirikt urea unload hoga aur biometric vitaran laagu hoga.\n"
                "USER: kisan bahut pareshan hain abhi."
            ),
            extractions=[
                lx.data.Extraction(
                    extraction_class="concern",
                    extraction_text="subah chaar baje line mein lagte hain",
                    attributes={"type": "long queues", "time": "4 AM", "resource": "fertilizer"}
                ),
                lx.data.Extraction(
                    extraction_class="concern",
                    extraction_text="do bori se zyada nahi dete",
                    attributes={"type": "quota restriction", "quantity_limit": "2 bags"}
                ),
                lx.data.Extraction(
                    extraction_class="concern",
                    extraction_text="black mein log mehnga bech rahe hain",
                    attributes={"type": "black market", "pricing": "inflated", "commodity": "fertilizer"}
                ),
                lx.data.Extraction(
                    extraction_class="action_item",
                    extraction_text="600 ton atirikt urea unload hoga",
                    attributes={"type": "supply augmentation", "amount": "600 ton", "timeline": "next week"}
                ),
                lx.data.Extraction(
                    extraction_class="action_item",
                    extraction_text="biometric vitaran laagu hoga",
                    attributes={"type": "distribution control", "method": "biometric", "goal": "leakage prevention"}
                ),
                lx.data.Extraction(
                    extraction_class="emotion",
                    extraction_text="kisan bahut pareshan hain",
                    attributes={"feeling": "distress", "group": "farmers", "intensity": "high"}
                )
            ]
        ),
    ]

    # Run LangExtract analysis
    result = lx.extract(
        text_or_documents=full_transcript,
        prompt_description=prompt,
        examples=examples,
        model_id="gemini-2.5-flash-lite",
        
        # extraction_passes=2,
        # max_workers=4,
        # max_char_buffer=800
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
    # Save the results to a JSONL file in a known absolute path
    output_jsonl_path = os.path.abspath("extraction_results.jsonl")
    lx.io.save_annotated_documents([result], output_name=output_jsonl_path)

    # Generate the interactive visualization from the saved file
    visualization_html = lx.visualize(output_jsonl_path)

    # Save visualization HTML
    output_html_path = os.path.abspath("visualization.html")
    with open(output_html_path, "w", encoding="utf-8") as f:
        f.write(visualization_html)
    
    # Prepare the result
    analysis_result = {
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
    
    # Save to cache before returning
    save_to_cache(cache_key, analysis_result)
    
    return analysis_result