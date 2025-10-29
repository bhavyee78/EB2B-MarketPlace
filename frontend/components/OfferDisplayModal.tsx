import React from 'react';
import { X, Percent, DollarSign, Gift, Calendar, Tag } from 'lucide-react';
import { Offer } from '@/services/offersService';

interface OfferDisplayModalProps {
  offers: Offer[];
  isOpen: boolean;
  onClose: () => void;
  productName: string;
}

export default function OfferDisplayModal({
  offers,
  isOpen,
  onClose,
  productName
}: OfferDisplayModalProps) {
  if (!isOpen) return null;

  const getOfferIcon = (type: string) => {
    switch (type) {
      case 'PERCENT_OFF':
        return <Percent className="w-4 h-4 text-green-600" />;
      case 'AMOUNT_OFF':
        return <DollarSign className="w-4 h-4 text-blue-600" />;
      case 'FREE_ITEM':
        return <Gift className="w-4 h-4 text-purple-600" />;
      default:
        return <Tag className="w-4 h-4 text-gray-600" />;
    }
  };

  const getOfferDescription = (offer: Offer) => {
    switch (offer.type) {
      case 'PERCENT_OFF':
        return `${offer.percentOff}% off`;
      case 'AMOUNT_OFF':
        return `£${parseFloat(offer.amountOff?.toString() || '0').toFixed(2)} off`;
      case 'FREE_ITEM':
        return `Get ${offer.freeItemQty || 1} free item(s)`;
      default:
        return 'Special offer';
    }
  };

  const formatDate = (dateString: string | Date) => {
    if (!dateString) return 'No expiry';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            Available Offers
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          <div className="text-sm text-gray-600 mb-4">
            Offers available for <strong>{productName}</strong>
          </div>

          {offers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Gift className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No offers available for this product</p>
            </div>
          ) : (
            <div className="space-y-4">
              {offers.map((offer) => (
                <div
                  key={offer.id}
                  className="border rounded-lg p-4 bg-gradient-to-r from-green-50 to-blue-50"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      {getOfferIcon(offer.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 mb-1">
                        {offer.name}
                      </h3>
                      
                      <p className="text-sm font-semibold text-green-700 mb-2">
                        {getOfferDescription(offer)}
                      </p>
                      
                      {offer.description && (
                        <p className="text-sm text-gray-600 mb-3">
                          {offer.description}
                        </p>
                      )}
                      
                      <div className="space-y-2 text-xs text-gray-500">
                        {offer.minQuantity > 0 && (
                          <div className="flex items-center gap-1">
                            <span>Minimum quantity: {offer.minQuantity}</span>
                          </div>
                        )}
                        
                        {offer.minOrderAmount && (
                          <div className="flex items-center gap-1">
                            <span>Minimum order: £{parseFloat(offer.minOrderAmount.toString()).toFixed(2)}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>
                            Valid until: {formatDate(offer.endsAt)}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            offer.isStackable 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-orange-100 text-orange-800'
                          }`}>
                            {offer.isStackable ? 'Stackable' : 'Non-stackable'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
            <strong>Note:</strong> Offers are automatically applied based on priority. 
            Stackable offers can be combined, while non-stackable offers apply individually.
          </div>
        </div>
      </div>
    </div>
  );
}