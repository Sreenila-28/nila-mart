import React, { useState, useEffect } from 'react';
import {
  X,
  Star,
  ShoppingCart,
  Heart,
  Truck,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  MessageSquarePlus,
  Send,
  Calendar,
  UserCheck
} from 'lucide-react';
import { Product, Review, User } from '../types';
import { api } from '../services/api';

interface ProductDetailModalProps {
  product: Product | null;
  currentUser: User | null;
  isInWishlist: boolean;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number) => Promise<void>;
  onToggleWishlist: (productId: number) => void;
  onOpenAuth: () => void;
  onProductUpdated?: () => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  currentUser,
  isInWishlist,
  onClose,
  onAddToCart,
  onToggleWishlist,
  onOpenAuth,
  onProductUpdated
}) => {
  const [quantity, setQuantity] = useState(1);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [addedSuccess, setAddedSuccess] = useState(false);

  // Review Form State
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewSuccess, setReviewSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (product) {
      setQuantity(1);
      setReviewError(null);
      setReviewSuccess(null);
      loadReviews(product.id);
    }
  }, [product]);

  const loadReviews = async (productId: number) => {
    setLoadingReviews(true);
    try {
      const res = await api.getProductReviews(productId);
      if (res.success) {
        setReviews(res.reviews);
      }
    } catch (err) {
      console.error('Failed to load reviews:', err);
    } finally {
      setLoadingReviews(false);
    }
  };

  if (!product) return null;

  const handleAddToCart = async () => {
    if (product.stock_quantity <= 0) return;
    setAddingToCart(true);
    try {
      await onAddToCart(product, quantity);
      setAddedSuccess(true);
      setTimeout(() => setAddedSuccess(false), 2000);
    } finally {
      setAddingToCart(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    if (!newComment.trim()) {
      setReviewError('Please write a comment describing your experience with this item.');
      return;
    }

    setSubmittingReview(true);
    setReviewError(null);
    setReviewSuccess(null);

    try {
      const res = await api.submitReview(product.id, newRating, newComment);
      if (res.success) {
        setReviewSuccess('Review saved successfully to PostgreSQL database!');
        setNewComment('');
        await loadReviews(product.id);
        if (onProductUpdated) onProductUpdated();
      }
    } catch (err: any) {
      setReviewError(err.message || 'Only buyers who previously purchased this item can write a review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 sm:p-8">
          {/* Image & Guarantee Highlights */}
          <div className="space-y-4">
            <div className="aspect-square rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 relative">
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => onToggleWishlist(product.id)}
                className={`absolute top-4 right-4 p-3 rounded-full backdrop-blur-md transition-all ${
                  isInWishlist
                    ? 'bg-rose-500 text-white shadow-lg'
                    : 'bg-white/80 text-slate-700 hover:bg-white hover:text-rose-500'
                }`}
              >
                <Heart className={`w-5 h-5 ${isInWishlist ? 'fill-current' : ''}`} />
              </button>
            </div>

            {/* Buyer Trust Guarantees */}
            <div className="grid grid-cols-2 gap-3 text-xs text-slate-600">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2">
                <Truck className="w-4 h-4 text-sky-600 shrink-0" />
                <span>Free shipping on orders over $50</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>30-Day Money Back Guarantee</span>
              </div>
            </div>
          </div>

          {/* Product Details & Actions */}
          <div className="flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-sky-600 uppercase tracking-wider">
                <span>{product.category_name}</span>
                <span className="text-slate-300">•</span>
                <span className="text-slate-500 font-normal">Sold by {product.seller_name}</span>
              </div>

              <h1 className="text-2xl font-black text-slate-900 mt-2 leading-tight">
                {product.name}
              </h1>

              {/* Rating Summary */}
              <div className="flex items-center gap-2 mt-3">
                <div className="flex items-center text-amber-400">
                  {[1, 2, 3, 4, 5].map(star => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${
                        (product.avg_rating || 0) >= star
                          ? 'fill-current text-amber-400'
                          : 'text-slate-200'
                      }`}
                    />
                  ))}
                  <span className="ml-2 font-bold text-slate-900 text-sm">
                    {product.avg_rating ? product.avg_rating.toFixed(1) : '5.0'}
                  </span>
                </div>
                <span className="text-xs text-slate-400 font-medium">
                  ({reviews.length} customer ratings)
                </span>
              </div>

              {/* Price */}
              <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/60 flex items-baseline gap-3">
                <span className="text-3xl font-black text-slate-900">
                  ${product.price.toFixed(2)}
                </span>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                  In Stock: {product.stock_quantity} units
                </span>
              </div>

              {/* Description */}
              <div className="mt-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Overview</h4>
                <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                  {product.description}
                </p>
              </div>

              {/* Timestamp record notice */}
              <div className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-400">
                <Calendar className="w-3.5 h-3.5" />
                <span>Listed on {new Date(product.created_at).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Purchase Operations */}
            <div className="mt-6 pt-6 border-t border-slate-100">
              <div className="flex items-center gap-4 mb-4">
                <span className="text-xs font-bold text-slate-700 uppercase">Quantity</span>
                <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    className="px-3 py-1.5 text-slate-600 hover:text-slate-900 disabled:opacity-40"
                  >
                    -
                  </button>
                  <span className="px-3 py-1.5 text-sm font-bold text-slate-800">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                    disabled={quantity >= product.stock_quantity}
                    className="px-3 py-1.5 text-slate-600 hover:text-slate-900 disabled:opacity-40"
                  >
                    +
                  </button>
                </div>
                <span className="text-xs text-slate-400">
                  Total: ${(product.price * quantity).toFixed(2)}
                </span>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={product.stock_quantity <= 0 || addingToCart}
                className={`w-full py-3.5 px-6 rounded-2xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 ${
                  product.stock_quantity <= 0
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : addedSuccess
                    ? 'bg-emerald-600 text-white'
                    : 'bg-sky-600 hover:bg-sky-700 text-white active:scale-98'
                }`}
              >
                {addedSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Added to Shopping Cart!
                  </>
                ) : addingToCart ? (
                  <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    <ShoppingCart className="w-4 h-4" />
                    Add {quantity} to Cart
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Customer Reviews & Verification Section */}
        <div className="border-t border-slate-200 bg-slate-50/50 p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-sky-600" />
                Verified Buyer Reviews & Ratings
              </h2>
              <p className="text-xs text-slate-500">
                Only verified purchasers from PostgreSQL orders can submit reviews
              </p>
            </div>
          </div>

          {/* Write Review Form */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-8 shadow-xs">
            <h3 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-1.5">
              <MessageSquarePlus className="w-4 h-4 text-sky-600" />
              Write a Product Review
            </h3>

            {reviewSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                {reviewSuccess}
              </div>
            )}

            {reviewError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                {reviewError}
              </div>
            )}

            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-700">Rating:</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setNewRating(star)}
                      className="p-1 text-slate-300 hover:text-amber-400 transition-colors"
                    >
                      <Star
                        className={`w-5 h-5 ${
                          newRating >= star ? 'fill-current text-amber-400' : 'text-slate-300'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-slate-700 ml-2">{newRating} Stars</span>
                </div>
              </div>

              <div>
                <textarea
                  rows={3}
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  placeholder="Share details about product build quality, battery, performance, or fit..."
                  className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-100 text-xs text-slate-800 outline-none"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  {currentUser ? `Posting as: ${currentUser.name}` : 'Login required to submit verified review'}
                </span>

                <button
                  type="submit"
                  disabled={submittingReview}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-sky-600 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  {submittingReview ? (
                    <span className="inline-block animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent" />
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      Submit Review
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Reviews List */}
          <div className="space-y-4">
            {loadingReviews ? (
              <div className="text-center py-8 text-xs text-slate-400">Loading verified reviews...</div>
            ) : reviews.length === 0 ? (
              <div className="text-center py-8 bg-white rounded-2xl border border-dashed border-slate-300 text-slate-500 text-xs">
                No reviews yet for this product. Be the first verified buyer to leave one!
              </div>
            ) : (
              reviews.map(rev => (
                <div
                  key={rev.id}
                  className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2 shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-sky-100 text-sky-700 text-xs font-bold flex items-center justify-center">
                        {rev.buyer_name?.charAt(0) || 'U'}
                      </div>
                      <span className="text-xs font-bold text-slate-800">{rev.buyer_name}</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        Verified Purchase
                      </span>
                    </div>

                    <span className="text-[11px] text-slate-400">
                      {new Date(rev.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex items-center text-amber-400 gap-0.5">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star
                        key={s}
                        className={`w-3.5 h-3.5 ${
                          rev.rating >= s ? 'fill-current text-amber-400' : 'text-slate-200'
                        }`}
                      />
                    ))}
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">{rev.comment}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
