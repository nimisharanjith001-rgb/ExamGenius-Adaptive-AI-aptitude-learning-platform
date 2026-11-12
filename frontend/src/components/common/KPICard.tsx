import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  unit?: string;
  subtitle?: string;
  icon: LucideIcon;
  changePct?: number;
  iconColor?: string;
  iconBgColor?: string;
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  unit,
  subtitle,
  icon: Icon,
  changePct,
  iconColor = 'text-blue-600',
  iconBgColor = 'bg-blue-50',
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between gap-2">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate">{title}</p>
          <div className={`w-10 h-10 rounded-xl ${iconBgColor} flex items-center justify-center ${iconColor} shrink-0 shadow-inner`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>

        <div className="flex items-baseline gap-1.5 mt-2">
          <span className="text-2xl font-extrabold tracking-tight text-slate-900">{value}</span>
          {unit && <span className="text-xs font-semibold text-slate-500">{unit}</span>}
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
        {changePct !== undefined ? (
          <div className="flex items-center gap-1">
            {changePct >= 0 ? (
              <span className="inline-flex items-center gap-0.5 text-amber-600 font-bold">
                <TrendingUp className="w-3.5 h-3.5" />
                +{changePct}%
              </span>
            ) : (
              <span className="inline-flex items-center gap-0.5 text-emerald-600 font-bold">
                <TrendingDown className="w-3.5 h-3.5" />
                {changePct}%
              </span>
            )}
            <span className="text-slate-400 text-[11px]">vs prev period</span>
          </div>
        ) : (
          <span className="text-slate-400 text-[11px] font-medium truncate">{subtitle || 'Active dataset metric'}</span>
        )}
      </div>
    </div>
  );
};

