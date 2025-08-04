# app.py
from flask import Flask, jsonify
from s3_downloader import download_logs
from parser import parse_all_logs, get_last_n_conversations
from dashboard import get_dashboard_with_latest_convo, get_top_concerns
from flask_cors import CORS 
import os

app = Flask(__name__)

CORS(app)
CORS(app, resources={r"/*": {"origins": ["https://live-call-insight.vercel.app/"]}})

# api endpoints

@app.route('/logs', methods=['GET'])
def get_logs():
    download_logs()           # Step 1: fetch from S3
    parse_all_logs()          # Step 2: process into convoJson
    recent = get_last_n_conversations(10)  # Step 3: get last 10 summaries + snippets
    return jsonify(recent)

@app.route('/dashboard_with_convo', methods=['GET'])
def dashboard_and_transcript():
    return jsonify(get_dashboard_with_latest_convo())

@app.route('/top_concerns', methods=['GET'])
def top_concerns():
    return jsonify(get_top_concerns())


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))  # Render sets PORT env var
    app.run(host="0.0.0.0", port=port, debug=True)
