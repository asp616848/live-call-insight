# app.py
from flask import Flask, jsonify, request
from flask_cors import CORS
import os
import json
from datetime import datetime

from routes.s3_downloader import download_logs
from routes.parser import parse_all_logs, get_last_n_conversations
from routes.dashboard import get_dashboard_with_latest_convo, get_top_concerns
from analysis import analyze_conversation_with_langextract, clean_cache, list_cache_entries
from routes.district_stats import bp_district_stats
from routes.sentiment_flow import get_sentiment_flow

app = Flask(__name__)

# Configure CORS with flask_cors extension. This is the preferred way.
CORS(app, resources={
    r"/*": {
        "origins": "*",  # Allow all origins
        "allow_headers": ["Content-Type", "Authorization", "ngrok-skip-browser-warning", "Accept"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "supports_credentials": True
    }
})

app.register_blueprint(bp_district_stats)

# Generate state-level aggregated data from district data
def generate_state_stats():
    data_path = os.path.join(os.path.dirname(__file__), 'district_stats.json')
    
    try:
        with open(data_path, 'r') as f:
            district_data = json.load(f)
        
        state_stats = {}
        
        for state_name, districts in district_data.items():
            if isinstance(districts, dict) and districts:
                # Calculate total calls for the state
                total_calls = sum(district.get('calls', 0) for district in districts.values())
                
                # Aggregate all concerns across districts
                all_concerns = []
                for district in districts.values():
                    if 'top_concerns' in district:
                        all_concerns.extend(district['top_concerns'])
                
                # Count concern frequency and get top concerns
                concern_counts = {}
                for concern in all_concerns:
                    concern_counts[concern] = concern_counts.get(concern, 0) + 1
                
                # Get top 5 most common concerns
                top_concerns = sorted(concern_counts.items(), key=lambda x: x[1], reverse=True)[:5]
                top_concerns = [concern for concern, count in top_concerns]
                
                state_stats[state_name] = {
                    'calls': total_calls,
                    'top_concerns': top_concerns
                }
        
        return state_stats
    
    except (FileNotFoundError, json.JSONDecodeError) as e:
        print(f"Error generating state stats: {e}")
        return {}

# api endpoints

@app.route('/state_stats', methods=['GET'])
def get_state_stats():
    """Get aggregated state-level statistics"""
    state_stats = generate_state_stats()
    return jsonify({"states": state_stats})

@app.route('/logs', methods=['GET'])
def get_logs():
    download_logs()           # Step 1: fetch from S3
    parse_all_logs()          # Step 2: process into convoJson
    recent = get_last_n_conversations(10)  # Step 3: get last 10 summaries + snippets
    return jsonify(recent)

@app.route('/dashboard_with_convo', methods=['GET'])
def dashboard_and_transcript():
    download_logs()          # incase it ain't cached
    parse_all_logs()         
    return jsonify(get_dashboard_with_latest_convo())

@app.route('/top_concerns', methods=['GET'])
def top_concerns():
    return jsonify(get_top_concerns())

@app.route('/list_transcripts', methods=['GET'])
def list_transcripts():
    logs_dir = os.path.join(os.path.dirname(__file__), "convoJson")
    try:
        files = [f for f in os.listdir(logs_dir) if f.endswith('.json')]
        return jsonify(sorted(files, reverse=True))
    except FileNotFoundError:
        return jsonify({"error": "convoJson directory not found."}), 404


@app.route('/analyze/<filename>', methods=['GET'])
def analyze_transcript(filename):
    logs_dir = os.path.join(os.path.dirname(__file__), "convoJson")
    filepath = os.path.join(logs_dir, filename)

    if not os.path.exists(filepath):
        return jsonify({"error": "File not found."}), 404

    analysis_result = analyze_conversation_with_langextract(filepath)
    if "error" in analysis_result:
        return jsonify(analysis_result), 500
        
    return jsonify(analysis_result)

@app.route('/update-last-seen', methods=['POST'])
def update_last_seen():
    data = request.get_json()
    email = data.get('email')
    if not email:
        return jsonify({"error": "Email is required"}), 400

    last_seen_path = os.path.join(os.path.dirname(__file__), '..', 'public', 'last-seen.json')
    
    try:
        with open(last_seen_path, 'r+') as f:
            try:
                last_seen_data = json.load(f)
            except json.JSONDecodeError:
                last_seen_data = {}
            
            last_seen_data[email] = datetime.now().isoformat()
            
            f.seek(0)
            json.dump(last_seen_data, f, indent=2)
            f.truncate()

        return jsonify({"success": True}), 200
    except FileNotFoundError:
        return jsonify({"error": "last-seen.json not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/cache/status', methods=['GET'])
def cache_status():
    """Get cache status and list of cached entries"""
    try:
        cache_entries = list_cache_entries()
        cache_dir = os.path.join(os.path.dirname(__file__), "langextract_cache")
        cache_size = 0
        
        # Calculate total cache size
        for entry in cache_entries:
            entry_path = os.path.join(cache_dir, entry)
            for root, dirs, files in os.walk(entry_path):
                for file in files:
                    file_path = os.path.join(root, file)
                    if os.path.exists(file_path):
                        cache_size += os.path.getsize(file_path)
        
        return jsonify({
            "cache_entries": len(cache_entries),
            "cache_size_mb": round(cache_size / (1024 * 1024), 2),
            "entries": cache_entries
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/cache/clean', methods=['POST'])
def clean_cache_endpoint():
    """Clean old cache entries"""
    try:
        data = request.get_json() or {}
        max_age_days = data.get('max_age_days', 7)
        clean_cache(max_age_days)
        return jsonify({"success": True, "message": f"Cache cleaned for entries older than {max_age_days} days"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/sentiment_flow/<filename>', methods=['GET'])
def sentiment_flow(filename):
    """Return per-sentence sentiment scores for user and AI sentences (0-10)."""
    return jsonify(get_sentiment_flow(filename))


if __name__ == '__main__':
    app.run(debug=True, port=5000)
