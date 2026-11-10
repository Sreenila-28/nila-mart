import React, { useState, useEffect } from 'react';
import {
  Package,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Truck,
  ChevronDown,
  ChevronUp,
  Star,
  History,
  ShieldAlert
} from 'lucide-react';
import { Order } from '../types';
import { api } from '../services/api';

interface BuyerOrdersViewProps {
  onReviewProduct?: (productId: number) => void;
}

export const BuyerOrdersView: React.FC<BuyerOrdersViewProps> = ({ onReviewProduct }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
  const [orderDetails, setOrderDetails] = useState<{ [orderId: number]: Order }>({});
  const [loadingDetails, setLoadingDetails] = useState<number | null>(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await api.getBuyerOrders();
      if (res.success) {
        setOrders(res.orders);
        if (res.orders.length > 0) {
          // auto expand first order
          loadOrderDetails(res.orders[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadOrderDetails = async (orderId: number) => {
    if (expandedOrderId === orderId) {
      setExpandedOrderId(null);
      return;
    }
    setExpandedOrderId(orderId);
    if (!orderDetails[orderId]) {
      setLoadingDetails(orderId);
      try {
        const res = await api.getOrderDetails(orderId);
        if (res.success) {
          setOrderDetails(prev => ({ ...prev, [orderId]: res.order }));
        }
      } catch (err) {
        console.error('Failed to load order details:', err);
      } finally {
        setLoadingDetails(null);
      }
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'SHIPPED':
        return 'bg-sky-100 text-sky-800 border-sky-200';
      case 'CONFIRMED':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'PENDING':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'CANCELLED':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-sky-50 text-sky-600">
              <Package className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-black text-slate-900">My Orders & Purchase History</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real PostgreSQL transaction history with ISO 8601 server timestamps
          </p>
        </div>

        <button
          onClick={loadOrders}
          className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1.5 self-start"
        >
          <History className="w-3.5 h-3.5 text-slate-400" />
          Refresh Orders
        </button>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 text-slate-400 text-xs">
          <span className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-sky-600 border-t-transparent mb-2" />
          <p>Querying orders from PostgreSQL...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 space-y-3">
          <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
            <Package className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No orders placed yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Browse our catalog, add items to cart, and checkout to view your order tracking here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => {
            const isExpanded = expandedOrderId === order.id;
            const details = orderDetails[order.id] || order;

            return (
              <div
                key={order.id}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs transition-all"
              >
                {/* Summary Card Header */}
                <div
                  onClick={() => loadOrderDetails(order.id)}
                  className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/70 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-mono font-bold text-xs shrink-0">
                      #{order.id}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">
                          Order #{order.id}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getStatusBadge(
                            order.status
                          )}`}
                        >
                          {order.status}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {new Date(order.created_at).toLocaleDateString()} at{' '}
                          {new Date(order.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        <span>•</span>
                        <span>{order.items?.length || 1} items</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-xs text-slate-400">Total Amount</p>
                      <p className="text-base font-extrabold text-slate-900">
                        ${order.total_amount.toFixed(2)}
                      </p>
                    </div>

                    <button className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/50">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50/50 p-4 sm:p-6 space-y-6">
                    {loadingDetails === order.id ? (
                      <div className="text-center py-6 text-xs text-slate-400">
                        Loading detailed order items and audit history...
                      </div>
                    ) : (
                      <>
                        {/* Order Status History Timeline */}
                        <div>
                          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-sky-600" />
                            Order Transition History (order_status_history)
                          </h4>

                          <div className="bg-white rounded-xl border border-slate-200 p-4">
                            {details.history && details.history.length > 0 ? (
                              <div className="space-y-3">
                                {details.history.map((hist, i) => (
                                  <div key={hist.id || i} className="flex items-start gap-3 text-xs">
                                    <div className="w-2 h-2 rounded-full bg-sky-500 mt-1 shrink-0" />
                                    <div className="flex-1">
                                      <span className="font-bold text-slate-800">
                                        Status set to {hist.new_status}
                                      </span>
                                      {hist.old_status && (
                                        <span className="text-slate-400 ml-1">
                                          (from {hist.old_status})
                                        </span>
                                      )}
                                      <p className="text-[11px] text-slate-400">
                                        Logged by {hist.changed_by_name || 'System'} on{' '}
                                        {new Date(hist.changed_at).toLocaleString()}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-slate-400">No status changes logged yet.</p>
                            )}
                          </div>
                        </div>

                        {/* Order Items Table */}
                        <div>
                          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                            Items in this Order
                          </h4>

                          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
                            {details.items?.map(item => (
                              <div
                                key={item.id}
                                className="p-3.5 flex items-center justify-between gap-4"
                              >
                                <div className="flex items-center gap-3">
                                  {item.image_url && (
                                    <img
                                      src={item.image_url}
                                      alt={item.product_name}
                                      className="w-12 h-12 rounded-lg object-cover bg-slate-100"
                                    />
                                  )}
                                  <div>
                                    <p className="text-xs font-bold text-slate-900">
                                      {item.product_name}
                                    </p>
                                    <p className="text-[11px] text-slate-500">
                                      Quantity: {item.quantity} × ${item.unit_price.toFixed(2)}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-4">
                                  <span className="text-xs font-black text-slate-900">
                                    ${item.subtotal.toFixed(2)}
                                  </span>

                                  {onReviewProduct && item.product_id && (
                                    <button
                                      onClick={() => onReviewProduct(item.product_id)}
                                      className="px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-semibold flex items-center gap-1 transition-colors"
                                    >
                                      <Star className="w-3 h-3 fill-current text-amber-500" />
                                      Review
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Delivery Info */}
                        <div className="text-xs text-slate-500 bg-white p-3.5 rounded-xl border border-slate-200">
                          <span className="font-bold text-slate-700">Delivery Address: </span>
                          {details.shipping_address || 'Standard Delivery Address'}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
