
import { useState, useEffect } from 'react';
import {
  Car,
  AlertTriangle,
  Shield,
  FileText,
  Search,
  Filter,
  MoreHorizontal,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import Header from '@/components/Header';
import type { AccidentRecord } from '@shared/types';
import dayjs from 'dayjs';

export default function Accidents() {
  const [accidents, setAccidents] = useState<AccidentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedAccident, setSelectedAccident] = useState<AccidentRecord | null>(null);

  useEffect(() => {
    loadAccidents();
  }, [statusFilter]);

  const loadAccidents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      const res = await fetch(`/api/accidents?${params}`);
      const data = await res.json();
      setAccidents(data);
      if (data.length > 0) {
        setSelectedAccident(data[0]);
      }
    } catch (error) {
      console.error('Failed to load accidents:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAccidents = accidents.filter(
    (a) =>
      a.vehicle_plate?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const statusColors: Record<string, string> = {
    reported: 'bg-red-100 text-red-700',
    investigating: 'bg-amber-100 text-amber-700',
    insurance_claim: 'bg-blue-100 text-blue-700',
    settled: 'bg-green-100 text-green-700',
    closed: 'bg-gray-100 text-gray-700',
  };

  const statusLabels: Record<string, string> = {
    reported: '已上报',
    investigating: '调查中',
    insurance_claim: '理赔中',
    settled: '已解决',
    closed: '已结案',
  };

  const severityColors: Record<string, string> = {
    minor: 'bg-green-100 text-green-700',
    moderate: 'bg-amber-100 text-amber-700',
    severe: 'bg-red-100 text-red-700',
  };

  const severityLabels: Record<string, string> = {
    minor: '轻微',
    moderate: '中等',
    severe: '严重',
  };

  return (
    <div className="min-h-screen">
      <Header
        title="事故管理"
        subtitle="事故处理与保险理赔管理"
      />

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center">
                <AlertTriangle size={24} className="text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">事故总数</p>
                <p className="text-2xl font-bold text-gray-800">{accidents.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center">
                <Clock size={24} className="text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">处理中</p>
                <p className="text-2xl font-bold text-gray-800">
                  {accidents.filter((a) => a.status !== 'closed').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                <Shield size={24} className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">理赔中</p>
                <p className="text-2xl font-bold text-gray-800">
                  {accidents.filter((a) => a.claim_status === 'pending').length}
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
                <p className="text-sm text-gray-500">已结案</p>
                <p className="text-2xl font-bold text-gray-800">
                  {accidents.filter((a) => a.status === 'closed').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="搜索车牌号、事故编号..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-72 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              />
            </div>

            <div className="flex bg-white rounded-lg border border-gray-200 p-1">
              {['all', 'reported', 'investigating', 'insurance_claim', 'closed'].map(
                (status) => (
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
                )
              )}
            </div>
          </div>

          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
            <FileText size={18} />
            上报事故
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-3">
            <h3 className="font-medium text-gray-700 px-1">事故列表</h3>
            <div className="space-y-2 max-h-[calc(100vh-320px)] overflow-y-auto pr-1">
              {filteredAccidents.map((accident) => (
                <div
                  key={accident.id}
                  onClick={() => setSelectedAccident(accident)}
                  className={`bg-white rounded-xl border p-4 cursor-pointer transition-all hover:shadow-md ${
                    selectedAccident?.id === accident.id
                      ? 'border-blue-500 shadow-md'
                      : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium text-gray-800 text-sm">{accident.id}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {accident.vehicle_plate || '京A12345'}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        statusColors[accident.status]
                      }`}
                    >
                      {statusLabels[accident.status]}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${
                        severityColors[accident.severity]
                      }`}
                    >
                      {severityLabels[accident.severity]}
                    </span>
                    <span className="text-xs text-gray-400">
                      {dayjs(accident.accident_time).format('MM-DD HH:mm')}
                    </span>
                  </div>
                </div>
              ))}
              {filteredAccidents.length === 0 && !loading && (
                <div className="text-center py-8 text-gray-400 text-sm">暂无事故记录</div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
            {selectedAccident ? (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-800">事故详情</h3>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        statusColors[selectedAccident.status]
                      }`}
                    >
                      {statusLabels[selectedAccident.status]}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        severityColors[selectedAccident.severity]
                      }`}
                    >
                      {severityLabels[selectedAccident.severity]}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-700 flex items-center gap-2">
                      <Car size={18} className="text-blue-500" />
                      车辆信息
                    </h4>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">车牌号</span>
                        <span className="text-sm font-medium text-gray-800">
                          {selectedAccident.vehicle_plate || '京A12345'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">车型</span>
                        <span className="text-sm text-gray-800">
                          {selectedAccident.vehicle_type || '经济型'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-700 flex items-center gap-2">
                      <AlertTriangle size={18} className="text-amber-500" />
                      事故信息
                    </h4>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">发生时间</span>
                        <span className="text-sm text-gray-800">
                          {dayjs(selectedAccident.accident_time).format('YYYY-MM-DD HH:mm')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">地点</span>
                        <span className="text-sm text-gray-800">
                          {selectedAccident.location || '北京市朝阳区'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h4 className="font-medium text-gray-700 mb-2">事故描述</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {selectedAccident.description ||
                      '车辆在行驶过程中与前车发生追尾，造成车辆前部损坏，无人员伤亡。'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-700 flex items-center gap-2">
                      <Shield size={18} className="text-purple-500" />
                      保险理赔
                    </h4>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">保险公司</span>
                        <span className="text-sm text-gray-800">
                          {selectedAccident.insurance_company || '平安保险'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">保单号</span>
                        <span className="text-sm text-gray-800 font-mono">
                          {selectedAccident.insurance_policy || 'PA20240101'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">理赔状态</span>
                        <span
                          className={`text-sm font-medium ${
                            selectedAccident.claim_status === 'completed'
                              ? 'text-green-600'
                              : selectedAccident.claim_status === 'pending'
                              ? 'text-amber-600'
                              : 'text-gray-600'
                          }`}
                        >
                          {selectedAccident.claim_status === 'completed'
                            ? '已理赔'
                            : selectedAccident.claim_status === 'pending'
                            ? '理赔中'
                            : '未申请'}
                        </span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-gray-200">
                        <span className="text-sm font-medium text-gray-700">预估费用</span>
                        <span className="text-sm font-bold text-blue-600">
                          ¥{selectedAccident.estimated_cost?.toLocaleString() || 0}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-700">处理记录</h4>
                    <div className="space-y-2">
                      <div className="flex gap-3">
                        <div className="w-2 h-2 rounded-full bg-green-500 mt-2"></div>
                        <div>
                          <p className="text-sm text-gray-800">事故已上报</p>
                          <p className="text-xs text-gray-400">2026-01-15 14:30</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <div className="w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
                        <div>
                          <p className="text-sm text-gray-800">保险已报案</p>
                          <p className="text-xs text-gray-400">2026-01-15 15:00</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <div className="w-2 h-2 rounded-full bg-amber-500 mt-2"></div>
                        <div>
                          <p className="text-sm text-gray-800">定损中</p>
                          <p className="text-xs text-gray-400">进行中...</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors">
                    更新理赔状态
                  </button>
                  <button className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                    结案
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <AlertTriangle size={48} className="mb-3 opacity-50" />
                <p>请选择一条事故记录查看详情</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
