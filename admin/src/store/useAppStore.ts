import { create } from 'zustand';
import { Product, Category, Order, Customer, Message, TimeRange, OrderStatus } from '../types';
import { adminApi } from '../lib/api';

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  type: 'success' | 'error' | 'info';
}

interface AppState {
  // Theme & Layout
  darkMode: boolean;
  toggleDarkMode: () => void;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  mobileDrawerOpen: boolean;
  setMobileDrawerOpen: (open: boolean) => void;

  // Authentication
  isAuthenticated: boolean;
  login: (pin: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;

  // Real backend sync state
  isLoading: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rawBackendProducts: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rawUses: any[];
  fetchInitialData: () => Promise<void>;

  // Toasts
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;

  // Dashboard filter
  timeRange: TimeRange;
  setTimeRange: (range: TimeRange) => void;

  // Products
  products: Product[];
  addProduct: (product: Omit<Product, 'id' | 'salesCount'>) => Promise<void>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;

  // Categories
  categories: Category[];
  addCategory: (category: Omit<Category, 'id' | 'productCount'>) => void;
  updateCategory: (id: string, category: Partial<Category>) => void;
  deleteCategory: (id: string) => void;

  // Orders
  orders: Order[];
  updateOrderStatus: (id: string, status: OrderStatus) => Promise<void>;
  deleteOrder: (id: string) => Promise<void>;

  // Customers
  customers: Customer[];
  addCustomer: (customer: Omit<Customer, 'id' | 'totalOrders' | 'totalSpent' | 'lastOrderDate'>) => void;
  updateCustomer: (id: string, customer: Partial<Customer>) => void;
  deleteCustomer: (id: string) => Promise<void>;

  // Messages / Leads
  messages: Message[];
  markMessageRead: (id: string) => void;
  replyMessage: (id: string) => void;
}

export const useAppStore = create<AppState>((set, get) => {
  // Initialize dark mode from localStorage or system preference
  const savedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const initialDarkMode = savedTheme ? savedTheme === 'dark' : prefersDark;

  if (initialDarkMode) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }

  return {
    darkMode: initialDarkMode,
    toggleDarkMode: () => {
      const next = !get().darkMode;
      localStorage.setItem('theme', next ? 'dark' : 'light');
      if (next) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      set({ darkMode: next });
    },

    sidebarCollapsed: false,
    toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

    mobileDrawerOpen: false,
    setMobileDrawerOpen: (open: boolean) => set({ mobileDrawerOpen: open }),

    isAuthenticated: Boolean(localStorage.getItem('admin_pin')),
    login: async (pin: string) => {
      try {
        const res = await adminApi.login(pin);
        if (res && res.ok) {
          localStorage.setItem('admin_pin', pin);
          set({ isAuthenticated: true });
          get().fetchInitialData();
          return { ok: true };
        }
        return { ok: false, error: res?.error || 'Mã PIN không đúng.' };
      } catch (err: any) {
        return { ok: false, error: err.response?.data?.error || 'Mã PIN không chính xác.' };
      }
    },
    logout: () => {
      localStorage.removeItem('admin_pin');
      try {
        adminApi.saveSettings({}); // or call logout
      } catch {}
      set({ isAuthenticated: false });
    },

    isLoading: false,
    rawBackendProducts: [],
    rawUses: [],

    fetchInitialData: async () => {
      set({ isLoading: true });
      try {
        // 1. Fetch real products from backend
        const prodRes = await adminApi.getProducts();
        if (prodRes && prodRes.ok && Array.isArray(prodRes.products)) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const mappedProducts: Product[] = prodRes.products.map((p: any) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const colorNames = Array.isArray(p.colors)
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              ? p.colors.map((c: any) => (typeof c === 'string' ? c : c.name))
              : [];

            return {
              id: p.id || 'prod-' + Math.random().toString(36).slice(2, 7),
              sku: p.sku || 'SKU-' + p.id,
              name: p.name || 'Sản phẩm bao bì',
              category: p.filter || 'Bao bì',
              price: p.price || 35000,
              unit: p.unit || 'kg',
              moq: p.moq || 'Từ 10 kg',
              stock: p.stock ?? 250,
              status: (p.status as any) || 'active',
              image: p.image || '/images/tui-xoai.jpg',
              sizes: Array.isArray(p.sizes) ? p.sizes : [],
              colors: colorNames,
              presets: Array.isArray(p.presets) ? p.presets : [10, 20, 50, 100],
              blurb: p.blurb || '',
              detail: p.detail || '',
              salesCount: p.salesCount || 0,
            };
          });

          // Build dynamic categories from products
          const catMap = new Map<string, number>();
          mappedProducts.forEach((p) => {
            const cat = p.category || 'Khác';
            catMap.set(cat, (catMap.get(cat) || 0) + 1);
          });

          const dynamicCategories: Category[] = Array.from(catMap.entries()).map(([name, count], idx) => ({
            id: 'cat-' + idx,
            name,
            slug: name.toLowerCase().replace(/\s+/g, '-'),
            description: `Các loại bao bì đóng gói dòng ${name}`,
            productCount: count,
            status: 'active',
          }));

          set({
            products: mappedProducts,
            rawBackendProducts: prodRes.products,
            rawUses: prodRes.uses || [],
            categories: dynamicCategories.length > 0 ? dynamicCategories : get().categories,
          });
        }

        // 2. Fetch real orders from backend
        const orderRes = await adminApi.getOrders();
        if (orderRes && orderRes.ok && Array.isArray(orderRes.orders) && orderRes.orders.length > 0) {
          const realOrders: Order[] = orderRes.orders;

          // Build unique customer list from orders
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const custMap = new Map<string, Customer>();
          realOrders.forEach((ord) => {
            const phone = ord.customerPhone || '0901234567';
            const existing = custMap.get(phone);
            if (existing) {
              existing.totalOrders += 1;
              existing.totalSpent += ord.totalAmount;
              if (new Date(ord.createdAt) > new Date(existing.lastOrderDate)) {
                existing.lastOrderDate = ord.createdAt;
              }
            } else {
              custMap.set(phone, {
                id: 'cust-' + phone.replace(/\D/g, ''),
                name: ord.customerName,
                phone: ord.customerPhone,
                address: 'TP. Hồ Chí Minh',
                totalOrders: 1,
                totalSpent: ord.totalAmount,
                lastOrderDate: ord.createdAt,
                status: 'active',
              });
            }
          });

          // Extract real messages from orders that have notes
          const realMessages: Message[] = realOrders
            .filter((o) => o.note && o.note.trim().length > 0)
            .map((o) => ({
              id: 'msg-' + o.id,
              senderName: o.customerName,
              senderPhone: o.customerPhone,
              content: o.note || '',
              createdAt: o.createdAt,
              isRead: true,
              replied: o.status !== 'pending',
              itemsSummary: o.items.map((i) => `${i.qty} ${i.unit} ${i.name}`).join(', '),
            }));

          set({
            orders: realOrders,
            customers: custMap.size > 0 ? Array.from(custMap.values()) : get().customers,
            messages: realMessages.length > 0 ? realMessages : get().messages,
          });
        }
      } catch (e) {
        console.warn('Real backend sync fallback to local state:', e);
      } finally {
        set({ isLoading: false });
      }
    },

    toasts: [],
    addToast: ({ title, description, type }) => {
      const id = Math.random().toString(36).slice(2, 9);
      set((state) => ({ toasts: [...state.toasts, { id, title, description, type }] }));
      setTimeout(() => {
        get().removeToast(id);
      }, 4000);
    },
    removeToast: (id: string) => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    },

    timeRange: '30d',
    setTimeRange: (range: TimeRange) => set({ timeRange: range }),

    products: [],
    addProduct: async (newProd) => {
      const id = 'prod-' + Date.now();
      const product: Product = {
        ...newProd,
        id,
        salesCount: 0,
      };

      const nextProducts = [product, ...get().products];
      set({ products: nextProducts });

      // Save to real backend so web storefront updates!
      try {
        const rawList = nextProducts.map((p) => ({
          id: p.id,
          sku: p.sku,
          name: p.name,
          filter: p.category,
          price: p.price,
          unit: p.unit,
          moq: p.moq,
          stock: p.stock,
          status: p.status,
          image: p.image,
          sizes: p.sizes,
          colors: p.colors.map((c) => ({ name: c, hex: '#000000' })),
          presets: p.presets,
          blurb: p.blurb,
          detail: p.detail,
        }));
        await adminApi.saveProducts(rawList, get().rawUses);
      } catch (err) {
        console.error('Failed to sync product to backend:', err);
      }

      get().addToast({
        title: 'Thêm sản phẩm thành công',
        description: `Đã thêm "${product.name}" vào danh mục và đồng bộ lên web chính.`,
        type: 'success',
      });
    },

    updateProduct: async (id, updated) => {
      const nextProducts = get().products.map((p) => (p.id === id ? { ...p, ...updated } : p));
      set({ products: nextProducts });

      // Save to real backend
      try {
        const rawList = nextProducts.map((p) => ({
          id: p.id,
          sku: p.sku,
          name: p.name,
          filter: p.category,
          price: p.price,
          unit: p.unit,
          moq: p.moq,
          stock: p.stock,
          status: p.status,
          image: p.image,
          sizes: p.sizes,
          colors: p.colors.map((c) => ({ name: c, hex: '#000000' })),
          presets: p.presets,
          blurb: p.blurb,
          detail: p.detail,
        }));
        await adminApi.saveProducts(rawList, get().rawUses);
      } catch (err) {
        console.error('Failed to sync update to backend:', err);
      }

      get().addToast({
        title: 'Cập nhật thành công',
        description: 'Thông tin sản phẩm đã được lưu và cập nhật lên web chính.',
        type: 'success',
      });
    },

    deleteProduct: async (id) => {
      const prod = get().products.find((p) => p.id === id);
      const nextProducts = get().products.filter((p) => p.id !== id);
      set({ products: nextProducts });

      // Save to real backend
      try {
        const rawList = nextProducts.map((p) => ({
          id: p.id,
          sku: p.sku,
          name: p.name,
          filter: p.category,
          price: p.price,
          unit: p.unit,
          moq: p.moq,
          stock: p.stock,
          status: p.status,
          image: p.image,
          sizes: p.sizes,
          colors: p.colors.map((c) => ({ name: c, hex: '#000000' })),
          presets: p.presets,
          blurb: p.blurb,
          detail: p.detail,
        }));
        await adminApi.saveProducts(rawList, get().rawUses);
      } catch (err) {
        console.error('Failed to sync deletion to backend:', err);
      }

      get().addToast({
        title: 'Đã xóa sản phẩm',
        description: prod ? `Đã xóa "${prod.name}" khỏi web chính.` : 'Sản phẩm đã được xóa.',
        type: 'info',
      });
    },

    categories: [],
    addCategory: (newCat) => {
      const id = 'cat-' + Date.now();
      const category: Category = {
        ...newCat,
        id,
        productCount: 0,
      };
      set((state) => ({ categories: [...state.categories, category] }));
      get().addToast({
        title: 'Thêm danh mục thành công',
        description: `Danh mục "${category.name}" đã được tạo.`,
        type: 'success',
      });
    },
    updateCategory: (id, updated) => {
      set((state) => ({
        categories: state.categories.map((c) => (c.id === id ? { ...c, ...updated } : c)),
      }));
      get().addToast({
        title: 'Cập nhật danh mục thành công',
        type: 'success',
      });
    },
    deleteCategory: (id) => {
      set((state) => ({
        categories: state.categories.filter((c) => c.id !== id),
      }));
      get().addToast({
        title: 'Đã xóa danh mục',
        type: 'info',
      });
    },

    orders: [],
    updateOrderStatus: async (id, status) => {
      const targetOrder = get().orders.find((o) => o.id === id);
      set((state) => ({
        orders: state.orders.map((o) => (o.id === id ? { ...o, status } : o)),
      }));

      if (targetOrder) {
        try {
          await adminApi.updateOrderStatus(targetOrder.code, status);
        } catch (err) {
          console.error('Failed to sync order status to backend:', err);
        }
      }

      get().addToast({
        title: 'Cập nhật trạng thái đơn hàng',
        description: `Đơn hàng đã được chuyển sang trạng thái: ${status}`,
        type: 'success',
      });
    },

    deleteOrder: async (id) => {
      const targetOrder = get().orders.find((o) => o.id === id);
      set((state) => ({
        orders: state.orders.filter((o) => o.id !== id),
      }));
      if (targetOrder) {
        try {
          await adminApi.deleteOrder({
            id: targetOrder.id,
            code: targetOrder.code,
            at: targetOrder.createdAt,
          });
        } catch (err) {
          console.error('Failed to delete order from backend:', err);
        }
      }
      get().addToast({
        title: 'Đã xóa vĩnh viễn đơn hàng',
        type: 'info',
      });
    },

    customers: [],
    addCustomer: (cust) => {
      const id = 'cust-' + Date.now();
      const newCust: Customer = {
        ...cust,
        id,
        totalOrders: 0,
        totalSpent: 0,
        lastOrderDate: new Date().toISOString(),
      };
      set((state) => ({ customers: [newCust, ...state.customers] }));
      get().addToast({
        title: 'Thêm khách hàng thành công',
        description: `Đã lưu thông tin của ${newCust.name}`,
        type: 'success',
      });
    },
    updateCustomer: (id, updated) => {
      set((state) => ({
        customers: state.customers.map((c) => (c.id === id ? { ...c, ...updated } : c)),
      }));
      get().addToast({
        title: 'Cập nhật khách hàng thành công',
        type: 'success',
      });
    },
    deleteCustomer: async (id) => {
      const targetCust = get().customers.find((c) => c.id === id);
      set((state) => ({
        customers: state.customers.filter((c) => c.id !== id),
        orders: targetCust ? state.orders.filter((o) => o.customerPhone !== targetCust.phone) : state.orders,
      }));
      if (targetCust && targetCust.phone) {
        try {
          await adminApi.deleteCustomer({ phone: targetCust.phone, id });
        } catch (err) {
          console.error('Failed to delete customer from backend:', err);
        }
      }
      get().addToast({
        title: 'Đã xóa vĩnh viễn khách hàng',
        type: 'info',
      });
    },

    messages: [],
    markMessageRead: (id) => {
      set((state) => ({
        messages: state.messages.map((m) => (m.id === id ? { ...m, isRead: true } : m)),
      }));
    },
    replyMessage: (id) => {
      set((state) => ({
        messages: state.messages.map((m) => (m.id === id ? { ...m, replied: true, isRead: true } : m)),
      }));
      get().addToast({
        title: 'Đã gửi phản hồi',
        description: 'Tin nhắn đã chuyển trạng thái đã xử lý.',
        type: 'success',
      });
    },
  };
});
