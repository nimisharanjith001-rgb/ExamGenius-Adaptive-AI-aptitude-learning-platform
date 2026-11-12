import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import silhouette_score
from typing import Dict, Any, List

class ConsumptionClusterer:
    def __init__(self, n_clusters: int = 4):
        self.n_clusters = n_clusters
        self.scaler = StandardScaler()
        self.feature_cols = ['energy_kwh', 'hour', 'avg_power_kw', 'is_weekend']

    def cluster(self, df_hourly: pd.DataFrame) -> Dict[str, Any]:
        if len(df_hourly) < 24:
            raise ValueError("At least 24 hours of data required for pattern clustering.")

        df = df_hourly.copy()
        X = df[self.feature_cols].values
        X_scaled = self.scaler.fit_transform(X)

        # Evaluate silhouette score across candidates (k=3, 4, 5)
        best_k = 4
        best_score = -1.0
        best_labels = None
        best_model = None

        candidate_ks = [3, 4] if len(df) < 100 else [3, 4, 5]
        for k in candidate_ks:
            km = KMeans(n_clusters=k, random_state=42, n_init=10)
            labels = km.fit_predict(X_scaled)
            score = silhouette_score(X_scaled, labels)
            if score > best_score:
                best_score = score
                best_k = k
                best_labels = labels
                best_model = km

        df['cluster'] = best_labels

        # Calculate cluster properties and rank them by mean energy
        cluster_summaries = []
        cluster_means = df.groupby('cluster')['energy_kwh'].mean().sort_values()

        # Descriptive names mapped by sorted consumption rank
        names_hierarchy = [
            ("Low Baseline / Standby", "Minimal background electricity draw (refrigeration, standby electronics). Predominantly during late night or vacant periods."),
            ("Moderate Regular Usage", "Typical daytime activity with standard home lighting, computers, and light entertainment devices."),
            ("High Activity / Peak Demand", "Active household periods with intensive kitchen, laundry, or climate appliances in operation."),
            ("Surge / Extreme Peak", "Spike periods characterized by simultaneous heavy loads (geysers, ovens, heaters, air conditioners)."),
            ("Special Extended Load", "Extended elevated consumption patterns.")
        ]

        # Map original cluster IDs to ordered ranks
        rank_mapping = {orig_id: rank for rank, orig_id in enumerate(cluster_means.index)}
        df['ordered_cluster'] = df['cluster'].map(rank_mapping)

        total_rows = len(df)
        for rank in range(best_k):
            sub = df[df['ordered_cluster'] == rank]
            count = len(sub)
            pct = round((count / total_rows) * 100.0, 1)
            avg_kwh = round(float(sub['energy_kwh'].mean()), 3)
            
            # Most frequent hours in this cluster
            top_hours = sub['hour'].value_counts().head(5).index.tolist()
            top_hours.sort()

            name, desc = names_hierarchy[min(rank, len(names_hierarchy) - 1)]

            cluster_summaries.append({
                "cluster_id": rank,
                "cluster_name": name,
                "avg_kwh": avg_kwh,
                "percentage": pct,
                "description": desc,
                "typical_hours": top_hours
            })

        # Generate Hourly Matrix (hour 0-23 by cluster distribution)
        hourly_matrix = []
        for hour in range(24):
            hour_sub = df[df['hour'] == hour]
            row_data = {"hour": hour}
            for rank in range(best_k):
                c_count = (hour_sub['ordered_cluster'] == rank).sum()
                row_data[f"cluster_{rank}"] = int(c_count)
            row_data["total"] = len(hour_sub)
            hourly_matrix.append(row_data)

        return {
            "optimal_k": best_k,
            "silhouette_score": round(float(best_score), 4),
            "clusters": cluster_summaries,
            "hourly_cluster_matrix": hourly_matrix
        }

