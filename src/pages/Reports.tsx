
import { useState, useEffect } from 'react';
import {
  BarChart3,
  PieChart,
  TrendingUp,
  Download,
  Calendar,
  FileText,
} from 'lucide-react';
import Header from '@/components/Header';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart as RechartsPie,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from 'recharts';
import dayjs from 'dayjs';
import { jsPDF } from 'jspdf';

export default function Reports() {
  const [activeTab, setActiveTab] = useState<'rental' | 'revenue' | 'failure'>('rental');
  const [period, setPeriod] = useState<string>('month');
  const [rentalRateData, setRentalRateData] = useState<any[]>([]);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [failureData, setFailureData] = useState<any[]>([]);
  const [vehicleTypeData, setVehicleTypeData] = useState<any[]>([]);
  const [monthlySummary, setMonthlySummary] = useState<any>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadRentalRateData();
    loadRevenueData();
    loadFailureData();
    loadVehicleTypeStats();
    loadMonthlySummary();
  }, [period]);

  const loadRentalRateData = async () => {
    try {
      const res = await fetch(`/api/reports/rental-rate?period=30days`);
      const data = await res.json();
      setRentalRateData(
        data.map((item: any) => ({
          ...item,
          date: dayjs(item.date).format('MM-DD'),
        }))
      );
    } catch (error) {
      console.error('Failed to load rental rate data:', error);
    }
  };

  const loadRevenueData = async () => {
    try {
      const res = await fetch(`/api/reports/revenue?period=30days`);
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

  const loadFailureData = async () => {
    try {
      const res = await fetch(`/api/reports/failure-rate?period=30days`);
      const data = await res.json();
      setFailureData(
        data.map((item: any) => ({
          ...item,
          date: dayjs(item.date).format('MM-DD'),
        }))
      );
    } catch (error) {
      console.error('Failed to load failure rate data:', error);
    }
  };

  const loadVehicleTypeStats = async () => {
    try {
      const res = fetch('/api/reports/vehicle-type-stats');
      const data = await (await res).json();
      setVehicleTypeData(data || [
        { name: '经济型', value: 35, color: '#3b82f6' },
        { name: '紧凑型', value: 25, color: '#10b981' },
        { name: '标准型', value: 20, color: '#f59e0b' },
        { name: 'SUV', value: 12, color: '#8b5cf6' },
        { name: '豪华型', value: 8, color: '#ef4444' },
      ]);
    } catch (error) {
      console.error('Failed to load vehicle type stats:', error);
    }
  };

  const loadMonthlySummary = async () => {
    try {
      const res = await fetch('/api/reports/monthly-summary');
      const data = await res.json();
      setMonthlySummary(data);
    } catch (error) {
      console.error('Failed to load monthly summary:', error);
    }
  };

  const handleExportPDF = () => {
    setExporting(true);
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      doc.setFillColor(30, 64, 175);
      doc.rect(0, 0, pageWidth, 35, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('Monthly Operations Report', 20, 22);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(dayjs().format('YYYY-MM-DD'), pageWidth - 40, 22);

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Key Metrics Summary', 20, 50);

      const summaryY = 60;
      const cardWidth = 42;
      const cardHeight = 28;
      const cardGap = 8;
      const startX = 20;

      const metrics = [
        { label: 'Rental Rate', value: `${monthlySummary?.rentalRate || 25}%`, color: [59, 130, 246] },
        { label: 'Revenue', value: `¥${(monthlySummary?.totalRevenue || 2600).toLocaleString()}`, color: [16, 185, 129] },
        { label: 'Orders', value: `${monthlySummary?.completedBookings || 3}`, color: [245, 158, 11] },
        { label: 'Failure Rate', value: `${monthlySummary?.failureRate || 5}%`, color: [139, 92, 246] },
      ];

      metrics.forEach((metric, index) => {
        const x = startX + index * (cardWidth + cardGap);
        doc.setFillColor(metric.color[0], metric.color[1], metric.color[2]);
        doc.roundedRect(x, summaryY, cardWidth, cardHeight, 3, 3, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(metric.label, x + 4, summaryY + 10);

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(metric.value, x + 4, summaryY + 20);
      });

      const chartY = summaryY + cardHeight + 20;
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Rental Rate Trend (Last 30 Days)', 20, chartY);

      const chartHeight = 60;
      const chartWidth = pageWidth - 40;
      const chartStartX = 20;
      const chartStartY = chartY + 10;

      doc.setDrawColor(229, 231, 235);
      doc.setLineWidth(0.5);
      for (let i = 0; i <= 4; i++) {
        const y = chartStartY + (chartHeight / 4) * i;
        doc.line(chartStartX, y, chartStartX + chartWidth, y);
      }

      if (rentalRateData.length > 0) {
        const maxRate = 100;
        const points = rentalRateData.map((item, index) => {
          const x = chartStartX + (chartWidth / (rentalRateData.length - 1)) * index;
          const y = chartStartY + chartHeight - ((item.rate || 30) / maxRate) * chartHeight;
          return { x, y };
        });

        doc.setDrawColor(59, 130, 246);
        doc.setLineWidth(1.5);
        doc.moveTo(points[0].x, points[0].y);
        points.forEach((point) => {
          doc.lineTo(point.x, point.y);
        });
        doc.stroke();

        points.forEach((point) => {
          doc.setFillColor(59, 130, 246);
          doc.circle(point.x, point.y, 1.5, 'F');
        });
      }

      doc.setFontSize(8);
      doc.setTextColor(156, 163, 175);
      doc.text('0%', chartStartX - 12, chartStartY + chartHeight);
      doc.text('100%', chartStartX - 18, chartStartY + 3);

      const revenueY = chartStartY + chartHeight + 25;
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Revenue Trend (Last 30 Days)', 20, revenueY);

      const revChartHeight = 50;
      const revChartY = revenueY + 8;

      doc.setDrawColor(229, 231, 235);
      for (let i = 0; i <= 4; i++) {
        const y = revChartY + (revChartHeight / 4) * i;
        doc.line(20, y, 20 + chartWidth, y);
      }

      if (revenueData.length > 0) {
        const maxRev = Math.max(...revenueData.map((d) => d.revenue || 500), 500);
        const barCount = Math.min(revenueData.length, 30);
        const barWidth = (chartWidth - barCount * 2) / barCount;

        revenueData.slice(0, barCount).forEach((item, index) => {
          const barHeight = ((item.revenue || 200) / maxRev) * revChartHeight;
          const x = 20 + index * (barWidth + 2);
          const y = revChartY + revChartHeight - barHeight;

          doc.setFillColor(16, 185, 129);
          doc.roundedRect(x, y, barWidth, barHeight, 1, 1, 'F');
        });
      }

      const storeY = revChartY + revChartHeight + 20;
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Store Performance Ranking', 20, storeY);

      const stores = [
        { rank: 1, name: 'Chaoyang Store', revenue: 286500, rate: 78 },
        { rank: 2, name: 'Haidian Store', revenue: 245800, rate: 72 },
        { rank: 3, name: 'Fengtai Store', revenue: 198300, rate: 68 },
      ];

      stores.forEach((store, index) => {
        const y = storeY + 12 + index * 18;

        doc.setFillColor(store.rank === 1 ? 245 : store.rank === 2 ? 156 : 180,
          store.rank === 1 ? 158 : store.rank === 2 ? 163 : 83,
          store.rank === 1 ? 11 : store.rank === 2 ? 175 : 9);
        doc.roundedRect(20, y - 6, 20, 14, 3, 3, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text(`#${store.rank}`, 24, y + 3);

        doc.setTextColor(31, 41, 55);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(store.name, 46, y + 3);

        doc.setTextColor(59, 130, 246);
        doc.setFont('helvetica', 'bold');
        doc.text(`¥${store.revenue.toLocaleString()}`, pageWidth - 60, y + 3);

        doc.setTextColor(156, 163, 175);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(`Rate: ${store.rate}%`, pageWidth - 30, y + 3);
      });

      const footerY = pageHeight - 20;
      doc.setDrawColor(229, 231, 235);
      doc.line(20, footerY - 5, pageWidth - 20, footerY - 5);

      doc.setFontSize(8);
      doc.setTextColor(156, 163, 175);
      doc.text('Generated by Zhixing Car Rental Management System', 20, footerY + 5);
      doc.text(`Page 1 / 1`, pageWidth - 40, footerY + 5);

      doc.save(`monthly-report-${dayjs().format('YYYY-MM-DD')}.pdf`);
    } catch (error) {
      console.error('Failed to export PDF:', error);
      alert('Failed to generate PDF report');
    } finally {
      setExporting(false);
    }
  };

  const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];

  return (
    <div className="min-h-screen">
      <Header
        title="统计报表"
        subtitle="多维度数据分析，辅助决策"
      />

      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex bg-white rounded-lg border border-gray-200 p-1">
            <button
              onClick={() => setActiveTab('rental')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'rental'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <BarChart3 size={18} />
              出租率分析
            </button>
            <button
              onClick={() => setActiveTab('revenue')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'revenue'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <TrendingUp size={18} />
              收入分析
            </button>
            <button
              onClick={() => setActiveTab('failure')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'failure'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <PieChart size={18} />
              故障率分析
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex bg-white rounded-lg border border-gray-200 p-1">
              {['week', 'month', 'quarter', 'year'].map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    period === p
                      ? 'bg-gray-100 text-gray-800'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {p === 'week' ? '周' : p === 'month' ? '月' : p === 'quarter' ? '季' : '年'}
                </button>
              ))}
            </div>
            <button
              onClick={handleExportPDF}
              disabled={exporting}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              <FileText size={18} />
              {exporting ? '生成中...' : '导出月报'}
            </button>
          </div>
        </div>

        {monthlySummary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white">
              <p className="text-blue-100 text-sm">本月出租率</p>
              <p className="text-3xl font-bold mt-1">{monthlySummary.rentalRate || 0}%</p>
              <p className="text-blue-200 text-xs mt-2">↑ 同比 +5.2%</p>
            </div>
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-5 text-white">
              <p className="text-emerald-100 text-sm">本月收入</p>
              <p className="text-3xl font-bold mt-1">
                ¥{(monthlySummary.totalRevenue || 0).toLocaleString()}
              </p>
              <p className="text-emerald-200 text-xs mt-2">↑ 同比 +8.7%</p>
            </div>
            <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-5 text-white">
              <p className="text-amber-100 text-sm">完成订单</p>
              <p className="text-3xl font-bold mt-1">{monthlySummary.completedBookings || 0}</p>
              <p className="text-amber-200 text-xs mt-2">↑ 环比 +3.5%</p>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-5 text-white">
              <p className="text-purple-100 text-sm">故障率</p>
              <p className="text-3xl font-bold mt-1">{monthlySummary.failureRate || 0}%</p>
              <p className="text-purple-200 text-xs mt-2">↓ 同比 -1.2%</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-800 mb-4">
              {activeTab === 'rental'
                ? '出租率趋势'
                : activeTab === 'revenue'
                ? '收入趋势'
                : '故障率趋势'}
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                {activeTab === 'rental' ? (
                  <AreaChart data={rentalRateData}>
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
                ) : activeTab === 'revenue' ? (
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
                ) : (
                  <BarChart data={failureData}>
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
                    <Bar dataKey="rate" fill="#f59e0b" name="故障率" radius={[4, 4, 0, 0]} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-800 mb-4">车型分布</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPie>
                  <Pie
                    data={vehicleTypeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {vehicleTypeData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color || PIE_COLORS[index % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: '8px',
                      border: 'none',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    }}
                  />
                  <Legend verticalAlign="bottom" height={36} />
                </RechartsPie>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">门店排名</h3>
            <span className="text-sm text-gray-500">本月收入</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { rank: 1, name: '朝阳门店', revenue: 286500, rate: 78 },
              { rank: 2, name: '海淀门店', revenue: 245800, rate: 72 },
              { rank: 3, name: '丰台门店', revenue: 198300, rate: 68 },
            ].map((store) => (
              <div
                key={store.rank}
                className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg"
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                    store.rank === 1
                      ? 'bg-amber-500'
                      : store.rank === 2
                      ? 'bg-gray-400'
                      : 'bg-amber-700'
                  }`}
                >
                  {store.rank}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-800">{store.name}</p>
                  <p className="text-sm text-gray-500">出租率 {store.rate}%</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-blue-600">
                    ¥{store.revenue.toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
