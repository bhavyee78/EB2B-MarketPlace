'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import axios from 'axios';
import { ArrowLeft, Calendar, Filter, Package, Clock, CheckCircle, XCircle, Loader } from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import FloatingAgentButton from '@/components/FloatingAgentButton';

interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  moqAtOrder: number;
  // Enhanced quantity fields
  initialPcQuantity?: number;
  initialCsQuantity?: number;
  netQuantity?: number;
  // Enhanced amount fields
  initialAmount?: number;
  billAmount?: number;
  netAmount?: number;
  product: {
    id: string;
    name: string;
    images: string[];
    packSize: string;
  };
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  currency: string;
  placedAt: string;
  items: OrderItem[];
  addOns?: {
    appliedOffers?: {
      offerId: string;
      offerName: string;
      type: string;
      discount: number;
    }[];
    totalDiscount?: number;
    originalAmount?: number;
    freeItems?: {
      productId: string;
      quantity: number;
    }[];
  };
}

const statusConfig = {
  PENDING: { color: 'bg-orange-100 text-orange-800', icon: Clock, label: 'Pending' },
  CONFIRMED: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle, label: 'Confirmed' },
  PROCESSING: { color: 'bg-purple-100 text-purple-800', icon: Loader, label: 'Processing' },
  SHIPPED: { color: 'bg-green-100 text-green-800', icon: Package, label: 'Shipped' },
  DELIVERED: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Delivered' },
  CANCELLED: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Cancelled' },
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('ALL');
  const [showFilters, setShowFilters] = useState(false);

  // Helper function to convert relative URLs to full URLs
  const getImageUrl = (imageUrl: string) => {
    if (!imageUrl) return '/placeholder.jpg';
    if (imageUrl.startsWith('http')) return imageUrl;
    // Convert relative paths to full backend URLs
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    return `${backendUrl}${imageUrl}`;
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [orders, statusFilter, dateFilter]);

  const fetchOrders = async () => {
    try {
      const response = await axios.get('/api/orders');
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...orders];

    // Status filter
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    // Date filter
    if (dateFilter !== 'ALL') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (dateFilter) {
        case 'TODAY':
          filterDate.setHours(0, 0, 0, 0);
          filtered = filtered.filter(order => new Date(order.placedAt) >= filterDate);
          break;
        case 'WEEK':
          filterDate.setDate(now.getDate() - 7);
          filtered = filtered.filter(order => new Date(order.placedAt) >= filterDate);
          break;
        case 'MONTH':
          filterDate.setMonth(now.getMonth() - 1);
          filtered = filtered.filter(order => new Date(order.placedAt) >= filterDate);
          break;
        case '3MONTHS':
          filterDate.setMonth(now.getMonth() - 3);
          filtered = filtered.filter(order => new Date(order.placedAt) >= filterDate);
          break;
      }
    }

    setFilteredOrders(filtered);
  };

  const getStatusConfig = (status: string) => {
    return statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const safeNumber = (value: any): number => {
    if (typeof value === 'number') return value;
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  };

  // Helper function to get free item quantity for a specific product in an order
  const getFreeItemQuantityForProduct = (order: Order, productId: string): number => {
    if (!order.addOns?.freeItems) return 0;
    const freeItem = order.addOns.freeItems.find(item => item.productId === productId);
    return freeItem ? freeItem.quantity : 0;
  };

  // Helper function to check if an order has discount offers
  const hasDiscountOffers = (order: Order): boolean => {
    return !!(order.addOns?.appliedOffers?.some(offer => 
      offer.type === 'PERCENT_OFF' || offer.type === 'AMOUNT_OFF'
    ));
  };

  // Helper function to check if an order has free item offers
  const hasFreeItemOffers = (order: Order): boolean => {
    return !!(order.addOns?.freeItems && order.addOns.freeItems.length > 0);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading your orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Link href="/marketplace" className="p-2 hover:bg-gray-100 rounded-lg">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-lg overflow-hidden">
                  <Image
                    src="/logo.jpeg"
                    alt="Premier Logo"
                    width={48}
                    height={48}
                    className="object-contain w-full h-full"
                  />
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-lg transition ${showFilters ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
            >
              <Filter className="w-5 h-5" />
            </button>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t space-y-4">
              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <div className="flex flex-wrap gap-2">
                  {['ALL', 'PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((status) => (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(status)}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                        statusFilter === status
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {status === 'ALL' ? 'All' : getStatusConfig(status).label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: 'ALL', label: 'All Time' },
                    { key: 'TODAY', label: 'Today' },
                    { key: 'WEEK', label: 'Past Week' },
                    { key: 'MONTH', label: 'Past Month' },
                    { key: '3MONTHS', label: 'Past 3 Months' }
                  ].map((date) => (
                    <button
                      key={date.key}
                      onClick={() => setDateFilter(date.key)}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                        dateFilter === date.key
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {date.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Orders List */}
      <div className="px-4 py-4">
        {!orders || filteredOrders.length === 0 ? (
          <div className="text-center py-20">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {orders.length === 0 ? 'No orders yet' : 'No orders match your filters'}
            </h3>
            <p className="text-gray-600 mb-6">
              {orders.length === 0 
                ? 'Start shopping to see your orders here!'
                : 'Try adjusting your filters to see more orders.'
              }
            </p>
            <Link
              href="/marketplace"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.filter(order => order && order.id).map((order) => {
              const statusInfo = getStatusConfig(order.status || 'PENDING');
              const StatusIcon = statusInfo.icon;

              return (
                <div key={order.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                  {/* Order Header */}
                  <div className="p-4 border-b bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <span className="font-mono text-sm bg-gray-200 px-2 py-1 rounded">
                          {order.orderNumber}
                        </span>
                        <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          <span>{statusInfo.label}</span>
                        </div>
                      </div>
                      <span className="font-semibold text-lg">£{safeNumber(order.totalAmount).toFixed(2)}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="w-4 h-4 mr-1" />
                      <span>Placed on {formatDate(order.placedAt)}</span>
                      <span className="mx-2">•</span>
                      <span>{order.items?.length || 0} {(order.items?.length || 0) === 1 ? 'item' : 'items'}</span>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="p-4">
                    <div className="space-y-3">
                      {(order.items || []).map((item) => {
                        const freeQuantity = getFreeItemQuantityForProduct(order, item.product?.id || '');
                        const totalAfterFree = (item.netQuantity || item.quantity || 0) + freeQuantity;
                        
                        return (
                          <div key={item.id} className="border rounded-lg p-4 space-y-3">
                            <div className="flex items-start space-x-3">
                              <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                <Image
                                  src={getImageUrl(item.product?.images?.[0] || '')}
                                  alt={item.product?.name || 'Product'}
                                  width={64}
                                  height={64}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-gray-900 mb-2">{item.product?.name || 'Unknown Product'}</h4>
                                
                                {/* Quantity Breakdown */}
                                <div className="space-y-1 text-sm text-gray-600 mb-3">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <span className="font-medium">PC Quantity:</span> {item.initialPcQuantity || 0} units
                                    </div>
                                    <div>
                                      <span className="font-medium">CS Quantity:</span> {item.initialCsQuantity || 0} cases
                                    </div>
                                  </div>
                                  <div>
                                    <span className="font-medium">Total (in PCs):</span> {item.netQuantity || item.quantity || 0} pieces
                                  </div>
                                  {hasFreeItemOffers(order) && freeQuantity > 0 && (
                                    <div className="text-green-600">
                                      <span className="font-medium">+ Free Items:</span> {freeQuantity} pieces
                                    </div>
                                  )}
                                  {hasFreeItemOffers(order) && (
                                    <div className="font-medium text-blue-600">
                                      <span>Final Total:</span> {totalAfterFree} pieces
                                    </div>
                                  )}
                                </div>

                                {/* Amount Breakdown */}
                                <div className="space-y-1 text-sm">
                                  <div className="text-gray-600">
                                    <span className="font-medium">Amount before discount:</span> £{safeNumber(item.initialAmount || (item.quantity * item.unitPrice)).toFixed(2)}
                                  </div>
                                  {hasDiscountOffers(order) && (
                                    <div className="text-green-600">
                                      <span className="font-medium">Amount after discount:</span> £{safeNumber(item.billAmount || item.netAmount || (item.quantity * item.unitPrice)).toFixed(2)}
                                    </div>
                                  )}
                                  {!hasDiscountOffers(order) && (
                                    <div className="text-gray-900 font-medium">
                                      <span>Total Amount:</span> £{safeNumber(item.netAmount || item.billAmount || (item.quantity * item.unitPrice)).toFixed(2)}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <BottomNav />
      <FloatingAgentButton />
    </div>
  );
}