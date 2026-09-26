import React, { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useAppStore } from '../../store/useAppStore';
import { formatCurrency, formatNumber } from '../../lib/utils';
import { TimeRange } from '../../types';

export const RevenueChart: React.FC = () => {
  const { orders, timeRange, setTimeRange, darkMode } = useAppStore();

  const data = useMemo(() => {
    const validOrders = (orders || []).filter((o) => o.status !== 'cancelled');

    if (timeRange === '7d') {
      const days = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dayStr = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
        const dayIso = d.toISOString().slice(0, 10);

        const dayOrders = validOrders.filter((o) => (o.createdAt || '').slice(0, 10) === dayIso);
        const rev = dayOrders.reduce((sum, o) => sum + o.totalAmount, 0);
        days.push({
          date: dayStr,
          revenue: rev,
          orders: dayOrders.length,
        });
      }
      return days;
    }

    if (timeRange === '30d') {
      const weeks = [
        { date: 'Tuần 1', revenue: 0, orders: 0 },
        { date: 'Tuần 2', revenue: 0, orders: 0 },
        { date: 'Tuần 3', revenue: 0, orders: 0 },
        { date: 'Tuần 4', revenue: 0, orders: 0 },
      ];
      const now = Date.now();
      validOrders.forEach((o) => {
        const oTime = new Date(o.createdAt).getTime();
        const diffDays = Math.floor((now - oTime) / (1000 * 60 * 60 * 24));
        if (diffDays >= 0 && diffDays < 28) {
          const weekIdx = Math.min(Math.floor(diffDays / 7), 3);
          const target = 3 - weekIdx;
          weeks[target].revenue += o.totalAmount;
          weeks[target].orders += 1;
        }
      });
      return weeks;
    }

    if (timeRange === '3m') {
      const months = [];
      for (let i = 2; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const mStr = `T${d.getMonth() + 1}`;
        const year = d.getFullYear();
        const monthNum = d.getMonth();
        const mOrders = validOrders.filter((o) => {
          const od = new Date(o.createdAt);
          return od.getFullYear() === year && od.getMonth() === monthNum;
        });
        const rev = mOrders.reduce((sum, o) => sum + o.totalAmount, 0);
        months.push({ date: mStr, revenue: rev, orders: mOrders.length });
      }
      return months;
    }

    if (timeRange === '12m') {
      const quarters = [
        { date: 'Q1', revenue: 0, orders: 0 },
        { date: 'Q2', revenue: 0, orders: 0 },
        { date: 'Q3', revenue: 0, orders: 0 },
        { date: 'Q4', revenue: 0, orders: 0 },
      ];
      const curYear = new Date().getFullYear();
      validOrders.forEach((o) => {
        const od = new Date(o.createdAt);
        if (od.getFullYear() === curYear) {
          const qIdx = Math.floor(od.getMonth() / 3);
          if (qIdx >= 0 && qIdx < 4) {
            quarters[qIdx].revenue += o.totalAmount;
            quarters[qIdx].orders += 1;
          }
        }
      });
      return quarters;
    }

    return [];
  }, [orders, timeRange]);

  const timeOptions: { label: string; value: TimeRange }[] = [
    { label: '7 ngày', value: '7d' },
    { label: '30 ngày', value: '30d' },
    { label: '3 tháng', value: '3m' },
    { label: '12 tháng', value: '12m' },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-card p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Biểu đồ Doanh thu & Đơn hàng
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Thống kê doanh số bán buôn theo mốc thời gian đã chọn
          </p>
        </div>

        {/* Time Filter Buttons */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-btn self-start sm:self-auto">
          {timeOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setTimeRange(opt.value)}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                timeRange === opt.value
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke={darkMode ? '#334155' : '#f1f5f9'}
            />
            <XAxis
              dataKey="date"
              stroke={darkMode ? '#64748b' : '#94a3b8'}
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke={darkMode ? '#64748b' : '#94a3b8'}
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${(v / 1000000).toFixed(0)}Tr`}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1 border border-slate-700">
                      <p className="font-bold text-slate-300">{label}</p>
                      <p className="text-emerald-400 font-semibold">
                        Doanh thu: {formatCurrency(payload[0].value as number)}
                      </p>
                      {payload[0].payload?.orders !== undefined && (
                        <p className="text-slate-400">
                          Số đơn: {formatNumber(payload[0].payload.orders)} đơn
                        </p>
                      )}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#10b981"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#revenueGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
