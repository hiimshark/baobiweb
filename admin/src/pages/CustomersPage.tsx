import React, { useState, useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Customer } from '../types';
import { CustomerModal } from '../components/customers/CustomerModal';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Badge } from '../components/common/Badge';
import { Pagination } from '../components/common/Pagination';
import { formatCurrency, formatNumber, formatDate, exportToCSV } from '../lib/utils';
import {
  Plus,
  Search,
  Download,
  Edit2,
  Trash2,
  Users,
  MessageCircle,
} from 'lucide-react';

export const CustomersPage: React.FC = () => {
  const { customers, deleteCustomer } = useAppStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  const filtered = useMemo(() => {
    return customers.filter((c) => {
      const matchSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phone.includes(searchQuery) ||
        c.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.email && c.email.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchStatus = statusFilter === 'all' || c.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [customers, searchQuery, statusFilter]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  const handleAdd = () => {
    setEditingCustomer(null);
    setModalOpen(true);
  };

  const handleEdit = (c: Customer) => {
    setEditingCustomer(c);
    setModalOpen(true);
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa khách hàng "${name}" không?`)) {
      deleteCustomer(id);
    }
  };

  const handleExportCSV = () => {
    const headers = [
      { key: 'name' as keyof Customer, label: 'Tên khách hàng' },
      { key: 'phone' as keyof Customer, label: 'Số điện thoại' },
      { key: 'address' as keyof Customer, label: 'Địa chỉ' },
      { key: 'totalOrders' as keyof Customer, label: 'Tổng số đơn' },
      { key: 'totalSpent' as keyof Customer, label: 'Tổng chi tiêu (VND)' },
      { key: 'status' as keyof Customer, label: 'Phân loại' },
    ];
    exportToCSV('danh-sach-khach-hang-si', filtered, headers);
  };

  const statusBadge = (status: Customer['status']) => {
    switch (status) {
      case 'vip':
        return <Badge variant="warning" size="sm">⭐ Khách VIP</Badge>;
      case 'active':
        return <Badge variant="success" size="sm">Thường xuyên</Badge>;
      case 'inactive':
        return <Badge variant="neutral" size="sm">Tạm ngưng</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100">
            Khách hàng sỉ B2B
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Quản lý hồ sơ đối tác, lịch sử chi tiêu và liên hệ nhanh qua Zalo
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            leftIcon={<Download className="w-4 h-4" />}
            onClick={handleExportCSV}
          >
            Xuất CSV
          </Button>
          <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />} onClick={handleAdd}>
            Thêm khách hàng
          </Button>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-card p-4 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input
            placeholder="Tìm theo tên shop, số điện thoại, địa chỉ giao hàng..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>

        <div className="w-full sm:w-48">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full h-10 rounded-btn border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="all">Tất cả phân loại</option>
            <option value="vip">Khách VIP (Sỉ lớn)</option>
            <option value="active">Thường xuyên (Active)</option>
            <option value="inactive">Tạm ngưng</option>
          </select>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-card shadow-sm overflow-hidden">
        {paginatedCustomers.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
              Không tìm thấy khách hàng nào
            </h3>
            <p className="text-xs text-slate-400 mt-1 mb-4">
              Thử tìm kiếm với số điện thoại hoặc tên đối tác khác
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
              }}
            >
              Xem tất cả khách hàng
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Tên khách / Shop</th>
                  <th className="py-3 px-4">Số điện thoại / Zalo</th>
                  <th className="py-3 px-4">Địa chỉ giao hàng</th>
                  <th className="py-3 px-4 text-center">Tổng đơn</th>
                  <th className="py-3 px-4">Tổng chi tiêu</th>
                  <th className="py-3 px-4">Phân loại</th>
                  <th className="py-3 px-4">Đơn gần nhất</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paginatedCustomers.map((c) => (
                  <tr
                    key={c.id}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-slate-100 text-sm">
                      {c.name}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {c.phone}
                        </span>
                        <a
                          href={`https://zalo.me/${c.phone.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-1.5 py-0.5 rounded bg-blue-600 text-white text-[10px] font-bold inline-flex items-center gap-0.5 hover:bg-blue-700"
                        >
                          <MessageCircle className="w-3 h-3" />
                          <span>Zalo</span>
                        </a>
                      </div>
                    </td>

                    <td
                      className="py-3.5 px-4 max-w-xs truncate text-slate-500 dark:text-slate-400"
                      title={c.address}
                    >
                      {c.address}
                    </td>

                    <td className="py-3.5 px-4 text-center font-bold text-slate-800 dark:text-slate-200">
                      {formatNumber(c.totalOrders)} đơn
                    </td>

                    <td className="py-3.5 px-4 font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(c.totalSpent)}
                    </td>

                    <td className="py-3.5 px-4">{statusBadge(c.status)}</td>

                    <td className="py-3.5 px-4 text-slate-400">
                      {formatDate(c.lastOrderDate)}
                    </td>

                    <td className="py-3.5 px-4 text-right space-x-1">
                      <button
                        onClick={() => handleEdit(c)}
                        className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition-colors"
                        title="Chỉnh sửa"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(c.id, c.name)}
                        className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                        title="Xoá"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filtered.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Customer Modal */}
      <CustomerModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        customer={editingCustomer}
      />
    </div>
  );
};
