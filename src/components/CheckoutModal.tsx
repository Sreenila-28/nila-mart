import React, { useState } from 'react';
import {
  X,
  CreditCard,
  Truck,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Lock,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { CartResponse, User } from '../types';
import { api } from '../services/api';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartResponse | null;
  currentUser: User | null;
  onOrderSuccess: (orderId: number) => void;
  onOpenAuth: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  cart,
  currentUser,
  onOrderSuccess,
  onOpenAuth
}) => {
  const [address, setAddress] = useState('742 Evergreen Terrace, Springfield, OR 97477');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'upi' | 'cod'>('card');
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completedOrder, setCompletedOrder] = useState<{
    order_id: number;
    total_amount: number;
    status: string;
    created_at: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onOpenAuth();
      return;
    }

    if (!address.trim()) {
      setError('Please provide a complete shipping address');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await api.checkout(address);
      if (res.success) {
        setCompletedOrder({
          order_id: res.order_id,
          total_amount: res.total_amount,
          status: res.status,
          created_at: res.created_at
        });

        // Trigger victory confetti
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 }
        });

        onOrderSuccess(res.order_id);
      }
    } catch (err: any) {
      setError(err.message || 'Transaction failed. Stock has been rolled back safely.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {completedOrder ? (
          /* Success confirmation screen */
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <h2 className="text-2xl font-black text-slate-900">Order Placed Successfully!</h2>
              <p className="text-xs text-slate-500 mt-1">
                Committed to PostgreSQL database in an ACID transaction.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Order Number:</span>
                <span className="font-mono font-bold text-sky-600">#{completedOrder.order_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Initial Status:</span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-sky-100 text-sky-800">
                  {completedOrder.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Charged:</span>
                <span className="font-black text-slate-900 text-sm">
                  ${completedOrder.total_amount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Placed At (Server TIMESTAMPTZ):</span>
                <span className="font-mono text-slate-700">
                  {new Date(completedOrder.created_at).toLocaleString()}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-500">
              Your cart has been cleared and stock reduced safely in the database.
            </p>

            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-colors"
            >
              Back to Storefront
            </button>
          </div>
        ) : (
          /* Checkout Form */
          <div>
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 rounded-xl bg-sky-50 text-sky-600">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Secure Checkout</h2>
                <p className="text-xs text-slate-500">
                  Atomic transaction with row-level stock verification
                </p>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleCheckout} className="space-y-4">
              {/* Shipping Address */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1 flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-sky-600" />
                  Delivery Shipping Address
                </label>
                <textarea
                  rows={2}
                  required
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="Street, City, State, Postal Code"
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white focus:border-sky-500 outline-none"
                />
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-sky-600" />
                  Payment Method
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`p-2.5 rounded-xl border text-xs font-medium text-center transition-all ${
                      paymentMethod === 'card'
                        ? 'border-sky-500 bg-sky-50 text-sky-700 font-bold'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Credit / Debit Card
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('upi')}
                    className={`p-2.5 rounded-xl border text-xs font-medium text-center transition-all ${
                      paymentMethod === 'upi'
                        ? 'border-sky-500 bg-sky-50 text-sky-700 font-bold'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    UPI / QR Pay
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cod')}
                    className={`p-2.5 rounded-xl border text-xs font-medium text-center transition-all ${
                      paymentMethod === 'cod'
                        ? 'border-sky-500 bg-sky-50 text-sky-700 font-bold'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Cash on Delivery
                  </button>
                </div>
              </div>

              {paymentMethod === 'card' && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="text-[11px] text-slate-500 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-emerald-600" />
                    Simulated Sandbox Payment Card
                  </div>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={e => setCardNumber(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800"
                  />
                </div>
              )}

              {/* Order Summary Snapshot */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Cart Items ({cart?.cart_items.length || 0}):</span>
                  <span className="font-semibold text-slate-800">${cart?.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Tax (8%):</span>
                  <span>${cart?.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Shipping:</span>
                  <span>{cart?.shipping === 0 ? 'FREE' : `$${cart?.shipping.toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-200">
                  <span>Total Due:</span>
                  <span className="text-base text-sky-600">${cart?.total_amount.toFixed(2)}</span>
                </div>
              </div>

              {/* Action Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 px-4 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm shadow-lg shadow-sky-600/25 flex items-center justify-center gap-2 transition-all active:scale-98 disabled:opacity-50"
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    Committing Database Transaction...
                  </span>
                ) : (
                  <>
                    Confirm & Place Order (${cart?.total_amount.toFixed(2)})
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
