import Image from 'next/image';
import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { useCart } from '@/contexts/CartContext';
import OfferBadge from './OfferBadge';
import OfferDisplayModal from './OfferDisplayModal';
import offersService, { Offer } from '@/services/offersService';

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    images: string[];
    moq: number;
    price: string | number;
    pcPrice?: number;
    csPrice?: number;
    pcQuantity?: number;
    csQuantity?: number;
    packSize: string;
    tags: string[];
    category?: string;
    collection?: string;
    aiSuggestion?: string;
  };
  viewMode?: 'grid' | 'list';
}

export default function ProductCard({ product, viewMode = 'grid' }: ProductCardProps) {
  const [isPCAnimating, setIsPCAnimating] = useState(false);
  const [isCSAnimating, setIsCSAnimating] = useState(false);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loadingOffers, setLoadingOffers] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const productImageRef = useRef<HTMLDivElement>(null);
  const { addToCart } = useCart();

  // Helper function to convert relative URLs to full URLs
  const getImageUrl = (imageUrl: string) => {
    if (!imageUrl) return '/placeholder.jpg';
    if (imageUrl.startsWith('http')) return imageUrl;
    // Convert relative paths to full backend URLs
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    return `${backendUrl}${imageUrl}`;
  };

  // Fetch applicable offers for this product
  useEffect(() => {
    const fetchOffers = async () => {
      if (!product.id) return;
      
      setLoadingOffers(true);
      try {
        const applicableOffers = await offersService.getApplicableOffers({
          productId: product.id,
          category: product.category,
          collection: product.collection
        });
        
        // Filter to only active offers
        const activeOffers = offersService.getActiveOffers(applicableOffers);
        setOffers(activeOffers);
      } catch (error) {
        console.error('Failed to fetch offers for product:', error);
        setOffers([]);
      } finally {
        setLoadingOffers(false);
      }
    };

    fetchOffers();
  }, [product.id, product.category, product.collection]);

  const handleAddPC = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Add PC to cart
    addToCart({
      id: product.id,
      name: product.name,
      image: getImageUrl(product.images[0]),
      price: Number(product.pcPrice) || 0,
      packSize: 'PC',
      moq: 1,
      quantity: Number(product.pcQuantity) || 1,
      type: 'pc'
    });

    // Trigger animation
    setIsPCAnimating(true);
    
    // Create flying animation element
    if (productImageRef.current) {
      createFlyingAnimation();
    }

    // Reset animation state
    setTimeout(() => setIsPCAnimating(false), 1000);
  };

  const handleAddCS = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Add CS to cart - CS price is already the total price for the case, so quantity should be 1
    addToCart({
      id: product.id,
      name: product.name,
      image: getImageUrl(product.images[0]),
      price: Number(product.csPrice) || 0,
      packSize: 'CS',
      moq: 1,
      quantity: 1, // Always 1 for CS since price is already for the full case
      type: 'cs'
    });

    // Trigger animation
    setIsCSAnimating(true);
    
    // Create flying animation element
    if (productImageRef.current) {
      createFlyingAnimation();
    }

    // Reset animation state
    setTimeout(() => setIsCSAnimating(false), 1000);
  };

  const handleOfferClick = () => {
    if (offers.length > 0) {
      setShowOfferModal(true);
    }
  };

  const createFlyingAnimation = () => {
    if (!productImageRef.current) return;

    const rect = productImageRef.current.getBoundingClientRect();
    const flyingElement = document.createElement('div');
    
    // Style the flying element
    flyingElement.className = 'fixed pointer-events-none z-50 transition-all duration-1000 ease-out';
    flyingElement.style.left = rect.left + 'px';
    flyingElement.style.top = rect.top + 'px';
    flyingElement.style.width = rect.width + 'px';
    flyingElement.style.height = rect.height + 'px';
    flyingElement.style.borderRadius = '0.5rem';
    flyingElement.style.overflow = 'hidden';
    flyingElement.style.backgroundImage = `url(${getImageUrl(product.images[0])})`;
    flyingElement.style.backgroundSize = 'cover';
    flyingElement.style.backgroundPosition = 'center';
    flyingElement.style.opacity = '0.8';
    flyingElement.style.transform = 'scale(1)';
    flyingElement.style.zIndex = '9999';

    document.body.appendChild(flyingElement);

    // Animate to cart (top right corner)
    requestAnimationFrame(() => {
      const targetX = window.innerWidth - 60; // Approximate cart position
      const targetY = 20; // Top of screen

      flyingElement.style.left = targetX + 'px';
      flyingElement.style.top = targetY + 'px';
      flyingElement.style.transform = 'scale(0.1)';
      flyingElement.style.opacity = '0';
    });

    // Remove element after animation
    setTimeout(() => {
      if (flyingElement.parentNode) {
        flyingElement.parentNode.removeChild(flyingElement);
      }
    }, 1000);
  };

  if (viewMode === 'list') {
    return (
      <>
        <div className="bg-white rounded-lg shadow-sm overflow-hidden group">
          <Link href={`/marketplace/product/${product.id}`}>
            <div className="flex">
              <div ref={productImageRef} className="relative w-24 h-24 flex-shrink-0">
                <Image
                  src={getImageUrl(product.images && product.images[0] ? product.images[0] : '')}
                  alt={product.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform"
                />
                {product.tags && product.tags.includes('Must Try') && (
                  <div className="absolute top-1 right-1 bg-cyan-400 text-white px-1 py-0.5 rounded text-xs font-semibold">
                    ✓
                  </div>
                )}
                
                {offers.length > 0 && (
                  <div className="absolute top-1 left-1">
                    <OfferBadge 
                      offers={offers} 
                      size="small" 
                      isClickable={offers.length > 0}
                      onClick={handleOfferClick}
                    />
                  </div>
                )}
              </div>
              
              <div className="flex-1 p-5">
                <h3 className="font-semibold mb-1">{product.name}</h3>
                
                {product.aiSuggestion && (
                  <p className="text-xs text-gray-500 mb-2 bg-gray-50 px-2 py-1 rounded">
                    {product.aiSuggestion}
                  </p>
                )}
                
                <div className="flex justify-between items-center">
                  <div className="text-sm">
                    <p className="font-semibold">
                      £{product.pcPrice ? parseFloat(product.pcPrice.toString()).toFixed(2) : parseFloat(product.price.toString()).toFixed(2)} GBP
                    </p>
                    <p className="text-gray-500 text-xs">Per PC</p>
                  </div>
                  
                  <div className="flex gap-1 w-full">
                    <button 
                      onClick={handleAddPC}
                      disabled={isPCAnimating || !product.pcPrice}
                      className={`w-1/2 rounded text-xs font-medium transition flex flex-col overflow-hidden min-h-[50px] ${
                        isPCAnimating 
                          ? 'bg-green-500' 
                          : ''
                      } ${!product.pcPrice ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {isPCAnimating ? (
                        <div className="flex items-center justify-center h-full bg-green-500 text-white">✓</div>
                      ) : (
                        <>
                          <div className="bg-white text-gray-800 py-1 px-1 flex flex-col items-center justify-center flex-1">
                            <div className="text-xs font-bold mb-1">£{Number(product.pcPrice).toFixed(2)}</div>
                            <div className="text-xs whitespace-nowrap">Per Piece</div>
                          </div>
                          <div className="bg-red-500 hover:bg-red-600 text-white py-1 px-1 flex flex-col items-center justify-center transition-colors">
                            <div className="text-xs font-medium">ADD</div>
                            <div className="text-xs font-medium">{Number(product.pcQuantity) || 1} UNIT</div>
                          </div>
                        </>
                      )}
                    </button>
                    <button 
                      onClick={handleAddCS}
                      disabled={isCSAnimating || !product.csPrice}
                      className={`w-1/2 rounded text-xs font-medium transition flex flex-col overflow-hidden min-h-[50px] ${
                        isCSAnimating 
                          ? 'bg-green-500' 
                          : ''
                      } ${!product.csPrice ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {isCSAnimating ? (
                        <div className="flex items-center justify-center h-full bg-green-500 text-white">✓</div>
                      ) : (
                        <>
                          <div className="bg-white text-gray-800 py-1 px-1 flex flex-col items-center justify-center flex-1">
                            <div className="text-xs font-bold mb-1">£{Number(product.csPrice).toFixed(2)}</div>
                            <div className="text-xs whitespace-nowrap">Per Case</div>
                          </div>
                          <div className="bg-red-500 hover:bg-red-600 text-white py-1 px-1 flex flex-col items-center justify-center transition-colors">
                            <div className="text-xs font-medium">ADD</div>
                            <div className="text-xs font-medium whitespace-nowrap">{Number(product.csQuantity) || 1} UNITS</div>
                          </div>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </div>

      </>
    );
  }

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden group">
        <Link href={`/marketplace/product/${product.id}`}>
          <div ref={productImageRef} className="relative aspect-square">
            <Image
              src={getImageUrl(product.images && product.images[0] ? product.images[0] : '')}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform"
            />
            {product.tags && product.tags.includes('Must Try') && (
              <div className="absolute top-2 right-2 bg-cyan-400 text-white px-3 py-1 rounded-full text-xs font-semibold">
                ✓ Must Try
              </div>
            )}
            
            {offers.length > 0 && (
              <div className="absolute top-2 left-2">
                <OfferBadge 
                  offers={offers} 
                  size="small" 
                  isClickable={offers.length > 0}
                  onClick={handleOfferClick}
                />
              </div>
            )}
          </div>
        </Link>
        
        <div className="p-6">
          <h3 className="font-semibold mb-1">{product.name}</h3>
          
          {product.aiSuggestion && (
            <p className="text-xs text-gray-500 mb-2 bg-gray-50 px-2 py-1 rounded">
              {product.aiSuggestion}
            </p>
          )}
          
          <div className="flex justify-between items-center mb-3">
            <div className="text-sm">
              <p className="font-semibold">
                £{product.pcPrice ? parseFloat(product.pcPrice.toString()).toFixed(2) : parseFloat(product.price.toString()).toFixed(2)} GBP
              </p>
              <p className="text-gray-500 text-xs">Per PC</p>
            </div>
          </div>
          
          <div className="flex gap-2 w-full">
            <button 
              onClick={handleAddPC}
              disabled={isPCAnimating || !product.pcPrice}
              className={`w-1/2 rounded text-xs font-medium transition flex flex-col overflow-hidden min-h-[65px] ${
                isPCAnimating 
                  ? 'bg-green-500' 
                  : ''
              } ${!product.pcPrice ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isPCAnimating ? (
                <div className="flex items-center justify-center h-full bg-green-500 text-white">✓</div>
              ) : (
                <>
                  <div className="bg-white text-gray-800 py-2 px-2 flex flex-col items-center justify-center flex-1">
                    <div className="text-xs font-bold mb-1">£{Number(product.pcPrice).toFixed(2)}</div>
                    <div className="text-xs whitespace-nowrap">Per Piece</div>
                  </div>
                  <div className="bg-red-500 hover:bg-red-600 text-white py-2 px-2 flex flex-col items-center justify-center transition-colors">
                    <div className="text-xs font-medium">ADD</div>
                    <div className="text-xs font-medium">{Number(product.pcQuantity) || 1} UNIT</div>
                  </div>
                </>
              )}
            </button>
            <button 
              onClick={handleAddCS}
              disabled={isCSAnimating || !product.csPrice}
              className={`w-1/2 rounded text-xs font-medium transition flex flex-col overflow-hidden min-h-[65px] ${
                isCSAnimating 
                  ? 'bg-green-500' 
                  : ''
              } ${!product.csPrice ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isCSAnimating ? (
                <div className="flex items-center justify-center h-full bg-green-500 text-white">✓</div>
              ) : (
                <>
                  <div className="bg-white text-gray-800 py-2 px-2 flex flex-col items-center justify-center flex-1">
                    <div className="text-xs font-bold mb-1">£{Number(product.csPrice).toFixed(2)}</div>
                    <div className="text-xs whitespace-nowrap">Per Case</div>
                  </div>
                  <div className="bg-red-500 hover:bg-red-600 text-white py-2 px-2 flex flex-col items-center justify-center transition-colors">
                    <div className="text-xs font-medium">ADD</div>
                    <div className="text-xs font-medium whitespace-nowrap">{Number(product.csQuantity) || 1} UNITS</div>
                  </div>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <OfferDisplayModal
        offers={offers}
        isOpen={showOfferModal}
        onClose={() => setShowOfferModal(false)}
        productName={product.name}
      />
    </>
  );
}