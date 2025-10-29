import axios from 'axios';

export interface Offer {
  id: string;
  name: string;
  description?: string;
  type: 'FREE_ITEM' | 'PERCENT_OFF' | 'AMOUNT_OFF';
  percentOff?: number;
  amountOff?: number;
  freeItemProductId?: string;
  freeItemQty?: number;
  startsAt?: string;
  endsAt?: string;
  minQuantity: number;
  minOrderAmount?: number;
  appliesToAnyQty: boolean;
  maxPerUser?: number;
  maxTotalRedemptions?: number;
  priority: number;
  isStackable: boolean;
  isActive: boolean;
  freeItemProduct?: {
    id: string;
    name: string;
    sku: string;
  };
}

export interface CartItem {
  productId: string;
  quantity: number;
  unitPrice: number;
}

export interface OfferCalculationResult {
  offerId: string;
  offerName: string;
  type: 'FREE_ITEM' | 'PERCENT_OFF' | 'AMOUNT_OFF';
  discount: number;
  freeItems?: {
    productId: string;
    quantity: number;
  }[];
}

export interface CartCalculationResult {
  applicableOffers: OfferCalculationResult[];
  totalDiscount: number;
  finalAmount: number;
  originalAmount: number;
  freeItems: {
    productId: string;
    quantity: number;
  }[];
}

class OffersService {
  private baseURL = '/api/offers';

  async getApplicableOffers(params: {
    productId?: string;
    category?: string;
    collection?: string;
  }): Promise<Offer[]> {
    try {
      const queryParams = new URLSearchParams();
      if (params.productId) queryParams.append('productId', params.productId);
      if (params.category) queryParams.append('category', params.category);
      if (params.collection) queryParams.append('collection', params.collection);

      const response = await axios.get(`${this.baseURL}/applicable?${queryParams}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch applicable offers:', error);
      return [];
    }
  }

  async calculateCartOffers(cartItems: CartItem[]): Promise<CartCalculationResult | null> {
    try {
      const response = await axios.post(`${this.baseURL}/calculate`, {
        cartItems
      });
      return response.data;
    } catch (error) {
      console.error('Failed to calculate cart offers:', error);
      return null;
    }
  }

  async getOffersByProducts(productIds: string[]): Promise<Map<string, Offer[]>> {
    const offersByProduct = new Map<string, Offer[]>();
    
    // We could make individual requests for each product, but that would be inefficient
    // Instead, we'll get offers by checking if any products match various scopes
    try {
      // For now, we'll get all applicable offers and filter them
      // In a real implementation, you might want a batch API endpoint
      const allOffers = await this.getApplicableOffers({});
      
      // This is a simplified implementation - in practice, you'd want to 
      // check each product against offer scopes on the server side
      productIds.forEach(productId => {
        offersByProduct.set(productId, allOffers);
      });
      
      return offersByProduct;
    } catch (error) {
      console.error('Failed to get offers for products:', error);
      return offersByProduct;
    }
  }

  formatOfferText(offer: Offer): string {
    switch (offer.type) {
      case 'PERCENT_OFF':
        return `${offer.percentOff}% off`;
      case 'AMOUNT_OFF':
        return `£${offer.amountOff} off`;
      case 'FREE_ITEM':
        return offer.freeItemProduct ? `Free ${offer.freeItemProduct.name}` : 'Free item';
      default:
        return 'Special offer';
    }
  }

  formatOfferDescription(offer: Offer): string {
    let description = this.formatOfferText(offer);
    
    if (offer.minQuantity > 0) {
      description += ` (min ${offer.minQuantity} items)`;
    }
    
    if (offer.minOrderAmount) {
      description += ` (min order £${offer.minOrderAmount})`;
    }
    
    return description;
  }

  isOfferActive(offer: Offer): boolean {
    if (!offer.isActive) return false;
    
    const now = new Date();
    
    if (offer.startsAt && new Date(offer.startsAt) > now) {
      return false;
    }
    
    if (offer.endsAt && new Date(offer.endsAt) < now) {
      return false;
    }
    
    return true;
  }

  getActiveOffers(offers: Offer[]): Offer[] {
    return offers.filter(offer => this.isOfferActive(offer));
  }

  getBestOffer(offers: Offer[]): Offer | null {
    const activeOffers = this.getActiveOffers(offers);
    if (activeOffers.length === 0) return null;
    
    // Sort by priority (highest first)
    return activeOffers.sort((a, b) => b.priority - a.priority)[0];
  }
}

export const offersService = new OffersService();
export default offersService;