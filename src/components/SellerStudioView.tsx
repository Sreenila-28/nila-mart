import React, { useState, useEffect } from 'react';
import {
  Store,
  Plus,
  Edit2,
  Trash2,
  Package,
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  X,
  Search,
  LogIn,
  Layers,
  ArrowUpDown,
  Save
} from 'lucide-react';
import { Product, SellerOrder, Category, User } from '../types';
import { api } from '../services/api';

interface SellerStudioViewProps {
  categories: Category[];
  currentUser: User | null;
  onRefreshCatalog: () => void;
  onOpenAuth?: () => void;
  onQuickSwitchRole?: (role: 'BUYER' | 'SELLER' | 'ADMIN') => void;
}

export const SellerStudioView: React.FC<SellerStudioViewProps> = ({
  categories,
  currentUser,
  onRefreshCatalog,
  onOpenAuth,
  onQuickSwitchRole
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [sellerOrders, setSellerOrders] = useState<SellerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'inventory' | 'orders'>('inventory');

  // Search and Filtering inside Seller Studio
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [stockFilter, setStockFilter] = useState<'ALL' | 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK'>('ALL');

  // Inline Stock Edit State: productId -> editing value
  const [editingStockId, setEditingStockId] = useState<number | null>(null);
  const [stockInputVal, setStockInputVal] = useState<string>('');
  const [stockUpdating, setStockUpdating] = useState<number | null>(null);

  // Add/Edit Product Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock_quantity: '20',
    category_id: '1',
    image_url: ''
  });
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Active seller ID: if logged in as SELLER, use their ID; if ADMIN, allow viewing all or default seller #2
  const isSellerLoggedIn = currentUser && currentUser.role === 'SELLER';
  const effectiveSellerId = isSellerLoggedIn ? currentUser.id : 2;

  useEffect(() => {
    loadData();
  }, [currentUser]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Fetch seller's specific products from PostgreSQL
      const [prodRes, ordRes] = await Promise.all([
        api.getProducts({ seller_id: effectiveSellerId }),
        api.getSellerOrders()
      ]);

      if (prodRes.success) setProducts(prodRes.products);
      if (ordRes.success) setSellerOrders(ordRes.seller_orders);
    } catch (err) {
      console.error('Failed to load seller studio data:', err);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      description: '',
      price: '',
      stock_quantity: '25',
      category_id: categories[0]?.id.toString() || '1',
      image_url: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=800&q=80'
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setFormData({
      name: p.name,
      description: p.description,
      price: p.price.toString(),
      stock_quantity: p.stock_quantity.toString(),
      category_id: p.category_id.toString(),
      image_url: p.image_url
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLoading(true);
    setModalError(null);

    const payload = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      price: parseFloat(formData.price),
      stock_quantity: parseInt(formData.stock_quantity, 10),
      category_id: parseInt(formData.category_id, 10),
      image_url: formData.image_url.trim()
    };

    try {
      if (editingProduct) {
        const res = await api.updateProduct(editingProduct.id, payload);
        setSuccessMsg(`Product #${editingProduct.id} "${res.product.name}" updated successfully in PostgreSQL!`);
      } else {
        const res = await api.createProduct(payload);
        setSuccessMsg(`New product #${res.product.id} published and stored permanently in PostgreSQL!`);
      }

      setIsModalOpen(false);
      await loadData();
      onRefreshCatalog();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setModalError(err.message || 'Failed to save product in PostgreSQL database');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteProduct = async (productId: number, productName: string) => {
    if (!confirm(`Are you sure you want to permanently delete "${productName}" (ID #${productId}) from PostgreSQL?\n\nHistorical order records will be preserved.`)) return;
    try {
      await api.deleteProduct(productId);
      setSuccessMsg(`Product #${productId} permanently removed from PostgreSQL.`);
      await loadData();
      onRefreshCatalog();
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      alert(err.message || 'Failed to delete product from database');
    }
  };

  // Inline Stock Update
  const startInlineStockEdit = (product: Product) => {
    setEditingStockId(product.id);
    setStockInputVal(product.stock_quantity.toString());
  };

  const cancelInlineStockEdit = () => {
    setEditingStockId(null);
    setStockInputVal('');
  };

  const handleSaveInlineStock = async (productId: number) => {
    const newQty = parseInt(stockInputVal, 10);
    if (isNaN(newQty) || newQty < 0) {
      alert('Please enter a valid non-negative number for stock quantity.');
      return;
    }

    setStockUpdating(productId);
    try {
      await api.updateProductStock(productId, newQty);
      setSuccessMsg(`Stock quantity for product #${productId} updated to ${newQty} in PostgreSQL!`);
      setEditingStockId(null);
      await loadData();
      onRefreshCatalog();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to update stock quantity in PostgreSQL');
    } finally {
      setStockUpdating(null);
    }
  };

  // Quick Stock Adjustment (+1 or -1)
  const handleQuickAdjustStock = async (product: Product, delta: number) => {
    const updatedStock = Math.max(0, product.stock_quantity + delta);
    if (updatedStock === product.stock_quantity) return;

    setStockUpdating(product.id);
    try {
      await api.updateProductStock(product.id, updatedStock);
      setSuccessMsg(`Stock updated: ${product.name} now has ${updatedStock} units in PostgreSQL.`);
      await loadData();
      onRefreshCatalog();
      setTimeout(() => setSuccessMsg(null), 2500);
    } catch (err: any) {
      alert(err.message || 'Failed to adjust stock');
    } finally {
      setStockUpdating(null);
    }
  };

  // Filtered Products
  const filteredProducts = products.filter(p => {
    const matchesSearch = !searchQuery || 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.id.toString() === searchQuery;

    const matchesCat = selectedCategory === 'ALL' || p.category_id.toString() === selectedCategory;

    let matchesStock = true;
    if (stockFilter === 'IN_STOCK') matchesStock = p.stock_quantity > 5;
    else if (stockFilter === 'LOW_STOCK') matchesStock = p.stock_quantity > 0 && p.stock_quantity <= 5;
    else if (stockFilter === 'OUT_OF_STOCK') matchesStock = p.stock_quantity === 0;

    return matchesSearch && matchesCat && matchesStock;
  });

  // Metrics
  const totalRevenue = sellerOrders.reduce((sum, o) => sum + o.subtotal, 0);
  const totalUnitsSold = sellerOrders.reduce((sum, o) => sum + o.quantity, 0);
  const lowStockCount = products.filter(p => p.stock_quantity <= 5).length;
  const outOfStockCount = products.filter(p => p.stock_quantity === 0).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Seller Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 shadow-2xs">
              <Store className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-slate-900">Seller Studio & Catalog</h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
                  PostgreSQL ACID
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {isSellerLoggedIn ? (
                  <span>Logged in as merchant: <strong className="text-slate-800">{currentUser?.name}</strong> (Seller ID #{currentUser?.id})</span>
                ) : (
                  <span>Viewing demo catalog for: <strong className="text-slate-800">ElectroTech Global</strong> (Seller ID #2)</span>
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {!isSellerLoggedIn && (
            <button
              onClick={() => onQuickSwitchRole ? onQuickSwitchRole('SELLER') : (onOpenAuth && onOpenAuth())}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-amber-50 text-amber-700 border border-amber-200 font-bold text-xs flex items-center gap-1.5 transition-all shadow-2xs"
            >
              <LogIn className="w-4 h-4" />
              Sign In as Seller
            </button>
          )}

          <button
            onClick={openAddModal}
            className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold text-xs shadow-md shadow-amber-600/20 flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add New Product
          </button>
        </div>
      </div>

      {/* Seller Role Notification / Quick Switch Banner if not logged in as seller */}
      {!isSellerLoggedIn && (
        <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 text-xs text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-start sm:items-center gap-2.5">
            <Store className="w-5 h-5 text-amber-600 shrink-0 mt-0.5 sm:mt-0" />
            <div>
              <p className="font-bold">Operating in Demo Seller Mode (ElectroTech Global)</p>
              <p className="text-[11px] text-amber-700">
                You can add, edit, update stock, and delete products in the real PostgreSQL database. To test multi-seller isolation, log in or register a new seller account.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {onQuickSwitchRole && (
              <button
                onClick={() => onQuickSwitchRole('SELLER')}
                className="px-3 py-1.5 rounded-lg bg-amber-600 text-white font-bold text-[11px] hover:bg-amber-700 transition-colors"
              >
                Switch to ElectroTech
              </button>
            )}
            {onOpenAuth && (
              <button
                onClick={onOpenAuth}
                className="px-3 py-1.5 rounded-lg bg-white border border-amber-300 text-amber-800 font-bold text-[11px] hover:bg-amber-50 transition-colors"
              >
                Register New Seller
              </button>
            )}
          </div>
        </div>
      )}

      {/* Success Banner */}
      {successMsg && (
        <div className="mb-6 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2.5 animate-in fade-in shadow-2xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-semibold">{successMsg}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Active Products</span>
            <Package className="w-4 h-4 text-sky-500" />
          </div>
          <p className="text-2xl font-black text-slate-900">{products.length}</p>
          <p className="text-[11px] text-slate-500 mt-1">Listed in PostgreSQL catalog</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Units Sold</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-slate-900">{totalUnitsSold}</p>
          <p className="text-[11px] text-slate-500 mt-1">From confirmed customer orders</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Sales</span>
            <DollarSign className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-slate-900">${totalRevenue.toFixed(2)}</p>
          <p className="text-[11px] text-slate-500 mt-1">Net seller earnings</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Low / Out of Stock</span>
            <AlertCircle className={`w-4 h-4 ${lowStockCount > 0 ? 'text-amber-500' : 'text-slate-400'}`} />
          </div>
          <p className="text-2xl font-black text-slate-900">
            {lowStockCount} <span className="text-xs font-normal text-slate-400">({outOfStockCount} zero)</span>
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Items requiring stock replenishment</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 mb-6">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'inventory'
              ? 'border-amber-600 text-amber-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Inventory, Pricing & Stock ({products.length})
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'orders'
              ? 'border-amber-600 text-amber-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Customer Orders ({sellerOrders.length})
        </button>
      </div>

      {/* Tab 1: Inventory Table */}
      {activeTab === 'inventory' && (
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search products by title, description, or ID..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:bg-white focus:border-amber-500 outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Category Filter */}
              <div className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(e.target.value)}
                  className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 outline-none font-medium"
                >
                  <option value="ALL">All Categories</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id.toString()}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Stock Filter */}
              <select
                value={stockFilter}
                onChange={e => setStockFilter(e.target.value as any)}
                className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 outline-none font-medium"
              >
                <option value="ALL">All Stock Levels</option>
                <option value="IN_STOCK">In Stock (&gt; 5)</option>
                <option value="LOW_STOCK">Low Stock (&le; 5)</option>
                <option value="OUT_OF_STOCK">Out of Stock (0)</option>
              </select>

              {(searchQuery || selectedCategory !== 'ALL' || stockFilter !== 'ALL') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('ALL');
                    setStockFilter('ALL');
                  }}
                  className="px-2.5 py-1.5 text-slate-500 hover:text-slate-800 text-[11px] font-bold"
                >
                  Reset Filters
                </button>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-4">Product Details</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Price ($)</th>
                    <th className="py-3 px-4">Stock Quantity & Quick Adjust</th>
                    <th className="py-3 px-4">Timestamps (Created / Updated)</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        <span className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-amber-600 border-t-transparent mb-2" />
                        <p>Querying PostgreSQL products table...</p>
                      </td>
                    </tr>
                  ) : filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        <Package className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                        <p className="font-bold text-slate-600">No products found matching filters.</p>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Click "Add New Product" above to publish your first item to PostgreSQL.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4 flex items-center gap-3">
                          <img
                            src={p.image_url}
                            alt={p.name}
                            className="w-12 h-12 rounded-xl object-cover bg-slate-100 border border-slate-200 shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 truncate max-w-xs">{p.name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[11px] text-slate-400 font-mono">ID #{p.id}</span>
                              <span className="text-slate-300">•</span>
                              <span className="text-[11px] text-amber-600 font-medium truncate max-w-[150px]">
                                {p.seller_name || `Seller #${p.seller_id}`}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-slate-600 font-medium">
                          <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 font-semibold text-[11px]">
                            {p.category_name}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 font-black text-slate-900 text-sm">
                          ${p.price.toFixed(2)}
                        </td>

                        {/* Stock Quantity with Inline Editing & Quick +/- Adjusters */}
                        <td className="py-3.5 px-4">
                          {editingStockId === p.id ? (
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                min="0"
                                value={stockInputVal}
                                onChange={e => setStockInputVal(e.target.value)}
                                className="w-16 p-1.5 rounded-lg border border-amber-400 bg-amber-50/50 text-slate-900 font-bold text-xs text-center outline-none"
                                autoFocus
                              />
                              <button
                                onClick={() => handleSaveInlineStock(p.id)}
                                disabled={stockUpdating === p.id}
                                className="p-1.5 rounded-lg bg-amber-600 text-white hover:bg-amber-700 transition-colors"
                                title="Save stock"
                              >
                                <Save className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={cancelInlineStockEdit}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 transition-colors"
                                title="Cancel"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                  p.stock_quantity === 0
                                    ? 'bg-rose-100 text-rose-700 border border-rose-200'
                                    : p.stock_quantity <= 5
                                    ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                    : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                }`}
                              >
                                {p.stock_quantity} units
                              </span>

                              {/* Quick increment/decrement buttons */}
                              <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                                <button
                                  onClick={() => handleQuickAdjustStock(p, -1)}
                                  disabled={p.stock_quantity <= 0 || stockUpdating === p.id}
                                  className="px-2 py-0.5 text-slate-600 hover:bg-slate-200 disabled:opacity-30 font-bold transition-colors"
                                  title="Reduce stock by 1"
                                >
                                  -
                                </button>
                                <button
                                  onClick={() => startInlineStockEdit(p)}
                                  className="px-2 py-0.5 text-[10px] text-slate-500 hover:text-amber-700 hover:bg-amber-50 border-x border-slate-200 transition-colors"
                                  title="Edit stock directly"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleQuickAdjustStock(p, 1)}
                                  disabled={stockUpdating === p.id}
                                  className="px-2 py-0.5 text-slate-600 hover:bg-slate-200 disabled:opacity-30 font-bold transition-colors"
                                  title="Increase stock by 1"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          )}
                        </td>

                        <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                          <div>Created: {new Date(p.created_at).toLocaleDateString()}</div>
                          {p.updated_at && p.updated_at !== p.created_at && (
                            <div className="text-amber-600 text-[10px]">
                              Updated: {new Date(p.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right space-x-1.5">
                          <button
                            onClick={() => openEditModal(p)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                            title="Edit full product details"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p.id, p.name)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Delete product permanently"
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
          </div>
        </div>
      )}

      {/* Tab 2: Seller Orders */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-4">Order #</th>
                    <th className="py-3 px-4">Order Date (PostgreSQL TIMESTAMPTZ)</th>
                    <th className="py-3 px-4">Customer Details</th>
                    <th className="py-3 px-4">Product Name</th>
                    <th className="py-3 px-4">Qty</th>
                    <th className="py-3 px-4">Subtotal</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sellerOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <Store className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                        <p className="font-bold text-slate-600">No customer orders placed yet for this seller.</p>
                      </td>
                    </tr>
                  ) : (
                    sellerOrders.map(so => (
                      <tr key={so.order_item_id} className="hover:bg-slate-50/70">
                        <td className="py-3.5 px-4 font-mono font-bold text-sky-600">
                          #{so.order_id}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                          {new Date(so.order_date).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="font-bold text-slate-800">{so.buyer_name}</p>
                          <p className="text-[11px] text-slate-400">{so.buyer_email}</p>
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-900 max-w-xs truncate">
                          {so.product_name}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-700">{so.quantity}</td>
                        <td className="py-3.5 px-4 font-black text-slate-900">
                          ${so.subtotal.toFixed(2)}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800">
                            {so.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-slate-900 mb-1">
              {editingProduct ? `Edit Product #${editingProduct.id}` : 'Publish New Product'}
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              All 6 required product fields will be validated and saved permanently in the PostgreSQL <code className="text-amber-700 font-mono">products</code> table.
            </p>

            {modalError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                {modalError}
              </div>
            )}

            <form onSubmit={handleSaveProduct} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Product Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. UltraView 27-inch 4K HDR IPS Monitor"
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:bg-white focus:border-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Category <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.category_id}
                  onChange={e => setFormData({ ...formData, category_id: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:bg-white focus:border-amber-500 outline-none font-medium"
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Price ($ USD) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={formData.price}
                    onChange={e => setFormData({ ...formData, price: e.target.value })}
                    placeholder="99.99"
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:bg-white focus:border-amber-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Stock Quantity <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.stock_quantity}
                    onChange={e => setFormData({ ...formData, stock_quantity: e.target.value })}
                    placeholder="25"
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:bg-white focus:border-amber-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Product Image URL <span className="text-rose-500">*</span>
                </label>
                <input
                  type="url"
                  required
                  value={formData.image_url}
                  onChange={e => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:bg-white focus:border-amber-500 outline-none font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Description <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe technical specs, battery life, materials, and warranty information."
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:bg-white focus:border-amber-500 outline-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md shadow-amber-600/20 transition-all flex items-center justify-center gap-2"
                >
                  {modalLoading ? (
                    <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  ) : (
                    <span>{editingProduct ? 'Save Product Changes to PostgreSQL' : 'Publish Product to PostgreSQL'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
