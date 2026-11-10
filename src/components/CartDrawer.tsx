import React from 'react';
import { X, Trash2, ShoppingBag, ArrowRight, ShieldCheck } from 'lucide-react';
import { CartResponse } from '../types';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartResponse | null;
  loading: boolean;
  onUpdateQuantity: (productId: number, quantity: number) => Promise<void>;
  onRemoveItem: (productId: number) => Promise<void>;
  onClearCart: () => Promise<void>;
  onProceedToCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cart,
  loading,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onProceedToCheckout
}) => {
  if (!isOpen) return null;

  const items = cart?.cart_items || [];
  const isEmpty = items.length === 0;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-end">
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-sky-50 text-sky-600">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Your Shopping Cart</h2>
              <p className="text-xs text-slate-500">
                {items.length} {items.length === 1 ? 'unique item' : 'unique items'} (Persisted in PostgreSQL)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cart Item List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {loading ? (
            <div className="text-center py-16 text-slate-400 text-xs">
              <span className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-sky-600 border-t-transparent mb-2" />
              <p>Fetching your PostgreSQL cart records...</p>
            </div>
          ) : isEmpty ? (
            <div className="text-center py-16 space-y-3">
              <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <p className="text-sm font-semibold text-slate-700">Your shopping cart is empty</p>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Explore our catalog to add gadgets, fashion, and home appliances.
              </p>
              <button
                onClick={onClose}
                className="mt-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold"
              >
                Start Shopping
              </button>
            </div>
          ) : (
            items.map(item => (
              <div
                key={item.id}
                className="flex gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200/80 items-center"
              >
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="w-16 h-16 rounded-xl object-cover bg-white shrink-0 border border-slate-200"
                />

                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 truncate">{item.name}</h4>
                  <p className="text-xs font-semibold text-slate-600 mt-0.5">
                    ${item.price.toFixed(2)} each
                  </p>

                  <div className="flex items-center justify-between mt-2">
                    {/* Quantity Selector */}
                    <div className="flex items-center border border-slate-200 rounded-lg bg-white">
                      <button
                        onClick={() => onUpdateQuantity(item.product_id, item.quantity - 1)}
                        className="px-2 py-0.5 text-xs text-slate-500 hover:text-slate-800"
                      >
                        -
                      </button>
                      <span className="px-2 text-xs font-bold text-slate-800">{item.quantity}</span>
                      <button
                        onClick={() => onUpdateQuantity(item.product_id, item.quantity + 1)}
                        disabled={item.quantity >= item.stock_quantity}
                        className="px-2 py-0.5 text-xs text-slate-500 hover:text-slate-800 disabled:opacity-30"
                      >
                        +
                      </button>
                    </div>

                    <span className="text-xs font-black text-slate-900">
                      ${item.subtotal.toFixed(2)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => onRemoveItem(item.product_id)}
                  className="p-2 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-white transition-colors"
                  title="Remove item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Drawer Footer & Checkout Breakdown */}
        {!isEmpty && (
          <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50/50 space-y-3">
            <div className="space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-slate-900">${cart?.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>
                  {cart?.shipping === 0 ? (
                    <span className="text-emerald-600 font-semibold">FREE</span>
                  ) : (
                    `$${cart?.shipping.toFixed(2)}`
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Estimated Tax (8%)</span>
                <span>${cart?.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-200">
                <span>Grand Total</span>
                <span className="text-base text-sky-600">${cart?.total_amount.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={onProceedToCheckout}
              className="w-full py-3.5 px-4 rounded-2xl bg-sky-600 hover:bg-sky-700 active:scale-98 text-white font-bold text-sm shadow-md shadow-sky-600/20 flex items-center justify-center gap-2 transition-all"
            >
              Proceed to Checkout
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                ACID Transaction Protected
              </span>
              <button
                onClick={onClearCart}
                className="text-rose-500 hover:underline"
              >
                Clear Cart
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
