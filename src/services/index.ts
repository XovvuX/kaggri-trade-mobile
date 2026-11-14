import type { Product, Vendor, PaymentMethod, User } from "@/types";
import { MOCK_PRODUCTS, MOCK_VENDORS, MOCK_PAYMENT_METHODS } from "@/data/mock";
import {
  api,
  API_BASE_URL,
  ApiError,
  createIdempotencyKey,
  getSession,
  imageUrl,
  query,
  setSession,
  type KaggriAdjustment,
  type KaggriAgreement,
  type KaggriCart,
  type KaggriCategory,
  type KaggriCheckoutPreviewResponse,
  type KaggriCheckoutQuote,
  type KaggriDeliveryAddress,
  type KaggriDocument,
  type KaggriEligibility,
  type KaggriInventory,
  type KaggriOrderListResponse,
  type KaggriOrderPayment,
  type KaggriOrderStatusHistory,
  type KaggriPage,
  type KaggriParentOrder,
  type KaggriPaymentAttempt,
  type KaggriPaymentInitiation,
  type KaggriPaymentTransaction,
  type KaggriProgress,
  type KaggriPublicProduct,
  type KaggriSession,
  type KaggriSigningSession,
  type KaggriUser,
  type KaggriVendorOrder,
  type KaggriVendorOrderListResponse,
  type KaggriVendorProduct,
} from "./api";
import { mapKaggriUserToAppUser } from "@/stores/auth-store";

// ============================================
// Unit & Product Mappers (Kaggri API -> vovu UI)
// ============================================

const SALE_UNIT_LABELS: Record<string, string> = {
  KG: "kg",
  TON: "tấn",
  BOX: "thùng",
  CRATE: "sọt",
  BAG: "bao",
  BASKET: "rổ",
  BUNDLE: "bó",
};

export function formatSaleUnit(unit?: string): string {
  if (!unit) return "kg";
  return SALE_UNIT_LABELS[unit] || unit.toLowerCase();
}

function pickProductEmoji(name: string, categoryName?: string): string {
  const text = `${name} ${categoryName || ""}`.toLowerCase();
  if (text.includes("cà chua")) return "🍅";
  if (text.includes("dưa")) return "🥒";
  if (text.includes("cải") || text.includes("xà lách") || text.includes("rau")) return "🥬";
  if (text.includes("khoai") || text.includes("cà rốt") || text.includes("củ")) return "🥕";
  if (text.includes("xoài") || text.includes("cam") || text.includes("bưởi") || text.includes("trái")) return "🍊";
  if (text.includes("gạo") || text.includes("lúa") || text.includes("ngũ cốc")) return "🌾";
  if (text.includes("tiêu") || text.includes("ớt") || text.includes("gừng") || text.includes("tỏi")) return "🌶️";
  return "🌿";
}

export function mapPublicProductToAppProduct(p: KaggriPublicProduct): Product {
  const unit = formatSaleUnit(p.saleUnit);
  const minQty = Math.max(1, Number(p.minimumOrderQuantity) || 1);
  const available = Number(p.inventory?.availableQuantity ?? p.inventory?.onHandQuantity ?? 0);
  const unitPrice = Number(p.unitPriceVnd) || 0;
  const emoji = pickProductEmoji(p.name, p.category?.name);

  const quality: Array<[string, string]> = [];
  if (p.originProvince) {
    quality.push([
      "Xuất xứ",
      p.originDistrict ? `${p.originDistrict}, ${p.originProvince}` : p.originProvince,
    ]);
  }
  if (p.variety) quality.push(["Giống", p.variety]);
  if (p.grade) quality.push(["Phân hạng", p.grade]);
  if (p.packagingDescription) quality.push(["Đóng gói", p.packagingDescription]);
  if (p.storageCondition) quality.push(["Bảo quản", p.storageCondition]);
  if (p.shelfLifeDays) quality.push(["Hạn sử dụng", `${p.shelfLifeDays} ngày`]);

  return {
    id: p.id,
    slug: p.slug,
    vendorId: p.vendor?.displayName || "vendor-kaggri",
    vendorName: p.vendor?.displayName || "Nhà cung cấp Kaggri",
    vendorProvince: p.vendor?.province || p.originProvince,
    categoryId: p.categoryId,
    categoryName: p.category?.name,
    name: p.name,
    sku: p.sku,
    unit,
    qty: minQty,
    minQty,
    available,
    availability: p.inventory?.availability || (available > 0 ? "IN_STOCK" : "OUT_OF_STOCK"),
    unitPrice,
    priceTiers: [
      { minQty, maxQty: minQty * 5 - 1, unitPrice },
      { minQty: minQty * 5, maxQty: minQty * 10 - 1, unitPrice: Math.round(unitPrice * 0.96) },
      { minQty: minQty * 10, maxQty: null, unitPrice: Math.round(unitPrice * 0.92) },
    ],
    oldUnitPrice: null,
    amount: unitPrice * minQty,
    images: [...(p.images || [])]
      .sort((a, b) => {
        if (a.isMain && !b.isMain) return -1;
        if (!a.isMain && b.isMain) return 1;
        return (a.displayOrder ?? 0) - (b.displayOrder ?? 0);
      })
      .map((img) => ({
        id: img.id,
        src: img.url ? imageUrl(img.url) : undefined,
        icon: emoji,
        label: img.altText || p.name,
        alt: img.altText || p.name,
      })),
    quality,
    image: emoji,
    note: p.packagingDescription || p.storageCondition || "Nguồn hàng nông sản từ nhà cung cấp đã xác minh trên Kaggri.",
    description: p.description,
    originProvince: p.originProvince,
    originDistrict: p.originDistrict,
    variety: p.variety,
    grade: p.grade,
    packagingDescription: p.packagingDescription,
    storageCondition: p.storageCondition,
    shelfLifeDays: p.shelfLifeDays,
    preorderEnabled: p.preorderEnabled,
    preorderLeadDays: p.preorderLeadDays,
    certificationVerified: p.certificationVerified,
  };
}

// ===== Products & Public Catalog (Module 3) =====
export const productService = {
  async listCategories(): Promise<{ items: KaggriCategory[]; isFromApi: boolean }> {
    try {
      const items = await api<KaggriCategory[]>("/categories");
      return { items, isFromApi: true };
    } catch {
      return {
        items: [
          { id: "rau-an-la", name: "Rau ăn lá", slug: "rau-an-la" },
          { id: "cu-qua", name: "Củ, quả", slug: "cu-qua" },
          { id: "trai-cay", name: "Trái cây", slug: "trai-cay" },
          { id: "gia-vi", name: "Gia vị & Thảo mộc", slug: "gia-vi" },
        ],
        isFromApi: false,
      };
    }
  },

  async searchCatalog(
    filters: Record<string, string | number | undefined> = {}
  ): Promise<{
    items: Product[];
    rawItems: KaggriPublicProduct[];
    total: number;
    page: number;
    pages: number;
    isFromApi: boolean;
  }> {
    try {
      const pageData = await api<KaggriPage<KaggriPublicProduct>>(
        `/products${query({ page: 1, limit: 20, sort: "newest", ...filters })}`
      );
      const items = pageData.items.map(mapPublicProductToAppProduct);
      return {
        items,
        rawItems: pageData.items,
        total: pageData.pagination.total,
        page: pageData.pagination.page,
        pages: pageData.pagination.pages || 1,
        isFromApi: true,
      };
    } catch {
      // Graceful fallback to MOCK_PRODUCTS when backend is offline
      let filtered = [...MOCK_PRODUCTS];
      const searchStr = String(filters.search || "").trim().toLowerCase();
      if (searchStr) {
        filtered = filtered.filter(
          (p) =>
            p.name.toLowerCase().includes(searchStr) ||
            p.sku.toLowerCase().includes(searchStr)
        );
      }
      if (filters.availability === "IN_STOCK") {
        filtered = filtered.filter((p) => p.available > 0);
      } else if (filters.availability === "OUT_OF_STOCK") {
        filtered = filtered.filter((p) => p.available <= 0);
      }
      if (filters.minPrice) {
        filtered = filtered.filter((p) => p.unitPrice >= Number(filters.minPrice));
      }
      if (filters.maxPrice) {
        filtered = filtered.filter((p) => p.unitPrice <= Number(filters.maxPrice));
      }
      if (filters.sort === "priceAsc") {
        filtered.sort((a, b) => a.unitPrice - b.unitPrice);
      } else if (filters.sort === "priceDesc") {
        filtered.sort((a, b) => b.unitPrice - a.unitPrice);
      }
      return {
        items: filtered,
        rawItems: [],
        total: filtered.length,
        page: 1,
        pages: 1,
        isFromApi: false,
      };
    }
  },

  async list(): Promise<Product[]> {
    const res = await this.searchCatalog();
    return res.items;
  },

  async getById(idOrSlug: string): Promise<Product | null> {
    try {
      const raw = await api<KaggriPublicProduct>(
        `/products/${encodeURIComponent(idOrSlug)}`
      );
      return mapPublicProductToAppProduct(raw);
    } catch {
      const found =
        MOCK_PRODUCTS.find((p) => p.id === idOrSlug || p.slug === idOrSlug) ??
        null;
      return found;
    }
  },

  async listByVendor(vendorId: string): Promise<Product[]> {
    const all = await this.list();
    const matched = all.filter((p) => p.vendorId === vendorId);
    return matched.length > 0 ? matched : all;
  },
};

// ===== Vendors =====
export const vendorService = {
  async list(): Promise<Vendor[]> {
    return MOCK_VENDORS;
  },

  async getById(id: string): Promise<Vendor | null> {
    const found = MOCK_VENDORS.find((v) => v.id === id) ?? null;
    if (found) return found;
    if (id) {
      return {
        id,
        name: id,
        shortName: id,
        location: "Việt Nam",
        certification: "Đối tác đã duyệt trên Kaggri",
        status: "verified",
      };
    }
    return null;
  },
};

// ===== Vendor Onboarding & Agreements (Module 2) =====
export const onboardingService = {
  async getSellingEligibility(): Promise<KaggriEligibility> {
    return api<KaggriEligibility>("/vendor/selling-eligibility");
  },

  async getProgress(): Promise<KaggriProgress> {
    return api<KaggriProgress>("/vendor/onboarding");
  },

  async saveDraft(payload: Record<string, unknown>): Promise<KaggriProgress> {
    return api<KaggriProgress>("/vendor/onboarding", "PATCH", payload);
  },

  async listDocuments(): Promise<KaggriDocument[]> {
    return api<KaggriDocument[]>("/vendor/onboarding/documents");
  },

  async uploadDocument(params: {
    file: { uri: string; name: string; type: string };
    documentType: string;
    issuedAt?: string;
    expiresAt?: string;
  }): Promise<KaggriDocument> {
    const formData = new FormData();
    formData.append("file", params.file as any);
    formData.append("documentType", params.documentType);
    if (params.issuedAt) formData.append("issuedAt", params.issuedAt);
    if (params.expiresAt) formData.append("expiresAt", params.expiresAt);
    return api<KaggriDocument>("/vendor/onboarding/documents", "POST", formData);
  },

  async deleteDocument(documentId: string): Promise<void> {
    await api<unknown>(`/vendor/onboarding/documents/${documentId}`, "DELETE");
  },

  async getHistory(): Promise<
    Array<{
      id: string;
      action?: string;
      fromStatus?: string;
      toStatus?: string;
      reason?: string;
      note?: string;
      createdAt: string;
    }>
  > {
    return api("/vendor/onboarding/history");
  },

  async submitApplication(): Promise<KaggriProgress> {
    return api<KaggriProgress>("/vendor/onboarding/submit", "POST");
  },

  async listAgreements(): Promise<KaggriAgreement[]> {
    return api<KaggriAgreement[]>("/vendor/agreements");
  },

  async getAgreement(id: string): Promise<KaggriAgreement> {
    return api<KaggriAgreement>(`/vendor/agreements/${id}`);
  },

  async createSigningSession(agreementId: string): Promise<KaggriSigningSession> {
    return api<KaggriSigningSession>(
      `/vendor/agreements/${agreementId}/signing-sessions`,
      "POST"
    );
  },

  async completeSigning(params: {
    sessionId: string;
    file: { uri: string; name: string; type: string };
    method: "DRAWN" | "UPLOADED";
    expectedDocumentHash: string;
    consent: boolean;
  }): Promise<KaggriAgreement> {
    const formData = new FormData();
    formData.append("file", params.file as any);
    formData.append("method", params.method);
    formData.append("expectedDocumentHash", params.expectedDocumentHash);
    formData.append("consent", String(params.consent));
    return api<KaggriAgreement>(
      `/vendor/signing-sessions/${params.sessionId}/complete`,
      "POST",
      formData
    );
  },

  async getAgreementAuditTrail(agreementId: string): Promise<
    Array<{
      id: string;
      action: string;
      actorRole?: string;
      createdAt: string;
    }>
  > {
    return api(`/vendor/agreements/${agreementId}/audit-trail`);
  },
};

// ===== Vendor Products & Inventory (Module 3) =====
export const vendorProductService = {
  async list(
    filters: Record<string, string | number | undefined> = {}
  ): Promise<KaggriPage<KaggriVendorProduct>> {
    return api<KaggriPage<KaggriVendorProduct>>(
      `/vendor/products${query({ page: 1, limit: 20, ...filters })}`
    );
  },

  async getById(id: string): Promise<KaggriVendorProduct> {
    return api<KaggriVendorProduct>(`/vendor/products/${id}`);
  },

  async create(payload: Record<string, unknown>): Promise<KaggriVendorProduct> {
    return api<KaggriVendorProduct>("/vendor/products", "POST", payload);
  },

  async update(
    id: string,
    payload: Record<string, unknown>
  ): Promise<KaggriVendorProduct> {
    return api<KaggriVendorProduct>(`/vendor/products/${id}`, "PATCH", payload);
  },

  async submitForReview(id: string): Promise<KaggriVendorProduct> {
    return api<KaggriVendorProduct>(`/vendor/products/${id}/submit`, "POST");
  },

  async updateVisibility(
    id: string,
    visibility: "ACTIVE" | "HIDDEN" | "ARCHIVED"
  ): Promise<KaggriVendorProduct> {
    return api<KaggriVendorProduct>(
      `/vendor/products/${id}/visibility`,
      "PATCH",
      { visibility }
    );
  },

  async getInventory(id: string): Promise<KaggriInventory> {
    return api<KaggriInventory>(`/vendor/products/${id}/inventory`);
  },

  async adjustInventory(
    id: string,
    changeQuantity: number,
    reason: string
  ): Promise<KaggriInventory> {
    return api<KaggriInventory>(`/vendor/products/${id}/inventory`, "PATCH", {
      changeQuantity,
      reason,
    });
  },

  async getInventoryHistory(id: string): Promise<KaggriAdjustment[]> {
    return api<KaggriAdjustment[]>(`/vendor/products/${id}/inventory/history`);
  },

  async updatePreorder(
    id: string,
    preorderEnabled: boolean,
    preorderLeadDays?: number
  ): Promise<KaggriVendorProduct> {
    return api<KaggriVendorProduct>(
      `/vendor/products/${id}/preorder`,
      "PATCH",
      {
        preorderEnabled,
        preorderLeadDays: preorderEnabled ? preorderLeadDays : undefined,
      }
    );
  },
};

// ===== Payment Methods (Mock for Module 4+) =====
export const paymentMethodService = {
  async list(): Promise<PaymentMethod[]> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(MOCK_PAYMENT_METHODS), 100);
    });
  },
};

// ===== Auth & Profile (Module 1) =====
export const authService = {
  async login(
    email: string,
    password: string,
    fallbackRole: "buyer" | "vendor" = "buyer"
  ): Promise<{ token: string; user: User; isFromApi: boolean }> {
    try {
      const session = await api<KaggriSession>("/auth/login", "POST", {
        email: email.trim(),
        password,
      });
      setSession(session);
      const user = mapKaggriUserToAppUser(
        session.user,
        session.accessToken,
        session.refreshToken
      );
      return { token: session.accessToken, user, isFromApi: true };
    } catch (err) {
      // Only fall back to offline mock login if the backend server is completely unreachable
      if (err instanceof ApiError && err.status === 0) {
        const user: User = {
          id: `u-${Date.now()}`,
          email,
          name: email.split("@")[0] || "Người dùng",
          role: fallbackRole,
          accountStatus: "ACTIVE (Offline)",
          token: `mock-token-${Date.now()}`,
        };
        return { token: user.token!, user, isFromApi: false };
      }
      throw err;
    }
  },

  async register(payload: {
    email: string;
    password: string;
    name: string;
    phone?: string;
    role: "buyer" | "vendor";
    buyerType?: "INDIVIDUAL" | "BUSINESS";
    company?: string;
    taxCode?: string;
  }): Promise<{ token: string; user: User; isFromApi: boolean }> {
    try {
      const apiBody: Record<string, unknown> = {
        email: payload.email.trim(),
        password: payload.password,
        fullName: payload.name.trim(),
        phone: payload.phone?.trim() || undefined,
        role: payload.role === "vendor" ? "VENDOR" : "BUYER",
      };
      if (payload.role === "buyer") {
        apiBody.buyerType = payload.buyerType || (payload.company ? "BUSINESS" : "INDIVIDUAL");
        if (payload.company) apiBody.companyName = payload.company.trim();
        if (payload.taxCode) apiBody.taxCode = payload.taxCode.trim();
      }

      const session = await api<KaggriSession>("/auth/register", "POST", apiBody);
      setSession(session);
      const user = mapKaggriUserToAppUser(
        session.user,
        session.accessToken,
        session.refreshToken
      );
      return { token: session.accessToken, user, isFromApi: true };
    } catch (err) {
      if (err instanceof ApiError && err.status === 0) {
        const user: User = {
          id: `u-${Date.now()}`,
          email: payload.email,
          name: payload.name,
          phone: payload.phone,
          role: payload.role,
          company: payload.company,
          taxCode: payload.taxCode,
          buyerType: payload.buyerType || "INDIVIDUAL",
          accountStatus: "ACTIVE (Offline)",
          token: `mock-token-${Date.now()}`,
        };
        return { token: user.token!, user, isFromApi: false };
      }
      throw err;
    }
  },

  async logout(): Promise<void> {
    const session = getSession();
    try {
      if (session?.refreshToken) {
        await api("/auth/logout", "POST", {
          refreshToken: session.refreshToken,
        });
      }
    } catch {
      // Ignore network errors on logout
    } finally {
      setSession(null);
    }
  },

  async getMe(): Promise<KaggriUser> {
    return api<KaggriUser>("/users/me");
  },

  async updateMe(payload: {
    fullName: string;
    phone?: string;
  }): Promise<KaggriUser> {
    return api<KaggriUser>("/users/me", "PATCH", payload);
  },

  async updateBuyerProfile(payload: {
    buyerType: "INDIVIDUAL" | "BUSINESS";
    companyName?: string;
    taxCode?: string;
  }): Promise<unknown> {
    return api("/buyer-profiles/me", "PUT", payload);
  },
};

// ===== Cart (Module 4) =====
export const cartService = {
  async getCart(): Promise<KaggriCart> {
    return api<KaggriCart>("/cart");
  },

  async addItem(productId: string, quantity: number): Promise<KaggriCart> {
    return api<KaggriCart>("/cart/items", "POST", { productId, quantity });
  },

  async updateItem(itemId: string, quantity: number): Promise<KaggriCart> {
    return api<KaggriCart>(`/cart/items/${itemId}`, "PATCH", { quantity });
  },

  async bulkUpdateItems(
    items: Array<{ itemId: string; quantity: number }>
  ): Promise<KaggriCart> {
    return api<KaggriCart>("/cart/items", "PATCH", { items });
  },

  async removeItem(itemId: string): Promise<KaggriCart> {
    return api<KaggriCart>(`/cart/items/${itemId}`, "DELETE");
  },

  async bulkDeleteItems(itemIds: string[]): Promise<KaggriCart> {
    return api<KaggriCart>("/cart/items/bulk-delete", "POST", { itemIds });
  },

  async clearCart(): Promise<KaggriCart> {
    return api<KaggriCart>("/cart", "DELETE");
  },
};

// ===== Checkout (Module 4) =====
export const checkoutService = {
  async preview(payload: {
    cartItemIds?: string[];
    deliveryAddress: KaggriDeliveryAddress;
  }): Promise<KaggriCheckoutPreviewResponse> {
    return api<KaggriCheckoutPreviewResponse>("/checkout/preview", "POST", payload);
  },

  async listQuotes(
    params: { status?: "ACTIVE" | "EXPIRED" | "CONSUMED"; page?: number; limit?: number } = {}
  ): Promise<{
    items: KaggriCheckoutQuote[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    return api(`/checkout/quotes${query(params)}`);
  },

  async getQuote(quoteId: string): Promise<KaggriCheckoutQuote> {
    return api<KaggriCheckoutQuote>(`/checkout/quotes/${quoteId}`);
  },
};

// ===== Orders (Module 4) =====
export const orderService = {
  async createOrder(
    checkoutQuoteId: string,
    idempotencyKey = createIdempotencyKey()
  ): Promise<KaggriParentOrder> {
    return api<KaggriParentOrder>(
      "/orders",
      "POST",
      { checkoutQuoteId },
      { "Idempotency-Key": idempotencyKey }
    );
  },

  async listBuyerOrders(
    params: { status?: string; page?: number; limit?: number } = {}
  ): Promise<KaggriOrderListResponse> {
    return api<KaggriOrderListResponse>(`/orders${query(params)}`);
  },

  async getBuyerOrderDetail(orderId: string): Promise<KaggriParentOrder> {
    return api<KaggriParentOrder>(`/orders/${orderId}`);
  },

  async cancelBuyerOrder(
    orderId: string,
    reason?: string
  ): Promise<KaggriParentOrder> {
    return api<KaggriParentOrder>(`/orders/${orderId}/cancel`, "POST", {
      reason: reason?.trim() || undefined,
    });
  },

  async getOrderHistory(orderId: string): Promise<KaggriOrderStatusHistory[]> {
    return api<KaggriOrderStatusHistory[]>(`/orders/${orderId}/history`);
  },
};

// ===== Vendor Orders (Module 4) =====
export const vendorOrderService = {
  async list(
    params: { status?: string; page?: number; limit?: number } = {}
  ): Promise<KaggriVendorOrderListResponse> {
    return api<KaggriVendorOrderListResponse>(`/vendor/orders${query(params)}`);
  },

  async getById(vendorOrderId: string): Promise<KaggriVendorOrder> {
    return api<KaggriVendorOrder>(`/vendor/orders/${vendorOrderId}`);
  },

  async confirmPreorder(
    vendorOrderId: string,
    payload: { estimatedReadyAt: string; vendorNote?: string }
  ): Promise<KaggriVendorOrder> {
    return api<KaggriVendorOrder>(
      `/vendor/orders/${vendorOrderId}/confirm`,
      "POST",
      payload
    );
  },

  async rejectPreorder(
    vendorOrderId: string,
    reason: string
  ): Promise<KaggriVendorOrder> {
    return api<KaggriVendorOrder>(
      `/vendor/orders/${vendorOrderId}/reject`,
      "POST",
      { reason }
    );
  },

  async prepare(vendorOrderId: string): Promise<KaggriVendorOrder> {
    return api<KaggriVendorOrder>(
      `/vendor/orders/${vendorOrderId}/prepare`,
      "POST",
      {}
    );
  },

  async allocateStock(vendorOrderId: string): Promise<KaggriVendorOrder> {
    return api<KaggriVendorOrder>(
      `/vendor/orders/${vendorOrderId}/allocate-stock`,
      "POST",
      {}
    );
  },

  async readyToShip(vendorOrderId: string): Promise<KaggriVendorOrder> {
    return api<KaggriVendorOrder>(
      `/vendor/orders/${vendorOrderId}/ready-to-ship`,
      "POST",
      {}
    );
  },
};

// ===== Payments (Module 5) =====
export const paymentService = {
  async initiatePayment(
    orderId: string,
    idempotencyKey = createIdempotencyKey()
  ): Promise<KaggriPaymentInitiation> {
    return api<KaggriPaymentInitiation>(
      `/payments/orders/${orderId}/initiate`,
      "POST",
      undefined,
      { "Idempotency-Key": idempotencyKey }
    );
  },

  async getOrderPayment(orderId: string): Promise<KaggriOrderPayment> {
    return api<KaggriOrderPayment>(`/payments/orders/${orderId}`);
  },

  async listAttempts(paymentId: string): Promise<KaggriPaymentAttempt[]> {
    return api<KaggriPaymentAttempt[]>(`/payments/${paymentId}/attempts`);
  },

  async listTransactions(paymentId: string): Promise<KaggriPaymentTransaction[]> {
    return api<KaggriPaymentTransaction[]>(`/payments/${paymentId}/transactions`);
  },

  async createPayosCheckout(
    orderId: string
  ): Promise<{
    orderId?: string;
    orderCode?: number | string;
    checkoutUrl: string;
    qrCode?: string;
    accountNumber?: string;
    accountName?: string;
    amount?: number;
    description?: string;
  }> {
    return api(`/payments/payos/orders/${orderId}/checkout`, "POST");
  },

  async confirmPayosReturn(
    orderId: string,
    orderCode: number | string
  ): Promise<void> {
    try {
      await fetch(
        `${API_BASE_URL}/payments/payos/return${query({ orderId, orderCode })}`,
        { method: "GET", redirect: "manual" }
      );
    } catch {
      // Backend processes PayOS verification before redirecting to localhost:4200;
      // mobile clients may throw on manual/blocked localhost redirect.
    }
  },

  // Dev-only mock simulator endpoint (matches fe/payment-api.service.ts)
  async resolveMockAttempt(
    attemptId: string,
    result: "SUCCESS" | "FAILED" | "EXPIRED"
  ): Promise<unknown> {
    return api(`/dev/mock-payments/${attemptId}/resolve`, "POST", { result });
  },
};
