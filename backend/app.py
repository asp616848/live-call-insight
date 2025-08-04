# app.py
from flask import Flask, jsonify
from s3_downloader import download_logs
from parser import parse_all_logs, get_last_n_conversations
from dashboard import get_dashboard_with_latest_convo

app = Flask(__name__)


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


if __name__ == '__main__':
    app.run(debug=True)
