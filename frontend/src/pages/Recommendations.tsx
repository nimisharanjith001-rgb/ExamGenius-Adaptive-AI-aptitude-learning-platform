import React, { useEffect, useState } from 'react';
import { Lightbulb, TrendingDown, CheckCircle, ShieldCheck, ArrowRight, Zap, PiggyBank } from 'lucide-react';
import api from '../api/client';
import { useDataset } from '../contexts/DatasetContext';
import { EmptyState } from '../components/common/EmptyState';
import { RecommendationResponse, RecommendationItem } from '../types';

export const Recommendations: React.FC = () => {
  const { activeDataset } = useDataset();
  const [data, setData] = useState<RecommendationResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!activeDataset) return;

    const fetchRecommendations = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/recommendations?dataset_id=${activeDataset.id}`);
        setData(res.data);
      } catch (err) {
        console.error('Failed to load recommendations', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [activeDataset]);

  if (!activeDataset) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Empirically Supported Analytics Rules
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-1.5 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-500" />
            Personalized Energy Optimization Insights
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Tailored suggestions derived directly from your monitored peak periods, nighttime idle draws, and appliance sub-metering.
          </p>
        </div>

        {data && data.potential_monthly_savings_kwh > 0 && (
          <div className="bg-emerald-50 border border-emerald-200 px-4 py-3 rounded-2xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <PiggyBank className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider">Potential Monthly Savings</p>
              <p className="text-base font-extrabold text-emerald-950">
                ~{data.potential_monthly_savings_kwh} kWh ({data.currency} {data.potential_monthly_savings_amount.toLocaleString()})
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Recommendations Cards Grid */}
      <div className="space-y-4">
        {data && data.items.length > 0 ? (
          data.items.map((rec: RecommendationItem, index: number) => (
            <div
              key={index}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                      rec.priority === 'High'
                        ? 'bg-red-100 text-red-700 border border-red-200'
                        : rec.priority === 'Medium'
                        ? 'bg-amber-100 text-amber-700 border border-amber-200'
                        : 'bg-blue-100 text-blue-700 border border-blue-200'
                    }`}
                  >
                    {rec.priority} Priority
                  </span>
                  <span className="text-xs font-semibold text-slate-400">•</span>
                  <span className="text-xs font-semibold text-slate-500">{rec.category}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Confidence:</span>
                  <span className="text-xs font-bold text-slate-700">{rec.confidence}</span>
                </div>
              </div>

              <div className="mt-4">
                <h2 className="text-base font-bold text-slate-900">{rec.title}</h2>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{rec.explanation}</p>
              </div>

              {/* Empirical Evidence Box */}
              <div className="mt-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <span className="font-bold text-slate-800">Monitored Evidence: </span>
                <span className="text-slate-600">{rec.evidence}</span>
              </div>

              {/* Action Plan */}
              <div className="mt-3 p-3.5 rounded-xl bg-blue-50/50 border border-blue-100 text-xs flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-blue-900 font-bold">Recommended Action: </strong>
                  <span className="text-blue-800">{rec.practical_action}</span>
                </div>
              </div>

              {/* Estimated Saving Tag */}
              {rec.estimated_saving_kwh > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Estimated Monthly Impact:</span>
                  <span className="font-bold text-emerald-700 font-mono">
                    Save ~{rec.estimated_saving_kwh} kWh ({data.currency} {rec.estimated_saving_amount.toFixed(2)}) / month
                  </span>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-xs text-slate-400">
            {loading ? 'Evaluating household consumption patterns...' : 'No priority recommendations for this period.'}
          </div>
        )}
      </div>
    </div>
  );
};

