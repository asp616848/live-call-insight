import subprocess
import os

def download_logs():
    os.makedirs("processed_logs", exist_ok=True)
    subprocess.run([
        "aws", "s3", "cp",
        "s3://call-transcripts-01/transcripts/",
        "./processed_logs/",
        "--recursive", "--no-sign-request"
    ])
