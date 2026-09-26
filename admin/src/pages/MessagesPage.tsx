import React, { useState } from 'react';
import { 
  MessageSquare, 
  Search, 
  Phone, 
  ExternalLink, 
  CheckCircle2, 
  Clock, 
  Send,
  Eye,
  Filter
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { formatDate } from '../lib/utils';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';

export const MessagesPage: React.FC = () => {
  const { messages, markMessageRead, replyMessage } = useAppStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'unread' | 'replied'>('all');
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const filteredMessages = messages.filter((msg) => {
    const matchSearch =
      msg.senderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      msg.senderPhone.includes(searchTerm) ||
      msg.content.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchSearch) return false;

    if (filterStatus === 'unread') return !msg.isRead;
    if (filterStatus === 'replied') return msg.replied;
    return true;
  });

  const activeMessage = messages.find((m) => m.id === selectedMessageId);

  const handleOpenDetail = (id: string) => {
    setSelectedMessageId(id);
    markMessageRead(id);
  };

  const handleSendReply = () => {
    if (selectedMessageId) {
      replyMessage(selectedMessageId);
      setReplyText('');
      setSelectedMessageId(null);
    }
  };

  const unreadCount = messages.filter((m) => !m.isRead).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Tin Nhắn & Yêu Cầu Tư Vấn
            </h1>
            {unreadCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500 text-white animate-pulse">
                {unreadCount} chưa đọc
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Tổng hợp yêu cầu báo giá sỉ, liên hệ tư vấn từ khách hàng trên website & Zalo
          </p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white dark:bg-dark-card rounded-2xl p-4 border border-gray-100 dark:border-dark-border shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm theo tên khách, SĐT, nội dung..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-gray-100 dark:bg-dark-bg rounded-xl w-full md:w-auto">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex-1 md:flex-none ${
              filterStatus === 'all'
                ? 'bg-white dark:bg-dark-card text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Tất cả ({messages.length})
          </button>
          <button
            onClick={() => setFilterStatus('unread')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex-1 md:flex-none ${
              filterStatus === 'unread'
                ? 'bg-white dark:bg-dark-card text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Chưa đọc ({unreadCount})
          </button>
          <button
            onClick={() => setFilterStatus('replied')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex-1 md:flex-none ${
              filterStatus === 'replied'
                ? 'bg-white dark:bg-dark-card text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Đã xử lý ({messages.filter((m) => m.replied).length})
          </button>
        </div>
      </div>

      {/* Messages List */}
      <div className="space-y-3">
        {filteredMessages.length === 0 ? (
          <div className="bg-white dark:bg-dark-card rounded-2xl border border-gray-100 dark:border-dark-border p-12 text-center">
            <MessageSquare className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <h3 className="text-base font-medium text-gray-900 dark:text-white">Không có tin nhắn nào</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Thử thay đổi bộ lọc hoặc từ khoá tìm kiếm
            </p>
          </div>
        ) : (
          filteredMessages.map((msg) => (
            <div
              key={msg.id}
              className={`p-4 rounded-2xl border transition-all duration-200 bg-white dark:bg-dark-card ${
                !msg.isRead
                  ? 'border-emerald-200 dark:border-emerald-900/50 shadow-sm ring-1 ring-emerald-500/10'
                  : 'border-gray-100 dark:border-dark-border hover:border-gray-300 dark:hover:border-gray-700'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-bold text-sm ${
                      !msg.isRead
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-gray-100 text-gray-600 dark:bg-dark-bg dark:text-gray-400'
                    }`}
                  >
                    {msg.senderName.charAt(0).toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-900 dark:text-white text-base">
                        {msg.senderName}
                      </span>
                      <a
                        href={`tel:${msg.senderPhone}`}
                        className="text-xs text-primary-600 dark:text-primary-400 font-mono hover:underline flex items-center gap-1"
                      >
                        <Phone className="w-3 h-3" />
                        {msg.senderPhone}
                      </a>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(msg.createdAt)}
                      </span>
                    </div>

                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-2 leading-relaxed">
                      {msg.content}
                    </p>

                    {msg.itemsSummary && (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 dark:bg-dark-bg rounded-lg text-xs text-gray-600 dark:text-gray-400 border border-gray-100 dark:border-dark-border mb-1">
                        <span className="font-medium text-gray-700 dark:text-gray-300">Đơn quan tâm:</span>
                        <span>{msg.itemsSummary}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-row md:flex-col items-center md:items-end justify-between gap-2.5 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-gray-100 dark:border-dark-border">
                  <div className="flex items-center gap-2">
                    {msg.replied ? (
                      <Badge variant="success" className="gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Đã phản hồi
                      </Badge>
                    ) : !msg.isRead ? (
                      <Badge variant="warning" className="gap-1 animate-pulse">
                        Chưa đọc
                      </Badge>
                    ) : (
                      <Badge variant="default">Đã xem</Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={`https://zalo.me/${msg.senderPhone}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 flex items-center gap-1 transition-colors"
                      title="Mở Zalo nhắn trực tiếp"
                    >
                      Zalo <ExternalLink className="w-3 h-3" />
                    </a>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenDetail(msg.id)}
                      className="text-xs h-8"
                    >
                      Chi tiết & Phản hồi
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Message Detail & Reply Modal */}
      {activeMessage && (
        <Modal
          isOpen={!!selectedMessageId}
          onClose={() => setSelectedMessageId(null)}
          title={`Yêu cầu tư vấn: ${activeMessage.senderName}`}
        >
          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-dark-bg p-4 rounded-xl border border-gray-100 dark:border-dark-border space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400">Số điện thoại:</span>
                <a
                  href={`tel:${activeMessage.senderPhone}`}
                  className="font-medium text-primary-600 dark:text-primary-400 flex items-center gap-1"
                >
                  <Phone className="w-3.5 h-3.5" /> {activeMessage.senderPhone}
                </a>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400">Thời gian gửi:</span>
                <span className="text-gray-700 dark:text-gray-300 font-mono text-xs">
                  {formatDate(activeMessage.createdAt)}
                </span>
              </div>
              {activeMessage.itemsSummary && (
                <div className="text-sm border-t border-gray-200/60 dark:border-dark-border pt-2 mt-2">
                  <span className="text-gray-500 dark:text-gray-400 block mb-1">Mặt hàng quan tâm:</span>
                  <span className="font-medium text-gray-800 dark:text-gray-200">
                    {activeMessage.itemsSummary}
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
                Nội dung khách nhắn
              </label>
              <div className="p-3.5 bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-xl text-sm text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
                {activeMessage.content}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
                Ghi chú phản hồi / CSKH
              </label>
              <textarea
                rows={3}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Nhập ghi chú đã gọi điện thoại hoặc nội dung tư vấn qua Zalo..."
                className="w-full p-3 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white"
              />
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-dark-border">
              <a
                href={`https://zalo.me/${activeMessage.senderPhone}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                Nhắn Zalo số này <ExternalLink className="w-3 h-3" />
              </a>

              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setSelectedMessageId(null)}>
                  Đóng
                </Button>
                <Button variant="primary" onClick={handleSendReply} className="gap-1.5">
                  <Send className="w-3.5 h-3.5" /> Đánh dấu đã phản hồi
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
