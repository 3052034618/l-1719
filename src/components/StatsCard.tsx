
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: number;
  trendLabel?: string;
  color?: 'blue' | 'green' | 'amber' | 'red' | 'purple';
  subtitle?: string;
}

const colorClasses = {
  blue: 'from-blue-500 to-blue-600',
  green: 'from-emerald-500 to-emerald-600',
  amber: 'from-amber-500 to-amber-600',
  red: 'from-red-500 to-red-600',
  purple: 'from-purple-500 to-purple-600',
};

const bgColorClasses = {
  blue: 'bg-blue-50',
  green: 'bg-emerald-50',
  amber: 'bg-amber-50',
  red: 'bg-red-50',
  purple: 'bg-purple-50',
};

const iconColorClasses = {
  blue: 'text-blue-600',
  green: 'text-emerald-600',
  amber: 'text-amber-600',
  red: 'text-red-600',
  purple: 'text-purple-600',
};

export default function StatsCard({
  title,
  value,
  icon: Icon,
  trend,
  trendLabel,
  color = 'blue',
  subtitle,
}: StatsCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
          {trend !== undefined && (
            <div className="flex items-center gap-1 mt-2">
              {trend >= 0 ? (
                <TrendingUp size={14} className="text-emerald-500" />
              ) : (
                <TrendingDown size={14} className="text-red-500" />
              )}
              <span
                className={cn(
                  'text-xs font-medium',
                  trend >= 0 ? 'text-emerald-500' : 'text-red-500'
                )}
              >
                {trend >= 0 ? '+' : ''}
                {trend}%
              </span>
              {trendLabel && (
                <span className="text-xs text-gray-400">{trendLabel}</span>
              )}
            </div>
          )}
        </div>
        <div
          className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center',
            bgColorClasses[color]
          )}
        >
          <Icon size={24} className={iconColorClasses[color]} />
        </div>
      </div>

      <div className={cn('h-1 mt-4 rounded-full bg-gradient-to-r', colorClasses[color])}></div>
    </div>
  );
}
