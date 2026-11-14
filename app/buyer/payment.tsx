import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { WebView, type WebViewNavigation } from "react-native-webview";
import { colors, fontSize, fontWeight, spacing, borderRadius, shadows } from "@/theme";
import { useCheckoutStore } from "@/stores/checkout-store";
import { orderService, paymentService } from "@/services";
import type { KaggriOrderPayment, KaggriParentOrder } from "@/services/api";
import { formatVND } from "@/utils";

function extractQueryParam(url: string, key: string): string | null {
  try {
    const idx = url.indexOf("?");
    if (idx === -1) return null;
    const params = new URLSearchParams(url.slice(idx + 1));
    return params.get(key);
  } catch {
    return null;
  }
}

export default function PaymentScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { orderId: paramOrderId, autoOpenPayos } = useLocalSearchParams<{
    orderId?: string;
    autoOpenPayos?: string;
  }>();
  const activeOrder = useCheckoutStore((s) => s.activeOrder);
  const setActiveOrder = useCheckoutStore((s) => s.setActiveOrder);

  const orderId = paramOrderId || activeOrder?.id || "";

  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [openingPayos, setOpeningPayos] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<KaggriParentOrder | null>(activeOrder);
  const [orderPayment, setOrderPayment] = useState<KaggriOrderPayment | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);

  // In-app PayOS WebView state
  const [payosUrl, setPayosUrl] = useState<string | null>(null);
  const [payosWebLoading, setPayosWebLoading] = useState(true);
  const payosOrderCodeRef = useRef<number | string | null>(null);
  const autoOpenedRef = useRef(false);
  const handlingReturnRef = useRef(false);

  const loadPayment = useCallback(async () => {
    if (!orderId) {
      setError("Không tìm thấy mã đơn hàng để thanh toán.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [orderDetail, statusRes] = await Promise.all([
        orderService.getBuyerOrderDetail(orderId),
        paymentService.getOrderPayment(orderId).catch(() => null),
      ]);
      setOrder(orderDetail);
      setActiveOrder(orderDetail);
      setOrderPayment(statusRes);

      if (statusRes?.status === "PAID" || orderDetail.paymentStatus === "PAID") {
        router.replace(`/buyer/order-success?orderId=${orderId}`);
        return;
      }

      if (statusRes?.remainingSeconds !== undefined) {
        setTimeLeft(Math.max(0, statusRes.remainingSeconds));
      } else if (orderDetail.paymentExpiresAt) {
        const diff = Math.floor(
          (new Date(orderDetail.paymentExpiresAt).getTime() - Date.now()) / 1000
        );
        setTimeLeft(Math.max(0, diff));
      } else {
        setTimeLeft(15 * 60);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải thông tin đơn hàng.");
    } finally {
      setLoading(false);
    }
  }, [orderId, router, setActiveOrder]);

  useEffect(() => {
    loadPayment();
  }, [loadPayment]);

  const handleOpenPayos = useCallback(async () => {
    if (!orderId) return;
    setOpeningPayos(true);
    try {
      const res = await paymentService.createPayosCheckout(orderId);
      if (res?.orderCode) {
        payosOrderCodeRef.current = res.orderCode;
      }
      if (res?.checkoutUrl) {
        if (Platform.OS === "web") {
          window.location.href = res.checkoutUrl;
        } else {
          handlingReturnRef.current = false;
          setPayosWebLoading(true);
          setPayosUrl(res.checkoutUrl);
        }
      } else {
        Alert.alert("Lỗi PayOS", "Không nhận được link thanh toán từ PayOS.");
      }
    } catch (err) {
      Alert.alert(
        "Lỗi kết nối PayOS",
        err instanceof Error ? err.message : "Không thể tạo link thanh toán PayOS."
      );
    } finally {
      setOpeningPayos(false);
    }
  }, [orderId]);

  // Auto-open PayOS in-app WebView when coming from Checkout
  useEffect(() => {
    if (autoOpenPayos === "1" && !loading && !error && !autoOpenedRef.current) {
      autoOpenedRef.current = true;
      handleOpenPayos();
    }
  }, [autoOpenPayos, loading, error, handleOpenPayos]);

  // Poll payment status while PayOS WebView is open
  useEffect(() => {
    if (!payosUrl || !orderId) return;
    const poll = setInterval(async () => {
      try {
        const status = await paymentService.getOrderPayment(orderId);
        if (status?.status === "PAID") {
          setPayosUrl(null);
          router.replace(`/buyer/order-success?orderId=${orderId}`);
        }
      } catch {
        // Ignore transient polling errors
      }
    }, 3000);
    return () => clearInterval(poll);
  }, [payosUrl, orderId, router]);

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft > 0]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const verifyAndFinishPayos = useCallback(
    async (url: string) => {
      if (handlingReturnRef.current) return;
      handlingReturnRef.current = true;

      if (url.includes("cancel=true")) {
        setPayosUrl(null);
        Alert.alert("Đã hủy thanh toán", "Bạn có thể mở lại cổng PayOS để thanh toán.");
        return;
      }

      const codeFromUrl = extractQueryParam(url, "orderCode") || payosOrderCodeRef.current;
      if (codeFromUrl) {
        await paymentService.confirmPayosReturn(orderId, codeFromUrl);
      }

      try {
        const status = await paymentService.getOrderPayment(orderId);
        setOrderPayment(status);
        setPayosUrl(null);
        if (status.status === "PAID") {
          router.replace(`/buyer/order-success?orderId=${orderId}`);
        } else {
          Alert.alert(
            "Đang cập nhật giao dịch",
            `Trạng thái hiện tại: ${status.status}. Vui lòng bấm Kiểm tra trạng thái sau vài giây.`
          );
        }
      } catch {
        setPayosUrl(null);
      }
    },
    [orderId, router]
  );

  const isPayosCallbackUrl = (url: string) =>
    url.includes("/payments/payos/return") ||
    url.includes("/buyer/orders") ||
    url.includes("status=PAID") ||
    url.includes("cancel=true");

  const handleShouldStartLoad = (req: { url: string }) => {
    const url = req.url || "";
    if (isPayosCallbackUrl(url)) {
      verifyAndFinishPayos(url);
      return false; // Prevent WebView from trying to load localhost:3000 / localhost:4200
    }
    return true;
  };

  const handlePayosNavigation = (navState: WebViewNavigation) => {
    const url = navState.url || "";
    if (url && isPayosCallbackUrl(url)) {
      verifyAndFinishPayos(url);
    }
  };

  const handleCheckStatus = async () => {
    if (!orderId) return;
    setChecking(true);
    try {
      if (payosOrderCodeRef.current) {
        await paymentService.confirmPayosReturn(orderId, payosOrderCodeRef.current);
      }
      const status = await paymentService.getOrderPayment(orderId);
      setOrderPayment(status);
      if (status.status === "PAID") {
        router.replace(`/buyer/order-success?orderId=${orderId}`);
      } else {
        Alert.alert(
          "Chưa ghi nhận thanh toán",
          `Trạng thái hiện tại: ${status.status}. Vui lòng hoàn tất thanh toán qua PayOS và kiểm tra lại.`
        );
      }
    } catch (err) {
      Alert.alert("Lỗi kiểm tra", err instanceof Error ? err.message : "Vui lòng thử lại.");
    } finally {
      setChecking(false);
    }
  };

  const amountVnd = orderPayment?.amountVnd ?? order?.totalVnd ?? 0;
  const orderNumber = orderPayment?.orderNumber ?? order?.orderNumber ?? orderId;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top + 8, 14) }]}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn} hitSlop={6}>
          <MaterialIcons name="arrow-back" size={24} color={colors.onPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Thanh toán PayOS</Text>
        <Pressable onPress={loadPayment} style={styles.iconBtn} hitSlop={6}>
          <MaterialIcons name="refresh" size={22} color={colors.onPrimary} />
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Đang tải thông tin thanh toán...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerBox}>
          <MaterialIcons name="error-outline" size={40} color={colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.primaryBtn} onPress={loadPayment}>
            <Text style={styles.primaryBtnText}>Thử lại</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          <View style={styles.amountCard}>
            <Text style={styles.orderCodeLabel}>Đơn hàng #{orderNumber}</Text>
            <Text style={styles.amountValue}>{formatVND(amountVnd)}</Text>
            <View style={styles.timerBadge}>
              <MaterialIcons name="schedule" size={14} color={colors.secondary} />
              <Text style={styles.timerText}>
                {timeLeft > 0
                  ? `Còn ${formatTime(timeLeft)} để hoàn tất thanh toán`
                  : "Đã hết hạn thanh toán"}
              </Text>
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.payosBadgeRow}>
              <MaterialIcons name="verified-user" size={20} color={colors.primary} />
              <Text style={styles.cardTitle}>Cổng thanh toán PayOS (VietQR)</Text>
            </View>
            <Text style={styles.cardDesc}>
              Giao dịch được thực hiện trực tiếp qua cổng PayOS ngay trong ứng dụng. Sau khi chuyển
              khoản thành công, hệ thống sẽ tự động xác nhận và chuyển về trang hoàn tất đơn hàng.
            </Text>
          </View>

          <Pressable
            style={[styles.primaryBtn, openingPayos && { opacity: 0.6 }]}
            disabled={openingPayos}
            onPress={handleOpenPayos}
          >
            {openingPayos ? (
              <ActivityIndicator size="small" color={colors.onPrimary} />
            ) : (
              <Text style={styles.primaryBtnText}>Thanh toán qua PayOS</Text>
            )}
          </Pressable>

          <Pressable
            style={[
              styles.outlineBtn,
              checking && { opacity: 0.6 },
            ]}
            disabled={checking}
            onPress={handleCheckStatus}
          >
            {checking ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Text style={styles.outlineBtnText}>Kiểm tra trạng thái thanh toán</Text>
            )}
          </Pressable>
        </ScrollView>
      )}

      {/* In-App PayOS WebView Modal */}
      <Modal
        visible={Boolean(payosUrl)}
        animationType="slide"
        onRequestClose={() => {
          setPayosUrl(null);
          handleCheckStatus();
        }}
      >
        <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
          <View style={styles.modalHeader}>
            <Pressable
              onPress={() => {
                setPayosUrl(null);
                handleCheckStatus();
              }}
              style={styles.modalCloseBtn}
            >
              <MaterialIcons name="close" size={22} color={colors.onSurface} />
            </Pressable>
            <Text style={styles.modalTitle}>Cổng thanh toán PayOS</Text>
            <View style={{ width: 36 }} />
          </View>

          {payosWebLoading ? (
            <View style={styles.webLoader}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.loadingText}>Đang tải cổng thanh toán PayOS...</Text>
            </View>
          ) : null}

          {payosUrl ? (
            <WebView
              source={{ uri: payosUrl }}
              onLoadEnd={() => setPayosWebLoading(false)}
              onShouldStartLoadWithRequest={handleShouldStartLoad}
              onNavigationStateChange={handlePayosNavigation}
              startInLoadingState
              javaScriptEnabled
              domStorageEnabled
              style={{ flex: 1 }}
            />
          ) : null}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surfaceContainerLow },
  header: {
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingBottom: 14,
  },
  iconBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerTitle: { color: colors.onPrimary, fontSize: fontSize.md, fontWeight: fontWeight.bold },
  centerBox: { flex: 1, justifyContent: "center", alignItems: "center", padding: spacing.lg, gap: 12 },
  loadingText: { fontSize: fontSize.sm, color: colors.onSurfaceVariant },
  errorText: { fontSize: fontSize.sm, color: colors.error, textAlign: "center" },
  scroll: { padding: spacing.md, gap: 14, paddingBottom: 40 },
  amountCard: {
    backgroundColor: colors.panel,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: "center",
    gap: 6,
    ...shadows.sm,
  },
  orderCodeLabel: { fontSize: fontSize.xs, color: colors.onSurfaceVariant, fontWeight: fontWeight.semibold },
  amountValue: { fontSize: 28, fontWeight: fontWeight.bold, color: colors.primary },
  timerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFFBEB",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  timerText: { fontSize: fontSize.xs, color: colors.secondary, fontWeight: fontWeight.semibold },
  card: {
    backgroundColor: colors.panel,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: 8,
    ...shadows.sm,
  },
  payosBadgeRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  cardTitle: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: colors.onSurface },
  cardDesc: { fontSize: fontSize.xs, color: colors.onSurfaceVariant, lineHeight: 18 },
  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  primaryBtnText: { color: colors.onPrimary, fontWeight: fontWeight.bold, fontSize: fontSize.sm },
  outlineBtn: {
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  outlineBtnText: { color: colors.primary, fontWeight: fontWeight.bold, fontSize: fontSize.sm },
  modalContainer: { flex: 1, backgroundColor: colors.panel },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    backgroundColor: colors.panel,
  },
  modalCloseBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  modalTitle: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.onSurface },
  webLoader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 10,
    backgroundColor: colors.surfaceContainerLowest,
  },
});
