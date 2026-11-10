import {
  User,
  Category,
  Product,
  CartResponse,
  Order,
  SellerOrder,
  Review,
  WishlistItem,
  AdminStats,
  SalesReportDay,
  AdminCartItem,
  AdminOrderItem,
  DatabaseHealthResponse,
  CodebaseFile
} from '../types';

export const API_BASE = '/api/v1';

class ApiService {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('nilamart_auth_token') || 'nilamart_demo_buyer';
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('nilamart_auth_token', token);
    } else {
      localStorage.removeItem('nilamart_auth_token');
    }
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {})
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const errorMsg = data?.error || `Request failed with status ${response.status} (${response.statusText})`;
        throw new Error(errorMsg);
      }

      return data as T;
    } catch (err: any) {
      console.error(`API Error on [${options.method || 'GET'} ${endpoint}]:`, err);
      throw err;
    }
  }

  // Health
  async getHealth() {
    return this.request<{ success: boolean; service: string; database: string; timestamp: string }>('/health');
  }

  // Reset demo
  async resetDemo() {
    return this.request<{ success: boolean; message: string }>('/reset-demo', { method: 'POST' });
  }

  // Auth
  async register(name: string, email: string, password: string, role: 'BUYER' | 'SELLER') {
    return this.request<{ success: boolean; user: User; token: string; message: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, role })
    });
  }

  async login(email: string, password: string) {
    return this.request<{ success: boolean; user: User; token: string; message: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  }

  async getCurrentUser() {
    return this.request<{ success: boolean; user: User }>('/users/me');
  }

  async updateProfile(name: string, email?: string, password?: string) {
    return this.request<{ success: boolean; message: string; user: User }>('/users/me', {
      method: 'PUT',
      body: JSON.stringify({ name, email, password })
    });
  }

  // Catalog
  async getCategories() {
    return this.request<{ success: boolean; categories: Category[] }>('/categories');
  }

  async getProducts(params?: {
    category_id?: number;
    search?: string;
    min_price?: number;
    max_price?: number;
    sort?: string;
    seller_id?: number;
  }) {
    const query = new URLSearchParams();
    if (params?.category_id) query.append('category_id', params.category_id.toString());
    if (params?.search) query.append('search', params.search);
    if (params?.min_price !== undefined) query.append('min_price', params.min_price.toString());
    if (params?.max_price !== undefined) query.append('max_price', params.max_price.toString());
    if (params?.sort) query.append('sort', params.sort);
    if (params?.seller_id) query.append('seller_id', params.seller_id.toString());

    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.request<{ success: boolean; count: number; products: Product[] }>(`/products${qs}`);
  }

  async getProductById(id: number) {
    return this.request<{ success: boolean; product: Product }>(`/products/${id}`);
  }

  async createProduct(productData: Partial<Product>) {
    return this.request<{ success: boolean; message: string; product: Product }>('/products', {
      method: 'POST',
      body: JSON.stringify(productData)
    });
  }

  async updateProduct(id: number, productData: Partial<Product>) {
    return this.request<{ success: boolean; message: string; product: Product }>(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData)
    });
  }

  async updateProductStock(id: number, stock_quantity: number) {
    return this.request<{ success: boolean; message: string; product: Product }>(`/products/${id}/stock`, {
      method: 'PATCH',
      body: JSON.stringify({ stock_quantity })
    });
  }

  async deleteProduct(id: number) {
    return this.request<{ success: boolean; message: string }>(`/products/${id}`, {
      method: 'DELETE'
    });
  }

  // Cart
  async getCart() {
    return this.request<CartResponse>('/cart');
  }

  async addToCart(productId: number, quantity = 1) {
    return this.request<{ success: boolean; message: string }>('/cart', {
      method: 'POST',
      body: JSON.stringify({ product_id: productId, quantity })
    });
  }

  async updateCartQuantity(productId: number, quantity: number) {
    return this.request<{ success: boolean; message: string }>(`/cart/${productId}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity })
    });
  }

  async removeCartItem(productId: number) {
    return this.request<{ success: boolean; message: string }>(`/cart/${productId}`, {
      method: 'DELETE'
    });
  }

  async clearCart() {
    return this.request<{ success: boolean; message: string }>('/cart', {
      method: 'DELETE'
    });
  }

  // Orders
  async checkout(shippingAddress: string) {
    return this.request<{
      success: boolean;
      message: string;
      order_id: number;
      total_amount: number;
      status: string;
      created_at: string;
    }>('/orders/checkout', {
      method: 'POST',
      body: JSON.stringify({ shipping_address: shippingAddress })
    });
  }

  async getBuyerOrders() {
    return this.request<{ success: boolean; orders: Order[] }>('/orders/my-orders');
  }

  async getSellerOrders() {
    return this.request<{ success: boolean; seller_orders: SellerOrder[] }>('/orders/seller');
  }

  async getOrderDetails(orderId: number) {
    return this.request<{ success: boolean; order: Order }>(`/orders/${orderId}`);
  }

  async updateOrderStatus(orderId: number, status: string) {
    return this.request<{ success: boolean; message: string; order: Order }>(`/orders/${orderId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
  }

  // Reviews
  async getProductReviews(productId: number) {
    return this.request<{ success: boolean; reviews: Review[] }>(`/reviews/product/${productId}`);
  }

  async submitReview(productId: number, rating: number, comment: string) {
    return this.request<{ success: boolean; message: string; review: Review }>('/reviews', {
      method: 'POST',
      body: JSON.stringify({ product_id: productId, rating, comment })
    });
  }

  // Wishlist
  async getWishlist() {
    return this.request<{ success: boolean; wishlist: WishlistItem[] }>('/wishlist');
  }

  async toggleWishlist(productId: number) {
    return this.request<{ success: boolean; in_wishlist: boolean; message: string }>(`/wishlist/${productId}`, {
      method: 'POST'
    });
  }

  // Health
  async getDatabaseHealth() {
    return this.request<DatabaseHealthResponse>('/health/database');
  }

  // Admin
  async getAdminStats() {
    return this.request<{ success: boolean; stats: AdminStats }>('/admin/stats');
  }

  async getAdminUsers(params?: { search?: string; role?: string; start_date?: string; end_date?: string; page?: number; limit?: number }) {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.role) query.append('role', params.role);
    if (params?.start_date) query.append('start_date', params.start_date);
    if (params?.end_date) query.append('end_date', params.end_date);
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.request<{ success: boolean; total: number; page: number; limit: number; users: User[] }>(`/admin/users${qs}`);
  }

  async getAdminCartItems(params?: { search?: string; buyer_id?: number; product_id?: number; start_date?: string; end_date?: string; page?: number; limit?: number }) {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.buyer_id) query.append('buyer_id', params.buyer_id.toString());
    if (params?.product_id) query.append('product_id', params.product_id.toString());
    if (params?.start_date) query.append('start_date', params.start_date);
    if (params?.end_date) query.append('end_date', params.end_date);
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.request<{ success: boolean; total: number; page: number; limit: number; cart_items: AdminCartItem[] }>(`/admin/cart-items${qs}`);
  }

  async getAdminOrderItems(params?: { search?: string; order_id?: number; seller_id?: number; product_id?: number; start_date?: string; end_date?: string; page?: number; limit?: number }) {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.order_id) query.append('order_id', params.order_id.toString());
    if (params?.seller_id) query.append('seller_id', params.seller_id.toString());
    if (params?.product_id) query.append('product_id', params.product_id.toString());
    if (params?.start_date) query.append('start_date', params.start_date);
    if (params?.end_date) query.append('end_date', params.end_date);
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.request<{ success: boolean; total: number; page: number; limit: number; order_items: AdminOrderItem[] }>(`/admin/order-items${qs}`);
  }

  async getAdminOrders(params?: { search?: string; start_date?: string; end_date?: string; status?: string; page?: number; limit?: number }) {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.start_date) query.append('start_date', params.start_date);
    if (params?.end_date) query.append('end_date', params.end_date);
    if (params?.status) query.append('status', params.status);
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.request<{ success: boolean; total: number; page: number; limit: number; orders: Order[] }>(`/admin/orders${qs}`);
  }

  async getAdminSalesReport(params?: { start_date?: string; end_date?: string }) {
    const query = new URLSearchParams();
    if (params?.start_date) query.append('start_date', params.start_date);
    if (params?.end_date) query.append('end_date', params.end_date);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.request<{
      success: boolean;
      report: SalesReportDay[];
      period_total_revenue: number;
      period_total_orders: number;
    }>(`/admin/reports/sales${qs}`);
  }

  async getAdminProducts(params?: { search?: string; category_id?: number; start_date?: string; end_date?: string; page?: number; limit?: number }) {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.category_id) query.append('category_id', params.category_id.toString());
    if (params?.start_date) query.append('start_date', params.start_date);
    if (params?.end_date) query.append('end_date', params.end_date);
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.request<{ success: boolean; total: number; page: number; limit: number; products: Product[] }>(`/admin/products${qs}`);
  }

  async getAdminReviews(params?: { search?: string; rating?: number; start_date?: string; end_date?: string; page?: number; limit?: number }) {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.rating) query.append('rating', params.rating.toString());
    if (params?.start_date) query.append('start_date', params.start_date);
    if (params?.end_date) query.append('end_date', params.end_date);
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.request<{ success: boolean; total: number; page: number; limit: number; reviews: any[] }>(`/admin/reviews${qs}`);
  }

  async deleteAdminReview(id: number) {
    return this.request<{ success: boolean; message: string }>(`/admin/reviews/${id}`, {
      method: 'DELETE'
    });
  }

  async getDbInspect() {
    return this.request<{
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
    }>('/db/inspect');
  }

  // AI Chat
  async sendAiMessage(message: string) {
    return this.request<{ success: boolean; reply: string; error?: string }>('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message })
    });
  }

  // Codebase files
  async getCodebaseFiles() {
    return this.request<{ success: boolean; files: CodebaseFile[] }>('/codebase/files');
  }
}

export const api = new ApiService();
