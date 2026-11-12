import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Zap,
  ArrowRight,
  Sparkles,
  Lock,
  LogOut,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/client';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, login, logout, user } = useAuth();
  const [demoLoading, setDemoLoading] = useState(false);

  const handleInstantDemo = async () => {
    setDemoLoading(true);
    try {
      const res = await api.post('/auth/login', {
        email: 'demo@powerpulse.ai',
        password: 'DemoPassword123!'
      });
      login(res.data.access_token, res.data.user);
      navigate('/dashboard');
    } catch {
      navigate('/login');
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#101B2D] text-slate-100 font-sans selection:bg-electric-500 selection:text-white flex flex-col justify-between">
      {/* ----------------------------------------------------
          TOP NAVIGATION BAR (HEADER BANNER)
      ---------------------------------------------------- */}
      <header className="sticky top-0 z-50 bg-[#101B2D]/95 backdrop-blur-md border-b border-navy-700/60 shadow-lg shadow-navy-900/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Brand Logo & Name */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-electric-600 via-blue-500 to-emerald-400 p-0.5 shadow-md shadow-electric-500/30 group-hover:scale-105 transition-transform duration-200">
              <div className="w-full h-full bg-navy-900 rounded-[10px] flex items-center justify-center">
                <Zap className="w-6 h-6 text-emerald-400 animate-pulse" />
              </div>
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                PowerPulse <span className="text-electric-500">AI</span>
              </span>
              <span className="block text-[10px] text-slate-400 font-medium tracking-wider uppercase">
                100% Free • Smart Electricity Analytics
              </span>
            </div>
          </Link>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="px-4 sm:px-5 py-2.5 rounded-lg bg-electric-600 hover:bg-electric-500 text-white font-semibold text-sm shadow-md shadow-electric-600/30 transition-all flex items-center gap-1.5"
                >
                  <span>Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={logout}
                  className="px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-rose-400 bg-navy-800/80 hover:bg-navy-800 border border-navy-700 transition-colors flex items-center gap-1.5"
                  title={`Signed in as ${user?.email || 'User'}. Click to sign out.`}
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 sm:gap-3">
                <Link
                  to="/login"
                  className="px-3.5 py-2 text-sm font-semibold text-slate-200 hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="hidden sm:inline-flex px-4 py-2 rounded-lg bg-navy-800 hover:bg-navy-700 border border-navy-600 text-white font-semibold text-sm transition-all"
                >
                  Sign Up
                </Link>
                <button
                  onClick={handleInstantDemo}
                  disabled={demoLoading}
                  className="px-3.5 sm:px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-semibold text-xs sm:text-sm shadow-md shadow-emerald-600/30 transition-all flex items-center gap-1.5 active:scale-95"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-200 fill-amber-200" />
                  {demoLoading ? 'Launching...' : '1-Click Demo'}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ----------------------------------------------------
          HERO SECTION
      ---------------------------------------------------- */}
      <main className="relative overflow-hidden bg-gradient-to-b from-[#101B2D] via-[#132238] to-[#101B2D] text-white pt-12 pb-20 lg:pt-20 lg:pb-28 flex-1 flex flex-col justify-center">
        {/* Glow ambient background effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-electric-600/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-[400px] h-[300px] bg-emerald-500/15 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
          <div className="text-center max-w-3xl mx-auto">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-navy-800/90 border border-navy-600 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-8 shadow-inner">
              <Sparkles className="w-3.5 h-3.5" />
              100% Free & Open-Source • Final-Year Engineering Project
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.15] text-white mb-6">
              Smart Electricity Analytics & <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-electric-500 to-emerald-400">
                AI Anomaly Detection
              </span>
            </h1>

            {/* Sub-headline */}
            <p className="text-lg sm:text-xl text-slate-300 leading-relaxed font-normal mb-10 max-w-2xl mx-auto">
              Transform raw smart meter telemetry into real financial savings. Featuring continuous 
              <strong> Isolation Forest anomaly detection</strong>, <strong>Random Forest 24h forecasting</strong> (R² = 90.2%), 
              and <strong>Appliance-Level Disaggregation</strong> with zero hardware modifications and zero paid APIs.
            </p>

            {/* Primary Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/login"
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-electric-600 hover:bg-electric-500 text-white font-bold text-base shadow-xl shadow-electric-600/40 hover:shadow-electric-500/50 transition-all flex items-center justify-center gap-2 group active:scale-95"
              >
                <span>Sign In to Dashboard</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                to="/register"
                className="w-full sm:w-auto px-7 py-4 rounded-xl bg-navy-800 hover:bg-navy-700 text-slate-200 hover:text-white font-semibold text-base border border-navy-600 hover:border-slate-500 shadow-md transition-all flex items-center justify-center gap-2"
              >
                Create Account (Free)
              </Link>

              <button
                onClick={handleInstantDemo}
                disabled={demoLoading}
                className="w-full sm:w-auto px-6 py-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-base shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <Zap className="w-4 h-4 text-amber-200 fill-amber-200" />
                {demoLoading ? 'Launching...' : '1-Click Demo'}
              </button>
            </div>

            {/* Key trust indicators */}
            <div className="mt-12 pt-8 border-t border-navy-700/60 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center text-slate-300">
              <div>
                <p className="text-2xl sm:text-3xl font-extrabold text-white">20,160</p>
                <p className="text-xs text-slate-400 uppercase tracking-wider mt-1">UCI Telemetry Readings</p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-extrabold text-emerald-400">90.2%</p>
                <p className="text-xs text-slate-400 uppercase tracking-wider mt-1">Forecast R² Accuracy</p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-extrabold text-blue-400">9 Devices</p>
                <p className="text-xs text-slate-400 uppercase tracking-wider mt-1">NILM Disaggregated</p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-extrabold text-purple-400">100% Free</p>
                <p className="text-xs text-slate-400 uppercase tracking-wider mt-1">Zero Paid APIs</p>
              </div>
            </div>
          </div>

          {/* Interactive Live Glass Dashboard Preview Card */}
          <div className="mt-14 max-w-5xl mx-auto rounded-2xl bg-gradient-to-b from-navy-800/90 to-navy-900/95 border border-navy-700 shadow-2xl p-6 sm:p-8 backdrop-blur-xl">
            <div className="flex flex-wrap items-center justify-between border-b border-navy-700 pb-5 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Telemetry Stream Active: UCI Household Sub-Station
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-400 text-xs font-medium border border-emerald-500/30">
                  Physics Validated: E = P × 1/60 hr
                </span>
                <span className="px-2.5 py-1 rounded bg-electric-500/20 text-blue-300 text-xs font-medium border border-electric-500/30">
                  Isolation Forest: 100 Trees
                </span>
              </div>
            </div>

            {/* Simulated Live Gauges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-6">
              <div className="p-4 rounded-xl bg-navy-900/80 border border-navy-700/80">
                <p className="text-xs text-slate-400 font-medium">Instantaneous Household Load</p>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-3xl font-black text-white">2.418</span>
                  <span className="text-sm font-semibold text-emerald-400">kW</span>
                </div>
                <div className="w-full bg-navy-800 h-2 rounded-full mt-3 overflow-hidden">
                  <div className="bg-gradient-to-r from-emerald-500 to-electric-500 h-full w-[42%]" />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-navy-900/80 border border-navy-700/80">
                <p className="text-xs text-slate-400 font-medium">Aggregated Energy Consumed</p>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-3xl font-black text-blue-400">370.38</span>
                  <span className="text-sm font-semibold text-slate-400">kWh</span>
                </div>
                <div className="w-full bg-navy-800 h-2 rounded-full mt-3 overflow-hidden">
                  <div className="bg-electric-500 h-full w-[68%]" />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-navy-900/80 border border-navy-700/80">
                <p className="text-xs text-slate-400 font-medium">Projected Monthly Bill (₹)</p>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-3xl font-black text-amber-400">₹3,042.74</span>
                  <span className="text-xs font-medium text-emerald-400">-12% vs last month</span>
                </div>
                <div className="w-full bg-navy-800 h-2 rounded-full mt-3 overflow-hidden">
                  <div className="bg-amber-400 h-full w-[54%]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ----------------------------------------------------
          CLEAN FOOTER
      ---------------------------------------------------- */}
      <footer className="bg-navy-900 text-slate-400 py-8 border-t border-navy-800 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-emerald-400" />
            <span className="text-white font-medium">PowerPulse AI</span>
            <span className="text-slate-500">• 100% Free & Open-Source</span>
          </div>

          <div className="flex items-center gap-6">
            <Link to="/login" className="hover:text-white transition-colors">Sign In</Link>
            <Link to="/register" className="hover:text-white transition-colors">Create Account</Link>
          </div>

          <p className="text-slate-500">
            Final-Year Engineering Project • Built with React & FastAPI
          </p>
        </div>
      </footer>
    </div>
  );
};
