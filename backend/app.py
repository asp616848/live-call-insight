# app.py
from flask import Flask, jsonify, request
from routes.s3_downloader import download_logs
from routes.parser import parse_all_logs, get_last_n_conversations
from routes.dashboard import get_dashboard_with_latest_convo, get_top_concerns
from analysis import analyze_conversation_with_langextract
import os
from flask_cors import CORS 

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})  # This will enable CORS for all routes

# api endpoints

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


if __name__ == '__main__':
    app.run(debug=True)
