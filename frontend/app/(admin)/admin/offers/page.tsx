'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  Filter,
  Calendar,
  Tag,
  Gift,
  Percent,
  DollarSign,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';

interface Offer {
  id: string;
  name: string;
  description?: string;
  type: 'FREE_ITEM' | 'PERCENT_OFF' | 'AMOUNT_OFF';
  percentOff?: number;
  amountOff?: number;
  startsAt?: string;
  endsAt?: string;
  minQuantity: number;
  minOrderAmount?: number;
  priority: number;
  isStackable: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  freeItemProduct?: {
    id: string;
    name: string;
    sku: string;
  };
  scopesProducts: Array<{
    product: {
      id: string;
      name: string;
      sku: string;
    };
  }>;
  scopesCategories: Array<{
    category: string;
  }>;
  scopesCollections: Array<{
    collection: string;
  }>;
}

export default function OffersPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('');
  const [filterActive, setFilterActive] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchOffers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(searchQuery && { search: searchQuery }),
        ...(filterType && { type: filterType }),
        ...(filterActive && { isActive: filterActive }),
      });

      const response = await axios.get(`/api/offers?${params}`);
      setOffers(response.data.data);
      setTotalPages(response.data.pagination.pages);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch offers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, [currentPage, searchQuery, filterType, filterActive]);

  const handleToggleActive = async (offerId: string, currentStatus: boolean) => {
    try {
      await axios.patch(`/api/offers/${offerId}`, {
        isActive: !currentStatus
      });
      fetchOffers();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update offer status');
    }
  };

  const handleDelete = async (offerId: string) => {
    if (!confirm('Are you sure you want to delete this offer?')) return;
    
    try {
      await axios.delete(`/api/offers/${offerId}`);
      fetchOffers();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete offer');
    }
  };

  const getOfferTypeIcon = (type: string) => {
    switch (type) {
      case 'FREE_ITEM': return <Gift className="w-4 h-4" />;
      case 'PERCENT_OFF': return <Percent className="w-4 h-4" />;
      case 'AMOUNT_OFF': return <DollarSign className="w-4 h-4" />;
      default: return <Tag className="w-4 h-4" />;
    }
  };

  const getOfferTypeLabel = (type: string) => {
    switch (type) {
      case 'FREE_ITEM': return 'Free Item';
      case 'PERCENT_OFF': return 'Percent Off';
      case 'AMOUNT_OFF': return 'Amount Off';
      default: return type;
    }
  };

  const getOfferValue = (offer: Offer) => {
    switch (offer.type) {
      case 'PERCENT_OFF': return `${offer.percentOff}% off`;
      case 'AMOUNT_OFF': return `£${offer.amountOff} off`;
      case 'FREE_ITEM': return offer.freeItemProduct ? offer.freeItemProduct.name : 'Free item';
      default: return '-';
    }
  };

  const getOfferScope = (offer: Offer) => {
    const scopes = [];
    if (offer.scopesProducts.length > 0) {
      scopes.push(`${offer.scopesProducts.length} product(s)`);
    }
    if (offer.scopesCategories.length > 0) {
      scopes.push(`${offer.scopesCategories.length} category(ies)`);
    }
    if (offer.scopesCollections.length > 0) {
      scopes.push(`${offer.scopesCollections.length} collection(s)`);
    }
    return scopes.join(', ') || 'No scope defined';
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };

  if (loading && offers.length === 0) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-300 rounded w-1/4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-300 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Offers Management</h1>
          <p className="text-gray-600">Create and manage promotional offers</p>
        </div>
        <Link
          href="/admin/offers/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Offer
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search offers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Types</option>
            <option value="FREE_ITEM">Free Item</option>
            <option value="PERCENT_OFF">Percent Off</option>
            <option value="AMOUNT_OFF">Amount Off</option>
          </select>

          <select
            value={filterActive}
            onChange={(e) => setFilterActive(e.target.value)}
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Offers Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Offer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type & Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Active Period
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Scope
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {offers.map((offer) => (
                <tr key={offer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{offer.name}</div>
                      {offer.description && (
                        <div className="text-sm text-gray-500 truncate max-w-xs">{offer.description}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 text-gray-600">
                        {getOfferTypeIcon(offer.type)}
                        <span className="text-xs">{getOfferTypeLabel(offer.type)}</span>
                      </div>
                      <div className="text-sm font-medium text-gray-900">
                        {getOfferValue(offer)}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      <div className="flex items-center gap-1 text-gray-600">
                        <Calendar className="w-3 h-3" />
                        <span>
                          {formatDate(offer.startsAt)} - {formatDate(offer.endsAt)}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-600 max-w-xs truncate">
                      {getOfferScope(offer)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{offer.priority}</span>
                      {offer.isStackable && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                          Stackable
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleToggleActive(offer.id, offer.isActive)}
                      className={`flex items-center gap-1 px-2 py-1 rounded text-sm ${
                        offer.isActive
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      }`}
                    >
                      {offer.isActive ? (
                        <>
                          <ToggleRight className="w-4 h-4" />
                          Active
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="w-4 h-4" />
                          Inactive
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/offers/${offer.id}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <Link
                        href={`/admin/offers/${offer.id}/edit`}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(offer.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <p className="text-sm text-gray-700">
                  Page <span className="font-medium">{currentPage}</span> of{' '}
                  <span className="font-medium">{totalPages}</span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && offers.length === 0 && (
          <div className="text-center py-12">
            <Gift className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No offers found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchQuery || filterType || filterActive ? 'Try adjusting your filters' : 'Get started by creating your first offer'}
            </p>
            {!searchQuery && !filterType && !filterActive && (
              <div className="mt-6">
                <Link
                  href="/admin/offers/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Offer
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}