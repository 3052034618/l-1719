
import { useState, useEffect } from 'react';
import {
  Receipt,
  DollarSign,
  FileText,
  CreditCard,
  Search,
  Filter,
  Download,
  MoreHorizontal,
} from 'lucide-react';
import Header from '@/components/Header';
import type { Invoice } from '@shared/types';
import dayjs from 'dayjs';

export default function Billing() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadInvoices();
  }, [statusFilter]);

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      const res = await fetch(`/api/billing/invoices?${params}`);
      const data = await res.json();
      setInvoices(data.data || data || []);
    } catch (error) {
      console.error('Failed to load invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredInvoices = invoices.filter(
    (inv) =>
      inv.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.customer_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const statusColors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700',
    issued: 'bg-blue-100 text-blue-700',
    paid: 'bg-green-100 text-green-700',
    overdue: 'bg-red-100 text-red-700',
    cancelled: 'bg-gray-100 text-gray-500',
  };

  const statusLabels: Record<string, string> = {
    draft: '草稿',
    issued: '已开具',
    paid: '已支付',
    overdue: '已逾期',
    cancelled: '已作废',
  };

  const totalPaid = invoices
    .filter((i) => i.status === 'paid')
    .reduce((sum, i) => sum + (i.total_amount || 0), 0);

  const totalPending = invoices
    .filter((i) => i.status === 'issued' || i.status === 'draft')
    .reduce((sum, i) => sum + (i.total_amount || 0), 0);

  return (
    <div className="min-h-screen">
      <Header
        title="费用结算"
        subtitle="管理发票和费用结算"
      />

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                <Receipt size={24} className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">发票总数</p>
                <p className="text-2xl font-bold text-gray-800">{invoices.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
                <DollarSign size={24} className="text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">已收金额</p>
                <p className="text-2xl font-bold text-green-600">
                  ¥{totalPaid.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center">
                <CreditCard size={24} className="text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">待收金额</p>
                <p className="text-2xl font-bold text-amber-600">
                  ¥{totalPending.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center">
                <FileText size={24} className="text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">逾期发票</p>
                <p className="text-2xl font-bold text-red-600">
                  {invoices.filter((i) => i.status === 'overdue').length}
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
                placeholder="搜索发票号、客户名..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-72 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              />
            </div>

            <div className="flex bg-white rounded-lg border border-gray-200 p-1">
              {['all', 'draft', 'issued', 'paid', 'overdue'].map((status) => (
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

          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
            <Download size={18} />
            导出报表
          </button>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-5 py-3 text-sm font-medium text-gray-600">
                    发票信息
                  </th>
                  <th className="text-left px-5 py-3 text-sm font-medium text-gray-600">
                    客户
                  </th>
                  <th className="text-left px-5 py-3 text-sm font-medium text-gray-600">
                    关联订单
                  </th>
                  <th className="text-left px-5 py-3 text-sm font-medium text-gray-600">
                    金额
                  </th>
                  <th className="text-left px-5 py-3 text-sm font-medium text-gray-600">
                    开票日期
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
                {filteredInvoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                    <p className="font-medium text-gray-800">{invoice.id}</p>
                    <p className="text-xs text-gray-400">
                      {invoice.type === 'rental' ? '租赁费' : '其他'}
                    </p>
                  </td>
                    <td className="px-5 py-4">
                      <p className="text-sm text-gray-800">{invoice.customer_name || '客户'}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm text-gray-600 font-mono">
                        {invoice.booking_id || '-'}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-gray-800">
                        ¥{invoice.total_amount?.toLocaleString() || 0}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600">
                      {invoice.issue_date
                        ? dayjs(invoice.issue_date).format('YYYY-MM-DD')
                        : '-'}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          statusColors[invoice.status]
                        }`}
                      >
                        {statusLabels[invoice.status]}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1">
                        <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                          <Download size={16} className="text-gray-500" />
                        </button>
                        <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                          <MoreHorizontal size={16} className="text-gray-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredInvoices.length === 0 && !loading && (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-gray-400">
                      暂无发票数据
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
