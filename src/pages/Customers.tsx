
import { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  User,
  Phone,
  MapPin,
  Star,
  Shield,
  AlertTriangle,
  MoreHorizontal,
} from 'lucide-react';
import Header from '@/components/Header';
import type { Customer } from '@shared/types';

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [creditFilter, setCreditFilter] = useState<string>('all');

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/customers');
      const data = await res.json();
      setCustomers(data);
    } catch (error) {
      console.error('Failed to load customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm) ||
      c.license_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCreditColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600 bg-emerald-50';
    if (score >= 60) return 'text-amber-600 bg-amber-50';
    return 'text-red-600 bg-red-50';
  };

  const getCreditLevel = (score: number) => {
    if (score >= 90) return '优秀';
    if (score >= 80) return '良好';
    if (score >= 60) return '一般';
    return '较差';
  };

  return (
    <div className="min-h-screen">
      <Header
        title="客户管理"
        subtitle="管理客户信息和信用评分"
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
                placeholder="搜索姓名、手机号、驾照号..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-72 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              />
            </div>

            <div className="flex bg-white rounded-lg border border-gray-200 p-1">
              {['all', 'high', 'medium', 'low'].map((level) => (
                <button
                  key={level}
                  onClick={() => setCreditFilter(level)}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    creditFilter === level
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {level === 'all'
                    ? '全部'
                    : level === 'high'
                    ? '高信用'
                    : level === 'medium'
                    ? '中信用'
                    : '低信用'}
                </button>
              ))}
            </div>
          </div>

          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
            <Plus size={18} />
            新增客户
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                <User size={24} className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">总客户数</p>
                <p className="text-2xl font-bold text-gray-800">{customers.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
                <Star size={24} className="text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">高信用客户</p>
                <p className="text-2xl font-bold text-gray-800">
                  {customers.filter((c) => (c.credit_score || 0) >= 80).length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center">
                <AlertTriangle size={24} className="text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">低信用预警</p>
                <p className="text-2xl font-bold text-gray-800">
                  {customers.filter((c) => (c.credit_score || 0) < 60).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-5 py-3 text-sm font-medium text-gray-600">
                    客户信息
                  </th>
                  <th className="text-left px-5 py-3 text-sm font-medium text-gray-600">
                    联系方式
                  </th>
                  <th className="text-left px-5 py-3 text-sm font-medium text-gray-600">
                    驾照信息
                  </th>
                  <th className="text-left px-5 py-3 text-sm font-medium text-gray-600">
                    信用评分
                  </th>
                  <th className="text-left px-5 py-3 text-sm font-medium text-gray-600">
                    租赁次数
                  </th>
                  <th className="text-left px-5 py-3 text-sm font-medium text-gray-600">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-medium">
                          {customer.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{customer.name}</p>
                          <p className="text-sm text-gray-500">
                            {customer.gender === 'male' ? '男' : '女'} · {customer.age || 30}岁
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-sm text-gray-600">
                        <p className="flex items-center gap-1.5">
                          <Phone size={12} />
                          {customer.phone}
                        </p>
                        <p className="flex items-center gap-1.5 mt-1 text-gray-400">
                          <MapPin size={12} />
                          {customer.address || '北京市朝阳区'}
                        </p>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-sm">
                        <p className="text-gray-800 font-mono">{customer.license_number}</p>
                        <p className="text-gray-400">
                          {customer.license_type || 'C1'} 驾照
                        </p>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                            getCreditColor(customer.credit_score || 0)
                          }`}
                        >
                          {customer.credit_score} 分
                        </span>
                        <span className="text-xs text-gray-500">
                          {getCreditLevel(customer.credit_score || 0)}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600">
                      {customer.rental_count || 0} 次
                    </td>
                    <td className="px-5 py-4">
                      <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                        <MoreHorizontal size={18} className="text-gray-500" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredCustomers.length === 0 && !loading && (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-gray-400">
                      暂无客户数据
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
