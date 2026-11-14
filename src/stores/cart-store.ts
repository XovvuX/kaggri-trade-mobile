import { create } from "zustand";
import type { CartItem, Product, Vendor } from "@/types";
import { getUnitPriceForQty } from "@/utils";
import { cartService, formatSaleUnit } from "@/services";
import { getSession, imageUrl, type KaggriCart, type KaggriCartItem } from "@/services/api";

function mapKaggriCartItem(item: KaggriCartItem): CartItem {
  return {
    id: item.id,
    productId: item.productId,
    vendorId: item.vendor.id,
    name: item.productName,
    sku: item.slug,
    slug: item.slug,
    unit: formatSaleUnit(item.saleUnit),
    qty: item.quantity,
    unitPrice: item.unitPriceVnd,
    amount: item.lineSubtotalVnd,
    image: "🌿",
    imageUrl: item.mainImageUrl ? imageUrl(item.mainImageUrl) : null,
    vendorName: item.vendor.displayName,
    minQty: item.minimumOrderQuantity,
    available: item.availableQuantity,
    availability: item.availability,
    preorderEnabled: item.preorderEnabled,
    preorderLeadDays: item.preorderLeadDays,
    isValidForCheckout: item.isValidForCheckout,
    validationIssues: item.validationIssues || [],
  };
}

function hasApiSession(): boolean {
  const session = getSession();
  return Boolean(session?.accessToken && !session.accessToken.startsWith("mock-token-"));
}

type PendingCartAdd = {
  product: Product;
  vendor: Vendor;
  qty: number;
  goToCheckout?: boolean;
};

type CartState = {
  items: CartItem[];
  pendingAdd: PendingCartAdd | null;
  loading: boolean;
  syncing: boolean;
  error: string | null;
  isFromApi: boolean;
  estimatedSubtotalVnd: number;
  totalVendorsCount: number;
  setPendingAdd: (pending: PendingCartAdd | null) => void;
  flushPendingAdd: () => Promise<{ added?: CartItem; goToCheckout?: boolean } | null>;
  applyApiCart: (cart: KaggriCart) => void;
  fetchCart: () => Promise<void>;
  add: (product: Product, vendor: Vendor, qty?: number) => Promise<CartItem | undefined>;
  remove: (productId: string, itemId?: string) => Promise<void>;
  bulkDelete: (itemIds: string[]) => Promise<void>;
  updateQty: (productId: string, qty: number, itemId?: string) => Promise<void>;
  clear: () => Promise<void>;
  totalAmount: () => number;
  totalQty: () => number;
  vendorCount: () => number;
};

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  pendingAdd: null,
  loading: false,
  syncing: false,
  error: null,
  isFromApi: false,
  estimatedSubtotalVnd: 0,
  totalVendorsCount: 0,

  setPendingAdd: (pending) => set({ pendingAdd: pending }),

  flushPendingAdd: async () => {
    const pending = get().pendingAdd;
    if (!pending || !hasApiSession()) return null;
    set({ pendingAdd: null });
    const added = await get().add(pending.product, pending.vendor, pending.qty);
    return { added, goToCheckout: pending.goToCheckout };
  },

  applyApiCart: (cart) => {
    set({
      items: (cart.items || []).map(mapKaggriCartItem),
      isFromApi: true,
      estimatedSubtotalVnd: cart.estimatedMerchandiseSubtotalVnd ?? 0,
      totalVendorsCount: cart.totalVendors ?? 0,
      error: null,
    });
  },

  fetchCart: async () => {
    if (!hasApiSession()) return;
    set({ loading: true, error: null });
    try {
      const cart = await cartService.getCart();
      get().applyApiCart(cart);
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Không thể tải giỏ hàng." });
    } finally {
      set({ loading: false });
    }
  },

  add: async (product, vendor, qty) => {
    const targetQty = qty ?? product.qty;
    if (hasApiSession()) {
      set({ syncing: true, error: null });
      try {
        const cart = await cartService.addItem(product.id, targetQty);
        get().applyApiCart(cart);
        return get().items.find((i) => i.productId === product.id);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Không thể thêm vào giỏ hàng.";
        set({ error: msg });
        throw err;
      } finally {
        set({ syncing: false });
      }
    }

    // Fallback local state when guest / offline
    const unitPrice = getUnitPriceForQty(product, targetQty);
    const existing = get().items.find((i) => i.productId === product.id);
    if (existing) {
      set({
        items: get().items.map((i) =>
          i.productId === product.id
            ? { ...i, qty: targetQty, unitPrice, amount: targetQty * unitPrice }
            : i
        ),
      });
    } else {
      const newItem: CartItem = {
        productId: product.id,
        vendorId: product.vendorId,
        name: product.name,
        sku: product.sku,
        unit: product.unit,
        qty: targetQty,
        unitPrice,
        amount: targetQty * unitPrice,
        image: product.image,
        vendorName: vendor.shortName,
        minQty: product.minQty,
        available: product.available,
        isValidForCheckout: true,
        validationIssues: [],
      };
      set({ items: [...get().items, newItem] });
    }
    return get().items.find((i) => i.productId === product.id);
  },

  remove: async (productId, itemId) => {
    const target = get().items.find(
      (i) => i.productId === productId || (itemId && i.id === itemId)
    );
    const idToRemove = itemId || target?.id;

    if (hasApiSession() && idToRemove) {
      set({ syncing: true, error: null });
      try {
        const cart = await cartService.removeItem(idToRemove);
        get().applyApiCart(cart);
        return;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Không thể xóa sản phẩm.";
        set({ error: msg });
        throw err;
      } finally {
        set({ syncing: false });
      }
    }

    set({ items: get().items.filter((i) => i.productId !== productId) });
  },

  bulkDelete: async (itemIds) => {
    if (itemIds.length === 0) return;
    if (hasApiSession()) {
      set({ syncing: true, error: null });
      try {
        const cart = await cartService.bulkDeleteItems(itemIds);
        get().applyApiCart(cart);
        return;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Không thể xóa các sản phẩm đã chọn.";
        set({ error: msg });
        throw err;
      } finally {
        set({ syncing: false });
      }
    }
    const idSet = new Set(itemIds);
    set({ items: get().items.filter((i) => !idSet.has(i.id || i.productId)) });
  },

  updateQty: async (productId, qty, itemId) => {
    const target = get().items.find(
      (i) => i.productId === productId || (itemId && i.id === itemId)
    );
    const idToUpdate = itemId || target?.id;

    if (hasApiSession() && idToUpdate) {
      set({ syncing: true, error: null });
      try {
        const cart = await cartService.updateItem(idToUpdate, qty);
        get().applyApiCart(cart);
        return;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Không thể cập nhật số lượng.";
        set({ error: msg });
        throw err;
      } finally {
        set({ syncing: false });
      }
    }

    set({
      items: get().items.map((i) => {
        if (i.productId !== productId) return i;
        const maxQty = i.preorderEnabled ? qty : Math.max(i.minQty, i.available);
        const safeQty = Math.max(i.minQty, Math.min(qty, maxQty));
        return {
          ...i,
          qty: safeQty,
          amount: safeQty * i.unitPrice,
        };
      }),
    });
  },

  clear: async () => {
    if (hasApiSession()) {
      try {
        const cart = await cartService.clearCart();
        get().applyApiCart(cart);
        return;
      } catch {
        // Fallback clear local cache
      }
    }
    set({ items: [], estimatedSubtotalVnd: 0, totalVendorsCount: 0 });
  },

  totalAmount: () => {
    const state = get();
    if (state.isFromApi && state.estimatedSubtotalVnd > 0) {
      return state.estimatedSubtotalVnd;
    }
    return state.items.reduce((sum, i) => sum + i.amount, 0);
  },

  totalQty: () => get().items.length,

  vendorCount: () => {
    const state = get();
    if (state.isFromApi && state.totalVendorsCount > 0) {
      return state.totalVendorsCount;
    }
    return new Set(state.items.map((i) => i.vendorId)).size;
  },
}));
