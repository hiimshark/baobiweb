import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Badge } from '../common/Badge';
import { formatCurrency, formatDate } from '../../lib/utils';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { OrderStatus } from '../../types';

export const RecentOrdersTable: React.FC = () => {
  const { orders } = useAppStore();
  const recentOrders = orders.slice(0, 5);

  const statusBadge = (status: OrderStatus) => {
    const map = {
      pending: { variant: 'warning' as const, label: 'Chờ duyệt' },
      confirmed: { variant: 'info' as const, label: 'Đã xác nhận' },
      shipping: { variant: 'info' as const, label: 'Đang giao' },
      completed: { variant: 'success' as const, label: 'Hoàn tất' },
      cancelled: { variant: 'error' as const, label: 'Đã huỷ' },
    };
    const s = map[status] || map.pending;
    return <Badge variant={s.variant} size="sm">{s.label}</Badge>;
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-card p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Đơn hàng sỉ gần đây
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Các đơn đặt tư vấn mới nhất từ website và khách quen
          </p>
        </div>
        <Link
          to="/orders"
          className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
        >
          <span>Xem tất cả</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="overflow-x-auto -mx-5 px-5">
        <table className="w-full text-left text-xs whitespace-nowrap">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
              <th className="py-2.5 pr-4">Mã đơn</th>
              <th className="py-2.5 px-4">Khách hàng</th>
              <th className="py-2.5 px-4">Sản phẩm</th>
              <th className="py-2.5 px-4">Tổng tiền</th>
              <th className="py-2.5 px-4">Trạng thái</th>
              <th className="py-2.5 pl-4 text-right">Thời gian</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {recentOrders.map((order) => {
              const summaryItems = order.items.map(i => `${i.qty}${i.unit} ${i.name}`).join(', ');
              return (
                <tr key={order.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 pr-4 font-bold text-emerald-600 dark:text-emerald-400">
                    {order.code}
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">
                    {order.customerName}
                  </td>
                  <td className="py-3 px-4 max-w-[200px] truncate text-slate-500 dark:text-slate-400" title={summaryItems}>
                    {summaryItems}
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">
                    {formatCurrency(order.totalAmount)}
                  </td>
                  <td className="py-3 px-4">
                    {statusBadge(order.status)}
                  </td>
                  <td className="py-3 pl-4 text-right text-slate-400">
                    {formatDate(order.createdAt)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
