
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Car,
  CalendarDays,
  Users,
  Wrench,
  KeyRound,
  CreditCard,
  BarChart3,
  AlertTriangle,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { useAuthStore } from '@/store/useAuthStore';
import { cn } from '@/lib/utils';

const menuItems = [
  { path: '/dashboard', label: '驾驶舱', icon: LayoutDashboard },
  { path: '/dispatch', label: '智能调度', icon: CalendarDays },
  { path: '/bookings', label: '预订管理', icon: CalendarDays },
  { path: '/vehicles', label: '车辆管理', icon: Car },
  { path: '/customers', label: '客户管理', icon: Users },
  { path: '/maintenance', label: '维保管理', icon: Wrench },
  { path: '/rental', label: '取还车', icon: KeyRound },
  { path: '/billing', label: '费用结算', icon: CreditCard },
  { path: '/reports', label: '统计报表', icon: BarChart3 },
  { path: '/accidents', label: '事故管理', icon: AlertTriangle },
  { path: '/settings', label: '系统设置', icon: Settings },
];

export default function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useAppStore();
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white transition-all duration-300 z-50',
        sidebarCollapsed ? 'w-16' : 'w-60'
      )}
    >
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-700">
        {!sidebarCollapsed && (
          <h1 className="text-lg font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            智行租车
          </h1>
        )}
        {sidebarCollapsed && <div className="w-full flex justify-center">
          <span className="text-xl font-bold text-blue-400">智</span>
        </div>}
      </div>

      <nav className="py-4 flex-1">
        <ul className="space-y-1 px-2">
          {menuItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
                      : 'text-slate-300 hover:bg-slate-700/50 hover:text-white',
                    sidebarCollapsed && 'justify-center'
                  )
                }
              >
                <item.icon size={20} />
                {!sidebarCollapsed && <span className="text-sm">{item.label}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="absolute bottom-0 left-0 right-0 border-t border-slate-700 p-3">
        <div
          className={cn(
            'flex items-center gap-3 mb-3',
            sidebarCollapsed && 'justify-center'
          )}
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-sm font-bold">
            {user?.name?.charAt(0) || '用'}
          </div>
          {!sidebarCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-slate-400 truncate">
                {user?.role === 'manager' && '调度经理'}
                {user?.role === 'store_admin' && '门店管理员'}
                {user?.role === 'finance' && '财务人员'}
                {user?.role === 'engineer' && '维保工程师'}
              </p>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={toggleSidebar}
            className="flex-1 flex items-center justify-center py-1.5 rounded bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
          <button
            onClick={handleLogout}
            className={cn(
              'flex items-center justify-center py-1.5 rounded bg-red-600/20 hover:bg-red-600/40 text-red-400 hover:text-red-300 transition-colors',
              sidebarCollapsed ? 'flex-1' : 'px-3'
            )}
            title="退出登录"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
