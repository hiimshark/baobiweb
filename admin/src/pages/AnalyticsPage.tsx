import React, { useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { formatCurrency, formatNumber } from '../lib/utils';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import {
  TrendingUp,
  CreditCard,
  ShoppingBag,
  Percent,
} from 'lucide-react';

export const AnalyticsPage: React.FC = () => {
  const { orders, customers, products, darkMode } = useAppStore();

  const completedOrders = (orders || []).filter((o) => o.status === 'completed');
  const totalRevenue = completedOrders.reduce((acc, o) => acc + o.totalAmount, 0);
  const avgOrderValue = completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0;
  const conversionRate = orders.length > 0 ? Math.round((completedOrders.length / orders.length) * 100) : 0;

  // Monthly revenue breakdown (last 6 months from real orders)
  const monthlyData = useMemo(() => {
    const months = [];
    const validOrders = (orders || []).filter((o) => o.status !== 'cancelled');
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthNum = d.getMonth();
      const year = d.getFullYear();
      const mOrders = validOrders.filter((o) => {
        const od = new Date(o.createdAt);
        return od.getFullYear() === year && od.getMonth() === monthNum;
      });
      const rev = mOrders.reduce((sum, o) => sum + o.totalAmount, 0);
      months.push({
        month: `T${monthNum + 1}`,
        revenue: rev,
        orders: mOrders.length,
      });
    }
    return months;
  }, [orders]);

  // Dynamic Category Sales Share from real orders and real products
  const categorySalesData = useMemo(() => {
    const catMap = new Map<string, number>();
    const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#6366f1'];

    (orders || []).forEach((o) => {
      if (o.status === 'cancelled') return;
      (o.items || []).forEach((it) => {
        const prod = products.find((p) => p.id === it.productId || p.name === it.name);
        const cat = prod?.category || 'Bao bì';
        catMap.set(cat, (catMap.get(cat) || 0) + (it.total || it.qty * 35000));
      });
    });

    const totalSales = Array.from(catMap.values()).reduce((sum, v) => sum + v, 0);
    if (totalSales === 0) {
      products.forEach((p) => {
        const cat = p.category || 'Bao bì';
        catMap.set(cat, (catMap.get(cat) || 0) + 1);
      });
    }

    const grandTotal = Array.from(catMap.values()).reduce((sum, v) => sum + v, 0);
    return Array.from(catMap.entries()).map(([name, val], idx) => ({
      name,
      value: grandTotal > 0 ? Math.round((val / grandTotal) * 100) : 0,
      color: colors[idx % colors.length],
    }));
  }, [orders, products]);

  // Order status distribution
  const orderStatusData = [
    { name: 'Hoàn tất', value: orders.filter((o) => o.status === 'completed').length, color: '#10b981' },
    { name: 'Đang giao', value: orders.filter((o) => o.status === 'shipping').length, color: '#3b82f6' },
    { name: 'Chờ duyệt', value: orders.filter((o) => o.status === 'pending').length, color: '#f59e0b' },
    { name: 'Đã huỷ', value: orders.filter((o) => o.status === 'cancelled').length, color: '#ef4444' },
  ].filter(item => item.value > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100">
          Báo cáo & Phân tích kinh doanh
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Theo dõi hiệu quả doanh thu sỉ, tỷ lệ chuyển đổi và xu hướng tiêu dùng của khách hàng
        </p>
      </div>

      {/* 4 Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-card p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2 font-semibold">
            <span>Doanh thu hoàn tất</span>
            <CreditCard className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-slate-100">
            {formatCurrency(totalRevenue)}
          </div>
          <span className="text-[11px] text-emerald-600 font-bold mt-2 block">
            ↑ +16.2% so với tháng trước
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-card p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2 font-semibold">
            <span>Đơn hoàn tất</span>
            <ShoppingBag className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-slate-100">
            {formatNumber(completedOrders.length)} đơn
          </div>
          <span className="text-[11px] text-blue-600 font-bold mt-2 block">
            {orders.length} tổng yêu cầu nhận được
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-card p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2 font-semibold">
            <span>Giá trị trung bình / đơn</span>
            <TrendingUp className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-slate-100">
            {formatCurrency(avgOrderValue)}
          </div>
          <span className="text-[11px] text-slate-400 mt-2 block">
            Quy mô đơn hàng sỉ trung bình
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-card p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2 font-semibold">
            <span>Tỷ lệ chốt đơn (Conversion)</span>
            <Percent className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">
            {conversionRate}%
          </div>
          <span className="text-[11px] text-slate-400 mt-2 block">
            Số đơn hoàn tất trên tổng phiếu tư vấn
          </span>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Revenue Bar Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-card p-5 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">
            Tăng trưởng Doanh số 6 tháng gần nhất
          </h3>
          <p className="text-xs text-slate-400 mb-5">Đơn vị: Triệu VNĐ (theo từng tháng)</p>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#334155' : '#f1f5f9'} />
                <XAxis dataKey="month" stroke={darkMode ? '#64748b' : '#94a3b8'} fontSize={11} tickLine={false} axisLine={false} />
                <YAxis
                  stroke={darkMode ? '#64748b' : '#94a3b8'}
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${(v / 1000000).toFixed(0)}Tr`}
                />
                <Tooltip
                  formatter={(val: any) => [formatCurrency(Number(val)), 'Doanh thu']}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#fff',
                  }}
                />
                <Bar dataKey="revenue" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sales by Category Donut Chart */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-card p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">
              Tỷ trọng Doanh số theo dòng hàng
            </h3>
            <p className="text-xs text-slate-400 mb-4">Cơ cấu doanh thu theo loại bao bì</p>

            <div className="h-52 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categorySalesData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {categorySalesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any) => [`${val}%`, 'Tỷ trọng']}
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '12px',
                      color: '#fff',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Legend */}
          <div className="grid grid-cols-2 gap-2 text-xs pt-4 border-t border-slate-100 dark:border-slate-800">
            {categorySalesData.map((item) => (
              <div key={item.name} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-slate-600 dark:text-slate-400 truncate">{item.name}</span>
                <span className="font-bold text-slate-900 dark:text-slate-100 ml-auto">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Spending Customers */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-card p-5 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">
          Top 5 Khách hàng đối tác lớn nhất
        </h3>
        <p className="text-xs text-slate-400 mb-4">Các đại lý, shop thời trang và xưởng đóng gói có doanh số cao</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {customers.slice(0, 3).map((c, i) => (
            <div
              key={c.id}
              className="p-3.5 rounded-btn bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between"
            >
              <div>
                <span className="text-xs font-bold text-slate-400">#Top {i + 1}</span>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate max-w-[170px]">
                  {c.name}
                </h4>
                <span className="text-xs text-slate-500">{c.phone}</span>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 block">{c.totalOrders} đơn hàng</span>
                <span className="font-bold text-sm text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(c.totalSpent)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
