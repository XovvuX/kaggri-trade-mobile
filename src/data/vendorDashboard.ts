import { colors } from "@/theme";

export type VendorAlert = {
  id: string;
  icon: "verified-user" | "inventory" | "local-shipping" | "pending-actions" | "warning";
  iconColor: string;
  boldText: string;
  normalText?: string;
  route: any;
};

export const VENDOR_ALERTS: VendorAlert[] = [
  {
    id: "vietgap",
    icon: "verified-user",
    iconColor: colors.tertiaryFixedDim,
    boldText: "1 yêu cầu VietGAP",
    normalText: "cần duyệt trước 18:00",
    route: "/(vendor)/orders",
  },
  {
    id: "stock",
    icon: "inventory",
    iconColor: colors.error,
    boldText: "3 lô sắp hết tồn kho",
    route: "/vendor/inventory",
  },
];

export type QuickActionItem = {
  id: string;
  icon: "add-box" | "list-alt" | "inventory-2" | "request-quote" | "chat" | "analytics";
  label: string;
  route: any;
  color: string;
  fg: string;
  badge?: string;
};

export const QUICK_ACTIONS: QuickActionItem[] = [
  { id: "add-product", icon: "add-box", label: "Đăng sản phẩm", route: "/vendor/product-edit", color: colors.primaryContainer, fg: colors.onPrimary },
  { id: "b2b-orders", icon: "list-alt", label: "Đơn sỉ B2B", route: "/(vendor)/orders", color: colors.tertiaryFixed, fg: colors.onTertiaryFixed, badge: "3" },
  { id: "inventory", icon: "inventory-2", label: "Quản lý tồn kho", route: "/vendor/inventory", color: colors.secondaryFixed, fg: colors.onSecondaryFixed },
  { id: "quick-quote", icon: "request-quote", label: "Báo giá nhanh", route: "/vendor/quotes", color: colors.surfaceContainer, fg: colors.onSurface },
  { id: "buyer-chat", icon: "chat", label: "Hội thoại Buyer", route: "/vendor/chat/buyer-green-food", color: colors.surfaceContainer, fg: colors.onSurface, badge: "12" },
  { id: "analytics", icon: "analytics", label: "Đối soát & Ví HTX", route: "/vendor/settlement", color: colors.surfaceContainer, fg: colors.onSurface },
];

export type OrderItem = {
  id: string;
  buyer: string;
  product: string;
  qty: string;
  amount: string;
  time: string;
  status: "pending" | "preparing" | "shipping";
  priority?: string;
};

export const RECENT_ORDERS: OrderItem[] = [
  {
    id: "VO-20261016-8831",
    buyer: "Chuỗi Siêu thị Thực phẩm Xanh",
    product: "Cà chua Beef Đà Lạt VietGAP",
    qty: "320 kg",
    amount: "14.400.000₫",
    time: "Tạo 5 phút trước",
    status: "pending",
    priority: "ƯU TIÊN",
  },
  {
    id: "VO-20261016-7712",
    buyer: "HTX Bách Hóa Xanh",
    product: "Cà rốt baby Đà Lạt + Xà lách thủy canh",
    qty: "450 kg",
    amount: "12.600.000₫",
    time: "Tạo 12 phút trước",
    status: "preparing",
  },
  {
    id: "VO-20261016-6501",
    buyer: "Siêu thị Co.opmart",
    product: "Sầu riêng Ri6 Cơm Vàng",
    qty: "100 kg",
    amount: "8.500.000₫",
    time: "Tạo 35 phút trước",
    status: "shipping",
  },
];

export const VENDOR_PROFILE = {
  hello: "Chào anh Tuấn 🌾",
  company: "HTX Rau Sạch Lâm Đồng",
  initial: "T",
  certifications: [
    { label: "VietGAP", icon: "verified" as const },
    { label: "OCOP 4★", bg: colors.secondaryContainer, fg: colors.onSecondary },
  ],
};

export const CONTRACT_INFO = {
  title: "Chứng nhận VietGAP còn hiệu lực",
  description: "#2024-LD-08812 • Hết hạn 15/09/2027 • Sở NN&PTNT Lâm Đồng cấp",
  pillText: "Xem chứng nhận",
};
