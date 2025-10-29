'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Search,
  Calendar,
  Gift,
  Percent,
  DollarSign,
  Package,
  Tag,
  Layers
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  sku: string;
  category?: string;
  collection?: string;
}

interface FormData {
  name: string;
  description: string;
  type: 'FREE_ITEM' | 'PERCENT_OFF' | 'AMOUNT_OFF';
  percentOff: number | '';
  amountOff: number | '';
  freeItemProductId: string;
  freeItemQty: number;
  startsAt: string;
  endsAt: string;
  minQuantity: number;
  minOrderAmount: number | '';
  appliesToAnyQty: boolean;
  maxPerUser: number | '';
  maxTotalRedemptions: number | '';
  priority: number;
  isStackable: boolean;
  isActive: boolean;
  scopes: {
    products: string[];
    categories: string[];
    collections: string[];
  };
}

export default function CreateOfferPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    type: 'PERCENT_OFF',
    percentOff: '',
    amountOff: '',
    freeItemProductId: '',
    freeItemQty: 1,
    startsAt: '',
    endsAt: '',
    minQuantity: 0,
    minOrderAmount: '',
    appliesToAnyQty: true,
    maxPerUser: '',
    maxTotalRedemptions: '',
    priority: 0,
    isStackable: false,
    isActive: true,
    scopes: {
      products: [],
      categories: [],
      collections: []
    }
  });

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [collections, setCollections] = useState<string[]>([]);
  const [searchProduct, setSearchProduct] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchCollections();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get('/api/products?limit=1000');
      setProducts(response.data.products || []);
    } catch (err) {
      console.error('Failed to fetch products:', err);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/api/products/categories');
      setCategories(response.data || []);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  const fetchCollections = async () => {
    try {
      const response = await axios.get('/api/products/collections');
      setCollections(response.data || []);
    } catch (err) {
      console.error('Failed to fetch collections:', err);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleScopeChange = (type: 'products' | 'categories' | 'collections', value: string) => {
    setFormData(prev => ({
      ...prev,
      scopes: {
        ...prev.scopes,
        [type]: prev.scopes[type].includes(value)
          ? prev.scopes[type].filter(item => item !== value)
          : [...prev.scopes[type], value]
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Prepare the data for submission
      const submitData = {
        ...formData,
        // Convert empty strings to null for optional numeric fields
        percentOff: formData.percentOff === '' ? undefined : Number(formData.percentOff),
        amountOff: formData.amountOff === '' ? undefined : Number(formData.amountOff),
        minOrderAmount: formData.minOrderAmount === '' ? undefined : Number(formData.minOrderAmount),
        maxPerUser: formData.maxPerUser === '' ? undefined : Number(formData.maxPerUser),
        maxTotalRedemptions: formData.maxTotalRedemptions === '' ? undefined : Number(formData.maxTotalRedemptions),
        freeItemProductId: formData.freeItemProductId || undefined,
        startsAt: formData.startsAt || undefined,
        endsAt: formData.endsAt || undefined,
      };

      await axios.post('/api/offers', submitData);
      router.push('/admin/offers');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create offer');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchProduct.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchProduct.toLowerCase())
  );

  const selectedProducts = products.filter(p => formData.scopes.products.includes(p.id));
  const selectedCategories = formData.scopes.categories;
  const selectedCollections = formData.scopes.collections;

  return (
    <div className="p-6 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-2">
          <Link
            href="/admin/offers"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create New Offer</h1>
            <p className="text-gray-600">Set up a new promotional offer</p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Offer Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Summer Sale 20% Off"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe your offer..."
              />
            </div>
          </div>
        </div>

        {/* Offer Type & Value */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Offer Type & Value</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Offer Type *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { value: 'PERCENT_OFF', label: 'Percentage Off', icon: Percent },
                  { value: 'AMOUNT_OFF', label: 'Amount Off', icon: DollarSign },
                  { value: 'FREE_ITEM', label: 'Free Item', icon: Gift }
                ].map(({ value, label, icon: Icon }) => (
                  <label
                    key={value}
                    className={`relative flex items-center p-4 border rounded-lg cursor-pointer ${
                      formData.type === value ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                    }`}
                  >
                    <input
                      type="radio"
                      name="type"
                      value={value}
                      checked={formData.type === value}
                      onChange={(e) => handleInputChange('type', e.target.value)}
                      className="sr-only"
                    />
                    <Icon className="w-5 h-5 text-gray-600 mr-3" />
                    <span className="text-sm font-medium">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Type-specific inputs */}
            {formData.type === 'PERCENT_OFF' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Discount Percentage *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    required
                    value={formData.percentOff}
                    onChange={(e) => handleInputChange('percentOff', e.target.value)}
                    className="w-full px-3 py-2 pr-8 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="10"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">%</span>
                </div>
              </div>
            )}

            {formData.type === 'AMOUNT_OFF' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Discount Amount *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">£</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={formData.amountOff}
                    onChange={(e) => handleInputChange('amountOff', e.target.value)}
                    className="w-full pl-8 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="10.00"
                  />
                </div>
              </div>
            )}

            {formData.type === 'FREE_ITEM' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Free Item Product *
                  </label>
                  <select
                    required
                    value={formData.freeItemProductId}
                    onChange={(e) => handleInputChange('freeItemProductId', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select a product...</option>
                    {products.map(product => (
                      <option key={product.id} value={product.id}>
                        {product.name} ({product.sku})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Free Item Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.freeItemQty}
                    onChange={(e) => handleInputChange('freeItemQty', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Eligibility & Restrictions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Eligibility & Restrictions</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="datetime-local"
                value={formData.startsAt}
                onChange={(e) => handleInputChange('startsAt', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="datetime-local"
                value={formData.endsAt}
                onChange={(e) => handleInputChange('endsAt', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Minimum Quantity
              </label>
              <input
                type="number"
                min="0"
                value={formData.minQuantity}
                onChange={(e) => handleInputChange('minQuantity', parseInt(e.target.value))}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Minimum Order Amount (£)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.minOrderAmount}
                onChange={(e) => handleInputChange('minOrderAmount', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Uses Per User
              </label>
              <input
                type="number"
                min="1"
                value={formData.maxPerUser}
                onChange={(e) => handleInputChange('maxPerUser', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Unlimited"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Total Redemptions
              </label>
              <input
                type="number"
                min="1"
                value={formData.maxTotalRedemptions}
                onChange={(e) => handleInputChange('maxTotalRedemptions', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Unlimited"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <input
                type="number"
                value={formData.priority}
                onChange={(e) => handleInputChange('priority', parseInt(e.target.value))}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0"
              />
              <p className="text-xs text-gray-500 mt-1">Higher numbers have higher priority</p>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.appliesToAnyQty}
                  onChange={(e) => handleInputChange('appliesToAnyQty', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Applies to any quantity</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isStackable}
                  onChange={(e) => handleInputChange('isStackable', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Stackable</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => handleInputChange('isActive', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Active</span>
              </label>
            </div>
          </div>
        </div>

        {/* Offer Scope */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Offer Scope</h2>
          <p className="text-sm text-gray-600 mb-4">
            Select which products, categories, or collections this offer applies to.
          </p>

          <div className="space-y-6">
            {/* Products */}
            <div>
              <h3 className="text-md font-medium text-gray-800 mb-3 flex items-center gap-2">
                <Package className="w-4 h-4" />
                Products ({selectedProducts.length} selected)
              </h3>
              
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchProduct}
                    onChange={(e) => setSearchProduct(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {selectedProducts.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedProducts.map(product => (
                      <span
                        key={product.id}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                      >
                        {product.name}
                        <button
                          type="button"
                          onClick={() => handleScopeChange('products', product.id)}
                          className="ml-1 hover:bg-blue-200 rounded-full p-0.5"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <div className="max-h-32 overflow-y-auto border rounded-lg">
                  {filteredProducts.slice(0, 20).map(product => (
                    <label
                      key={product.id}
                      className="flex items-center p-2 hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.scopes.products.includes(product.id)}
                        onChange={() => handleScopeChange('products', product.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm">
                        {product.name} <span className="text-gray-500">({product.sku})</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Categories */}
            <div>
              <h3 className="text-md font-medium text-gray-800 mb-3 flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Categories ({selectedCategories.length} selected)
              </h3>
              
              <div className="space-y-3">
                {selectedCategories.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedCategories.map(category => (
                      <span
                        key={category}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
                      >
                        {category}
                        <button
                          type="button"
                          onClick={() => handleScopeChange('categories', category)}
                          className="ml-1 hover:bg-green-200 rounded-full p-0.5"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {categories.map(category => (
                    <label
                      key={category}
                      className="flex items-center p-2 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.scopes.categories.includes(category)}
                        onChange={() => handleScopeChange('categories', category)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm">{category}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Collections */}
            <div>
              <h3 className="text-md font-medium text-gray-800 mb-3 flex items-center gap-2">
                <Layers className="w-4 h-4" />
                Collections ({selectedCollections.length} selected)
              </h3>
              
              <div className="space-y-3">
                {selectedCollections.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedCollections.map(collection => (
                      <span
                        key={collection}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full"
                      >
                        {collection}
                        <button
                          type="button"
                          onClick={() => handleScopeChange('collections', collection)}
                          className="ml-1 hover:bg-purple-200 rounded-full p-0.5"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {collections.map(collection => (
                    <label
                      key={collection}
                      className="flex items-center p-2 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.scopes.collections.includes(collection)}
                        onChange={() => handleScopeChange('collections', collection)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm">{collection}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Link
            href="/admin/offers"
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : 'Create Offer'}
          </button>
        </div>
      </form>
    </div>
  );
}