import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
from typing import List, Dict, Any, Tuple
from datetime import datetime
from app.ml.preprocessing import DataPreprocessingService

class AnomalyDetector:
    def __init__(self, contamination: float = 0.03):
        self.contamination = contamination
        self.model = IsolationForest(
            n_estimators=100,
            contamination=contamination,
            random_state=42,
            n_jobs=-1
        )
        self.scaler = StandardScaler()
        self.feature_names = [
            'energy_kwh',
            'hour',
            'is_weekend',
            'lag_1h',
            'rolling_mean_6h',
            'rolling_std_6h',
            'deviation_from_mean'
        ]

    def detect(self, df_hourly: pd.DataFrame) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
        if len(df_hourly) < 24:
            return [], {"status": "insufficient_data", "message": "At least 24 hours of data required for anomaly detection."}

        df_feat = DataPreprocessingService.engineer_time_series_features(df_hourly)
        X = df_feat[self.feature_names].values
        X_scaled = self.scaler.fit_transform(X)

        self.model.fit(X_scaled)
        # raw scores: lower score means more anomalous. decision_function gives negative for anomalies
        raw_scores = self.model.decision_function(X_scaled)
        predictions = self.model.predict(X_scaled)  # -1 for anomaly, 1 for normal

        # Convert raw decision score to normalized anomaly score (0.0 to 1.0, higher is more anomalous)
        # Decision function is typically between -0.4 and +0.4
        min_score = raw_scores.min()
        max_score = raw_scores.max()
        norm_scores = 1.0 - ((raw_scores - min_score) / (max_score - min_score + 1e-9))

        anomalies = []
        for i, pred in enumerate(predictions):
            if pred == -1 or norm_scores[i] > 0.82:
                row = df_feat.iloc[i]
                actual_kwh = float(row['energy_kwh'])
                baseline_kwh = float(row['rolling_mean_24h']) if row['rolling_mean_24h'] > 0 else float(row['rolling_mean_6h'])
                baseline_kwh = max(0.05, baseline_kwh)
                deviation_pct = round(((actual_kwh - baseline_kwh) / baseline_kwh) * 100.0, 1)

                score = float(norm_scores[i])
                hour = int(row['hour'])

                # Determine Severity and Explanation
                if score > 0.88 or deviation_pct > 250:
                    severity = "High"
                elif score > 0.78 or deviation_pct > 120:
                    severity = "Medium"
                else:
                    severity = "Low"

                # Categorize anomaly type
                if 0 <= hour <= 5 and actual_kwh > 1.2:
                    anomaly_type = "Unusual Nighttime Load"
                    explanation = (
                        f"Unusually high nighttime usage at {hour:02d}:00. Consumed {actual_kwh:.2f} kWh "
                        f"vs normal quiet baseline of {baseline_kwh:.2f} kWh ({deviation_pct:+0.1f}%). "
                        "Check for appliances, water heaters, or HVAC running overnight."
                    )
                elif deviation_pct > 200:
                    anomaly_type = "Sudden Consumption Spike"
                    explanation = (
                        f"Spike of {actual_kwh:.2f} kWh detected at {hour:02d}:00, which is "
                        f"{deviation_pct:+0.1f}% above the 24-hour moving baseline ({baseline_kwh:.2f} kWh). "
                        "Likely simultaneous high-draw appliances (e.g., microwave, geyser, EV charger)."
                    )
                elif actual_kwh < baseline_kwh * 0.2 and 18 <= hour <= 22:
                    anomaly_type = "Unexpected Evening Drop"
                    explanation = (
                        f"Sharp unexpected dip in peak evening hours ({actual_kwh:.2f} kWh vs baseline {baseline_kwh:.2f} kWh). "
                        "May indicate power outage, tripped breaker, or vacant premise."
                    )
                else:
                    anomaly_type = "Pattern Deviation"
                    explanation = (
                        f"Consumption of {actual_kwh:.2f} kWh diverges significantly from historical "
                        f"behavior for a {'weekend' if row['is_weekend'] else 'weekday'} at {hour:02d}:00 "
                        f"(baseline: {baseline_kwh:.2f} kWh)."
                    )

                anomalies.append({
                    "timestamp": row['timestamp'].isoformat(),
                    "actual_kwh": round(actual_kwh, 3),
                    "baseline_kwh": round(baseline_kwh, 3),
                    "deviation_pct": deviation_pct,
                    "anomaly_score": round(score, 3),
                    "severity": severity,
                    "explanation": explanation,
                    "anomaly_type": anomaly_type
                })

        # Sort anomalies by timestamp descending
        anomalies = sorted(anomalies, key=lambda x: x['timestamp'], reverse=True)

        model_info = {
            "algorithm": "Isolation Forest",
            "n_estimators": 100,
            "contamination_parameter": self.contamination,
            "total_evaluated_hours": len(df_hourly),
            "anomalies_detected": len(anomalies),
            "high_severity": sum(1 for a in anomalies if a['severity'] == "High"),
            "medium_severity": sum(1 for a in anomalies if a['severity'] == "Medium"),
            "low_severity": sum(1 for a in anomalies if a['severity'] == "Low"),
            "evaluated_at": datetime.now().isoformat()
        }

        return anomalies, model_info

