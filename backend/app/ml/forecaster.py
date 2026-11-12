import numpy as np
import pandas as pd
from datetime import timedelta
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from typing import Dict, Any, List, Tuple, Optional
from app.ml.preprocessing import DataPreprocessingService

class ElectricityForecaster:
    def __init__(self, n_estimators: int = 120, max_depth: int = 12):
        self.model = RandomForestRegressor(
            n_estimators=n_estimators,
            max_depth=max_depth,
            random_state=42,
            n_jobs=-1
        )
        self.feature_cols = [
            'hour',
            'day_of_week',
            'is_weekend',
            'hour_sin',
            'hour_cos',
            'day_sin',
            'day_cos',
            'lag_1h',
            'lag_2h',
            'lag_24h',
            'rolling_mean_6h',
            'rolling_mean_24h',
            'rolling_std_6h'
        ]
        self.metrics: Dict[str, Any] = {}
        self.is_trained = False

    def train_and_evaluate(self, df_hourly: pd.DataFrame) -> Dict[str, Any]:
        """
        Performs chronological train/test split (80% train, 20% test).
        Trains Random Forest Regressor and evaluates against a Baseline Persistence Model.
        """
        if len(df_hourly) < 48:
            raise ValueError("At least 48 hours of sequential data is required for chronological forecasting.")

        df_feat = DataPreprocessingService.engineer_time_series_features(df_hourly)
        
        # Chronological split index
        split_idx = int(len(df_feat) * 0.8)
        train_df = df_feat.iloc[:split_idx]
        test_df = df_feat.iloc[split_idx:]

        X_train = train_df[self.feature_cols]
        y_train = train_df['energy_kwh']

        X_test = test_df[self.feature_cols]
        y_test = test_df['energy_kwh']

        # Fit model
        self.model.fit(X_train, y_train)
        self.is_trained = True

        # Predictions on chronological test set
        y_pred = self.model.predict(X_test)
        # Non-negative energy constraint
        y_pred = np.clip(y_pred, a_min=0.01, a_max=None)

        # Baseline model: 24-hour seasonal persistence (same hour yesterday)
        y_baseline = test_df['lag_24h'].values

        # Evaluation metrics
        mae_rf = float(mean_absolute_error(y_test, y_pred))
        rmse_rf = float(np.sqrt(mean_squared_error(y_test, y_pred)))
        r2_rf = float(r2_score(y_test, y_pred))

        mae_base = float(mean_absolute_error(y_test, y_baseline))
        rmse_base = float(np.sqrt(mean_squared_error(y_test, y_baseline)))

        # Improvement over baseline
        improvement = ((mae_base - mae_rf) / max(1e-5, mae_base)) * 100.0 if mae_base > 0 else 0.0

        self.metrics = {
            "mae": round(mae_rf, 4),
            "rmse": round(rmse_rf, 4),
            "r2_score": round(max(-1.0, min(1.0, r2_rf)), 4),
            "baseline_mae": round(mae_base, 4),
            "baseline_rmse": round(rmse_base, 4),
            "accuracy_improvement_pct": round(improvement, 2),
            "train_size": len(train_df),
            "test_size": len(test_df),
            "features_used": self.feature_cols
        }

        # Backtest comparison points (last 48 hours of test)
        backtest_points = []
        recent_test = test_df.tail(min(48, len(test_df)))
        recent_preds = y_pred[-len(recent_test):]

        for i, (_, row) in enumerate(recent_test.iterrows()):
            backtest_points.append({
                "timestamp": row['timestamp'].isoformat(),
                "actual_kwh": round(float(row['energy_kwh']), 3),
                "predicted_kwh": round(float(recent_preds[i]), 3),
                "is_forecast": False
            })

        return {
            "metrics": self.metrics,
            "backtest_points": backtest_points
        }

    def generate_future_forecast(self, df_hourly: pd.DataFrame, horizon_type: str = "next_day") -> Dict[str, Any]:
        """
        Autoregressively rolls predictions forward:
        - next_hour: 1 step
        - next_day: 24 steps
        - next_7_days: 168 steps
        - monthly: 720 steps
        """
        if not self.is_trained:
            self.train_and_evaluate(df_hourly)

        horizon_hours = {
            "next_hour": 1,
            "next_day": 24,
            "next_7_days": 168,
            "monthly": 720
        }.get(horizon_type, 24)

        df_feat = DataPreprocessingService.engineer_time_series_features(df_hourly)
        
        # Working buffer of recent records
        working_df = df_feat.copy()
        last_timestamp = working_df['timestamp'].max()

        future_records = []
        for step in range(1, horizon_hours + 1):
            next_time = last_timestamp + timedelta(hours=step)
            hour = next_time.hour
            dow = next_time.weekday()
            is_wknd = 1 if dow in [5, 6] else 0

            # Calculate cyclical features
            h_sin = np.sin(2 * np.pi * hour / 24.0)
            h_cos = np.cos(2 * np.pi * hour / 24.0)
            d_sin = np.sin(2 * np.pi * dow / 7.0)
            d_cos = np.cos(2 * np.pi * dow / 7.0)

            # Lags from the growing working_df
            lag1 = working_df['energy_kwh'].iloc[-1]
            lag2 = working_df['energy_kwh'].iloc[-2] if len(working_df) >= 2 else lag1
            lag24 = working_df['energy_kwh'].iloc[-24] if len(working_df) >= 24 else working_df['energy_kwh'].mean()

            # Rolling stats
            roll6_mean = working_df['energy_kwh'].tail(6).mean()
            roll6_std = working_df['energy_kwh'].tail(6).std() or 0.0
            roll24_mean = working_df['energy_kwh'].tail(24).mean()

            feat_row = pd.DataFrame([{
                'hour': hour,
                'day_of_week': dow,
                'is_weekend': is_wknd,
                'hour_sin': h_sin,
                'hour_cos': h_cos,
                'day_sin': d_sin,
                'day_cos': d_cos,
                'lag_1h': lag1,
                'lag_2h': lag2,
                'lag_24h': lag24,
                'rolling_mean_6h': roll6_mean,
                'rolling_mean_24h': roll24_mean,
                'rolling_std_6h': roll6_std
            }])

            pred_val = float(self.model.predict(feat_row[self.feature_cols])[0])
            pred_val = max(0.05, round(pred_val, 3))

            future_records.append({
                "timestamp": next_time.isoformat(),
                "predicted_kwh": pred_val,
                "actual_kwh": None,
                "is_forecast": True
            })

            # Append synthetic prediction to working buffer for autoregressive lag calculations
            new_row = {
                'timestamp': next_time,
                'energy_kwh': pred_val,
                'hour': hour,
                'day_of_week': dow,
                'is_weekend': is_wknd,
                'hour_sin': h_sin,
                'hour_cos': h_cos,
                'day_sin': d_sin,
                'day_cos': d_cos,
                'lag_1h': lag1,
                'lag_2h': lag2,
                'lag_24h': lag24,
                'rolling_mean_6h': roll6_mean,
                'rolling_mean_24h': roll24_mean,
                'rolling_std_6h': roll6_std
            }
            working_df = pd.concat([working_df, pd.DataFrame([new_row])], ignore_index=True)

        total_predicted = sum(r['predicted_kwh'] for r in future_records)

        warning = None
        if len(df_hourly) < 168 and horizon_type in ["next_7_days", "monthly"]:
            warning = f"Dataset contains {len(df_hourly)} hours (<7 days). Long-range forecasts carry higher uncertainty."

        return {
            "horizon_type": horizon_type,
            "total_predicted_kwh": round(total_predicted, 2),
            "metrics": self.metrics,
            "forecasts": future_records,
            "model_version": "RandomForest-v1.0",
            "warning_message": warning
        }

