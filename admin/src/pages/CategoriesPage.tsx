import React, { useState, useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Category, CategoryStatus } from '../types';
import { CategoryModal } from '../components/categories/CategoryModal';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Badge } from '../components/common/Badge';
import { Plus, Search, Edit2, Trash2, Layers } from 'lucide-react';

export const CategoriesPage: React.FC = () => {
  const { categories, products, deleteCategory } = useAppStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Compute live product counts for each category
  const categoriesWithCount = useMemo(() => {
    return categories.map((cat) => {
      const count = products.filter((p) => p.category === cat.name).length;
      return { ...cat, productCount: count };
    });
  }, [categories, products]);

  const filtered = useMemo(() => {
    return categoriesWithCount.filter((c) => {
      const matchSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchStatus = statusFilter === 'all' || c.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [categoriesWithCount, searchQuery, statusFilter]);

  const handleAdd = () => {
    setEditingCategory(null);
    setModalOpen(true);
  };

  const handleEdit = (cat: Category) => {
    setEditingCategory(cat);
    setModalOpen(true);
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa danh mục "${name}" không?`)) {
      deleteCategory(id);
    }
  };

  const statusBadge = (status: CategoryStatus) => {
    return status === 'active' ? (
      <Badge variant="success" size="sm">Hoạt động</Badge>
    ) : (
      <Badge variant="neutral" size="sm">Tạm ẩn</Badge>
    );
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100">
            Quản lý Danh mục dòng hàng
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Phân loại các nhóm bao bì: túi xoài, thùng carton, bìa lá, bao bì takeaway...
          </p>
        </div>

        <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />} onClick={handleAdd}>
          Tạo danh mục mới
        </Button>
      </div>

      {/* Search & Filter */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-card p-4 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input
            placeholder="Tìm danh mục theo tên, slug, mô tả..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>
        <div className="w-full sm:w-48">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full h-10 rounded-btn border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang hoạt động</option>
            <option value="inactive">Tạm ẩn</option>
          </select>
        </div>
      </div>

      {/* Categories Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-card shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Layers className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
              Không có danh mục nào phù hợp
            </h3>
            <p className="text-xs text-slate-400 mt-1 mb-4">
              Thử tìm kiếm với từ khóa khác hoặc tạo danh mục mới
            </p>
            <Button variant="outline" size="sm" onClick={() => setSearchQuery('')}>
              Xem tất cả danh mục
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Tên danh mục</th>
                  <th className="py-3 px-4">Đường dẫn Slug</th>
                  <th className="py-3 px-4">Mô tả</th>
                  <th className="py-3 px-4 text-center">Số sản phẩm</th>
                  <th className="py-3 px-4">Trạng thái</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map((cat) => (
                  <tr
                    key={cat.id}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-slate-100 text-sm">
                      {cat.name}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-emerald-600 dark:text-emerald-400">
                      /{cat.slug}
                    </td>

                    <td className="py-3.5 px-4 max-w-xs truncate text-slate-500 dark:text-slate-400">
                      {cat.description || 'Chưa có mô tả'}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300">
                        {cat.productCount} sản phẩm
                      </span>
                    </td>

                    <td className="py-3.5 px-4">{statusBadge(cat.status)}</td>

                    <td className="py-3.5 px-4 text-right space-x-1">
                      <button
                        onClick={() => handleEdit(cat)}
                        className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition-colors"
                        title="Chỉnh sửa"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(cat.id, cat.name)}
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
      </div>

      {/* Modal */}
      <CategoryModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        category={editingCategory}
      />
    </div>
  );
};
