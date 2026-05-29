import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { cartApi } from '@/lib/api';

interface CartItem {
  id: string;
  productId: string;
  product: {
    id: string;
    name: string;
    price: number;
    images: string[];
  };
  variantId?: string;
  quantity: number;
  price: number;
}

interface CartState {
  items: CartItem[];
  isLoading: boolean;
  fetchCart: () => Promise<void>;
  addItem: (productId: string, quantity: number, variantId?: string) => Promise<void>;
  updateItem: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  checkout: () => Promise<{ orderId: string }>;
  getTotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isLoading: false,

      fetchCart: async () => {
        set({ isLoading: true });
        try {
          const { data } = await cartApi.getCart();
          set({ items: data.items || [], isLoading: false });
        } catch {
          set({ isLoading: false });
        }
      },

      addItem: async (productId, quantity, variantId) => {
        set({ isLoading: true });
        try {
          await cartApi.addItem({ productId, quantity, variantId });
          await get().fetchCart();
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      updateItem: async (itemId, quantity) => {
        set({ isLoading: true });
        try {
          await cartApi.updateItem(itemId, { quantity });
          await get().fetchCart();
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      removeItem: async (itemId) => {
        set({ isLoading: true });
        try {
          await cartApi.removeItem(itemId);
          await get().fetchCart();
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      clearCart: async () => {
        try {
          await cartApi.clearCart();
          set({ items: [] });
        } catch (error) {
          throw error;
        }
      },

      checkout: async () => {
        set({ isLoading: true });
        try {
          const { data } = await cartApi.checkout();
          set({ items: [], isLoading: false });
          return data;
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      getTotal: () => {
        return get().items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      },
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({ items: state.items }),
    }
  )
);
