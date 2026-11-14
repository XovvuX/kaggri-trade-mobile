import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { colors, fontSize, fontWeight, spacing, borderRadius, shadows } from "@/theme";
import { OrderTimeline } from "@/components/OrderTimeline";
import { orderService, paymentService, formatSaleUnit } from "@/services";
import type {
  KaggriOrderPayment,
  KaggriOrderStatusHistory,
  KaggriParentOrder,
} from "@/services/api";
import {
  formatVND,
  formatDateTime,
  getParentOrderStatusText,
  getVendorOrderStatusText,
} from "@/utils";

const CANCELLABLE_STATUSES = new Set([
  "AWAITING_PAYMENT",
  "PENDING_SUPPLIER_CONFIRMATION",
  "PARTIALLY_CONFIRMED",
  "CONFIRMED",
]);

export default function BuyerOrderDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [order, setOrder] = useState<KaggriParentOrder | null>(null);
  const [history, setHistory] = useState<KaggriOrderStatusHistory[]>([]);
  const [payment, setPayment] = useState<KaggriOrderPayment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDetail = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [detail, hist, pay] = await Promise.all([
        orderService.getBuyerOrderDetail(id),
        orderService.getOrderHistory(id).catch(() => []),
        paymentService.getOrderPayment(id).catch(() => null),
      ]);
      setOrder(detail);
      setHistory(hist);
      setPayment(pay);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải chi tiết đơn hàng.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  const handleCancel = () => {
    if (!order) return;
    Alert.alert("Hủy đơn hàng", `Xác nhận hủy đơn #${order.orderNumber}?`, [
      { text: "Không", style: "cancel" },
      {
        text: "Hủy đơn",
        style: "destructive",
        onPress: async () => {
          try {
            await orderService.cancelBuyerOrder(order.id, "Người mua hủy đơn");
            await loadDetail();
          } catch (err) {
            Alert.alert("Không thể hủy", err instanceof Error ? err.message : "Vui lòng thử lại.");
          }
        },
      },
    ]);
  };

  const timelineSteps = history.map((h, index) => ({
    label: getParentOrderStatusText(h.toStatus),
    description: h.note || `Tác nhân: ${h.actorType}`,
    time: formatDateTime(h.createdAt),
    status: (index === history.length - 1 ? "active" : "done") as "active" | "done" | "pending",
    icon: (index === history.length - 1 ? "local-shipping" : "check") as any,
  }));

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top + 8, 12) }]}>
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.replace("/(buyer)"))}
          style={styles.iconBtn}
          hitSlop={6}
        >
          <MaterialIcons name="arrow-back" size={22} color={colors.onPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>
          {order ? `Đơn #${order.orderNumber}` : "Chi tiết đơn hàng"}
        </Text>
        <Pressable onPress={loadDetail} style={styles.iconBtn} hitSlop={6}>
          <MaterialIcons name="refresh" size={20} color={colors.onPrimary} />
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error || !order ? (
        <View style={styles.centerBox}>
          <Text style={styles.errorText}>{error || "Không tìm thấy đơn hàng."}</Text>
          <Pressable style={styles.primaryBtn} onPress={loadDetail}>
            <Text style={styles.primaryBtnText}>Thử lại</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
            {/* Status Banner */}
            <View style={styles.statusCard}>
              <Text style={styles.statusTitle}>{getParentOrderStatusText(order.status)}</Text>
              <Text style={styles.statusSub}>
                Loại: {order.checkoutType === "PREORDER" ? "Đặt trước" : "Giao ngay"} • Thanh toán:{" "}
                {payment?.status || order.paymentStatus}
              </Text>
              <Text style={styles.statusTime}>Tạo lúc: {formatDateTime(order.createdAt)}</Text>
            </View>

            {/* Delivery Address */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Địa chỉ nhận hàng</Text>
              <Text style={styles.addrName}>
                {order.deliveryAddress.recipientName} • {order.deliveryAddress.recipientPhone}
              </Text>
              <Text style={styles.addrLine}>
                {[
                  order.deliveryAddress.addressLine,
                  order.deliveryAddress.ward,
                  order.deliveryAddress.district,
                  order.deliveryAddress.province,
                ]
                  .filter(Boolean)
                  .join(", ")}
              </Text>
              {order.deliveryAddress.deliveryNote ? (
                <Text style={styles.addrNote}>Ghi chú: {order.deliveryAddress.deliveryNote}</Text>
              ) : null}
            </View>

            {/* Vendor Orders */}
            {order.vendorOrders.map((vo) => (
              <View key={vo.id} style={styles.card}>
                <View style={styles.voHeader}>
                  <Text style={styles.cardTitle}>{vo.vendorDisplayName}</Text>
                  <Text style={styles.voStatus}>{getVendorOrderStatusText(vo.status)}</Text>
                </View>
                <Text style={styles.voCode}>Mã đơn NCC: {vo.orderNumber}</Text>
                {vo.items.map((item) => (
                  <View key={item.id} style={styles.itemRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemName}>{item.productNameSnapshot}</Text>
                      <Text style={styles.itemMeta}>
                        {item.quantity} {formatSaleUnit(item.saleUnitSnapshot)} ×{" "}
                        {formatVND(item.unitPriceVnd)}
                      </Text>
                    </View>
                    <Text style={styles.itemTotal}>{formatVND(item.lineSubtotalVnd)}</Text>
                  </View>
                ))}
                <View style={styles.voTotalRow}>
                  <Text style={styles.voShip}>Phí VC: {formatVND(vo.shippingFeeVnd)}</Text>
                  <Text style={styles.voTotal}>Tổng: {formatVND(vo.totalVnd)}</Text>
                </View>
              </View>
            ))}

            {/* Cost Summary */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Chi tiết thanh toán</Text>
              <View style={styles.sumRow}>
                <Text style={styles.sumLabel}>Tiền hàng</Text>
                <Text style={styles.sumVal}>{formatVND(order.merchandiseSubtotalVnd)}</Text>
              </View>
              <View style={styles.sumRow}>
                <Text style={styles.sumLabel}>Phí vận chuyển</Text>
                <Text style={styles.sumVal}>{formatVND(order.shippingFeeVnd)}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.sumRow}>
                <Text style={styles.grandLabel}>Tổng thanh toán</Text>
                <Text style={styles.grandVal}>{formatVND(order.totalVnd)}</Text>
              </View>
            </View>

            {/* Order History Timeline */}
            {timelineSteps.length > 0 ? (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Lịch sử trạng thái</Text>
                <OrderTimeline steps={timelineSteps} />
              </View>
            ) : null}
          </ScrollView>

          {/* Bottom Bar */}
          {(order.status === "AWAITING_PAYMENT" || CANCELLABLE_STATUSES.has(order.status)) && (
            <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom + 8, 12) }]}>
              {CANCELLABLE_STATUSES.has(order.status) ? (
                <Pressable style={styles.cancelBtn} onPress={handleCancel}>
                  <Text style={styles.cancelBtnText}>Hủy đơn hàng</Text>
                </Pressable>
              ) : null}
              {order.status === "AWAITING_PAYMENT" ? (
                <Pressable
                  style={styles.payBtn}
                  onPress={() => router.push(`/buyer/payment?orderId=${order.id}`)}
                >
                  <Text style={styles.payBtnText}>Thanh toán ngay</Text>
                </Pressable>
              ) : null}
            </View>
          )}
        </>
      )}
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
    paddingBottom: 12,
  },
  iconBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerTitle: { color: colors.onPrimary, fontSize: fontSize.md, fontWeight: fontWeight.bold },
  centerBox: { flex: 1, justifyContent: "center", alignItems: "center", padding: spacing.lg, gap: 12 },
  errorText: { fontSize: fontSize.sm, color: colors.error, textAlign: "center" },
  primaryBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: borderRadius.md,
  },
  primaryBtnText: { color: colors.onPrimary, fontWeight: fontWeight.bold, fontSize: fontSize.sm },
  scroll: { padding: spacing.md, gap: 12, paddingBottom: 100 },
  statusCard: {
    backgroundColor: colors.primaryContainer,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: 4,
  },
  statusTitle: { color: colors.onPrimary, fontSize: fontSize.md, fontWeight: fontWeight.bold },
  statusSub: { color: colors.onPrimary, opacity: 0.9, fontSize: fontSize.xs },
  statusTime: { color: colors.onPrimary, opacity: 0.8, fontSize: 11 },
  card: {
    backgroundColor: colors.panel,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: 8,
    ...shadows.sm,
  },
  cardTitle: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: colors.onSurface },
  addrName: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold, color: colors.onSurface },
  addrLine: { fontSize: fontSize.xs, color: colors.onSurfaceVariant, lineHeight: 18 },
  addrNote: { fontSize: 11, color: colors.secondary, fontStyle: "italic" },
  voHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  voStatus: { fontSize: 11, fontWeight: fontWeight.bold, color: colors.primary },
  voCode: { fontSize: 11, color: colors.onSurfaceVariant },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  itemName: { fontSize: fontSize.xs, fontWeight: fontWeight.medium, color: colors.onSurface },
  itemMeta: { fontSize: 11, color: colors.onSurfaceVariant },
  itemTotal: { fontSize: fontSize.xs, fontWeight: fontWeight.bold, color: colors.onSurface },
  voTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingTop: 8,
  },
  voShip: { fontSize: 11, color: colors.onSurfaceVariant },
  voTotal: { fontSize: fontSize.xs, fontWeight: fontWeight.bold, color: colors.primary },
  sumRow: { flexDirection: "row", justifyContent: "space-between" },
  sumLabel: { fontSize: fontSize.xs, color: colors.onSurfaceVariant },
  sumVal: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold, color: colors.onSurface },
  divider: { height: 1, backgroundColor: colors.line, marginVertical: 2 },
  grandLabel: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: colors.onSurface },
  grandVal: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.primary },
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
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.error,
    paddingVertical: 12,
    borderRadius: borderRadius.lg,
    alignItems: "center",
  },
  cancelBtnText: { color: colors.error, fontWeight: fontWeight.bold, fontSize: fontSize.sm },
  payBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: borderRadius.lg,
    alignItems: "center",
  },
  payBtnText: { color: colors.onPrimary, fontWeight: fontWeight.bold, fontSize: fontSize.sm },
});
