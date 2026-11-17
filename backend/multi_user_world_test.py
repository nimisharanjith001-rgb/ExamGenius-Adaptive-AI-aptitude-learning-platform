import time
from app.main import app
from starlette.testclient import TestClient

print("=" * 80)
print("🌍 POWERPULSE AI - GLOBAL MULTI-USER AUTHENTICATION VERIFICATION TEST")
print("=" * 80)

client = TestClient(app)

test_users = [
    {
        "name": "Aarav Sharma",
        "email": f"aarav.sharma.{int(time.time())}@gmail.com",
        "password": "AaravSecure#123",
        "region": "India (Global Gmail)"
    },
    {
        "name": "Sarah Jenkins",
        "email": f"sarah.jenkins.{int(time.time())}@outlook.com",
        "password": "SarahPass!2026",
        "region": "USA / UK (Outlook)"
    },
    {
        "name": "Dr. Priya Patel",
        "email": f"priya.patel.{int(time.time())}@iitb.ac.in",
        "password": "Research@IIT2026",
        "region": "Academic / University (.ac.in)"
    },
    {
        "name": "Oliver Smith",
        "email": f"oliver.smith.{int(time.time())}@yahoo.co.uk",
        "password": "OliverLondon$99",
        "region": "Europe / UK (.co.uk)"
    },
    {
        "name": "Leela Irla",
        "email": f"leela.tester.{int(time.time())}@gmail.com",
        "password": "Venkat@123",
        "region": "Student User (Target Vector)"
    },
    {
        "name": "Alex Chen",
        "email": f"alex.chen.{int(time.time())}@techpulse.ai",
        "password": "Alex#AIInnovation88",
        "region": "Modern Tech Domain (.ai)"
    }
]

total_tests = 0
passed_tests = 0

for idx, user in enumerate(test_users, start=1):
    print(f"\n[USER {idx}/6: {user['name']} | {user['region']}]")
    email = user["email"]
    pwd = user["password"]
    name = user["name"]

    # STEP 1: Registration
    t0 = time.time()
    res = client.post("/api/auth/register", json={"email": email, "full_name": name, "password": pwd})
    latency = (time.time() - t0) * 1000
    assert res.status_code == 201, f"Registration failed for {email}: {res.status_code} {res.text}"
    data = res.json()
    otp_code = data.get("verification_code")
    assert otp_code and len(otp_code) == 6, f"Invalid OTP: {otp_code}"
    print(f"  1. ✅ [201 CREATED] Registration & OTP Generated in {latency:.1f}ms (Code: {otp_code})")
    total_tests += 1
    passed_tests += 1

    # STEP 2: Bad Code Rejection
    t0 = time.time()
    res = client.post("/api/auth/verify-code", json={"email": email, "code": "999999"})
    latency = (time.time() - t0) * 1000
    assert res.status_code == 400, f"Bad OTP should be rejected: {res.text}"
    print(f"  2. ✅ [400 BLOCKED] Invalid OTP rejected in {latency:.1f}ms")
    total_tests += 1
    passed_tests += 1

    # STEP 3: Valid Code Verification
    t0 = time.time()
    res = client.post("/api/auth/verify-code", json={"email": email, "code": otp_code})
    latency = (time.time() - t0) * 1000
    assert res.status_code == 200, f"Verification failed: {res.text}"
    token = res.json().get("access_token")
    assert token, "Token missing in verification response"
    print(f"  3. ✅ [200 OK] 2FA OTP Verified & JWT Granted in {latency:.1f}ms")
    total_tests += 1
    passed_tests += 1

    # STEP 4: Login with Verified Account
    t0 = time.time()
    res = client.post("/api/auth/login", json={"email": email, "password": pwd})
    latency = (time.time() - t0) * 1000
    assert res.status_code == 200, f"Login failed: {res.text}"
    login_token = res.json().get("access_token")
    assert login_token, "Token missing in login response"
    print(f"  4. ✅ [200 OK] User Login Successful in {latency:.1f}ms")
    total_tests += 1
    passed_tests += 1

    # STEP 5: Profile Fetch
    headers = {"Authorization": f"Bearer {login_token}"}
    t0 = time.time()
    res = client.get("/api/auth/me", headers=headers)
    latency = (time.time() - t0) * 1000
    assert res.status_code == 200, f"Me profile failed: {res.text}"
    profile = res.json()
    assert profile.get("email") == email.lower()
    assert profile.get("is_verified") is True
    print(f"  5. ✅ [200 OK] Authenticated Profile Loaded in {latency:.1f}ms (Verified: True)")
    total_tests += 1
    passed_tests += 1

    # STEP 6: Duplicate Registration Guard
    t0 = time.time()
    res = client.post("/api/auth/register", json={"email": email, "full_name": name, "password": pwd})
    latency = (time.time() - t0) * 1000
    assert res.status_code == 400, f"Duplicate should fail: {res.text}"
    print(f"  6. ✅ [400 BLOCKED] Duplicate Registration Prevented in {latency:.1f}ms")
    total_tests += 1
    passed_tests += 1

print("\n" + "=" * 80)
print(f"🏆 ALL TESTS COMPLETE: {passed_tests}/{total_tests} (100%) TESTS PASSED PERFECTLY!")
print("=" * 80)
