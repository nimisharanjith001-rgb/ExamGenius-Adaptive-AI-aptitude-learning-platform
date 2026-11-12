import React, { useEffect, useState } from 'react';
import {
  Zap,
  Calendar,
  AlertTriangle,
  TrendingUp,
  Receipt,
  Flame,
  ArrowRight,
  ShieldAlert,
  Lightbulb,
  Clock,
  Sparkles
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import api from '../api/client';
import { useDataset } from '../contexts/DatasetContext';
import { KPICard } from '../components/common/KPICard';
import { EmptyState } from '../components/common/EmptyState';
import { ApplianceLeaderboard } from '../components/widgets/ApplianceLeaderboard';
import { KPISummary, ConsumptionPoint, PeakHoursAnalysis, AnomalyItem } from '../types';

export const Dashboard: React.FC = () => {
  const { activeDataset, filterPeriod } = useDataset();
  const [summary, setSummary] = useState<KPISummary | null>(null);
  const [trendData, setTrendData] = useState<ConsumptionPoint[]>([]);
  const [peakAnalysis, setPeakAnalysis] = useState<PeakHoursAnalysis | null>(null);
  const [recentAnomalies, setRecentAnomalies] = useState<AnomalyItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!activeDataset) return;

    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const [sumRes, trendRes, peakRes] = await Promise.all([
          api.get(`/dashboard/summary?dataset_id=${activeDataset.id}&filter_period=${filterPeriod}`),
          api.get(`/dashboard/consumption?dataset_id=${activeDataset.id}&filter_period=${filterPeriod}&aggregation=hourly`),
          api.get(`/dashboard/peak-hours?dataset_id=${activeDataset.id}`),
        ]);

        setSummary(sumRes.data);
        setTrendData(trendRes.data);
        setPeakAnalysis(peakRes.data);

        // Fetch recent anomalies if available
        try {
          const anomRes = await api.post(`/ml/anomaly-detection?dataset_id=${activeDataset.id}`);
          setRecentAnomalies(anomRes.data.anomalies.slice(0, 4));
        } catch {
          // ML run optional
        }
      } catch (err) {
        console.error('Dashboard load failed', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [activeDataset, filterPeriod]);

  if (!activeDataset) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-6">
      {/* Welcome & Dataset Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-[#101B2D] to-[#1E293B] text-white p-6 rounded-2xl shadow-sm border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
              Live Analytics Mode
            </span>
            <span className="text-xs text-slate-400">
              {activeDataset.dataset_type} Format • {activeDataset.total_records.toLocaleString()} readings
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold mt-2">
            Household Electricity Consumption Overview
          </h1>
          <p className="text-xs text-slate-300 mt-0.5">
            Monitoring active dataset: <span className="font-semibold text-white">{activeDataset.name}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/forecasting"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md shadow-blue-600/30 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Generate Forecast</span>
          </Link>
          <Link
            to="/datasets"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition-all"
          >
            <span>Switch Dataset</span>
          </Link>
        </div>
      </div>

      {/* SECTION 1: KPI CARDS (6 Key Metrics) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KPICard
          title="Total Energy"
          value={summary ? summary.total_energy_kwh.toLocaleString() : '0'}
          unit="kWh"
          icon={Zap}
          changePct={summary?.consumption_change_pct}
          iconColor="text-blue-600"
          iconBgColor="bg-blue-50"
        />
        <KPICard
          title="Daily Average"
          value={summary ? summary.avg_daily_kwh : '0'}
          unit="kWh/day"
          icon={Calendar}
          subtitle="Typical 24h consumption"
          iconColor="text-emerald-600"
          iconBgColor="bg-emerald-50"
        />
        <KPICard
          title="Estimated Bill"
          value={summary ? `${summary.currency} ${summary.estimated_monthly_bill.toLocaleString()}` : '₹ 0'}
          unit="monthly"
          icon={Receipt}
          subtitle="Based on slab tariff"
          iconColor="text-indigo-600"
          iconBgColor="bg-indigo-50"
        />
        <KPICard
          title="Peak Demand"
          value={summary ? summary.max_power_kw : '0'}
          unit="kW"
          icon={Flame}
          subtitle="Max instantaneous load"
          iconColor="text-amber-600"
          iconBgColor="bg-amber-50"
        />
        <KPICard
          title="Detected Anomalies"
          value={summary ? summary.anomaly_count : '0'}
          unit="events"
          icon={AlertTriangle}
          subtitle="Isolation Forest flags"
          iconColor="text-red-600"
          iconBgColor="bg-red-50"
        />
        <KPICard
          title="Tomorrow Forecast"
          value={summary ? summary.predicted_next_day_kwh : '0'}
          unit="kWh est."
          icon={TrendingUp}
          subtitle="Random Forest Regressor"
          iconColor="text-purple-600"
          iconBgColor="bg-purple-50"
        />
      </div>

      {/* SECTION 2: MAIN CONSUMPTION CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main trend area chart (2 columns) */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-900">Energy Consumption Trend</h2>
              <p className="text-xs text-slate-500">Hourly integrated consumption (kWh) over time</p>
            </div>
            <Link to="/analytics" className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
              <span>Detailed Breakdown</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="h-72 mt-4 w-full">
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="energyGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563EB" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis
                    dataKey="timestamp"
                    tick={{ fontSize: 10, fill: '#64748B' }}
                    tickFormatter={(val) => val.split(' ')[1] || val}
                    minTickGap={20}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#64748B' }}
                    label={{ value: 'Energy (kWh)', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#94A3B8' }}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#101B2D', color: '#fff', borderRadius: '8px', fontSize: '12px', border: 'none' }}
                    formatter={(val: any) => [`${val} kWh`, 'Energy']}
                  />
                  <Area
                    type="monotone"
                    dataKey="energy_kwh"
                    stroke="#2563EB"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#energyGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                Loading consumption records...
              </div>
            )}
          </div>
        </div>

        {/* 24-Hour Distribution Bar Chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <div className="pb-4 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">24-Hour Usage Profile</h2>
            <p className="text-xs text-slate-500">Average consumption per hour of day</p>
          </div>

          <div className="h-72 mt-4 w-full flex-1">
            {peakAnalysis?.hourly_breakdown && peakAnalysis.hourly_breakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={peakAnalysis.hourly_breakdown}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#64748B' }} tickFormatter={(h) => `${h}h`} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748B' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#101B2D', color: '#fff', borderRadius: '8px', fontSize: '12px', border: 'none' }}
                    formatter={(val: any) => [`${val} kWh`, 'Avg Hourly']}
                  />
                  <Bar
                    dataKey="avg_kwh"
                    radius={[4, 4, 0, 0]}
                  >
                    {peakAnalysis.hourly_breakdown.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.is_peak ? '#EA580C' : '#1E293B'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                Aggregating 24h profile...
              </div>
            )}
          </div>

          {peakAnalysis && (
            <div className="mt-2 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
              <span className="flex items-center gap-1 font-semibold text-amber-700">
                <Clock className="w-3.5 h-3.5" />
                Peak Window: {peakAnalysis.peak_hours.join(', ')}:00
              </span>
              <span className="font-bold text-slate-900">{peakAnalysis.peak_percentage}% of load</span>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 2.5: HOME APPLIANCE & DEVICE BREAKDOWN */}
      <ApplianceLeaderboard />

      {/* SECTION 3: ANOMALY NOTIFICATIONS & ACTIONABLE INSIGHTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Anomaly Alerts */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Recent Anomaly Signals</h2>
                <p className="text-xs text-slate-500">Unusual consumption patterns flagged by Isolation Forest</p>
              </div>
            </div>
            <Link to="/anomalies" className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="mt-4 space-y-3">
            {recentAnomalies.length > 0 ? (
              recentAnomalies.map((anom, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-900">{anom.anomaly_type}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        anom.severity === 'High'
                          ? 'bg-red-100 text-red-700 border border-red-200'
                          : anom.severity === 'Medium'
                          ? 'bg-amber-100 text-amber-700 border border-amber-200'
                          : 'bg-blue-100 text-blue-700 border border-blue-200'
                      }`}
                    >
                      {anom.severity} Severity
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{anom.explanation}</p>
                  <div className="mt-2 flex items-center gap-4 text-[11px] text-slate-500 font-mono">
                    <span>{new Date(anom.timestamp).toLocaleString()}</span>
                    <span>Actual: <strong className="text-slate-800">{anom.actual_kwh} kWh</strong></span>
                    <span>Baseline: <strong className="text-slate-800">{anom.baseline_kwh} kWh</strong></span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-xs text-slate-400">
                Run Anomaly Detection on the Anomaly page to inspect consumption outliers.
              </div>
            )}
          </div>
        </div>

        {/* Energy-Saving Recommendations Preview */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Lightbulb className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Priority Saving Recommendations</h2>
                  <p className="text-xs text-slate-500">Analytics-backed optimizations to lower consumption</p>
                </div>
              </div>
              <Link to="/recommendations" className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                <span>All Tips</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="mt-4 space-y-3">
              <div className="p-3.5 rounded-xl border border-emerald-100 bg-emerald-50/40">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-emerald-950">Shift Laundry Cycles from Evening Peak</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    High Impact
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Moving washing machine and dishwasher runs from 7:00 PM to morning off-peak hours cuts simultaneous load and avoids potential demand charges.
                </p>
                <div className="mt-2 text-xs font-semibold text-emerald-700">
                  Estimated Savings: ~35–45 kWh / month
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-blue-100 bg-blue-50/40">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-blue-950">Inspect Overnight Standby Loads</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                    Phantom Load
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Continuous base load between 1:00 AM and 5:00 AM averages over 0.25 kW. Use smart power strips to power down dormant entertainment hubs and desktop chargers.
                </p>
                <div className="mt-2 text-xs font-semibold text-blue-700">
                  Estimated Savings: ~20–30 kWh / month
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-center">
            <Link
              to="/recommendations"
              className="inline-flex items-center justify-center gap-2 w-full py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              <span>Explore Detailed Action Plan & Calculations</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

