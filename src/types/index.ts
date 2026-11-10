export type UserRole = 'BUYER' | 'SELLER' | 'ADMIN';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: number;
  name: string;
  description: string;
  created_at: string;
}

export interface Product {
  id: number;
  seller_id: number;
  category_id: number;
  name: string;
  description: string;
  price: number;
  stock_quantity: number;
  image_url: string;
  category_name?: string;
  seller_name?: string;
  avg_rating?: number;
  review_count?: number;
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  id: number;
  product_id: number;
  quantity: number;
  name: string;
  price: number;
  image_url: string;
  stock_quantity: number;
  subtotal: number;
  created_at: string;
  updated_at: string;
}

export interface CartResponse {
  success: boolean;
  cart_items: CartItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total_amount: number;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  seller_id: number;
  product_name: string;
  unit_price: number;
  quantity: number;
  subtotal: number;
  image_url?: string;
  created_at: string;
}

export interface OrderStatusHistoryItem {
  id: number;
  order_id: number;
  old_status: string | null;
  new_status: string;
  changed_by: number;
  changed_by_name?: string;
  changed_by_role?: string;
  changed_at: string;
}

export interface Order {
  id: number;
  buyer_id: number;
  buyer_name?: string;
  buyer_email?: string;
  total_amount: number;
  status: 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  shipping_address: string;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
  history?: OrderStatusHistoryItem[];
  item_count?: number;
}

export interface SellerOrder {
  order_item_id: number;
  order_id: number;
  product_name: string;
  unit_price: number;
  quantity: number;
  subtotal: number;
  status: string;
  order_date: string;
  buyer_name: string;
  buyer_email: string;
}

export interface Review {
  id: number;
  buyer_id: number;
  buyer_name?: string;
  product_id: number;
  rating: number;
  comment: string;
  created_at: string;
  updated_at: string;
}

export interface WishlistItem {
  id: number;
  product_id: number;
  name: string;
  price: number;
  image_url: string;
  stock_quantity: number;
  created_at: string;
}

export interface AdminStats {
  total_users: number;
  total_buyers: number;
  total_sellers: number;
  total_products: number;
  total_orders: number;
  total_sales: number;
  avg_order_value: number;
}

export interface SalesReportDay {
  date: string;
  orders: number;
  revenue: number;
  items_sold: number;
}

export interface AdminReview {
  id: number;
  buyer_id: number;
  buyer_name: string;
  buyer_email: string;
  product_id: number;
  product_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface AdminCartItem {
  id: number;
  buyer_id: number;
  buyer_name?: string;
  buyer_email?: string;
  product_id: number;
  product_name?: string;
  quantity: number;
  created_at: string;
}

export interface AdminOrderItem {
  id: number;
  order_id: number;
  product_id: number;
  seller_id: number;
  seller_name?: string;
  product_name: string;
  unit_price: number;
  quantity: number;
  subtotal: number;
  created_at: string;
}

export interface DatabaseHealthResponse {
  success: boolean;
  status: string;
  connected: boolean;
  database: string;
  engine: string;
  host: string;
  connection_pool: {
    max_clients: number;
    active_connections: number;
    idle_connections: number;
  };
  tables: string[];
  table_counts: Record<string, number>;
  ping_latency_ms: number;
  timestamp: string;
}

export interface DatabaseInspection {
  success: boolean;
  tables: {
    users: any[];
    categories: any[];
    products: any[];
    cart_items: any[];
    orders: any[];
    order_items: any[];
    reviews: any[];
    wishlist_items: any[];
    order_status_history: any[];
  };
  counts: Record<string, number>;
  storage_type: string;
  last_saved: string;
}

export interface CodebaseFile {
  path: string;
  name: string;
  size: number;
  content: string;
}
