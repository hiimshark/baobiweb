import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';
import {
  LayoutDashboard,
  Package,
  Layers,
  ShoppingBag,
  Users,
  BarChart3,
  MessageSquare,
  Settings,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Store,
  X,
} from 'lucide-react';
import { cn } from '../../lib/utils';

export const Sidebar: React.FC = () => {
  const {
    sidebarCollapsed,
    toggleSidebar,
    mobileDrawerOpen,
    setMobileDrawerOpen,
    orders,
    messages,
  } = useAppStore();

  const pendingOrdersCount = orders.filter((o) => o.status === 'pending').length;
  const unreadMessagesCount = messages.filter((m) => !m.isRead).length;

  const navItems = [
    { to: '/dashboard', label: 'Tổng quan', icon: LayoutDashboard },
    { to: '/products', label: 'Sản phẩm', icon: Package },
    { to: '/categories', label: 'Danh mục', icon: Layers },
    { to: '/orders', label: 'Đơn hàng', icon: ShoppingBag, badge: pendingOrdersCount },
    { to: '/customers', label: 'Khách hàng', icon: Users },
    { to: '/analytics', label: 'Phân tích', icon: BarChart3 },
    { to: '/messages', label: 'Yêu cầu tư vấn', icon: MessageSquare, badge: unreadMessagesCount },
    { to: '/settings', label: 'Cài đặt', icon: Settings },
  ];

  const content = (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300">
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-700 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-emerald-600/20 shrink-0">
            <Store className="w-5 h-5" />
          </div>
          {(!sidebarCollapsed || mobileDrawerOpen) && (
            <div className="flex flex-col min-w-0">
              <span className="font-extrabold text-sm text-slate-900 dark:text-slate-100 truncate">
                Kho Sỉ Bao Bì
              </span>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold tracking-wide uppercase">
                Admin Panel
              </span>
            </div>
          )}
        </div>

        {/* Mobile close button */}
        <button
          onClick={() => setMobileDrawerOpen(false)}
          className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Nav List */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMobileDrawerOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-btn text-sm font-medium transition-all group relative',
                  isActive
                    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100',
                  sidebarCollapsed && !mobileDrawerOpen && 'justify-center px-0'
                )
              }
              title={sidebarCollapsed && !mobileDrawerOpen ? item.label : undefined}
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={cn(
                      'w-5 h-5 shrink-0 transition-colors',
                      isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                    )}
                  />
                  {(!sidebarCollapsed || mobileDrawerOpen) && (
                    <span className="truncate flex-1">{item.label}</span>
                  )}
                  {Boolean(item.badge) && item.badge! > 0 && (
                    <span
                      className={cn(
                        'px-1.5 py-0.5 rounded-full text-[10px] font-extrabold text-white bg-red-500 shadow-sm shrink-0',
                        sidebarCollapsed && !mobileDrawerOpen && 'absolute -top-1 -right-1'
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer / Storefront link */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
        <a
          href="http://localhost:3000/"
          target="_blank"
          rel="noreferrer"
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-btn text-xs font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-emerald-600 transition-colors',
            sidebarCollapsed && !mobileDrawerOpen && 'justify-center px-0'
          )}
          title="Xem trang bán hàng (Storefront)"
        >
          <ExternalLink className="w-4 h-4 shrink-0" />
          {(!sidebarCollapsed || mobileDrawerOpen) && <span>Xem trang khách</span>}
        </a>

        {/* Desktop Collapse Toggle */}
        <button
          onClick={toggleSidebar}
          className="hidden md:flex w-full items-center justify-center p-2 rounded-btn text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-xs font-medium gap-2"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span>Thu gọn</span>
            </>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden md:block shrink-0 transition-all duration-300',
          sidebarCollapsed ? 'w-20' : 'w-64'
        )}
      >
        <div className="fixed inset-y-0 left-0 z-30 h-full w-[inherit]">
          {content}
        </div>
      </aside>

      {/* Mobile Drawer */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex animate-in fade-in duration-200">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setMobileDrawerOpen(false)}
          />
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl animate-in slide-in-from-left duration-200">
            {content}
          </div>
        </div>
      )}
    </>
  );
};
