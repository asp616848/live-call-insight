import subprocess
import os

def download_logs():
    os.makedirs("processed_logs", exist_ok=True)
    try:
        result = subprocess.run([
            "aws", "s3", "cp",
            "s3://call-transcripts-01/transcripts/",
            "./processed_logs/",
            "--recursive", "--no-sign-request"
        ], capture_output=True, text=True, timeout=30)
        
        if result.returncode == 0:
            print("Successfully downloaded logs from S3")
        else:
            print(f"S3 download failed (but will continue with local files): {result.stderr}")
    except subprocess.TimeoutExpired:
        print("S3 download timed out (but will continue with local files)")
    except FileNotFoundError:
        print("AWS CLI not found (but will continue with local files)")
    except Exception as e:
        print(f"S3 download error (but will continue with local files): {e}")
