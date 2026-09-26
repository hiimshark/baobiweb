import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { Customer } from '../../types';
import { useAppStore } from '../../store/useAppStore';

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer?: Customer | null;
}

export const CustomerModal: React.FC<CustomerModalProps> = ({
  isOpen,
  onClose,
  customer,
}) => {
  const { addCustomer, updateCustomer } = useAppStore();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    status: 'active' as Customer['status'],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name,
        phone: customer.phone,
        email: customer.email || '',
        address: customer.address,
        status: customer.status,
      });
    } else {
      setFormData({
        name: '',
        phone: '',
        email: '',
        address: '',
        status: 'active',
      });
    }
    setErrors({});
  }, [customer, isOpen]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.name.trim()) errs.name = 'Vui lòng nhập tên khách hàng';
    if (!formData.phone.trim()) errs.phone = 'Vui lòng nhập số điện thoại / Zalo';
    if (!formData.address.trim()) errs.address = 'Vui lòng nhập địa chỉ giao hàng';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    if (customer) {
      updateCustomer(customer.id, {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim() || undefined,
        address: formData.address.trim(),
        status: formData.status,
      });
    } else {
      addCustomer({
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim() || undefined,
        address: formData.address.trim(),
        status: formData.status,
      });
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={customer ? 'Chỉnh sửa khách hàng' : 'Thêm khách hàng sỉ mới'}
      description="Quản lý hồ sơ đối tác và thông tin giao hàng"
      maxWidth="md"
      footer={
        <>
          <Button variant="outline" type="button" onClick={onClose}>
            Huỷ bỏ
          </Button>
          <Button variant="primary" type="button" onClick={handleSubmit}>
            {customer ? 'Lưu thay đổi' : 'Thêm khách hàng'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Tên khách hàng / Tên Shop *"
          placeholder="Ví dụ: Chị Mai (Trà Sữa Mộc)"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          error={errors.name}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Số điện thoại Zalo *"
            placeholder="0901234567"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            error={errors.phone}
          />

          <Input
            label="Email"
            placeholder="email@gmail.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 tracking-wide uppercase mb-1.5">
            Phân loại khách hàng
          </label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as Customer['status'] })}
            className="w-full rounded-btn border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="active">Thường xuyên (Active)</option>
            <option value="vip">Khách VIP (Sỉ lớn)</option>
            <option value="inactive">Tạm ngưng (Inactive)</option>
          </select>
        </div>

        <Input
          label="Địa chỉ giao nhận *"
          placeholder="Số nhà, tên đường, Quận/Huyện, TP.HCM hoặc chành xe"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          error={errors.address}
        />
      </form>
    </Modal>
  );
};
