import React, { useEffect, useState } from 'react';
import { Calculator, Receipt, ShieldAlert, CheckCircle, Info, RefreshCw, Zap } from 'lucide-react';
import api from '../api/client';
import { useDataset } from '../contexts/DatasetContext';
import { EmptyState } from '../components/common/EmptyState';
import { BillCalculation } from '../types';

export const ElectricityBill: React.FC = () => {
  const { activeDataset } = useDataset();
  const [tariffRate, setTariffRate] = useState<number>(7.50);
  const [fixedCharge, setFixedCharge] = useState<number>(120.0);
  const [taxRate, setTaxRate] = useState<number>(5.0);
  const [additionalCharge, setAdditionalCharge] = useState<number>(0.0);
  const [currency, setCurrency] = useState<string>('₹');
  const [customKwh, setCustomKwh] = useState<string>('');
  const [billResult, setBillResult] = useState<BillCalculation | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  const calculateBill = async () => {
    if (!activeDataset) return;
    setLoading(true);
    try {
      const payload: any = {
        tariff_per_kwh: tariffRate,
        fixed_monthly_charge: fixedCharge,
        tax_rate_pct: taxRate,
        additional_charges: additionalCharge,
        currency: currency,
      };
      if (customKwh && parseFloat(customKwh) > 0) {
        payload.custom_kwh = parseFloat(customKwh);
      }

      const res = await api.post(`/bill/calculate?dataset_id=${activeDataset.id}`, payload);
      setBillResult(res.data);
    } catch (err) {
      console.error('Calculation failed', err);
    } finally {
      setLoading(false);
    }
  };

  // Load user saved tariff defaults
  useEffect(() => {
    const fetchTariff = async () => {
      try {
        const res = await api.get('/bill/tariff');
        setTariffRate(res.data.tariff_per_kwh);
        setFixedCharge(res.data.fixed_monthly_charge);
        setTaxRate(res.data.tax_rate_pct);
        setAdditionalCharge(res.data.additional_charges || 0.0);
        setCurrency(res.data.currency || '₹');
      } catch {
        // fallback to defaults
      }
    };
    fetchTariff();
  }, []);

  useEffect(() => {
    if (activeDataset) {
      calculateBill();
    }
  }, [activeDataset, tariffRate, fixedCharge, taxRate, additionalCharge, currency]);

  const saveTariffAsDefault = async () => {
    try {
      await api.put('/bill/tariff', {
        tariff_per_kwh: tariffRate,
        fixed_monthly_charge: fixedCharge,
        tax_rate_pct: taxRate,
        additional_charges: additionalCharge,
        currency: currency,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save tariff defaults', err);
    }
  };

  if (!activeDataset) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Calculator className="w-5 h-5 text-indigo-600" />
            Electricity Tariff & Bill Estimation Calculator
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Compute projected electricity costs tailored to your utility tariff slabs, taxes, and fixed capacity charges.
          </p>
        </div>

        <button
          onClick={saveTariffAsDefault}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors self-start sm:self-auto"
        >
          {saveSuccess ? (
            <>
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-emerald-700">Defaults Saved!</span>
            </>
          ) : (
            <span>Save as User Defaults</span>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Form Inputs */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
          <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <Receipt className="w-4 h-4 text-indigo-600" />
            Tariff Parameters & Utility Billing Inputs
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700">Currency Symbol</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="mt-1 block w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="₹">₹ (INR - Indian Rupee)</option>
                <option value="$">$ (USD - US Dollar)</option>
                <option value="€">€ (EUR - Euro)</option>
                <option value="£">£ (GBP - British Pound)</option>
                <option value="AED">AED (UAE Dirham)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Energy Rate ({currency} / kWh)
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={tariffRate}
                onChange={(e) => setTariffRate(parseFloat(e.target.value) || 0)}
                className="mt-1 block w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
              />
              <span className="text-[10px] text-slate-400">Typical Indian slab rate: ₹6.00 – ₹9.50/kWh</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Fixed Monthly Charge ({currency})
              </label>
              <input
                type="number"
                step="1"
                min="0"
                value={fixedCharge}
                onChange={(e) => setFixedCharge(parseFloat(e.target.value) || 0)}
                className="mt-1 block w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
              />
              <span className="text-[10px] text-slate-400">Sanctioned load / meter rental charge</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Electricity Duty / Tax (%)
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="50"
                value={taxRate}
                onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                className="mt-1 block w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
              />
              <span className="text-[10px] text-slate-400">Municipal tax or state cess percentage</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Additional Regulatory / Fuel Charges ({currency})
              </label>
              <input
                type="number"
                step="1"
                min="0"
                value={additionalCharge}
                onChange={(e) => setAdditionalCharge(parseFloat(e.target.value) || 0)}
                className="mt-1 block w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
              />
              <span className="text-[10px] text-slate-400">FCA / PPAC fuel cost adjustments</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Custom Consumption Override (kWh)
              </label>
              <input
                type="number"
                step="1"
                min="0"
                placeholder={`Default: dataset total (${activeDataset.total_energy_kwh} kWh)`}
                value={customKwh}
                onChange={(e) => setCustomKwh(e.target.value)}
                className="mt-1 block w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-mono placeholder:text-slate-400"
              />
              <span className="text-[10px] text-slate-400">Leave empty to use active dataset total</span>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={calculateBill}
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-500/20 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Re-calculating...' : 'Recalculate Estimate'}</span>
            </button>
          </div>
        </div>

        {/* Right 1 Col: Itemized Bill Card */}
        <div className="bg-gradient-to-b from-[#101B2D] to-[#1E293B] text-white p-6 rounded-2xl border border-slate-800 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-700">
              <span className="text-xs uppercase font-bold tracking-wider text-slate-400">Estimated Utility Bill</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                PROJECTION
              </span>
            </div>

            <div className="mt-4">
              <p className="text-xs text-slate-400">Total Estimated Payable</p>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-3xl font-extrabold text-white tracking-tight">
                  {billResult ? `${currency} ${billResult.total_estimated_bill.toLocaleString()}` : '—'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Based on <strong>{billResult?.total_kwh || 0} kWh</strong> monitored consumption
              </p>
            </div>

            <div className="mt-5 space-y-2.5 pt-4 border-t border-slate-800 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Energy Charge ({billResult?.tariff_per_kwh} / kWh):</span>
                <span className="font-mono font-semibold text-white">
                  {currency} {billResult?.energy_charge.toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between text-slate-300">
                <span>Fixed Monthly Charges:</span>
                <span className="font-mono font-semibold text-white">
                  {currency} {billResult?.fixed_charge.toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between text-slate-300">
                <span>Additional / Regulatory Fees:</span>
                <span className="font-mono font-semibold text-white">
                  {currency} {billResult?.additional_charges.toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between text-slate-300">
                <span>Taxes & Duties ({taxRate}%):</span>
                <span className="font-mono font-semibold text-white">
                  {currency} {billResult?.tax_amount.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-800 grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-center">
                <p className="text-[10px] text-slate-400">Avg Cost / Day</p>
                <p className="font-bold text-white mt-0.5">{currency} {billResult?.average_cost_per_day}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-center">
                <p className="text-[10px] text-slate-400">Effective Rate / kWh</p>
                <p className="font-bold text-emerald-400 mt-0.5">{currency} {billResult?.effective_rate_per_kwh}</p>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 text-[10px] text-slate-400 leading-relaxed">
            {billResult?.disclaimer}
          </div>
        </div>
      </div>
    </div>
  );
};

