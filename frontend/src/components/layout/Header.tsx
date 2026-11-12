import React from 'react';
import { Menu, Database, Calendar, LogOut, User as UserIcon, Sparkles } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useDataset } from '../../contexts/DatasetContext';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const { datasets, activeDataset, selectDataset, filterPeriod, setFilterPeriod, seedDemo, isLoading } = useDataset();

  return (
    <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-30 px-4 lg:px-8 flex items-center justify-between">
      {/* Left side: Hamburger & active dataset */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Dataset selector */}
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-slate-400 hidden sm:block" />
          {datasets.length > 0 ? (
            <select
              value={activeDataset?.id || ''}
              onChange={(e) => selectDataset(Number(e.target.value))}
              className="bg-slate-50 border border-slate-200 text-slate-800 text-xs sm:text-sm rounded-lg px-2.5 py-1.5 font-medium focus:ring-2 focus:ring-blue-500 outline-none max-w-[180px] sm:max-w-xs truncate"
            >
              {datasets.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.dataset_type})
                </option>
              ))}
            </select>
          ) : (
            <button
              onClick={seedDemo}
              disabled={isLoading}
              className="flex items-center gap-1.5 text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-lg transition-colors shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>{isLoading ? 'Loading Demo...' : 'Load UCI Demo Dataset'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Right side: Filter & User Profile */}
      <div className="flex items-center gap-3">
        {/* Date period selector */}
        <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
          <Calendar className="w-3.5 h-3.5 text-slate-400 ml-2 mr-1 hidden sm:block" />
          {[
            { id: 'all', label: 'All Time' },
            { id: 'today', label: 'Today' },
            { id: 'last_7_days', label: '7 Days' },
            { id: 'last_30_days', label: '30 Days' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setFilterPeriod(item.id)}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                filterPeriod === item.id
                  ? 'bg-white text-blue-600 shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* User profile dropdown & logout */}
        <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
              {user?.full_name ? user.full_name.charAt(0).toUpperCase() : <UserIcon className="w-4 h-4" />}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-semibold text-slate-800 leading-tight">{user?.full_name || 'Student'}</p>
              <p className="text-[10px] text-slate-400 truncate max-w-[120px]">{user?.email}</p>
            </div>
          </div>

          <button
            onClick={logout}
            title="Sign Out"
            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

