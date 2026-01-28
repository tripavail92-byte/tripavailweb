import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface WishlistItem {
  id: string;
  type: 'hotel' | 'tour';
  title: string;
  location: string;
  image: string;
  price: number;
  rating?: number;
}

interface WishlistState {
  items: WishlistItem[];
  addItem: (item: WishlistItem) => void;
  removeItem: (id: string) => void;
  isInWishlist: (id: string) => boolean;
  clearWishlist: () => void;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (item) => {
        const { items } = get();
        if (!items.some((i) => i.id === item.id)) {
          set({ items: [...items, item] });
        }
      },

      removeItem: (id) => {
        set({ items: get().items.filter((i) => i.id !== id) });
      },

      isInWishlist: (id) => {
        return get().items.some((i) => i.id === id);
      },

      clearWishlist: () => {
        set({ items: [] });
      },
    }),
    {
      name: 'tripavail-wishlist', // unique name for localStorage
    }
  )
);
