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

    # Expanded and diversified examples for stronger guidance
    examples = [
        # ORIGINAL SHORT EXAMPLE (kept)
        lx.data.ExampleData(
            text=(
                "USER: सबसे बड़ी प्रॉब्लम तो यह है कि खेती करते हुए किसान का लोन जो है वह माफ ही नहीं होता \n"
                "USER: बहाज इतना हाई है कि हम चुका ही नहीं पाते\n"
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
        ),
        # LONG AGRICULTURE + IRRIGATION
        lx.data.ExampleData(
            text=(
                "USER: पिछले तीन साल से नहर में पानी ही नहीं आया, फसल बार-बार सूख जाती है।\n"
                "USER: बोरवेल का खर्च उठा नहीं पाते, डीज़ल इतना महँगा है।\n"
                "AI: इस सीज़न 18 नई माइक्रो-इरिगेशन स्कीम sanction हुई हैं जिनमें ₹75 crore allocate हुआ है।\n"
                "AI: साथ ही solar pump subsidy 60% तक बढ़ाई जाएगी।\n"
                "USER: हम लोग तो बिलकुल हताश हो गए हैं।"
            ),
            extractions=[
                lx.data.Extraction(
                    extraction_class="concern",
                    extraction_text="नहर में पानी ही नहीं आया",
                    attributes={"type": "irrigation failure", "duration": "3 years", "impact": "crop loss"}
                ),
                lx.data.Extraction(
                    extraction_class="concern",
                    extraction_text="फसल बार-बार सूख जाती है",
                    attributes={"type": "crop damage", "frequency": "repeated", "severity": "high"}
                ),
                lx.data.Extraction(
                    extraction_class="concern",
                    extraction_text="बोरवेल का खर्च उठा नहीं पाते",
                    attributes={"type": "input affordability", "resource": "borewell", "cause": "high cost"}
                ),
                lx.data.Extraction(
                    extraction_class="concern",
                    extraction_text="डीज़ल इतना महँगा है",
                    attributes={"type": "fuel cost", "currency_context": "INR", "effect": "irrigation limitation"}
                ),
                lx.data.Extraction(
                    extraction_class="action_item",
                    extraction_text="18 नई माइक्रो-इरिगेशन स्कीम sanction हुई हैं",
                    attributes={"type": "irrigation scheme", "count": 18, "funding": "₹75 crore"}
                ),
                lx.data.Extraction(
                    extraction_class="action_item",
                    extraction_text="solar pump subsidy 60% तक बढ़ाई जाएगी",
                    attributes={"type": "subsidy", "rate": "60%", "beneficiary": "farmers"}
                ),
                lx.data.Extraction(
                    extraction_class="emotion",
                    extraction_text="हम लोग तो बिलकुल हताश हो गए हैं",
                    attributes={"feeling": "hopelessness", "intensity": "high"}
                )
            ]
        ),
        # HEALTH + ACCESS
        lx.data.ExampleData(
            text=(
                "USER: हमारे गांव के प्राथमिक स्वास्थ्य केंद्र में डॉक्टर हफ्तों नहीं आता।\n"
                "USER: दवाइयाँ भी ज़्यादातर आउट ऑफ स्टॉक रहती हैं।\n"
                "AI: अगले quarter में 12 नए डॉक्टर पोस्ट होंगे और essential medicines का buffer stock 3x किया जाएगा।\n"
                "USER: लोग डरते हैं कि emergency में कौन मदद करेगा।"
            ),
            extractions=[
                lx.data.Extraction(
                    extraction_class="concern",
                    extraction_text="डॉक्टर हफ्तों नहीं आता",
                    attributes={"type": "staff absenteeism", "facility": "primary health center", "frequency": "weeks"}
                ),
                lx.data.Extraction(
                    extraction_class="concern",
                    extraction_text="दवाइयाँ भी ज़्यादातर आउट ऑफ स्टॉक रहती हैं",
                    attributes={"type": "medicine shortage", "availability": "low", "impact": "treatment delay"}
                ),
                lx.data.Extraction(
                    extraction_class="action_item",
                    extraction_text="12 नए डॉक्टर पोस्ट होंगे",
                    attributes={"type": "staff deployment", "count": 12, "timeline": "next quarter"}
                ),
                lx.data.Extraction(
                    extraction_class="action_item",
                    extraction_text="buffer stock 3x किया जाएगा",
                    attributes={"type": "inventory increase", "multiplier": "3x", "category": "essential medicines"}
                ),
                lx.data.Extraction(
                    extraction_class="emotion",
                    extraction_text="लोग डरते हैं",
                    attributes={"feeling": "fear", "context": "medical emergency"}
                )
            ]
        ),
        # EDUCATION + INFRASTRUCTURE
        lx.data.ExampleData(
            text=(
                "USER: स्कूल में अभी भी टीन की छत है जो हर बारिश में टपकती है।\n"
                "USER: बच्चे भीगते हैं और कई बार क्लास बंद करनी पड़ती है।\n"
                "AI: 45 classroom renovation tender issue हुआ है और ₹9 crore allocate हो चुका है।\n"
                "AI: साथ ही स्मार्ट बोर्ड की pilot 6 classrooms में शुरू होगी।"
            ),
            extractions=[
                lx.data.Extraction(
                    extraction_class="concern",
                    extraction_text="टीन की छत है जो हर बारिश में टपकती है",
                    attributes={"type": "infrastructure decay", "problem": "leaking roof", "frequency": "every rain"}
                ),
                lx.data.Extraction(
                    extraction_class="concern",
                    extraction_text="बच्चे भीगते हैं",
                    attributes={"type": "student discomfort", "impact": "health risk", "age_group": "school children"}
                ),
                lx.data.Extraction(
                    extraction_class="concern",
                    extraction_text="क्लास बंद करनी पड़ती है",
                    attributes={"type": "instruction disruption", "effect": "lost learning time"}
                ),
                lx.data.Extraction(
                    extraction_class="action_item",
                    extraction_text="45 classroom renovation tender issue हुआ है",
                    attributes={"type": "renovation", "count": 45, "budget": "₹9 crore"}
                ),
                lx.data.Extraction(
                    extraction_class="action_item",
                    extraction_text="स्मार्ट बोर्ड की pilot 6 classrooms में शुरू होगी",
                    attributes={"type": "technology pilot", "count": 6, "equipment": "smart board"}
                )
            ]
        ),
        # ROADS + TRANSPORT
        lx.data.ExampleData(
            text=(
                "USER: मुख्य सड़क पर इतने गड्ढे हैं कि एम्बुलेंस भी फँस जाती है।\n"
                "USER: पिछले साल भी शिकायत की थी कोई आया ही नहीं।\n"
                "AI: इस महीने ड्रोन सर्वे पूरा हो जाएगा और 32 km stretch का रेसर्फेसिंग order हो चुका है।\n"
                "USER: लोग नाराज़ हैं अब।"
            ),
            extractions=[
                lx.data.Extraction(
                    extraction_class="concern",
                    extraction_text="मुख्य सड़क पर इतने गड्ढे हैं",
                    attributes={"type": "road potholes", "severity": "high", "impact": "vehicle delay"}
                ),
                lx.data.Extraction(
                    extraction_class="concern",
                    extraction_text="एम्बुलेंस भी फँस जाती है",
                    attributes={"type": "emergency obstruction", "service": "ambulance", "risk": "health"}
                ),
                lx.data.Extraction(
                    extraction_class="concern",
                    extraction_text="पिछले साल भी शिकायत की थी कोई आया ही नहीं",
                    attributes={"type": "unaddressed complaint", "duration": "1 year", "response": "none"}
                ),
                lx.data.Extraction(
                    extraction_class="action_item",
                    extraction_text="ड्रोन सर्वे पूरा हो जाएगा",
                    attributes={"type": "survey", "method": "drone", "timeline": "this month"}
                ),
                lx.data.Extraction(
                    extraction_class="action_item",
                    extraction_text="32 km stretch का रेसर्फेसिंग order हो चुका है",
                    attributes={"type": "road resurfacing", "length": "32 km", "status": "ordered"}
                ),
                lx.data.Extraction(
                    extraction_class="emotion",
                    extraction_text="लोग नाराज़ हैं",
                    attributes={"feeling": "anger", "intensity": "medium"}
                )
            ]
        ),
        # WATER + DRINKING SUPPLY
        lx.data.ExampleData(
            text=(
                "USER: पीने के पानी में बदबू आती है और पीला रंग होता है।\n"
                "USER: बच्चों को पेट दर्द की शिकायत बढ़ गई है।\n"
                "AI: हम तीन नए filtration unit लगा रहे हैं और पुराने पाइप 5 km तक बदलेंगे।\n"
                "AI: Water quality weekly testing भी शुरू होगी।"
            ),
            extractions=[
                lx.data.Extraction(
                    extraction_class="concern",
                    extraction_text="पीने के पानी में बदबू आती है",
                    attributes={"type": "water contamination", "symptom": "odor", "use": "drinking"}
                ),
                lx.data.Extraction(
                    extraction_class="concern",
                    extraction_text="पीला रंग होता है",
                    attributes={"type": "water discoloration", "color": "yellow", "indicator": "possible iron"}
                ),
                lx.data.Extraction(
                    extraction_class="concern",
                    extraction_text="बच्चों को पेट दर्द की शिकायत बढ़ गई है",
                    attributes={"type": "health issue", "group": "children", "symptom": "stomach pain"}
                ),
                lx.data.Extraction(
                    extraction_class="action_item",
                    extraction_text="तीन नए filtration unit लगा रहे हैं",
                    attributes={"type": "infrastructure install", "count": 3, "purpose": "filtration"}
                ),
                lx.data.Extraction(
                    extraction_class="action_item",
                    extraction_text="पुराने पाइप 5 km तक बदलेंगे",
                    attributes={"type": "pipe replacement", "length": "5 km", "status": "planned"}
                ),
                lx.data.Extraction(
                    extraction_class="action_item",
                    extraction_text="Water quality weekly testing भी शुरू होगी",
                    attributes={"type": "monitoring", "frequency": "weekly", "target": "water quality"}
                )
            ]
        ),
        # CORRUPTION + ADMIN
        lx.data.ExampleData(
            text=(
                "USER: राशन कार्ड अपडेट कराने के लिए बाबू ने 500 रुपये मांगे।\n"
                "USER: बिना पैसे के फाइल आगे बढ़ती ही नहीं।\n"
                "AI: हम एक हेल्पलाइन लाँच कर रहे हैं और सभी आवेदन ऑनलाइन ट्रैक होंगे।\n"
                "AI: Corruption complaints को 72 घंटे में प्राथमिक जाँच होगी।"
            ),
            extractions=[
                lx.data.Extraction(
                    extraction_class="concern",
                    extraction_text="राशन कार्ड अपडेट कराने के लिए बाबू ने 500 रुपये मांगे",
                    attributes={"type": "bribe demand", "amount": "500", "currency": "INR"}
                ),
                lx.data.Extraction(
                    extraction_class="concern",
                    extraction_text="बिना पैसे के फाइल आगे बढ़ती ही नहीं",
                    attributes={"type": "process blockage", "cause": "bribe refusal", "impact": "delay"}
                ),
                lx.data.Extraction(
                    extraction_class="action_item",
                    extraction_text="एक हेल्पलाइन लाँच कर रहे हैं",
                    attributes={"type": "grievance mechanism", "channel": "helpline", "status": "launching"}
                ),
                lx.data.Extraction(
                    extraction_class="action_item",
                    extraction_text="आवेदन ऑनलाइन ट्रैक होंगे",
                    attributes={"type": "process digitization", "benefit": "transparency", "scope": "all applications"}
                ),
                lx.data.Extraction(
                    extraction_class="action_item",
                    extraction_text="Corruption complaints को 72 घंटे में प्राथमिक जाँच होगी",
                    attributes={"type": "investigation SLA", "sla_hours": 72, "category": "corruption"}
                )
            ]
        ),
        # INSURANCE + COMPENSATION
        lx.data.ExampleData(
            text=(
                "USER: फसल बीमा का क्लेम डाले छह महीने हो गए कोई स्टेटस नहीं।\n"
                "USER: तूफान में पूरा चना गिर गया था।\n"
                "AI: 11,200 लंबित क्लेम हम इस महीने के अंत तक सेटल करेंगे और SMS अलर्ट enable होंगे।\n"
                "USER: अब विश्वास ही नहीं रहा सिस्टम पर।"
            ),
            extractions=[
                lx.data.Extraction(
                    extraction_class="concern",
                    extraction_text="फसल बीमा का क्लेम डाले छह महीने हो गए कोई स्टेटस नहीं",
                    attributes={"type": "insurance delay", "duration": "6 months", "status": "no update"}
                ),
                lx.data.Extraction(
                    extraction_class="concern",
                    extraction_text="तूफान में पूरा चना गिर गया था",
                    attributes={"type": "storm damage", "crop": "चना", "loss_extent": "total"}
                ),
                lx.data.Extraction(
                    extraction_class="action_item",
                    extraction_text="11,200 लंबित क्लेम हम इस महीने के अंत तक सेटल करेंगे",
                    attributes={"type": "claim settlement", "count": 11200, "timeline": "month end"}
                ),
                lx.data.Extraction(
                    extraction_class="action_item",
                    extraction_text="SMS अलर्ट enable होंगे",
                    attributes={"type": "status notification", "channel": "SMS", "benefit": "transparency"}
                ),
                lx.data.Extraction(
                    extraction_class="emotion",
                    extraction_text="विश्वास ही नहीं रहा",
                    attributes={"feeling": "loss of trust", "intensity": "high"}
                )
            ]
        ),
        # FERTILIZER SHORTAGE
        lx.data.ExampleData(
            text=(
                "USER: खाद लेने सुबह चार बजे लाइन में लगते हैं फिर भी दो बोरी से ज्यादा नहीं देते।\n"
                "USER: ब्लैक में लोग महँगा बेच रहे हैं।\n"
                "AI: अगले हफ्ते 600 टन अतिरिक्त urea unload होगा और biometric वितरण लागू होगा।\n"
                "USER: किसान बहुत परेशान हैं अभी।"
            ),
            extractions=[
                lx.data.Extraction(
                    extraction_class="concern",
                    extraction_text="सुबह चार बजे लाइन में लगते हैं",
                    attributes={"type": "long queues", "time": "4 AM", "resource": "fertilizer"}
                ),
                lx.data.Extraction(
                    extraction_class="concern",
                    extraction_text="दो बोरी से ज्यादा नहीं देते",
                    attributes={"type": "quota restriction", "quantity_limit": "2 bags"}
                ),
                lx.data.Extraction(
                    extraction_class="concern",
                    extraction_text="ब्लैक में लोग महँगा बेच रहे हैं",
                    attributes={"type": "black market", "pricing": "inflated", "commodity": "fertilizer"}
                ),
                lx.data.Extraction(
                    extraction_class="action_item",
                    extraction_text="600 टन अतिरिक्त urea unload होगा",
                    attributes={"type": "supply augmentation", "amount": "600 ton", "timeline": "next week"}
                ),
                lx.data.Extraction(
                    extraction_class="action_item",
                    extraction_text="biometric वितरण लागू होगा",
                    attributes={"type": "distribution control", "method": "biometric", "goal": "leakage prevention"}
                ),
                lx.data.Extraction(
                    extraction_class="emotion",
                    extraction_text="किसान बहुत परेशान हैं",
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