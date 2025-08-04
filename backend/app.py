# app.py
from flask import Flask, jsonify
from s3_downloader import download_logs
from parser import parse_all_logs

app = Flask(__name__)

@app.route('/logs', methods=['GET'])
def get_logs():
    # Step 1: Download all logs
    download_logs()

    # Step 2: Parse all logs into JSON
    logs_json = parse_all_logs()

    # Step 3: Return to frontend
    return jsonify(logs_json)

if __name__ == '__main__':
    app.run(debug=True)
