import { create } from 'zustand';
import { CartItem, Medicine } from '../types';

interface CartState {
  items: CartItem[];
  addItem: (medicine: Medicine, quantity?: number) => void;
  updateQuantity: (medicineId: string, quantity: number) => void;
  updateCustomPrice: (medicineId: string, price: number) => void;
  removeItem: (medicineId: string) => void;
  clearCart: () => void;
  refreshPrices: (latestMedicines: Medicine[]) => void;
  getItemCount: () => number;
  getSubtotal: () => number;
}

/**
 * Safe currency calculation avoiding IEEE-754 decimal drift
 */
function roundToCents(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],

  addItem: (medicine: Medicine, quantity = 1) => {
    set((state) => {
      const existingIndex = state.items.findIndex(
        (i) =>
          i.medicine.id === medicine.id ||
          (i.medicine.name.trim().toLowerCase() === medicine.name.trim().toLowerCase() &&
            i.medicine.sellingPrice === medicine.sellingPrice),
      );
      if (existingIndex > -1) {
        const newItems = [...state.items];
        newItems[existingIndex].quantity += quantity;
        return { items: newItems };
      }
      return {
        items: [
          ...state.items,
          {
            medicine,
            quantity: Math.max(1, quantity),
            customPrice: roundToCents(medicine.sellingPrice),
          },
        ],
      };
    });
  },

  updateQuantity: (medicineId: string, quantity: number) => {
    set((state) => {
      if (quantity <= 0) {
        return { items: state.items.filter((i) => i.medicine.id !== medicineId) };
      }
      return {
        items: state.items.map((item) =>
          item.medicine.id === medicineId ? { ...item, quantity } : item,
        ),
      };
    });
  },

  updateCustomPrice: (medicineId: string, price: number) => {
    set((state) => ({
      items: state.items.map((item) =>
        item.medicine.id === medicineId
          ? { ...item, customPrice: roundToCents(Math.max(0, price)) }
          : item,
      ),
    }));
  },

  removeItem: (medicineId: string) => {
    set((state) => ({
      items: state.items.filter((item) => item.medicine.id !== medicineId),
    }));
  },

  clearCart: () => {
    set({ items: [] });
  },

  refreshPrices: (latestMedicines: Medicine[]) => {
    set((state) => {
      const updated = state.items.map((item) => {
        const fresh = latestMedicines.find((m) => m.id === item.medicine.id);
        if (fresh) {
          return {
            ...item,
            medicine: fresh,
            customPrice: roundToCents(fresh.sellingPrice),
          };
        }
        return item;
      });
      return { items: updated };
    });
  },

  getItemCount: () => {
    return get().items.reduce((total, item) => total + item.quantity, 0);
  },

  getSubtotal: () => {
    const rawTotal = get().items.reduce((sum, item) => {
      const unitPrice =
        item.customPrice !== undefined ? item.customPrice : item.medicine.sellingPrice;
      return sum + roundToCents(unitPrice) * item.quantity;
    }, 0);
    return roundToCents(rawTotal);
  },
}));
