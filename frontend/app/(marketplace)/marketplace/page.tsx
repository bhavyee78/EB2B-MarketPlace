'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Phone, ShoppingCart, ChevronLeft, ChevronRight } from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import BottomNav from '@/components/BottomNav';
import LanguageSelector from '@/components/LanguageSelector';
import FloatingAgentButton from '@/components/FloatingAgentButton';
import { useI18n } from '@/contexts/I18nContext';

export default function MarketplaceHome() {
  const [collections, setCollections] = useState<string[]>([]);
  const [banners, setBanners] = useState<any[]>([]);
  const [featureBlocks, setFeatureBlocks] = useState<any[]>([]);
  const [collectionImages, setCollectionImages] = useState<{ [key: string]: string }>({});
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { t } = useI18n();

  useEffect(() => {
    fetchData();
  }, []);

  // Auto-advance carousel
  useEffect(() => {
    if (banners.length > 1) {
      const interval = setInterval(() => {
        setCurrentBannerIndex((prev) => (prev + 1) % banners.length);
      }, 5000); // Change every 5 seconds
      
      return () => clearInterval(interval);
    }
  }, [banners.length]);

  const fetchData = async () => {
    try {
      console.log('Fetching data...');
      const [collectionsRes, bannersRes, collectionImagesRes, featureBlocksRes] = await Promise.all([
        axios.get('/api/products/collections'),
        axios.get('/api/banners/active'),
        axios.get('/api/collection-images'),
        axios.get('/api/home/feature-blocks?perFeature=12')
      ]);

      console.log('Collections:', collectionsRes.data);
      console.log('Banners:', bannersRes.data);
      console.log('Feature blocks:', featureBlocksRes.data);

      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

      setCollections(collectionsRes.data);

      // Prepend backend URL to banner image URLs
      const bannersWithFullUrls = bannersRes.data.map((banner: any) => ({
        ...banner,
        imageUrl: banner.imageUrl.startsWith('http') ? banner.imageUrl : `${backendUrl}${banner.imageUrl}`
      }));
      setBanners(bannersWithFullUrls);

      setFeatureBlocks(featureBlocksRes.data.blocks || []);

      // Convert collection images array to map and prepend backend URL
      if (collectionImagesRes.data.success) {
        const imageMap = collectionImagesRes.data.data.reduce((acc: { [key: string]: string }, img: any) => {
          const fullUrl = img.imageUrl.startsWith('http') ? img.imageUrl : `${backendUrl}${img.imageUrl}`;
          acc[img.collection] = fullUrl;
          return acc;
        }, {});
        setCollectionImages(imageMap);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/marketplace/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // Fallback images for collections without custom images
  const fallbackImages: { [key: string]: string } = {
    Christmas: 'https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=300&h=300&fit=crop',
    Easter: 'https://images.unsplash.com/photo-1554072675-66db59dba46f?w=300&h=300&fit=crop',
    Autumn: 'https://images.unsplash.com/photo-1507048331197-7d4ac70811cf?w=300&h=300&fit=crop'
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-lg overflow-hidden">
            <Image
              src="/logo.jpeg"
              alt="Premier Logo"
              width={64}
              height={64}
              className="object-contain w-full h-full"
            />
          </div>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Premier Marketplace</h2>
          <p className="text-gray-600">Fetching the latest products and offers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <div className="w-16 h-16 rounded-lg overflow-hidden">
                <Image
                  src="/logo.jpeg"
                  alt="Premier Logo"
                  width={64}
                  height={64}
                  className="object-contain w-full h-full"
                />
              </div>
            </div>
            <div className="flex items-center space-x-4">
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
              placeholder={t('marketplace.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </form>
        </div>
      </header>

      {/* Banner Carousel */}
      {banners.length > 0 ? (
        <div className="relative h-64 overflow-hidden">
          <div 
            className="flex transition-transform duration-500 ease-in-out h-full"
            style={{ transform: `translateX(-${currentBannerIndex * 100}%)` }}
          >
            {banners.map((banner, index) => (
              <div key={banner.id} className="relative flex-shrink-0 w-full h-full">
                {banner.linkUrl ? (
                  <Link href={banner.linkUrl} className="block w-full h-full">
                    <Image
                      src={banner.imageUrl}
                      alt={banner.title || 'Banner'}
                      fill
                      className="object-cover"
                      priority={index === 0}
                    />
                    <div className="absolute inset-0 bg-black/20" />
                    {banner.title && (
                      <div className="absolute bottom-4 left-4 right-4">
                        <h3 className="text-white text-xl font-bold mb-1">{banner.title}</h3>
                        {banner.description && (
                          <p className="text-white/90 text-sm">{banner.description}</p>
                        )}
                      </div>
                    )}
                  </Link>
                ) : (
                  <>
                    <Image
                      src={banner.imageUrl}
                      alt={banner.title || 'Banner'}
                      fill
                      className="object-cover"
                      priority={index === 0}
                    />
                    <div className="absolute inset-0 bg-black/20" />
                    {banner.title && (
                      <div className="absolute bottom-4 left-4 right-4">
                        <h3 className="text-white text-xl font-bold mb-1">{banner.title}</h3>
                        {banner.description && (
                          <p className="text-white/90 text-sm">{banner.description}</p>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Carousel Navigation */}
          {banners.length > 1 && (
            <>
              <button
                onClick={() => setCurrentBannerIndex((prev) => (prev - 1 + banners.length) % banners.length)}
                className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              <button
                onClick={() => setCurrentBannerIndex((prev) => (prev + 1) % banners.length)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              {/* Dots indicator */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                {banners.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentBannerIndex(index)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentBannerIndex ? 'bg-white' : 'bg-white/50'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      ) : (
        // Fallback banner
        <div className="relative h-64 bg-gradient-to-br from-red-500 to-green-500">
          <Image
            src="https://images.unsplash.com/photo-1512389142860-9c449e58a543?w=800&h=300&fit=crop"
            alt="Christmas Decorations"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black/30" />
        </div>
      )}

      {/* Order By Collection */}
      <section className="px-4 py-6">
        <h2 className="text-2xl font-bold mb-4 text-center">{t('marketplace.orderByCollection')}</h2>
        <div className="grid grid-cols-3 gap-4">
          {collections.map((collection) => (
            <Link
              key={collection}
              href={`/marketplace/products?collection=${collection}`}
              className="relative aspect-square rounded-2xl overflow-hidden group"
            >
              <Image
                src={collectionImages[collection] || fallbackImages[collection] || '/placeholder.jpg'}
                alt={collection}
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-2 left-0 right-0 text-center">
                <p className="text-white font-semibold">{collection}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Feature Sections */}
      {featureBlocks.map((block) => (
        <section key={block.feature} className="px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">{block.feature}</h2>
            <Link
              href={`/marketplace/feature/${encodeURIComponent(block.feature.toLowerCase().replace(/\s+/g, '-'))}`}
              className="text-blue-600 text-sm font-medium hover:text-blue-700"
            >
              {t('marketplace.viewAll')}
            </Link>
          </div>
          
          {/* Horizontal Scrolling Container */}
          <div className="overflow-x-auto">
            <div 
              className="flex space-x-4 pb-2"
              style={{ 
                scrollSnapType: 'x mandatory',
                scrollBehavior: 'smooth',
                WebkitOverflowScrolling: 'touch'
              }}
            >
              {block.products.map((product: any) => (
                <div
                  key={product.id}
                  className="flex-shrink-0 w-52"
                  style={{ scrollSnapAlign: 'start' }}
                >
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          </div>
        </section>
      ))}

      {featureBlocks.length === 0 && (
        <section className="px-4 py-6">
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('marketplace.noFeaturesTitle')}</h3>
            <p className="text-gray-600">{t('marketplace.noFeaturesMessage')}</p>
          </div>
        </section>
      )}

      <BottomNav />
      <FloatingAgentButton />
    </div>
  );
}