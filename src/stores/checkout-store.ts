import { create } from "zustand";
import type {
  KaggriCheckoutQuote,
  KaggriDeliveryAddress,
  KaggriParentOrder,
  KaggriPaymentInitiation,
} from "@/services/api";

type CheckoutState = {
  selectedCartItemIds: string[];
  deliveryAddress: KaggriDeliveryAddress;
  quotes: KaggriCheckoutQuote[];
  createdOrders: KaggriParentOrder[];
  activeOrder: KaggriParentOrder | null;
  paymentInitiation: KaggriPaymentInitiation | null;
  setSelectedCartItemIds: (ids: string[]) => void;
  setDeliveryAddress: (addr: Partial<KaggriDeliveryAddress>) => void;
  setQuotes: (quotes: KaggriCheckoutQuote[]) => void;
  setCreatedOrders: (orders: KaggriParentOrder[]) => void;
  setActiveOrder: (order: KaggriParentOrder | null) => void;
  setPaymentInitiation: (init: KaggriPaymentInitiation | null) => void;
  reset: () => void;
};

const defaultAddress: KaggriDeliveryAddress = {
  recipientName: "Nguyễn Minh Anh",
  recipientPhone: "0901234567",
  province: "TP. Hồ Chí Minh",
  district: "Quận Bình Tân",
  ward: "Phường Bình Trị Đông B",
  addressLine: "128 Đường số 7",
  deliveryNote: "Giao trước 06:00 sáng tại cửa kho lạnh.",
};

export const useCheckoutStore = create<CheckoutState>((set) => ({
  selectedCartItemIds: [],
  deliveryAddress: defaultAddress,
  quotes: [],
  createdOrders: [],
  activeOrder: null,
  paymentInitiation: null,

  setSelectedCartItemIds: (ids) => set({ selectedCartItemIds: ids }),
  setDeliveryAddress: (addr) =>
    set((state) => ({
      deliveryAddress: { ...state.deliveryAddress, ...addr },
    })),
  setQuotes: (quotes) => set({ quotes }),
  setCreatedOrders: (orders) =>
    set({
      createdOrders: orders,
      activeOrder: orders[0] ?? null,
    }),
  setActiveOrder: (order) => set({ activeOrder: order }),
  setPaymentInitiation: (init) => set({ paymentInitiation: init }),
  reset: () =>
    set({
      selectedCartItemIds: [],
      quotes: [],
      createdOrders: [],
      activeOrder: null,
      paymentInitiation: null,
    }),
}));
