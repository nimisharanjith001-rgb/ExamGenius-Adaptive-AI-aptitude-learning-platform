import time
import json
from pathlib import Path
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app, base_url="http://testserver/api")
SAMPLE_DIR = Path(__file__).resolve().parent.parent / "sample_data"

def run_comprehensive_test():
    results = []
    print("=" * 80)
    print("⚡ POWERPULSE AI – COMPREHENSIVE END-TO-END SYSTEM TEST REPORT")
    print("=" * 80)
    
    total_start = time.time()
    
    # ----------------------------------------------------
    # TEST 1: System Health Endpoint
    # ----------------------------------------------------
    t0 = time.time()
    try:
        r = client.get("/health")
        dt = round((time.time() - t0) * 1000, 1)
        if r.status_code == 200 and r.json().get("status") == "healthy":
            results.append(("System Health Status Check", "PASS", f"{dt}ms", "Service: PowerPulse AI, Version: 1.0.0"))
        else:
            results.append(("System Health Status Check", "FAIL", f"{dt}ms", f"Status: {r.status_code}"))
    except Exception as e:
        results.append(("System Health Status Check", "FAIL", "ERR", str(e)))

    # ----------------------------------------------------
    # TEST 2: User Account Creation (Sign Up / Registration)
    # ----------------------------------------------------
    test_email = f"student_audit_{int(time.time())}@powerpulse.ai"
    test_password = "SecurePassword2026!"
    test_name = "Final Year Evaluator"
    token = None
    user_id = None

    t0 = time.time()
    try:
        r = client.post("/auth/register", json={
            "email": test_email,
            "full_name": test_name,
            "password": test_password
        })
        dt = round((time.time() - t0) * 1000, 1)
        if r.status_code == 201:
            data = r.json()
            token = data["access_token"]
            user_id = data["user"]["id"]
            results.append(("Account Creation & Auto-Login (Sign Up)", "PASS", f"{dt}ms", f"Created User ID: {user_id}, JWT Issued"))
        else:
            results.append(("Account Creation & Auto-Login (Sign Up)", "FAIL", f"{dt}ms", f"Status: {r.status_code}: {r.text}"))
    except Exception as e:
        results.append(("Account Creation & Auto-Login (Sign Up)", "FAIL", "ERR", str(e)))

    # ----------------------------------------------------
    # TEST 3: Duplicate Registration Rejection (Security Validation)
    # ----------------------------------------------------
    t0 = time.time()
    try:
        r = client.post("/auth/register", json={
            "email": test_email,
            "full_name": "Duplicate Attempt",
            "password": test_password
        })
        dt = round((time.time() - t0) * 1000, 1)
        if r.status_code == 400:
            results.append(("Duplicate Account Prevention", "PASS", f"{dt}ms", "Rejected with clean 400 Bad Request"))
        else:
            results.append(("Duplicate Account Prevention", "FAIL", f"{dt}ms", f"Status: {r.status_code}"))
    except Exception as e:
        results.append(("Duplicate Account Prevention", "FAIL", "ERR", str(e)))

    # ----------------------------------------------------
    # TEST 4: Authentication & Login (Sign In)
    # ----------------------------------------------------
    t0 = time.time()
    try:
        r = client.post("/auth/login", json={
            "email": test_email,
            "password": test_password
        })
        dt = round((time.time() - t0) * 1000, 1)
        if r.status_code == 200:
            data = r.json()
            token = data["access_token"]
            results.append(("User Authentication (Sign In)", "PASS", f"{dt}ms", f"Authenticated: {data['user']['email']}"))
        else:
            results.append(("User Authentication (Sign In)", "FAIL", f"{dt}ms", f"Status: {r.status_code}"))
    except Exception as e:
        results.append(("User Authentication (Sign In)", "FAIL", "ERR", str(e)))

    headers = {"Authorization": f"Bearer {token}"} if token else {}

    # ----------------------------------------------------
    # TEST 5: User Profile Fetch (/api/auth/me)
    # ----------------------------------------------------
    t0 = time.time()
    try:
        r = client.get("/auth/me", headers=headers)
        dt = round((time.time() - t0) * 1000, 1)
        if r.status_code == 200 and r.json().get("email") == test_email:
            results.append(("Session Verification (/auth/me)", "PASS", f"{dt}ms", f"Verified Name: {r.json().get('full_name')}"))
        else:
            results.append(("Session Verification (/auth/me)", "FAIL", f"{dt}ms", f"Status: {r.status_code}"))
    except Exception as e:
        results.append(("Session Verification (/auth/me)", "FAIL", "ERR", str(e)))

    # ----------------------------------------------------
    # TEST 6: CSV Dataset Pre-validation & Structure Inspection
    # ----------------------------------------------------
    sample_uci_path = SAMPLE_DIR / "sample_uci_household_sample.csv"
    dataset_id = None
    t0 = time.time()
    try:
        with open(sample_uci_path, "rb") as f:
            file_bytes = f.read()
        r = client.post("/datasets/validate", files={"file": ("uci_sample.csv", file_bytes, "text/csv")})
        dt = round((time.time() - t0) * 1000, 1)
        if r.status_code == 200:
            rep = r.json()
            results.append(("CSV Structure Pre-validation", "PASS", f"{dt}ms", f"Detected: {rep['detected_format']}, Rows: {rep['total_records']}, Status: {rep['data_quality_status']}"))
        else:
            results.append(("CSV Structure Pre-validation", "FAIL", f"{dt}ms", f"Status: {r.status_code}"))
    except Exception as e:
        results.append(("CSV Structure Pre-validation", "FAIL", "ERR", str(e)))

    # ----------------------------------------------------
    # TEST 7: Dataset Ingestion & Physical Energy Integration (20,160 readings)
    # ----------------------------------------------------
    t0 = time.time()
    try:
        with open(sample_uci_path, "rb") as f:
            file_bytes = f.read()
        r = client.post("/datasets/upload", files={"file": ("household_sample.csv", file_bytes, "text/csv")}, data={"custom_name": "Audit Benchmark Dataset"}, headers=headers)
        dt = round((time.time() - t0) * 1000, 1)
        if r.status_code == 201:
            ds = r.json()
            dataset_id = ds["id"]
            results.append(("Physical Energy Integration & Upload", "PASS", f"{dt}ms", f"ID: {dataset_id}, Total: {ds['total_energy_kwh']} kWh, Max Power: {ds['max_power_kw']} kW"))
        else:
            results.append(("Physical Energy Integration & Upload", "FAIL", f"{dt}ms", f"Status: {r.status_code}"))
    except Exception as e:
        results.append(("Physical Energy Integration & Upload", "FAIL", "ERR", str(e)))

    # ----------------------------------------------------
    # TEST 8: Hourly Aggregated Preview Records
    # ----------------------------------------------------
    t0 = time.time()
    try:
        r = client.get(f"/datasets/{dataset_id}/preview", headers=headers)
        dt = round((time.time() - t0) * 1000, 1)
        if r.status_code == 200 and len(r.json()) > 0:
            results.append(("Hourly Aggregated Preview Records", "PASS", f"{dt}ms", f"Fetched {len(r.json())} sample hourly rows with energy_kwh & voltage"))
        else:
            results.append(("Hourly Aggregated Preview Records", "FAIL", f"{dt}ms", f"Status: {r.status_code}"))
    except Exception as e:
        results.append(("Hourly Aggregated Preview Records", "FAIL", "ERR", str(e)))

    # ----------------------------------------------------
    # TEST 9: Executive Dashboard KPI Summary
    # ----------------------------------------------------
    t0 = time.time()
    try:
        r = client.get(f"/dashboard/summary?dataset_id={dataset_id}", headers=headers)
        dt = round((time.time() - t0) * 1000, 1)
        if r.status_code == 200:
            kpi = r.json()
            results.append(("Dashboard KPI Summary Generation", "PASS", f"{dt}ms", f"Energy: {kpi['total_energy_kwh']} kWh, Daily: {kpi['avg_daily_kwh']} kWh/day, Bill: {kpi['currency']}{kpi['estimated_monthly_bill']}"))
        else:
            results.append(("Dashboard KPI Summary Generation", "FAIL", f"{dt}ms", f"Status: {r.status_code}"))
    except Exception as e:
        results.append(("Dashboard KPI Summary Generation", "FAIL", "ERR", str(e)))

    # ----------------------------------------------------
    # TEST 10: 24-Hour Peak Hours Diurnal Analysis
    # ----------------------------------------------------
    t0 = time.time()
    try:
        r = client.get(f"/dashboard/peak-hours?dataset_id={dataset_id}", headers=headers)
        dt = round((time.time() - t0) * 1000, 1)
        if r.status_code == 200:
            peak = r.json()
            results.append(("24-Hour Peak Load Profile Analysis", "PASS", f"{dt}ms", f"Peak Window: {peak['peak_hours']}:00 ({peak['peak_percentage']}% of load)"))
        else:
            results.append(("24-Hour Peak Load Profile Analysis", "FAIL", f"{dt}ms", f"Status: {r.status_code}"))
    except Exception as e:
        results.append(("24-Hour Peak Load Profile Analysis", "FAIL", "ERR", str(e)))

    # ----------------------------------------------------
    # TEST 11: Multi-Granularity Analytics (Daily / Weekly / Patterns)
    # ----------------------------------------------------
    t0 = time.time()
    try:
        r_daily = client.get(f"/analytics/daily?dataset_id={dataset_id}", headers=headers)
        r_pat = client.get(f"/analytics/patterns?dataset_id={dataset_id}", headers=headers)
        dt = round((time.time() - t0) * 1000, 1)
        if r_daily.status_code == 200 and r_pat.status_code == 200:
            p_data = r_pat.json()
            results.append(("Multi-Granularity & Diurnal Patterns", "PASS", f"{dt}ms", f"Daily Points: {len(r_daily.json())}, Weekday Avg: {p_data['weekday_avg_kwh']} kWh, Weekend Avg: {p_data['weekend_avg_kwh']} kWh"))
        else:
            results.append(("Multi-Granularity & Diurnal Patterns", "FAIL", f"{dt}ms", f"Statuses: {r_daily.status_code}, {r_pat.status_code}"))
    except Exception as e:
        results.append(("Multi-Granularity & Diurnal Patterns", "FAIL", "ERR", str(e)))

    # ----------------------------------------------------
    # TEST 12: Device-Level Appliance Disaggregation (NILM)
    # ----------------------------------------------------
    t0 = time.time()
    try:
        r = client.get(f"/analytics/appliances?dataset_id={dataset_id}", headers=headers)
        dt = round((time.time() - t0) * 1000, 1)
        if r.status_code == 200:
            app_data = r.json()
            top = app_data["top_appliance"]["name"]
            results.append(("Appliance Energy Disaggregation Leaderboard", "PASS", f"{dt}ms", f"Ranked {len(app_data['appliances'])} devices. Top: {top} ({app_data['top_appliance']['percentage']}%)"))
        else:
            results.append(("Appliance Energy Disaggregation Leaderboard", "FAIL", f"{dt}ms", f"Status: {r.status_code}"))
    except Exception as e:
        results.append(("Appliance Energy Disaggregation Leaderboard", "FAIL", "ERR", str(e)))

    # ----------------------------------------------------
    # TEST 13: Isolation Forest Anomaly Detection
    # ----------------------------------------------------
    t0 = time.time()
    try:
        r = client.post(f"/ml/anomaly-detection?dataset_id={dataset_id}&contamination=0.03", headers=headers)
        dt = round((time.time() - t0) * 1000, 1)
        if r.status_code == 200:
            anom = r.json()
            results.append(("Isolation Forest Anomaly Detection", "PASS", f"{dt}ms", f"Detected {anom['total_anomalies']} anomalies (High: {anom['high_severity_count']}, Med: {anom['medium_severity_count']})"))
        else:
            results.append(("Isolation Forest Anomaly Detection", "FAIL", f"{dt}ms", f"Status: {r.status_code}"))
    except Exception as e:
        results.append(("Isolation Forest Anomaly Detection", "FAIL", "ERR", str(e)))

    # ----------------------------------------------------
    # TEST 14: Random Forest Regressor Time-Series Forecasting
    # ----------------------------------------------------
    t0 = time.time()
    try:
        r = client.post(f"/ml/forecast?dataset_id={dataset_id}&horizon_type=next_day", headers=headers)
        dt = round((time.time() - t0) * 1000, 1)
        if r.status_code == 200:
            fc = r.json()
            m = fc["metrics"]
            results.append(("Random Forest Forecasting (24h Outlook)", "PASS", f"{dt}ms", f"R2: {round(m['r2_score']*100, 1)}%, MAE: {m['mae']} kWh, Improvement: +{m['accuracy_improvement_pct']}%"))
        else:
            results.append(("Random Forest Forecasting (24h Outlook)", "FAIL", f"{dt}ms", f"Status: {r.status_code}"))
    except Exception as e:
        results.append(("Random Forest Forecasting (24h Outlook)", "FAIL", "ERR", str(e)))

    # ----------------------------------------------------
    # TEST 15: K-Means Pattern Clustering & Silhouette Optimization
    # ----------------------------------------------------
    t0 = time.time()
    try:
        r = client.post(f"/ml/clustering?dataset_id={dataset_id}", headers=headers)
        dt = round((time.time() - t0) * 1000, 1)
        if r.status_code == 200:
            cl = r.json()
            results.append(("K-Means Clustering & Silhouette Optimization", "PASS", f"{dt}ms", f"Optimal k={cl['optimal_k']}, Silhouette Score={cl['silhouette_score']}"))
        else:
            results.append(("K-Means Clustering & Silhouette Optimization", "FAIL", f"{dt}ms", f"Status: {r.status_code}"))
    except Exception as e:
        results.append(("K-Means Clustering & Silhouette Optimization", "FAIL", "ERR", str(e)))

    # ----------------------------------------------------
    # TEST 16: Electricity Tariff & Bill Calculator
    # ----------------------------------------------------
    t0 = time.time()
    try:
        r = client.post(f"/bill/calculate?dataset_id={dataset_id}", json={
            "tariff_per_kwh": 7.50,
            "fixed_monthly_charge": 120.0,
            "tax_rate_pct": 5.0,
            "additional_charges": 0.0,
            "currency": "₹"
        }, headers=headers)
        dt = round((time.time() - t0) * 1000, 1)
        if r.status_code == 200:
            b = r.json()
            results.append(("Tariff & Electricity Bill Calculator", "PASS", f"{dt}ms", f"Total: {b['currency']}{b['total_estimated_bill']} (Energy: {b['currency']}{b['energy_charge']})"))
        else:
            results.append(("Tariff & Electricity Bill Calculator", "FAIL", f"{dt}ms", f"Status: {r.status_code}"))
    except Exception as e:
        results.append(("Tariff & Electricity Bill Calculator", "FAIL", "ERR", str(e)))

    # ----------------------------------------------------
    # TEST 17: Empirical Recommendations Engine
    # ----------------------------------------------------
    t0 = time.time()
    try:
        r = client.get(f"/recommendations?dataset_id={dataset_id}", headers=headers)
        dt = round((time.time() - t0) * 1000, 1)
        if r.status_code == 200:
            recs = r.json()
            results.append(("Energy-Saving Recommendations Engine", "PASS", f"{dt}ms", f"Generated {recs['total_recommendations']} tips (Potential Savings: {recs['currency']}{recs['potential_monthly_savings_amount']}/mo)"))
        else:
            results.append(("Energy-Saving Recommendations Engine", "FAIL", f"{dt}ms", f"Status: {r.status_code}"))
    except Exception as e:
        results.append(("Energy-Saving Recommendations Engine", "FAIL", "ERR", str(e)))

    # ----------------------------------------------------
    # TEST 18: User Preferences & Settings
    # ----------------------------------------------------
    t0 = time.time()
    try:
        r_get = client.get("/settings", headers=headers)
        r_put = client.put("/settings", json={
            "default_currency": "₹",
            "default_tariff": 8.0,
            "theme": "light",
            "notifications_enabled": True
        }, headers=headers)
        dt = round((time.time() - t0) * 1000, 1)
        if r_get.status_code == 200 and r_put.status_code == 200:
            results.append(("User Platform Settings & Preferences", "PASS", f"{dt}ms", "Retrieved & updated user tariff defaults"))
        else:
            results.append(("User Platform Settings & Preferences", "FAIL", f"{dt}ms", f"Statuses: {r_get.status_code}, {r_put.status_code}"))
    except Exception as e:
        results.append(("User Platform Settings & Preferences", "FAIL", "ERR", str(e)))

    # ----------------------------------------------------
    # TEST 19: Strict Multi-Tenant Data Isolation (Cross-User Leak Check)
    # ----------------------------------------------------
    t0 = time.time()
    try:
        # Create a second distinct user
        r_user2 = client.post("/auth/register", json={
            "email": f"attacker_{int(time.time())}@powerpulse.ai",
            "full_name": "Unauthorized Intruder",
            "password": "Password123!"
        })
        token2 = r_user2.json()["access_token"]
        headers2 = {"Authorization": f"Bearer {token2}"}
        
        # User 2 attempts to read User 1's dataset
        r_cross = client.get(f"/datasets/{dataset_id}", headers=headers2)
        dt = round((time.time() - t0) * 1000, 1)
        if r_cross.status_code == 404:
            results.append(("Multi-Tenant Anti-Leak Isolation Check", "PASS", f"{dt}ms", "Blocked unauthorized cross-user access (404 Not Found)"))
        else:
            results.append(("Multi-Tenant Anti-Leak Isolation Check", "FAIL", f"{dt}ms", f"LEAK DETECTED: Returned {r_cross.status_code}"))
    except Exception as e:
        results.append(("Multi-Tenant Anti-Leak Isolation Check", "FAIL", "ERR", str(e)))

    total_time = round(time.time() - total_start, 2)
    
    # ----------------------------------------------------
    # Print Structured Output Table
    # ----------------------------------------------------
    print(f"{'#':<3} | {'TEST CASE NAME':<44} | {'STATUS':<6} | {'LATENCY':<8} | {'KEY METRIC / OBSERVATION'}")
    print("-" * 110)
    passed_count = sum(1 for _, s, _, _ in results if s == "PASS")
    
    for i, (name, status, lat, note) in enumerate(results, start=1):
        indicator = "🟢 [PASS]" if status == "PASS" else "🔴 [FAIL]"
        print(f"{i:<3} | {name:<44} | {indicator:<6} | {lat:<8} | {note}")
        
    print("-" * 110)
    print(f"SUMMARY: {passed_count}/{len(results)} Tests Passed (Success Rate: {(passed_count/len(results))*100:.1f}%) in {total_time}s")
    print("=" * 110)

if __name__ == "__main__":
    run_comprehensive_test()

