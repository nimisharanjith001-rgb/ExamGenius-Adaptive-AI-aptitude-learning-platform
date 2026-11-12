export interface User {
  id: number;
  email: string;
  full_name: string;
  is_active: boolean;
  created_at: string;
}

export interface Dataset {
  id: number;
  name: string;
  filename: string;
  dataset_type: string;
  total_records: number;
  missing_records: number;
  duplicate_records: number;
  start_date: string | null;
  end_date: string | null;
  total_energy_kwh: number;
  avg_power_kw: number;
  max_power_kw: number;
  min_power_kw: number;
  data_quality_status: 'EXCELLENT' | 'GOOD' | 'WARNING' | 'INVALID';
  is_active: boolean;
  created_at: string;
}

export interface ValidationReport {
  total_records: number;
  valid_records: number;
  missing_records: number;
  duplicate_records: number;
  start_date: string;
  end_date: string;
  total_energy_kwh: number;
  avg_power_kw: number;
  max_power_kw: number;
  min_power_kw: number;
  sampling_rate: string;
  detected_format: string;
  columns_detected: string[];
  data_quality_status: string;
  preview_rows: Record<string, any>[];
  validation_messages: string[];
  hourly_records_count?: number;
}

export interface KPISummary {
  total_energy_kwh: number;
  avg_daily_kwh: number;
  estimated_monthly_bill: number;
  currency: string;
  max_power_kw: number;
  anomaly_count: number;
  predicted_next_day_kwh: number;
  consumption_change_pct: number;
  data_points_count: number;
}

export interface ConsumptionPoint {
  timestamp: string;
  energy_kwh: number;
  avg_power_kw: number;
  max_power_kw: number;
  sub_metering_1?: number;
  sub_metering_2?: number;
  sub_metering_3?: number;
}

export interface PeakHoursAnalysis {
  peak_hours: number[];
  off_peak_hours: number[];
  peak_avg_kwh: number;
  off_peak_avg_kwh: number;
  peak_percentage: number;
  hourly_breakdown: Array<{
    hour: number;
    avg_kwh: number;
    max_kwh: number;
    min_kwh: number;
    is_peak: boolean;
  }>;
}

export interface AnomalyItem {
  id?: number;
  timestamp: string;
  actual_kwh: number;
  baseline_kwh: number;
  deviation_pct: number;
  anomaly_score: number;
  severity: 'High' | 'Medium' | 'Low';
  explanation: string;
  anomaly_type: string;
}

export interface AnomalyResponse {
  total_anomalies: number;
  high_severity_count: number;
  medium_severity_count: number;
  low_severity_count: number;
  anomalies: AnomalyItem[];
  model_info: {
    algorithm: string;
    n_estimators: number;
    contamination_parameter: number;
    total_evaluated_hours: number;
    anomalies_detected: number;
    evaluated_at: string;
  };
}

export interface ForecastPoint {
  timestamp: string;
  predicted_kwh: number;
  actual_kwh?: number | null;
  is_forecast: boolean;
}

export interface ForecastResponse {
  horizon_type: string;
  total_predicted_kwh: number;
  metrics: {
    mae: number;
    rmse: number;
    r2_score: number;
    baseline_mae: number;
    baseline_rmse: number;
    accuracy_improvement_pct: number;
    train_size: number;
    test_size: number;
    features_used: string[];
  };
  forecasts: ForecastPoint[];
  model_version: string;
  warning_message?: string | null;
}

export interface ClusterItem {
  cluster_id: number;
  cluster_name: string;
  avg_kwh: number;
  percentage: number;
  description: string;
  typical_hours: number[];
}

export interface ClusterResponse {
  optimal_k: number;
  silhouette_score: number;
  clusters: ClusterItem[];
  hourly_cluster_matrix: Array<Record<string, any>>;
}

export interface BillCalculation {
  total_kwh: number;
  currency: string;
  tariff_per_kwh: number;
  energy_charge: number;
  fixed_charge: number;
  tax_amount: number;
  additional_charges: number;
  total_estimated_bill: number;
  average_cost_per_day: number;
  effective_rate_per_kwh: number;
  disclaimer: string;
}

export interface RecommendationItem {
  id?: number;
  title: string;
  category: string;
  explanation: string;
  evidence: string;
  practical_action: string;
  estimated_saving_kwh: number;
  estimated_saving_amount: number;
  confidence: string;
  priority: 'High' | 'Medium' | 'Low';
}

export interface RecommendationResponse {
  total_recommendations: number;
  potential_monthly_savings_kwh: number;
  potential_monthly_savings_amount: number;
  currency: string;
  items: RecommendationItem[];
}

export interface ApplianceItem {
  rank: number;
  id: string;
  name: string;
  category: string;
  icon: string;
  total_kwh: number;
  percentage: number;
  monthly_kwh: number;
  monthly_cost: number;
  currency: string;
  avg_watts: number;
  daily_hours: number;
  badge: string;
  saving_tip: string;
}

export interface ApplianceBreakdownResponse {
  appliances: ApplianceItem[];
  top_appliance: ApplianceItem | null;
  total_kwh: number;
  currency: string;
  total_monthly_bill_est: number;
}

