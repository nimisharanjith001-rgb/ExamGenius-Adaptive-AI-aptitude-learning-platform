import React, { useEffect, useState } from 'react';
import { Settings as SettingsIcon, User, Save, CheckCircle2, Shield, Moon, Sun, Bell } from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../contexts/AuthContext';

export const Settings: React.FC = () => {
  const { user } = useAuth();
  const [currency, setCurrency] = useState('₹');
  const [tariff, setTariff] = useState(7.50);
  const [theme, setTheme] = useState('light');
  const [notifications, setNotifications] = useState(true);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/settings');
        setCurrency(res.data.default_currency);
        setTariff(res.data.default_tariff);
        setTheme(res.data.theme || 'light');
        setNotifications(res.data.notifications_enabled);
      } catch {
        // fallback
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put('/settings', {
        default_currency: currency,
        default_tariff: tariff,
        theme: theme,
        notifications_enabled: notifications,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Failed to update settings', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-slate-700" />
            Platform Preferences & Account Settings
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure default billing parameters, display preferences, and student user profile.
          </p>
        </div>

        {saved && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Preferences Saved</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Profile Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <User className="w-4 h-4 text-blue-600" />
            User Identity
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700">Full Name</label>
              <input
                type="text"
                disabled
                value={user?.full_name || ''}
                className="mt-1 block w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 text-slate-600 font-medium cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700">Email Address</label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="mt-1 block w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 text-slate-600 font-medium cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Global Tariff Defaults */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-600" />
            Analytics & Tariff Defaults
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700">Default Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="mt-1 block w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 outline-none"
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
                Default Energy Tariff ({currency} / kWh)
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={tariff}
                onChange={(e) => setTariff(parseFloat(e.target.value) || 0)}
                className="mt-1 block w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-mono"
              />
            </div>
          </div>
        </div>

        {/* System & Notification Preferences */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <Bell className="w-4 h-4 text-indigo-600" />
            Notification & Interface Preferences
          </h2>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <p className="text-xs font-bold text-slate-800">Anomaly Alert Popups</p>
              <p className="text-[11px] text-slate-400">Surface automatic notification banners when high-severity anomalies are detected.</p>
            </div>
            <input
              type="checkbox"
              checked={notifications}
              onChange={(e) => setNotifications(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded cursor-pointer"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-500/20 transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{loading ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

