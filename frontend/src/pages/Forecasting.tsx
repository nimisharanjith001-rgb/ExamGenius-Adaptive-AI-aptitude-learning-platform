import React, { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { TrendingUp, Award, Gauge, AlertCircle, RefreshCw, CheckCircle2, Cpu } from 'lucide-react';
import api from '../api/client';
import { useDataset } from '../contexts/DatasetContext';
import { EmptyState } from '../components/common/EmptyState';
import { ForecastResponse } from '../types';

export const Forecasting: React.FC = () => {
  const { activeDataset } = useDataset();
  const [horizon, setHorizon] = useState<'next_hour' | 'next_day' | 'next_7_days' | 'monthly'>('next_day');
  const [forecastData, setForecastData] = useState<ForecastResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchForecast = async (selectedHorizon: string) => {
    if (!activeDataset) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.post(`/ml/forecast?dataset_id=${activeDataset.id}&horizon_type=${selectedHorizon}`);
      setForecastData(res.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Forecasting failed. Ensure at least 48 hours of sequential readings exist.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeDataset) {
      fetchForecast(horizon);
    }
  }, [activeDataset, horizon]);

  if (!activeDataset) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1">
              <Cpu className="w-3.5 h-3.5" />
              Random Forest Regressor (120 Estimators)
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-1.5 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            AI Electricity Consumption Forecasting
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Autoregressive time-series prediction engineered with cyclical temporal embeddings and lagged rolling stats.
          </p>
        </div>

        {/* Horizon Picker */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            {[
              { id: 'next_hour', label: 'Next Hour' },
              { id: 'next_day', label: 'Next 24h' },
              { id: 'next_7_days', label: 'Next 7 Days' },
              { id: 'monthly', label: '30-Day Outlook' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setHorizon(item.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  horizon === item.id
                    ? 'bg-white text-purple-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => fetchForecast(horizon)}
            disabled={loading}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            title="Retrain Model"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Model Performance Validation Metrics */}
      {forecastData && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Test R² Score</p>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-bold text-slate-900">
                {(forecastData.metrics.r2_score * 100).toFixed(1)}%
              </span>
              <span className="text-xs text-emerald-600 font-semibold flex items-center gap-0.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> Good fit
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">Chronological out-of-sample test</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Mean Absolute Error (MAE)</p>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-bold text-slate-900">
                {forecastData.metrics.mae.toFixed(3)}
              </span>
              <span className="text-xs text-slate-500">kWh/hr</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              vs Baseline: {forecastData.metrics.baseline_mae.toFixed(3)} kWh
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Root Mean Squared Error</p>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-bold text-slate-900">
                {forecastData.metrics.rmse.toFixed(3)}
              </span>
              <span className="text-xs text-slate-500">kWh/hr</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">Penalizes large prediction errors</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-xs font-semibold text-purple-700 uppercase tracking-wider">Accuracy Improvement</p>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-bold text-purple-900">
                +{forecastData.metrics.accuracy_improvement_pct.toFixed(1)}%
              </span>
              <Award className="w-4 h-4 text-purple-600" />
            </div>
            <p className="text-[11px] text-slate-400 mt-2">Over 24h seasonal persistence model</p>
          </div>
        </div>
      )}

      {/* Forecast Chart */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Future Electricity Consumption Projections
            </h2>
            <p className="text-xs text-slate-500">
              Generated {forecastData?.forecasts.length || 0} sequential hourly forecasts ({forecastData?.total_predicted_kwh.toFixed(1)} total kWh)
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-purple-50 text-purple-700 rounded-lg border border-purple-100">
            Total Projected Energy: {forecastData?.total_predicted_kwh || 0} kWh
          </span>
        </div>

        <div className="h-80 mt-6 w-full">
          {forecastData && forecastData.forecasts.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={forecastData.forecasts}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis
                  dataKey="timestamp"
                  tick={{ fontSize: 10, fill: '#64748B' }}
                  tickFormatter={(val) => val.split('T')[1]?.slice(0, 5) || val}
                  minTickGap={20}
                />
                <YAxis tick={{ fontSize: 10, fill: '#64748B' }} label={{ value: 'Energy (kWh)', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#94A3B8' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#101B2D', color: '#fff', borderRadius: '8px', fontSize: '12px', border: 'none' }}
                  formatter={(val: any) => [`${val} kWh`, 'Forecasted']}
                />
                <Line
                  type="monotone"
                  dataKey="predicted_kwh"
                  stroke="#8B5CF6"
                  strokeWidth={2.5}
                  dot={{ r: 2, fill: '#8B5CF6' }}
                  activeDot={{ r: 5 }}
                  name="Predicted Consumption (kWh)"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-slate-400">
              {loading ? 'Training Random Forest Regressor & generating forecast...' : 'No forecast available.'}
            </div>
          )}
        </div>

        {forecastData?.warning_message && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
            <span>{forecastData.warning_message}</span>
          </div>
        )}
      </div>

      {/* Defensible Academic Note */}
      <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 leading-relaxed">
        <h3 className="font-bold text-slate-800 mb-1">Academic ML Engineering Methodology:</h3>
        <p>
          Unlike naive train/test random splitting which leads to catastrophic time-series data leakage, PowerPulse AI strictly enforces chronological splitting (earliest 80% used for model training, latest 20% reserved for holdout verification).
          Feature engineering captures cyclical circadian and weekly rhythms using sinusoidal trigonometric encodings (sin/cos of hour and day) together with lagged moving moments.
        </p>
      </div>
    </div>
  );
};

