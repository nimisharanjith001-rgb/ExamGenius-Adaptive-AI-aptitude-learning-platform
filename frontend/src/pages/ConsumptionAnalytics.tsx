import React, { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { BarChart3, Calendar, Layers, Clock, TrendingUp } from 'lucide-react';
import api from '../api/client';
import { useDataset } from '../contexts/DatasetContext';
import { EmptyState } from '../components/common/EmptyState';
import { ApplianceLeaderboard } from '../components/widgets/ApplianceLeaderboard';
import { ConsumptionPoint } from '../types';

const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#64748B'];

export const ConsumptionAnalytics: React.FC = () => {
  const { activeDataset, filterPeriod } = useDataset();
  const [aggregation, setAggregation] = useState<'hourly' | 'daily' | 'weekly' | 'monthly'>('daily');
  const [trendData, setTrendData] = useState<ConsumptionPoint[]>([]);
  const [patterns, setPatterns] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!activeDataset) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [trendRes, patRes] = await Promise.all([
          api.get(`/dashboard/consumption?dataset_id=${activeDataset.id}&filter_period=${filterPeriod}&aggregation=${aggregation}`),
          api.get(`/analytics/patterns?dataset_id=${activeDataset.id}`),
        ]);
        setTrendData(trendRes.data);
        setPatterns(patRes.data);
      } catch (err) {
        console.error('Failed to load consumption analytics', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeDataset, filterPeriod, aggregation]);

  if (!activeDataset) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-6">
      {/* Header & Aggregation Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            Consumption Analytics & Appliance Breakdown
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Analyze historical energy trends, time-of-use distributions, and sub-metered appliance shares.
          </p>
        </div>

        {/* Aggregation Buttons */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 self-start sm:self-auto">
          {(['hourly', 'daily', 'weekly', 'monthly'] as const).map((agg) => (
            <button
              key={agg}
              onClick={() => setAggregation(agg)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                aggregation === agg
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {agg}
            </button>
          ))}
        </div>
      </div>

      {/* Main Aggregated Trend Chart */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900 capitalize">
              {aggregation} Energy Consumption Profile
            </h2>
            <p className="text-xs text-slate-500">
              Active energy consumed in kilowatt-hours (kWh)
            </p>
          </div>
          <span className="text-xs font-medium px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg border border-blue-100">
            {trendData.length} observation points
          </span>
        </div>

        <div className="h-80 mt-5 w-full">
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              {aggregation === 'hourly' ? (
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="timestamp" tick={{ fontSize: 10, fill: '#64748B' }} minTickGap={25} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748B' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#101B2D', color: '#fff', borderRadius: '8px', fontSize: '12px', border: 'none' }}
                  />
                  <Line type="monotone" dataKey="energy_kwh" stroke="#2563EB" strokeWidth={2} dot={false} name="Energy (kWh)" />
                  <Line type="monotone" dataKey="avg_power_kw" stroke="#10B981" strokeWidth={1.5} dot={false} name="Avg Power (kW)" />
                  <Legend />
                </LineChart>
              ) : (
                <BarChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="timestamp" tick={{ fontSize: 10, fill: '#64748B' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748B' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#101B2D', color: '#fff', borderRadius: '8px', fontSize: '12px', border: 'none' }}
                  />
                  <Bar dataKey="energy_kwh" fill="#2563EB" radius={[4, 4, 0, 0]} name="Energy (kWh)" />
                  <Legend />
                </BarChart>
              )}
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-slate-400">
              Loading consumption records...
            </div>
          )}
        </div>
      </div>

      {/* Sub-Metering & Weekday/Weekend Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sub-Metering Distribution */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-blue-600" />
                <div>
                  <h2 className="text-base font-bold text-slate-900">Sub-Metering Appliance Distribution</h2>
                  <p className="text-xs text-slate-500">Breakdown of active energy across household sub-circuits</p>
                </div>
              </div>
            </div>

            <div className="h-64 mt-4 flex items-center justify-center">
              {patterns?.sub_metering_shares && patterns.sub_metering_shares.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={patterns.sub_metering_shares}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={4}
                      dataKey="kwh"
                      nameKey="name"
                    >
                      {patterns.sub_metering_shares.map((_: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#101B2D', color: '#fff', borderRadius: '8px', fontSize: '12px', border: 'none' }}
                      formatter={(val: any) => [`${val} kWh`, 'Consumed']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-xs text-slate-400">Analyzing sub-metering...</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100">
            {patterns?.sub_metering_shares?.map((item: any, i: number) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <div className="truncate">
                  <p className="font-semibold text-slate-800 truncate">{item.name}</p>
                  <p className="text-[11px] text-slate-500 font-mono">{item.kwh} kWh ({item.percentage}%)</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Weekday vs Weekend Comparison */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-600" />
                <div>
                  <h2 className="text-base font-bold text-slate-900">Weekday vs. Weekend Load Profiles</h2>
                  <p className="text-xs text-slate-500">Behavioral disparity between working days and weekends</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Weekday Average</p>
                <p className="text-3xl font-extrabold text-slate-900 mt-2">
                  {patterns?.weekday_avg_kwh || 0}
                  <span className="text-xs font-normal text-slate-500 ml-1">kWh/hr</span>
                </p>
                <p className="text-[11px] text-slate-500 mt-1">Monday – Friday</p>
              </div>

              <div className="p-5 rounded-xl bg-emerald-50/60 border border-emerald-200 text-center">
                <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Weekend Average</p>
                <p className="text-3xl font-extrabold text-emerald-950 mt-2">
                  {patterns?.weekend_avg_kwh || 0}
                  <span className="text-xs font-normal text-slate-500 ml-1">kWh/hr</span>
                </p>
                <p className="text-[11px] text-emerald-700 font-semibold mt-1">Saturday – Sunday</p>
              </div>
            </div>

            <div className="mt-6 p-4 rounded-xl border border-slate-100 bg-slate-50/50 text-xs text-slate-600 leading-relaxed">
              <strong>Insight: </strong>
              {patterns && patterns.weekend_avg_kwh > patterns.weekday_avg_kwh ? (
                <span>
                  Weekend consumption is{' '}
                  <strong className="text-emerald-700 font-bold">
                    {Math.round(((patterns.weekend_avg_kwh - patterns.weekday_avg_kwh) / patterns.weekday_avg_kwh) * 100)}% higher
                  </strong>{' '}
                  than weekday levels, driven by extended occupancy, entertainment, and laundry cycles.
                </span>
              ) : (
                <span>Weekday and weekend consumption levels remain relatively balanced.</span>
              )}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-400 text-center font-medium">
            Calculated across complete chronologically sorted time-series
          </div>
        </div>
      </div>

      {/* Everyday Home Appliance Breakdown & Device Leaderboard */}
      <ApplianceLeaderboard />
    </div>
  );
};

