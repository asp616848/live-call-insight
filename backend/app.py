# app.py
from flask import Flask, jsonify
from s3_downloader import download_logs
from parser import parse_all_logs
from dashboard import get_dashboard_with_latest_convo

app = Flask(__name__)

@app.route('/logs', methods=['GET'])
def get_logs():
    # Step 1: Download all logs
    download_logs()

    # Step 2: Parse all logs into JSON
    logs_json = parse_all_logs()

    # Step 3: Return to frontend
    return jsonify(logs_json)

@app.route('/dashboard_with_convo', methods=['GET'])
def dashboard_and_transcript():
    return jsonify(get_dashboard_with_latest_convo())


if __name__ == '__main__':
    app.run(debug=True)
