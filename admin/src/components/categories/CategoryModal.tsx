import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { Category } from '../../types';
import { useAppStore } from '../../store/useAppStore';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  category?: Category | null;
}

export const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  onClose,
  category,
}) => {
  const { addCategory, updateCategory } = useAppStore();

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    status: 'active' as Category['status'],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        slug: category.slug,
        description: category.description,
        status: category.status,
      });
    } else {
      setFormData({
        name: '',
        slug: '',
        description: '',
        status: 'active',
      });
    }
    setErrors({});
  }, [category, isOpen]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const slug = val
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    setFormData((prev) => ({
      ...prev,
      name: val,
      slug: prev.slug && category ? prev.slug : slug,
    }));
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.name.trim()) errs.name = 'Vui lòng nhập tên danh mục';
    if (!formData.slug.trim()) errs.slug = 'Vui lòng nhập đường dẫn slug';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    if (category) {
      updateCategory(category.id, {
        name: formData.name.trim(),
        slug: formData.slug.trim(),
        description: formData.description.trim(),
        status: formData.status,
      });
    } else {
      addCategory({
        name: formData.name.trim(),
        slug: formData.slug.trim(),
        description: formData.description.trim(),
        status: formData.status,
      });
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={category ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới'}
      description="Quản lý nhóm dòng hàng bao bì sỉ"
      maxWidth="md"
      footer={
        <>
          <Button variant="outline" type="button" onClick={onClose}>
            Huỷ bỏ
          </Button>
          <Button variant="primary" type="button" onClick={handleSubmit}>
            {category ? 'Lưu thay đổi' : 'Tạo danh mục'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Tên danh mục *"
          placeholder="Ví dụ: Túi hột xoài"
          value={formData.name}
          onChange={handleNameChange}
          error={errors.name}
        />

        <Input
          label="Slug (Đường dẫn) *"
          placeholder="tui-xoai"
          value={formData.slug}
          onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
          error={errors.slug}
        />

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 tracking-wide uppercase mb-1.5">
            Trạng thái
          </label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as Category['status'] })}
            className="w-full rounded-btn border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          >
            <option value="active">Hoạt động (Active)</option>
            <option value="inactive">Tạm ẩn (Inactive)</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 tracking-wide uppercase">
            Mô tả
          </label>
          <textarea
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Mô tả nhóm sản phẩm..."
            className="w-full rounded-btn border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>
      </form>
    </Modal>
  );
};
