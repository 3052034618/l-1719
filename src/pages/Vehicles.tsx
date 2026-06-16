
import { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Filter,
  Car,
  MapPin,
  Gauge,
  Calendar,
  MoreHorizontal,
} from 'lucide-react';
import Header from '@/components/Header';
import type { Vehicle } from '@shared/types';
import dayjs from 'dayjs';

export default function Vehicles() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    loadVehicles();
  }, [statusFilter]);

  const loadVehicles = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      const res = await fetch(`/api/vehicles?${params}`);
      const data = await res.json();
      setVehicles(data);
    } catch (error) {
      console.error('Failed to load vehicles:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredVehicles = vehicles.filter(
    (v) =>
      v.plate_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.model.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const statusColors: Record<string, string> = {
    available: 'bg-green-100 text-green-700',
    rented: 'bg-blue-100 text-blue-700',
    maintenance: 'bg-amber-100 text-amber-700',
    cleaning: 'bg-purple-100 text-purple-700',
  };

  const statusLabels: Record<string, string> = {
    available: '可预订',
    rented: '已租出',
    maintenance: '维护中',
    cleaning: '清洁中',
  };

  const typeLabels: Record<string, string> = {
    economy: '经济型',
    compact: '紧凑型',
    standard: '标准型',
    suv: 'SUV',
    luxury: '豪华型',
    new_energy: '新能源',
  };

  return (
    <div className="min-h-screen">
      <Header
        title="车辆管理"
        subtitle="管理车队所有车辆信息"
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
                placeholder="搜索车牌、品牌、车型..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-72 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              />
            </div>

            <div className="flex bg-white rounded-lg border border-gray-200 p-1">
              {['all', 'available', 'rented', 'maintenance'].map((status) => (
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

            <div className="flex bg-white rounded-lg border border-gray-200 p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  viewMode === 'grid' ? 'bg-gray-100 text-gray-800' : 'text-gray-600'
                }`}
              >
                网格
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  viewMode === 'list' ? 'bg-gray-100 text-gray-800' : 'text-gray-600'
                }`}
              >
                列表
              </button>
            </div>
          </div>

          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
            <Plus size={18} />
            新增车辆
          </button>
        </div>

        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredVehicles.map((vehicle) => (
              <div
                key={vehicle.id}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all group"
              >
                <div className="h-40 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center relative">
                  <span className="text-6xl">🚗</span>
                  <span
                    className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-medium ${
                      statusColors[vehicle.status]
                    }`}
                  >
                    {statusLabels[vehicle.status]}
                  </span>
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-semibold text-gray-800">
                        {vehicle.brand} {vehicle.model}
                      </h4>
                      <p className="text-sm text-blue-600 font-medium">
                        {vehicle.plate_number}
                      </p>
                    </div>
                    <button className="p-1.5 hover:bg-gray-100 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreHorizontal size={18} className="text-gray-500" />
                    </button>
                  </div>

                  <div className="space-y-2 text-sm text-gray-500 pt-2 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Gauge size={14} />
                        里程
                      </span>
                      <span className="text-gray-700">
                        {vehicle.mileage?.toLocaleString() || 0} km
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Car size={14} />
                        车型
                      </span>
                      <span className="text-gray-700">
                        {typeLabels[vehicle.type] || vehicle.type}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <MapPin size={14} />
                        门店
                      </span>
                      <span className="text-gray-700">
                        {vehicle.store_name || '朝阳门店'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                    <div>
                      <span className="text-xs text-gray-400">日租金</span>
                      <p className="text-lg font-bold text-blue-600">
                        ¥{vehicle.daily_rate}
                        <span className="text-xs font-normal text-gray-400">/天</span>
                      </p>
                    </div>
                    <button className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 text-sm rounded-lg transition-colors">
                      查看详情
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-5 py-3 text-sm font-medium text-gray-600">
                    车辆信息
                  </th>
                  <th className="text-left px-5 py-3 text-sm font-medium text-gray-600">
                    车型
                  </th>
                  <th className="text-left px-5 py-3 text-sm font-medium text-gray-600">
                    里程
                  </th>
                  <th className="text-left px-5 py-3 text-sm font-medium text-gray-600">
                    所属门店
                  </th>
                  <th className="text-left px-5 py-3 text-sm font-medium text-gray-600">
                    日租金
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
                {filteredVehicles.map((vehicle) => (
                  <tr key={vehicle.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center text-2xl">
                          🚗
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">
                            {vehicle.brand} {vehicle.model}
                          </p>
                          <p className="text-sm text-blue-600">{vehicle.plate_number}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600">
                      {typeLabels[vehicle.type] || vehicle.type}
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600">
                      {vehicle.mileage?.toLocaleString() || 0} km
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600">
                      {vehicle.store_name || '朝阳门店'}
                    </td>
                    <td className="px-5 py-4 font-semibold text-blue-600">
                      ¥{vehicle.daily_rate}/天
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          statusColors[vehicle.status]
                        }`}
                      >
                        {statusLabels[vehicle.status]}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                        <MoreHorizontal size={18} className="text-gray-500" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {filteredVehicles.length === 0 && !loading && (
          <div className="text-center py-16 text-gray-400">
            <Car size={48} className="mx-auto mb-3 opacity-50" />
            <p>暂无车辆数据</p>
          </div>
        )}
      </div>
    </div>
  );
}
