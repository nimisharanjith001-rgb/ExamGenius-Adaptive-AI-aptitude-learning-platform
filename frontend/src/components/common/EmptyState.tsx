import React from 'react';
import { Database, Sparkles, Upload } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useDataset } from '../../contexts/DatasetContext';

interface EmptyStateProps {
  title?: string;
  description?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = "No Dataset Loaded",
  description = "Upload your electricity consumption CSV file or load the benchmark UCI Household Power sample dataset to view AI analytics."
}) => {
  const { seedDemo, isLoading } = useDataset();

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center max-w-xl mx-auto my-8 shadow-sm">
      <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4 border border-blue-100 shadow-inner">
        <Database className="w-8 h-8" />
      </div>

      <h3 className="text-xl font-bold text-slate-900">{title}</h3>
      <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto leading-relaxed">
        {description}
      </p>

      <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          onClick={seedDemo}
          disabled={isLoading}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all disabled:opacity-50"
        >
          <Sparkles className="w-4 h-4" />
          <span>{isLoading ? 'Processing Demo...' : 'Load UCI Benchmark Sample'}</span>
        </button>

        <Link
          to="/datasets"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-semibold text-sm hover:bg-slate-200 transition-colors"
        >
          <Upload className="w-4 h-4" />
          <span>Upload CSV File</span>
        </Link>
      </div>

      <div className="mt-8 pt-6 border-t border-slate-100 text-left text-xs text-slate-400">
        <p className="font-semibold text-slate-600">Supported Ingestion Formats:</p>
        <ul className="list-disc list-inside mt-1 space-y-0.5 text-slate-500">
          <li>UCI Semicolon-Separated Household Active Power dataset</li>
          <li>Generic CSV with timestamp, power_kw, energy_kwh, voltage</li>
        </ul>
      </div>
    </div>
  );
};

