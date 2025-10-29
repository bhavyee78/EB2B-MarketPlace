'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { ArrowLeft, Plus, Minus, Trash2, ShoppingBag, CheckCircle, Gift, Percent, DollarSign } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import BottomNav from '@/components/BottomNav';
import FloatingAgentButton from '@/components/FloatingAgentButton';
import { useI18n } from '@/contexts/I18nContext';

export default function CartPage() {
  const { state, updateQuantity, removeFromCart, clearCart } = useCart();
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const router = useRouter();
  const { t } = useI18n();

  const handleQuantityChange = (id: string, type: string, newQuantity: number, moq: number) => {
    if (newQuantity >= moq) {
      updateQuantity(id, newQuantity);
    }
  };

  const handleRemoveItem = (id: string, type: string) => {
    removeFromCart(id);
  };

  const handleClearCart = () => {
    if (window.confirm('Are you sure you want to clear your cart?')) {
      clearCart();
    }
  };

  const handleProceedToCheckout = async () => {
    setIsProcessing(true);
    
    try {
      // Prepare order data
      const orderData = {
        items: state.items.map(item => ({
          productId: item.id,
          quantity: item.quantity,
          unitPrice: item.price,
          moq: item.moq,
          type: item.type || 'pc', // Default to 'pc' if not specified
        })),
        ...(state.offerCalculation && {
          appliedOffers: state.offerCalculation.applicableOffers.map(offer => ({
            offerId: offer.offerId,
            offerName: offer.offerName,
            type: offer.type,
            discount: offer.discount,
          })),
          freeItems: state.offerCalculation.freeItems,
          totalDiscount: state.offerCalculation.totalDiscount,
          finalAmount: state.offerCalculation.finalAmount,
          originalAmount: state.offerCalculation.originalAmount,
        }),
      };

      // Create order
      const response = await axios.post('/api/orders', orderData);
      
      setOrderDetails(response.data);
      setOrderPlaced(true);
      
      // Clear cart after successful order
      clearCart();
      
    } catch (error) {
      console.error('Error placing order:', error);
      alert('Sorry, there was an error placing your order. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Order success view
  if (orderPlaced && orderDetails) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm sticky top-0 z-40">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Link href="/marketplace" className="p-2 hover:bg-gray-100 rounded-lg">
                  <ArrowLeft className="w-5 h-5" />
                </Link>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg overflow-hidden">
                    <Image
                      src="/logo.jpeg"
                      alt="Premier Logo"
                      width={32}
                      height={32}
                      className="object-contain w-full h-full"
                    />
                  </div>
                  <span className="font-bold text-lg">{t('cart.orderPlaced')}</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="flex flex-col items-center justify-center py-20 px-4">
          <div className="w-32 h-32 bg-green-100 rounded-full flex items-center justify-center mb-6">
            <CheckCircle className="w-16 h-16 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('cart.orderPlaced')}</h2>
          <p className="text-gray-600 text-center mb-6 max-w-sm">
            {t('cart.orderPlacedMessage')}
          </p>
          
          <div className="bg-white rounded-lg shadow-sm p-6 w-full max-w-md mb-6">
            <div className="text-center">
              <h3 className="font-semibold text-lg mb-2">{t('cart.orderDetails')}</h3>
              <p className="text-gray-600 mb-1">{t('cart.orderNumber')}</p>
              <p className="font-mono text-sm bg-gray-100 px-3 py-1 rounded mb-4">{orderDetails.orderNumber}</p>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>{t('cart.items')}:</span>
                  <span>{orderDetails.items?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t('cart.total')}:</span>
                  <span>£{parseFloat(orderDetails.totalAmount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t('cart.status')}:</span>
                  <span className="text-orange-600 font-medium">{orderDetails.status}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{t('cart.placed')}:</span>
                  <span>{new Date(orderDetails.placedAt).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3 w-full max-w-md">
            <Link
              href="/marketplace/orders"
              className="block w-full bg-blue-600 text-white text-center px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition"
            >
{t('cart.viewOrders')}
            </Link>
            <Link
              href="/marketplace"
              className="block w-full bg-gray-100 text-gray-700 text-center px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition"
            >
{t('marketplace.continueShopping')}
            </Link>
          </div>
        </div>

        <BottomNav />
      </div>
    );
  }

  if (state.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm sticky top-0 z-40">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Link href="/marketplace" className="p-2 hover:bg-gray-100 rounded-lg">
                  <ArrowLeft className="w-5 h-5" />
                </Link>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg overflow-hidden">
                    <Image
                      src="/logo.jpeg"
                      alt="Premier Logo"
                      width={32}
                      height={32}
                      className="object-contain w-full h-full"
                    />
                  </div>
                  <span className="font-bold text-lg">{t('cart.title')}</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Empty Cart */}
        <div className="flex flex-col items-center justify-center py-20 px-4">
          <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center mb-6">
            <ShoppingBag className="w-16 h-16 text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('cart.empty')}</h2>
          <p className="text-gray-600 text-center mb-8 max-w-sm">
            {t('cart.emptyMessage')}
          </p>
          <Link
            href="/marketplace"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition"
          >
            {t('marketplace.continueShopping')}
          </Link>
        </div>

        <BottomNav />
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
              onClick={handleClearCart}
              className="text-red-600 text-sm font-medium hover:text-red-700"
            >
              Clear All
            </button>
          </div>
        </div>
      </header>

      {/* Cart Items */}
      <div className="px-4 py-4">
        <div className="bg-white rounded-lg shadow-sm mb-4">
          <div className="p-4 border-b">
            <h3 className="font-semibold text-gray-900">
              Cart Items ({state.itemCount} {state.itemCount === 1 ? 'item' : 'items'})
            </h3>
          </div>

          <div className="divide-y">
            {state.items.map((item) => (
              <div key={`${item.id}-${item.type}`} className="p-4">
                <div className="flex items-start space-x-4">
                  {/* Product Image */}
                  <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    <Image
                      src={item.image}
                      alt={item.name}
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Product Details */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 mb-1">{item.name}</h4>
                    <p className="text-sm text-gray-600 mb-2">
                      £{(typeof item.price === 'number' ? item.price : parseFloat(item.price)).toFixed(2)} per {item.packSize}
                      {item.type && (
                        <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                          {item.type.toUpperCase()}
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-gray-500 mb-3">
                      MOQ: {item.moq} units
                    </p>

                    {/* Quantity Controls */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => handleQuantityChange(item.id, item.type || 'pc', item.quantity - item.moq, item.moq)}
                          disabled={item.quantity <= item.moq}
                          className="p-1 rounded-full border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        
                        <div className="text-center">
                          <div className="font-medium">{item.quantity}</div>
                          <div className="text-xs text-gray-500">units</div>
                        </div>
                        
                        <button
                          onClick={() => handleQuantityChange(item.id, item.type || 'pc', item.quantity + item.moq, item.moq)}
                          className="p-1 rounded-full border border-gray-300 hover:bg-gray-50"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Item Total & Remove */}
                      <div className="text-right">
                        <div className="font-semibold text-gray-900">
                          £{((typeof item.price === 'number' ? item.price : parseFloat(item.price)) * item.quantity).toFixed(2)}
                        </div>
                        <button
                          onClick={() => handleRemoveItem(item.id, item.type || 'pc')}
                          className="text-red-600 text-sm hover:text-red-700 mt-1 flex items-center space-x-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-4 border-b">
            <h3 className="font-semibold text-gray-900">Order Summary</h3>
          </div>

          <div className="p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal ({state.itemCount} items)</span>
              <span className="font-medium">£{state.total.toFixed(2)}</span>
            </div>

            {/* Offers Section */}
            {state.offerCalculation && state.offerCalculation.applicableOffers.length > 0 && (
              <div className="border-t pt-3 space-y-2">
                <div className="text-sm font-medium text-green-700 flex items-center gap-1">
                  <Gift className="w-4 h-4" />
                  Active Offers
                </div>
                {state.offerCalculation.applicableOffers.map((offer) => (
                  <div key={offer.offerId} className="flex justify-between text-sm">
                    <div className="flex items-center gap-2">
                      {offer.type === 'PERCENT_OFF' && <Percent className="w-3 h-3 text-red-500" />}
                      {offer.type === 'AMOUNT_OFF' && <DollarSign className="w-3 h-3 text-green-500" />}
                      {offer.type === 'FREE_ITEM' && <Gift className="w-3 h-3 text-purple-500" />}
                      <span className="text-gray-600">{offer.offerName}</span>
                    </div>
                    <span className="font-medium text-green-600">
                      {offer.type === 'FREE_ITEM' 
                        ? 'Free Item' 
                        : `-£${(typeof offer.discount === 'number' ? offer.discount : parseFloat(offer.discount || '0')).toFixed(2)}`
                      }
                    </span>
                  </div>
                ))}
                
                {/* Free Items */}
                {state.offerCalculation.freeItems.length > 0 && (
                  <div className="bg-purple-50 p-2 rounded text-sm">
                    <div className="font-medium text-purple-800 mb-1">Free Items:</div>
                    {state.offerCalculation.freeItems.map((freeItem, index) => (
                      <div key={index} className="text-purple-700">
                        • {freeItem.quantity}x Free Item (ID: {freeItem.productId.slice(0, 8)}...)
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="flex justify-between text-sm font-medium text-green-700">
                  <span>Total Savings:</span>
                  <span>-£{(typeof state.offerCalculation.totalDiscount === 'number' ? state.offerCalculation.totalDiscount : parseFloat(state.offerCalculation.totalDiscount || '0')).toFixed(2)}</span>
                </div>
              </div>
            )}

            {state.isCalculatingOffers && (
              <div className="border-t pt-3">
                <div className="text-sm text-gray-500 flex items-center gap-2">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                  Calculating offers...
                </div>
              </div>
            )}
            
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Estimated Delivery</span>
              <span className="text-green-600 font-medium">Free</span>
            </div>
            
            <div className="border-t pt-3">
              <div className="flex justify-between text-lg font-semibold">
                <span>Total</span>
                <span>
                  {state.offerCalculation 
                    ? `£${(typeof state.offerCalculation.finalAmount === 'number' ? state.offerCalculation.finalAmount : parseFloat(state.offerCalculation.finalAmount || '0')).toFixed(2)}`
                    : `£${state.total.toFixed(2)}`
                  }
                </span>
              </div>
              {state.offerCalculation && state.offerCalculation.totalDiscount > 0 && (
                <div className="text-sm text-gray-500 line-through">
                  Original: £{(typeof state.offerCalculation.originalAmount === 'number' ? state.offerCalculation.originalAmount : parseFloat(state.offerCalculation.originalAmount || '0')).toFixed(2)}
                </div>
              )}
            </div>

            {/* Note about MOQ */}
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> All quantities respect minimum order quantities (MOQ) for wholesale pricing.
              </p>
            </div>
          </div>
        </div>

        {/* Checkout Button */}
        <div className="mt-6">
          <button
            onClick={handleProceedToCheckout}
            disabled={isProcessing}
            className="w-full bg-blue-600 text-white py-4 rounded-lg font-semibold text-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
{isProcessing ? 'Processing...' : `Proceed to Checkout • £${
              state.offerCalculation 
                ? (typeof state.offerCalculation.finalAmount === 'number' ? state.offerCalculation.finalAmount : parseFloat(state.offerCalculation.finalAmount || '0')).toFixed(2)
                : state.total.toFixed(2)
            }`}
          </button>
          
          <Link
            href="/marketplace"
            className="block text-center text-blue-600 py-3 font-medium hover:text-blue-700"
          >
            Continue Shopping
          </Link>
        </div>
      </div>

      <BottomNav />
      <FloatingAgentButton />
    </div>
  );
}