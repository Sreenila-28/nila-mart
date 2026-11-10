import React, { useState } from 'react';
import { Star, ShoppingCart, Heart, Check, AlertCircle } from 'lucide-react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  isInWishlist: boolean;
  onAddToCart: (product: Product) => Promise<void>;
  onToggleWishlist: (productId: number) => void;
  onOpenDetails: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  isInWishlist,
  onAddToCart,
  onToggleWishlist,
  onOpenDetails
}) => {
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  const handleAdd = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (product.stock_quantity <= 0) return;
    setAdding(true);
    try {
      await onAddToCart(product);
      setAdded(true);
      setTimeout(() => setAdded(false), 1500);
    } finally {
      setAdding(false);
    }
  };

  const handleHeart = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleWishlist(product.id);
  };

  const isLowStock = product.stock_quantity > 0 && product.stock_quantity <= 5;
  const isOutOfStock = product.stock_quantity === 0;

  return (
    <div
      onClick={() => onOpenDetails(product)}
      className="group relative bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg hover:border-slate-300 transition-all duration-200 flex flex-col cursor-pointer"
    >
      {/* Image Container */}
      <div className="relative aspect-4/3 w-full bg-slate-100 overflow-hidden">
        <img
          src={product.image_url}
          alt={product.name}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />

        {/* Wishlist Button */}
        <button
          onClick={handleHeart}
          className={`absolute top-2.5 right-2.5 p-2 rounded-full backdrop-blur-md transition-transform active:scale-90 ${
            isInWishlist
              ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30'
              : 'bg-white/80 text-slate-700 hover:bg-white hover:text-rose-500'
          }`}
          title={isInWishlist ? 'Remove from wishlist' : 'Save to wishlist'}
        >
          <Heart className={`w-4 h-4 ${isInWishlist ? 'fill-current' : ''}`} />
        </button>

        {/* Stock Badge */}
        {isOutOfStock ? (
          <span className="absolute bottom-2.5 left-2.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-900/80 backdrop-blur-md text-white flex items-center gap-1">
            <AlertCircle className="w-3 h-3 text-rose-400" />
            Out of Stock
          </span>
        ) : isLowStock ? (
          <span className="absolute bottom-2.5 left-2.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-500/90 backdrop-blur-md text-white animate-pulse">
            Only {product.stock_quantity} left!
          </span>
        ) : (
          <span className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded-md text-[10px] font-medium bg-emerald-500/80 backdrop-blur-md text-white">
            In Stock ({product.stock_quantity})
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Category & Seller */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1.5">
            <span className="font-semibold text-sky-600 uppercase tracking-wider">{product.category_name}</span>
            <span className="truncate max-w-[120px]">{product.seller_name}</span>
          </div>

          {/* Product Name */}
          <h3 className="text-sm font-bold text-slate-900 line-clamp-2 leading-snug group-hover:text-sky-600 transition-colors">
            {product.name}
          </h3>

          {/* Reviews & Star Rating */}
          <div className="flex items-center gap-1.5 mt-2">
            <div className="flex items-center text-amber-400">
              <Star className="w-3.5 h-3.5 fill-current" />
              <span className="text-xs font-bold text-slate-800 ml-1">
                {product.avg_rating && product.avg_rating > 0 ? product.avg_rating.toFixed(1) : 'New'}
              </span>
            </div>
            <span className="text-xs text-slate-400">
              ({product.review_count || 0} reviews)
            </span>
          </div>
        </div>

        {/* Price & Add to Cart button */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          <div>
            <p className="text-xs text-slate-400 font-medium leading-none">Price</p>
            <p className="text-lg font-extrabold text-slate-900 mt-0.5">
              ${product.price.toFixed(2)}
            </p>
          </div>

          <button
            onClick={handleAdd}
            disabled={isOutOfStock || adding}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs ${
              isOutOfStock
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : added
                ? 'bg-emerald-600 text-white'
                : 'bg-sky-600 hover:bg-sky-700 active:scale-95 text-white'
            }`}
          >
            {added ? (
              <>
                <Check className="w-3.5 h-3.5" />
                Added
              </>
            ) : adding ? (
              <span className="inline-block animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent" />
            ) : (
              <>
                <ShoppingCart className="w-3.5 h-3.5" />
                Add to Cart
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
