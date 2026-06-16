
import { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Filter,
  MoreHorizontal,
  Calendar,
  Car,
  User,
  Clock,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import Header from '@/components/Header';
import type { Booking } from '@shared/types';
import dayjs from 'dayjs';

export default function Bookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadBookings();
  }, [currentPage, statusFilter]);

  const loadBookings = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: '10',
      });
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      const res = await fetch(`/api/bookings?${params}`);
      const data = await res.json();
      setBookings(data.data || data || []);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error('Failed to load bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBookings = bookings.filter(
    (b) =>
      b.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.plate_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        title="预订管理"
        subtitle="管理所有车辆预订订单"
      />

      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="搜索订单号、客户、车牌号..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-72 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              />
            </div>

            <div className="flex bg-white rounded-lg border border-gray-200 p-1">
              {['all', 'pending', 'confirmed', 'active', 'completed'].map((status) => (
                <button
                  key={status}
                  onClick={() => {
                    setStatusFilter(status);
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    statusFilter === status
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {status === 'all' ? '全部' : statusLabels[status]}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Plus size={18} />
            新建预订
          </button>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-5 py-3 text-sm font-medium text-gray-600">
                    订单信息
                  </th>
                  <th className="text-left px-5 py-3 text-sm font-medium text-gray-600">
                    客户信息
                  </th>
                  <th className="text-left px-5 py-3 text-sm font-medium text-gray-600">
                    取还车信息
                  </th>
                  <th className="text-left px-5 py-3 text-sm font-medium text-gray-600">
                    费用
                  </th>
                  <th className="text-left px-5 py-3 text-sm font-medium text-gray-600">
                    状态
                  </th>
                  <th className="text-left px-5 py-3 text-sm font-medium text-gray-600">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                          <Car size={18} className="text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{booking.id}</p>
                          <p className="text-sm text-gray-500">
                            {booking.plate_number || booking.vehicle_type || '未分配车辆'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-gray-800">
                        {booking.customer_name || '客户'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {booking.phone || '138****8888'}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar size={14} />
                        <span>
                          {dayjs(booking.pickup_time).format('MM-DD HH:mm')} ~{' '}
                          {dayjs(booking.return_time).format('MM-DD HH:mm')}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        {booking.pickup_store || '朝阳门店'} 取车
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-gray-800">
                        ¥{booking.total_amount?.toLocaleString()}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          statusColors[booking.status]
                        }`}
                      >
                        {statusLabels[booking.status]}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                        <MoreHorizontal size={18} className="text-gray-500" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredBookings.length === 0 && !loading && (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-gray-400">
                      暂无预订记录
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              共 {bookings.length} 条记录
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 rounded-lg text-sm transition-colors ${
                    currentPage === page
                      ? 'bg-blue-500 text-white'
                      : 'border border-gray-200 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
