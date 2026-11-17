import base64
import os
import subprocess

DOCS_DIR = "/Users/premkumar/.gemini/antigravity/scratch/powerpulse-ai/docs"
SCREENSHOTS_DIR = os.path.join(DOCS_DIR, "screenshots")
HTML_OUT = os.path.join(DOCS_DIR, "feature_exploration_guide.html")
PDF_OUT = os.path.join(DOCS_DIR, "PowerPulse_AI_Complete_Feature_Guide.pdf")
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

def get_base64_img(filename):
    path = os.path.join(SCREENSHOTS_DIR, filename)
    if not os.path.exists(path):
        print(f"Warning: {filename} does not exist!")
        return ""
    with open(path, "rb") as f:
        data = base64.b64encode(f.read()).decode("utf-8")
    return f"data:image/png;base64,{data}"

print("Encoding screenshots...")
imgs = {
    "landing": get_base64_img("01_landing_page.png"),
    "login": get_base64_img("02_login_page.png"),
    "register": get_base64_img("03_register_page.png"),
    "dashboard": get_base64_img("04_dashboard.png"),
    "analytics": get_base64_img("05_consumption_analytics.png"),
    "anomalies": get_base64_img("06_anomaly_detection.png"),
    "forecasting": get_base64_img("07_ai_forecasting.png"),
    "patterns": get_base64_img("08_usage_patterns.png"),
    "billing": get_base64_img("09_electricity_billing.png"),
    "recommendations": get_base64_img("10_recommendations.png"),
    "datasets": get_base64_img("11_dataset_management.png"),
    "settings": get_base64_img("12_settings.png"),
}

html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>PowerPulse AI – Complete Website & Feature Exploration Guide</title>
<style>
  @page {{
    size: A4 portrait;
    margin: 14mm 12mm 14mm 12mm;
    @bottom-right {{
      content: counter(page);
    }}
  }}
  * {{
    box-sizing: border-box;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }}
  body {{
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: #1e293b;
    background-color: #ffffff;
    line-height: 1.5;
    margin: 0;
    padding: 0;
    font-size: 13px;
  }}
  .page {{
    page-break-after: always;
    clear: both;
  }}
  .page:last-child {{
    page-break-after: avoid;
  }}

  /* Cover Page */
  .cover {{
    padding: 60px 40px;
    background: linear-gradient(135deg, #0b1329 0%, #1e293b 100%);
    color: #ffffff;
    border-radius: 16px;
    min-height: 900px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }}
  .cover-badge {{
    display: inline-block;
    background: rgba(37, 99, 235, 0.3);
    border: 1px solid rgba(59, 130, 246, 0.5);
    color: #60a5fa;
    padding: 6px 14px;
    border-radius: 9999px;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }}
  .cover-title {{
    font-size: 36px;
    font-weight: 800;
    line-height: 1.2;
    margin: 20px 0 10px 0;
    color: #ffffff;
  }}
  .cover-title span {{
    color: #38bdf8;
  }}
  .cover-subtitle {{
    font-size: 17px;
    color: #94a3b8;
    line-height: 1.6;
    margin-bottom: 30px;
  }}
  .cover-meta-grid {{
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 15px;
    margin-top: 40px;
    padding-top: 30px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }}
  .meta-item {{
    background: rgba(255, 255, 255, 0.05);
    padding: 12px 16px;
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.08);
  }}
  .meta-label {{
    font-size: 11px;
    color: #94a3b8;
    text-transform: uppercase;
    font-weight: 600;
  }}
  .meta-value {{
    font-size: 14px;
    font-weight: 700;
    color: #f8fafc;
    margin-top: 4px;
  }}

  /* Table of Contents */
  .toc-card {{
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 24px;
    margin-top: 20px;
  }}
  .toc-title {{
    font-size: 20px;
    font-weight: 800;
    color: #0f172a;
    margin-top: 0;
    margin-bottom: 16px;
    border-bottom: 2px solid #3b82f6;
    padding-bottom: 8px;
    display: inline-block;
  }}
  .toc-list {{
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }}
  .toc-item {{
    padding: 8px 12px;
    background: #ffffff;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
    font-size: 12px;
    display: flex;
    align-items: center;
    gap: 8px;
  }}
  .toc-number {{
    background: #2563eb;
    color: white;
    width: 22px;
    height: 22px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    font-size: 11px;
    flex-shrink: 0;
  }}

  /* Feature Sections */
  .section-header {{
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 2px solid #e2e8f0;
  }}
  .section-title {{
    font-size: 20px;
    font-weight: 800;
    color: #0f172a;
    margin: 0;
  }}
  .section-badge {{
    background: #eff6ff;
    color: #1d4ed8;
    border: 1px solid #bfdbfe;
    padding: 4px 10px;
    border-radius: 9999px;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
  }}
  .screenshot-container {{
    margin: 12px 0 16px 0;
    text-align: center;
    background: #0f172a;
    padding: 6px;
    border-radius: 12px;
    border: 1px solid #cbd5e1;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }}
  .screenshot-container img {{
    max-width: 100%;
    height: auto;
    border-radius: 8px;
    display: block;
    margin: 0 auto;
  }}
  .screenshot-caption {{
    font-size: 11px;
    color: #94a3b8;
    margin-top: 6px;
    font-style: italic;
  }}

  /* Explanation Cards */
  .desc-box {{
    background: #f8fafc;
    border-left: 4px solid #3b82f6;
    padding: 10px 14px;
    border-radius: 0 8px 8px 0;
    margin-bottom: 14px;
    font-size: 13px;
    color: #334155;
    line-height: 1.5;
  }}
  .steps-card {{
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    padding: 14px;
    margin-bottom: 12px;
  }}
  .steps-title {{
    font-size: 14px;
    font-weight: 700;
    color: #0f172a;
    margin: 0 0 10px 0;
    display: flex;
    align-items: center;
    gap: 6px;
  }}
  .step-item {{
    display: flex;
    align-items: flex-start;
    gap: 10px;
    margin-bottom: 8px;
  }}
  .step-item:last-child {{
    margin-bottom: 0;
  }}
  .step-bubble {{
    background: #e0e7ff;
    color: #3730a3;
    font-weight: 800;
    font-size: 11px;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    margin-top: 1px;
  }}
  .step-text {{
    font-size: 12.5px;
    color: #334155;
    line-height: 1.45;
  }}
  .step-text strong {{
    color: #0f172a;
  }}

  /* Grid of Technical Details */
  .details-grid {{
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-top: 10px;
  }}
  .detail-card {{
    background: #f1f5f9;
    border-radius: 8px;
    padding: 10px 12px;
    border: 1px solid #e2e8f0;
  }}
  .detail-heading {{
    font-size: 12px;
    font-weight: 700;
    color: #0f172a;
    margin-bottom: 4px;
    display: flex;
    align-items: center;
    gap: 5px;
  }}
  .detail-body {{
    font-size: 11.5px;
    color: #475569;
    line-height: 1.4;
  }}
  .tip-box {{
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
    border-radius: 8px;
    padding: 9px 12px;
    margin-top: 10px;
    font-size: 11.5px;
    color: #166534;
    display: flex;
    align-items: center;
    gap: 8px;
  }}
</style>
</head>
<body>

<!-- ==========================================
     PAGE 1: COVER & EXECUTIVE SUMMARY
=========================================== -->
<div class="page">
  <div class="cover">
    <div>
      <span class="cover-badge">Official User & Architecture Guide</span>
      <h1 class="cover-title">PowerPulse <span>AI</span></h1>
      <div style="font-size: 22px; font-weight: 600; color: #38bdf8; margin-top: -6px; margin-bottom: 12px;">
        Smart Electricity Consumption & Anomaly Detector
      </div>
      <p class="cover-subtitle">
        A comprehensive, step-by-step visual exploration manual explaining every website feature, machine learning model, user flow, and analytical capability through real high-resolution screenshots.
      </p>
    </div>

    <div>
      <div class="meta-item" style="background: rgba(30, 41, 59, 0.7); margin-bottom: 20px;">
        <div class="meta-label">Core Mission of the Platform</div>
        <div style="font-size: 13px; color: #cbd5e1; margin-top: 6px; line-height: 1.6;">
          PowerPulse AI solves residential energy waste by integrating physical power-to-energy algorithms with 3 specialized Machine Learning models: <strong>Isolation Forest</strong> for anomaly detection, <strong>Random Forest</strong> for time-series forecasting, and <strong>K-Means</strong> for usage clustering.
        </div>
      </div>

      <div class="cover-meta-grid">
        <div class="meta-item">
          <div class="meta-label">Frontend Framework</div>
          <div class="meta-value">React 18 + TypeScript + Tailwind CSS</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Backend REST API</div>
          <div class="meta-value">FastAPI + Python 3.11+ + SQLite</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Machine Learning Engine</div>
          <div class="meta-value">Scikit-Learn (Unsupervised & Regressor)</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Access & Security</div>
          <div class="meta-value">JWT Bearer + Strict Password Policy</div>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- ==========================================
     PAGE 2: TABLE OF CONTENTS & QUICK START
=========================================== -->
<div class="page">
  <div class="section-header">
    <h2 class="section-title">Table of Contents & Quick Exploration Map</h2>
    <span class="section-badge">12 Modules Covered</span>
  </div>

  <div class="desc-box">
    This manual is structured sequentially. Beginners, examiners, and evaluators can explore the application by following the exact visual path shown below. Every single screen includes real screenshots taken from the live local deployment.
  </div>

  <div class="toc-card">
    <div class="toc-title">Exploration Journey</div>
    <ul class="toc-list">
      <li class="toc-item"><span class="toc-number">1</span><strong>Public Landing Page:</strong> Hero banner & instant launch</li>
      <li class="toc-item"><span class="toc-number">2</span><strong>Sign In & Google Login:</strong> Secure credentials & 1-click access</li>
      <li class="toc-item"><span class="toc-number">3</span><strong>Account Registration:</strong> Password strength meter & OTP rules</li>
      <li class="toc-item"><span class="toc-number">4</span><strong>Main Executive Dashboard:</strong> Real-time KPIs & daily trends</li>
      <li class="toc-item"><span class="toc-number">5</span><strong>Consumption Analytics:</strong> Time-series charts & sub-metering</li>
      <li class="toc-item"><span class="toc-number">6</span><strong>AI Anomaly Detection:</strong> Isolation Forest & severity labels</li>
      <li class="toc-item"><span class="toc-number">7</span><strong>AI Time-Series Forecasting:</strong> Multi-horizon RF energy prediction</li>
      <li class="toc-item"><span class="toc-number">8</span><strong>Usage Pattern Clustering:</strong> K-Means diurnal behavior modes</li>
      <li class="toc-item"><span class="toc-number">9</span><strong>Electricity Bill Calculator:</strong> Configurable tariff slabs & taxes</li>
      <li class="toc-item"><span class="toc-number">10</span><strong>Actionable Recommendations:</strong> AI energy savings & phantom loads</li>
      <li class="toc-item"><span class="toc-number">11</span><strong>Dataset Management:</strong> CSV uploading & data validation</li>
      <li class="toc-item"><span class="toc-number">12</span><strong>Settings & Customization:</strong> Tariff rates, currency, & themes</li>
    </ul>
  </div>

  <div class="steps-card" style="margin-top: 20px;">
    <div class="steps-title">⚡ How to Run & Access the Platform Locally in 3 Steps:</div>
    <div class="step-item">
      <div class="step-bubble">1</div>
      <div class="step-text"><strong>Start the Backend API Server:</strong> In terminal run <code>cd backend && python run.py</code>. The server initializes on <code>http://localhost:8000</code>.</div>
    </div>
    <div class="step-item">
      <div class="step-bubble">2</div>
      <div class="step-text"><strong>Start the Frontend Web App:</strong> In terminal run <code>cd frontend && npm run dev</code>. The interface opens on <code>http://localhost:5173</code>.</div>
    </div>
    <div class="step-item">
      <div class="step-bubble">3</div>
      <div class="step-text"><strong>Instant 1-Click Examiner Demo:</strong> Open <code>http://localhost:5173</code> and click the emerald <strong>"1-Click Demo"</strong> button. No setup or manual dataset upload needed!</div>
    </div>
  </div>
</div>

<!-- ==========================================
     PAGE 3: FEATURE 1 - LANDING PAGE
=========================================== -->
<div class="page">
  <div class="section-header">
    <h2 class="section-title">1. Public Landing Page</h2>
    <span class="section-badge">Route: /</span>
  </div>

  <div class="screenshot-container">
    <img src="{imgs['landing']}" alt="Landing Page Screenshot" />
    <div class="screenshot-caption">Figure 1.1: High-conversion landing page with dark theme header and instant demo access button.</div>
  </div>

  <div class="desc-box">
    <strong>What It Does:</strong> The Landing Page is the primary public entry point for visitors. It introduces the core capabilities of PowerPulse AI, provides immediate 1-click access for examiners, and offers links to sign in or create a verified account.
  </div>

  <div class="steps-card">
    <div class="steps-title">Step-by-Step User Instructions:</div>
    <div class="step-item">
      <div class="step-bubble">1</div>
      <div class="step-text">Open your web browser and navigate to <strong>http://localhost:5173</strong>.</div>
    </div>
    <div class="step-item">
      <div class="step-bubble">2</div>
      <div class="step-text">Review the platform summary, AI model breakdown, and guaranteed 100% free accessibility banner.</div>
    </div>
    <div class="step-item">
      <div class="step-bubble">3</div>
      <div class="step-text">Click the emerald <strong>"1-Click Demo"</strong> button in the top navigation bar to immediately launch into the authenticated dashboard, or click <strong>"Sign In"</strong> to use custom credentials.</div>
    </div>
  </div>

  <div class="details-grid">
    <div class="detail-card">
      <div class="detail-heading">⚡ Brand Identity & Navigation</div>
      <div class="detail-body">Features the PowerPulse logo, system title, and quick header action buttons (Sign In, Sign Up, 1-Click Demo).</div>
    </div>
    <div class="detail-card">
      <div class="detail-heading">🔒 Instant Examiner Launch</div>
      <div class="detail-body">Allows university examiners or evaluators to bypass registration and evaluate pre-seeded benchmark datasets in under 1 second.</div>
    </div>
  </div>
</div>

<!-- ==========================================
     PAGE 4: FEATURE 2 - LOGIN PAGE
=========================================== -->
<div class="page">
  <div class="section-header">
    <h2 class="section-title">2. Sign In & Google Authentication</h2>
    <span class="section-badge">Route: /login</span>
  </div>

  <div class="screenshot-container">
    <img src="{imgs['login']}" alt="Login Page Screenshot" />
    <div class="screenshot-caption">Figure 2.1: Sign In interface featuring Google Sign-In, real-time password validation, and 1-Click examiner access.</div>
  </div>

  <div class="desc-box">
    <strong>What It Does:</strong> Provides secure authentication into the user's isolated workspace. It features a dedicated <strong>Google / Gmail Sign-In</strong> button, strict password complexity checking that blocks weak passwords (like <code>123</code>), and a 1-click demo button.
  </div>

  <div class="steps-card">
    <div class="steps-title">Step-by-Step User Instructions:</div>
    <div class="step-item">
      <div class="step-bubble">1</div>
      <div class="step-text">Click <strong>"Continue with Google / Gmail"</strong> to prefill your Google account, or type your email address manually.</div>
    </div>
    <div class="step-item">
      <div class="step-bubble">2</div>
      <div class="step-text">Type your password. <strong>Important Security Note:</strong> Weak passwords like <code>123</code> are strictly blocked! The system enforces words (letters), numbers, and symbols.</div>
    </div>
    <div class="step-item">
      <div class="step-bubble">3</div>
      <div class="step-text">Observe the real-time password strength checklist turn green when all criteria are satisfied.</div>
    </div>
    <div class="step-item">
      <div class="step-bubble">4</div>
      <div class="step-text">Click <strong>"Sign In"</strong> to access the dashboard, or click <strong>"Instant 1-Click Examiner / Demo Access"</strong> for automatic sign-in.</div>
    </div>
  </div>

  <div class="details-grid">
    <div class="detail-card">
      <div class="detail-heading">🛡️ Strict Password Enforcement</div>
      <div class="detail-body">Requires minimum 8 characters, letters (a-z), digits (0-9), and special characters (!@#$). Weak entries are rejected both in the browser and on the FastAPI backend.</div>
    </div>
    <div class="detail-card">
      <div class="detail-heading">🔑 JWT Session Token</div>
      <div class="detail-body">Upon valid login, the server issues a cryptographically signed HMAC-SHA256 JWT token stored safely in local storage for authenticated API requests.</div>
    </div>
  </div>
</div>

<!-- ==========================================
     PAGE 5: FEATURE 3 - REGISTRATION PAGE
=========================================== -->
<div class="page">
  <div class="section-header">
    <h2 class="section-title">3. Verified Account Registration</h2>
    <span class="section-badge">Route: /register</span>
  </div>

  <div class="screenshot-container">
    <img src="{imgs['register']}" alt="Register Page Screenshot" />
    <div class="screenshot-caption">Figure 3.1: Account creation page with real email domain validation, Google option, and 4-tier password strength meter.</div>
  </div>

  <div class="desc-box">
    <strong>What It Does:</strong> Allows new users to create an isolated personal workspace. It features real email domain verification (rejecting disposable and fake addresses), live password security score evaluation, and automated 2FA email verification.
  </div>

  <div class="steps-card">
    <div class="steps-title">Step-by-Step User Instructions:</div>
    <div class="step-item">
      <div class="step-bubble">1</div>
      <div class="step-text">Enter your <strong>Full Name</strong> (e.g., <em>Prem Kumar</em>).</div>
    </div>
    <div class="step-item">
      <div class="step-bubble">2</div>
      <div class="step-text">Enter your <strong>Email Address</strong>. The system checks against a blocklist of disposable domains and verifies legitimate mail providers (Gmail, Outlook, Yahoo, University domains).</div>
    </div>
    <div class="step-item">
      <div class="step-bubble">3</div>
      <div class="step-text">Enter a strong password. Watch the 4 progress segments light up as you satisfy <em>8+ Characters</em>, <em>Numbers</em>, <em>Symbols</em>, and <em>Letters</em>.</div>
    </div>
    <div class="step-item">
      <div class="step-bubble">4</div>
      <div class="step-text">Click <strong>"Sign Up with Security Code"</strong>. An authentic 6-digit OTP modal appears for email verification.</div>
    </div>
  </div>

  <div class="tip-box">
    💡 <strong>Examiner Note:</strong> Each registered user receives an isolated database record with their own custom electricity tariff, bill settings, and uploaded meter files.
  </div>
</div>

<!-- ==========================================
     PAGE 6: FEATURE 4 - MAIN DASHBOARD
=========================================== -->
<div class="page">
  <div class="section-header">
    <h2 class="section-title">4. Main Executive Dashboard</h2>
    <span class="section-badge">Route: /dashboard</span>
  </div>

  <div class="screenshot-container">
    <img src="{imgs['dashboard']}" alt="Dashboard Screenshot" />
    <div class="screenshot-caption">Figure 4.1: Overview dashboard showing 6 primary KPI metric cards, 24-hour live consumption graph, and quick alert widgets.</div>
  </div>

  <div class="desc-box">
    <strong>What It Does:</strong> The Executive Dashboard acts as the central command center for energy intelligence. It synthesizes complex high-frequency smart meter readings into 6 actionable KPIs and a responsive 24-hour consumption trend chart.
  </div>

  <div class="steps-card">
    <div class="steps-title">Step-by-Step User Instructions:</div>
    <div class="step-item">
      <div class="step-bubble">1</div>
      <div class="step-text">Scan the <strong>Top KPI Cards</strong> to see: Total Energy (<code>370.38 kWh</code>), Daily Average (<code>26.46 kWh</code>), Estimated Monthly Bill (<code>₹6,376.17</code>), and Peak Draw (<code>7.60 kW</code>).</div>
    </div>
    <div class="step-item">
      <div class="step-bubble">2</div>
      <div class="step-text">Review the <strong>24-Hour Trend Chart</strong> to observe energy spikes throughout diurnal cycles.</div>
    </div>
    <div class="step-item">
      <div class="step-bubble">3</div>
      <div class="step-text">Check the <strong>Recent Anomalies Widget</strong> on the bottom left for high-priority alerts with plain-English mathematical explanations.</div>
    </div>
    <div class="step-item">
      <div class="step-bubble">4</div>
      <div class="step-text">Review the <strong>Priority Saving Recommendations</strong> on the right to see quick tips for shifting high-demand laundry or water heater loads.</div>
    </div>
  </div>

  <div class="details-grid">
    <div class="detail-card">
      <div class="detail-heading">⚡ Physical Energy Integration</div>
      <div class="detail-body">Calculates true energy via Riemann sum: <code>kWh = kW × (Δt / 3600)</code>, distinguishing instantaneous power from cumulative billing energy.</div>
    </div>
    <div class="detail-card">
      <div class="detail-heading">🚨 Anomaly Counter Badge</div>
      <div class="detail-body">Displays the exact count of abnormal consumption events identified by the Isolation Forest ensemble tree.</div>
    </div>
  </div>
</div>

<!-- ==========================================
     PAGE 7: FEATURE 5 - CONSUMPTION ANALYTICS
=========================================== -->
<div class="page">
  <div class="section-header">
    <h2 class="section-title">5. Consumption Analytics & Sub-Metering</h2>
    <span class="section-badge">Route: /analytics</span>
  </div>

  <div class="screenshot-container">
    <img src="{imgs['analytics']}" alt="Analytics Screenshot" />
    <div class="screenshot-caption">Figure 5.1: Detailed time-series analytics graph displaying aggregated active power and multi-channel sub-metering breakdown.</div>
  </div>

  <div class="desc-box">
    <strong>What It Does:</strong> Provides deep analytical visibility into when and where electricity is consumed. It allows users to toggle between different time horizons and isolate specific appliance channels: Kitchen, Laundry, and Climate Control.
  </div>

  <div class="steps-card">
    <div class="steps-title">Step-by-Step User Instructions:</div>
    <div class="step-item">
      <div class="step-bubble">1</div>
      <div class="step-text">Navigate to <strong>"Consumption Analytics"</strong> in the left sidebar menu.</div>
    </div>
    <div class="step-item">
      <div class="step-bubble">2</div>
      <div class="step-text">Use the <strong>Time Range Toggle</strong> (Hourly, Daily, Weekly) to adjust the level of aggregation.</div>
    </div>
    <div class="step-item">
      <div class="step-bubble">3</div>
      <div class="step-text">Hover over chart data points to view exact timestamps, active power (kW), and sub-metered watt-hours.</div>
    </div>
    <div class="step-item">
      <div class="step-bubble">4</div>
      <div class="step-text">Inspect the <strong>Appliance Contribution Breakdown</strong> to see what percentage of household energy is consumed by major loads.</div>
    </div>
  </div>

  <div class="details-grid">
    <div class="detail-card">
      <div class="detail-heading">🍽️ Sub-Metering 1 (Kitchen)</div>
      <div class="detail-body">Monitors kitchen appliances including dishwasher, microwave, and electric oven.</div>
    </div>
    <div class="detail-card">
      <div class="detail-heading">🧺 Sub-Metering 2 (Laundry)</div>
      <div class="detail-body">Captures washing machine, tumble dryer, and laundry room refrigeration units.</div>
    </div>
    <div class="detail-card">
      <div class="detail-heading">❄️ Sub-Metering 3 (HVAC/Geyser)</div>
      <div class="detail-body">Tracks heavy thermal loads: electric water heater (geyser) and air conditioning units.</div>
    </div>
    <div class="detail-card">
      <div class="detail-heading">📊 Load Shifting Opportunity</div>
      <div class="detail-body">Identifies peak evening overlaps where multiple high-draw appliances run simultaneously.</div>
    </div>
  </div>
</div>

<!-- ==========================================
     PAGE 8: FEATURE 6 - ANOMALY DETECTION
=========================================== -->
<div class="page">
  <div class="section-header">
    <h2 class="section-title">6. AI Anomaly Detection (Isolation Forest)</h2>
    <span class="section-badge">Route: /anomalies</span>
  </div>

  <div class="screenshot-container">
    <img src="{imgs['anomalies']}" alt="Anomaly Detection Screenshot" />
    <div class="screenshot-caption">Figure 6.1: Anomaly detection console showing flagged abnormal consumption events with severity badges and deviation percentages.</div>
  </div>

  <div class="desc-box">
    <strong>What It Does:</strong> Employs an unsupervised <strong>Isolation Forest</strong> algorithm to detect unusual energy surges, unexpected overnight baseline consumption, and irregular appliance behavior without requiring pre-labeled training data.
  </div>

  <div class="steps-card">
    <div class="steps-title">Step-by-Step User Instructions:</div>
    <div class="step-item">
      <div class="step-bubble">1</div>
      <div class="step-text">Open <strong>"Anomaly Detection"</strong> from the sidebar.</div>
    </div>
    <div class="step-item">
      <div class="step-bubble">2</div>
      <div class="step-text">Review the <strong>Anomaly Summary Cards</strong>: Total Anomalies Detected, High Severity Count, and Contamination Rate (typically ~3%).</div>
    </div>
    <div class="step-item">
      <div class="step-bubble">3</div>
      <div class="step-text">Browse the <strong>Detected Incidents List</strong>. Each item shows an informative title (e.g., <em>"Sudden Consumption Spike"</em> or <em>"Overnight Phantom Surge"</em>).</div>
    </div>
    <div class="step-item">
      <div class="step-bubble">4</div>
      <div class="step-text">Read the plain-English explanation: for instance, <em>"Spike of 4.04 kWh detected at 19:00 (+308.5% above the 24-hour moving baseline of 0.99 kWh)."</em></div>
    </div>
  </div>

  <div class="details-grid">
    <div class="detail-card">
      <div class="detail-heading">🔴 High Severity Badge</div>
      <div class="detail-body">Flagged when instantaneous draw exceeds 250% of the moving baseline or occurs during deep sleep hours (1 AM - 5 AM).</div>
    </div>
    <div class="detail-card">
      <div class="detail-heading">🌲 Isolation Forest Algorithm</div>
      <div class="detail-body">Isolates anomalies by randomly selecting a feature and splitting value. Outliers require fewer recursive splits to be isolated.</div>
    </div>
  </div>
</div>

<!-- ==========================================
     PAGE 9: FEATURE 7 - AI FORECASTING
=========================================== -->
<div class="page">
  <div class="section-header">
    <h2 class="section-title">7. AI Time-Series Electricity Forecasting</h2>
    <span class="section-badge">Route: /forecasting</span>
  </div>

  <div class="screenshot-container">
    <img src="{imgs['forecasting']}" alt="Forecasting Screenshot" />
    <div class="screenshot-caption">Figure 7.1: Random Forest predictive forecasting showing chronological horizons, confidence bounds, and benchmark accuracy metrics.</div>
  </div>

  <div class="desc-box">
    <strong>What It Does:</strong> Uses a <strong>Random Forest Regressor</strong> with cyclical trigonometric time encodings to predict future electricity consumption across multiple horizons: Next Hour, Next 24 Hours, Next 7 Days, and Next 30 Days.
  </div>

  <div class="steps-card">
    <div class="steps-title">Step-by-Step User Instructions:</div>
    <div class="step-item">
      <div class="step-bubble">1</div>
      <div class="step-text">Click on <strong>"AI Forecasting"</strong> in the sidebar.</div>
    </div>
    <div class="step-item">
      <div class="step-bubble">2</div>
      <div class="step-text">Select your desired prediction horizon: <strong>24 Hours</strong>, <strong>7 Days</strong>, or <strong>30 Days</strong>.</div>
    </div>
    <div class="step-item">
      <div class="step-bubble">3</div>
      <div class="step-text">Inspect the <strong>Forecast Projection Graph</strong>. The dashed line indicates predicted consumption, accompanied by upper and lower confidence intervals.</div>
    </div>
    <div class="step-item">
      <div class="step-bubble">4</div>
      <div class="step-text">Review the <strong>Evaluation Metrics Card</strong>: Coefficient of Determination (<code>R² > 0.88</code>), Mean Absolute Error (<code>MAE < 0.11</code>), and Root Mean Squared Error (<code>RMSE</code>).</div>
    </div>
  </div>

  <div class="details-grid">
    <div class="detail-card">
      <div class="detail-heading">⏱️ Chronological Split (No Leakage)</div>
      <div class="detail-body">Enforces strict temporal ordering: the earliest 80% of data is used for training and the latest 20% for testing. No future data leaks into the past.</div>
    </div>
    <div class="detail-card">
      <div class="detail-heading">🔄 Trigonometric Encodings</div>
      <div class="detail-body">Encodes hour of day and day of week into continuous cyclical features: <code>sin(2πt/T)</code> and <code>cos(2πt/T)</code> so hour 23 smoothly connects to hour 0.</div>
    </div>
  </div>
</div>

<!-- ==========================================
     PAGE 10: FEATURE 8 - USAGE PATTERNS
=========================================== -->
<div class="page">
  <div class="section-header">
    <h2 class="section-title">8. Diurnal Usage Pattern Clustering</h2>
    <span class="section-badge">Route: /patterns</span>
  </div>

  <div class="screenshot-container">
    <img src="{imgs['patterns']}" alt="Usage Patterns Screenshot" />
    <div class="screenshot-caption">Figure 8.1: K-Means clustering interface segmenting daily consumption into 4 intuitive household operational modes.</div>
  </div>

  <div class="desc-box">
    <strong>What It Does:</strong> Applies unsupervised <strong>K-Means Clustering</strong> to group 24-hour diurnal consumption patterns into distinct household operational modes: Basal Standby, Regular Daytime, Active Demand, and Extreme Surges.
  </div>

  <div class="steps-card">
    <div class="steps-title">Step-by-Step User Instructions:</div>
    <div class="step-item">
      <div class="step-bubble">1</div>
      <div class="step-text">Select <strong>"Usage Patterns"</strong> from the navigation sidebar.</div>
    </div>
    <div class="step-item">
      <div class="step-bubble">2</div>
      <div class="step-text">Examine the <strong>Cluster Breakdown Cards</strong> showing the percentage of hours spent in each mode.</div>
    </div>
    <div class="step-item">
      <div class="step-bubble">3</div>
      <div class="step-text">Check the <strong>Silhouette Score</strong> (measures how well-separated each cluster is from its neighbors, typically > 0.55).</div>
    </div>
    <div class="step-item">
      <div class="step-bubble">4</div>
      <div class="step-text">Review the diurnal 24-hour heat profile to pinpoint exactly which hours of the day drive the home into "Extreme Surge" mode.</div>
    </div>
  </div>

  <div class="details-grid">
    <div class="detail-card">
      <div class="detail-heading">💤 Mode 1: Basal Standby (< 0.3 kW)</div>
      <div class="detail-body">Represents nighttime baseline when residents are asleep; powered by continuous refrigerators, Wi-Fi routers, and standby gadgets.</div>
    </div>
    <div class="detail-card">
      <div class="detail-heading">⚡ Mode 4: Extreme Surges (> 3.5 kW)</div>
      <div class="detail-body">Represents peak simultaneous demand when multiple high-draw appliances (geyser, microwave, oven) operate together.</div>
    </div>
  </div>
</div>

<!-- ==========================================
     PAGE 11: FEATURE 9 - ELECTRICITY BILL
=========================================== -->
<div class="page">
  <div class="section-header">
    <h2 class="section-title">9. Electricity Bill Estimator & Tariff Calculator</h2>
    <span class="section-badge">Route: /bill</span>
  </div>

  <div class="screenshot-container">
    <img src="{imgs['billing']}" alt="Electricity Bill Screenshot" />
    <div class="screenshot-caption">Figure 9.1: Comprehensive billing calculation engine with itemized slab breakdowns, fixed meter charges, and government taxes.</div>
  </div>

  <div class="desc-box">
    <strong>What It Does:</strong> Translates integrated kilowatt-hour consumption into an accurate, itemized financial statement. It models tiered slab pricing, monthly capacity charges, fuel adjustments, and municipal taxes.
  </div>

  <div class="steps-card">
    <div class="steps-title">Step-by-Step User Instructions:</div>
    <div class="step-item">
      <div class="step-bubble">1</div>
      <div class="step-text">Click on <strong>"Electricity Bill"</strong> in the sidebar menu.</div>
    </div>
    <div class="step-item">
      <div class="step-bubble">2</div>
      <div class="step-text">Observe the <strong>Top Billing Summary Cards</strong>: Total Estimated Bill (<code>₹6,376.17</code>), Average Cost per Day, and Effective Rate per kWh.</div>
    </div>
    <div class="step-item">
      <div class="step-bubble">3</div>
      <div class="step-text">Examine the <strong>Itemized Invoice Breakdown Table</strong>: Base Energy Charges (Slab 1, Slab 2), Fixed Monthly Demand Charge (₹120), and Electricity Duty Tax (5%).</div>
    </div>
    <div class="step-item">
      <div class="step-bubble">4</div>
      <div class="step-text">Adjust the tariff slider or rates in Settings to instantly see how state utility pricing changes affect your monthly liability.</div>
    </div>
  </div>

  <div class="details-grid">
    <div class="detail-card">
      <div class="detail-heading">📈 Progressive Tiered Slabs</div>
      <div class="detail-body">Accurately computes lower unit costs for the initial 100 kWh, stepping up progressively as consumption enters higher brackets.</div>
    </div>
    <div class="detail-card">
      <div class="detail-heading">🧾 Complete Transparency</div>
      <div class="detail-body">Prevents surprise bills by breaking down every rupee into energy vs capacity vs government taxes.</div>
    </div>
  </div>
</div>

<!-- ==========================================
     PAGE 12: FEATURE 10 - RECOMMENDATIONS
=========================================== -->
<div class="page">
  <div class="section-header">
    <h2 class="section-title">10. Actionable AI Recommendations Engine</h2>
    <span class="section-badge">Route: /recommendations</span>
  </div>

  <div class="screenshot-container">
    <img src="{imgs['recommendations']}" alt="Recommendations Screenshot" />
    <div class="screenshot-caption">Figure 10.1: AI-powered advisory console providing quantified kWh and currency savings for targeted behavioral shifts.</div>
  </div>

  <div class="desc-box">
    <strong>What It Does:</strong> Converts raw consumption patterns and detected anomalies into personalized, mathematically calculated energy-saving recommendations with estimated monthly savings in both kWh and local currency.
  </div>

  <div class="steps-card">
    <div class="steps-title">Step-by-Step User Instructions:</div>
    <div class="step-item">
      <div class="step-bubble">1</div>
      <div class="step-text">Navigate to <strong>"Recommendations"</strong> in the left sidebar.</div>
    </div>
    <div class="step-item">
      <div class="step-bubble">2</div>
      <div class="step-text">Review the <strong>Potential Savings Banner</strong> showing total monthly reducible waste (e.g., <em>~60-80 kWh/month savings</em>).</div>
    </div>
    <div class="step-item">
      <div class="step-bubble">3</div>
      <div class="step-text">Inspect specific advice cards sorted by impact: <strong>High Impact</strong> (Peak Load Shifting), <strong>Phantom Load</strong> (Standby Power), and <strong>Disparity</strong> (Weekend vs Weekday balance).</div>
    </div>
    <div class="step-item">
      <div class="step-bubble">4</div>
      <div class="step-text">Follow the actionable step described inside each card (e.g., using a smart timer for the water heater or setting AC to 24°C).</div>
    </div>
  </div>

  <div class="tip-box">
    💡 <strong>Financial Impact:</strong> Implementing the top two recommendations typically cuts household electricity bills by <strong>15% to 22%</strong> without degrading lifestyle comfort.
  </div>
</div>

<!-- ==========================================
     PAGE 13: FEATURE 11 - DATASET MANAGEMENT
=========================================== -->
<div class="page">
  <div class="section-header">
    <h2 class="section-title">11. Dataset Pipeline & Quality Validation</h2>
    <span class="section-badge">Route: /datasets</span>
  </div>

  <div class="screenshot-container">
    <img src="{imgs['datasets']}" alt="Datasets Screenshot" />
    <div class="screenshot-caption">Figure 11.1: Dataset management center with automatic CSV delimiter detection, sampling rate inference, and data quality reports.</div>
  </div>

  <div class="desc-box">
    <strong>What It Does:</strong> Allows users and examiners to upload real smart meter CSV files, validate column structures, and inspect automated data cleaning metrics (handling missing values, duplicate timestamps, and physical unit conversions).
  </div>

  <div class="steps-card">
    <div class="steps-title">Step-by-Step User Instructions:</div>
    <div class="step-item">
      <div class="step-bubble">1</div>
      <div class="step-text">Open <strong>"Dataset Management"</strong> from the sidebar menu.</div>
    </div>
    <div class="step-item">
      <div class="step-bubble">2</div>
      <div class="step-text">Observe the <strong>Active Dataset Status</strong> card displaying file details (UCI Household benchmark or generic smart meter).</div>
    </div>
    <div class="step-item">
      <div class="step-bubble">3</div>
      <div class="step-text">To test with custom data: Drag and drop any smart meter CSV file into the upload zone or click <strong>"Browse Files"</strong>.</div>
    </div>
    <div class="step-item">
      <div class="step-bubble">4</div>
      <div class="step-text">Review the automated <strong>Data Quality Report</strong>: Valid records count, Missing records detected, Sampling frequency, and Quality badge (<code>EXCELLENT</code>).</div>
    </div>
  </div>

  <div class="details-grid">
    <div class="detail-card">
      <div class="detail-heading">📁 Multi-Format Ingestion</div>
      <div class="detail-body">Supports both semicolon-separated UCI minute-level benchmark formats and standard comma-separated hourly CSV files.</div>
    </div>
    <div class="detail-card">
      <div class="detail-heading">🧹 Automatic Imputation</div>
      <div class="detail-body">Safely imputes missing records (marked by <code>?</code> in UCI datasets) using forward-fill and linear time-series interpolation.</div>
    </div>
  </div>
</div>

<!-- ==========================================
     PAGE 14: FEATURE 12 - SETTINGS
=========================================== -->
<div class="page">
  <div class="section-header">
    <h2 class="section-title">12. User Settings & Tariff Configuration</h2>
    <span class="section-badge">Route: /settings</span>
  </div>

  <div class="screenshot-container">
    <img src="{imgs['settings']}" alt="Settings Screenshot" />
    <div class="screenshot-caption">Figure 12.1: Settings and configuration console for customizing local currency symbols, slab pricing, and interface preferences.</div>
  </div>

  <div class="desc-box">
    <strong>What It Does:</strong> Allows users to adapt PowerPulse AI to their specific regional electricity provider by configuring currency symbols, base tariff rates per kWh, fixed charges, and account preferences.
  </div>

  <div class="steps-card">
    <div class="steps-title">Step-by-Step User Instructions:</div>
    <div class="step-item">
      <div class="step-bubble">1</div>
      <div class="step-text">Click on <strong>"Settings"</strong> at the bottom of the sidebar menu.</div>
    </div>
    <div class="step-item">
      <div class="step-bubble">2</div>
      <div class="step-text">Select your preferred <strong>Currency Symbol</strong> (₹ INR, $ USD, € EUR, or £ GBP).</div>
    </div>
    <div class="step-item">
      <div class="step-bubble">3</div>
      <div class="step-text">Enter your utility's <strong>Base Rate per kWh</strong> (e.g., <code>7.50</code>) and <strong>Fixed Monthly Meter Charge</strong>.</div>
    </div>
    <div class="step-item">
      <div class="step-bubble">4</div>
      <div class="step-text">Click <strong>"Save Preferences"</strong>. All calculations across the Dashboard, Analytics, and Bill Estimator update instantly.</div>
    </div>
  </div>

  <div class="details-grid">
    <div class="detail-card">
      <div class="detail-heading">🌐 Regional Adaptability</div>
      <div class="detail-body">Easily transitions between Indian state electricity board tariffs (TANGEDCO, BESCOM, MSEDCL) and international utility structures.</div>
    </div>
    <div class="detail-card">
      <div class="detail-heading">💾 Persistent Storage</div>
      <div class="detail-body">Settings are saved in the user's isolated database record and persist seamlessly across browser sessions and devices.</div>
    </div>
  </div>
</div>

</body>
</html>
"""

print(f"Writing HTML guide to {HTML_OUT}...")
with open(HTML_OUT, "w", encoding="utf-8") as f:
    f.write(html_content)

print(f"Generating PDF with Chrome headless to {PDF_OUT}...")
cmd = [
    CHROME,
    "--headless",
    "--disable-gpu",
    "--user-data-dir=/tmp/pp_chrome_profile",
    "--no-pdf-header-footer",
    f"--print-to-pdf={PDF_OUT}",
    HTML_OUT
]
res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

if os.path.exists(PDF_OUT):
    size_mb = os.path.getsize(PDF_OUT) / (1024 * 1024)
    print(f"SUCCESS! PDF Generated: {PDF_OUT} ({size_mb:.2f} MB)")
else:
    print("FAILED to generate PDF:", res.stderr.decode("utf-8"))
