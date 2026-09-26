import React from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { Order, OrderStatus } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { formatCurrency, formatDate } from '../../lib/utils';
import { Phone, MessageCircle, Send, CheckCircle } from 'lucide-react';

interface OrderDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
}

export const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  isOpen,
  onClose,
  order,
}) => {
  const { updateOrderStatus } = useAppStore();

  if (!order) return null;

  const handleStatusChange = (status: OrderStatus) => {
    updateOrderStatus(order.id, status);
  };

  const statusMap = {
    pending: { label: 'Chờ duyệt', variant: 'warning' as const },
    confirmed: { label: 'Đã xác nhận', variant: 'info' as const },
    shipping: { label: 'Đang giao hàng', variant: 'info' as const },
    completed: { label: 'Đã hoàn tất', variant: 'success' as const },
    cancelled: { label: 'Đã huỷ', variant: 'error' as const },
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Chi tiết đơn hàng: ${order.code}`}
      description={`Đặt lúc ${formatDate(order.createdAt)}`}
      maxWidth="3xl"
      footer={
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Cập nhật trạng thái:</span>
            <select
              value={order.status}
              onChange={(e) => handleStatusChange(e.target.value as OrderStatus)}
              className="text-xs font-bold rounded-btn border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="pending">Chờ duyệt</option>
              <option value="confirmed">Đã xác nhận</option>
              <option value="shipping">Đang giao hàng</option>
              <option value="completed">Đã hoàn tất</option>
              <option value="cancelled">Đã huỷ</option>
            </select>
          </div>
          <Button variant="primary" size="sm" onClick={onClose}>
            Đóng
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Customer Information Card */}
        <div className="p-4 rounded-card bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Thông tin khách hàng
            </span>
            <Badge variant={statusMap[order.status].variant}>
              {statusMap[order.status].label}
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-xs text-slate-400 block">Tên khách / Shop:</span>
              <span className="font-bold text-slate-800 dark:text-slate-100">{order.customerName}</span>
            </div>
            <div>
              <span className="text-xs text-slate-400 block">Số điện thoại / Zalo:</span>
              <div className="flex items-center gap-2 mt-0.5">
                <a
                  href={`tel:${order.customerPhone}`}
                  className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>{order.customerPhone}</span>
                </a>
                <a
                  href={`https://zalo.me/${order.customerPhone.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2 py-0.5 rounded bg-blue-600 text-white text-[11px] font-bold inline-flex items-center gap-1 hover:bg-blue-700"
                >
                  <MessageCircle className="w-3 h-3" />
                  <span>Zalo</span>
                </a>
              </div>
            </div>
          </div>

          {order.note && (
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
              <span className="text-xs text-slate-400 block mb-0.5">Ghi chú từ khách:</span>
              <p className="text-xs font-medium text-slate-700 dark:text-slate-300 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-2.5 rounded-btn">
                {order.note}
              </p>
            </div>
          )}

          <div className="flex items-center justify-between text-xs pt-1 text-slate-500">
            <span className="flex items-center gap-1.5">
              <Send className="w-3.5 h-3.5 text-emerald-500" />
              <span>Gửi Telegram: {order.deliveredTelegram ? 'Thành công ✓' : 'Chưa gửi'}</span>
            </span>
            {order.hasLogo && (
              <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Yêu cầu in ấn logo thương hiệu</span>
              </span>
            )}
          </div>
        </div>

        {/* Ordered items table */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Danh sách mặt hàng đặt mua ({order.items.length})
            </h4>
            <span className="text-[11px] font-semibold text-slate-400">
              Tổng số lượng: {order.items.reduce((s, it) => s + it.qty, 0)} {order.items[0]?.unit || 'mặt hàng'}
            </span>
          </div>
          <div className="border border-slate-200 dark:border-slate-800 rounded-card overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-3.5 min-w-[150px]">Sản phẩm</th>
                    <th className="py-3 px-3.5 min-w-[140px]">Quy cách (Size - Màu)</th>
                    <th className="py-3 px-3.5 text-center min-w-[90px]">Số lượng</th>
                    <th className="py-3 px-3.5 text-right min-w-[95px]">Đơn giá</th>
                    <th className="py-3 px-3.5 text-right min-w-[110px]">Thành tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                  {order.items.map((item) => {
                    const isSample = item.unit === 'mẫu' || item.name.includes('Mẫu thử');
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-3.5">
                          <div className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm">
                            {item.name}
                          </div>
                          {isSample && (
                            <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300">
                              Đăng ký gửi mẫu
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3.5 text-slate-600 dark:text-slate-400 font-medium">
                          {item.size || 'Mẫu chuẩn kho'} {item.color && item.color !== 'Mẫu chuẩn kho' ? `· ${item.color}` : ''}
                        </td>
                        <td className="py-3 px-3.5 text-center">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-black bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                            {item.qty} {item.unit}
                          </span>
                        </td>
                        <td className="py-3 px-3.5 text-right text-slate-500 font-medium whitespace-nowrap">
                          {formatCurrency(item.price)}
                        </td>
                        <td className="py-3 px-3.5 text-right font-black text-emerald-600 dark:text-emerald-400 whitespace-nowrap text-xs sm:text-sm">
                          {formatCurrency(item.total)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-slate-50/90 dark:bg-slate-800/60 font-bold border-t-2 border-slate-200 dark:border-slate-800">
                  <tr>
                    <td colSpan={3} className="py-3.5 px-3.5 text-right text-slate-700 dark:text-slate-300 font-bold">
                      Tổng tiền báo giá dự kiến:
                    </td>
                    <td colSpan={2} className="py-3.5 px-3.5 text-right text-base font-black text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                      {formatCurrency(order.totalAmount)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
