import React, { useState, useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Order, OrderStatus } from '../types';
import { OrderDetailModal } from '../components/orders/OrderDetailModal';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Badge } from '../components/common/Badge';
import { Pagination } from '../components/common/Pagination';
import { formatCurrency, formatDate, exportToCSV } from '../lib/utils';
import {
  Search,
  Download,
  Eye,
  Trash2,
  ShoppingBag,
  Send,
} from 'lucide-react';

export const OrdersPage: React.FC = () => {
  const { orders, deleteOrder } = useAppStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchSearch =
        o.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.customerPhone.includes(searchQuery);

      const matchStatus = statusFilter === 'all' || o.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [orders, searchQuery, statusFilter]);

  const totalPages = Math.ceil(filteredOrders.length / pageSize);
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredOrders.slice(start, start + pageSize);
  }, [filteredOrders, currentPage, pageSize]);

  const handleView = (order: Order) => {
    setSelectedOrder(order);
    setModalOpen(true);
  };

  const handleDelete = (id: string, code: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa đơn "${code}" không?`)) {
      deleteOrder(id);
    }
  };

  const handleExportCSV = () => {
    const headers = [
      { key: 'code' as keyof Order, label: 'Mã đơn' },
      { key: 'customerName' as keyof Order, label: 'Khách hàng' },
      { key: 'customerPhone' as keyof Order, label: 'Số điện thoại' },
      { key: 'totalAmount' as keyof Order, label: 'Tổng tiền (VND)' },
      { key: 'status' as keyof Order, label: 'Trạng thái' },
      { key: 'createdAt' as keyof Order, label: 'Thời gian đặt' },
    ];
    exportToCSV('danh-sach-don-hang-si', filteredOrders, headers);
  };

  const statusBadge = (status: OrderStatus) => {
    const map = {
      pending: { variant: 'warning' as const, label: 'Chờ duyệt' },
      confirmed: { variant: 'info' as const, label: 'Đã xác nhận' },
      shipping: { variant: 'info' as const, label: 'Đang giao hàng' },
      completed: { variant: 'success' as const, label: 'Đã hoàn tất' },
      cancelled: { variant: 'error' as const, label: 'Đã huỷ' },
    };
    const s = map[status] || map.pending;
    return <Badge variant={s.variant} size="sm">{s.label}</Badge>;
  };

  const statusCounts = useMemo(() => {
    return {
      all: orders.length,
      pending: orders.filter((o) => o.status === 'pending').length,
      confirmed: orders.filter((o) => o.status === 'confirmed').length,
      shipping: orders.filter((o) => o.status === 'shipping').length,
      completed: orders.filter((o) => o.status === 'completed').length,
      cancelled: orders.filter((o) => o.status === 'cancelled').length,
    };
  }, [orders]);

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100">
            Quản lý Đơn hàng sỉ
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Theo dõi, xử lý báo giá và đồng bộ thông báo sang Telegram
          </p>
        </div>

        <Button
          variant="outline"
          leftIcon={<Download className="w-4 h-4" />}
          onClick={handleExportCSV}
        >
          Xuất dữ liệu CSV
        </Button>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { key: 'all', label: 'Tất cả đơn' },
          { key: 'pending', label: 'Chờ duyệt' },
          { key: 'confirmed', label: 'Đã xác nhận' },
          { key: 'shipping', label: 'Đang giao' },
          { key: 'completed', label: 'Hoàn tất' },
          { key: 'cancelled', label: 'Đã huỷ' },
        ].map((tab) => {
          const count = statusCounts[tab.key as keyof typeof statusCounts];
          const isSelected = statusFilter === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => {
                setStatusFilter(tab.key);
                setCurrentPage(1);
              }}
              className={`px-3.5 py-2 rounded-btn text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
                isSelected
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  isSelected
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-card p-4 shadow-sm">
        <Input
          placeholder="Tìm đơn theo mã DH, tên khách hàng, số điện thoại Zalo..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
          leftIcon={<Search className="w-4 h-4" />}
        />
      </div>

      {/* Orders Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-card shadow-sm overflow-hidden">
        {paginatedOrders.length === 0 ? (
          <div className="p-12 text-center">
            <ShoppingBag className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
              Không có đơn hàng nào
            </h3>
            <p className="text-xs text-slate-400 mt-1 mb-4">
              Thử tìm kiếm với thông tin khác hoặc chọn lại bộ lọc trạng thái
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
              }}
            >
              Xem tất cả đơn
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Mã đơn</th>
                  <th className="py-3 px-4">Khách hàng</th>
                  <th className="py-3 px-4">Số điện thoại</th>
                  <th className="py-3 px-4">Sản phẩm đặt</th>
                  <th className="py-3 px-4">Tổng tiền</th>
                  <th className="py-3 px-4">Trạng thái</th>
                  <th className="py-3 px-4">Telegram</th>
                  <th className="py-3 px-4">Thời gian</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paginatedOrders.map((order) => {
                  const summary = order.items
                    .map((i) => `${i.qty}${i.unit} ${i.name}`)
                    .join(', ');
                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {order.code}
                      </td>

                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-slate-100">
                        {order.customerName}
                      </td>

                      <td className="py-3.5 px-4 font-medium text-slate-600 dark:text-slate-300">
                        {order.customerPhone}
                      </td>

                      <td
                        className="py-3.5 px-4 max-w-xs truncate text-slate-500 dark:text-slate-400"
                        title={summary}
                      >
                        {summary}
                      </td>

                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-slate-100">
                        {formatCurrency(order.totalAmount)}
                      </td>

                      <td className="py-3.5 px-4">{statusBadge(order.status)}</td>

                      <td className="py-3.5 px-4">
                        {order.deliveredTelegram ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                            <Send className="w-3 h-3" />
                            <span>Đã gửi</span>
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">Chưa</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-slate-400">
                        {formatDate(order.createdAt)}
                      </td>

                      <td className="py-3.5 px-4 text-right space-x-1">
                        <button
                          onClick={() => handleView(order)}
                          className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition-colors"
                          title="Xem chi tiết"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(order.id, order.code)}
                          className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                          title="Xoá đơn"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredOrders.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Order Detail Modal */}
      <OrderDetailModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        order={selectedOrder}
      />
    </div>
  );
};
