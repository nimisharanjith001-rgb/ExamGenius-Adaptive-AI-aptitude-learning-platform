import React, { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { PieChart as PieIcon, Layers, Award, Clock, Info, CheckCircle2 } from 'lucide-react';
import api from '../api/client';
import { useDataset } from '../contexts/DatasetContext';
import { EmptyState } from '../components/common/EmptyState';
import { ClusterResponse } from '../types';

const CLUSTER_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export const UsagePatterns: React.FC = () => {
  const { activeDataset } = useDataset();
  const [clusterData, setClusterData] = useState<ClusterResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!activeDataset) return;

    const fetchClusters = async () => {
      setLoading(true);
      try {
        const res = await api.post(`/ml/clustering?dataset_id=${activeDataset.id}`);
        setClusterData(res.data);
      } catch (err) {
        console.error('Clustering failed', err);
      } finally {
        setLoading(false);
      }
    };

    fetchClusters();
  }, [activeDataset]);

  if (!activeDataset) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5" />
              K-Means Clustering with Silhouette Optimization
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-1.5 flex items-center gap-2">
            <PieIcon className="w-5 h-5 text-blue-600" />
            Household Consumption Pattern Clustering
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Unsupervised machine learning partitions hourly consumption into distinct operational tiers.
          </p>
        </div>

        {clusterData && (
          <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200">
            <div>
              <p className="text-[10px] text-slate-400 font-semibold uppercase">Silhouette Score</p>
              <p className="text-sm font-bold text-slate-900">{clusterData.silhouette_score.toFixed(3)}</p>
            </div>
            <div className="h-6 w-px bg-slate-200" />
            <div>
              <p className="text-[10px] text-slate-400 font-semibold uppercase">Optimal Clusters</p>
              <p className="text-sm font-bold text-blue-600">k = {clusterData.optimal_k}</p>
            </div>
          </div>
        )}
      </div>

      {/* Cluster Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {clusterData?.clusters.map((c, i) => (
          <div
            key={c.cluster_id}
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span
                  className="text-xs font-bold px-2.5 py-0.5 rounded-full"
                  style={{
                    backgroundColor: `${CLUSTER_COLORS[i % CLUSTER_COLORS.length]}15`,
                    color: CLUSTER_COLORS[i % CLUSTER_COLORS.length],
                    border: `1px solid ${CLUSTER_COLORS[i % CLUSTER_COLORS.length]}30`
                  }}
                >
                  Cluster {c.cluster_id}
                </span>
                <span className="text-xs font-bold text-slate-900">{c.percentage}% of time</span>
              </div>

              <h2 className="text-sm font-bold text-slate-900 mt-3">{c.cluster_name}</h2>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-2xl font-extrabold text-slate-900">{c.avg_kwh}</span>
                <span className="text-xs text-slate-500 font-medium">kWh / hour</span>
              </div>

              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                {c.description}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-xs text-slate-500">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Typical Hours: <strong>{c.typical_hours.map(h => `${h}:00`).slice(0, 3).join(', ')}</strong></span>
            </div>
          </div>
        ))}
      </div>

      {/* 24-Hour Stacked Cluster Matrix Chart */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              24-Hour Diurnal Cluster Distribution
            </h2>
            <p className="text-xs text-slate-500">
              Frequency of each operational cluster across each hour of the day (0:00 to 23:00)
            </p>
          </div>
        </div>

        <div className="h-80 mt-6 w-full">
          {clusterData && clusterData.hourly_cluster_matrix.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={clusterData.hourly_cluster_matrix}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#64748B' }} tickFormatter={(h) => `${h}h`} />
                <YAxis tick={{ fontSize: 10, fill: '#64748B' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#101B2D', color: '#fff', borderRadius: '8px', fontSize: '12px', border: 'none' }}
                />
                <Legend />
                {clusterData.clusters.map((c, i) => (
                  <Bar
                    key={c.cluster_id}
                    dataKey={`cluster_${c.cluster_id}`}
                    name={c.cluster_name}
                    stackId="a"
                    fill={CLUSTER_COLORS[i % CLUSTER_COLORS.length]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-slate-400">
              Running K-Means cluster analysis...
            </div>
          )}
        </div>
      </div>

      {/* Methodological Context */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 leading-relaxed flex items-start gap-2.5">
        <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
        <div>
          <strong className="font-semibold text-slate-800">Cluster Interpretation Methodology: </strong>
          Clusters are sorted chronologically by mean energy draw rather than relying on arbitrary centroid labels. Standard scaling is applied prior to optimization to ensure voltage or temporal features do not distort energy distance metrics.
        </div>
      </div>
    </div>
  );
};

