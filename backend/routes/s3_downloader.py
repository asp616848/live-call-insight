import subprocess
import os
from pathlib import Path

def download_logs():
    """
    Download all .txt transcripts from both public S3 prefixes into backend/processed_logs.
    After downloading, delete any transcript whose first line is exactly 'No transcript captured.'.
    Continues gracefully if downloads fail or AWS CLI is unavailable.
    """
    # Ensure we always write to backend/processed_logs regardless of working directory
    backend_dir = Path(__file__).resolve().parents[1]
    output_dir = backend_dir / "processed_logs"
    output_dir.mkdir(parents=True, exist_ok=True)

    s3_sources = [
        "s3://call-transcripts-01/transcripts/",
        "s3://call-transcripts-01/transcripts-openai/",
    ]

    any_success = False

    try:
        for src in s3_sources:
            try:
                # Copy only .txt files recursively from each prefix
                result = subprocess.run(
                    [
                        "aws",
                        "s3",
                        "cp",
                        src,
                        str(output_dir),
                        "--recursive",
                        "--no-sign-request",
                        "--exclude",
                        "*",
                        "--include",
                        "*.txt",
                    ],
                    capture_output=True,
                    text=True,
                    timeout=60,
                )

                if result.returncode == 0:
                    any_success = True
                    print(f"Successfully downloaded .txt logs from {src}")
                else:
                    print(
                        f"S3 download from {src} failed (but will continue with local files): {result.stderr}"
                    )
            except subprocess.TimeoutExpired:
                print(f"S3 download from {src} timed out (but will continue with local files)")
            except FileNotFoundError:
                # If AWS CLI is missing, no point in trying the remaining sources
                print("AWS CLI not found (but will continue with local files)")
                break
            except Exception as e:
                print(
                    f"S3 download error from {src} (but will continue with local files): {e}"
                )

        if any_success:
            print("Completed S3 downloads for available sources")
            # Post-process: remove bogus transcripts
            removed = 0
            for path in output_dir.rglob("*.txt"):
                try:
                    with path.open("r", encoding="utf-8", errors="ignore") as f:
                        first_line = f.readline().strip()
                    if first_line == "No transcript captured.":
                        path.unlink()
                        removed += 1
                except Exception as e:
                    print(f"Error checking transcript {path.name}: {e}")
            if removed:
                print(f"Removed {removed} transcript(s) with 'No transcript captured.' on first line")
    except Exception as e:
        # Catch-all to ensure the app continues with local files
        print(f"Unexpected error during S3 downloads (continuing with local files): {e}")
