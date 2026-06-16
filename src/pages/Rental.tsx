import { useState, useEffect } from 'react';
import {
  Car,
  User,
  Shield,
  CheckCircle,
  FileText,
  ArrowRightLeft,
  AlertTriangle,
} from 'lucide-react';
import Header from '@/components/Header';
import type { Booking } from '@shared/types';
import dayjs from 'dayjs';

export default function Rental() {
  const [activeTab, setActiveTab] = useState<'pickup' | 'return'>('pickup');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [checkResult, setCheckResult] = useState<any>(null);
  const [checking, setChecking] = useState(false);
  const [showContract, setShowContract] = useState(false);
  const [contractData, setContractData] = useState<any>(null);

  useEffect(() => {
    loadBookings();
  }, [activeTab]);

  useEffect(() => {
    if (selectedBooking && activeTab === 'pickup') {
      handleCheckLicense(selectedBooking.id);
    }
  }, [selectedBooking, activeTab]);

  const loadBookings = async () => {
    try {
      const status = activeTab === 'pickup' ? 'confirmed' : 'active';
      const res = await fetch(`/api/bookings?status=${status}&limit=20`);
      const data = await res.json();
      const list = data.data || data || [];
      setBookings(list);
      if (list.length > 0) {
        setSelectedBooking(list[0]);
        setCheckResult(null);
      }
    } catch (error) {
      console.error('Failed to load bookings:', error);
    }
  };

  const handleCheckLicense = async (bookingId: string) => {
    setChecking(true);
    try {
      const res = await fetch(`/api/rental/check-license?bookingId=${bookingId}`);
      const data = await res.json();
      setCheckResult(data);
    } catch (error) {
      console.error('Failed to check license:', error);
    } finally {
      setChecking(false);
    }
  };

  const handlePickup = async (bookingId: string) => {
    try {
      const res = await fetch('/api/rental/pickup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId }),
      });
      if (res.ok) {
        const data = await res.json();
        setContractData(data.contract);
        setShowContract(true);
        await loadBookings();
        setCheckResult(null);
      }
    } catch (error) {
      console.error('Failed to pickup:', error);
    }
  };

  const handleGenerateContract = async (bookingId: string) => {
    try {
      const res = await fetch(`/api/rental/contract/${bookingId}`);
      if (res.ok) {
        const data = await res.json();
        setContractData(data);
        setShowContract(true);
      }
    } catch (error) {
      console.error('Failed to generate contract:', error);
    }
  };

  const handleReturn = async (bookingId: string) => {
    try {
      const res = await fetch('/api/rental/return', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, returnMileage: 5500 }),
      });
      if (res.ok) {
        const data = await res.json();
        alert(`还车成功！总费用: ¥${data.totalAmount}`);
        await loadBookings();
      }
    } catch (error) {
      console.error('Failed to return:', error);
    }
  };

  return (
    <div className="min-h-screen">
      <Header
        title="取还车管理"
        subtitle="取车校验资质，还车自动结算"
      />

      <div className="p-6 space-y-6">
        <div className="flex bg-white rounded-lg border border-gray-200 p-1 w-fit">
          <button
            onClick={() => setActiveTab('pickup')}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'pickup'
                ? 'bg-blue-500 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Car size={18} />
            取车管理
          </button>
          <button
            onClick={() => setActiveTab('return')}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'return'
                ? 'bg-blue-500 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <ArrowRightLeft size={18} />
            还车管理
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-3">
            <h3 className="font-medium text-gray-700 px-1">
              {activeTab === 'pickup' ? '待取车订单' : '待还车订单'}
            </h3>
            <div className="space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
              {bookings.map((booking) => (
                <div
                  key={booking.id}
                  onClick={() => {
                    setSelectedBooking(booking);
                    setCheckResult(null);
                  }}
                  className={`bg-white rounded-xl border p-4 cursor-pointer transition-all hover:shadow-md ${
                    selectedBooking?.id === booking.id
                      ? 'border-blue-500 shadow-md'
                      : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-gray-800 text-sm">{booking.id}</p>
                    <span className="text-xs text-gray-400">
                      {dayjs(booking.pickup_time).format('MM-DD HH:mm')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <User size={14} />
                    <span>{booking.customer_name || '客户'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                    <Car size={14} />
                    <span>{booking.plate_number || booking.vehicle_type || '未分配'}</span>
                  </div>
                </div>
              ))}
              {bookings.length === 0 && (
                <div className="text-center py-8 text-gray-400 text-sm">
                  暂无{activeTab === 'pickup' ? '待取车' : '待还车'}订单
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
            {selectedBooking ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-800">
                    {activeTab === 'pickup' ? '取车详情' : '还车详情'}
                  </h3>
                  <span className="text-sm text-gray-500">
                    订单号: {selectedBooking.id}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-700 flex items-center gap-2">
                      <User size={18} className="text-blue-500" />
                      客户信息
                    </h4>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">姓名</span>
                        <span className="text-sm font-medium text-gray-800">
                          {checkResult?.customer?.name || selectedBooking.customer_name || '张先生'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">手机号</span>
                        <span className="text-sm text-gray-800">
                          {checkResult?.customer?.phone || selectedBooking.phone || '138****8888'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">身份证号</span>
                        <span className="text-sm text-gray-800 font-mono">
                          {checkResult?.customer?.idCard || '110101********1234'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">驾照号</span>
                        <span className="text-sm text-gray-800 font-mono">
                          {checkResult?.customer?.driverLicense || selectedBooking.license_number || '110101********1234'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-700 flex items-center gap-2">
                      <Car size={18} className="text-green-500" />
                      车辆信息
                    </h4>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">车牌号</span>
                        <span className="text-sm font-medium text-gray-800">
                          {selectedBooking.plate_number || '京A12345'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">车型</span>
                        <span className="text-sm text-gray-800">
                          {selectedBooking.vehicle_type || '经济型'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">当前里程</span>
                        <span className="text-sm text-gray-800">5,000 km</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-500">租赁时间</span>
                    <span className="text-sm font-medium text-gray-800">
                      {dayjs(selectedBooking.pickup_time).format('YYYY-MM-DD HH:mm')} ~{' '}
                      {dayjs(selectedBooking.return_time).format('YYYY-MM-DD HH:mm')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">预计费用</span>
                    <span className="text-lg font-bold text-blue-600">
                      ¥{selectedBooking.total_amount?.toLocaleString() || 0}
                    </span>
                  </div>
                </div>

                {activeTab === 'pickup' && (
                  <div className="border-t border-gray-100 pt-6">
                    {checkResult ? (
                      <div className="space-y-4">
                        <h4 className="font-medium text-gray-700">资质校验结果</h4>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <Shield
                                size={20}
                                className={checkResult.licenseValid ? 'text-green-500' : 'text-red-500'}
                              />
                              <span className="text-sm text-gray-700">驾照有效性</span>
                            </div>
                            <span className={`text-sm font-medium ${checkResult.licenseValid ? 'text-green-600' : 'text-red-600'}`}>
                              {checkResult.licenseValid ? '有效' : '无效'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <AlertTriangle
                                size={20}
                                className={checkResult.violations === 0 ? 'text-green-500' : 'text-amber-500'}
                              />
                              <span className="text-sm text-gray-700">违章记录</span>
                            </div>
                            <span className="text-sm text-gray-600">
                              {checkResult.violations || 0} 条未处理
                            </span>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <span className="text-lg">⭐</span>
                              <span className="text-sm text-gray-700">信用评分</span>
                            </div>
                            <span className={`text-sm font-medium ${(checkResult.creditScore || 0) >= 60 ? 'text-green-600' : 'text-red-600'}`}>
                              {checkResult.creditScore || 0} 分
                            </span>
                          </div>
                          {checkResult.needsDeposit && (
                            <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200">
                              <div className="flex items-center gap-3">
                                <AlertTriangle size={20} className="text-amber-500" />
                                <span className="text-sm text-amber-700">需缴纳押金</span>
                              </div>
                              <span className="text-amber-700 font-medium">
                                ¥{checkResult.depositAmount?.toLocaleString() || 2000}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-3">
                          <button
                            onClick={() => handlePickup(selectedBooking.id)}
                            className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                          >
                            <CheckCircle size={18} />
                            确认取车
                            {checkResult?.needsDeposit && `(含押金¥${checkResult.depositAmount})`}
                          </button>
                          <button
                            onClick={() => handleGenerateContract(selectedBooking.id)}
                            className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                          >
                            <FileText size={18} />
                            生成合同
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleCheckLicense(selectedBooking.id)}
                        disabled={checking}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {checking ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            校验中...
                          </>
                        ) : (
                          <>
                            <Shield size={18} />
                            开始资质校验
                          </>
                        )}
                      </button>
                    )}
                  </div>
                )}

                {activeTab === 'return' && (
                  <div className="border-t border-gray-100 pt-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1.5">还车里程 (km)</label>
                        <input
                          type="number"
                          defaultValue="5500"
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1.5">油量状态</label>
                        <select className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500">
                          <option>满油</option>
                          <option>3/4 箱</option>
                          <option>半箱</option>
                          <option>1/4 箱</option>
                          <option>空箱</option>
                        </select>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-700 mb-3">费用明细</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">基础租金</span>
                          <span className="text-gray-800">¥{selectedBooking.total_amount || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">超时费用</span>
                          <span className="text-gray-800">¥0</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">其他费用</span>
                          <span className="text-gray-800">¥0</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-gray-200">
                          <span className="font-medium text-gray-700">总计</span>
                          <span className="text-xl font-bold text-blue-600">
                            ¥{selectedBooking.total_amount?.toLocaleString() || 0}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleReturn(selectedBooking.id)}
                      className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <CheckCircle size={18} />
                      确认还车并结算
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <Car size={48} className="mb-3 opacity-50" />
                <p>请选择一个订单查看详情</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showContract && contractData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">电子合同</h3>
              <button
                onClick={() => setShowContract(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="text-center border-b border-gray-200 pb-4">
                <h4 className="text-xl font-bold text-gray-800">汽车租赁合同</h4>
                <p className="text-sm text-gray-500 mt-1">
                  合同编号: {contractData.contractNumber || contractData.contract_number}
                </p>
              </div>

              <div className="space-y-3">
                <h5 className="font-medium text-gray-700">承租方信息</h5>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">姓名</span>
                    <span className="text-gray-800 font-medium">
                      {contractData.customerName || contractData.customer?.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">身份证号</span>
                    <span className="text-gray-800 font-mono">
                      {contractData.customerIdCard || contractData.customer?.idCard}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">驾驶证号</span>
                    <span className="text-gray-800 font-mono">
                      {contractData.customer?.driverLicense || '-'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">联系电话</span>
                    <span className="text-gray-800">
                      {contractData.customer?.phone || '-'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h5 className="font-medium text-gray-700">租赁车辆信息</h5>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">车牌号</span>
                    <span className="text-gray-800 font-medium">
                      {contractData.vehiclePlate || contractData.vehicle?.plateNumber}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">车辆品牌</span>
                    <span className="text-gray-800">
                      {contractData.vehicleBrand || contractData.vehicle?.brand}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">车辆型号</span>
                    <span className="text-gray-800">
                      {contractData.vehicleModel || contractData.vehicle?.model}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h5 className="font-medium text-gray-700">租赁信息</h5>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">取车时间</span>
                    <span className="text-gray-800">
                      {dayjs(contractData.pickupTime || contractData.rental?.pickupTime).format('YYYY-MM-DD HH:mm')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">预计还车时间</span>
                    <span className="text-gray-800">
                      {dayjs(contractData.expectedReturnTime || contractData.rental?.expectedReturnTime).format('YYYY-MM-DD HH:mm')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">日租金</span>
                    <span className="text-gray-800">
                      ¥{contractData.dailyRate || contractData.rental?.dailyRate || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">押金</span>
                    <span className="text-gray-800">
                      ¥{contractData.deposit || contractData.rental?.deposit || 0}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-200">
                    <span className="text-gray-600 font-medium">预计总费用</span>
                    <span className="text-blue-600 font-bold">
                      ¥{contractData.estimatedAmount || contractData.rental?.estimatedAmount || 0}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h5 className="font-medium text-gray-700">合同条款</h5>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm text-gray-600">
                  {(contractData.terms || []).map((term: string, idx: number) => (
                    <p key={idx}>{term}</p>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowContract(false)}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
                >
                  关闭
                </button>
                <button className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors">
                  下载合同
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
