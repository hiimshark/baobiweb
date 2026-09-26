import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { StatCard } from '../components/dashboard/StatCard';
import { RevenueChart } from '../components/dashboard/RevenueChart';
import { RecentOrdersTable } from '../components/dashboard/RecentOrdersTable';
import { TopProductsList } from '../components/dashboard/TopProductsList';
import { formatCurrency, formatNumber } from '../lib/utils';
import {
  DollarSign,
  ShoppingBag,
  Users,
  Package,
  PlusCircle,
  MessageSquare,
  FileSpreadsheet,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const { orders, customers, products, messages } = useAppStore();

  const totalRevenue = orders
    .filter((o) => o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const pendingCount = orders.filter((o) => o.status === 'pending').length;
  const unreadMessagesCount = messages.filter((m) => !m.isRead).length;

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-emerald-800 to-emerald-950 text-white p-6 rounded-card shadow-md">
        <div>
          <span className="text-xs font-bold text-emerald-300 uppercase tracking-widest block mb-1">
            Tổng quan kho sỉ
          </span>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Kho Sỉ Bao Bì TP.HCM
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100/80 mt-1 max-w-xl">
            Hệ thống quản lý giá sỉ, đơn tư vấn trực tuyến, tồn kho và danh sách khách sỉ B2B.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-btn bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Thêm sản phẩm</span>
          </Link>
          <Link
            to="/messages"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-btn bg-white/10 hover:bg-white/20 text-white text-xs font-bold backdrop-blur-sm transition-all"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Tư vấn mới ({unreadMessagesCount})</span>
          </Link>
        </div>
      </div>

      {/* 4 Key Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Tổng doanh thu"
          value={formatCurrency(totalRevenue)}
          change={14.8}
          icon={<DollarSign className="w-5 h-5" />}
          iconBgColor="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
        />

        <StatCard
          title="Đơn đặt sỉ"
          value={`${formatNumber(orders.length)} đơn`}
          change={pendingCount > 0 ? pendingCount : 8.2}
          timeframeText={`${pendingCount} đơn chờ duyệt`}
          icon={<ShoppingBag className="w-5 h-5" />}
          iconBgColor="bg-blue-500/10 text-blue-600 dark:text-blue-400"
        />

        <StatCard
          title="Khách hàng sỉ"
          value={`${formatNumber(customers.length)} đối tác`}
          change={12.4}
          icon={<Users className="w-5 h-5" />}
          iconBgColor="bg-amber-500/10 text-amber-600 dark:text-amber-400"
        />

        <StatCard
          title="Dòng hàng sẵn có"
          value={`${formatNumber(products.length)} mặt hàng`}
          change={5.0}
          timeframeText="50+ quy cách size"
          icon={<Package className="w-5 h-5" />}
          iconBgColor="bg-purple-500/10 text-purple-600 dark:text-purple-400"
        />
      </div>

      {/* Revenue Chart Section */}
      <RevenueChart />

      {/* Bottom Grid: Recent Orders & Top Selling Products */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentOrdersTable />
        </div>
        <div>
          <TopProductsList />
        </div>
      </div>
    </div>
  );
};
