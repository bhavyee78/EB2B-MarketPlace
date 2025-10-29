'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import axios from 'axios';
import { 
  TrendingUp, 
  ShoppingCart, 
  DollarSign, 
  Package,
  Globe,
  BarChart3,
  Menu,
  Home,
  Users,
  Settings,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Loader,
  Calendar,
  Search,
  Filter,
  ChevronDown,
  Upload,
  Edit3,
  Trash,
  Plus,
  Move,
  Eye,
  EyeOff,
  Gift
} from 'lucide-react';

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
  user: {
    id: string;
    fullName: string;
    email: string;
    companyName: string;
  };
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

interface Banner {
  id: string;
  title?: string;
  description?: string;
  imageUrl: string;
  linkUrl?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

const statusConfig = {
  DRAFT: { color: 'bg-gray-100 text-gray-800', icon: Clock, label: 'Draft' },
  PENDING: { color: 'bg-orange-100 text-orange-800', icon: Clock, label: 'Pending' },
  CONFIRMED: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle, label: 'Confirmed' },
  PACKED: { color: 'bg-purple-100 text-purple-800', icon: Package, label: 'Packed' },
  IN_TRANSIT: { color: 'bg-yellow-100 text-yellow-800', icon: Loader, label: 'In Transit' },
  DELIVERED: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Delivered' },
  CANCELLED: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Cancelled' },
};

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [kpis, setKpis] = useState<any>(null);
  const [period, setPeriod] = useState('last30d');
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [selectedBanner, setSelectedBanner] = useState<Banner | null>(null);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [showBannerModal, setShowBannerModal] = useState(false);

  // Helper function to convert relative URLs to full URLs
  const getImageUrl = (imageUrl: string | string[]) => {
    const url = Array.isArray(imageUrl) ? imageUrl[0] : imageUrl;
    if (!url) return '/placeholder.jpg';
    if (url.startsWith('http')) return url;
    // Convert relative paths to full backend URLs
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    return `${backendUrl}${url}`;
  };
  
  // Collection Images Management
  const [collections, setCollections] = useState<string[]>([]);
  const [collectionImages, setCollectionImages] = useState<any[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<string>('');
  const [uploadingCollection, setUploadingCollection] = useState<string>('');

  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetchKpis();
    } else if (activeTab === 'orders') {
      fetchOrders();
    } else if (activeTab === 'marketplace') {
      fetchBanners();
      fetchCollections();
      fetchCollectionImages();
    }
  }, [activeTab, period]);

  const fetchKpis = async () => {
    try {
      const response = await axios.get(`/api/sales/kpis?period=${period}`);
      setKpis(response.data);
    } catch (error) {
      console.error('Error fetching KPIs:', error);
    }
  };

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get('/api/orders/admin/all', {
        params: {
          status: statusFilter === 'ALL' ? undefined : statusFilter,
          limit: 100,
          offset: 0
        }
      });
      setOrders(response.data.orders || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    setUpdatingStatus(orderId);
    try {
      await axios.put(`/api/orders/admin/${orderId}/status`, { status: newStatus });
      await fetchOrders(); // Refresh orders list
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Failed to update order status');
    } finally {
      setUpdatingStatus(null);
    }
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

  const safeNumber = (value: any): number => {
    if (typeof value === 'number') return value;
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  };

  const fetchBanners = async () => {
    try {
      const response = await axios.get('/api/banners');
      setBanners(response.data);
    } catch (error) {
      console.error('Error fetching banners:', error);
    }
  };

  const fetchCollections = async () => {
    try {
      const response = await axios.get('/api/products/collections');
      setCollections(response.data);
    } catch (error) {
      console.error('Error fetching collections:', error);
    }
  };

  const fetchCollectionImages = async () => {
    try {
      const response = await axios.get('/api/collection-images');
      if (response.data.success) {
        setCollectionImages(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching collection images:', error);
    }
  };

  const handleBannerUpload = async (file: File, bannerData: { title?: string; description?: string; linkUrl?: string }) => {
    setIsUploadingBanner(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      console.log('Uploading banner image...');
      const uploadResponse = await axios.post('/api/banners/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      console.log('Upload response:', uploadResponse.data);
      const imageUrl = uploadResponse.data.imageUrl;
      
      console.log('Creating banner record...');
      await axios.post('/api/banners', {
        ...bannerData,
        imageUrl,
        sortOrder: banners.length
      });
      
      console.log('Banner created successfully');
      await fetchBanners();
      setShowBannerModal(false);
    } catch (error: any) {
      console.error('Error uploading banner:', error);
      alert(`Failed to upload banner: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsUploadingBanner(false);
    }
  };

  const toggleBannerStatus = async (bannerId: string, isActive: boolean) => {
    try {
      await axios.put(`/api/banners/${bannerId}`, { isActive });
      await fetchBanners();
    } catch (error) {
      console.error('Error updating banner status:', error);
    }
  };

  const deleteBanner = async (bannerId: string) => {
    if (window.confirm('Are you sure you want to delete this banner?')) {
      try {
        await axios.delete(`/api/banners/${bannerId}`);
        await fetchBanners();
      } catch (error) {
        console.error('Error deleting banner:', error);
      }
    }
  };

  const handleCollectionImageUpload = async (collection: string, file: File) => {
    setUploadingCollection(collection);
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      await axios.post(`/api/collection-images/upload/${collection}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      await fetchCollectionImages();
    } catch (error: any) {
      console.error('Error uploading collection image:', error);
      alert(`Failed to upload image: ${error.response?.data?.message || error.message}`);
    } finally {
      setUploadingCollection('');
    }
  };

  const deleteCollectionImage = async (collection: string) => {
    if (window.confirm(`Are you sure you want to delete the image for ${collection}?`)) {
      try {
        await axios.delete(`/api/collection-images/${collection}`);
        await fetchCollectionImages();
      } catch (error) {
        console.error('Error deleting collection image:', error);
      }
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = !searchTerm || 
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.user.companyName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const sidebarItems = [
    { key: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { key: 'orders', label: 'Orders', icon: FileText },
    { key: 'products', label: 'Products', icon: Package },
    { key: 'features', label: 'Features', icon: TrendingUp },
    { key: 'offers', label: 'Offers', icon: Gift },
    { key: 'marketplace', label: 'Marketplace', icon: Home },
    { key: 'users', label: 'Users', icon: Users },
    { key: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={`bg-white shadow-lg transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-16'}`}>
        <div className="p-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-lg overflow-hidden">
              <Image
                src="/logo.jpeg"
                alt="Premier Logo"
                width={48}
                height={48}
                className="object-contain w-full h-full"
              />
            </div>
            {sidebarOpen && <h1 className="text-xl font-bold">Admin Dashboard</h1>}
          </div>
        </div>

        <nav className="mt-8">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.key;
            
            return (
              <button
                key={item.key}
                onClick={() => setActiveTab(item.key)}
                className={`w-full flex items-center space-x-3 px-4 py-3 text-left transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className="w-5 h-5" />
                {sidebarOpen && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-semibold capitalize">{activeTab}</h2>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-6 h-full overflow-auto">
          {activeTab === 'dashboard' && (
            <div>
              {/* Period Selector */}
              <div className="mb-6">
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="px-4 py-2 border rounded-lg"
                >
                  <option value="last7d">Last 7 Days</option>
                  <option value="last30d">Last 30 Days</option>
                  <option value="last90d">Last 90 Days</option>
                </select>
              </div>

              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-green-100 rounded-lg">
                      <DollarSign className="w-6 h-6 text-green-600" />
                    </div>
                    <TrendingUp className="w-5 h-5 text-green-500" />
                  </div>
                  <p className="text-gray-600 text-sm">Gross Merchandise Value</p>
                  <p className="text-3xl font-bold">£{kpis?.gmv?.toLocaleString() || 0}</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <ShoppingCart className="w-6 h-6 text-blue-600" />
                    </div>
                    <TrendingUp className="w-5 h-5 text-blue-500" />
                  </div>
                  <p className="text-gray-600 text-sm">Total Orders</p>
                  <p className="text-3xl font-bold">{kpis?.orders || 0}</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <BarChart3 className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm">Average Order Value</p>
                  <p className="text-3xl font-bold">£{kpis?.aov?.toFixed(2) || 0}</p>
                </div>
              </div>

              {/* Top Products and Countries */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm">
                  <div className="flex items-center mb-4">
                    <Package className="w-5 h-5 mr-2 text-gray-600" />
                    <h2 className="text-xl font-semibold">Top Products</h2>
                  </div>
                  <div className="space-y-3">
                    {kpis?.topProducts && kpis.topProducts.length > 0 ? (
                      kpis.topProducts.map((item: any, index: number) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium">{item.product?.name || 'Unknown Product'}</p>
                            <p className="text-sm text-gray-500">SKU: {item.product?.sku || 'N/A'}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">£{item.revenue?.toLocaleString() || '0'}</p>
                            <p className="text-sm text-gray-500">{item.unitsSold || 0} units</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex items-center justify-center p-6 text-gray-500">
                        <p>No product sales data available</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm">
                  <div className="flex items-center mb-4">
                    <Users className="w-5 h-5 mr-2 text-gray-600" />
                    <h2 className="text-xl font-semibold">Top Retailers</h2>
                  </div>
                  <div className="space-y-3">
                    {kpis?.topRetailers && kpis.topRetailers.length > 0 ? (
                      kpis.topRetailers.map((item: any, index: number) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium">{item.retailer?.fullName || 'Unknown'}</p>
                            <p className="text-sm text-gray-500">{item.orderCount || 0} orders</p>
                          </div>
                          <p className="font-semibold">£{item.totalSpent?.toLocaleString() || '0'}</p>
                        </div>
                      ))
                    ) : (
                      <div className="flex items-center justify-center p-6 text-gray-500">
                        <p>No retailer data available</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="space-y-6">
              {/* Filters */}
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search by order number, customer name, email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="ALL">All Status</option>
                      <option value="DRAFT">Draft</option>
                      <option value="PENDING">Pending</option>
                      <option value="CONFIRMED">Confirmed</option>
                      <option value="PACKED">Packed</option>
                      <option value="IN_TRANSIT">In Transit</option>
                      <option value="DELIVERED">Delivered</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                  </div>
                  <button
                    onClick={fetchOrders}
                    disabled={isLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
                  >
                    <Filter className="w-4 h-4" />
                    <span>{isLoading ? 'Loading...' : 'Refresh'}</span>
                  </button>
                </div>
              </div>

              {/* Orders Table */}
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredOrders.map((order) => {
                        const statusInfo = getStatusConfig(order.status);
                        const StatusIcon = statusInfo.icon;
                        
                        return (
                          <tr key={order.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="font-mono text-sm font-medium text-gray-900">
                                  {order.orderNumber}
                                </div>
                                <button
                                  onClick={() => setSelectedOrder(order)}
                                  className="text-blue-600 hover:text-blue-800 text-sm"
                                >
                                  View details
                                </button>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">{order.user.fullName}</div>
                                <div className="text-sm text-gray-500">{order.user.email}</div>
                                {order.user.companyName && (
                                  <div className="text-sm text-gray-500">{order.user.companyName}</div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                £{parseFloat(order.totalAmount.toString()).toFixed(2)}
                              </div>
                              <div className="text-sm text-gray-500">{order.currency}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {statusInfo.label}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(order.placedAt)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="relative">
                                <select
                                  value={order.status}
                                  onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                                  disabled={updatingStatus === order.id}
                                  className="appearance-none bg-white border border-gray-300 rounded px-3 py-1 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                                >
                                  <option value="DRAFT">Draft</option>
                                  <option value="PENDING">Pending</option>
                                  <option value="CONFIRMED">Confirmed</option>
                                  <option value="PACKED">Packed</option>
                                  <option value="IN_TRANSIT">In Transit</option>
                                  <option value="DELIVERED">Delivered</option>
                                  <option value="CANCELLED">Cancelled</option>
                                </select>
                                <ChevronDown className="w-4 h-4 absolute right-2 top-1.5 text-gray-400 pointer-events-none" />
                                {updatingStatus === order.id && (
                                  <div className="absolute right-2 top-1.5">
                                    <Loader className="w-4 h-4 animate-spin text-blue-600" />
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {filteredOrders.length === 0 && !isLoading && (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No orders found</h3>
                  <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'products' && (
            <div className="text-center py-20">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Products Management</h3>
              <p className="text-gray-600 mb-4">Import products from Excel and upload product images.</p>
              <a
                href="/admin/products"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Package className="w-4 h-4 mr-2" />
                Go to Products Management
              </a>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="text-center py-20">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">User Management</h3>
              <p className="text-gray-600">User management functionality coming soon.</p>
            </div>
          )}

          {activeTab === 'features' && (
            <div className="text-center py-20">
              <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Feature Management</h3>
              <p className="text-gray-600 mb-4">Manage product feature sections displayed on the home page.</p>
              <a
                href="/admin/features"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Go to Feature Management
              </a>
            </div>
          )}

          {activeTab === 'offers' && (
            <div className="text-center py-20">
              <Gift className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Offers Management</h3>
              <p className="text-gray-600 mb-4">Create and manage promotional offers for your marketplace.</p>
              <a
                href="/admin/offers"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Gift className="w-4 h-4 mr-2" />
                Go to Offers Management
              </a>
            </div>
          )}

          {activeTab === 'marketplace' && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Marketplace Banner Management</h2>
                  <p className="text-gray-600">Manage banner images displayed on the marketplace homepage</p>
                </div>
                <button
                  onClick={() => setShowBannerModal(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Banner</span>
                </button>
              </div>

              {/* Banners List */}
              <div className="grid gap-4">
                {banners.map((banner) => (
                  <div key={banner.id} className="bg-white rounded-lg shadow-sm p-6 flex items-center space-x-6">
                    {/* Banner Image */}
                    <div className="w-32 h-20 rounded-lg overflow-hidden flex-shrink-0">
                      <Image
                        src={banner.imageUrl}
                        alt={banner.title || 'Banner'}
                        width={128}
                        height={80}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Banner Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900">{banner.title || 'Untitled Banner'}</h3>
                      {banner.description && (
                        <p className="text-sm text-gray-600 mt-1">{banner.description}</p>
                      )}
                      {banner.linkUrl && (
                        <p className="text-sm text-blue-600 mt-1">Links to: {banner.linkUrl}</p>
                      )}
                      <div className="flex items-center space-x-4 mt-2">
                        <span className="text-xs text-gray-500">Sort: {banner.sortOrder}</span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          banner.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {banner.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => toggleBannerStatus(banner.id, !banner.isActive)}
                        className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                        title={banner.isActive ? 'Hide banner' : 'Show banner'}
                      >
                        {banner.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => setSelectedBanner(banner)}
                        className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50"
                        title="Edit banner"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteBanner(banner.id)}
                        className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                        title="Delete banner"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {banners.length === 0 && (
                  <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                    <Home className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No banners yet</h3>
                    <p className="text-gray-600 mb-4">Create your first banner to display on the marketplace homepage.</p>
                    <button
                      onClick={() => setShowBannerModal(true)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                    >
                      Add Banner
                    </button>
                  </div>
                )}
              </div>

              {/* Collection Images Section */}
              <div className="space-y-6 mt-12">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Collection Images</h2>
                    <p className="text-gray-600">Manage custom images for collection cards on the marketplace</p>
                  </div>
                </div>

                {/* Collections Grid */}
                <div className="grid gap-4">
                  {collections.map((collection) => {
                    const existingImage = collectionImages.find(img => img.collection === collection);
                    const isUploading = uploadingCollection === collection;
                    
                    return (
                      <div key={collection} className="bg-white rounded-lg shadow-sm p-6 flex items-center space-x-6">
                        {/* Current Image Preview */}
                        <div className="w-32 h-32 rounded-lg overflow-hidden flex-shrink-0 border-2 border-gray-200">
                          {existingImage ? (
                            <Image
                              src={existingImage.imageUrl}
                              alt={collection}
                              width={128}
                              height={128}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                              <Package className="w-8 h-8 text-gray-400" />
                            </div>
                          )}
                        </div>

                        {/* Collection Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 text-lg">{collection}</h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {existingImage ? 'Custom image uploaded' : 'Using fallback image'}
                          </p>
                          {existingImage && (
                            <div className="flex items-center space-x-4 mt-2">
                              <span className="text-xs text-gray-500">
                                Uploaded: {new Date(existingImage.createdAt).toLocaleDateString()}
                              </span>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                existingImage.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {existingImage.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-2">
                          <label className="cursor-pointer">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  handleCollectionImageUpload(collection, file);
                                }
                              }}
                              className="hidden"
                              disabled={isUploading}
                            />
                            <div className={`p-2 rounded-lg flex items-center space-x-2 ${
                              isUploading
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                            }`}>
                              {isUploading ? (
                                <Loader className="w-4 h-4 animate-spin" />
                              ) : (
                                <Upload className="w-4 h-4" />
                              )}
                              <span className="text-sm">
                                {isUploading ? 'Uploading...' : existingImage ? 'Replace' : 'Upload'}
                              </span>
                            </div>
                          </label>
                          
                          {existingImage && !isUploading && (
                            <button
                              onClick={() => deleteCollectionImage(collection)}
                              className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                              title="Delete image"
                            >
                              <Trash className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {collections.length === 0 && (
                    <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                      <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No collections found</h3>
                      <p className="text-gray-600">Collections will appear here once products are added with collection tags.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="text-center py-20">
              <Settings className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Settings</h3>
              <p className="text-gray-600">Settings panel coming soon.</p>
            </div>
          )}
        </div>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Order Details</h3>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Order Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Order Number</label>
                    <p className="font-mono text-sm bg-gray-100 px-3 py-2 rounded">{selectedOrder.orderNumber}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusConfig(selectedOrder.status).color}`}>
                      {React.createElement(getStatusConfig(selectedOrder.status).icon, { className: "w-3 h-3 mr-1" })}
                      {getStatusConfig(selectedOrder.status).label}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Amount</label>
                    <p className="text-lg font-semibold">£{parseFloat(selectedOrder.totalAmount.toString()).toFixed(2)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Order Date</label>
                    <p className="text-sm">{formatDate(selectedOrder.placedAt)}</p>
                  </div>
                </div>

                {/* Customer Info */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Customer Information</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="font-medium">{selectedOrder.user.fullName}</p>
                    <p className="text-sm text-gray-600">{selectedOrder.user.email}</p>
                    {selectedOrder.user.companyName && (
                      <p className="text-sm text-gray-600">{selectedOrder.user.companyName}</p>
                    )}
                  </div>
                </div>

                {/* Applied Offers */}
                {selectedOrder.addOns?.appliedOffers && selectedOrder.addOns.appliedOffers.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Applied Offers</h4>
                    <div className="space-y-3">
                      {selectedOrder.addOns.appliedOffers.map((offer, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-green-100 rounded-full">
                              {offer.type === 'PERCENT_OFF' && <div className="w-4 h-4 text-green-600 font-bold text-xs flex items-center justify-center">%</div>}
                              {offer.type === 'AMOUNT_OFF' && <DollarSign className="w-4 h-4 text-green-600" />}
                              {offer.type === 'FREE_ITEM' && <Gift className="w-4 h-4 text-green-600" />}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{offer.offerName}</p>
                              <p className="text-sm text-green-700">{offer.type.replace('_', ' ').toLowerCase()}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            {offer.type === 'FREE_ITEM' ? (
                              <span className="font-medium text-green-600">Free Item</span>
                            ) : (
                              <span className="font-medium text-green-600">
                                -£{(typeof offer.discount === 'number' ? offer.discount : parseFloat(offer.discount?.toString() || '0')).toFixed(2)}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                      
                      {/* Free Items */}
                      {selectedOrder.addOns?.freeItems && selectedOrder.addOns.freeItems.length > 0 && (
                        <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                          <h5 className="font-medium text-purple-800 mb-2">Free Items Included:</h5>
                          {selectedOrder.addOns.freeItems.map((freeItem, index) => (
                            <div key={index} className="text-sm text-purple-700">
                              • {freeItem.quantity}x Free Item (ID: {freeItem.productId.slice(0, 8)}...)
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Total Savings */}
                      {selectedOrder.addOns?.totalDiscount && selectedOrder.addOns.totalDiscount > 0 && (
                        <div className="flex justify-between items-center p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <span className="font-medium text-blue-900">Total Savings:</span>
                          <span className="font-bold text-blue-600">
                            -£{(typeof selectedOrder.addOns.totalDiscount === 'number' ? selectedOrder.addOns.totalDiscount : parseFloat(selectedOrder.addOns.totalDiscount?.toString() || '0')).toFixed(2)}
                          </span>
                        </div>
                      )}
                      
                      {/* Original vs Final Amount */}
                      {selectedOrder.addOns?.originalAmount && selectedOrder.addOns?.totalDiscount && selectedOrder.addOns.totalDiscount > 0 && (
                        <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                          <div className="flex justify-between mb-1">
                            <span>Original Amount:</span>
                            <span className="line-through">
                              £{(typeof selectedOrder.addOns.originalAmount === 'number' ? selectedOrder.addOns.originalAmount : parseFloat(selectedOrder.addOns.originalAmount?.toString() || '0')).toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between font-medium">
                            <span>Final Amount:</span>
                            <span>£{parseFloat(selectedOrder.totalAmount.toString()).toFixed(2)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Order Items */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Order Items</h4>
                  <div className="space-y-4">
                    {selectedOrder.items.map((item) => {
                      const freeQuantity = getFreeItemQuantityForProduct(selectedOrder, item.product?.id || '');
                      const totalAfterFree = (item.netQuantity || item.quantity || 0) + freeQuantity;
                      
                      return (
                        <div key={item.id} className="border rounded-lg p-4 space-y-3">
                          <div className="flex items-start space-x-4">
                            <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                              <Image
                                src={getImageUrl(item.product.images)}
                                alt={item.product.name}
                                width={64}
                                height={64}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-gray-900 mb-2">{item.product.name}</h4>
                              
                              {/* Quantity Breakdown */}
                              <div className="space-y-2 text-sm text-gray-600 mb-3">
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
                                {hasFreeItemOffers(selectedOrder) && freeQuantity > 0 && (
                                  <div className="text-green-600">
                                    <span className="font-medium">+ Free Items:</span> {freeQuantity} pieces
                                  </div>
                                )}
                                {hasFreeItemOffers(selectedOrder) && (
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
                                {hasDiscountOffers(selectedOrder) && (
                                  <div className="text-green-600">
                                    <span className="font-medium">Amount after discount:</span> £{safeNumber(item.billAmount || item.netAmount || (item.quantity * item.unitPrice)).toFixed(2)}
                                  </div>
                                )}
                                {!hasDiscountOffers(selectedOrder) && (
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
            </div>
          </div>
        </div>
      )}

      {/* Banner Modal */}
      {showBannerModal && (
        <BannerModal
          onClose={() => setShowBannerModal(false)}
          onUpload={handleBannerUpload}
          isUploading={isUploadingBanner}
        />
      )}

      {/* Edit Banner Modal */}
      {selectedBanner && (
        <EditBannerModal
          banner={selectedBanner}
          onClose={() => setSelectedBanner(null)}
          onSave={async (updatedData) => {
            try {
              await axios.put(`/api/banners/${selectedBanner.id}`, updatedData);
              await fetchBanners();
              setSelectedBanner(null);
            } catch (error) {
              console.error('Error updating banner:', error);
            }
          }}
        />
      )}
    </div>
  );
}

// Banner Upload Modal Component
function BannerModal({ 
  onClose, 
  onUpload, 
  isUploading 
}: { 
  onClose: () => void; 
  onUpload: (file: File, data: { title?: string; description?: string; linkUrl?: string }) => void;
  isUploading: boolean;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [preview, setPreview] = useState<string>('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result as string);
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (file) {
      onUpload(file, { title, description, linkUrl });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Add New Banner</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Banner Image *
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="banner-upload"
                  required
                />
                <label htmlFor="banner-upload" className="cursor-pointer">
                  {preview ? (
                    <div className="space-y-4">
                      <Image
                        src={preview}
                        alt="Preview"
                        width={400}
                        height={200}
                        className="mx-auto rounded-lg max-h-48 object-cover"
                      />
                      <p className="text-sm text-gray-600">Click to change image</p>
                    </div>
                  ) : (
                    <div>
                      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">Click to upload banner image</p>
                      <p className="text-sm text-gray-500 mt-1">Recommended: 1200x400px</p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title (Optional)
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Banner title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (Optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Banner description"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Link URL (Optional)
              </label>
              <input
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://example.com"
              />
            </div>

            <div className="flex space-x-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!file || isUploading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isUploading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <span>Upload Banner</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Edit Banner Modal Component
function EditBannerModal({ 
  banner, 
  onClose, 
  onSave 
}: { 
  banner: Banner;
  onClose: () => void; 
  onSave: (data: { title?: string; description?: string; linkUrl?: string }) => void;
}) {
  const [title, setTitle] = useState(banner.title || '');
  const [description, setDescription] = useState(banner.description || '');
  const [linkUrl, setLinkUrl] = useState(banner.linkUrl || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ title, description, linkUrl });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Edit Banner</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Image
              </label>
              <div className="w-full h-48 rounded-lg overflow-hidden">
                <Image
                  src={banner.imageUrl}
                  alt={banner.title || 'Banner'}
                  width={400}
                  height={200}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Banner title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Banner description"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Link URL
              </label>
              <input
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://example.com"
              />
            </div>

            <div className="flex space-x-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}