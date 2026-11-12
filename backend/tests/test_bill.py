def test_bill_calculation_and_tariff(client, auth_headers):
    # Seed demo
    demo = client.post("/api/datasets/seed-demo", headers=auth_headers).json()
    ds_id = demo["id"]

    # Calculate bill with custom inputs
    calc_res = client.post(
        f"/api/bill/calculate?dataset_id={ds_id}",
        json={
            "tariff_per_kwh": 8.0,
            "fixed_monthly_charge": 150.0,
            "tax_rate_pct": 5.0,
            "additional_charges": 20.0,
            "currency": "₹",
            "custom_kwh": 200.0
        },
        headers=auth_headers
    )
    assert calc_res.status_code == 200
    data = calc_res.json()
    # Math validation:
    # Energy charge = 200 * 8.0 = 1600
    # Subtotal = 1600 + 150 + 20 = 1770
    # Tax = 1770 * 0.05 = 88.5
    # Total = 1770 + 88.5 = 1858.5
    assert data["energy_charge"] == 1600.0
    assert data["total_estimated_bill"] == 1858.5
    assert data["currency"] == "₹"
    assert "NOTICE" in data["disclaimer"]

    # Update tariff
    tariff_res = client.put(
        "/api/bill/tariff",
        json={"tariff_per_kwh": 9.20, "fixed_monthly_charge": 200.0},
        headers=auth_headers
    )
    assert tariff_res.status_code == 200
    assert tariff_res.json()["tariff_per_kwh"] == 9.20

