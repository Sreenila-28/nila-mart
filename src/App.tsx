import React, { useState, useEffect, useMemo } from 'react';
import {
  ShoppingBag,
  SlidersHorizontal,
  ChevronDown,
  Sparkles,
  ShieldCheck,
  Zap,
  Truck,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Database,
  Server,
  Code2,
  ArrowRight,
  TrendingUp,
  Tag
} from 'lucide-react';
import { Navbar } from './components/Navbar';
import { ProductCard } from './components/ProductCard';
import { ProductDetailModal } from './components/ProductDetailModal';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { AuthModal } from './components/AuthModal';
import { BuyerProfileModal } from './components/BuyerProfileModal';
import { WishlistModal } from './components/WishlistModal';
import { BuyerOrdersView } from './components/BuyerOrdersView';
import { SellerStudioView } from './components/SellerStudioView';
import { AdminHubView } from './components/AdminHubView';
import { CodebaseExplorerView } from './components/CodebaseExplorerView';
import { AiChatWidget } from './components/AiChatWidget';
import { api } from './services/api';
import { Product, Category, User, CartResponse, WishlistItem } from './types';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<string>('newest');
  const [minPrice, setMinPrice] = useState<number | ''>('');
  const [maxPrice, setMaxPrice] = useState<number | ''>('');
  const [inStockOnly, setInStockOnly] = useState(false);

  // Cart & Wishlist
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [cartLoading, setCartLoading] = useState(false);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);

  // Navigation Tab
  const [currentTab, setCurrentTab] = useState<'storefront' | 'orders' | 'seller' | 'admin' | 'codebase'>('storefront');

  // Modals
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);

  // Global Toasts / Notification
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [loadingCatalog, setLoadingCatalog] = useState(true);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Initial Data Load
  useEffect(() => {
    bootstrapApp();
  }, []);

  const bootstrapApp = async () => {
    try {
      // 1. Check current authenticated user
      try {
        const authRes = await api.getCurrentUser();
        if (authRes.success) {
          setCurrentUser(authRes.user);
        }
      } catch {
        // Fallback to default demo buyer if token invalid
        const demoUser: User = {
          id: 4,
          name: 'Alice Buyer',
          email: 'buyer.alice@nilamart.com',
          role: 'BUYER',
          created_at: '2026-09-15T14:20:00.000Z',
          updated_at: '2026-09-15T14:20:00.000Z'
        };
        setCurrentUser(demoUser);
      }

      // 2. Fetch categories
      const catRes = await api.getCategories();
      if (catRes.success) {
        setCategories(catRes.categories);
      }

      // 3. Fetch products
      await loadProducts();

      // 4. Fetch Cart & Wishlist
      await Promise.all([loadCart(), loadWishlist()]);
    } catch (err) {
      console.error('App bootstrap error:', err);
    } finally {
      setLoadingCatalog(false);
    }
  };

  const loadProducts = async () => {
    setLoadingCatalog(true);
    try {
      const res = await api.getProducts({
        category_id: selectedCategoryId || undefined,
        search: searchQuery || undefined,
        min_price: minPrice !== '' ? Number(minPrice) : undefined,
        max_price: maxPrice !== '' ? Number(maxPrice) : undefined,
        sort: sortOption
      });
      if (res.success) {
        setProducts(res.products);
      }
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoadingCatalog(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [selectedCategoryId, searchQuery, sortOption, minPrice, maxPrice]);

  const loadCart = async () => {
    setCartLoading(true);
    try {
      const res = await api.getCart();
      if (res.success) {
        setCart(res);
      }
    } catch (err) {
      console.error('Failed to load cart:', err);
    } finally {
      setCartLoading(false);
    }
  };

  const loadWishlist = async () => {
    try {
      const res = await api.getWishlist();
      if (res.success) {
        setWishlist(res.wishlist);
      }
    } catch (err) {
      console.error('Failed to load wishlist:', err);
    }
  };

  // Cart Handlers
  const handleAddToCart = async (product: Product, quantity = 1) => {
    try {
      const res = await api.addToCart(product.id, quantity);
      if (res.success) {
        await loadCart();
        showNotification(`Added ${product.name} to cart`);
      }
    } catch (err: any) {
      showNotification(err.message || 'Failed to add item to cart', 'error');
    }
  };

  const handleUpdateQuantity = async (productId: number, quantity: number) => {
    try {
      const res = await api.updateCartQuantity(productId, quantity);
      if (res.success) {
        await loadCart();
      }
    } catch (err: any) {
      showNotification(err.message || 'Failed to update quantity', 'error');
    }
  };

  const handleRemoveCartItem = async (productId: number) => {
    try {
      const res = await api.removeCartItem(productId);
      if (res.success) {
        await loadCart();
        showNotification('Item removed from cart');
      }
    } catch (err: any) {
      showNotification(err.message || 'Failed to remove item', 'error');
    }
  };

  const handleClearCart = async () => {
    try {
      const res = await api.clearCart();
      if (res.success) {
        await loadCart();
        showNotification('Shopping cart cleared');
      }
    } catch (err: any) {
      showNotification(err.message || 'Failed to clear cart', 'error');
    }
  };

  // Wishlist Handlers
  const handleToggleWishlist = async (productId: number) => {
    try {
      const res = await api.toggleWishlist(productId);
      if (res.success) {
        await loadWishlist();
        showNotification(res.message);
      }
    } catch (err: any) {
      showNotification(err.message || 'Failed to update wishlist', 'error');
    }
  };

  // Role quick switch
  const handleQuickSwitchRole = (roleChoice: 'BUYER' | 'SELLER' | 'ADMIN') => {
    if (roleChoice === 'BUYER') {
      api.setToken('nilamart_demo_buyer');
      setCurrentUser({
        id: 4,
        name: 'Alice Buyer',
        email: 'buyer.alice@nilamart.com',
        role: 'BUYER',
        created_at: '2026-09-15T14:20:00.000Z',
        updated_at: '2026-09-15T14:20:00.000Z'
      });
      setCurrentTab('storefront');
      showNotification('Switched active profile to Verified Buyer (Alice)');
    } else if (roleChoice === 'SELLER') {
      api.setToken('nilamart_demo_seller');
      setCurrentUser({
        id: 2,
        name: 'ElectroTech Global Seller',
        email: 'seller.tech@nilamart.com',
        role: 'SELLER',
        created_at: '2026-09-05T10:15:00.000Z',
        updated_at: '2026-09-05T10:15:00.000Z'
      });
      setCurrentTab('seller');
      showNotification('Switched active profile to Verified Seller (ElectroTech)');
    } else {
      api.setToken('nilamart_demo_admin');
      setCurrentUser({
        id: 1,
        name: 'Admin Controller',
        email: 'admin@nilamart.com',
        role: 'ADMIN',
        created_at: '2026-09-01T08:00:00.000Z',
        updated_at: '2026-09-01T08:00:00.000Z'
      });
      setCurrentTab('admin');
      showNotification('Switched active profile to System Admin');
    }
    loadCart();
    loadWishlist();
  };

  const handleLogout = () => {
    api.setToken(null);
    setCurrentUser(null);
    showNotification('Logged out successfully');
  };

  const handleOrderSuccess = async (orderId: number) => {
    await Promise.all([loadCart(), loadProducts()]);
    showNotification(`Order #${orderId} confirmed and logged in database!`);
  };

  const filteredProducts = useMemo(() => {
    if (!inStockOnly) return products;
    return products.filter(p => p.stock_quantity > 0);
  }, [products, inStockOnly]);

  const totalCartUnits = cart?.cart_items.reduce((sum, item) => sum + item.quantity, 0) || 0;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-20 right-6 z-50 animate-in fade-in slide-in-from-top-4 duration-200">
          <div
            className={`px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-2 text-xs font-semibold ${
              notification.type === 'success'
                ? 'bg-slate-900 text-white border-slate-800'
                : 'bg-rose-600 text-white border-rose-500'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-200 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      {/* Main Navbar */}
      <Navbar
        currentUser={currentUser}
        categories={categories}
        selectedCategoryId={selectedCategoryId}
        onSelectCategory={setSelectedCategoryId}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        cartCount={totalCartUnits}
        wishlistCount={wishlist.length}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenWishlist={() => setIsWishlistOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        onLogout={handleLogout}
        currentTab={currentTab}
        onChangeTab={setCurrentTab}
        onQuickSwitchRole={handleQuickSwitchRole}
      />

      {/* Content Body Router */}
      <main className="flex-1">
        {currentTab === 'storefront' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
            {/* Promotional Hero Banner */}
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-slate-950 via-sky-950 to-indigo-950 text-white p-6 sm:p-10 shadow-xl border border-slate-800">
              <div className="relative z-10 max-w-2xl space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/20 border border-sky-400/30 text-sky-300 text-xs font-semibold">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  Amazon & Flipkart Scale Architecture
                </div>

                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
                  High-Performance <span className="bg-gradient-to-r from-sky-400 to-indigo-300 bg-clip-text text-transparent">C++20 Drogon</span> E-Commerce
                </h1>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Real ACID transactions, PostgreSQL schema with foreign keys &amp; TIMESTAMPTZ timestamps, role-based security, and conversational Gemini AI shopping concierge.
                </p>

                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => setSelectedCategoryId(1)}
                    className="px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs shadow-md transition-colors flex items-center gap-1.5"
                  >
                    Browse Electronics
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setCurrentTab('codebase')}
                    className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs backdrop-blur-md transition-colors flex items-center gap-1.5"
                  >
                    <Code2 className="w-3.5 h-3.5 text-emerald-400" />
                    Inspect C++ Drogon Code
                  </button>
                </div>
              </div>

              {/* Background accents */}
              <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-20 bg-gradient-to-l from-sky-500 to-transparent pointer-events-none" />
            </div>

            {/* Catalog Layout: Filter Bar & Products Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Filter Sidebar */}
              <div className="lg:col-span-1 space-y-6">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                      <SlidersHorizontal className="w-4 h-4 text-sky-600" />
                      Filter Products
                    </span>
                    {(selectedCategoryId !== null || minPrice !== '' || maxPrice !== '' || inStockOnly) && (
                      <button
                        onClick={() => {
                          setSelectedCategoryId(null);
                          setMinPrice('');
                          setMaxPrice('');
                          setInStockOnly(false);
                          setSearchQuery('');
                        }}
                        className="text-[11px] text-sky-600 hover:underline font-semibold"
                      >
                        Reset All
                      </button>
                    )}
                  </div>

                  {/* Categories */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 uppercase mb-2">Category</h4>
                    <div className="space-y-1">
                      <button
                        onClick={() => setSelectedCategoryId(null)}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          selectedCategoryId === null
                            ? 'bg-sky-50 text-sky-700 font-bold'
                            : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        All Categories
                      </button>
                      {categories.map(c => (
                        <button
                          key={c.id}
                          onClick={() => setSelectedCategoryId(c.id)}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            selectedCategoryId === c.id
                              ? 'bg-sky-50 text-sky-700 font-bold'
                              : 'text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {c.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Price Range */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 uppercase mb-2">Price Range ($)</h4>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        placeholder="Min"
                        value={minPrice}
                        onChange={e => setMinPrice(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-1/2 p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 outline-none"
                      />
                      <span className="text-slate-400 text-xs">-</span>
                      <input
                        type="number"
                        placeholder="Max"
                        value={maxPrice}
                        onChange={e => setMaxPrice(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-1/2 p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 outline-none"
                      />
                    </div>
                  </div>

                  {/* In Stock Toggle */}
                  <div className="pt-2 border-t border-slate-100">
                    <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={inStockOnly}
                        onChange={e => setInStockOnly(e.target.checked)}
                        className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                      />
                      <span>In-Stock Items Only</span>
                    </label>
                  </div>
                </div>

                {/* Trust & Guarantees */}
                <div className="bg-sky-50/60 p-4 rounded-2xl border border-sky-100 space-y-3 text-xs text-slate-600">
                  <div className="flex items-center gap-2 text-sky-900 font-bold">
                    <ShieldCheck className="w-4 h-4 text-sky-600" />
                    <span>NilaMart Guarantees</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    Orders are processed with row locking and verified against current stock before clearing shopping carts.
                  </p>
                </div>
              </div>

              {/* Products Section */}
              <div className="lg:col-span-3 space-y-4">
                {/* Sorting and Count Bar */}
                <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
                  <span className="text-slate-500 font-medium">
                    Showing <strong className="text-slate-900">{filteredProducts.length}</strong> items in PostgreSQL catalog
                  </span>

                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">Sort By:</span>
                    <select
                      value={sortOption}
                      onChange={e => setSortOption(e.target.value)}
                      className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 font-semibold text-xs outline-none focus:border-sky-500"
                    >
                      <option value="newest">Newest Arrivals</option>
                      <option value="price_asc">Price: Low to High</option>
                      <option value="price_desc">Price: High to Low</option>
                      <option value="rating">Top Customer Ratings</option>
                    </select>
                  </div>
                </div>

                {/* Product Cards Grid */}
                {loadingCatalog ? (
                  <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 text-slate-400 text-xs">
                    <span className="inline-block animate-spin rounded-full h-8 w-8 border-3 border-sky-600 border-t-transparent mb-3" />
                    <p className="font-semibold text-slate-600">Loading catalog from database...</p>
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 p-8 space-y-3">
                    <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                      <ShoppingBag className="w-7 h-7" />
                    </div>
                    <h3 className="text-base font-bold text-slate-800">No matching products found</h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Try clearing search keywords or loosening category/price filters.
                    </p>
                    <button
                      onClick={() => {
                        setSelectedCategoryId(null);
                        setSearchQuery('');
                        setMinPrice('');
                        setMaxPrice('');
                        setInStockOnly(false);
                      }}
                      className="mt-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold"
                    >
                      Reset Filters
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                    {filteredProducts.map(product => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        isInWishlist={wishlist.some(w => w.product_id === product.id)}
                        onAddToCart={prod => handleAddToCart(prod, 1)}
                        onToggleWishlist={handleToggleWishlist}
                        onOpenDetails={setSelectedProduct}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {currentTab === 'orders' && (
          <BuyerOrdersView
            onReviewProduct={productId => {
              const p = products.find(item => item.id === productId);
              if (p) setSelectedProduct(p);
            }}
          />
        )}

        {currentTab === 'seller' && (
          <SellerStudioView
            categories={categories}
            currentUser={currentUser}
            onRefreshCatalog={loadProducts}
            onOpenAuth={() => setIsAuthOpen(true)}
            onQuickSwitchRole={handleQuickSwitchRole}
          />
        )}

        {currentTab === 'admin' && (
          <AdminHubView onRefreshCatalog={loadProducts} />
        )}

        {currentTab === 'codebase' && <CodebaseExplorerView />}
      </main>

      {/* Floating AI Shopping Concierge */}
      <AiChatWidget
        products={products}
        onOpenProductDetails={setSelectedProduct}
      />

      {/* Modals */}
      <ProductDetailModal
        product={selectedProduct}
        currentUser={currentUser}
        isInWishlist={selectedProduct ? wishlist.some(w => w.product_id === selectedProduct.id) : false}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={handleAddToCart}
        onToggleWishlist={handleToggleWishlist}
        onOpenAuth={() => setIsAuthOpen(true)}
        onProductUpdated={loadProducts}
      />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        loading={cartLoading}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={handleClearCart}
        onProceedToCheckout={() => {
          setIsCartOpen(false);
          setIsCheckoutOpen(true);
        }}
      />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cart={cart}
        currentUser={currentUser}
        onOrderSuccess={handleOrderSuccess}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={user => {
          setCurrentUser(user);
          showNotification(`Signed in as ${user.name} (${user.role})`);
        }}
      />

      <BuyerProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        currentUser={currentUser}
        onProfileUpdated={updatedUser => {
          setCurrentUser(updatedUser);
          showNotification('Profile updated and saved to PostgreSQL successfully!');
        }}
      />

      <WishlistModal
        isOpen={isWishlistOpen}
        onClose={() => setIsWishlistOpen(false)}
        wishlist={wishlist}
        onRemove={handleToggleWishlist}
        onAddToCart={handleAddToCart}
        products={products}
      />

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 text-xs py-10 border-t border-slate-800 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 text-white font-black text-lg mb-2">
              <ShoppingBag className="w-5 h-5 text-sky-500" />
              NilaMart
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              Full-Stack C++20 Drogon E-Commerce Platform built with PostgreSQL relational database, real ACID transactions, and Gemini AI.
            </p>
          </div>

          <div>
            <h4 className="text-white font-bold mb-3 uppercase tracking-wider text-[11px]">System Architecture</h4>
            <ul className="space-y-1.5 text-xs text-slate-400">
              <li>C++20 Drogon Asynchronous Core</li>
              <li>PostgreSQL 16 Relational Engine</li>
              <li>TIMESTAMPTZ Server-Side Auditing</li>
              <li>Row-Locking Stock Transactions</li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-3 uppercase tracking-wider text-[11px]">Role Navigation</h4>
            <ul className="space-y-1.5 text-xs text-slate-400">
              <li>
                <button onClick={() => handleQuickSwitchRole('BUYER')} className="hover:text-white">
                  Buyer Experience (Catalog &amp; Cart)
                </button>
              </li>
              <li>
                <button onClick={() => handleQuickSwitchRole('SELLER')} className="hover:text-white">
                  Seller Studio (Inventory &amp; Orders)
                </button>
              </li>
              <li>
                <button onClick={() => handleQuickSwitchRole('ADMIN')} className="hover:text-white">
                  Admin Executive Hub (Reports &amp; Governance)
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentTab('codebase')} className="text-emerald-400 hover:underline">
                  C++ Drogon Code &amp; Schema Explorer
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-3 uppercase tracking-wider text-[11px]">Database Reset</h4>
            <p className="text-[11px] text-slate-400 mb-3">
              Reset database records to the default seed.sql initial state for clean capstone testing.
            </p>
            <button
              onClick={async () => {
                if (confirm('Reset database to original seed data?')) {
                  await api.resetDemo();
                  await bootstrapApp();
                  showNotification('Database restored to original seed.sql data!');
                }
              }}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
            >
              Reset Seed Data
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 pt-6 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4 text-[11px] text-slate-400">
          <p>© 2026 NilaMart Inc. All rights reserved.</p>
          <p className="font-mono text-slate-400">
            Backend: Drogon/C++20 • DB: PostgreSQL • Security: JWT/Bcrypt
          </p>
        </div>
      </footer>
    </div>
  );
}
