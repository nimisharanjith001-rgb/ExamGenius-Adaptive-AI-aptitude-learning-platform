def test_ml_anomaly_forecasting_clustering(client, auth_headers):
    # Ensure active demo dataset
    demo_res = client.post("/api/datasets/seed-demo", headers=auth_headers)
    assert demo_res.status_code == 200
    dataset_id = demo_res.json()["id"]

    # 1. Anomaly Detection
    anom_res = client.post(
        f"/api/ml/anomaly-detection?dataset_id={dataset_id}&contamination=0.03",
        headers=auth_headers
    )
    assert anom_res.status_code == 200
    anom_data = anom_res.json()
    assert anom_data["total_anomalies"] > 0
    assert "anomalies" in anom_data
    assert "explanation" in anom_data["anomalies"][0]
    assert anom_data["anomalies"][0]["severity"] in ["High", "Medium", "Low"]

    # 2. Forecasting
    forecast_res = client.post(
        f"/api/ml/forecast?dataset_id={dataset_id}&horizon_type=next_day",
        headers=auth_headers
    )
    assert forecast_res.status_code == 200
    fc_data = forecast_res.json()
    assert len(fc_data["forecasts"]) == 24
    assert fc_data["total_predicted_kwh"] > 0
    assert "metrics" in fc_data
    assert fc_data["metrics"]["mae"] >= 0
    assert fc_data["metrics"]["r2_score"] is not None

    # 3. Clustering
    cluster_res = client.post(
        f"/api/ml/clustering?dataset_id={dataset_id}",
        headers=auth_headers
    )
    assert cluster_res.status_code == 200
    cl_data = cluster_res.json()
    assert cl_data["optimal_k"] in [3, 4, 5]
    assert len(cl_data["clusters"]) == cl_data["optimal_k"]
    assert len(cl_data["hourly_cluster_matrix"]) == 24

