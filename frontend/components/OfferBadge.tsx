'use client';

import { Gift, Percent, DollarSign } from 'lucide-react';

interface Offer {
  id: string;
  name: string;
  description?: string;
  type: 'FREE_ITEM' | 'PERCENT_OFF' | 'AMOUNT_OFF';
  percentOff?: number;
  amountOff?: number;
  priority: number;
  isStackable?: boolean;
  minQuantity?: number;
  minOrderAmount?: number;
  freeItemProduct?: {
    id: string;
    name: string;
    sku: string;
  };
}

interface OfferBadgeProps {
  offers: Offer[];
  className?: string;
  size?: 'small' | 'medium' | 'large';
  onClick?: () => void;
  isClickable?: boolean;
}

export default function OfferBadge({ 
  offers, 
  className = '', 
  size = 'medium',
  onClick,
  isClickable = false
}: OfferBadgeProps) {
  if (!offers || offers.length === 0) return null;

  // Sort offers by priority (highest first) and take the best one
  const bestOffer = offers.sort((a, b) => b.priority - a.priority)[0];

  const getOfferText = (offer: Offer) => {
    switch (offer.type) {
      case 'PERCENT_OFF':
        return `${offer.percentOff}% OFF`;
      case 'AMOUNT_OFF':
        return `£${offer.amountOff} OFF`;
      case 'FREE_ITEM':
        return 'FREE ITEM';
      default:
        return 'SPECIAL OFFER';
    }
  };

  const getOfferIcon = (offer: Offer) => {
    const iconSize = size === 'small' ? 'w-3 h-3' : size === 'large' ? 'w-5 h-5' : 'w-4 h-4';
    
    switch (offer.type) {
      case 'PERCENT_OFF':
        return <Percent className={iconSize} />;
      case 'AMOUNT_OFF':
        return <DollarSign className={iconSize} />;
      case 'FREE_ITEM':
        return <Gift className={iconSize} />;
      default:
        return <Gift className={iconSize} />;
    }
  };

  const getOfferColor = (offer: Offer) => {
    switch (offer.type) {
      case 'PERCENT_OFF':
        return 'bg-red-500 text-white';
      case 'AMOUNT_OFF':
        return 'bg-green-500 text-white';
      case 'FREE_ITEM':
        return 'bg-purple-500 text-white';
      default:
        return 'bg-blue-500 text-white';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'px-2 py-1 text-xs';
      case 'large':
        return 'px-4 py-2 text-sm font-medium';
      default:
        return 'px-3 py-1 text-xs font-medium';
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    if (isClickable && onClick) {
      e.preventDefault();
      e.stopPropagation();
      onClick();
    }
  };

  return (
    <div 
      className={`inline-flex items-center gap-1 rounded-full shadow-sm ${getOfferColor(bestOffer)} ${getSizeClasses()} ${className} ${
        isClickable ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''
      }`}
      title={isClickable && offers.length > 1 ? 'Click to see all offers' : (bestOffer.description || bestOffer.name)}
      onClick={handleClick}
    >
      {getOfferIcon(bestOffer)}
      <span>{getOfferText(bestOffer)}</span>
      {offers.length > 1 && (
        <span className="ml-1 text-xs opacity-75">
          +{offers.length - 1} {isClickable ? '(click)' : ''}
        </span>
      )}
    </div>
  );
}