import subprocess
import time
import os

CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
OUT_DIR = "/Users/premkumar/.gemini/antigravity/scratch/powerpulse-ai/docs/screenshots"

PAGES = [
    ("01_landing_page.png", "http://localhost:5173/"),
    ("02_login_page.png", "http://localhost:5173/login"),
    ("03_register_page.png", "http://localhost:5173/register"),
    ("04_dashboard.png", "http://localhost:5173/dashboard?demo=1"),
    ("05_consumption_analytics.png", "http://localhost:5173/analytics?demo=1"),
    ("06_anomaly_detection.png", "http://localhost:5173/anomalies?demo=1"),
    ("07_ai_forecasting.png", "http://localhost:5173/forecasting?demo=1"),
    ("08_usage_patterns.png", "http://localhost:5173/patterns?demo=1"),
    ("09_electricity_billing.png", "http://localhost:5173/billing?demo=1"),
    ("10_recommendations.png", "http://localhost:5173/recommendations?demo=1"),
    ("11_dataset_management.png", "http://localhost:5173/datasets?demo=1"),
    ("12_settings.png", "http://localhost:5173/settings?demo=1"),
]

for filename, url in PAGES:
    out_path = os.path.join(OUT_DIR, filename)
    cmd = [
        CHROME,
        "--headless",
        "--disable-gpu",
        "--user-data-dir=/tmp/pp_chrome_profile",
        "--virtual-time-budget=4000",
        f"--screenshot={out_path}",
        "--window-size=1280,850",
        url
    ]
    print(f"Capturing {filename} from {url}...")
    res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if os.path.exists(out_path):
        print(f"  -> SUCCESS: {filename} ({os.path.getsize(out_path)} bytes)")
    else:
        print(f"  -> FAILED: {filename}")

print("\nAll screenshot tasks complete!")
