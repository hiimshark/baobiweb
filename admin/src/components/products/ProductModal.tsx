import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { Product } from '../../types';
import { useAppStore } from '../../store/useAppStore';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product | null;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  product,
}) => {
  const { categories, addProduct, updateProduct } = useAppStore();

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: categories[0]?.name || 'Túi hột xoài',
    price: 35000,
    unit: 'kg',
    moq: 'Từ 10 kg / size',
    stock: 1000,
    status: 'active' as Product['status'],
    image: '/images/hero.jpg',
    sizesText: '15×23 cm, 17×25 cm, 20×30 cm, 24×34 cm, 30×42 cm',
    colorsText: 'Trắng, Đỏ, Vàng, Xanh lá, Đen, Trong suốt',
    presetsText: '10, 20, 50, 100',
    blurb: '',
    detail: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        sku: product.sku,
        category: product.category,
        price: product.price,
        unit: product.unit,
        moq: product.moq,
        stock: product.stock,
        status: product.status,
        image: product.image,
        sizesText: product.sizes.join(', '),
        colorsText: product.colors.join(', '),
        presetsText: product.presets.join(', '),
        blurb: product.blurb,
        detail: product.detail || '',
      });
    } else {
      setFormData({
        name: '',
        sku: 'SP-' + Math.floor(100 + Math.random() * 900),
        category: categories[0]?.name || 'Túi hột xoài',
        price: 35000,
        unit: 'kg',
        moq: 'Từ 10 kg / size',
        stock: 500,
        status: 'active',
        image: '/images/tui-xoai.jpg',
        sizesText: '15×23 cm, 20×30 cm, 24×34 cm, 30×42 cm',
        colorsText: 'Trắng, Vàng, Đỏ, Đen, Trong suốt',
        presetsText: '10, 20, 50, 100',
        blurb: '',
        detail: '',
      });
    }
    setErrors({});
  }, [product, isOpen, categories]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.name.trim()) errs.name = 'Vui lòng nhập tên sản phẩm';
    if (!formData.sku.trim()) errs.sku = 'Vui lòng nhập mã SKU';
    if (formData.price <= 0) errs.price = 'Giá sỉ phải lớn hơn 0';
    if (!formData.unit.trim()) errs.unit = 'Vui lòng nhập đơn vị tính';
    if (!formData.blurb.trim()) errs.blurb = 'Vui lòng nhập mô tả ngắn';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const sizes = formData.sizesText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const colors = formData.colorsText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const presets = formData.presetsText
      .split(',')
      .map((s) => Number(s.trim()))
      .filter((n) => Number.isFinite(n) && n > 0);

    const payload = {
      name: formData.name.trim(),
      sku: formData.sku.trim(),
      category: formData.category,
      price: Number(formData.price),
      unit: formData.unit.trim(),
      moq: formData.moq.trim(),
      stock: Number(formData.stock),
      status: formData.status,
      image: formData.image,
      sizes,
      colors,
      presets,
      blurb: formData.blurb.trim(),
      detail: formData.detail.trim(),
    };

    if (product) {
      updateProduct(product.id, payload);
    } else {
      addProduct(payload);
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={product ? 'Chỉnh sửa sản phẩm sỉ' : 'Thêm sản phẩm mới'}
      description="Điền thông tin quy cách, giá sỉ và danh sách size/màu"
      maxWidth="xl"
      footer={
        <>
          <Button variant="outline" type="button" onClick={onClose}>
            Huỷ bỏ
          </Button>
          <Button variant="primary" type="button" onClick={handleSubmit}>
            {product ? 'Lưu thay đổi' : 'Tạo sản phẩm'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Tên sản phẩm *"
            placeholder="Ví dụ: Túi hột xoài HD zin"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            error={errors.name}
          />

          <Input
            label="Mã SKU *"
            placeholder="TX-01"
            value={formData.sku}
            onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
            error={errors.sku}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 tracking-wide uppercase mb-1.5">
              Danh mục
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full rounded-btn border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Giá tham khảo (VNĐ) *"
            type="number"
            min="0"
            step="500"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
            error={errors.price}
          />

          <Input
            label="Đơn vị tính *"
            placeholder="kg hoặc cái"
            value={formData.unit}
            onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
            error={errors.unit}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Số lượng sỉ tối thiểu (MOQ)"
            placeholder="Từ 10 kg / size"
            value={formData.moq}
            onChange={(e) => setFormData({ ...formData, moq: e.target.value })}
          />

          <Input
            label="Tồn kho ước tính"
            type="number"
            min="0"
            value={formData.stock}
            onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 tracking-wide uppercase mb-1.5">
              Trạng thái
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as Product['status'] })}
              className="w-full rounded-btn border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            >
              <option value="active">Đang bán (Active)</option>
              <option value="draft">Bản nháp (Draft)</option>
              <option value="archived">Lưu kho (Archived)</option>
            </select>
          </div>
        </div>

        <Input
          label="Kích thước có sẵn (phân cách bằng dấu phẩy)"
          placeholder="15×23 cm, 20×30 cm, 24×34 cm..."
          value={formData.sizesText}
          onChange={(e) => setFormData({ ...formData, sizesText: e.target.value })}
          helperText="Khách hàng sẽ chọn kích thước từ danh sách này trên web."
        />

        <Input
          label="Màu sắc có sẵn (phân cách bằng dấu phẩy)"
          placeholder="Trắng, Đỏ, Vàng, Xanh lá, Đen..."
          value={formData.colorsText}
          onChange={(e) => setFormData({ ...formData, colorsText: e.target.value })}
        />

        <Input
          label="Nút chọn nhanh số lượng sỉ (Presets)"
          placeholder="10, 20, 50, 100"
          value={formData.presetsText}
          onChange={(e) => setFormData({ ...formData, presetsText: e.target.value })}
          helperText="Các nút bấm nhanh giúp khách thêm số lượng lớn tiện lợi (+10, +50...)"
        />

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 tracking-wide uppercase">
            Mô tả ngắn *
          </label>
          <textarea
            rows={2}
            value={formData.blurb}
            onChange={(e) => setFormData({ ...formData, blurb: e.target.value })}
            placeholder="Túi nilon quai xách hột xoài, đáy ép nhiệt chắc chắn..."
            className="w-full rounded-btn border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
          {errors.blurb && <p className="text-xs text-red-500 font-medium">{errors.blurb}</p>}
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 tracking-wide uppercase">
            Thông tin chi tiết (tuỳ chọn)
          </label>
          <textarea
            rows={2}
            value={formData.detail}
            onChange={(e) => setFormData({ ...formData, detail: e.target.value })}
            placeholder="Chất liệu HD, PE dẻo bóng cao cấp. In logo 1-3 màu..."
            className="w-full rounded-btn border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>
      </form>
    </Modal>
  );
};
