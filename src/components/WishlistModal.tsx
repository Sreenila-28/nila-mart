import React from 'react';
import { X, Heart, ShoppingCart, Trash2, ArrowRight } from 'lucide-react';
import { WishlistItem, Product } from '../types';

interface WishlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  wishlist: WishlistItem[];
  onRemove: (productId: number) => void;
  onAddToCart: (product: Product) => void;
  products: Product[];
}

export const WishlistModal: React.FC<WishlistModalProps> = ({
  isOpen,
  onClose,
  wishlist,
  onRemove,
  onAddToCart,
  products
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-6">
          <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
            <Heart className="w-5 h-5 fill-current" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Your Saved Wishlist</h2>
            <p className="text-xs text-slate-500">
              {wishlist.length} {wishlist.length === 1 ? 'item' : 'items'} saved in PostgreSQL
            </p>
          </div>
        </div>

        {wishlist.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
              <Heart className="w-7 h-7" />
            </div>
            <p className="text-sm font-semibold text-slate-700">Your wishlist is empty</p>
            <p className="text-xs text-slate-400">Click the heart icon on any product to save it here.</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {wishlist.map(item => {
              const fullProd = products.find(p => p.id === item.product_id);
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200"
                >
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-14 h-14 rounded-xl object-cover bg-white shrink-0 border border-slate-200"
                  />

                  <div className="flex-1 min-w-0 text-xs">
                    <h4 className="font-bold text-slate-900 truncate">{item.name}</h4>
                    <p className="font-black text-slate-900 mt-0.5">${item.price.toFixed(2)}</p>
                    <p className="text-[10px] text-slate-400">
                      Saved {new Date(item.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {fullProd && (
                      <button
                        onClick={() => onAddToCart(fullProd)}
                        className="p-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold flex items-center gap-1"
                        title="Move to Cart"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => onRemove(item.product_id)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-white"
                      title="Remove from wishlist"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
