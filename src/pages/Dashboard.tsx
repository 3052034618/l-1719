
import { useEffect, useState } from 'react';
import {
  Car,
  Users,
  CalendarCheck,
  DollarSign,
  Wrench,
  AlertTriangle,
  Package,
  TrendingUp,
  Clock,
} from 'lucide-react';
import Header from '@/components/Header';
import StatsCard from '@/components/StatsCard';
import VehicleMap from '@/components/VehicleMap';
import { useAppStore } from '@/store/useAppStore';
import type { DashboardStats, VehicleLocation } from '@shared/types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import dayjs from 'dayjs';

export default function Dashboard() {
  const { stats, fetchStats, vehicleLocations, fetchVehicleLocations } = useAppStore();
  const [rentalData, setRentalData] = useState<any[]>([]);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    fetchStats();
    fetchVehicleLocations();
    loadChartsData();
    loadRecentBookings();
    loadAlerts();

    const interval = setInterval(() => {
      fetchStats();
      fetchVehicleLocations();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchStats, fetchVehicleLocations]);

  const loadChartsData = async () => {
    try {
      const res = await fetch('/api/reports/rental-rate?period=7days');
      const data = await res.json();
      setRentalData(
        data.map((item: any) => ({
          ...item,
          date: dayjs(item.date).format('MM-DD'),
        }))
      );
    } catch (error) {
      console.error('Failed to load rental rate data:', error);
    }

    try {
      const res = await fetch('/api/reports/revenue?period=7days');
      const data = await res.json();
      setRevenueData(
        data.map((item: any) => ({
          ...item,
          date: dayjs(item.date).format('MM-DD'),
        }))
      );
    } catch (error) {
      console.error('Failed to load revenue data:', error);
    }
  };

  const loadRecentBookings = async () => {
    try {
      const res = await fetch('/api/dashboard/recent-bookings');
      const data = await res.json();
      setRecentBookings(data);
    } catch (error) {
      console.error('Failed to load recent bookings:', error);
    }
  };

  const loadAlerts = async () => {
    try {
      const res = await fetch('/api/dashboard/alerts');
      const data = await res.json();
      setAlerts(data);
    } catch (error) {
      console.error('Failed to load alerts:', error);
    }
  };

  const statsData: DashboardStats = stats || {
    total_vehicles: 0,
    available_vehicles: 0,
    rented_vehicles: 0,
    maintenance_vehicles: 0,
    total_bookings: 0,
    active_bookings: 0,
    today_bookings: 0,
    rental_rate: 0,
    monthly_revenue: 0,
    pending_maintenance: 0,
    pending_dispatch: 0,
    low_stock_parts: 0,
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700',
    confirmed: 'bg-blue-100 text-blue-700',
    active: 'bg-green-100 text-green-700',
    completed: 'bg-gray-100 text-gray-700',
    cancelled: 'bg-red-100 text-red-700',
  };

  const statusLabels: Record<string, string> = {
    pending: '待确认',
    confirmed: '已确认',
    active: '进行中',
    completed: '已完成',
    cancelled: '已取消',
  };

  return (
    <div className="min-h-screen">
      <Header
        title="运营驾驶舱"
        subtitle={`${dayjs().format('YYYY年MM月DD日')} 实时数据概览`}
      />

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="运营车辆"
            value={statsData.total_vehicles}
            icon={Car}
            subtitle={`可租 ${statsData.available_vehicles} 台 / 在租 ${statsData.rented_vehicles} 台`}
            color="blue"
          />
          <StatsCard
            title="出租率"
            value={`${statsData.rental_rate}%`}
            icon={TrendingUp}
            trend={5.2}
            trendLabel="较上周"
            color="green"
          />
          <StatsCard
            title="本月收入"
            value={`¥${statsData.monthly_revenue.toLocaleString()}`}
            icon={DollarSign}
            trend={8.7}
            trendLabel="较上月"
            color="purple"
          />
          <StatsCard
            title="今日预订"
            value={statsData.today_bookings}
            icon={CalendarCheck}
            subtitle={`进行中 ${statsData.active_bookings} 单`}
            color="amber"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="待处理维保"
            value={statsData.pending_maintenance}
            icon={Wrench}
            color="amber"
          />
          <StatsCard
            title="待审批调度"
            value={statsData.pending_dispatch}
            icon={Clock}
            color="blue"
          />
          <StatsCard
            title="库存预警"
            value={statsData.low_stock_parts}
            icon={Package}
            color="red"
          />
          <StatsCard
            title="活跃客户"
            value={statsData.total_bookings}
            icon={Users}
            color="green"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">出租率趋势</h3>
              <span className="text-sm text-gray-500">近7天</span>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={rentalData}>
                  <defs>
                    <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" fontSize={12} stroke="#9ca3af" />
                  <YAxis fontSize={12} stroke="#9ca3af" unit="%" />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '8px',
                      border: 'none',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="rate"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fill="url(#colorRate)"
                    name="出租率"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">收入趋势</h3>
              <span className="text-sm text-gray-500">近7天</span>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" fontSize={12} stroke="#9ca3af" />
                  <YAxis fontSize={12} stroke="#9ca3af" />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '8px',
                      border: 'none',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    }}
                    formatter={(value: number) => [`¥${value.toLocaleString()}`, '收入']}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ fill: '#10b981', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">实时车辆分布</h3>
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                实时更新
              </span>
            </div>
            <VehicleMap vehicles={vehicleLocations} height="320px" />
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800">最新预订</h3>
                <a href="#/bookings" className="text-sm text-blue-600 hover:text-blue-700">
                  查看全部
                </a>
              </div>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {recentBookings.slice(0, 5).map((booking: any) => (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                        <Car size={18} className="text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">
                          {booking.customer_name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {booking.plate_number || booking.vehicle_type}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        statusColors[booking.status]
                      }`}
                    >
                      {statusLabels[booking.status]}
                    </span>
                  </div>
                ))}
                {recentBookings.length === 0 && (
                  <p className="text-center text-gray-400 py-4 text-sm">暂无预订记录</p>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                  <AlertTriangle size={18} className="text-amber-500" />
                  预警提醒
                </h3>
                <span className="text-xs text-gray-500">
                  {alerts.length} 条
                </span>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {alerts.slice(0, 5).map((alert: any) => (
                  <div
                    key={alert.id}
                    className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div
                      className={`w-2 h-2 rounded-full mt-1.5 ${
                        alert.type === 'warning'
                          ? 'bg-amber-500'
                          : alert.type === 'error'
                          ? 'bg-red-500'
                          : 'bg-blue-500'
                      }`}
                    ></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800">{alert.title}</p>
                      <p className="text-xs text-gray-500 truncate">{alert.message}</p>
                    </div>
                  </div>
                ))}
                {alerts.length === 0 && (
                  <p className="text-center text-gray-400 py-4 text-sm">暂无预警</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
