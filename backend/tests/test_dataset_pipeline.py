import io
from pathlib import Path

SAMPLE_PATH = Path(__file__).resolve().parent.parent.parent / "sample_data" / "sample_generic_electricity.csv"

def test_validate_and_upload_dataset(client, auth_headers):
    with open(SAMPLE_PATH, "rb") as f:
        file_bytes = f.read()

    # Pre-validation endpoint
    val_res = client.post(
        "/api/datasets/validate",
        files={"file": ("sample.csv", io.BytesIO(file_bytes), "text/csv")}
    )
    assert val_res.status_code == 200
    report = val_res.json()
    assert report["total_records"] > 0
    assert report["data_quality_status"] in ["EXCELLENT", "GOOD"]
    assert "power_kw" in report["columns_detected"] or "energy_kwh" in report["columns_detected"]

    # Upload endpoint
    upload_res = client.post(
        "/api/datasets/upload",
        files={"file": ("sample_dataset.csv", io.BytesIO(file_bytes), "text/csv")},
        data={"custom_name": "Test Uploaded Dataset"},
        headers=auth_headers
    )
    assert upload_res.status_code == 201
    ds_data = upload_res.json()
    assert ds_data["name"] == "Test Uploaded Dataset"
    assert ds_data["total_energy_kwh"] > 0
    assert ds_data["is_active"] is True
    dataset_id = ds_data["id"]

    # Get datasets list
    list_res = client.get("/api/datasets", headers=auth_headers)
    assert list_res.status_code == 200
    assert len(list_res.json()) >= 1

    # Preview readings
    prev_res = client.get(f"/api/datasets/{dataset_id}/preview", headers=auth_headers)
    assert prev_res.status_code == 200
    assert len(prev_res.json()) > 0
    assert "energy_kwh" in prev_res.json()[0]

def test_seed_demo_dataset(client, auth_headers):
    res = client.post("/api/datasets/seed-demo", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert "UCI" in data["dataset_type"] or "UCI" in data["name"]
    assert data["total_records"] > 1000

