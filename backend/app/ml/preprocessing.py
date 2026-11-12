import io
import pandas as pd
import numpy as np
from datetime import datetime
from typing import Tuple, Dict, Any, List

class DataPreprocessingService:
    @staticmethod
    def inspect_csv(content_bytes: bytes, filename: str) -> Dict[str, Any]:
        """
        Quick inspection of raw CSV bytes to detect separator, columns, sample rows, and format.
        """
        # Try decoding UTF-8 or latin-1
        try:
            text_sample = content_bytes[:20480].decode('utf-8')
        except UnicodeDecodeError:
            text_sample = content_bytes[:20480].decode('latin-1', errors='ignore')

        lines = [line.strip() for line in text_sample.split('\n') if line.strip()]
        if not lines:
            raise ValueError("The uploaded CSV file is empty.")

        first_line = lines[0]
        # Detect delimiter
        if ';' in first_line:
            delimiter = ';'
        elif ',' in first_line:
            delimiter = ','
        elif '\t' in first_line:
            delimiter = '\t'
        else:
            delimiter = ','

        # Read sample into dataframe
        df_sample = pd.read_csv(io.BytesIO(content_bytes), sep=delimiter, nrows=20, na_values=['?', 'NA', 'null', 'None', ''])
        columns = [str(c).strip() for c in df_sample.columns]

        # Check format
        is_uci = any('global_active_power' in col.lower() for col in columns) or \
                 (any('date' in col.lower() for col in columns) and any('time' in col.lower() for col in columns))

        detected_format = "UCI" if is_uci else "GENERIC"

        preview = df_sample.head(20).fillna('').to_dict(orient='records')

        return {
            "delimiter": delimiter,
            "columns": columns,
            "detected_format": detected_format,
            "preview_rows": preview,
            "total_bytes": len(content_bytes)
        }

    @staticmethod
    def process_and_validate_csv(content_bytes: bytes, filename: str) -> Tuple[pd.DataFrame, Dict[str, Any]]:
        """
        Parses CSV, handles missing values, cleanses timestamps,
        calculates energy kWh accurately:
        Energy in kWh = Power in kW * (dt_hours)
        and aggregates into hourly records.
        """
        inspection = DataPreprocessingService.inspect_csv(content_bytes, filename)
        delimiter = inspection["delimiter"]

        # Read full or chunked dataframe
        try:
            df_raw = pd.read_csv(
                io.BytesIO(content_bytes),
                sep=delimiter,
                na_values=['?', 'NA', 'null', 'None', '', ' '],
                low_memory=False
            )
        except Exception as e:
            raise ValueError(f"Failed to parse CSV file: {str(e)}")

        if df_raw.empty:
            raise ValueError("Uploaded dataset has 0 rows.")

        total_raw_rows = len(df_raw)
        missing_count = int(df_raw.isna().sum().sum())
        messages = []

        # Standardize column names (lowercase and strip)
        df = df_raw.copy()
        col_map = {col: str(col).strip() for col in df.columns}
        df.rename(columns=col_map, inplace=True)
        col_lower = {col: col.lower() for col in df.columns}

        # 1. Timestamp creation
        # Look for Date and Time separate columns (UCI) or single Timestamp/Datetime
        date_col = next((c for c in df.columns if col_lower[c] == 'date'), None)
        time_col = next((c for c in df.columns if col_lower[c] == 'time'), None)
        timestamp_col = next((c for c in df.columns if 'timestamp' in col_lower[c] or 'datetime' in col_lower[c]), None)

        if date_col and time_col:
            # UCI dataset format: Date DD/MM/YYYY, Time HH:MM:SS
            # Combine Date and Time
            df['datetime_str'] = df[date_col].astype(str).str.strip() + ' ' + df[time_col].astype(str).str.strip()
            # Try dayfirst=True
            df['timestamp'] = pd.to_datetime(df['datetime_str'], dayfirst=True, errors='coerce')
        elif timestamp_col:
            df['timestamp'] = pd.to_datetime(df[timestamp_col], errors='coerce')
        elif date_col:
            df['timestamp'] = pd.to_datetime(df[date_col], dayfirst=True, errors='coerce')
        else:
            raise ValueError("CSV must contain either ('Date' and 'Time') columns or a 'timestamp' column.")

        # Drop invalid timestamps
        invalid_timestamps = int(df['timestamp'].isna().sum())
        if invalid_timestamps > 0:
            messages.append(f"Removed {invalid_timestamps} rows with invalid date/time formats.")
            df = df.dropna(subset=['timestamp'])

        if df.empty:
            raise ValueError("No valid chronological records found in dataset after parsing timestamps.")

        # Check duplicates
        duplicate_count = int(df.duplicated(subset=['timestamp']).sum())
        if duplicate_count > 0:
            messages.append(f"Removed {duplicate_count} duplicate timestamp records.")
            df = df.drop_duplicates(subset=['timestamp'], keep='first')

        # Sort chronologically
        df = df.sort_values(by='timestamp').reset_index(drop=True)

        # 2. Power mapping
        # Look for Global_active_power or power / kwh / kw
        col_lower = {col: str(col).lower() for col in df.columns}
        power_col = next((c for c in df.columns if 'global_active_power' in col_lower[c] or 'power_kw' in col_lower[c] or 'active_power' in col_lower[c]), None)
        kwh_col = next((c for c in df.columns if 'kwh' in col_lower[c] or 'energy_kwh' in col_lower[c]), None)
        voltage_col = next((c for c in df.columns if 'voltage' in col_lower[c]), None)
        reactive_col = next((c for c in df.columns if 'global_reactive_power' in col_lower[c] or 'reactive' in col_lower[c]), None)
        sub1_col = next((c for c in df.columns if 'sub_metering_1' in col_lower[c]), None)
        sub2_col = next((c for c in df.columns if 'sub_metering_2' in col_lower[c]), None)
        sub3_col = next((c for c in df.columns if 'sub_metering_3' in col_lower[c]), None)

        if power_col is None and kwh_col is None:
            # Fallback check first numeric column
            numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
            if numeric_cols:
                power_col = numeric_cols[0]
                messages.append(f"Auto-mapped column '{power_col}' as active power (kW).")
            else:
                raise ValueError("Could not find an active power column (e.g. 'Global_active_power' or 'power_kw').")

        # Convert numeric values safely
        if power_col:
            df['power_kw'] = pd.to_numeric(df[power_col], errors='coerce')
        elif kwh_col:
            # If directly provided in kWh
            df['kwh_raw'] = pd.to_numeric(df[kwh_col], errors='coerce')

        # Detect impossible or negative readings
        if 'power_kw' in df.columns:
            invalid_power = (df['power_kw'] < 0) | (df['power_kw'] > 50.0) # >50kW is implausible for single household
            if invalid_power.sum() > 0:
                messages.append(f"Cleaned {int(invalid_power.sum())} implausible power readings (<0 or >50 kW).")
                df.loc[invalid_power, 'power_kw'] = np.nan
            # Forward-fill / linear interpolate missing power readings
            df['power_kw'] = df['power_kw'].interpolate(method='linear').bfill().ffill()
        else:
            df['kwh_raw'] = df['kwh_raw'].interpolate(method='linear').bfill().ffill()

        # Handle voltage
        if voltage_col:
            df['voltage'] = pd.to_numeric(df[voltage_col], errors='coerce')
            invalid_voltage = (df['voltage'] < 100) | (df['voltage'] > 300)
            df.loc[invalid_voltage, 'voltage'] = np.nan
            df['voltage'] = df['voltage'].interpolate().bfill().ffill()
        else:
            df['voltage'] = 230.0

        # Handle reactive power
        if reactive_col:
            df['reactive_power'] = pd.to_numeric(df[reactive_col], errors='coerce').fillna(0.0)
        else:
            df['reactive_power'] = 0.0

        # Sub-metering columns (UCI Sub-metering 1, 2, 3 are in watt-hour of active energy per minute)
        # 1 watt-hour = 0.001 kWh
        for sub_name, col_ref in [('sub_metering_1', sub1_col), ('sub_metering_2', sub2_col), ('sub_metering_3', sub3_col)]:
            if col_ref:
                df[sub_name] = pd.to_numeric(df[col_ref], errors='coerce').fillna(0.0) * 0.001
            else:
                df[sub_name] = 0.0

        # Compute sampling rate
        time_deltas = df['timestamp'].diff().dropna()
        if not time_deltas.empty:
            median_delta_sec = time_deltas.median().total_seconds()
            if median_delta_sec <= 90:
                sampling_rate = "1-minute"
            elif median_delta_sec <= 900:
                sampling_rate = "15-minute"
            elif median_delta_sec <= 3600:
                sampling_rate = "1-hour"
            else:
                sampling_rate = f"{int(median_delta_sec // 60)}-minute"
        else:
            median_delta_sec = 60
            sampling_rate = "1-minute"

        # 3. Energy Integration (kWh = Power kW * time_in_hours)
        if 'power_kw' in df.columns:
            # Time delta in hours for each interval
            dt_hours = df['timestamp'].diff().dt.total_seconds().fillna(median_delta_sec) / 3600.0
            # Guard against unreasonable gaps (e.g. multi-day gaps should not accumulate thousands of kWh)
            dt_hours = dt_hours.clip(upper=1.0)
            df['energy_kwh'] = df['power_kw'] * dt_hours
        else:
            df['energy_kwh'] = df['kwh_raw']
            df['power_kw'] = df['energy_kwh'] / (median_delta_sec / 3600.0)

        # 4. Hourly Aggregation
        # We resample by 1 hour for clean, fast, professional analysis
        df_hourly = df.set_index('timestamp').resample('1h').agg({
            'energy_kwh': 'sum',
            'power_kw': ['mean', 'max', 'min'],
            'voltage': 'mean',
            'reactive_power': 'mean',
            'sub_metering_1': 'sum',
            'sub_metering_2': 'sum',
            'sub_metering_3': 'sum'
        }).dropna()

        # Flatten multi-index
        df_hourly.columns = [
            'energy_kwh',
            'avg_power_kw',
            'max_power_kw',
            'min_power_kw',
            'voltage',
            'reactive_power',
            'sub_metering_1',
            'sub_metering_2',
            'sub_metering_3'
        ]
        df_hourly = df_hourly.reset_index()

        # Time features
        df_hourly['hour'] = df_hourly['timestamp'].dt.hour
        df_hourly['day_of_week'] = df_hourly['timestamp'].dt.dayofweek
        df_hourly['is_weekend'] = df_hourly['day_of_week'].isin([5, 6]).astype(int)

        # Quality metrics
        total_energy = float(df_hourly['energy_kwh'].sum())
        avg_power = float(df_hourly['avg_power_kw'].mean())
        max_power = float(df_hourly['max_power_kw'].max())
        min_power = float(df_hourly['min_power_kw'].min())
        start_ts = df_hourly['timestamp'].min().isoformat()
        end_ts = df_hourly['timestamp'].max().isoformat()

        # Assess quality status
        if missing_count / max(1, total_raw_rows) > 0.3:
            quality_status = "WARNING"
            messages.append("High volume of missing values detected (>30%), interpolated.")
        elif total_raw_rows < 24:
            quality_status = "WARNING"
            messages.append("Dataset spans fewer than 24 hours. Longer historical data is recommended for ML.")
        else:
            quality_status = "EXCELLENT"

        summary_report = {
            "total_records": total_raw_rows,
            "valid_records": len(df),
            "missing_records": missing_count,
            "duplicate_records": duplicate_count,
            "start_date": start_ts,
            "end_date": end_ts,
            "total_energy_kwh": round(total_energy, 3),
            "avg_power_kw": round(avg_power, 3),
            "max_power_kw": round(max_power, 3),
            "min_power_kw": round(min_power, 3),
            "sampling_rate": sampling_rate,
            "detected_format": inspection["detected_format"],
            "columns_detected": inspection["columns"],
            "data_quality_status": quality_status,
            "preview_rows": inspection["preview_rows"],
            "validation_messages": messages,
            "hourly_records_count": len(df_hourly)
        }

        return df_hourly, summary_report

    @staticmethod
    def engineer_time_series_features(df: pd.DataFrame) -> pd.DataFrame:
        """
        Creates rich temporal and lag features for ML models:
        - hour, day_of_week, day_of_month, month, is_weekend
        - lag features: lag_1h, lag_2h, lag_24h, lag_168h (1 week)
        - rolling features: rolling_mean_6h, rolling_std_6h, rolling_mean_24h, rolling_std_24h
        - deviation from rolling baseline
        """
        data = df.copy().sort_values('timestamp').reset_index(drop=True)

        data['hour'] = data['timestamp'].dt.hour
        data['day_of_week'] = data['timestamp'].dt.dayofweek
        data['day_of_month'] = data['timestamp'].dt.day
        data['month'] = data['timestamp'].dt.month
        data['is_weekend'] = data['day_of_week'].isin([5, 6]).astype(int)

        # Cyclical encoding for hour (preserves 23:00 -> 00:00 continuity)
        data['hour_sin'] = np.sin(2 * np.pi * data['hour'] / 24.0)
        data['hour_cos'] = np.cos(2 * np.pi * data['hour'] / 24.0)
        data['day_sin'] = np.sin(2 * np.pi * data['day_of_week'] / 7.0)
        data['day_cos'] = np.cos(2 * np.pi * data['day_of_week'] / 7.0)

        # Lags
        data['lag_1h'] = data['energy_kwh'].shift(1)
        data['lag_2h'] = data['energy_kwh'].shift(2)
        data['lag_24h'] = data['energy_kwh'].shift(24)

        # Rolling statistics (using past values only to prevent data leakage)
        # Closed='left' ensures the current hour is not included in its own rolling window
        data['rolling_mean_6h'] = data['energy_kwh'].shift(1).rolling(window=6, min_periods=1).mean()
        data['rolling_std_6h'] = data['energy_kwh'].shift(1).rolling(window=6, min_periods=1).std().fillna(0.0)
        data['rolling_mean_24h'] = data['energy_kwh'].shift(1).rolling(window=24, min_periods=1).mean()
        data['rolling_std_24h'] = data['energy_kwh'].shift(1).rolling(window=24, min_periods=1).std().fillna(0.0)

        # Deviation from 24h rolling mean
        data['deviation_from_mean'] = data['energy_kwh'] - data['rolling_mean_24h']

        # Forward fill initial shift/lag NaNs with available values
        data['lag_1h'] = data['lag_1h'].bfill().fillna(data['energy_kwh'])
        data['lag_2h'] = data['lag_2h'].bfill().fillna(data['energy_kwh'])
        data['lag_24h'] = data['lag_24h'].bfill().fillna(data['energy_kwh'])
        data['rolling_mean_6h'] = data['rolling_mean_6h'].bfill().fillna(data['energy_kwh'])
        data['rolling_mean_24h'] = data['rolling_mean_24h'].bfill().fillna(data['energy_kwh'])

        return data
