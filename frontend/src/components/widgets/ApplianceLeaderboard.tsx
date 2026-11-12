import React, { useEffect, useState } from 'react';
import {
  Laptop,
  Tv,
  Wind,
  Flame,
  Shirt,
  Utensils,
  Lightbulb,
  Wifi,
  Package,
  Crown,
  Zap,
  Clock,
  ArrowUpRight,
  Sparkles
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import api from '../../api/client';
import { useDataset } from '../../contexts/DatasetContext';
import { ApplianceBreakdownResponse, ApplianceItem } from '../../types';

const ICON_MAP: Record<string, React.ElementType> = {
  Laptop: Laptop,
  Tv: Tv,
  Wind: Wind,
  Flame: Flame,
  Box: Package,
  Shirt: Shirt,
  Utensils: Utensils,
  Lightbulb: Lightbulb,
  Wifi: Wifi,
};

const BAR_COLORS = [
  '#2563EB', // Blue
  '#0284C7', // Sky
  '#F59E0B', // Amber
  '#10B981', // Emerald
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#6366F1', // Indigo
  '#14B8A6', // Teal
  '#64748B', // Slate
];

export const ApplianceLeaderboard: React.FC = () => {
  const { activeDataset } = useDataset();
  const [data, setData] = useState<ApplianceBreakdownResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedAppliance, setSelectedAppliance] = useState<ApplianceItem | null>(null);

  useEffect(() => {
    if (!activeDataset) return;
    const fetchAppliances = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/analytics/appliances?dataset_id=${activeDataset.id}`);
        setData(res.data);
        if (res.data.top_appliance) {
          setSelectedAppliance(res.data.top_appliance);
        }
      } catch (err) {
        console.error('Failed to load appliance data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAppliances();
  }, [activeDataset]);

  if (!activeDataset || !data || data.appliances.length === 0) {
    return null;
  }

  const top = data.top_appliance;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
      {/* Title & Top Device Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              Device Disaggregation & NILM Intelligence
            </span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 mt-1.5 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            Home Device & Appliance Energy Breakdown
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time power analysis showing which home devices (Laptop, TV, AC, Geyser, Fridge, etc.) consume the most electricity.
          </p>
        </div>

        {/* #1 Most Used Appliance Highlight Card */}
        {top && (
          <div className="bg-gradient-to-r from-amber-500/10 to-blue-500/10 border border-amber-200/80 p-3.5 rounded-2xl flex items-center gap-3.5 self-start lg:self-auto">
            <div className="w-11 h-11 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20 shrink-0">
              <Crown className="w-6 h-6 fill-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded">
                  #1 Highest Consumer
                </span>
                <span className="text-xs font-bold text-slate-900">{top.name}</span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Consumes <strong className="text-slate-900">{top.percentage}%</strong> of home power ({top.total_kwh} kWh • {top.currency}{top.monthly_cost}/mo)
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Main Grid: Chart + Detailed Device List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Visual Ranking Bar Chart (5 cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Device Consumption Share (%)
            </h3>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.appliances}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                  <XAxis type="number" tick={{ fontSize: 10, fill: '#64748B' }} unit="%" />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 10, fill: '#334155' }}
                    width={90}
                    tickFormatter={(name) => name.split(' ')[0]}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#101B2D', color: '#fff', borderRadius: '8px', fontSize: '12px', border: 'none' }}
                    formatter={(val: any, name: any, item: any) => [
                      `${val}% (${item.payload.total_kwh} kWh - ${item.payload.currency}${item.payload.monthly_cost}/mo)`,
                      'Share'
                    ]}
                  />
                  <Bar dataKey="percentage" radius={[0, 4, 4, 0]}>
                    {data.appliances.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={BAR_COLORS[index % BAR_COLORS.length]}
                        cursor="pointer"
                        onClick={() => setSelectedAppliance(entry)}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Selected Device Deep-Dive Insight Box */}
          {selectedAppliance && (
            <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <div className="flex items-center justify-between font-bold text-slate-900">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-600" />
                  {selectedAppliance.name}
                </span>
                <span className="text-blue-600 font-mono">
                  {selectedAppliance.currency} {selectedAppliance.monthly_cost} / month
                </span>
              </div>
              <p className="text-slate-500 mt-1 leading-relaxed">
                <strong>Energy Tip: </strong>{selectedAppliance.saving_tip}
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Full Ranked Device Table (7 cols) */}
        <div className="lg:col-span-7 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3 font-semibold">Rank & Device</th>
                <th className="py-2.5 px-3 font-semibold">Power (W)</th>
                <th className="py-2.5 px-3 font-semibold">Avg Hours/Day</th>
                <th className="py-2.5 px-3 font-semibold">Total Energy</th>
                <th className="py-2.5 px-3 font-semibold">Share</th>
                <th className="py-2.5 px-3 font-semibold text-right">Est. Monthly Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {data.appliances.map((app) => {
                const IconComponent = ICON_MAP[app.icon] || Zap;
                const isSelected = selectedAppliance?.id === app.id;

                return (
                  <tr
                    key={app.id}
                    onClick={() => setSelectedAppliance(app)}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? 'bg-blue-50/70 font-semibold' : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        <span className={`w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-bold ${
                          app.rank === 1
                            ? 'bg-amber-100 text-amber-800'
                            : app.rank === 2
                            ? 'bg-slate-200 text-slate-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}>
                          {app.rank}
                        </span>

                        <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
                          <IconComponent className="w-4 h-4" />
                        </div>

                        <div>
                          <p className="font-bold text-slate-900 leading-tight">{app.name}</p>
                          <span className="text-[10px] text-slate-400">{app.category}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3 font-mono text-slate-600">
                      {app.avg_watts} W
                    </td>

                    <td className="py-3 px-3 font-mono text-slate-600">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {app.daily_hours} hrs
                      </span>
                    </td>

                    <td className="py-3 px-3 font-mono font-semibold text-slate-800">
                      {app.total_kwh} kWh
                    </td>

                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-12 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full bg-blue-600 rounded-full"
                            style={{ width: `${Math.min(100, app.percentage * 2)}%` }}
                          />
                        </div>
                        <span className="font-bold text-slate-900 text-[11px]">{app.percentage}%</span>
                      </div>
                    </td>

                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                      {app.currency} {app.monthly_cost.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

