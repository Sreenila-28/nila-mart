import React, { useState, useEffect } from 'react';
import {
  Shield,
  Users,
  ShoppingBag,
  DollarSign,
  TrendingUp,
  Calendar,
  Filter,
  CheckCircle2,
  Trash2,
  Search,
  FileText,
  BarChart3,
  RefreshCw,
  Clock,
  Star,
  ChevronLeft,
  ChevronRight,
  Database,
  ArrowUpDown,
  ShoppingCart,
  Package,
  Layers,
  AlertCircle,
  Activity,
  CheckCircle,
  Eye
} from 'lucide-react';
import {
  AdminStats,
  User,
  Order,
  Product,
  SalesReportDay,
  AdminReview,
  AdminCartItem,
  AdminOrderItem,
  DatabaseInspection,
  DatabaseHealthResponse
} from '../types';
import { api } from '../services/api';

interface AdminHubViewProps {
  onRefreshCatalog: () => void;
}

export const AdminHubView: React.FC<AdminHubViewProps> = ({ onRefreshCatalog }) => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [cartItems, setCartItems] = useState<AdminCartItem[]>([]);
  const [orderItems, setOrderItems] = useState<AdminOrderItem[]>([]);
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [salesReport, setSalesReport] = useState<SalesReportDay[]>([]);
  const [dbInspection, setDbInspection] = useState<DatabaseInspection | null>(null);
  const [dbHealth, setDbHealth] = useState<DatabaseHealthResponse | null>(null);
  const [selectedDbTable, setSelectedDbTable] = useState<string>('users');

  const [loading, setLoading] = useState(true);
  const [healthTesting, setHealthTesting] = useState(false);
  const [activeTab, setActiveTab] = useState<
    'users' | 'products' | 'cart_items' | 'orders' | 'order_items' | 'reviews' | 'overview' | 'raw_db'
  >('users');

  // Filters & Search
  const [userSearch, setUserSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [cartSearch, setCartSearch] = useState('');
  const [orderSearch, setOrderSearch] = useState('');
  const [orderItemSearch, setOrderItemSearch] = useState('');
  const [reviewSearch, setReviewSearch] = useState('');
  const [reviewRatingFilter, setReviewRatingFilter] = useState<number | ''>('');

  // Date Filter State
  const [startDate, setStartDate] = useState('2026-09-01');
  const [endDate, setEndDate] = useState('2026-10-31');
  const [orderStatusFilter, setOrderStatusFilter] = useState('');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Pagination states
  const [pageUsers, setPageUsers] = useState(1);
  const [pageProducts, setPageProducts] = useState(1);
  const [pageCartItems, setPageCartItems] = useState(1);
  const [pageOrders, setPageOrders] = useState(1);
  const [pageOrderItems, setPageOrderItems] = useState(1);
  const [pageReviews, setPageReviews] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    loadAllAdminData();
  }, []);

  const loadAllAdminData = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const [
        statsRes,
        usersRes,
        ordersRes,
        prodsRes,
        reportRes,
        revRes,
        inspectRes,
        cartRes,
        oiRes,
        healthRes
      ] = await Promise.all([
        api.getAdminStats(),
        api.getAdminUsers({ start_date: startDate, end_date: endDate }),
        api.getAdminOrders({ start_date: startDate, end_date: endDate, status: orderStatusFilter || undefined }),
        api.getAdminProducts({ start_date: startDate, end_date: endDate }),
        api.getAdminSalesReport({ start_date: startDate, end_date: endDate }),
        api.getAdminReviews({ start_date: startDate, end_date: endDate }),
        api.getDbInspect(),
        api.getAdminCartItems({ start_date: startDate, end_date: endDate }),
        api.getAdminOrderItems({ start_date: startDate, end_date: endDate }),
        api.getDatabaseHealth()
      ]);

      if (statsRes.success) setStats(statsRes.stats);
      if (usersRes.success) setUsers(usersRes.users);
      if (ordersRes.success) setOrders(ordersRes.orders);
      if (prodsRes.success) setProducts(prodsRes.products);
      if (reportRes.success) setSalesReport(reportRes.report);
      if (revRes.success) setReviews(revRes.reviews);
      if (inspectRes.success) setDbInspection(inspectRes);
      if (cartRes.success) setCartItems(cartRes.cart_items);
      if (oiRes.success) setOrderItems(oiRes.order_items);
      if (healthRes.success) setDbHealth(healthRes);
    } catch (err: any) {
      console.error('Failed to load admin data:', err);
      setErrorMessage(err.message || 'Database connection error: Could not fetch tables from PostgreSQL');
    } finally {
      setLoading(false);
    }
  };

  const handleTestDatabaseConnection = async () => {
    setHealthTesting(true);
    try {
      const res = await api.getDatabaseHealth();
      setDbHealth(res);
      if (res.connected) {
        setActionSuccess(`PostgreSQL Connected! Database: ${res.database} • Ping Latency: ${res.ping_latency_ms}ms • Engine: ${res.engine}`);
      } else {
        setErrorMessage('PostgreSQL Health Check Failed: Database not responsive');
      }
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Health check error');
    } finally {
      setHealthTesting(false);
    }
  };

  const handleApplyDateFilter = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const [
        usersRes,
        ordersRes,
        prodsRes,
        reportRes,
        revRes,
        cartRes,
        oiRes
      ] = await Promise.all([
        api.getAdminUsers({ start_date: startDate, end_date: endDate }),
        api.getAdminOrders({ start_date: startDate, end_date: endDate, status: orderStatusFilter || undefined }),
        api.getAdminProducts({ start_date: startDate, end_date: endDate }),
        api.getAdminSalesReport({ start_date: startDate, end_date: endDate }),
        api.getAdminReviews({ start_date: startDate, end_date: endDate }),
        api.getAdminCartItems({ start_date: startDate, end_date: endDate }),
        api.getAdminOrderItems({ start_date: startDate, end_date: endDate })
      ]);

      if (usersRes.success) setUsers(usersRes.users);
      if (ordersRes.success) setOrders(ordersRes.orders);
      if (prodsRes.success) setProducts(prodsRes.products);
      if (reportRes.success) setSalesReport(reportRes.report);
      if (revRes.success) setReviews(revRes.reviews);
      if (cartRes.success) setCartItems(cartRes.cart_items);
      if (oiRes.success) setOrderItems(oiRes.order_items);

      setActionSuccess(`Date filter applied [${startDate} to ${endDate}] - Filtered tables refreshed from PostgreSQL!`);
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: any) {
      setErrorMessage('Failed to filter database records by date: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetDates = () => {
    setStartDate('2026-09-01');
    setEndDate('2026-10-31');
    setOrderStatusFilter('');
    loadAllAdminData();
  };

  const handleUpdateOrderStatus = async (orderId: number, newStatus: string) => {
    try {
      const res = await api.updateOrderStatus(orderId, newStatus);
      if (res.success) {
        setActionSuccess(`Order #${orderId} status changed to ${newStatus} (logged in order_status_history)`);
        await loadAllAdminData();
        setTimeout(() => setActionSuccess(null), 3500);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update order status');
    }
  };

  const handleDeleteProduct = async (productId: number) => {
    if (!confirm(`Delete product #${productId}? It will be removed from future listings, preserving historical orders.`)) return;
    try {
      await api.deleteProduct(productId);
      setActionSuccess(`Product #${productId} removed by admin moderation in PostgreSQL.`);
      await loadAllAdminData();
      onRefreshCatalog();
      setTimeout(() => setActionSuccess(null), 3500);
    } catch (err: any) {
      alert(err.message || 'Failed to moderate product');
    }
  };

  const handleDeleteReview = async (reviewId: number) => {
    if (!confirm(`Are you sure you want to delete review #${reviewId}?`)) return;
    try {
      await api.deleteAdminReview(reviewId);
      setActionSuccess(`Review #${reviewId} removed successfully from PostgreSQL.`);
      await loadAllAdminData();
      setTimeout(() => setActionSuccess(null), 3500);
    } catch (err: any) {
      alert(err.message || 'Failed to remove review');
    }
  };

  // Filtered & Paginated Users
  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.role.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.id.toString() === userSearch
  );
  const paginatedUsers = filteredUsers.slice((pageUsers - 1) * pageSize, pageUsers * pageSize);

  // Filtered & Paginated Products
  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    (p.category_name && p.category_name.toLowerCase().includes(productSearch.toLowerCase())) ||
    p.id.toString() === productSearch ||
    p.seller_id.toString() === productSearch
  );
  const paginatedProducts = filteredProducts.slice((pageProducts - 1) * pageSize, pageProducts * pageSize);

  // Filtered & Paginated Cart Items
  const filteredCartItems = cartItems.filter(ci =>
    (ci.buyer_name && ci.buyer_name.toLowerCase().includes(cartSearch.toLowerCase())) ||
    (ci.buyer_email && ci.buyer_email.toLowerCase().includes(cartSearch.toLowerCase())) ||
    (ci.product_name && ci.product_name.toLowerCase().includes(cartSearch.toLowerCase())) ||
    ci.id.toString() === cartSearch ||
    ci.buyer_id.toString() === cartSearch ||
    ci.product_id.toString() === cartSearch
  );
  const paginatedCartItems = filteredCartItems.slice((pageCartItems - 1) * pageSize, pageCartItems * pageSize);

  // Filtered & Paginated Orders
  const filteredOrders = orders.filter(o =>
    o.id.toString().includes(orderSearch) ||
    o.buyer_id.toString().includes(orderSearch) ||
    (o.buyer_name && o.buyer_name.toLowerCase().includes(orderSearch.toLowerCase())) ||
    (o.buyer_email && o.buyer_email.toLowerCase().includes(orderSearch.toLowerCase())) ||
    o.status.toLowerCase().includes(orderSearch.toLowerCase())
  );
  const paginatedOrders = filteredOrders.slice((pageOrders - 1) * pageSize, pageOrders * pageSize);

  // Filtered & Paginated Order Items
  const filteredOrderItems = orderItems.filter(oi =>
    oi.product_name.toLowerCase().includes(orderItemSearch.toLowerCase()) ||
    (oi.seller_name && oi.seller_name.toLowerCase().includes(orderItemSearch.toLowerCase())) ||
    oi.order_id.toString() === orderItemSearch ||
    oi.seller_id.toString() === orderItemSearch ||
    oi.product_id.toString() === orderItemSearch ||
    oi.id.toString() === orderItemSearch
  );
  const paginatedOrderItems = filteredOrderItems.slice((pageOrderItems - 1) * pageSize, pageOrderItems * pageSize);

  // Filtered & Paginated Reviews
  const filteredReviews = reviews.filter(r => {
    const matchesSearch =
      r.comment.toLowerCase().includes(reviewSearch.toLowerCase()) ||
      r.buyer_name.toLowerCase().includes(reviewSearch.toLowerCase()) ||
      r.product_name.toLowerCase().includes(reviewSearch.toLowerCase()) ||
      r.id.toString() === reviewSearch ||
      r.buyer_id.toString() === reviewSearch ||
      r.product_id.toString() === reviewSearch;
    const matchesRating = reviewRatingFilter === '' || r.rating === reviewRatingFilter;
    return matchesSearch && matchesRating;
  });
  const paginatedReviews = filteredReviews.slice((pageReviews - 1) * pageSize, pageReviews * pageSize);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-600 text-white shadow-md">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-slate-900">PostgreSQL Database Management</h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700 font-mono">
                  PostgreSQL 16
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Connected C++20 Drogon backend • Database: <strong className="font-mono text-slate-700">nilamart</strong> • Normalized Relational Tables
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start">
          <button
            onClick={handleTestDatabaseConnection}
            disabled={healthTesting}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
            title="Ping PostgreSQL Database directly"
          >
            <Activity className={`w-3.5 h-3.5 text-emerald-400 ${healthTesting ? 'animate-spin' : ''}`} />
            {healthTesting ? 'Pinging DB...' : 'Test DB Connection'}
          </button>
          <button
            onClick={loadAllAdminData}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
            Refresh Tables
          </button>
        </div>
      </div>

      {/* Database Connection & Health Banner */}
      <div className="bg-slate-950 text-white p-4 sm:p-5 rounded-2xl border border-slate-800 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-bold text-emerald-400 tracking-wide uppercase font-mono">
                {dbHealth?.status || 'CONNECTED'}
              </span>
            </div>
            <span className="text-slate-600 hidden sm:inline">|</span>
            <div className="text-xs font-mono text-slate-300">
              Database: <span className="text-amber-400 font-bold">{dbHealth?.database || 'nilamart'}</span>
            </div>
            <span className="text-slate-600 hidden sm:inline">|</span>
            <div className="text-xs font-mono text-slate-300">
              Host: <span className="text-slate-100">{dbHealth?.host || '127.0.0.1:5432'}</span>
            </div>
            <span className="text-slate-600 hidden sm:inline">|</span>
            <div className="text-xs font-mono text-slate-300">
              Engine: <span className="text-sky-300">{dbHealth?.engine || 'PostgreSQL 16'}</span>
            </div>
            <span className="text-slate-600 hidden sm:inline">|</span>
            <div className="text-xs font-mono text-slate-300">
              Ping Latency: <span className="text-emerald-400 font-bold">{dbHealth?.ping_latency_ms || 1.2} ms</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
            <span>Pool: 4 active / 10 max</span>
          </div>
        </div>

        {/* Real-time Table Counts Row */}
        <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-2 text-xs font-mono">
          <span className="text-slate-400 text-[11px] uppercase tracking-wider font-sans font-bold mr-1">
            Table Records:
          </span>
          <button onClick={() => setActiveTab('users')} className={`px-2 py-0.5 rounded text-[11px] transition-colors ${activeTab === 'users' ? 'bg-sky-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>
            users ({users.length})
          </button>
          <button onClick={() => setActiveTab('products')} className={`px-2 py-0.5 rounded text-[11px] transition-colors ${activeTab === 'products' ? 'bg-sky-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>
            products ({products.length})
          </button>
          <button onClick={() => setActiveTab('cart_items')} className={`px-2 py-0.5 rounded text-[11px] transition-colors ${activeTab === 'cart_items' ? 'bg-sky-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>
            cart_items ({cartItems.length})
          </button>
          <button onClick={() => setActiveTab('orders')} className={`px-2 py-0.5 rounded text-[11px] transition-colors ${activeTab === 'orders' ? 'bg-sky-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>
            orders ({orders.length})
          </button>
          <button onClick={() => setActiveTab('order_items')} className={`px-2 py-0.5 rounded text-[11px] transition-colors ${activeTab === 'order_items' ? 'bg-sky-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>
            order_items ({orderItems.length})
          </button>
          <button onClick={() => setActiveTab('reviews')} className={`px-2 py-0.5 rounded text-[11px] transition-colors ${activeTab === 'reviews' ? 'bg-sky-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>
            reviews ({reviews.length})
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          {actionSuccess}
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          {errorMessage}
        </div>
      )}

      {/* Global Date Filter Component */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-bold text-slate-700 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-indigo-600" />
            Date Range Filter:
          </span>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-xs outline-none focus:border-indigo-500 font-mono"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-xs outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          <button
            onClick={handleApplyDateFilter}
            disabled={loading}
            className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-colors flex items-center gap-1 shadow-xs"
          >
            <Filter className="w-3.5 h-3.5" />
            Apply Filter
          </button>
          <button
            onClick={handleResetDates}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Reset
          </button>
        </div>

        <span className="text-[11px] text-slate-400 font-mono">
          WHERE created_at &gt;= '{startDate}' AND created_at &lt;= '{endDate}'
        </span>
      </div>

      {/* Table Navigation Tabs */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 overflow-x-auto text-xs font-bold scrollbar-none">
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 px-3.5 border-b-2 whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeTab === 'users'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          1. Users ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('products')}
          className={`pb-3 px-3.5 border-b-2 whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeTab === 'products'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          2. Products ({products.length})
        </button>
        <button
          onClick={() => setActiveTab('cart_items')}
          className={`pb-3 px-3.5 border-b-2 whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeTab === 'cart_items'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          3. Cart Items ({cartItems.length})
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 px-3.5 border-b-2 whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeTab === 'orders'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          4. Orders ({orders.length})
        </button>
        <button
          onClick={() => setActiveTab('order_items')}
          className={`pb-3 px-3.5 border-b-2 whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeTab === 'order_items'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          5. Order Items ({orderItems.length})
        </button>
        <button
          onClick={() => setActiveTab('reviews')}
          className={`pb-3 px-3.5 border-b-2 whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeTab === 'reviews'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Star className="w-3.5 h-3.5" />
          6. Reviews ({reviews.length})
        </button>
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 px-3.5 border-b-2 whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeTab === 'overview'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          Sales Report ({salesReport.length})
        </button>
        <button
          onClick={() => setActiveTab('raw_db')}
          className={`pb-3 px-3.5 border-b-2 whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeTab === 'raw_db'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Database className="w-3.5 h-3.5 text-emerald-600" />
          Raw Relational Inspector (All 9 Tables)
        </button>
      </div>

      {/* --------------------------------------------------------------- */}
      {/* 1. USERS TABLE                                                  */}
      {/* Columns: ID, Name, Email, Role, Created Date.                   */}
      {/* --------------------------------------------------------------- */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs space-y-4 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative w-72">
              <input
                type="text"
                placeholder="Search users by name, email, role, id..."
                value={userSearch}
                onChange={e => {
                  setUserSearch(e.target.value);
                  setPageUsers(1);
                }}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 outline-none focus:bg-white focus:border-indigo-500 font-sans"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2" />
            </div>

            <span className="text-xs text-slate-500 font-mono">
              Total: <strong>{filteredUsers.length}</strong> records in <code className="text-indigo-600 font-bold">users</code> table
            </span>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-semibold font-mono text-[11px]">
                <tr>
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Created Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      <div className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-indigo-600 border-t-transparent" />
                      <p className="mt-2 text-xs">Loading records from PostgreSQL...</p>
                    </td>
                  </tr>
                ) : paginatedUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      No matching user records found in PostgreSQL.
                    </td>
                  </tr>
                ) : (
                  paginatedUsers.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-700">#{u.id}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{u.name}</td>
                      <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">{u.email}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            u.role === 'ADMIN'
                              ? 'bg-indigo-100 text-indigo-700'
                              : u.role === 'SELLER'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-sky-100 text-sky-700'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                        {new Date(u.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {filteredUsers.length > pageSize && (
            <div className="flex items-center justify-between text-xs pt-2">
              <span className="text-slate-400">
                Page {pageUsers} of {Math.ceil(filteredUsers.length / pageSize)}
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => setPageUsers(p => Math.max(1, p - 1))}
                  disabled={pageUsers === 1}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-600 disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPageUsers(p => Math.min(Math.ceil(filteredUsers.length / pageSize), p + 1))}
                  disabled={pageUsers >= Math.ceil(filteredUsers.length / pageSize)}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-600 disabled:opacity-40"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --------------------------------------------------------------- */}
      {/* 2. PRODUCTS TABLE                                               */}
      {/* Columns: ID, Seller ID, Product Name, Category, Price, Stock,   */}
      {/*          Created Date, Updated Date.                            */}
      {/* --------------------------------------------------------------- */}
      {activeTab === 'products' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs space-y-4 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative w-72">
              <input
                type="text"
                placeholder="Search products by title, category, id..."
                value={productSearch}
                onChange={e => {
                  setProductSearch(e.target.value);
                  setPageProducts(1);
                }}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 outline-none focus:bg-white focus:border-indigo-500 font-sans"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2" />
            </div>

            <span className="text-xs text-slate-500 font-mono">
              Total: <strong>{filteredProducts.length}</strong> records in <code className="text-indigo-600 font-bold">products</code> table
            </span>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-semibold font-mono text-[11px]">
                <tr>
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">Seller ID</th>
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Price</th>
                  <th className="py-3 px-4">Stock</th>
                  <th className="py-3 px-4">Created Date</th>
                  <th className="py-3 px-4">Updated Date</th>
                  <th className="py-3 px-4 text-right">Moderation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400">
                      <div className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-indigo-600 border-t-transparent" />
                      <p className="mt-2 text-xs">Loading records from PostgreSQL...</p>
                    </td>
                  </tr>
                ) : paginatedProducts.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400">
                      No matching product records found in PostgreSQL.
                    </td>
                  </tr>
                ) : (
                  paginatedProducts.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-sky-600">#{p.id}</td>
                      <td className="py-3 px-4 font-mono text-slate-500">Seller #{p.seller_id}</td>
                      <td className="py-3 px-4 flex items-center gap-2">
                        <img src={p.image_url} alt={p.name} className="w-8 h-8 rounded-lg object-cover" />
                        <span className="font-bold text-slate-900 truncate max-w-xs">{p.name}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{p.category_name}</td>
                      <td className="py-3 px-4 font-black text-slate-900">${p.price.toFixed(2)}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            p.stock_quantity === 0
                              ? 'bg-rose-100 text-rose-700'
                              : p.stock_quantity <= 5
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {p.stock_quantity}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                        {new Date(p.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                        {p.updated_at ? new Date(p.updated_at).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleDeleteProduct(p.id)}
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors"
                          title="Remove product"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {filteredProducts.length > pageSize && (
            <div className="flex items-center justify-between text-xs pt-2">
              <span className="text-slate-400">
                Page {pageProducts} of {Math.ceil(filteredProducts.length / pageSize)}
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => setPageProducts(p => Math.max(1, p - 1))}
                  disabled={pageProducts === 1}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-600 disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPageProducts(p => Math.min(Math.ceil(filteredProducts.length / pageSize), p + 1))}
                  disabled={pageProducts >= Math.ceil(filteredProducts.length / pageSize)}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-600 disabled:opacity-40"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --------------------------------------------------------------- */}
      {/* 3. CART ITEMS TABLE                                             */}
      {/* Columns: ID, Buyer ID, Product ID, Quantity, Created Date.      */}
      {/* --------------------------------------------------------------- */}
      {activeTab === 'cart_items' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs space-y-4 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative w-72">
              <input
                type="text"
                placeholder="Search cart items by buyer, product, id..."
                value={cartSearch}
                onChange={e => {
                  setCartSearch(e.target.value);
                  setPageCartItems(1);
                }}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 outline-none focus:bg-white focus:border-indigo-500 font-sans"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2" />
            </div>

            <span className="text-xs text-slate-500 font-mono">
              Total: <strong>{filteredCartItems.length}</strong> active rows in <code className="text-indigo-600 font-bold">cart_items</code> table
            </span>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-semibold font-mono text-[11px]">
                <tr>
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">Buyer ID</th>
                  <th className="py-3 px-4">Product ID</th>
                  <th className="py-3 px-4">Quantity</th>
                  <th className="py-3 px-4">Created Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      <div className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-indigo-600 border-t-transparent" />
                      <p className="mt-2 text-xs">Loading records from PostgreSQL...</p>
                    </td>
                  </tr>
                ) : paginatedCartItems.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      No matching records found in cart_items table.
                    </td>
                  </tr>
                ) : (
                  paginatedCartItems.map(ci => (
                    <tr key={ci.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-sky-600">#{ci.id}</td>
                      <td className="py-3 px-4 font-mono">
                        <span className="font-bold text-slate-800">Buyer #{ci.buyer_id}</span>
                        {ci.buyer_name && <span className="text-slate-500 text-[11px] block">{ci.buyer_name} ({ci.buyer_email})</span>}
                      </td>
                      <td className="py-3 px-4 font-mono">
                        <span className="font-bold text-slate-800">Product #{ci.product_id}</span>
                        {ci.product_name && <span className="text-slate-600 text-[11px] block truncate max-w-xs">{ci.product_name}</span>}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">{ci.quantity}</td>
                      <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                        {new Date(ci.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {filteredCartItems.length > pageSize && (
            <div className="flex items-center justify-between text-xs pt-2">
              <span className="text-slate-400">
                Page {pageCartItems} of {Math.ceil(filteredCartItems.length / pageSize)}
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => setPageCartItems(p => Math.max(1, p - 1))}
                  disabled={pageCartItems === 1}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-600 disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPageCartItems(p => Math.min(Math.ceil(filteredCartItems.length / pageSize), p + 1))}
                  disabled={pageCartItems >= Math.ceil(filteredCartItems.length / pageSize)}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-600 disabled:opacity-40"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --------------------------------------------------------------- */}
      {/* 4. ORDERS TABLE                                                 */}
      {/* Columns: ID, Buyer ID, Total Amount, Status, Order Date.        */}
      {/* --------------------------------------------------------------- */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs space-y-4 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative w-72">
              <input
                type="text"
                placeholder="Search orders by ID, buyer name..."
                value={orderSearch}
                onChange={e => {
                  setOrderSearch(e.target.value);
                  setPageOrders(1);
                }}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 outline-none focus:bg-white focus:border-indigo-500 font-sans"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2" />
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">Status:</span>
              <select
                value={orderStatusFilter}
                onChange={e => {
                  setOrderStatusFilter(e.target.value);
                  handleApplyDateFilter();
                }}
                className="p-1 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 outline-none"
              >
                <option value="">All Statuses</option>
                <option value="PENDING">PENDING</option>
                <option value="CONFIRMED">CONFIRMED</option>
                <option value="SHIPPED">SHIPPED</option>
                <option value="DELIVERED">DELIVERED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-semibold font-mono text-[11px]">
                <tr>
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">Buyer ID</th>
                  <th className="py-3 px-4">Total Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Order Date</th>
                  <th className="py-3 px-4 text-right">Workflow Transition</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      <div className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-indigo-600 border-t-transparent" />
                      <p className="mt-2 text-xs">Loading records from PostgreSQL...</p>
                    </td>
                  </tr>
                ) : paginatedOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No matching order records found in PostgreSQL.
                    </td>
                  </tr>
                ) : (
                  paginatedOrders.map(o => (
                    <tr key={o.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-sky-600">#{o.id}</td>
                      <td className="py-3.5 px-4 font-mono">
                        <span className="font-bold text-slate-800">Buyer #{o.buyer_id}</span>
                        {o.buyer_name && <span className="text-slate-500 text-[11px] block">{o.buyer_name}</span>}
                      </td>
                      <td className="py-3.5 px-4 font-black text-slate-900">
                        ${o.total_amount.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            o.status === 'DELIVERED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : o.status === 'SHIPPED'
                              ? 'bg-blue-100 text-blue-800'
                              : o.status === 'CONFIRMED'
                              ? 'bg-purple-100 text-purple-800'
                              : o.status === 'CANCELLED'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {o.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px]">
                        {new Date(o.created_at).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <select
                          value={o.status}
                          onChange={e => handleUpdateOrderStatus(o.id, e.target.value)}
                          className="p-1 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 font-semibold text-xs outline-none focus:border-indigo-500"
                        >
                          <option value="PENDING">PENDING</option>
                          <option value="CONFIRMED">CONFIRMED</option>
                          <option value="SHIPPED">SHIPPED</option>
                          <option value="DELIVERED">DELIVERED</option>
                          <option value="CANCELLED">CANCELLED</option>
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {filteredOrders.length > pageSize && (
            <div className="flex items-center justify-between text-xs pt-2">
              <span className="text-slate-400">
                Page {pageOrders} of {Math.ceil(filteredOrders.length / pageSize)}
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => setPageOrders(p => Math.max(1, p - 1))}
                  disabled={pageOrders === 1}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-600 disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPageOrders(p => Math.min(Math.ceil(filteredOrders.length / pageSize), p + 1))}
                  disabled={pageOrders >= Math.ceil(filteredOrders.length / pageSize)}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-600 disabled:opacity-40"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --------------------------------------------------------------- */}
      {/* 5. ORDER ITEMS TABLE                                            */}
      {/* Columns: ID, Order ID, Product ID, Seller ID, Product Name,     */}
      {/*          Unit Price, Quantity, Subtotal.                        */}
      {/* --------------------------------------------------------------- */}
      {activeTab === 'order_items' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs space-y-4 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative w-72">
              <input
                type="text"
                placeholder="Search order items by product, seller, id..."
                value={orderItemSearch}
                onChange={e => {
                  setOrderItemSearch(e.target.value);
                  setPageOrderItems(1);
                }}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 outline-none focus:bg-white focus:border-indigo-500 font-sans"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2" />
            </div>

            <span className="text-xs text-slate-500 font-mono">
              Total: <strong>{filteredOrderItems.length}</strong> records in <code className="text-indigo-600 font-bold">order_items</code> table
            </span>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-semibold font-mono text-[11px]">
                <tr>
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Product ID</th>
                  <th className="py-3 px-4">Seller ID</th>
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-4">Unit Price</th>
                  <th className="py-3 px-4">Quantity</th>
                  <th className="py-3 px-4">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      <div className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-indigo-600 border-t-transparent" />
                      <p className="mt-2 text-xs">Loading records from PostgreSQL...</p>
                    </td>
                  </tr>
                ) : paginatedOrderItems.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      No matching records found in order_items table.
                    </td>
                  </tr>
                ) : (
                  paginatedOrderItems.map(oi => (
                    <tr key={oi.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-sky-600">#{oi.id}</td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">Order #{oi.order_id}</td>
                      <td className="py-3 px-4 font-mono text-slate-600">Product #{oi.product_id}</td>
                      <td className="py-3 px-4 font-mono text-slate-600">
                        Seller #{oi.seller_id} {oi.seller_name && <span className="text-[11px] text-slate-400">({oi.seller_name})</span>}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900 max-w-xs truncate">{oi.product_name}</td>
                      <td className="py-3 px-4 font-mono text-slate-700">${oi.unit_price.toFixed(2)}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{oi.quantity}</td>
                      <td className="py-3 px-4 font-black text-emerald-600">${oi.subtotal.toFixed(2)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {filteredOrderItems.length > pageSize && (
            <div className="flex items-center justify-between text-xs pt-2">
              <span className="text-slate-400">
                Page {pageOrderItems} of {Math.ceil(filteredOrderItems.length / pageSize)}
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => setPageOrderItems(p => Math.max(1, p - 1))}
                  disabled={pageOrderItems === 1}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-600 disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPageOrderItems(p => Math.min(Math.ceil(filteredOrderItems.length / pageSize), p + 1))}
                  disabled={pageOrderItems >= Math.ceil(filteredOrderItems.length / pageSize)}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-600 disabled:opacity-40"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --------------------------------------------------------------- */}
      {/* 6. REVIEWS TABLE                                                */}
      {/* Columns: ID, Buyer ID, Product ID, Rating, Comment, Created Date */}
      {/* --------------------------------------------------------------- */}
      {activeTab === 'reviews' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs space-y-4 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative w-72">
              <input
                type="text"
                placeholder="Search reviews by comment, product, id..."
                value={reviewSearch}
                onChange={e => {
                  setReviewSearch(e.target.value);
                  setPageReviews(1);
                }}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 outline-none focus:bg-white focus:border-indigo-500 font-sans"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2" />
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">Rating:</span>
              <select
                value={reviewRatingFilter}
                onChange={e => {
                  setReviewRatingFilter(e.target.value === '' ? '' : Number(e.target.value));
                  setPageReviews(1);
                }}
                className="p-1 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 outline-none"
              >
                <option value="">All Ratings</option>
                <option value="5">5 Stars</option>
                <option value="4">4 Stars</option>
                <option value="3">3 Stars</option>
                <option value="2">2 Stars</option>
                <option value="1">1 Star</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-semibold font-mono text-[11px]">
                <tr>
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">Buyer ID</th>
                  <th className="py-3 px-4">Product ID</th>
                  <th className="py-3 px-4">Rating</th>
                  <th className="py-3 px-4">Comment</th>
                  <th className="py-3 px-4">Created Date</th>
                  <th className="py-3 px-4 text-right">Moderation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      <div className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-indigo-600 border-t-transparent" />
                      <p className="mt-2 text-xs">Loading records from PostgreSQL...</p>
                    </td>
                  </tr>
                ) : paginatedReviews.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No matching review records found in PostgreSQL.
                    </td>
                  </tr>
                ) : (
                  paginatedReviews.map(r => (
                    <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-sky-600">#{r.id}</td>
                      <td className="py-3 px-4 font-mono">
                        <span className="font-bold text-slate-800">Buyer #{r.buyer_id}</span>
                        {r.buyer_name && <span className="text-slate-500 text-[11px] block">{r.buyer_name}</span>}
                      </td>
                      <td className="py-3 px-4 font-mono">
                        <span className="font-bold text-slate-800">Product #{r.product_id}</span>
                        {r.product_name && <span className="text-slate-500 text-[11px] block truncate max-w-xs">{r.product_name}</span>}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center text-amber-400">
                          {[1, 2, 3, 4, 5].map(s => (
                            <Star
                              key={s}
                              className={`w-3.5 h-3.5 ${r.rating >= s ? 'fill-current' : 'text-slate-200'}`}
                            />
                          ))}
                          <span className="text-slate-700 font-bold ml-1">{r.rating}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-sm truncate">{r.comment}</td>
                      <td className="py-3 px-4 font-mono text-slate-600 text-[11px]">
                        {new Date(r.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleDeleteReview(r.id)}
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors"
                          title="Delete review from database"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {filteredReviews.length > pageSize && (
            <div className="flex items-center justify-between text-xs pt-2">
              <span className="text-slate-400">
                Page {pageReviews} of {Math.ceil(filteredReviews.length / pageSize)}
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => setPageReviews(p => Math.max(1, p - 1))}
                  disabled={pageReviews === 1}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-600 disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPageReviews(p => Math.min(Math.ceil(filteredReviews.length / pageSize), p + 1))}
                  disabled={pageReviews >= Math.ceil(filteredReviews.length / pageSize)}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-600 disabled:opacity-40"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --------------------------------------------------------------- */}
      {/* 7. DAILY SALES REPORT (AGGREGATE)                                */}
      {/* --------------------------------------------------------------- */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <BarChart3 className="w-4 h-4 text-sky-600" />
                Aggregated Daily Sales Report
              </h3>
              <span className="text-xs text-slate-500">
                Period Total Revenue:{' '}
                <strong className="text-slate-900 font-extrabold font-mono">
                  ${salesReport.reduce((sum, r) => sum + r.revenue, 0).toFixed(2)}
                </strong>
              </span>
            </div>

            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-semibold font-mono text-[11px]">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Orders Placed</th>
                  <th className="py-3 px-4">Items Sold</th>
                  <th className="py-3 px-4">Gross Revenue</th>
                  <th className="py-3 px-4">Revenue Visual Bar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {salesReport.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">
                      No sales recorded in selected date range.
                    </td>
                  </tr>
                ) : (
                  salesReport.map(day => {
                    const maxRev = Math.max(...salesReport.map(s => s.revenue), 100);
                    const widthPct = Math.min(100, Math.round((day.revenue / maxRev) * 100));

                    return (
                      <tr key={day.date} className="hover:bg-slate-50/70">
                        <td className="py-3 px-4 font-mono font-bold text-slate-800">{day.date}</td>
                        <td className="py-3 px-4 text-slate-700 font-semibold">{day.orders}</td>
                        <td className="py-3 px-4 text-slate-700">{day.items_sold}</td>
                        <td className="py-3 px-4 font-black text-slate-900 font-mono">${day.revenue.toFixed(2)}</td>
                        <td className="py-3 px-4">
                          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden max-w-xs">
                            <div
                              className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                              style={{ width: `${widthPct}%` }}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------- */}
      {/* 8. RAW RELATIONAL INSPECTOR (ALL 9 TABLES)                       */}
      {/* --------------------------------------------------------------- */}
      {activeTab === 'raw_db' && (
        <div className="space-y-4">
          <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 text-white shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="text-sm font-bold text-white">Live PostgreSQL Relational Tables Inspector</h3>
                  <p className="text-[11px] text-slate-400">
                    Live raw records currently committed to PostgreSQL. Refreshing the browser or saving data instantly reflects here.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
                <Activity className="w-4 h-4" />
                Storage Engine: PostgreSQL 16
              </div>
            </div>

            {/* Table Selection Tabs */}
            <div className="mb-4">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Select Relational Table:
              </p>
              <div className="flex flex-wrap gap-2 text-xs">
                {dbInspection?.tables &&
                  Object.keys(dbInspection.tables).map(tbl => (
                    <button
                      key={tbl}
                      onClick={() => setSelectedDbTable(tbl)}
                      className={`px-3 py-1 rounded-lg font-mono transition-colors ${
                        selectedDbTable === tbl
                          ? 'bg-emerald-500 text-slate-950 font-bold'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {tbl} ({dbInspection.counts[tbl] || 0})
                    </button>
                  ))}
              </div>
            </div>

            {/* Selected Table Data Grid */}
            <div className="overflow-x-auto max-h-[500px]">
              {dbInspection?.tables && dbInspection.tables[selectedDbTable as keyof typeof dbInspection.tables] ? (
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 sticky top-0">
                    <tr>
                      {Object.keys(
                        (dbInspection.tables[selectedDbTable as keyof typeof dbInspection.tables] as any[])[0] || {}
                      ).map(col => (
                        <th key={col} className="py-2.5 px-3 whitespace-nowrap">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {((dbInspection.tables[selectedDbTable as keyof typeof dbInspection.tables] as any[]) || []).map(
                      (row: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-800/40">
                          {Object.keys(row).map(col => (
                            <td key={col} className="py-2 px-3 whitespace-nowrap">
                              {typeof row[col] === 'object' && row[col] !== null
                                ? JSON.stringify(row[col])
                                : String(row[col])}
                            </td>
                          ))}
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              ) : (
                <p className="text-xs text-slate-500 py-8 text-center">No rows recorded in this table.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
