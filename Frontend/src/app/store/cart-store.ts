import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  productId: string;
  productName: string;
  productImage: string;
  price: number;
  quantity: number;
  variantId?: string;
  variantDetails?: string;
}

interface CartState {
  items: CartItem[];
  couponCode: string | null;
  discount: number;
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (productId: string, variantId?: string) => void;
  updateQuantity: (productId: string, quantity: number, variantId?: string) => void;
  applyCoupon: (code: string) => boolean;
  removeCoupon: () => void;
  clearCart: () => void;
  getSubtotal: () => number;
  getTax: () => number;
  getShipping: () => number;
  getTotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      couponCode: null,
      discount: 0,

      addItem: (item) => {
        const { items } = get();
        const existingIndex = items.findIndex(
          i => i.productId === item.productId && i.variantId === item.variantId
        );

        if (existingIndex >= 0) {
          const newItems = [...items];
          newItems[existingIndex].quantity += 1;
          set({ items: newItems });
        } else {
          set({ items: [...items, { ...item, quantity: 1 }] });
        }
      },

      removeItem: (productId, variantId) => {
        set(state => ({
          items: state.items.filter(
            item => !(item.productId === productId && item.variantId === variantId)
          ),
        }));
      },

      updateQuantity: (productId, quantity, variantId) => {
        if (quantity <= 0) {
          get().removeItem(productId, variantId);
          return;
        }

        set(state => ({
          items: state.items.map(item =>
            item.productId === productId && item.variantId === variantId
              ? { ...item, quantity }
              : item
          ),
        }));
      },

      applyCoupon: (code) => {
        // Mock coupon validation
        const validCoupons: Record<string, number> = {
          'SAVE10': 10,
          'SAVE20': 20,
          'SPRING25': 25,
        };

        const discount = validCoupons[code.toUpperCase()];
        if (discount) {
          set({ couponCode: code.toUpperCase(), discount });
          return true;
        }
        return false;
      },

      removeCoupon: () => {
        set({ couponCode: null, discount: 0 });
      },

      clearCart: () => {
        set({ items: [], couponCode: null, discount: 0 });
      },

      getSubtotal: () => {
        const { items } = get();
        return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      },

      getTax: () => {
        const subtotal = get().getSubtotal();
        return subtotal * 0.09; // 9% tax
      },

      getShipping: () => {
        const subtotal = get().getSubtotal();
        return subtotal > 50 ? 0 : 10; // Free shipping over $50
      },

      getTotal: () => {
        const { discount } = get();
        const subtotal = get().getSubtotal();
        const tax = get().getTax();
        const shipping = get().getShipping();
        const discountAmount = (subtotal * discount) / 100;
        return subtotal + tax + shipping - discountAmount;
      },
    }),
    {
      name: 'cart-storage',
    }
  )
);
