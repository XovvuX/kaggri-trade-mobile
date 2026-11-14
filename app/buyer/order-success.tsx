import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  BackHandler,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, fontSize, fontWeight, spacing, borderRadius, shadows } from "@/theme";
import { formatVND, getParentOrderStatusText } from "@/utils";
import { useCheckoutStore } from "@/stores/checkout-store";
import { orderService } from "@/services";
import type { KaggriParentOrder } from "@/services/api";

export default function OrderSuccessScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { orderId: paramOrderId } = useLocalSearchParams<{ orderId?: string }>();
  const activeOrder = useCheckoutStore((s) => s.activeOrder);
  const resetCheckout = useCheckoutStore((s) => s.reset);

  const [order, setOrder] = useState<KaggriParentOrder | null>(activeOrder);
  const [loading, setLoading] = useState(Boolean(paramOrderId));

  const navigateAway = useCallback(
    (href: string) => {
      resetCheckout();
      if (router.canDismiss()) {
        router.dismissAll();
      }
      router.replace(href as any);
    },
    [resetCheckout, router]
  );

  // Intercept Android hardware back button -> always go to Home instead of back to checkout/cart
  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      navigateAway("/(buyer)");
      return true;
    });
    return () => sub.remove();
  }, [navigateAway]);

  useEffect(() => {
    if (!paramOrderId) return;
    setLoading(true);
    orderService
      .getBuyerOrderDetail(paramOrderId)
      .then((res) => setOrder(res))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [paramOrderId]);

  const orderNumber = order?.orderNumber || "—";
  const totalVnd = order?.totalVnd ?? 0;
  const isPaid = order?.paymentStatus === "PAID";

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.celebration}>
          <View style={styles.checkCircle}>
            <MaterialIcons name="check" size={48} color={colors.onPrimary} />
          </View>
          <Text style={styles.title}>
            {isPaid ? "Thanh toán thành công!" : "Đặt hàng thành công!"}
          </Text>
          <Text style={styles.subtitle}>
            {order?.checkoutType === "PREORDER" && !isPaid
              ? "Đơn đặt trước đang chờ Nhà cung cấp xác nhận nguồn cung."
              : "Cảm ơn bạn đã giao dịch qua Kaggri-Trade."}
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Mã đơn hàng</Text>
              <Text style={styles.codeText}>#{orderNumber}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Tổng giá trị</Text>
              <Text style={styles.infoValue}>{formatVND(totalVnd)}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Trạng thái</Text>
              <Text style={styles.statusText}>
                {order ? getParentOrderStatusText(order.status) : "Đã ghi nhận"}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.actions}>
          {order?.id ? (
            <Pressable
              style={styles.primaryBtn}
              onPress={() => router.push(`/buyer/order/${order.id}`)}
            >
              <Text style={styles.primaryBtnText}>Xem chi tiết đơn hàng</Text>
            </Pressable>
          ) : null}
          <Pressable
            style={styles.outlineBtn}
            onPress={() => navigateAway("/(buyer)")}
          >
            <Text style={styles.outlineBtnText}>Về trang chủ</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surfaceContainerLow },
  scroll: { padding: spacing.lg, gap: 20, alignItems: "center", paddingTop: 40 },
  celebration: { alignItems: "center", gap: 10 },
  checkCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  title: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.onSurface },
  subtitle: { fontSize: fontSize.sm, color: colors.onSurfaceVariant, textAlign: "center" },
  infoCard: {
    width: "100%",
    backgroundColor: colors.panel,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: 10,
    ...shadows.sm,
  },
  infoRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  infoLabel: { fontSize: fontSize.xs, color: colors.onSurfaceVariant },
  codeText: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: colors.primary },
  infoValue: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.onSurface },
  statusText: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold, color: colors.secondary },
  divider: { height: 1, backgroundColor: colors.line },
  actions: { width: "100%", gap: 10, marginTop: 8 },
  primaryBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: borderRadius.lg,
    alignItems: "center",
  },
  primaryBtnText: { color: colors.onPrimary, fontWeight: fontWeight.bold, fontSize: fontSize.sm },
  outlineBtn: {
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingVertical: 13,
    borderRadius: borderRadius.lg,
    alignItems: "center",
  },
  outlineBtnText: { color: colors.primary, fontWeight: fontWeight.bold, fontSize: fontSize.sm },
});
