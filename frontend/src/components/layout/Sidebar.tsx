import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  PieChart,
  Calculator,
  Lightbulb,
  Database,
  Settings,
  Zap,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose?: () => void;
}

const navItems = [
  { name: 'Overview', to: '/dashboard', icon: LayoutDashboard },
  { name: 'Consumption Analytics', to: '/analytics', icon: BarChart3 },
  { name: 'AI Forecasting', to: '/forecasting', icon: TrendingUp },
  { name: 'Anomaly Detection', to: '/anomalies', icon: AlertTriangle },
  { name: 'Usage Patterns', to: '/patterns', icon: PieChart },
  { name: 'Electricity Bill', to: '/bill', icon: Calculator },
  { name: 'Recommendations', to: '/recommendations', icon: Lightbulb },
  { name: 'Dataset Management', to: '/datasets', icon: Database },
  { name: 'Settings', to: '/settings', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-50 h-screen w-64 bg-[#101B2D] text-white flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand header */}
        <div className="h-16 flex items-center px-6 gap-3 border-b border-slate-800">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-emerald-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Zap className="w-5 h-5 text-white fill-white" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
              PowerPulse <span className="text-xs px-1.5 py-0.5 rounded bg-blue-600/30 text-blue-400 font-semibold border border-blue-500/30">AI</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-medium">Smart Energy Analytics</p>
          </div>
        </div>

        {/* Navigation list */}
        <div className="flex-1 py-4 px-3 overflow-y-auto space-y-1">
          <div className="px-3 pb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Menu
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.name}</span>
              </NavLink>
            );
          })}
        </div>

        {/* System info badge */}
        <div className="p-4 border-t border-slate-800 bg-[#0c1523]/60">
          <div className="text-xs text-slate-400">
            <p className="font-semibold text-slate-300">College Major Project</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Final-Year B.Tech / BE Demo</p>
          </div>
        </div>
      </aside>
    </>
  );
};

