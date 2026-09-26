import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import {
  Menu,
  Moon,
  Sun,
  Bell,
  Search,
  CheckCheck,
  Send,
  LogOut,
} from 'lucide-react';
import { formatDate } from '../../lib/utils';
import { useNavigate } from 'react-router-dom';

export const Header: React.FC = () => {
  const {
    darkMode,
    toggleDarkMode,
    setMobileDrawerOpen,
    messages,
    markMessageRead,
    logout,
  } = useAppStore();

  const [notifOpen, setNotifOpen] = useState(false);
  const [quickSearch, setQuickSearch] = useState('');
  const navigate = useNavigate();

  const unreadCount = messages.filter((m) => !m.isRead).length;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickSearch.trim()) return;
    navigate(`/products?q=${encodeURIComponent(quickSearch.trim())}`);
    setQuickSearch('');
  };

  return (
    <header className="sticky top-0 z-20 h-16 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 md:px-6 flex items-center justify-between gap-4 transition-colors">
      {/* Left: Mobile Burger & Global Search */}
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <button
          onClick={() => setMobileDrawerOpen(true)}
          className="md:hidden p-2 rounded-btn text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Mở menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <form onSubmit={handleSearchSubmit} className="relative w-full hidden sm:block">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Tìm sản phẩm, mã đơn, khách hàng..."
            value={quickSearch}
            onChange={(e) => setQuickSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 rounded-btn bg-slate-100 dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 border border-transparent focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-all"
          />
        </form>
      </div>

      {/* Right: Actions & User */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Telegram Bot status indicator */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <Send className="w-3.5 h-3.5" />
          <span>Telegram Bot Online</span>
        </div>

        {/* Dark Mode Toggle */}
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-btn text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title={darkMode ? 'Chuyển sang chế độ Sáng' : 'Chuyển sang chế độ Tối'}
          aria-label="Chuyển chế độ sáng/tối"
        >
          {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="p-2 rounded-btn text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative"
            aria-label="Thông báo"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
            )}
          </button>

          {notifOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setNotifOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-modal shadow-2xl z-40 py-2 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    Yêu cầu tư vấn mới ({unreadCount})
                  </span>
                  <button
                    onClick={() => {
                      messages.forEach((m) => markMessageRead(m.id));
                      setNotifOpen(false);
                    }}
                    className="text-[11px] text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Đã đọc hết</span>
                  </button>
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                  {messages.length === 0 ? (
                    <p className="p-4 text-center text-xs text-slate-400">Không có thông báo mới</p>
                  ) : (
                    messages.slice(0, 5).map((msg) => (
                      <div
                        key={msg.id}
                        onClick={() => {
                          markMessageRead(msg.id);
                          setNotifOpen(false);
                          navigate('/messages');
                        }}
                        className={`p-3 text-xs hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors ${
                          !msg.isRead ? 'bg-emerald-50/40 dark:bg-emerald-950/20' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-slate-800 dark:text-slate-200">{msg.senderName}</span>
                          <span className="text-[10px] text-slate-400">{formatDate(msg.createdAt)}</span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-400 line-clamp-2">{msg.content}</p>
                      </div>
                    ))
                  )}
                </div>

                <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800 text-center">
                  <button
                    onClick={() => {
                      setNotifOpen(false);
                      navigate('/messages');
                    }}
                    className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    Xem tất cả yêu cầu tư vấn →
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* User profile badge & Logout */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200 dark:border-slate-800">
          <div className="w-9 h-9 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shadow-sm">
            KB
          </div>
          <div className="hidden lg:flex flex-col text-left">
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100">Chủ Kho Bao Bì</span>
            <span className="text-[10px] text-slate-400">admin@sibaobi.vn</span>
          </div>

          <button
            onClick={logout}
            className="p-2 rounded-btn text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
            title="Khóa quản trị / Đăng xuất"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
