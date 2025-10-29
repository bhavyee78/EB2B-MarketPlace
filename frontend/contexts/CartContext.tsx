'use client';

import { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import offersService, { CartCalculationResult } from '@/services/offersService';

export interface CartItem {
  id: string;
  name: string;
  image: string;
  price: number;
  packSize: string;
  moq: number;
  quantity: number;
  type?: 'pc' | 'cs';
}

interface CartState {
  items: CartItem[];
  total: number;
  itemCount: number;
  offerCalculation: CartCalculationResult | null;
  isCalculatingOffers: boolean;
}

type CartAction =
  | { type: 'ADD_TO_CART'; payload: Omit<CartItem, 'quantity'> & { quantity?: number } }
  | { type: 'REMOVE_FROM_CART'; payload: { id: string; type?: 'pc' | 'cs' } }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; type?: 'pc' | 'cs'; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'SET_OFFER_CALCULATION'; payload: CartCalculationResult | null }
  | { type: 'SET_CALCULATING_OFFERS'; payload: boolean };

const initialState: CartState = {
  items: [],
  total: 0,
  itemCount: 0,
  offerCalculation: null,
  isCalculatingOffers: false,
};

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_TO_CART': {
      // For PC/CS items, we need to find by both id and type
      const existingItem = state.items.find(item => 
        item.id === action.payload.id && 
        item.type === action.payload.type
      );
      
      let newItems;
      if (existingItem) {
        newItems = state.items.map(item =>
          item.id === action.payload.id && item.type === action.payload.type
            ? { ...item, quantity: item.quantity + (action.payload.quantity || action.payload.moq) }
            : item
        );
      } else {
        newItems = [
          ...state.items,
          { ...action.payload, quantity: action.payload.quantity || action.payload.moq },
        ];
      }

      const total = newItems.reduce(
        (sum, item) => sum + (item.price * item.quantity),
        0
      );
      const itemCount = newItems.reduce((sum, item) => sum + item.quantity, 0);

      return {
        ...state,
        items: newItems,
        total,
        itemCount,
      };
    }

    case 'REMOVE_FROM_CART': {
      const newItems = state.items.filter(item => 
        !(item.id === action.payload.id && item.type === action.payload.type)
      );
      const total = newItems.reduce(
        (sum, item) => sum + (item.price * item.quantity),
        0
      );
      const itemCount = newItems.reduce((sum, item) => sum + item.quantity, 0);

      return {
        ...state,
        items: newItems,
        total,
        itemCount,
      };
    }

    case 'UPDATE_QUANTITY': {
      const newItems = state.items.map(item =>
        item.id === action.payload.id && item.type === action.payload.type
          ? { ...item, quantity: Math.max(1, action.payload.quantity) }
          : item
      );

      const total = newItems.reduce(
        (sum, item) => sum + (item.price * item.quantity),
        0
      );
      const itemCount = newItems.reduce((sum, item) => sum + item.quantity, 0);

      return {
        items: newItems,
        total,
        itemCount,
      };
    }

    case 'CLEAR_CART':
      return initialState;

    case 'SET_OFFER_CALCULATION':
      return {
        ...state,
        offerCalculation: action.payload,
      };

    case 'SET_CALCULATING_OFFERS':
      return {
        ...state,
        isCalculatingOffers: action.payload,
      };

    default:
      return state;
  }
}

interface CartContextType {
  state: CartState;
  addToCart: (product: Omit<CartItem, 'quantity'>) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  recalculateOffers: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  const recalculateOffers = async () => {
    if (state.items.length === 0) {
      dispatch({ type: 'SET_OFFER_CALCULATION', payload: null });
      return;
    }

    dispatch({ type: 'SET_CALCULATING_OFFERS', payload: true });
    try {
      const cartItems = state.items.map(item => ({
        productId: item.id,
        quantity: item.quantity,
        unitPrice: item.price,
      }));

      const calculation = await offersService.calculateCartOffers(cartItems);
      dispatch({ type: 'SET_OFFER_CALCULATION', payload: calculation });
    } catch (error) {
      console.error('Failed to calculate offers:', error);
      dispatch({ type: 'SET_OFFER_CALCULATION', payload: null });
    } finally {
      dispatch({ type: 'SET_CALCULATING_OFFERS', payload: false });
    }
  };

  const addToCart = (product: Omit<CartItem, 'quantity'>) => {
    dispatch({ type: 'ADD_TO_CART', payload: product });
  };

  const removeFromCart = (id: string) => {
    dispatch({ type: 'REMOVE_FROM_CART', payload: { id } });
  };

  const updateQuantity = (id: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  // Recalculate offers when cart changes
  useEffect(() => {
    recalculateOffers();
  }, [state.items]);

  return (
    <CartContext.Provider
      value={{
        state,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        recalculateOffers,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}