import pandas as pd
import numpy as np
from datetime import datetime, timedelta

def generate_uci_sample(output_path: str, days: int = 21):
    """
    Generates realistic 1-minute UCI format electricity consumption data.
    """
    np.random.seed(42)
    start_time = datetime(2026, 1, 1, 0, 0, 0)
    total_minutes = days * 24 * 60
    
    timestamps = [start_time + timedelta(minutes=i) for i in range(total_minutes)]
    dates = [ts.strftime("%d/%m/%Y") for ts in timestamps]
    times = [ts.strftime("%H:%M:%S") for ts in timestamps]
    
    active_power = []
    reactive_power = []
    voltages = []
    intensities = []
    sub1 = []  # Kitchen: microwave, dishwasher
    sub2 = []  # Laundry room: washing machine, dryer
    sub3 = []  # Climate: electric water heater, air conditioning
    
    for i, ts in enumerate(timestamps):
        hour = ts.hour
        is_weekend = ts.weekday() >= 5
        
        # Base nighttime load: 0.15 - 0.35 kW (fridge, standbys)
        if 0 <= hour < 6:
            base_p = np.random.normal(0.25, 0.05)
            s1, s2, s3 = 0.0, 0.0, 0.0
            
            # Anomaly injection: Day 5 at 3:00 - 4:30 AM has an unusual 3.2 kW run (water heater malfunction / forgotten heater)
            if ts.day == 5 and 3 <= hour <= 4:
                base_p += 3.0
                s3 += 48.0
        # Morning peak: 6:00 - 9:00 AM (breakfast, shower, kitchen appliances)
        elif 6 <= hour < 9:
            base_p = np.random.normal(1.6, 0.4)
            s1 = np.random.choice([0.0, 15.0, 30.0], p=[0.5, 0.3, 0.2])
            s2 = np.random.choice([0.0, 25.0], p=[0.8, 0.2])
            s3 = np.random.choice([0.0, 18.0], p=[0.4, 0.6])
        # Daytime: 9:00 - 17:00 (moderate during week, higher on weekend)
        elif 9 <= hour < 17:
            if is_weekend:
                base_p = np.random.normal(1.4, 0.3)
                s1 = np.random.choice([0.0, 10.0, 20.0], p=[0.6, 0.3, 0.1])
                s2 = np.random.choice([0.0, 35.0], p=[0.7, 0.3]) # Weekend laundry
                s3 = np.random.choice([0.0, 16.0], p=[0.5, 0.5])
            else:
                base_p = np.random.normal(0.5, 0.15)
                s1, s2 = 0.0, 0.0
                s3 = np.random.choice([0.0, 10.0], p=[0.7, 0.3])
        # Evening peak: 17:00 - 22:30 (cooking, entertainment, AC/heating)
        elif 17 <= hour < 23:
            base_p = np.random.normal(2.2, 0.5)
            s1 = np.random.choice([0.0, 25.0, 50.0], p=[0.3, 0.4, 0.3]) # Kitchen cooking
            s2 = np.random.choice([0.0, 20.0], p=[0.8, 0.2])
            s3 = np.random.choice([0.0, 22.0], p=[0.3, 0.7])
            
            # Anomaly injection: Day 12 at 19:30 has sudden extreme peak (6.8 kW)
            if ts.day == 12 and hour == 19 and 20 <= ts.minute <= 45:
                base_p += 4.2
                s1 += 60.0
        # Late night: 23:00 - 24:00
        else:
            base_p = np.random.normal(0.4, 0.1)
            s1, s2 = 0.0, 0.0
            s3 = np.random.choice([0.0, 8.0], p=[0.7, 0.3])
            
        p = max(0.05, round(base_p, 3))
        q = max(0.01, round(p * np.random.uniform(0.08, 0.22), 3))
        volt = round(np.random.normal(232.0, 2.5), 2)
        current = round((p * 1000.0) / volt, 2)
        
        active_power.append(p)
        reactive_power.append(q)
        voltages.append(volt)
        intensities.append(current)
        sub1.append(int(s1))
        sub2.append(int(s2))
        sub3.append(int(s3))
        
    df = pd.DataFrame({
        "Date": dates,
        "Time": times,
        "Global_active_power": active_power,
        "Global_reactive_power": reactive_power,
        "Voltage": voltages,
        "Global_intensity": intensities,
        "Sub_metering_1": sub1,
        "Sub_metering_2": sub2,
        "Sub_metering_3": sub3
    })
    
    # Convert columns to object before introducing '?' string
    for col in ["Global_active_power", "Global_reactive_power", "Voltage"]:
        df[col] = df[col].astype(object)
        
    missing_idx = np.random.choice(len(df), size=int(len(df) * 0.002), replace=False)
    for col in ["Global_active_power", "Global_reactive_power", "Voltage"]:
        df.loc[missing_idx, col] = "?"
        
    df.to_csv(output_path, sep=";", index=False)
    print(f"Generated UCI sample at {output_path} with {len(df)} records.")

def generate_generic_sample(output_path: str, days: int = 14):
    np.random.seed(101)
    start_time = datetime(2026, 2, 1, 0, 0, 0)
    total_hours = days * 24
    
    timestamps = [start_time + timedelta(hours=i) for i in range(total_hours)]
    records = []
    
    for ts in timestamps:
        hour = ts.hour
        is_weekend = ts.weekday() >= 5
        
        if 0 <= hour < 6:
            p = np.random.normal(0.3, 0.06)
        elif 6 <= hour < 9:
            p = np.random.normal(1.8, 0.35)
        elif 9 <= hour < 17:
            p = np.random.normal(1.3 if is_weekend else 0.7, 0.2)
        elif 17 <= hour < 23:
            p = np.random.normal(2.5, 0.45)
        else:
            p = np.random.normal(0.6, 0.12)
            
        p = max(0.1, round(p, 3))
        kwh = round(p * 1.0, 3) # 1 hour interval
        volt = round(np.random.normal(230.0, 2.0), 1)
        reactive = round(p * 0.12, 3)
        
        records.append({
            "timestamp": ts.strftime("%Y-%m-%d %H:%M:%S"),
            "power_kw": p,
            "energy_kwh": kwh,
            "voltage": volt,
            "reactive_power": reactive
        })
        
    df = pd.DataFrame(records)
    df.to_csv(output_path, index=False)
    print(f"Generated Generic sample at {output_path} with {len(df)} records.")

def generate_template(output_path: str):
    df = pd.DataFrame([
        {"Date": "01/01/2026", "Time": "00:00:00", "Global_active_power": "0.320", "Global_reactive_power": "0.045", "Voltage": "234.2", "Global_intensity": "1.4", "Sub_metering_1": "0", "Sub_metering_2": "0", "Sub_metering_3": "0"},
        {"Date": "01/01/2026", "Time": "00:01:00", "Global_active_power": "0.318", "Global_reactive_power": "0.044", "Voltage": "234.1", "Global_intensity": "1.4", "Sub_metering_1": "0", "Sub_metering_2": "0", "Sub_metering_3": "0"},
        {"Date": "01/01/2026", "Time": "00:02:00", "Global_active_power": "0.322", "Global_reactive_power": "0.045", "Voltage": "234.0", "Global_intensity": "1.4", "Sub_metering_1": "0", "Sub_metering_2": "0", "Sub_metering_3": "0"}
    ])
    df.to_csv(output_path, sep=";", index=False)
    print(f"Generated Template at {output_path}")

if __name__ == "__main__":
    import os
    os.makedirs("/Users/premkumar/.gemini/antigravity/scratch/powerpulse-ai/sample_data", exist_ok=True)
    generate_uci_sample("/Users/premkumar/.gemini/antigravity/scratch/powerpulse-ai/sample_data/sample_uci_household_sample.csv", days=14)
    generate_generic_sample("/Users/premkumar/.gemini/antigravity/scratch/powerpulse-ai/sample_data/sample_generic_electricity.csv", days=14)
    generate_template("/Users/premkumar/.gemini/antigravity/scratch/powerpulse-ai/sample_data/sample_template.csv")
