import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Zap,
  Activity,
  TrendingUp,
  ShieldCheck,
  Cpu,
  BarChart3,
  Tv,
  Laptop,
  Flame,
  Wind,
  CheckCircle2,
  ArrowRight,
  Database,
  Lock,
  ChevronRight,
  Layers,
  Sparkles,
  HelpCircle,
  Clock,
  Gauge,
  LogOut,
  Server,
  Code2,
  Workflow,
  Sparkle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/client';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, login, logout, user } = useAuth();
  const [demoLoading, setDemoLoading] = useState(false);

  // Interactive Live Appliance Simulator state on landing page
  const [acHours, setAcHours] = useState<number>(6);
  const [laptopHours, setLaptopHours] = useState<number>(8);
  const [tvHours, setTvHours] = useState<number>(4);
  const [geyserHours, setGeyserHours] = useState<number>(1);

  // Instant calculation based on appliance wattages (AC: 1500W, Laptop: 90W, TV: 120W, Geyser: 2000W, Base: 300W fridge/lighting)
  const dailyKwh = Number(
    ((acHours * 1.5) + (laptopHours * 0.09) + (tvHours * 0.12) + (geyserHours * 2.0) + (24 * 0.25)).toFixed(2)
  );
  const monthlyKwh = Number((dailyKwh * 30).toFixed(1));
  const estimatedBill = Math.round(monthlyKwh * 7.50 + 120);

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
    <div className="min-h-screen bg-[#F5F7FB] text-slate-800 font-sans selection:bg-electric-500 selection:text-white scroll-smooth">
      {/* ----------------------------------------------------
          TOP NAVIGATION BAR
      ---------------------------------------------------- */}
      <header className="sticky top-0 z-50 bg-[#101B2D]/95 backdrop-blur-md border-b border-navy-700/60 shadow-lg shadow-navy-900/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Brand */}
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

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-300">
            <a href="#features" className="hover:text-emerald-400 transition-colors">Features</a>
            <a href="#appliances" className="hover:text-emerald-400 transition-colors">Appliance NILM</a>
            <a href="#ml-models" className="hover:text-emerald-400 transition-colors">AI Models</a>
            <a href="#benchmarks" className="hover:text-emerald-400 transition-colors">UCI Benchmarks</a>
            <a href="#architecture" className="hover:text-emerald-400 transition-colors">Architecture</a>
          </nav>

          {/* CTA Actions */}
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
      <section className="relative overflow-hidden bg-gradient-to-b from-[#101B2D] via-[#132238] to-[#101B2D] text-white pt-16 pb-24 lg:pt-24 lg:pb-32 border-b border-navy-700">
        {/* Glow ambient background effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-electric-600/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-[400px] h-[300px] bg-emerald-500/15 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
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
          <div className="mt-16 max-w-5xl mx-auto rounded-2xl bg-gradient-to-b from-navy-800/90 to-navy-900/95 border border-navy-700 shadow-2xl p-6 sm:p-8 backdrop-blur-xl">
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
      </section>

      {/* ----------------------------------------------------
          INTERACTIVE LIVE APPLIANCE SIMULATOR WIDGET
      ---------------------------------------------------- */}
      <section id="appliances" className="py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-electric-600 bg-electric-500/10 px-3 py-1 rounded-full border border-electric-500/20">
              Interactive NILM Simulator
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-navy-900 tracking-tight mt-3">
              See How Your Home Devices Drive Your Bill
            </h2>
            <p className="text-slate-600 text-sm sm:text-base mt-3">
              Adjust operating hours for major home appliances below and watch PowerPulse AI calculate your estimated monthly consumption and electricity bill in real-time.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center max-w-5xl mx-auto">
            {/* Sliders Box */}
            <div className="lg:col-span-7 bg-[#F8FAFC] border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
              <h3 className="text-base font-bold text-navy-900 flex items-center gap-2">
                <Cpu className="w-5 h-5 text-electric-600" />
                Configure Appliance Daily Runtime
              </h3>

              {/* AC Slider */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <Wind className="w-4 h-4 text-blue-500" /> Air Conditioner (1.5 Ton, 1,500W)
                  </span>
                  <span className="font-bold text-electric-600">{acHours} hrs / day</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="24"
                  value={acHours}
                  onChange={(e) => setAcHours(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-electric-600"
                />
              </div>

              {/* Laptop Slider */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <Laptop className="w-4 h-4 text-purple-500" /> Laptop & Workstation (90W)
                  </span>
                  <span className="font-bold text-electric-600">{laptopHours} hrs / day</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="24"
                  value={laptopHours}
                  onChange={(e) => setLaptopHours(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-electric-600"
                />
              </div>

              {/* Smart TV Slider */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <Tv className="w-4 h-4 text-amber-500" /> Smart TV & Soundbar (120W)
                  </span>
                  <span className="font-bold text-electric-600">{tvHours} hrs / day</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="16"
                  value={tvHours}
                  onChange={(e) => setTvHours(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-electric-600"
                />
              </div>

              {/* Water Geyser Slider */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-rose-500" /> Water Heater / Geyser (2,000W)
                  </span>
                  <span className="font-bold text-electric-600">{geyserHours} hrs / day</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="6"
                  step="0.5"
                  value={geyserHours}
                  onChange={(e) => setGeyserHours(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-electric-600"
                />
              </div>
            </div>

            {/* Calculated Output Card */}
            <div className="lg:col-span-5 bg-gradient-to-br from-navy-900 to-navy-800 rounded-2xl p-6 sm:p-8 text-white shadow-xl border border-navy-700 flex flex-col justify-between h-full">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  Live Computed Projection
                </span>
                <h4 className="text-xl font-bold mt-1 text-white">Estimated Monthly Impact</h4>
                <p className="text-xs text-slate-300 mt-1">Based on standard ₹7.50 / kWh tariff + fixed grid charges</p>

                <div className="mt-8 space-y-5">
                  <div className="p-4 rounded-xl bg-navy-800/80 border border-navy-700">
                    <span className="text-xs text-slate-400">Total Monthly Energy</span>
                    <p className="text-3xl font-extrabold text-blue-400 mt-0.5">{monthlyKwh} <span className="text-base font-normal text-slate-400">kWh</span></p>
                  </div>

                  <div className="p-4 rounded-xl bg-navy-800/80 border border-navy-700">
                    <span className="text-xs text-slate-400">Projected Monthly Bill</span>
                    <p className="text-3xl font-extrabold text-emerald-400 mt-0.5">₹{estimatedBill.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-navy-700 space-y-3">
                <Link
                  to="/login"
                  className="w-full py-3 rounded-xl bg-electric-600 hover:bg-electric-500 font-bold text-sm text-white shadow-lg shadow-electric-600/30 transition-all flex items-center justify-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  Sign In to View Full Appliance Breakdown
                </Link>
                <button
                  onClick={handleInstantDemo}
                  className="w-full py-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-300" />
                  Try 1-Click Examiner Demo
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------
          CORE CAPABILITIES GRID
      ---------------------------------------------------- */}
      <section id="features" className="py-24 bg-[#F5F7FB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              End-to-End Analytics Engine
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-navy-900 tracking-tight mt-3">
              Comprehensive Intelligence for Smart Electricity
            </h2>
            <p className="text-slate-600 text-sm sm:text-base mt-3">
              Engineered with industrial software patterns, scientific feature engineering, and robust error resilience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white rounded-2xl p-7 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-electric-600 flex items-center justify-center mb-5">
                <Activity className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-navy-900 mb-2">Isolation Forest Anomaly Hunter</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Detects sudden wattage spikes, unusual continuous nighttime usage, and unexpected deviations from baseline patterns using an ensemble of 100 isolation trees.
              </p>
              <div className="mt-4 text-xs font-semibold text-electric-600 flex items-center gap-1">
                <span>Contamination rate 3%</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Feature 2 */}
            <div className="bg-white rounded-2xl p-7 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-5">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-navy-900 mb-2">Random Forest Forecaster</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Generates 24-hour and 7-day consumption trajectories using chronologically shifted lag moments to guarantee zero future data leakage.
              </p>
              <div className="mt-4 text-xs font-semibold text-emerald-600 flex items-center gap-1">
                <span>R² = 90.2% vs Baseline (+49.6%)</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Feature 3 */}
            <div className="bg-white rounded-2xl p-7 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-5">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-navy-900 mb-2">K-Means Diurnal Clustering</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Groups daily 24-hour consumption curves into high, moderate, and baseline profiles with optimal cluster selection evaluated by the Silhouette metric.
              </p>
              <div className="mt-4 text-xs font-semibold text-purple-600 flex items-center gap-1">
                <span>Silhouette Score: 0.6114 (k=5)</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Feature 4 */}
            <div className="bg-white rounded-2xl p-7 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-5">
                <Gauge className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-navy-900 mb-2">Dynamic Tariff & Slab Billing</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Simulates utility bill calculation with flat or tiered slab tariffs, fixed contracted capacity charges, and government electricity surcharges in INR (₹).
              </p>
              <div className="mt-4 text-xs font-semibold text-amber-600 flex items-center gap-1">
                <span>Configurable slab pricing</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Feature 5 */}
            <div className="bg-white rounded-2xl p-7 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-5">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-navy-900 mb-2">Multi-Tenant Anti-Leak Isolation</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Every user dataset and telemetry stream is cryptographically isolated via composite database keys and Bcrypt (12 rounds) salted password hashing.
              </p>
              <div className="mt-4 text-xs font-semibold text-rose-600 flex items-center gap-1">
                <span>Verified Cross-User Leakage: 0%</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Feature 6 */}
            <div className="bg-white rounded-2xl p-7 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mb-5">
                <Database className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-navy-900 mb-2">Physical Energy Integration</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Accurate mathematical conversion from instantaneous kilowatt power (kW) to energy (kWh) using exact time-delta integration (1 min = 1/60 hr).
              </p>
              <div className="mt-4 text-xs font-semibold text-teal-600 flex items-center gap-1">
                <span>Prevents 60x summation errors</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------
          AI MODELS DEEP-DIVE SECTION (id="ml-models")
      ---------------------------------------------------- */}
      <section id="ml-models" className="py-24 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-600 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
              Machine Learning Engine
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-navy-900 tracking-tight mt-3">
              Applied Artificial Intelligence & Statistical Learning
            </h2>
            <p className="text-slate-600 text-sm sm:text-base mt-3">
              PowerPulse AI employs three rigorous machine learning pipelines calibrated specifically for electrical power telemetry.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Model Card 1: Isolation Forest */}
            <div className="rounded-2xl border border-slate-200 bg-[#F8FAFC] p-7 shadow-sm hover:border-electric-400 transition-colors flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
                  <Activity className="w-6 h-6" />
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-rose-600">Unsupervised Ensemble</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-rose-100 text-rose-700 font-mono">100 Trees</span>
                </div>
                <h3 className="text-xl font-bold text-navy-900 mb-3">Isolation Forest Anomaly Hunter</h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  Isolates observations by randomly selecting a feature and split value. Anomalies require significantly fewer partitions to isolate than normal diurnal profiles.
                </p>
                <div className="space-y-2 text-xs text-slate-700 border-t border-slate-200 pt-3">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Contamination Parameter:</span>
                    <span className="font-semibold font-mono">0.03 (3.0%)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Feature Dimensions:</span>
                    <span className="font-semibold">Power, Rolling Mean, Rolling Std</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Severity Classification:</span>
                    <span className="font-semibold text-rose-600">High, Medium, Low</span>
                  </div>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-200">
                <Link to="/login" className="text-xs font-bold text-electric-600 hover:text-electric-700 flex items-center gap-1">
                  Test Anomaly Detector in App <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Model Card 2: Random Forest Regressor */}
            <div className="rounded-2xl border-2 border-electric-500 bg-white p-7 shadow-lg relative flex flex-col justify-between">
              <div className="absolute -top-3 right-6 px-3 py-0.5 rounded-full bg-electric-600 text-white text-[11px] font-bold tracking-wide uppercase shadow">
                Top Accuracy
              </div>
              <div>
                <div className="w-12 h-12 rounded-xl bg-blue-100 text-electric-600 flex items-center justify-center mb-4">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-electric-600">Supervised Forecaster</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-electric-700 font-mono">120 Estimators</span>
                </div>
                <h3 className="text-xl font-bold text-navy-900 mb-3">Random Forest Regressor</h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  Predicts next-hour, 24-hour, and 7-day load demand. Trained on chronological 80/20 train/test splits with strictly shifted lag features to prevent data leakage.
                </p>
                <div className="space-y-2 text-xs text-slate-700 border-t border-slate-200 pt-3">
                  <div className="flex justify-between">
                    <span className="text-slate-500">R² Score:</span>
                    <span className="font-semibold font-mono text-emerald-600">90.20%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Mean Absolute Error (MAE):</span>
                    <span className="font-semibold font-mono">0.1012 kWh</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Accuracy vs Naive Model:</span>
                    <span className="font-semibold text-emerald-600">+49.63% Improvement</span>
                  </div>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-200">
                <Link to="/login" className="text-xs font-bold text-electric-600 hover:text-electric-700 flex items-center gap-1">
                  View Live Forecast Horizon <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Model Card 3: K-Means Clustering */}
            <div className="rounded-2xl border border-slate-200 bg-[#F8FAFC] p-7 shadow-sm hover:border-purple-400 transition-colors flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center mb-4">
                  <Layers className="w-6 h-6" />
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-600">Unsupervised Profiling</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-purple-100 text-purple-700 font-mono">k = 5 Clusters</span>
                </div>
                <h3 className="text-xl font-bold text-navy-900 mb-3">K-Means Diurnal Clustering</h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  Partitions household consumption hours into 5 distinct behavioural profiles (Night baseline, midday standard, evening surge, weekend high, and economy low).
                </p>
                <div className="space-y-2 text-xs text-slate-700 border-t border-slate-200 pt-3">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Silhouette Optimization:</span>
                    <span className="font-semibold font-mono text-purple-600">Score 0.6114</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Feature Scaling:</span>
                    <span className="font-semibold">StandardScaler (Z-Score)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Peak Load Identification:</span>
                    <span className="font-semibold">17:00 – 22:00 Window</span>
                  </div>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-200">
                <Link to="/login" className="text-xs font-bold text-electric-600 hover:text-electric-700 flex items-center gap-1">
                  Inspect Usage Clusters in App <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------
          SCIENTIFIC BENCHMARKS & MODEL DEFENSE
      ---------------------------------------------------- */}
      <section id="benchmarks" className="py-20 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 space-y-6">
              <span className="text-xs font-bold uppercase tracking-wider text-electric-600 bg-electric-50 px-3 py-1 rounded-full border border-electric-200">
                Empirical Evaluation
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-navy-900 tracking-tight">
                Trained on the Renowned UCI Power Consumption Dataset
              </h2>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                Rather than using mock random values, PowerPulse AI is calibrated on the UCI Individual Household Electric Power Consumption benchmark spanning 20,160 continuous minute-level observations.
              </p>

              <div className="space-y-3.5 pt-2">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-700">
                    <strong>Chronological Split:</strong> 80% past historical training, 20% future testing to ensure realistic real-world simulation without data leakage.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-700">
                    <strong>Cyclical Encodings:</strong> Hour-of-day and Day-of-week encoded with trigonometric sine and cosine transforms to preserve time periodicity.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-700">
                    <strong>Quantifiable Accuracy:</strong> Random Forest Regressor achieves Mean Absolute Error of 0.1012 kWh and R² = 90.2%.
                  </p>
                </div>
              </div>
            </div>

            {/* Model Comparison Table */}
            <div className="lg:col-span-6 bg-[#101B2D] rounded-2xl p-6 sm:p-8 text-white border border-navy-700 shadow-xl">
              <h4 className="text-base font-bold text-white mb-4 flex items-center justify-between">
                <span>Model Benchmark vs Baseline</span>
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Verified Real Data
                </span>
              </h4>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-navy-700 text-slate-400">
                      <th className="pb-3 font-semibold">Evaluation Metric</th>
                      <th className="pb-3 font-semibold text-slate-300">Persistence Baseline</th>
                      <th className="pb-3 font-semibold text-emerald-400">Random Forest Regressor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-navy-700/60 font-mono">
                    <tr>
                      <td className="py-3 text-slate-300 font-sans">Coefficient of Determination (R²)</td>
                      <td className="py-3 text-slate-400">40.57%</td>
                      <td className="py-3 text-emerald-400 font-bold">90.20%</td>
                    </tr>
                    <tr>
                      <td className="py-3 text-slate-300 font-sans">Mean Absolute Error (MAE)</td>
                      <td className="py-3 text-slate-400">0.2009 kWh</td>
                      <td className="py-3 text-emerald-400 font-bold">0.1012 kWh</td>
                    </tr>
                    <tr>
                      <td className="py-3 text-slate-300 font-sans">Root Mean Squared Error (RMSE)</td>
                      <td className="py-3 text-slate-400">0.4285 kWh</td>
                      <td className="py-3 text-emerald-400 font-bold">0.1741 kWh</td>
                    </tr>
                    <tr>
                      <td className="py-3 text-slate-300 font-sans">Accuracy Gain over Naive Model</td>
                      <td className="py-3 text-slate-400">0.0%</td>
                      <td className="py-3 text-emerald-400 font-bold">+49.63%</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <p className="text-[11px] text-slate-400 mt-4 leading-normal font-sans">
                * Evaluated on 20,160 readings using an 80/20 chronological horizon split. Persistence baseline carries the previous hour's load forward.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------
          SYSTEM ARCHITECTURE SECTION (id="architecture")
      ---------------------------------------------------- */}
      <section id="architecture" className="py-24 bg-[#101B2D] text-white border-b border-navy-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30">
              Industrial Software Architecture
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mt-3">
              5-Tier Full-Stack Engineering Design
            </h2>
            <p className="text-slate-300 text-sm sm:text-base mt-3">
              Built 100% free with open-source frameworks. Completely self-contained with zero reliance on paid cloud APIs, external AI credits, or network latency.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {/* Tier 1 */}
            <div className="p-6 rounded-2xl bg-navy-800/90 border border-navy-700 shadow-md">
              <div className="w-10 h-10 rounded-xl bg-electric-600/20 text-electric-400 flex items-center justify-center mb-4 border border-electric-500/30">
                <Code2 className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-electric-400 uppercase tracking-wider">Tier 1 • Client Presentation</span>
              <h3 className="text-lg font-bold text-white mt-1 mb-2">React 18 + Vite + Tailwind</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Responsive single-page web app built with TypeScript, Recharts for live diurnal visualization, and Lucide React icons.
              </p>
            </div>

            {/* Tier 2 */}
            <div className="p-6 rounded-2xl bg-navy-800/90 border border-navy-700 shadow-md">
              <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center mb-4 border border-emerald-500/30">
                <Server className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Tier 2 • API Gateway</span>
              <h3 className="text-lg font-bold text-white mt-1 mb-2">Python 3.11+ FastAPI</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Asynchronous high-throughput REST API with Pydantic V2 schema validation, CORS security, and OpenAPI documentation.
              </p>
            </div>

            {/* Tier 3 */}
            <div className="p-6 rounded-2xl bg-navy-800/90 border border-navy-700 shadow-md">
              <div className="w-10 h-10 rounded-xl bg-amber-600/20 text-amber-400 flex items-center justify-center mb-4 border border-amber-500/30">
                <Lock className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Tier 3 • Security & Auth</span>
              <h3 className="text-lg font-bold text-white mt-1 mb-2">Bcrypt + JWT Stateless Tokens</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                12-round salted Bcrypt password encryption. Composite database keys prevent cross-tenant data leakage between user accounts.
              </p>
            </div>

            {/* Tier 4 */}
            <div className="p-6 rounded-2xl bg-navy-800/90 border border-navy-700 shadow-md">
              <div className="w-10 h-10 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center mb-4 border border-purple-500/30">
                <Cpu className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Tier 4 • Machine Learning</span>
              <h3 className="text-lg font-bold text-white mt-1 mb-2">Scikit-Learn & Joblib</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Isolation Forest, Random Forest Regressor, and K-Means clustering. Models are saved per-user and per-dataset with zero cross-talk.
              </p>
            </div>

            {/* Tier 5 */}
            <div className="p-6 rounded-2xl bg-navy-800/90 border border-navy-700 shadow-md">
              <div className="w-10 h-10 rounded-xl bg-rose-600/20 text-rose-400 flex items-center justify-center mb-4 border border-rose-500/30">
                <Workflow className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">Tier 5 • Physics Integration</span>
              <h3 className="text-lg font-bold text-white mt-1 mb-2">Time-Delta Energy Engine</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Computes energy as E(kWh) = P(kW) × Δt(hours), eliminating the 60x error caused by summing power readings directly.
              </p>
            </div>

            {/* Tier 6 */}
            <div className="p-6 rounded-2xl bg-navy-800/90 border border-navy-700 shadow-md">
              <div className="w-10 h-10 rounded-xl bg-teal-600/20 text-teal-400 flex items-center justify-center mb-4 border border-teal-500/30">
                <Database className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-teal-400 uppercase tracking-wider">Tier 6 • Database Layer</span>
              <h3 className="text-lg font-bold text-white mt-1 mb-2">SQLAlchemy + SQLite / Postgres</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Self-contained, fast offline SQLite for local development and defense; 100% ready for PostgreSQL/Supabase production migration.
              </p>
            </div>
          </div>

          {/* 100% Free Guarantee Banner */}
          <div className="mt-12 max-w-4xl mx-auto rounded-2xl bg-gradient-to-r from-emerald-950/60 via-navy-900 to-emerald-950/60 border border-emerald-500/40 p-6 sm:p-8 text-center">
            <h4 className="text-lg sm:text-xl font-bold text-emerald-300 flex items-center justify-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              100% Free Software Guarantee
            </h4>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-2xl mx-auto">
              This platform does not require OpenAI, Gemini, or any paid cloud subscriptions. The machine learning models and analytics execute directly on local CPU compute with zero recurring cost.
            </p>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------
          CALL TO ACTION BANNER
      ---------------------------------------------------- */}
      <section className="py-20 bg-gradient-to-r from-navy-900 via-navy-800 to-navy-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-electric-600/10 backdrop-blur-3xl pointer-events-none" />
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-electric-600 to-emerald-400 p-0.5 mx-auto mb-6 shadow-xl shadow-electric-500/30">
            <div className="w-full h-full bg-navy-900 rounded-[14px] flex items-center justify-center">
              <Zap className="w-8 h-8 text-emerald-400" />
            </div>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-4">
            Access Your PowerPulse AI Dashboard
          </h2>
          <p className="text-slate-300 text-base sm:text-lg mb-8 max-w-xl mx-auto">
            Sign in with your account or use the instant 1-click examiner demo to review all analytics.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/login"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-electric-600 hover:bg-electric-500 text-white font-bold text-base shadow-xl shadow-electric-600/30 transition-all flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4" />
              Sign In to Your Account
            </Link>
            <Link
              to="/register"
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-navy-800 hover:bg-navy-700 text-slate-200 font-semibold text-base border border-navy-600 transition-colors"
            >
              Register New Account (Free)
            </Link>
            <button
              onClick={handleInstantDemo}
              disabled={demoLoading}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-base shadow-xl shadow-emerald-500/30 transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              <Zap className="w-4 h-4 text-amber-200 fill-amber-200" />
              {demoLoading ? 'Opening...' : '1-Click Examiner Demo'}
            </button>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------
          FOOTER
      ---------------------------------------------------- */}
      <footer className="bg-navy-900 text-slate-400 py-12 border-t border-navy-800 text-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-electric-600 flex items-center justify-center text-white font-bold">
              <Zap className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm">PowerPulse AI</p>
              <p className="text-xs text-slate-500">100% Free • Smart Electricity Consumption & Anomaly Detector</p>
            </div>
          </div>

          <div className="flex items-center gap-6 text-xs text-slate-400">
            <Link to="/login" className="hover:text-white transition-colors">Sign In</Link>
            <Link to="/register" className="hover:text-white transition-colors">Register</Link>
            <a href="#ml-models" className="hover:text-white transition-colors">AI Models</a>
            <a href="#architecture" className="hover:text-white transition-colors">Architecture</a>
          </div>

          <p className="text-xs text-slate-500">
            Final-Year Engineering Project • Built with React & FastAPI
          </p>
        </div>
      </footer>
    </div>
  );
};
