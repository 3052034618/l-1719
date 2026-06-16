
import { useState, useEffect } from 'react';
import {
  Calendar,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  Send,
  RefreshCw,
  Filter,
  ChevronRight,
} from 'lucide-react';
import Header from '@/components/Header';
import { useAppStore } from '@/store/useAppStore';
import type { DispatchPlan } from '@shared/types';
import dayjs from 'dayjs';

export default function Dispatch() {
  const [plans, setPlans] = useState<DispatchPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<DispatchPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const res = await fetch('/api/dispatch/plans');
      const data = await res.json();
      setPlans(data);
      if (data.length > 0) {
        setSelectedPlan(data[0]);
      }
    } catch (error) {
      console.error('Failed to load dispatch plans:', error);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch('/api/dispatch/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: dayjs().format('YYYY-MM-DD') }),
      });
      if (res.ok) {
        await loadPlans();
      }
    } catch (error) {
      console.error('Failed to generate plan:', error);
    } finally {
      setGenerating(false);
    }
  };

  const handleApprove = async (planId: string) => {
    try {
      const res = await fetch(`/api/dispatch/plans/${planId}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved: true }),
      });
      if (res.ok) {
        await loadPlans();
      }
    } catch (error) {
      console.error('Failed to approve plan:', error);
    }
  };

  const handlePush = async (planId: string) => {
    try {
      const res = await fetch(`/api/dispatch/plans/${planId}/push`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        await loadPlans();
      }
    } catch (error) {
      console.error('Failed to push plan:', error);
    }
  };

  const filteredPlans =
    filterStatus === 'all'
      ? plans
      : plans.filter((p) => p.status === filterStatus);

  const statusColors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700',
    pending: 'bg-amber-100 text-amber-700',
    approved: 'bg-blue-100 text-blue-700',
    pushed: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
  };

  const statusLabels: Record<string, string> = {
    draft: '草稿',
    pending: '待审批',
    approved: '已批准',
    pushed: '已推送',
    cancelled: '已取消',
  };

  return (
    <div className="min-h-screen">
      <Header
        title="智能调度中心"
        subtitle="自动生成最优车辆分配方案，经理审批后推送门店"
      />

      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex bg-white rounded-lg border border-gray-200 p-1">
              {['all', 'pending', 'approved', 'pushed'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    filterStatus === status
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {status === 'all' ? '全部' : statusLabels[status]}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw size={18} className={generating ? 'animate-spin' : ''} />
              生成今日方案
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-3">
            <h3 className="font-medium text-gray-700 px-1">调度方案列表</h3>
            <div className="space-y-2 max-h-[calc(100vh-240px)] overflow-y-auto pr-1">
              {filteredPlans.map((plan) => (
                <div
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan)}
                  className={`bg-white rounded-xl border p-4 cursor-pointer transition-all hover:shadow-md ${
                    selectedPlan?.id === plan.id
                      ? 'border-blue-500 shadow-md'
                      : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium text-gray-800">
                        {dayjs(plan.plan_date).format('MM月DD日')} 调度方案
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        共 {plan.total_assignments} 条分配
                      </p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        statusColors[plan.status]
                      }`}
                    >
                      {statusLabels[plan.status]}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>预期收入: ¥{plan.expected_revenue?.toLocaleString()}</span>
                    <ChevronRight size={16} />
                  </div>
                </div>
              ))}
              {filteredPlans.length === 0 && (
                <div className="text-center py-8 text-gray-400 text-sm">
                  暂无调度方案
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
            {selectedPlan ? (
              <>
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      {dayjs(selectedPlan.plan_date).format('YYYY年MM月DD日')} 车辆调度方案
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      方案编号: {selectedPlan.id}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedPlan.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleApprove(selectedPlan.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors"
                        >
                          <CheckCircle size={16} />
                          审批通过
                        </button>
                        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-lg transition-colors">
                          <XCircle size={16} />
                          驳回
                        </button>
                      </>
                    )}
                    {selectedPlan.status === 'approved' && (
                      <button
                        onClick={() => handlePush(selectedPlan.id)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                      >
                        <Send size={18} />
                        推送门店
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm text-blue-600">分配订单</p>
                    <p className="text-2xl font-bold text-blue-700 mt-1">
                      {selectedPlan.total_assignments}
                    </p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <p className="text-sm text-green-600">预期收入</p>
                    <p className="text-2xl font-bold text-green-700 mt-1">
                      ¥{selectedPlan.expected_revenue?.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-amber-50 rounded-lg p-4">
                    <p className="text-sm text-amber-600">覆盖门店</p>
                    <p className="text-2xl font-bold text-amber-700 mt-1">3</p>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-4">
                  <h4 className="font-medium text-gray-700 mb-3">分配详情</h4>
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {selectedPlan.assignments?.map((assignment: any) => (
                      <div
                        key={assignment.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-lg">
                            🚗
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">
                              {assignment.vehicle_plate || '京A12345'}
                            </p>
                            <p className="text-xs text-gray-500">
                              {assignment.vehicle_type || '经济型 · 丰田卡罗拉'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-800">
                            {assignment.customer_name || '张先生'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {assignment.store_name || '朝阳门店'}
                          </p>
                        </div>
                      </div>
                    ))}
                    {(!selectedPlan.assignments || selectedPlan.assignments.length === 0) && (
                      <p className="text-center py-8 text-gray-400 text-sm">暂无分配详情</p>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <Calendar size={48} className="mb-3 opacity-50" />
                <p>请选择一个调度方案查看详情</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
