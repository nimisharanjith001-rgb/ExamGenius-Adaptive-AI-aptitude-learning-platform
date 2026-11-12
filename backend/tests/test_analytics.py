def test_dashboard_and_analytics(client, auth_headers):
    # Seed demo
    demo = client.post("/api/datasets/seed-demo", headers=auth_headers).json()
    ds_id = demo["id"]

    # Dashboard summary
    sum_res = client.get(f"/api/dashboard/summary?dataset_id={ds_id}", headers=auth_headers)
    assert sum_res.status_code == 200
    summary = sum_res.json()
    assert summary["total_energy_kwh"] > 0
    assert summary["avg_daily_kwh"] > 0
    assert summary["estimated_monthly_bill"] > 0

    # Consumption trend
    trend_res = client.get(f"/api/dashboard/consumption?dataset_id={ds_id}&aggregation=hourly", headers=auth_headers)
    assert trend_res.status_code == 200
    points = trend_res.json()
    assert len(points) > 0
    assert "energy_kwh" in points[0]

    # Peak hours
    peak_res = client.get(f"/api/dashboard/peak-hours?dataset_id={ds_id}", headers=auth_headers)
    assert peak_res.status_code == 200
    peak_data = peak_res.json()
    assert len(peak_data["peak_hours"]) > 0
    assert peak_data["peak_percentage"] > 0

    # Recommendations
    rec_res = client.get(f"/api/recommendations?dataset_id={ds_id}", headers=auth_headers)
    assert rec_res.status_code == 200
    recs = rec_res.json()
    assert recs["total_recommendations"] > 0
    assert len(recs["items"]) > 0
    assert "evidence" in recs["items"][0]

