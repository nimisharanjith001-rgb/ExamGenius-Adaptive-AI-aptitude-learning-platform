import React, { useState } from 'react';
import {
  Database,
  Upload,
  Download,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  FileText,
  Sparkles,
  ArrowRight,
  Eye,
  X
} from 'lucide-react';
import api from '../api/client';
import { useDataset } from '../contexts/DatasetContext';
import { ValidationReport, Dataset } from '../types';

export const DatasetManagement: React.FC = () => {
  const { datasets, activeDataset, refreshDatasets, selectDataset, seedDemo, isLoading } = useDataset();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [customName, setCustomName] = useState<string>('');
  const [validationReport, setValidationReport] = useState<ValidationReport | null>(null);
  const [validating, setValidating] = useState<boolean>(false);
  const [importing, setImporting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [previewModalDataset, setPreviewModalDataset] = useState<Dataset | null>(null);
  const [previewRows, setPreviewRows] = useState<any[]>([]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setSelectedFile(file);
    setValidationReport(null);
    setErrorMessage(null);
    setSuccessMessage(null);

    // Run validation immediately
    setValidating(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/datasets/validate', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setValidationReport(res.data);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.detail || 'CSV validation inspection failed. Please check the file structure.');
    } finally {
      setValidating(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!selectedFile) return;
    setImporting(true);
    setErrorMessage(null);

    const formData = new FormData();
    formData.append('file', selectedFile);
    if (customName.trim()) {
      formData.append('custom_name', customName.trim());
    }

    try {
      const res = await api.post('/datasets/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSuccessMessage(`Dataset "${res.data.name}" successfully imported and set as active!`);
      setSelectedFile(null);
      setValidationReport(null);
      setCustomName('');
      await refreshDatasets();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.detail || 'Failed to import dataset.');
    } finally {
      setImporting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this dataset? All associated ML cache will be cleared.')) return;
    try {
      await api.delete(`/datasets/${id}`);
      await refreshDatasets();
    } catch (err) {
      console.error('Delete failed', err);
    }
  };

  const openPreviewModal = async (ds: Dataset) => {
    setPreviewModalDataset(ds);
    try {
      const res = await api.get(`/datasets/${ds.id}/preview`);
      setPreviewRows(res.data);
    } catch {
      setPreviewRows([]);
    }
  };

  const downloadTemplate = () => {
    window.open('http://localhost:8000/api/datasets/template/download', '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-600" />
            Dataset Management & Ingestion Pipeline
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Upload custom household electricity consumption CSV files or load the UCI benchmark dataset.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={downloadTemplate}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV Template</span>
          </button>

          <button
            onClick={seedDemo}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20 transition-all disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isLoading ? 'Processing...' : 'Load UCI Benchmark'}</span>
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-800 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Upload & Ingestion Box */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
          <Upload className="w-4 h-4 text-blue-600" />
          Upload New Electricity CSV Dataset
        </h2>

        <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* File input area */}
          <div className="border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-2xl p-6 text-center bg-slate-50/50 transition-colors flex flex-col items-center justify-center">
            <input
              type="file"
              id="csvFileInput"
              accept=".csv,.txt"
              onChange={handleFileSelect}
              className="hidden"
            />
            <label
              htmlFor="csvFileInput"
              className="cursor-pointer flex flex-col items-center justify-center w-full"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                <FileText className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-800">
                {selectedFile ? selectedFile.name : 'Click to select or drag CSV file here'}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Supports UCI semicolon-separated or comma-separated generic format (Max 100MB)
              </p>
            </label>

            {selectedFile && (
              <div className="mt-4 w-full text-left">
                <label className="block text-xs font-semibold text-slate-700">Custom Dataset Name (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. My Apartment Jan 2026"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="mt-1 w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
          </div>

          {/* Validation Report Card */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 flex flex-col justify-between">
            {validating ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                Validating dataset structure, timestamps, and missing records...
              </div>
            ) : validationReport ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Validation Status</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      validationReport.data_quality_status === 'EXCELLENT'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}
                  >
                    {validationReport.data_quality_status} Quality
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 bg-white rounded-lg border border-slate-200">
                    <p className="text-[10px] text-slate-400">Total Rows</p>
                    <p className="font-bold text-slate-800">{validationReport.total_records.toLocaleString()}</p>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-slate-200">
                    <p className="text-[10px] text-slate-400">Sampling Interval</p>
                    <p className="font-bold text-slate-800">{validationReport.sampling_rate}</p>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-slate-200">
                    <p className="text-[10px] text-slate-400">Detected Format</p>
                    <p className="font-bold text-slate-800">{validationReport.detected_format}</p>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-slate-200">
                    <p className="text-[10px] text-slate-400">Integrated Energy</p>
                    <p className="font-bold text-blue-600">{validationReport.total_energy_kwh} kWh</p>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleConfirmImport}
                    disabled={importing}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all disabled:opacity-50"
                  >
                    <span>{importing ? 'Processing & Ingesting...' : 'Confirm & Ingest Dataset'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-xs text-slate-400 p-4">
                <FileText className="w-8 h-8 text-slate-300 mb-2" />
                Select a CSV file to inspect columns, detect format, and validate chronological continuity.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Available Datasets Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">Your Monitored Datasets</h2>
          <span className="text-xs text-slate-400">{datasets.length} datasets available</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 font-semibold">Dataset Name</th>
                <th className="py-3 px-4 font-semibold">Format</th>
                <th className="py-3 px-4 font-semibold">Records</th>
                <th className="py-3 px-4 font-semibold">Date Span</th>
                <th className="py-3 px-4 font-semibold">Total Energy</th>
                <th className="py-3 px-4 font-semibold">Peak Demand</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {datasets.map((ds) => (
                <tr key={ds.id} className={`hover:bg-slate-50 transition-colors ${ds.is_active ? 'bg-blue-50/30' : ''}`}>
                  <td className="py-3 px-4 font-bold text-slate-900">
                    <div className="flex items-center gap-2">
                      {ds.name}
                      {ds.is_active && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                          Active
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono">{ds.dataset_type}</td>
                  <td className="py-3 px-4 font-mono">{ds.total_records.toLocaleString()}</td>
                  <td className="py-3 px-4 text-slate-500">
                    {ds.start_date ? new Date(ds.start_date).toLocaleDateString() : '—'} –{' '}
                    {ds.end_date ? new Date(ds.end_date).toLocaleDateString() : '—'}
                  </td>
                  <td className="py-3 px-4 font-mono font-semibold text-slate-900">{ds.total_energy_kwh} kWh</td>
                  <td className="py-3 px-4 font-mono text-amber-600 font-semibold">{ds.max_power_kw} kW</td>
                  <td className="py-3 px-4">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                      {ds.data_quality_status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openPreviewModal(ds)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        title="Preview Hourly Readings"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {!ds.is_active && (
                        <button
                          onClick={() => selectDataset(ds.id)}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                        >
                          Activate
                        </button>
                      )}

                      <button
                        onClick={() => handleDelete(ds.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Delete Dataset"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Preview Modal */}
      {previewModalDataset && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Preview: {previewModalDataset.name}
                </h3>
                <p className="text-xs text-slate-400">First 20 aggregated hourly records</p>
              </div>
              <button
                onClick={() => setPreviewModalDataset(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px]">
                  <tr>
                    <th className="py-2 px-3">Timestamp</th>
                    <th className="py-2 px-3">Energy (kWh)</th>
                    <th className="py-2 px-3">Avg Power (kW)</th>
                    <th className="py-2 px-3">Max Power (kW)</th>
                    <th className="py-2 px-3">Voltage (V)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {previewRows.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="py-2 px-3 text-slate-800">{new Date(row.timestamp).toLocaleString()}</td>
                      <td className="py-2 px-3 font-bold text-blue-600">{row.energy_kwh}</td>
                      <td className="py-2 px-3">{row.avg_power_kw}</td>
                      <td className="py-2 px-3 text-amber-600">{row.max_power_kw}</td>
                      <td className="py-2 px-3 text-slate-500">{row.voltage}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

