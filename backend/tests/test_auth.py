def test_register_and_login(client):
    email = "newstudent@powerpulse.ai"
    password = "TestPassword456!"
    
    # Register
    reg_res = client.post("/api/auth/register", json={
        "email": email,
        "full_name": "Final Year Student",
        "password": password
    })
    assert reg_res.status_code == 201
    reg_data = reg_res.json()
    assert "access_token" in reg_data
    assert reg_data["user"]["email"] == email
    assert "hashed_password" not in reg_data["user"]

    # Duplicate register rejected
    dup_res = client.post("/api/auth/register", json={
        "email": email,
        "full_name": "Duplicate Student",
        "password": password
    })
    assert dup_res.status_code == 400

    # Login
    login_res = client.post("/api/auth/login", json={
        "email": email,
        "password": password
    })
    assert login_res.status_code == 200
    token_data = login_res.json()
    assert "access_token" in token_data
    token = token_data["access_token"]

    # Me check
    me_res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    assert me_res.json()["email"] == email

def test_login_invalid_credentials(client):
    res = client.post("/api/auth/login", json={
        "email": "nonexistent@powerpulse.ai",
        "password": "wrongpassword"
    })
    assert res.status_code == 401

