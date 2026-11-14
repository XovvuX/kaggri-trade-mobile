import type { Product, Vendor, PriceTier, CartItem } from "@/types";

export function formatVND(value: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatVNDShort(value: number): string {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)} tỷ`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)} tr`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}k`;
  return value.toString();
}

export function formatDate(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatDateTime(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getPriceTierForQuantity(product: Product, qty?: number): PriceTier {
  const target = qty ?? product.qty;
  return (
    product.priceTiers.find((tier) => {
      if (tier.maxQty === null) return target >= tier.minQty;
      return target >= tier.minQty && target <= tier.maxQty;
    }) ?? product.priceTiers[0]
  );
}

export function getUnitPriceForQty(product: Product, qty: number): number {
  return getPriceTierForQuantity(product, qty).unitPrice;
}

export function getVendorById(vendors: Vendor[], id: string): Vendor | undefined {
  return vendors.find((v) => v.id === id);
}

export function getProductById(products: Product[], id: string): Product | undefined {
  return products.find((p) => p.id === id);
}

export function calculateCartItemAmount(item: CartItem): number {
  return item.qty * item.unitPrice;
}

export function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

export function getMinPreorderDate(leadDays = 7): string {
  const d = new Date(Date.now() + leadDays * 86400_000);
  return d.toISOString().split("T")[0];
}

export function groupCartByVendor<T extends { vendorId: string }>(items: T[]): Record<string, T[]> {
  return items.reduce<Record<string, T[]>>((acc, item) => {
    if (!acc[item.vendorId]) acc[item.vendorId] = [];
    acc[item.vendorId].push(item);
    return acc;
  }, {});
}

export function getParentOrderStatusText(status: string): string {
  const map: Record<string, string> = {
    AWAITING_PAYMENT: "Chờ chọn phương thức thanh toán",
    PAYMENT_PROCESSING: "Đang xử lý thanh toán",
    PENDING_SUPPLIER_CONFIRMATION: "Chờ nhà cung cấp xác nhận",
    PARTIALLY_CONFIRMED: "Đã xác nhận một phần",
    CONFIRMED: "Nhà cung cấp đã xác nhận",
    PARTIALLY_PAID: "Đã thanh toán một phần",
    PAID: "Đã thanh toán",
    REJECTED: "Tất cả VendorOrder bị từ chối",
  };
  return map[status] || status;
}

export function getVendorOrderStatusText(status: string): string {
  const map: Record<string, string> = {
    AWAITING_CONFIRMATION: "Chờ xác nhận nguồn cung",
    CONFIRMED: "Đã xác nhận nguồn cung",
    PENDING_PAYMENT: "Chờ người mua thanh toán",
    PAID: "Đã thanh toán • Chờ chuẩn bị",
    PREPARING: "Đang chuẩn bị hàng",
    READY_TO_SHIP: "Sẵn sàng giao",
    SHIPPED: "Đang vận chuyển",
    DELIVERED: "Đã giao hàng",
    COMPLETED: "Hoàn thành",
    CANCELLED: "Đã hủy",
    PENDING_CONFIRMATION: "Chờ xác nhận",
    ACCEPTED: "Đã chấp nhận",
    REJECTED: "Đã từ chối",
    COMMITTED: "Đã cam kết",
    SCHEDULED: "Đã lên lịch",
  };
  return map[status] || status;
}

export function getStatusChipColor(status: string): string {
  const map: Record<string, string> = {
    AWAITING_CONFIRMATION: "#f59e0b",
    CONFIRMED: "#10b981",
    PENDING_PAYMENT: "#f59e0b",
    PAID: "#059669",
    PREPARING: "#3b82f6",
    READY_TO_SHIP: "#6366f1",
    SHIPPED: "#8b5cf6",
    DELIVERED: "#10b981",
    COMPLETED: "#10b981",
    CANCELLED: "#ef4444",
    PENDING_CONFIRMATION: "#f59e0b",
    ACCEPTED: "#10b981",
    REJECTED: "#ef4444",
    COMMITTED: "#10b981",
    SCHEDULED: "#8b5cf6",
  };
  return map[status] || "#6b7280";
}
