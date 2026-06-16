import { useState, useEffect } from 'react';
import {
  Wrench,
  Clock,
  CheckCircle,
  Package,
  Plus,
  Search,
  Filter,
  Car,
  MoreHorizontal,
  AlertTriangle,
} from 'lucide-react';
import Header from '@/components/Header';
import type { MaintenanceOrder, PartInventory } from '@shared/types';
import dayjs from 'dayjs';

export default function Maintenance() {
  const [orders, setOrders] = useState<MaintenanceOrder[]>([]);
  const [parts, setParts] = useState<PartInventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'orders' | 'parts'>('orders');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    if (activeTab === 'orders') {
      loadOrders();
    } else {
      loadParts();
    }
  }, [activeTab, statusFilter]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      const res = await fetch(`/api/maintenance/orders?${params}`);
      const data = await res.json();
      setOrders(data.data || data || []);
    } catch (error) {
      console.error('Failed to load maintenance orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadParts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/maintenance/parts');
      const data = await res.json();
      setParts(data);
    } catch (error) {
      console.error('Failed to load parts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId: string, status: string) => {
    try {
      const res = await fetch(`/api/maintenance/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        await loadOrders();
        await loadParts();
      }
    } catch (error) {
      console.error('Failed to update order status:', error);
    }
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700',
    in_progress: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-gray-100 text-gray-700',
  };

  const statusLabels: Record<string, string> = {
    pending: '待处理',
    in_progress: '进行中',
    completed: '已完成',
    cancelled: '已取消',
  };

  const typeLabels: Record<string, string> = {
    routine: '常规保养',
    repair: '故障维修',
    inspection: '年检',
    accident: '事故维修',
  };

  return (
    <div className="min-h-screen">
      <Header
        title="维保管理"
        subtitle="按里程自动生成工单，管理配件库存"
      />

      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex bg-white rounded-lg border border-gray-200 p-1">
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'orders'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              维保工单
            </button>
            <button
              onClick={() => setActiveTab('parts')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'parts'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              配件库存
            </button>
          </div>

          {activeTab === 'orders' ? (
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
              <Plus size={18} />
              创建工单
            </button>
          ) : (
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
              <Plus size={18} />
              新增配件
            </button>
          )}
        </div>

        {activeTab === 'orders' && (
          <div className="flex items-center gap-3">
            <div className="flex bg-white rounded-lg border border-gray-200 p-1">
              {['all', 'pending', 'in_progress', 'completed'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
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
        )}

        {activeTab === 'orders' ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center">
                  <Clock size={24} className="text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">待处理工单</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {orders.filter((o) => o.status === 'pending').length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Wrench size={24} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">进行中</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {orders.filter((o) => o.status === 'in_progress').length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
                  <CheckCircle size={24} className="text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">本月完成</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {orders.filter((o) => o.status === 'completed').length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Package size={24} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">配件种类</p>
                  <p className="text-2xl font-bold text-gray-800">{parts.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
                  <CheckCircle size={24} className="text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">库存充足</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {parts.filter((p) => (p.quantity || 0) >= (p.min_stock || 0)).length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center">
                  <AlertTriangle size={24} className="text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">库存预警</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {parts.filter((p) => (p.quantity || 0) < (p.min_stock || 0)).length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {activeTab === 'orders' ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-5 py-3 text-sm font-medium text-gray-600">
                      工单号
                    </th>
                    <th className="text-left px-5 py-3 text-sm font-medium text-gray-600">
                      车辆信息
                    </th>
                    <th className="text-left px-5 py-3 text-sm font-medium text-gray-600">
                      维保类型
                    </th>
                    <th className="text-left px-5 py-3 text-sm font-medium text-gray-600">
                      预计费用
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
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4">
                        <p className="font-medium text-gray-800">{order.id}</p>
                        <p className="text-xs text-gray-400">
                          {dayjs(order.created_at).format('YYYY-MM-DD')}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-xl">
                            🚗
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-800">
                              {order.plate_number || '京A12345'}
                            </p>
                            <p className="text-xs text-gray-500">
                              里程: {order.mileage?.toLocaleString() || 0} km
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm text-gray-600">
                          {typeLabels[order.type] || order.type}
                        </span>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {order.description || '常规保养'}
                        </p>
                      </td>
                      <td className="px-5 py-4 font-semibold text-gray-800">
                        ¥{order.total_cost?.toLocaleString() || order.estimated_cost?.toLocaleString() || 0}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            statusColors[order.status]
                          }`}
                        >
                          {statusLabels[order.status]}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          {order.status === 'pending' && (
                            <button
                              onClick={() => handleUpdateStatus(order.id, 'in_progress')}
                              className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                            >
                              开始维修
                            </button>
                          )}
                          {order.status === 'in_progress' && (
                            <button
                              onClick={() => handleUpdateStatus(order.id, 'completed')}
                              className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
                            >
                              完成维保
                            </button>
                          )}
                          {order.status === 'completed' && (
                            <span className="text-xs text-gray-400">已完成</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {orders.length === 0 && !loading && (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-gray-400">
                        暂无维保工单
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-5 py-3 text-sm font-medium text-gray-600">
                      配件名称
                    </th>
                    <th className="text-left px-5 py-3 text-sm font-medium text-gray-600">
                      规格型号
                    </th>
                    <th className="text-left px-5 py-3 text-sm font-medium text-gray-600">
                      库存数量
                    </th>
                    <th className="text-left px-5 py-3 text-sm font-medium text-gray-600">
                      安全库存
                    </th>
                    <th className="text-left px-5 py-3 text-sm font-medium text-gray-600">
                      单价
                    </th>
                    <th className="text-left px-5 py-3 text-sm font-medium text-gray-600">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {parts.map((part) => (
                    <tr key={part.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center">
                            <Package size={18} className="text-gray-500" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{part.name}</p>
                            <p className="text-xs text-gray-400">{part.category || '保养配件'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-600">
                        {part.sku || '标准款'}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`font-semibold ${
                            (part.quantity || 0) < (part.min_stock || 0)
                              ? 'text-red-600'
                              : 'text-gray-800'
                          }`}
                        >
                          {part.quantity || 0} 件
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-600">
                        {part.min_stock || 0} 件
                      </td>
                      <td className="px-5 py-4 font-semibold text-gray-800">
                        ¥{part.unit_price?.toLocaleString() || part.price?.toLocaleString() || 0}
                      </td>
                      <td className="px-5 py-4">
                        <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                          <MoreHorizontal size={18} className="text-gray-500" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {parts.length === 0 && !loading && (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-gray-400">
                        暂无配件数据
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
