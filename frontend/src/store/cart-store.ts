import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { cartApi } from '@/lib/api';

interface CartItem {
  id: string;
  cartId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  product?: { id: string; name: string; price: number; images: string[] };
}

interface CartState {
  cartId: string | null;
  items: CartItem[];
  isLoading: boolean;
  fetchCart: () => Promise<void>;
  initCart: () => Promise<string>;
  addItem: (productId: string, quantity: number, variantId?: string, unitPrice?: number) => Promise<void>;
  updateItem: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  getTotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      cartId: null,
      items: [],
      isLoading: false,

      fetchCart: async () => {
        set({ isLoading: true });
        try {
          const data: any = await cartApi.getCart();
          set({ cartId: data.id, items: data.items || [], isLoading: false });
        } catch {
          set({ isLoading: false });
        }
      },

      initCart: async () => {
        const data: any = await cartApi.initCart();
        set({ cartId: data.id, items: data.items || [] });
        return data.id;
      },

      addItem: async (productId, quantity, variantId, unitPrice) => {
        set({ isLoading: true });
        try {
          let cartId = get().cartId;
          if (!cartId) {
            cartId = await get().initCart();
          }
          await cartApi.addItem({ cartId, productId, quantity, variantId, unitPrice });
          await get().fetchCart();
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      updateItem: async (itemId, quantity) => {
        set({ isLoading: true });
        try {
          const cartId = get().cartId;
          if (!cartId) throw new Error('No cart');
          await cartApi.updateItem(cartId, itemId, { quantity });
          await get().fetchCart();
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      removeItem: async (itemId) => {
        set({ isLoading: true });
        try {
          const cartId = get().cartId;
          if (!cartId) throw new Error('No cart');
          await cartApi.removeItem(cartId, itemId);
          await get().fetchCart();
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      clearCart: async () => {
        const cartId = get().cartId;
        if (cartId) {
          await cartApi.clearCart(cartId);
        }
        set({ items: [], cartId: null });
      },

      getTotal: () => {
        return get().items.reduce((sum, item) => sum + (item.unitPrice || 0) * item.quantity, 0);
      },
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({ cartId: state.cartId, items: state.items }),
    }
  )
);