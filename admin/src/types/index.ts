export type ProductStatus = 'active' | 'draft' | 'archived';

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  price: number; // Giá tham khảo sỉ
  unit: string;  // kg, cái, thùng
  moq: string;   // Từ 10 kg / size, Từ 50 cái...
  stock: number; // Tồn kho ước lượng
  status: ProductStatus;
  image: string;
  sizes: string[];
  colors: string[];
  presets: number[];
  blurb: string;
  detail?: string;
  salesCount: number;
}

export type CategoryStatus = 'active' | 'inactive';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  productCount: number;
  status: CategoryStatus;
}

export type OrderStatus = 'pending' | 'confirmed' | 'shipping' | 'completed' | 'cancelled';

export interface OrderItem {
  id: string;
  productId: string;
  name: string;
  size: string;
  color: string;
  qty: number;
  unit: string;
  price: number;
  total: number;
}

export interface Order {
  id: string;
  code: string;
  customerName: string;
  customerPhone: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  createdAt: string;
  note?: string;
  hasLogo?: boolean;
  deliveredTelegram?: boolean;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: string;
  status: 'active' | 'vip' | 'inactive';
}

export interface Message {
  id: string;
  senderName: string;
  senderPhone: string;
  content: string;
  createdAt: string;
  isRead: boolean;
  replied?: boolean;
  itemsSummary?: string;
}

export type TimeRange = '7d' | '30d' | '3m' | '12m';

export interface ChartDataPoint {
  date: string;
  revenue: number;
  orders: number;
}

export interface CategorySalesData {
  name: string;
  value: number;
  color: string;
}
