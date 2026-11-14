import { Platform } from "react-native";

// ============================================
// Kaggri-Trade Backend API Types (Module 1, 2, 3)
// ============================================

export type KaggriRole = "BUYER" | "VENDOR" | "ADMIN";

export interface KaggriUser {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  role: KaggriRole;
  accountStatus: string;
  buyerProfile?: {
    buyerType: string;
    companyName: string | null;
    taxCode: string | null;
  } | null;
  vendorProfile?: {
    displayName: string | null;
    approvalStatus: string;
  } | null;
}

export interface KaggriSession {
  accessToken: string;
  refreshToken: string;
  user: KaggriUser;
}

export interface KaggriPage<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages?: number;
  };
}

export interface KaggriCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  displayOrder?: number;
  isActive?: boolean;
}

export interface KaggriProductImage {
  id: string;
  url?: string;
  storageKey?: string;
  altText: string | null;
  displayOrder: number;
  isMain: boolean;
}

export interface KaggriInventory {
  onHandQuantity: string;
  reservedQuantity: string;
  availableQuantity?: number;
  availability?: string;
  version?: number;
}

export interface KaggriRevision {
  id: string;
  revisionNumber: number;
  name: string;
  categoryId: string;
  category?: KaggriCategory;
  description: string;
  status: string;
  saleUnit: string;
  unitPriceVnd: number;
  minimumOrderQuantity: string;
  originProvince?: string;
  originDistrict?: string;
  variety?: string;
  grade?: string;
  packagingDescription?: string;
  storageCondition?: string;
  shelfLifeDays?: number;
  images: KaggriProductImage[];
}

export interface KaggriReview {
  id: string;
  decision: string;
  reason?: string;
  createdAt: string;
  requestedDocumentTypes?: string[];
}

export interface KaggriVendorProduct {
  id: string;
  sku: string;
  slug: string;
  visibility: string;
  revisions: KaggriRevision[];
  publishedRevision?: KaggriRevision | null;
  inventory: KaggriInventory;
  preorderEnabled: boolean;
  preorderLeadDays: number | null;
  reviews?: KaggriReview[];
}

export interface KaggriPublicProduct extends KaggriRevision {
  sku: string;
  slug: string;
  inventory: KaggriInventory;
  preorderEnabled: boolean;
  preorderLeadDays: number | null;
  vendor: {
    displayName: string;
    province?: string;
    businessDescription?: string;
  };
  certificationVerified: boolean;
}

export interface KaggriDocument {
  id: string;
  documentType: string;
  originalFileName: string;
  verificationStatus: string;
  sizeBytes: number;
}

export interface KaggriAgreement {
  id: string;
  agreementNumber: string;
  status: string;
  snapshotHash?: string;
  createdAt?: string;
  effectiveFrom?: string;
  signatures?: { signerRole: string; signedAt: string; method: string }[];
  auditEvents?: { id: string; action: string; createdAt: string }[];
}

export interface KaggriApplication {
  id: string;
  status: string;
  businessType: string;
  legalName: string;
  displayName: string;
  contactPhone: string;
  businessAddress: string;
  province: string;
  district: string;
  representativeName: string;
  representativePosition: string;
  registrationNumber: string;
  taxCode: string;
  businessDescription: string;
  submittedAt?: string;
  documents: KaggriDocument[];
  reviews: KaggriReview[];
  agreement?: KaggriAgreement | null;
  vendor?: { user: { email: string; fullName: string } };
}

export interface KaggriProgress {
  application: KaggriApplication | null;
  requiredDocuments: string[];
  missingDocuments: string[];
  nextActions: string[];
}

export interface KaggriSigningSession {
  id: string;
  expectedDocumentHash: string;
  expiresAt: string;
}

export interface KaggriEligibility {
  eligible: boolean;
  requirements: {
    applicationApproved: boolean;
    agreementSigned: boolean;
    accountActive: boolean;
  };
  reasons: string[];
}

export interface KaggriAdjustment {
  id: string;
  changeQuantity: string;
  previousQuantity: string;
  newQuantity: string;
  reason: string;
  createdAt: string;
}

// ============================================
// Cart, Checkout, Order & Payment Types (Module 4 & 5)
// ============================================

export type KaggriAvailability = "IN_STOCK" | "PREORDER" | "UNAVAILABLE";
export type KaggriCheckoutType = "IN_STOCK" | "PREORDER";

export interface KaggriCartItem {
  id: string;
  productId: string;
  productName: string;
  slug: string;
  mainImageUrl: string | null;
  saleUnit: string;
  unitPriceVnd: number;
  minimumOrderQuantity: number;
  quantity: number;
  lineSubtotalVnd: number;
  vendor: {
    id: string;
    displayName: string;
  };
  availableQuantity: number;
  preorderEnabled: boolean;
  preorderLeadDays: number | null;
  availability: KaggriAvailability;
  isValidForCheckout: boolean;
  validationIssues: string[];
}

export interface KaggriCart {
  id: string;
  buyerId: string;
  items: KaggriCartItem[];
  totalItems: number;
  totalVendors: number;
  estimatedMerchandiseSubtotalVnd: number;
}

export interface KaggriDeliveryAddress {
  recipientName: string;
  recipientPhone: string;
  province: string;
  district?: string;
  ward: string;
  addressLine: string;
  deliveryNote?: string;
}

export interface KaggriQuoteItem {
  id: string;
  productId: string;
  vendorId: string;
  publishedRevisionId: string;
  productNameSnapshot: string;
  saleUnitSnapshot: string;
  unitPriceVnd: number;
  quantity: number;
  minimumOrderQuantitySnapshot: number;
  lineSubtotalVnd: number;
  availabilityAtPreview: KaggriCheckoutType;
  sourceCartItemId?: string | null;
  sourceCartItemUpdatedAt?: string | null;
}

export interface KaggriQuoteVendorGroup {
  id: string;
  vendorId: string;
  vendorDisplayName: string;
  merchandiseSubtotalVnd: number;
  shippingFeeVnd: number;
  totalVnd: number;
  items: KaggriQuoteItem[];
}

export interface KaggriCheckoutQuote {
  id: string;
  buyerId: string;
  checkoutType: KaggriCheckoutType;
  deliveryAddress: KaggriDeliveryAddress;
  merchandiseSubtotalVnd: number;
  shippingFeeVnd: number;
  totalVnd: number;
  expiresAt: string;
  consumedAt: string | null;
  isExpired: boolean;
  isConsumed: boolean;
  vendorGroups: KaggriQuoteVendorGroup[];
  items: KaggriQuoteItem[];
}

export interface KaggriCheckoutPreviewResponse {
  quotes: KaggriCheckoutQuote[];
  totalQuotes: number;
}

export interface KaggriOrderItem {
  id: string;
  productId: string;
  productNameSnapshot: string;
  saleUnitSnapshot: string;
  unitPriceVnd: number;
  quantity: number;
  lineSubtotalVnd: number;
}

export interface KaggriVendorOrder {
  id: string;
  orderNumber: string;
  vendorId: string;
  vendorDisplayName: string;
  status: string;
  merchandiseSubtotalVnd: number;
  shippingFeeVnd: number;
  totalVnd: number;
  confirmedAt?: string | null;
  rejectionReason?: string | null;
  estimatedReadyAt?: string | null;
  vendorNote?: string | null;
  items: KaggriOrderItem[];
}

export interface KaggriParentOrder {
  id: string;
  orderNumber: string;
  buyerId: string;
  checkoutType: KaggriCheckoutType;
  status: string;
  paymentStatus: string;
  merchandiseSubtotalVnd: number;
  shippingFeeVnd: number;
  totalVnd: number;
  deliveryAddress: KaggriDeliveryAddress;
  paymentExpiresAt?: string | null;
  confirmationExpiresAt?: string | null;
  createdAt: string;
  vendorOrders: KaggriVendorOrder[];
}

export interface KaggriOrderListResponse {
  items: KaggriParentOrder[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface KaggriVendorOrderListResponse {
  items: KaggriVendorOrder[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface KaggriOrderStatusHistory {
  id: string;
  actorType: string;
  fromStatus?: string | null;
  toStatus: string;
  note?: string | null;
  createdAt: string;
}

export interface KaggriPaymentInitiation {
  paymentId: string;
  attemptId: string;
  orderId: string;
  provider: string;
  paymentReference: string;
  amountVnd: number;
  currency: string;
  status: string;
  expiresAt: string;
  qrCodeUrl?: string;
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
}

export interface KaggriOrderPayment {
  orderId: string;
  orderNumber: string;
  paymentId: string | null;
  status: string;
  amountVnd: number;
  currency: string;
  provider: string | null;
  paymentReference: string | null;
  paidAt: string | null;
  paymentExpiresAt: string | null;
  remainingSeconds: number;
  refund: {
    refundedVnd: number;
    pendingRefundVnd: number;
  };
}

export interface KaggriPaymentAttempt {
  id: string;
  provider: string;
  paymentReference: string;
  status: string;
  amountVnd: number;
  expiresAt: string;
  completedAt: string | null;
  failureCode: string | null;
  createdAt: string;
}

export interface KaggriPaymentTransaction {
  id: string;
  providerTransactionId: string;
  transactionType: string;
  amountVnd: number;
  status: string;
  occurredAt: string;
}

// ============================================
// Base URL & Session State
// ============================================

function resolveDefaultBaseUrl(): string {
  if (Platform.OS === "web") {
    return "http://localhost:3000/api/v1";
  }
  const envUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (envUrl && envUrl.trim()) {
    return envUrl.replace(/\/$/, "");
  }
  if (Platform.OS === "android") {
    return "http://10.0.2.2:3000/api/v1";
  }
  return "http://localhost:3000/api/v1";
}

export const API_BASE_URL = resolveDefaultBaseUrl();
export const API_ORIGIN = API_BASE_URL.replace(/\/api\/v1\/?$/, "");

let currentSession: KaggriSession | null = null;
const sessionListeners = new Set<(session: KaggriSession | null) => void>();

export function getSession(): KaggriSession | null {
  return currentSession;
}

export function setSession(session: KaggriSession | null): void {
  currentSession = session;
  sessionListeners.forEach((fn) => fn(currentSession));
}

export function subscribeSession(fn: (session: KaggriSession | null) => void) {
  sessionListeners.add(fn);
  return () => {
    sessionListeners.delete(fn);
  };
}

// ============================================
// API Error & Helpers
// ============================================

export class ApiError extends Error {
  status: number;
  code: string;
  details: unknown;
  requestId?: string;

  constructor(
    status: number,
    code: string,
    message: string,
    details?: unknown,
    requestId?: string
  ) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
    this.requestId = requestId;
  }
}

export function query(
  params: Record<string, string | number | boolean | undefined | null>
): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") {
      search.set(k, String(v));
    }
  });
  const s = search.toString();
  return s ? `?${s}` : "";
}

export function imageUrl(path?: string | null): string {
  if (!path) return "";
  const trimmed = path.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    // Normalize Wikimedia thumbnail proxy host to official upload CDN for mobile reliability
    return trimmed.replace(
      /^https?:\/\/thumb\.wikimedia\.org\//i,
      "https://upload.wikimedia.org/"
    );
  }
  return `${API_ORIGIN}${trimmed.startsWith("/") ? "" : "/"}${trimmed}`;
}

/**
 * Resolves a product image URL from either a public endpoint (`url`)
 * or a vendor endpoint (`storageKey` / `id` fallback).
 */
export function resolveProductImageUrl(
  productId?: string,
  img?: Pick<KaggriProductImage, "id" | "url" | "storageKey"> | null
): string | undefined {
  if (!img) return undefined;
  if (img.url) {
    const resolved = imageUrl(img.url);
    return resolved || undefined;
  }
  if (
    img.storageKey &&
    (img.storageKey.startsWith("http://") || img.storageKey.startsWith("https://"))
  ) {
    const resolved = imageUrl(img.storageKey);
    return resolved || undefined;
  }
  if (productId && img.id) {
    const resolved = imageUrl(`/api/v1/products/${productId}/images/${img.id}`);
    return resolved || undefined;
  }
  return undefined;
}

/**
 * Returns an ImageSourcePropType-compatible object.
 * - For internal backend URLs and future Cloud Storage/CDN URLs: returns `{ uri }` without
 *   custom headers so React Native's native disk cache and signed URLs work untouched.
 * - Only for Wikimedia Commons demo URLs: attaches a policy-compliant User-Agent header.
 */
export function resolveImageSource(
  uri?: string | null
): { uri: string; headers?: Record<string, string> } | undefined {
  if (!uri) return undefined;
  const normalized = imageUrl(uri);
  if (!normalized) return undefined;
  if (/wikimedia\.org/i.test(normalized)) {
    return {
      uri: normalized,
      headers: {
        "User-Agent":
          "KaggriTradeMobile/1.0 (https://kaggri.example.com; support@kaggri.example.com) Mozilla/5.0",
        Accept: "image/jpeg,image/png,image/webp,image/*;q=0.8",
      },
    };
  }
  return { uri: normalized };
}

async function rawRequest<T>(
  path: string,
  init: RequestInit = {},
  token?: string
): Promise<T> {
  const headers = new Headers(init.headers);
  const isFormData =
    typeof FormData !== "undefined" && init.body instanceof FormData;
  if (!isFormData && init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  } catch {
    throw new ApiError(
      0,
      "NETWORK_ERROR",
      "Không thể kết nối máy chủ Kaggri-Trade. Vui lòng kiểm tra kết nối hoặc bật backend tại cổng 3000."
    );
  }

  if (res.status === 204) return undefined as T;

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const body = isJson ? await res.json() : await res.text();

  if (!res.ok) {
    const err = body?.error;
    throw new ApiError(
      res.status,
      err?.code || "API_ERROR",
      err?.message || `Yêu cầu không thành công (${res.status})`,
      err?.details,
      body?.meta?.requestId
    );
  }

  return (body?.data ?? body) as T;
}

export function createIdempotencyKey(): string {
  // RFC4122-like v4 UUID for Idempotency-Key headers
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export async function api<T>(
  path: string,
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" = "GET",
  body?: unknown,
  extraHeaders?: Record<string, string>
): Promise<T> {
  const session = getSession();
  const isFormData =
    typeof FormData !== "undefined" && body instanceof FormData;
  const init: RequestInit = {
    method,
    headers: extraHeaders,
    body:
      body === undefined
        ? undefined
        : isFormData
          ? (body as FormData)
          : JSON.stringify(body),
  };

  try {
    return await rawRequest<T>(path, init, session?.accessToken);
  } catch (error) {
    if (
      error instanceof ApiError &&
      error.status === 401 &&
      session?.refreshToken &&
      !path.startsWith("/auth/")
    ) {
      try {
        const refreshed = await rawRequest<KaggriSession>("/auth/refresh", {
          method: "POST",
          body: JSON.stringify({ refreshToken: session.refreshToken }),
        });
        setSession(refreshed);
        return await rawRequest<T>(path, init, refreshed.accessToken);
      } catch {
        setSession(null);
      }
    }
    throw error;
  }
}
