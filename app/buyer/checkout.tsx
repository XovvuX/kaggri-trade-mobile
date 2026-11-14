import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Switch,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { colors, fontSize, fontWeight, spacing, borderRadius, shadows } from "@/theme";
import { useCartStore } from "@/stores/cart-store";
import { useCheckoutStore } from "@/stores/checkout-store";
import { useAuthStore } from "@/stores/auth-store";
import { checkoutService, orderService } from "@/services";
import { createIdempotencyKey } from "@/services/api";
import { formatVND } from "@/utils";

type PaymentMethodOption = {
  id: "vietqr" | "escrow_bank_transfer" | "b2b_credit_line";
  title: string;
  description: string;
  badge: string;
  icon: React.ComponentProps<typeof MaterialIcons>["name"];
};

const PAYMENT_METHODS: PaymentMethodOption[] = [
  {
    id: "vietqr",
    title: "Thanh toán trực tuyến VietQR (PayOS)",
    description: "Quét mã VietQR chuyển khoản nhanh 24/7 từ mọi ngân hàng. Tự động xác nhận.",
    badge: "Khuyên dùng",
    icon: "qr-code-2",
  },
  {
    id: "escrow_bank_transfer",
    title: "Chuyển khoản ký quỹ sàn Kaggri-Trade",
    description: "Tiền được phong tỏa an toàn qua hệ thống Escrow và chỉ giải ngân sau khi nhận hàng.",
    badge: "Bảo vệ 100%",
    icon: "account-balance",
  },
  {
    id: "b2b_credit_line",
    title: "Hạn mức công nợ doanh nghiệp (B2B Credit)",
    description: "Thanh toán trả chậm theo chu kỳ NET 15 hoặc NET 30 dành cho pháp nhân đã thẩm định.",
    badge: "NET 15/30",
    icon: "business-center",
  },
];

export default function CheckoutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const items = useCartStore((s) => s.items);
  const fetchCart = useCartStore((s) => s.fetchCart);

  const selectedCartItemIds = useCheckoutStore((s) => s.selectedCartItemIds);
  const storeAddress = useCheckoutStore((s) => s.deliveryAddress);
  const setStoreAddress = useCheckoutStore((s) => s.setDeliveryAddress);
  const quotes = useCheckoutStore((s) => s.quotes);
  const setQuotes = useCheckoutStore((s) => s.setQuotes);
  const setCreatedOrders = useCheckoutStore((s) => s.setCreatedOrders);

  // Step: 'form' (nhập thông tin) -> 'quote_review' (xem chi tiết báo giá & đếm ngược 15 phút)
  const [step, setStep] = useState<"form" | "quote_review">("form");
  const [selectedQuoteIndex, setSelectedQuoteIndex] = useState(0);
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(15 * 60);

  // 1. Delivery Address
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [recipientName, setRecipientName] = useState(
    user?.name || storeAddress.recipientName || ""
  );
  const [recipientPhone, setRecipientPhone] = useState(
    user?.phone || storeAddress.recipientPhone || ""
  );
  const [province, setProvince] = useState(storeAddress.province || "TP. Hồ Chí Minh");
  const [district, setDistrict] = useState(storeAddress.district || "");
  const [ward, setWard] = useState(storeAddress.ward || "");
  const [addressLine, setAddressLine] = useState(storeAddress.addressLine || "");
  const [deliveryNote, setDeliveryNote] = useState(storeAddress.deliveryNote || "");

  // 2. VAT Invoice
  const [invoiceRequested, setInvoiceRequested] = useState(true);
  const [invoiceCompany, setInvoiceCompany] = useState(user?.company || "HTX Bách Hóa Xanh");
  const [invoiceTaxCode, setInvoiceTaxCode] = useState(user?.taxCode || "0312345678");
  const [invoiceAddress, setInvoiceAddress] = useState(
    "128 Đường số 7, Phường Bình Trị Đông B, Quận Bình Tân, TP. Hồ Chí Minh"
  );
  const [invoiceEmail, setInvoiceEmail] = useState(user?.email || "hoadon@bachhoaxanh.example");

  // 3. Payment Method
  const [selectedMethod, setSelectedMethod] =
    useState<PaymentMethodOption["id"]>("vietqr");

  const [previewLoading, setPreviewLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/auth/login?role=buyer&redirect=/buyer/checkout");
    } else if (items.length === 0) {
      fetchCart();
    }
  }, [isAuthenticated, items.length, fetchCart, router]);

  const matchedSelected =
    selectedCartItemIds.length > 0
      ? items.filter((i) => selectedCartItemIds.includes(i.id || i.productId))
      : [];

  const effectiveCartItems =
    matchedSelected.length > 0
      ? matchedSelected
      : items.filter((i) => i.isValidForCheckout !== false);

  const effectiveCartItemIds = effectiveCartItems
    .filter((i) => Boolean(i.id))
    .map((i) => i.id as string);

  // Countdown 15 minutes for active quote
  useEffect(() => {
    if (step !== "quote_review" || timeLeftSeconds <= 0) return;
    const timer = setInterval(() => {
      setTimeLeftSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [step, timeLeftSeconds > 0]);

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleCreatePreview = useCallback(async () => {
    if (
      !recipientName.trim() ||
      !recipientPhone.trim() ||
      !province.trim() ||
      !ward.trim() ||
      !addressLine.trim()
    ) {
      Alert.alert(
        "Thiếu thông tin",
        "Vui lòng nhập đầy đủ họ tên, số điện thoại và địa chỉ giao hàng."
      );
      setIsEditingAddress(true);
      return;
    }

    const addressPayload = {
      recipientName: recipientName.trim(),
      recipientPhone: recipientPhone.trim(),
      province: province.trim(),
      district: district.trim() || undefined,
      ward: ward.trim(),
      addressLine: addressLine.trim(),
      deliveryNote: deliveryNote.trim() || undefined,
    };
    setStoreAddress(addressPayload);

    setPreviewLoading(true);
    try {
      const res = await checkoutService.preview({
        cartItemIds: effectiveCartItemIds.length > 0 ? effectiveCartItemIds : undefined,
        deliveryAddress: addressPayload,
      });
      const list = res.quotes || [];
      if (list.length === 0) {
        Alert.alert("Không tạo được báo giá", "Vui lòng kiểm tra lại sản phẩm trong giỏ hàng.");
        return;
      }
      setQuotes(list);
      setSelectedQuoteIndex(0);
      const expMs = new Date(list[0].expiresAt).getTime();
      const rem = Math.max(0, Math.floor((expMs - Date.now()) / 1000));
      setTimeLeftSeconds(rem > 0 ? rem : 15 * 60);
      setStep("quote_review");
    } catch (err) {
      Alert.alert(
        "Lỗi tạo báo giá",
        err instanceof Error ? err.message : "Không thể tạo báo giá xem trước."
      );
    } finally {
      setPreviewLoading(false);
    }
  }, [
    recipientName,
    recipientPhone,
    province,
    district,
    ward,
    addressLine,
    deliveryNote,
    effectiveCartItemIds,
    setStoreAddress,
    setQuotes,
  ]);

  const activeQuote = quotes[selectedQuoteIndex] || quotes[0] || null;

  const handleProceedToPayos = async () => {
    if (!activeQuote) return;
    if (activeQuote.isExpired || timeLeftSeconds <= 0) {
      Alert.alert(
        "Hết hạn báo giá",
        "Báo giá thanh toán đã hết hạn hiệu lực 15 phút. Vui lòng tạo lại báo giá mới.",
        [{ text: "Tạo lại", onPress: handleCreatePreview }]
      );
      return;
    }

    setSubmitting(true);
    try {
      const order = await orderService.createOrder(activeQuote.id, createIdempotencyKey());
      setCreatedOrders([order]);
      await fetchCart();

      if (
        order.status === "PENDING_SUPPLIER_CONFIRMATION" ||
        order.status === "AWAITING_VENDOR_CONFIRMATION"
      ) {
        router.replace(`/buyer/order-success?orderId=${order.id}`);
        return;
      }

      // Open in-app PayOS WebView inside PaymentScreen
      router.replace(`/buyer/payment?orderId=${order.id}&autoOpenPayos=1`);
    } catch (err) {
      Alert.alert(
        "Lỗi tạo đơn hàng",
        err instanceof Error ? err.message : "Không thể tạo đơn hàng."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const estimatedItemsTotal = effectiveCartItems.reduce((s, i) => s + i.amount, 0);

  return (
    <View style={styles.container}>
      <View style={[styles.topBar, { paddingTop: Math.max(insets.top + 8, 12) }]}>
        <Pressable
          onPress={() => (step === "quote_review" ? setStep("form") : router.back())}
          style={styles.iconBtn}
          hitSlop={6}
        >
          <MaterialIcons name="arrow-back" size={20} color={colors.onSurface} />
        </Pressable>
        <Text style={styles.topTitle}>
          {step === "form" ? "Thông tin đặt hàng" : "Chi tiết báo giá xem trước"}
        </Text>
        <View style={{ width: 36 }} />
      </View>

      {step === "form" ? (
        <>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
            {/* 1. Delivery Address */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <MaterialIcons name="location-on" size={18} color={colors.primary} />
                  <Text style={styles.sectionTitle}>1. Địa chỉ giao nhận hàng</Text>
                </View>
                <Pressable onPress={() => setIsEditingAddress((v) => !v)}>
                  <Text style={styles.editLink}>
                    {isEditingAddress ? "Thu gọn" : "Chỉnh sửa"}
                  </Text>
                </Pressable>
              </View>

              {isEditingAddress ? (
                <View style={styles.formGap}>
                  <TextInput
                    style={styles.input}
                    placeholder="Họ và tên người nhận *"
                    value={recipientName}
                    onChangeText={setRecipientName}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Số điện thoại *"
                    keyboardType="phone-pad"
                    value={recipientPhone}
                    onChangeText={setRecipientPhone}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Tỉnh / Thành phố *"
                    value={province}
                    onChangeText={setProvince}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Quận / Huyện"
                    value={district}
                    onChangeText={setDistrict}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Phường / Xã *"
                    value={ward}
                    onChangeText={setWard}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Số nhà, tên đường *"
                    value={addressLine}
                    onChangeText={setAddressLine}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Ghi chú giao hàng"
                    value={deliveryNote}
                    onChangeText={setDeliveryNote}
                  />
                </View>
              ) : (
                <View style={styles.addressSummary}>
                  <Text style={styles.addressName}>
                    {recipientName} • {recipientPhone}
                  </Text>
                  <Text style={styles.addressLine}>
                    {[addressLine, ward, district, province].filter(Boolean).join(", ")}
                  </Text>
                  {deliveryNote ? (
                    <Text style={styles.addressNote}>Ghi chú: {deliveryNote}</Text>
                  ) : null}
                </View>
              )}
            </View>

            {/* 2. VAT Invoice Option */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <MaterialIcons name="receipt" size={18} color={colors.primary} />
                  <Text style={styles.sectionTitle}>2. Hóa đơn giá trị gia tăng (VAT)</Text>
                </View>
                <Switch
                  value={invoiceRequested}
                  onValueChange={setInvoiceRequested}
                  trackColor={{ false: colors.line, true: colors.primary }}
                />
              </View>
              {invoiceRequested ? (
                <View style={styles.formGap}>
                  <TextInput
                    style={styles.input}
                    placeholder="Tên đơn vị / Doanh nghiệp"
                    value={invoiceCompany}
                    onChangeText={setInvoiceCompany}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Mã số thuế"
                    value={invoiceTaxCode}
                    onChangeText={setInvoiceTaxCode}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Địa chỉ xuất hóa đơn"
                    value={invoiceAddress}
                    onChangeText={setInvoiceAddress}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Email nhận hóa đơn điện tử"
                    keyboardType="email-address"
                    value={invoiceEmail}
                    onChangeText={setInvoiceEmail}
                  />
                </View>
              ) : (
                <Text style={styles.mutedHint}>Không yêu cầu xuất hóa đơn VAT cho đơn này.</Text>
              )}
            </View>

            {/* 3. Payment Method Selection (3 options matching Web) */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionTitleRow}>
                <MaterialIcons name="payments" size={18} color={colors.primary} />
                <Text style={styles.sectionTitle}>3. Phương thức thanh toán</Text>
              </View>
              <View style={styles.formGap}>
                {PAYMENT_METHODS.map((pm) => {
                  const active = selectedMethod === pm.id;
                  return (
                    <Pressable
                      key={pm.id}
                      style={[styles.methodCard, active && styles.methodCardActive]}
                      onPress={() => setSelectedMethod(pm.id)}
                    >
                      <View style={styles.methodHeader}>
                        <View style={styles.methodLeft}>
                          <MaterialIcons
                            name={pm.icon}
                            size={20}
                            color={active ? colors.primary : colors.onSurfaceVariant}
                          />
                          <Text style={styles.methodTitle}>{pm.title}</Text>
                        </View>
                        <View style={styles.methodBadge}>
                          <Text style={styles.methodBadgeText}>{pm.badge}</Text>
                        </View>
                      </View>
                      <Text style={styles.methodDesc}>{pm.description}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* 4. Selected Cart Products */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionTitleRow}>
                <MaterialIcons name="shopping-bag" size={18} color={colors.primary} />
                <Text style={styles.sectionTitle}>
                  4. Sản phẩm trong giỏ ({effectiveCartItems.length})
                </Text>
              </View>
              {effectiveCartItems.map((item) => (
                <View key={item.productId} style={styles.quoteItemRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.quoteItemName}>{item.name}</Text>
                    <Text style={styles.quoteItemMeta}>
                      {item.vendorName} • {item.qty} {item.unit} × {formatVND(item.unitPrice)}
                    </Text>
                  </View>
                  <Text style={styles.quoteItemTotal}>{formatVND(item.amount)}</Text>
                </View>
              ))}
            </View>
          </ScrollView>

          <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom + 8, 14) }]}>
            <View>
              <Text style={styles.bottomLabel}>Tạm tính tiền hàng</Text>
              <Text style={styles.bottomTotal}>{formatVND(estimatedItemsTotal)}</Text>
            </View>
            <Pressable
              style={[styles.placeOrderBtn, previewLoading && { opacity: 0.6 }]}
              disabled={previewLoading}
              onPress={handleCreatePreview}
            >
              {previewLoading ? (
                <ActivityIndicator size="small" color={colors.onPrimary} />
              ) : (
                <Text style={styles.placeOrderText}>Tạo báo giá xem trước</Text>
              )}
            </Pressable>
          </View>
        </>
      ) : (
        <>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
            {/* 15-minute Quote Countdown */}
            <View
              style={[
                styles.timerBanner,
                timeLeftSeconds <= 0 && { backgroundColor: "#FEF2F2", borderColor: "#FECACA" },
              ]}
            >
              <MaterialIcons
                name="schedule"
                size={18}
                color={timeLeftSeconds > 0 ? colors.secondary : colors.error}
              />
              <Text
                style={[
                  styles.timerBannerText,
                  timeLeftSeconds <= 0 && { color: colors.error },
                ]}
              >
                {timeLeftSeconds > 0
                  ? `Báo giá có hiệu lực trong: ${formatTimer(timeLeftSeconds)} (15 phút)`
                  : "Báo giá đã hết hạn 15 phút. Vui lòng tạo lại báo giá."}
              </Text>
            </View>

            {/* Quote switcher if split into IN_STOCK + PREORDER */}
            {quotes.length > 1 ? (
              <View style={styles.quoteTabs}>
                {quotes.map((q, idx) => (
                  <Pressable
                    key={q.id}
                    style={[
                      styles.quoteTab,
                      selectedQuoteIndex === idx && styles.quoteTabActive,
                    ]}
                    onPress={() => setSelectedQuoteIndex(idx)}
                  >
                    <Text
                      style={[
                        styles.quoteTabText,
                        selectedQuoteIndex === idx && styles.quoteTabTextActive,
                      ]}
                    >
                      {q.checkoutType === "PREORDER" ? "Đặt trước" : "Giao ngay"} •{" "}
                      {formatVND(q.totalVnd)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : null}

            {activeQuote ? (
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>
                    {activeQuote.checkoutType === "PREORDER"
                      ? "Báo giá Đặt trước (Preorder)"
                      : "Báo giá Giao ngay (In-stock)"}
                  </Text>
                  <Text style={styles.quoteSubtotal}>{formatVND(activeQuote.totalVnd)}</Text>
                </View>

                {activeQuote.vendorGroups.map((vg) => (
                  <View key={vg.id} style={styles.vendorGroup}>
                    <View style={styles.vendorGroupHeader}>
                      <Text style={styles.vendorName}>{vg.vendorDisplayName}</Text>
                      <Text style={styles.vendorShip}>Phí VC: {formatVND(vg.shippingFeeVnd)}</Text>
                    </View>
                    {vg.items.map((item) => (
                      <View key={item.id} style={styles.quoteItemRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.quoteItemName}>{item.productNameSnapshot}</Text>
                          <Text style={styles.quoteItemMeta}>
                            {item.quantity} × {formatVND(item.unitPriceVnd)}
                          </Text>
                        </View>
                        <Text style={styles.quoteItemTotal}>{formatVND(item.lineSubtotalVnd)}</Text>
                      </View>
                    ))}
                  </View>
                ))}

                <View style={styles.divider} />
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Tiền hàng</Text>
                  <Text style={styles.summaryValue}>
                    {formatVND(activeQuote.merchandiseSubtotalVnd)}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Phí vận chuyển</Text>
                  <Text style={styles.summaryValue}>{formatVND(activeQuote.shippingFeeVnd)}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.grandLabel}>Tổng thanh toán</Text>
                  <Text style={styles.grandValue}>{formatVND(activeQuote.totalVnd)}</Text>
                </View>
              </View>
            ) : null}
          </ScrollView>

          <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom + 8, 14) }]}>
            <Pressable style={styles.backStepBtn} onPress={() => setStep("form")}>
              <Text style={styles.backStepText}>Chỉnh sửa</Text>
            </Pressable>
            <Pressable
              style={[
                styles.placeOrderBtn,
                (submitting || timeLeftSeconds <= 0 || !activeQuote) && { opacity: 0.5 },
              ]}
              disabled={submitting || timeLeftSeconds <= 0 || !activeQuote}
              onPress={handleProceedToPayos}
            >
              {submitting ? (
                <ActivityIndicator size="small" color={colors.onPrimary} />
              ) : (
                <Text style={styles.placeOrderText}>Thanh toán PayOS</Text>
              )}
            </Pressable>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surfaceContainerLow },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingBottom: 12,
    backgroundColor: colors.panel,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  iconBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  topTitle: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.onSurface },
  scroll: { padding: spacing.md, gap: 12, paddingBottom: 110 },
  sectionCard: {
    backgroundColor: colors.panel,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: 10,
    ...shadows.sm,
  },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionTitleRow: { flexDirection: "row", alignItems: "center", gap: 6, flex: 1 },
  sectionTitle: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: colors.onSurface },
  editLink: { fontSize: fontSize.xs, fontWeight: fontWeight.bold, color: colors.primary },
  formGap: { gap: 8 },
  input: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: borderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: fontSize.sm,
    color: colors.onSurface,
    backgroundColor: colors.surfaceContainerLowest,
  },
  addressSummary: { gap: 4 },
  addressName: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.onSurface },
  addressLine: { fontSize: fontSize.xs, color: colors.onSurfaceVariant, lineHeight: 18 },
  addressNote: { fontSize: fontSize.xs, color: colors.secondary, fontStyle: "italic" },
  mutedHint: { fontSize: fontSize.xs, color: colors.onSurfaceVariant },
  methodCard: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: borderRadius.md,
    padding: 12,
    gap: 4,
    backgroundColor: colors.surfaceContainerLowest,
  },
  methodCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.greenSoft,
  },
  methodHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
  methodLeft: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
  methodTitle: { fontSize: fontSize.xs, fontWeight: fontWeight.bold, color: colors.onSurface, flex: 1 },
  methodBadge: {
    backgroundColor: colors.panel,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line,
  },
  methodBadgeText: { fontSize: 10, fontWeight: fontWeight.bold, color: colors.primary },
  methodDesc: { fontSize: 11, color: colors.onSurfaceVariant, lineHeight: 16 },
  timerBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FFFBEB",
    borderWidth: 1,
    borderColor: "#FDE68A",
    padding: 12,
    borderRadius: borderRadius.md,
  },
  timerBannerText: { flex: 1, fontSize: fontSize.xs, fontWeight: fontWeight.bold, color: colors.secondary },
  quoteTabs: { flexDirection: "row", gap: 8 },
  quoteTab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: borderRadius.md,
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: "center",
  },
  quoteTabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  quoteTabText: { fontSize: fontSize.xs, fontWeight: fontWeight.bold, color: colors.onSurface },
  quoteTabTextActive: { color: colors.onPrimary },
  quoteSubtotal: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: colors.primary },
  vendorGroup: { borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 8, gap: 6 },
  vendorGroupHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  vendorName: { fontSize: fontSize.xs, fontWeight: fontWeight.bold, color: colors.onSurface },
  vendorShip: { fontSize: 11, color: colors.onSurfaceVariant },
  quoteItemRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
  quoteItemName: { fontSize: fontSize.xs, color: colors.onSurface, fontWeight: fontWeight.medium },
  quoteItemMeta: { fontSize: 11, color: colors.onSurfaceVariant },
  quoteItemTotal: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold, color: colors.onSurface },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  summaryLabel: { fontSize: fontSize.xs, color: colors.onSurfaceVariant },
  summaryValue: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold, color: colors.onSurface },
  divider: { height: 1, backgroundColor: colors.line, marginVertical: 4 },
  grandLabel: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: colors.onSurface },
  grandValue: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.primary },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.panel,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingHorizontal: spacing.md,
    paddingTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  bottomLabel: { fontSize: 11, color: colors.onSurfaceVariant },
  bottomTotal: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.primary },
  backStepBtn: {
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: borderRadius.lg,
  },
  backStepText: { color: colors.onSurface, fontWeight: fontWeight.bold, fontSize: fontSize.sm },
  placeOrderBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: borderRadius.lg,
    minWidth: 165,
    alignItems: "center",
  },
  placeOrderText: { color: colors.onPrimary, fontWeight: fontWeight.bold, fontSize: fontSize.sm },
});
