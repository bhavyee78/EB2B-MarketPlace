'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Search, Phone, Filter, Grid3X3, List, Loader } from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import BottomNav from '@/components/BottomNav';
import LanguageSelector from '@/components/LanguageSelector';
import { useI18n } from '@/contexts/I18nContext';

interface FeaturePageProps {
  params: {
    slug: string;
  };
}

export default function FeaturePage({ params }: FeaturePageProps) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const router = useRouter();
  const { t } = useI18n();

  // Convert slug back to feature name
  const featureName = decodeURIComponent(params.slug)
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  useEffect(() => {
    loadProducts(true);
  }, [params.slug, sortBy, sortOrder]);

  const loadProducts = async (reset = false) => {
    if (loading && !reset) return;
    
    setLoading(true);
    try {
      const currentPage = reset ? 0 : page;
      const response = await axios.get('/api/products', {
        params: {
          feature: featureName,
          search: searchQuery || undefined,
          limit: 20,
          offset: currentPage * 20,
          sortBy,
          sortOrder
        }
      });

      const newProducts = response.data.products || [];
      
      if (reset) {
        setProducts(newProducts);
        setPage(1);
      } else {
        setProducts(prev => [...prev, ...newProducts]);
        setPage(prev => prev + 1);
      }
      
      setHasMore(newProducts.length === 20);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    loadProducts(true);
  };

  const handleSortChange = (field: string, order: string) => {
    setSortBy(field);
    setSortOrder(order);
    setPage(0);
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      loadProducts(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="w-12 h-12 rounded-lg overflow-hidden">
                <Image
                  src="/logo.jpeg"
                  alt="Premier Logo"
                  width={48}
                  height={48}
                  className="object-contain w-full h-full"
                />
              </div>
              <div>
                <h1 className="text-lg font-semibold">{featureName}</h1>
                <p className="text-sm text-gray-600">{products.length} products</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <LanguageSelector />
              <a href="tel:+442012345678" className="p-2 hover:bg-gray-100 rounded-lg">
                <Phone className="w-5 h-5" />
              </a>
            </div>
          </div>
          
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder={t('marketplace.searchInFeature', { feature: featureName })}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </form>
        </div>
      </header>

      {/* Filters and View Controls */}
      <div className="bg-white border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <select
                value={`${sortBy}_${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('_');
                  handleSortChange(field, order);
                }}
                className="appearance-none bg-white border border-gray-300 rounded-lg px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="createdAt_desc">{t('products.sortNewest')}</option>
                <option value="createdAt_asc">{t('products.sortOldest')}</option>
                <option value="price_asc">{t('products.sortPriceLow')}</option>
                <option value="price_desc">{t('products.sortPriceHigh')}</option>
                <option value="name_asc">{t('products.sortNameAZ')}</option>
                <option value="name_desc">{t('products.sortNameZA')}</option>
              </select>
              <Filter className="w-4 h-4 absolute right-2 top-3 text-gray-400 pointer-events-none" />
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg ${
                viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Grid3X3 className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg ${
                viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Products Grid/List */}
      <div className="px-4 py-6">
        {loading && products.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">{t('common.loading')}</p>
            </div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {t('products.noResultsTitle')}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchQuery 
                ? t('products.noResultsWithSearch', { query: searchQuery, feature: featureName })
                : t('products.noResultsInFeature', { feature: featureName })
              }
            </p>
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setPage(0);
                  loadProducts(true);
                }}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {t('products.clearSearch')}
              </button>
            )}
          </div>
        ) : (
          <>
            <div className={`
              ${viewMode === 'grid' 
                ? 'grid grid-cols-2 gap-4' 
                : 'space-y-4'
              }
            `}>
              {products.map((product) => (
                <ProductCard 
                  key={product.id} 
                  product={product}
                  viewMode={viewMode}
                />
              ))}
            </div>
            
            {/* Load More Button */}
            {hasMore && (
              <div className="text-center mt-8">
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin mr-2" />
                      {t('common.loading')}
                    </>
                  ) : (
                    t('products.loadMore')
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
}