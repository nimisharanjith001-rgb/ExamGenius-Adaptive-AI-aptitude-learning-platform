import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ShieldAlert,
  Search,
  Filter,
  RefreshCw,
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import api from '../api/client';
import { useDataset } from '../contexts/DatasetContext';
import { EmptyState } from '../components/common/EmptyState';
import { AnomalyResponse, AnomalyItem } from '../types';

export const AnomalyDetection: React.FC = () => {
  const { activeDataset } = useDataset();
  const [anomalyData, setAnomalyData] = useState<AnomalyResponse | null>(null);
  const [contamination, setContamination] = useState<number>(0.03);
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const runDetection = async (contam: number) => {
    if (!activeDataset) return;
    setLoading(true);
    try {
      const res = await api.post(`/ml/anomaly-detection?dataset_id=${activeDataset.id}&contamination=${contam}`);
      setAnomalyData(res.data);
    } catch (err) {
      console.error('Anomaly detection failed', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeDataset) {
      runDetection(contamination);
    }
  }, [activeDataset]);

  if (!activeDataset) {
    return <EmptyState />;
  }

  const filteredAnomalies = anomalyData?.anomalies.filter((item) => {
    const matchesSeverity = selectedSeverity === 'all' || item.severity.toLowerCase() === selectedSeverity.toLowerCase();
    const matchesSearch = item.explanation.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.anomaly_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.timestamp.includes(searchQuery);
    return matchesSeverity && matchesSearch;
  }) || [];

  return (
    <div className="space-y-6">
      {/* Header & Contamination Slider */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5" />
              Isolation Forest Algorithm (100 Trees)
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-1.5 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            AI Anomaly & Irregularity Detector
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Detects uncharacteristic power surges, unexpected overnight appliance runs, and baseline deviations.
          </p>
        </div>

        {/* Contamination Sensitivity Control */}
        <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
              <span>Sensitivity (Contamination)</span>
              <span className="text-red-600 font-mono">{(contamination * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0.01"
              max="0.08"
              step="0.01"
              value={contamination}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setContamination(val);
                runDetection(val);
              }}
              className="w-36 sm:w-44 accent-red-600 cursor-pointer mt-1"
            />
          </div>

          <button
            onClick={() => runDetection(contamination)}
            disabled={loading}
            className="p-2 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 text-slate-700 transition-colors shadow-sm"
            title="Re-run Detection"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Severity Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Flagged Hours</p>
          <p className="text-2xl font-bold text-slate-900 mt-2">{anomalyData?.total_anomalies || 0}</p>
          <p className="text-[11px] text-slate-400 mt-1">From {activeDataset.total_records.toLocaleString()} raw records</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-red-500">
          <p className="text-xs font-semibold text-red-600 uppercase tracking-wider">High Severity</p>
          <p className="text-2xl font-bold text-red-950 mt-2">{anomalyData?.high_severity_count || 0}</p>
          <p className="text-[11px] text-slate-400 mt-1">&gt; 250% deviation or extreme score</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-amber-500">
          <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Medium Severity</p>
          <p className="text-2xl font-bold text-amber-950 mt-2">{anomalyData?.medium_severity_count || 0}</p>
          <p className="text-[11px] text-slate-400 mt-1">Moderate unexpected load surges</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-blue-500">
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Low Severity</p>
          <p className="text-2xl font-bold text-blue-950 mt-2">{anomalyData?.low_severity_count || 0}</p>
          <p className="text-[11px] text-slate-400 mt-1">Minor statistical pattern deviations</p>
        </div>
      </div>

      {/* Anomaly Table & Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Table Filter Bar */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search by explanation or date..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg w-60 sm:w-72 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-xs">
              {['all', 'high', 'medium', 'low'].map((sev) => (
                <button
                  key={sev}
                  onClick={() => setSelectedSeverity(sev)}
                  className={`px-2.5 py-1 rounded-md font-semibold capitalize transition-colors ${
                    selectedSeverity === sev
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>

          <span className="text-xs text-slate-400">
            Showing {filteredAnomalies.length} anomaly events
          </span>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 font-semibold">Timestamp</th>
                <th className="py-3 px-4 font-semibold">Type</th>
                <th className="py-3 px-4 font-semibold">Severity</th>
                <th className="py-3 px-4 font-semibold">Actual vs Baseline</th>
                <th className="py-3 px-4 font-semibold">Deviation</th>
                <th className="py-3 px-4 font-semibold">Score</th>
                <th className="py-3 px-4 font-semibold">Mathematical Explanation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredAnomalies.length > 0 ? (
                filteredAnomalies.map((anom, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium whitespace-nowrap text-slate-900">
                      {new Date(anom.timestamp).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="py-3 px-4 font-semibold whitespace-nowrap text-slate-800">
                      {anom.anomaly_type}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          anom.severity === 'High'
                            ? 'bg-red-100 text-red-700 border border-red-200'
                            : anom.severity === 'Medium'
                            ? 'bg-amber-100 text-amber-700 border border-amber-200'
                            : 'bg-blue-100 text-blue-700 border border-blue-200'
                        }`}
                      >
                        {anom.severity}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono whitespace-nowrap">
                      <strong className="text-slate-900">{anom.actual_kwh}</strong> / {anom.baseline_kwh} kWh
                    </td>
                    <td className="py-3 px-4 font-mono font-bold whitespace-nowrap text-red-600">
                      +{anom.deviation_pct}%
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                      {anom.anomaly_score.toFixed(3)}
                    </td>
                    <td className="py-3 px-4 text-slate-600 min-w-[280px] leading-relaxed">
                      {anom.explanation}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No anomalies found matching the selected filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Academic Disclaimer */}
      <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200 text-xs text-blue-900 flex items-start gap-2.5">
        <HelpCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <strong className="font-semibold">Contextual Interpretation Note:</strong> An anomaly is a mathematical deviation from historical baseline patterns (such as unexpected overnight heating or sudden multiple-appliance peaks). It does not automatically signify a broken appliance or power theft, but provides targeted timestamps for homeowner investigation.
        </div>
      </div>
    </div>
  );
};

