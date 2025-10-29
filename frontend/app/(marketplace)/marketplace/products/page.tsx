'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import axios from 'axios';
import Image from 'next/image';
import Link from 'next/link';
import { Search, ArrowLeft, Filter, SlidersHorizontal } from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import BottomNav from '@/components/BottomNav';

interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  images: string[];
  category: string;
  collection: string;
  tags: string[];
  moq: number;
  price: string | number;
  pcPrice?: number;
  csPrice?: number;
  pcQuantity?: number;
  csQuantity?: number;
  packSize: string;
  leadTimeDays: number;
  status: string;
}

interface ProductsResponse {
  products: Product[];
  total: number;
  limit: number;
  offset: number;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedCollection, setSelectedCollection] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [collections, setCollections] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [total, setTotal] = useState(0);
  
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    // Get initial search query from URL
    const initialSearch = searchParams.get('search') || '';
    const initialCollection = searchParams.get('collection') || '';
    const initialCategory = searchParams.get('category') || '';
    
    setSearchQuery(initialSearch);
    setSelectedCollection(initialCollection);
    setSelectedCategory(initialCategory);

    fetchData();
    fetchFilters();
  }, [searchParams]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      const search = searchParams.get('search');
      const collection = searchParams.get('collection');
      const category = searchParams.get('category');
      
      if (search) params.append('search', search);
      if (collection) params.append('collection', collection);
      if (category) params.append('category', category);
      params.append('limit', '50');

      const response = await axios.get<ProductsResponse>(`/api/products?${params.toString()}`);
      setProducts(response.data.products);
      setTotal(response.data.total);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFilters = async () => {
    try {
      const [categoriesRes, collectionsRes] = await Promise.all([
        axios.get('/api/products/categories'),
        axios.get('/api/products/collections'),
      ]);
      setCategories(categoriesRes.data);
      setCollections(collectionsRes.data);
    } catch (error) {
      console.error('Error fetching filters:', error);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateURL();
  };

  const updateURL = () => {
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.append('search', searchQuery.trim());
    if (selectedCollection) params.append('collection', selectedCollection);
    if (selectedCategory) params.append('category', selectedCategory);

    router.push(`/marketplace/products?${params.toString()}`);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCollection('');
    setSelectedCategory('');
    router.push('/marketplace/products');
  };

  const getResultText = () => {
    if (loading) return 'Loading...';
    
    const hasFilters = searchQuery || selectedCollection || selectedCategory;
    if (hasFilters) {
      return `Found ${total} product${total !== 1 ? 's' : ''}`;
    }
    return `Showing all ${total} product${total !== 1 ? 's' : ''}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <Link href="/marketplace" className="p-2 hover:bg-gray-100 rounded-lg">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center space-x-2">
                <div className="w-12 h-12 rounded-lg overflow-hidden">
                  <Image
                    src="/logo.jpeg"
                    alt="Premier Logo"
                    width={48}
                    height={48}
                    className="object-contain w-full h-full"
                  />
                </div>
                <span className="font-bold text-lg">Products</span>
              </div>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span className="text-sm">Filters</span>
            </button>
          </div>
          
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </form>
        </div>
      </header>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white border-b px-4 py-4">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Collection</label>
              <select
                value={selectedCollection}
                onChange={(e) => setSelectedCollection(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="">All Collections</option>
                {collections.map((collection) => (
                  <option key={collection} value={collection}>
                    {collection}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={updateURL}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
              >
                Apply Filters
              </button>
              <button
                onClick={clearFilters}
                className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Results Summary */}
      <div className="px-4 py-3 bg-white border-b">
        <p className="text-sm text-gray-600">{getResultText()}</p>
        {(searchQuery || selectedCollection || selectedCategory) && (
          <div className="flex flex-wrap gap-2 mt-2">
            {searchQuery && (
              <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                Search: "{searchQuery}"
              </span>
            )}
            {selectedCollection && (
              <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                Collection: {selectedCollection}
              </span>
            )}
            {selectedCategory && (
              <span className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                Category: {selectedCategory}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Products Grid */}
      <div className="px-4 py-6">
        {loading ? (
          <div className="grid grid-cols-2 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg p-4 shadow-sm animate-pulse">
                <div className="aspect-square bg-gray-200 rounded-lg mb-3"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-20"></div>
              </div>
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-2 gap-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <Search className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your search or filter criteria
            </p>
            <button
              onClick={clearFilters}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Show All Products
            </button>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}