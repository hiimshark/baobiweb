import axios from 'axios';
import { OrderStatus } from '../types';

export const ADMIN_PIN_KEY = 'admin_pin';

export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const pin = localStorage.getItem(ADMIN_PIN_KEY) || 'sibaobi2026';
  config.headers['x-admin-pin'] = pin;
  return config;
});

export const adminApi = {
  login: async (pin: string, turnstileToken?: string) => {
    const res = await api.post('/admin/login', { pin, turnstileToken });
    if (res.data.ok) {
      localStorage.setItem(ADMIN_PIN_KEY, pin);
    }
    return res.data;
  },

  getStatus: async () => {
    const res = await api.get('/admin/status');
    return res.data;
  },

  getProducts: async () => {
    const res = await api.get('/admin/products');
    return res.data;
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  saveProducts: async (products: any[], uses?: any[]) => {
    const res = await api.post('/admin/products', { products, uses });
    return res.data;
  },

  getOrders: async () => {
    const res = await api.get('/admin/orders');
    return res.data;
  },

  updateOrderStatus: async (code: string, status: OrderStatus) => {
    const res = await api.post('/admin/orders/status', { code, status });
    return res.data;
  },

  deleteOrder: async (payload: { id?: string; code?: string; at?: string }) => {
    const res = await api.post('/admin/orders/delete', payload);
    return res.data;
  },

  deleteCustomer: async (payload: { phone: string; id?: string }) => {
    const res = await api.post('/admin/orders/delete', payload);
    return res.data;
  },

  clearAllOrders: async () => {
    const res = await api.post('/admin/orders/delete', { clearAll: true });
    return res.data;
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  saveSettings: async (payload: {
    token?: string;
    chatId?: string;
    brand?: any;
    newPin?: string;
  }) => {
    const res = await api.post('/admin/save', payload);
    return res.data;
  },

  testTelegram: async () => {
    const res = await api.post('/admin/test');
    return res.data;
  },
};
