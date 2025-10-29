'use client';

import { useState } from 'react';
import { X, Gift, Percent, DollarSign, Check } from 'lucide-react';

interface Offer {
  id: string;
  name: string;
  description?: string;
  type: 'FREE_ITEM' | 'PERCENT_OFF' | 'AMOUNT_OFF';
  percentOff?: number;
  amountOff?: number;
  freeItemProductId?: string;
  freeItemQty?: number;
  minQuantity: number;
  minOrderAmount?: number;
  isStackable: boolean;
  priority: number;
  freeItemProduct?: {
    id: string;
    name: string;
    sku: string;
  };
}

interface OfferSelectionModalProps {
  offers: Offer[];
  isOpen: boolean;
  onClose: () => void;
  onSelectOffers: (selectedOffers: string[]) => void;
  productName: string;
}

export default function OfferSelectionModal({ 
  offers, 
  isOpen, 
  onClose, 
  onSelectOffers, 
  productName 
}: OfferSelectionModalProps) {
  const [selectedOfferIds, setSelectedOfferIds] = useState<string[]>([]);

  if (!isOpen) return null;

  const handleOfferToggle = (offerId: string, offer: Offer) => {
    if (selectedOfferIds.includes(offerId)) {
      // Remove offer
      setSelectedOfferIds(prev => prev.filter(id => id !== offerId));
    } else {
      // Add offer - check if it can be stacked
      if (offer.isStackable) {
        // Can add multiple stackable offers
        setSelectedOfferIds(prev => [...prev, offerId]);
      } else {
        // Non-stackable offers replace other non-stackable offers
        const stackableOffers = selectedOfferIds.filter(id => {
          const existingOffer = offers.find(o => o.id === id);
          return existingOffer?.isStackable;
        });
        setSelectedOfferIds([...stackableOffers, offerId]);
      }
    }
  };

  const handleApply = () => {
    onSelectOffers(selectedOfferIds);
    onClose();
  };

  const getOfferIcon = (offer: Offer) => {
    switch (offer.type) {
      case 'PERCENT_OFF':
        return <Percent className="w-5 h-5" />;
      case 'AMOUNT_OFF':
        return <DollarSign className="w-5 h-5" />;
      case 'FREE_ITEM':
        return <Gift className="w-5 h-5" />;
      default:
        return <Gift className="w-5 h-5" />;
    }
  };

  const getOfferColor = (offer: Offer) => {
    switch (offer.type) {
      case 'PERCENT_OFF':
        return 'border-red-200 bg-red-50';
      case 'AMOUNT_OFF':
        return 'border-green-200 bg-green-50';
      case 'FREE_ITEM':
        return 'border-purple-200 bg-purple-50';
      default:
        return 'border-blue-200 bg-blue-50';
    }
  };

  const getOfferTextColor = (offer: Offer) => {
    switch (offer.type) {
      case 'PERCENT_OFF':
        return 'text-red-700';
      case 'AMOUNT_OFF':
        return 'text-green-700';
      case 'FREE_ITEM':
        return 'text-purple-700';
      default:
        return 'text-blue-700';
    }
  };

  const formatOfferText = (offer: Offer) => {
    switch (offer.type) {
      case 'PERCENT_OFF':
        return `${offer.percentOff}% OFF`;
      case 'AMOUNT_OFF':
        return `£${offer.amountOff} OFF`;
      case 'FREE_ITEM':
        return offer.freeItemProduct ? `Free ${offer.freeItemProduct.name}` : 'FREE ITEM';
      default:
        return 'SPECIAL OFFER';
    }
  };

  const formatOfferDescription = (offer: Offer) => {
    let conditions = [];
    
    if (offer.minQuantity > 0) {
      conditions.push(`Min ${offer.minQuantity} items`);
    }
    
    if (offer.minOrderAmount) {
      conditions.push(`Min order £${offer.minOrderAmount}`);
    }
    
    return conditions.length > 0 ? conditions.join(' • ') : '';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-lg max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">
            Available Offers for {productName}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4 max-h-96 overflow-y-auto">
          <p className="text-sm text-gray-600 mb-4">
            Select the offer(s) you'd like to apply. {offers.some(o => o.isStackable) ? 'Stackable offers can be combined.' : ''}
          </p>
          
          <div className="space-y-3">
            {offers.map((offer) => {
              const isSelected = selectedOfferIds.includes(offer.id);
              
              return (
                <div
                  key={offer.id}
                  onClick={() => handleOfferToggle(offer.id, offer)}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50'
                      : `${getOfferColor(offer)} hover:border-gray-300`
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className={`p-2 rounded-lg ${getOfferColor(offer)}`}>
                        <div className={getOfferTextColor(offer)}>
                          {getOfferIcon(offer)}
                        </div>
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className={`font-medium ${getOfferTextColor(offer)}`}>
                            {formatOfferText(offer)}
                          </h3>
                          {offer.isStackable && (
                            <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">
                              Stackable
                            </span>
                          )}
                        </div>
                        
                        {offer.name && (
                          <p className="text-sm font-medium text-gray-900 mt-1">
                            {offer.name}
                          </p>
                        )}
                        
                        {offer.description && (
                          <p className="text-sm text-gray-600 mt-1">
                            {offer.description}
                          </p>
                        )}
                        
                        {formatOfferDescription(offer) && (
                          <p className="text-xs text-gray-500 mt-1">
                            {formatOfferDescription(offer)}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      isSelected 
                        ? 'bg-blue-500 border-blue-500' 
                        : 'border-gray-300'
                    }`}>
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        <div className="flex justify-between items-center p-4 border-t bg-gray-50">
          <p className="text-sm text-gray-600">
            {selectedOfferIds.length} offer{selectedOfferIds.length !== 1 ? 's' : ''} selected
          </p>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              disabled={selectedOfferIds.length === 0}
            >
              Apply {selectedOfferIds.length > 0 && `(${selectedOfferIds.length})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}