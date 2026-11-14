// ============================================
// vovu - Type Definitions
// ============================================

export type PriceTier = {
  minQty: number;
  maxQty: number | null;
  unitPrice: number;
};

export type ProductImage = {
  id: string;
  src?: string;
  icon: string;
  label: string;
  alt: string;
  credit?: string;
  position?: string;
  sourcePage?: string;
};

export type Product = {
  id: string;
  slug?: string;
  vendorId: string;
  vendorName?: string;
  vendorProvince?: string;
  categoryId?: string;
  categoryName?: string;
  name: string;
  sku: string;
  unit: string;
  qty: number;
  minQty: number;
  available: number;
  availability?: string;
  unitPrice: number;
  priceTiers: PriceTier[];
  oldUnitPrice: number | null;
  amount: number;
  images: ProductImage[];
  quality: Array<[string, string]>;
  image: string; // emoji fallback
  note: string;
  description?: string;
  originProvince?: string;
  originDistrict?: string;
  variety?: string;
  grade?: string;
  packagingDescription?: string;
  storageCondition?: string;
  shelfLifeDays?: number;
  preorderEnabled?: boolean;
  preorderLeadDays?: number | null;
  certificationVerified?: boolean;
};

export type Vendor = {
  id: string;
  name: string;
  shortName: string;
  location: string;
  certification: string;
  status: "verified" | "pending" | "rejected";
  avatar?: string;
  rating?: number;
  totalOrders?: number;
};

export type CartItem = {
  id?: string; // Backend cart item UUID when synced
  productId: string;
  vendorId: string;
  name: string;
  sku: string;
  slug?: string;
  unit: string;
  qty: number;
  unitPrice: number;
  amount: number;
  image: string;
  imageUrl?: string | null;
  vendorName: string;
  minQty: number;
  available: number;
  availability?: "IN_STOCK" | "PREORDER" | "UNAVAILABLE";
  preorderEnabled?: boolean;
  preorderLeadDays?: number | null;
  isValidForCheckout?: boolean;
  validationIssues?: string[];
};

export type SettlementType = "PREPAID" | "COD" | "CREDIT";

export type PaymentMethod = {
  id: string;
  title: string;
  description: string;
  status: string;
  eligible: boolean;
  settlementType: SettlementType;
};

export type OrderMode = "STANDARD" | "PREORDER";

export type VendorOrderStatus =
  | "PENDING_CONFIRMATION"
  | "ACCEPTED"
  | "REJECTED"
  | "PREPARING"
  | "SHIPPED"
  | "DELIVERED"
  | "COMMITTED"
  | "SCHEDULED";

export type VendorOrder = {
  id: string;
  vendorId: string;
  status: VendorOrderStatus;
  items: Array<{
    productId: string;
    name: string;
    unit: string;
    qty: number;
    unitPrice: number;
    amount: number;
    image: string;
  }>;
  amount: number;
  fulfilmentStatus?: "PREPARING" | "SCHEDULED" | "COMMITTED" | "SHIPPED" | "DELIVERED";
  supplyCommitment?: {
    requestedDate: string;
    confirmedQty: number;
  };
  rejectionReason?: string;
  refundStatus?: "PENDING" | "COMPLETED" | "NONE";
  refundAmount?: number;
  invoice?: {
    status:
      | "PENDING_ORDER_CONFIRMATION"
      | "PENDING_PAYMENT"
      | "REQUESTED"
      | "ISSUED"
      | "NOT_REQUESTED"
      | "NOT_APPLICABLE";
    invoiceNumber?: string;
  };
  dueDate?: string;
};

export type DeliveryProfile = {
  companyName?: string;
  recipientName: string;
  recipientPhone: string;
  receivingAddress: string;
  receivingWindow: string;
  deliveryNote: string;
  estimatedDelivery?: string | null;
};

export type InvoiceProfile = {
  buyer: {
    companyName: string;
    taxCode: string;
    billingAddress: string;
    invoiceEmail: string;
  };
};

export type ParentOrder = {
  id: string;
  createdAt: string;
  orderMode: OrderMode;
  preorderDate?: string;
  paymentMethod?: string;
  settlementType: SettlementType;
  amountPaid: number;
  refundAmount?: number;
  status: string;
  paymentStatus: "UNPAID" | "PAID" | "PARTIALLY_PAID";
  vendorOrders: VendorOrder[];
  delivery: DeliveryProfile;
  invoice: InvoiceProfile;
};

export type User = {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: "buyer" | "vendor";
  company?: string;
  taxCode?: string;
  buyerType?: "INDIVIDUAL" | "BUSINESS";
  accountStatus?: string;
  vendorApprovalStatus?: string;
  token?: string;
  refreshToken?: string;
  avatar?: string;
};

export type CreditProfile = {
  approved: boolean;
  limit: number;
  used: number;
  available: number;
  termDays: number;
  dueFrom: string;
};

export type PaymentAttempt = {
  paymentStatus: "pending" | "success" | "failed" | "expired";
  settlementType: SettlementType;
  providerCode: string | null;
  providerMessage: string | null;
  failureCategory: string | null;
  retryable: boolean;
  failedAt: string | null;
  paymentMethod: string;
  paymentReference: string;
  vendorOrderIds: string[];
  lineItems: Array<{
    productId: string;
    name: string;
    unit: string;
    qty: number;
    unitPrice: number;
    amount: number;
    image: string;
  }>;
  amount: number;
  reservationStatus: string | null;
  createdAt: string | null;
};
