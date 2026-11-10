import React, { useState } from 'react';
import {
  ShoppingBag,
  ShoppingCart,
  Heart,
  Search,
  User as UserIcon,
  Shield,
  Store,
  Code2,
  PackageCheck,
  LogOut,
  X,
  Sparkles,
  Layers
} from 'lucide-react';
import { User, Category } from '../types';

interface NavbarProps {
  currentUser: User | null;
  categories: Category[];
  selectedCategoryId: number | null;
  onSelectCategory: (id: number | null) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  cartCount: number;
  wishlistCount: number;
  onOpenCart: () => void;
  onOpenWishlist: () => void;
  onOpenAuth: () => void;
  onLogout: () => void;
  onOpenProfile?: () => void;
  currentTab: 'storefront' | 'orders' | 'seller' | 'admin' | 'codebase';
  onChangeTab: (tab: 'storefront' | 'orders' | 'seller' | 'admin' | 'codebase') => void;
  onQuickSwitchRole: (role: 'BUYER' | 'SELLER' | 'ADMIN') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  categories,
  selectedCategoryId,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  cartCount,
  wishlistCount,
  onOpenCart,
  onOpenWishlist,
  onOpenAuth,
  onLogout,
  onOpenProfile,
  currentTab,
  onChangeTab,
  onQuickSwitchRole
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      {/* Top Capstone Technical Banner */}
      <div className="bg-slate-900 text-slate-300 text-xs py-1.5 px-4 font-mono flex flex-wrap items-center justify-between gap-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-white font-medium">NilaMart Engine:</span>
          <span className="text-emerald-400">C++20 Drogon Core</span>
          <span className="text-slate-500">•</span>
          <span className="text-sky-300">PostgreSQL Relational DB</span>
          <span className="text-slate-500">•</span>
          <span className="text-amber-300">ACID Transactions</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-slate-400">Quick Test Switch:</span>
          <button
            onClick={() => onQuickSwitchRole('BUYER')}
            className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
              currentUser?.role === 'BUYER' ? 'bg-sky-600 text-white font-semibold' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            Buyer (Alice)
          </button>
          <button
            onClick={() => onQuickSwitchRole('SELLER')}
            className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
              currentUser?.role === 'SELLER' ? 'bg-amber-600 text-white font-semibold' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            Seller (ElectroTech)
          </button>
          <button
            onClick={() => onQuickSwitchRole('ADMIN')}
            className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
              currentUser?.role === 'ADMIN' ? 'bg-indigo-600 text-white font-semibold' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            Admin Controller
          </button>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer shrink-0" onClick={() => onChangeTab('storefront')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 via-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-sky-900 to-indigo-900 bg-clip-text text-transparent">
                  Nila<span className="text-sky-600">Mart</span>
                </span>
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-700 tracking-wide uppercase">
                  C++20
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium">Enterprise E-Commerce Engine</p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-xl mx-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Search products by title, category, description..."
                value={searchQuery}
                onChange={e => onSearchChange(e.target.value)}
                className="w-full pl-10 pr-9 py-2 rounded-xl bg-slate-100 border border-transparent focus:border-sky-500 focus:bg-white focus:ring-3 focus:ring-sky-100 text-sm text-slate-800 placeholder-slate-400 transition-all outline-none"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Navigation Views & Actions */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* View Switching Navigation */}
            <nav className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => onChangeTab('storefront')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  currentTab === 'storefront'
                    ? 'bg-white text-sky-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Storefront
              </button>

              {currentUser && (
                <button
                  onClick={() => onChangeTab('orders')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                    currentTab === 'orders'
                      ? 'bg-white text-sky-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <PackageCheck className="w-3.5 h-3.5" />
                  My Orders
                </button>
              )}

              {(currentUser?.role === 'SELLER' || currentUser?.role === 'ADMIN') && (
                <button
                  onClick={() => onChangeTab('seller')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                    currentTab === 'seller'
                      ? 'bg-white text-amber-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Store className="w-3.5 h-3.5" />
                  Seller Studio
                </button>
              )}

              {currentUser?.role === 'ADMIN' && (
                <button
                  onClick={() => onChangeTab('admin')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                    currentTab === 'admin'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  Admin Hub
                </button>
              )}

              <button
                onClick={() => onChangeTab('codebase')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                  currentTab === 'codebase'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                C++ Architecture
              </button>
            </nav>

            {/* Wishlist Button */}
            <button
              onClick={onOpenWishlist}
              className="relative p-2 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
              title="Saved Wishlist"
            >
              <Heart className="w-5 h-5" />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                  {wishlistCount}
                </span>
              )}
            </button>

            {/* Cart Button */}
            <button
              onClick={onOpenCart}
              className="relative p-2 text-slate-700 hover:text-sky-600 hover:bg-sky-50 rounded-xl transition-colors flex items-center gap-1"
              title="Shopping Cart"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-sky-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-xs animate-bounce">
                  {cartCount}
                </span>
              )}
            </button>

            {/* User Account / Profile */}
            <div className="relative">
              {currentUser ? (
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition-colors border border-slate-200"
                >
                  <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 font-bold text-xs flex items-center justify-center">
                    {currentUser.name.charAt(0)}
                  </div>
                  <div className="text-left hidden lg:block pr-1">
                    <p className="text-xs font-semibold text-slate-800 leading-tight">{currentUser.name.split(' ')[0]}</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">{currentUser.role}</p>
                  </div>
                </button>
              ) : (
                <button
                  onClick={onOpenAuth}
                  className="px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-medium shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <UserIcon className="w-3.5 h-3.5" />
                  Sign In
                </button>
              )}

              {/* User Dropdown */}
              {showUserMenu && currentUser && (
                <div
                  className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                  onClick={() => setShowUserMenu(false)}
                >
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-900">{currentUser.name}</p>
                    <p className="text-[11px] text-slate-500 truncate">{currentUser.email}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-50 text-sky-700">
                      Role: {currentUser.role}
                    </span>
                  </div>

                  <div className="py-1">
                    {onOpenProfile && (
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          onOpenProfile();
                        }}
                        className="w-full px-4 py-2 text-left text-xs text-sky-700 hover:bg-sky-50 flex items-center gap-2 font-semibold"
                      >
                        <UserIcon className="w-4 h-4 text-sky-600" />
                        My Profile &amp; PostgreSQL Record
                      </button>
                    )}
                    <button
                      onClick={() => onChangeTab('orders')}
                      className="w-full px-4 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <PackageCheck className="w-4 h-4 text-slate-400" />
                      My Orders & History
                    </button>
                    {(currentUser.role === 'SELLER' || currentUser.role === 'ADMIN') && (
                      <button
                        onClick={() => onChangeTab('seller')}
                        className="w-full px-4 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <Store className="w-4 h-4 text-amber-500" />
                        Seller Management Studio
                      </button>
                    )}
                    {currentUser.role === 'ADMIN' && (
                      <button
                        onClick={() => onChangeTab('admin')}
                        className="w-full px-4 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <Shield className="w-4 h-4 text-indigo-500" />
                        Admin Executive Hub
                      </button>
                    )}
                    <button
                      onClick={() => onChangeTab('codebase')}
                      className="w-full px-4 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <Code2 className="w-4 h-4 text-emerald-500" />
                      C++ Drogon Codebase & Specs
                    </button>
                  </div>

                  <div className="border-t border-slate-100 pt-1">
                    <button
                      onClick={onLogout}
                      className="w-full px-4 py-2 text-left text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-medium"
                    >
                      <LogOut className="w-4 h-4 text-rose-400" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-2 overflow-x-auto py-2.5 scrollbar-none border-t border-slate-100">
          <button
            onClick={() => onSelectCategory(null)}
            className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              selectedCategoryId === null
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Categories
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                selectedCategoryId === cat.id
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};
