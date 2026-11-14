import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { colors, fontSize, fontWeight, spacing, borderRadius, shadows } from "@/theme";
import { KaggriBrand } from "@/components/Header";
import { EmptyState } from "@/components/EmptyState";
import { useAuthStore } from "@/stores/auth-store";
import { orderService, formatSaleUnit } from "@/services";
import type { KaggriParentOrder } from "@/services/api";
import { formatVND, formatDateTime, getParentOrderStatusText } from "@/utils";

const TABS = [
  { key: "ALL", label: "Tất cả" },
  { key: "AWAITING_PAYMENT", label: "Chờ thanh toán" },
  { key: "PENDING_SUPPLIER_CONFIRMATION", label: "Chờ NCC duyệt" },
  { key: "PAID", label: "Đã thanh toán" },
  { key: "COMPLETED", label: "Hoàn thành" },
  { key: "CANCELLED", label: "Đã hủy" },
];

const CANCELLABLE_STATUSES = new Set([
  "AWAITING_PAYMENT",
  "PENDING_SUPPLIER_CONFIRMATION",
  "PARTIALLY_CONFIRMED",
  "CONFIRMED",
]);

export default function BuyerOrdersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const [tab, setTab] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [orders, setOrders] = useState<KaggriParentOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = useCallback(async (isRefresh = false) => {
    if (!isAuthenticated) return;
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const res = await orderService.listBuyerOrders({ page: 1, limit: 50 });
      setOrders(res.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải danh sách đơn hàng.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleCancelOrder = (order: KaggriParentOrder) => {
    Alert.alert(
      "Hủy đơn hàng",
      `Bạn có chắc muốn hủy đơn #${order.orderNumber}?`,
      [
        { text: "Không", style: "cancel" },
        {
          text: "Xác nhận hủy",
          style: "destructive",
          onPress: async () => {
            try {
              await orderService.cancelBuyerOrder(order.id, "Người mua hủy trên ứng dụng");
              await loadOrders();
            } catch (err) {
              Alert.alert(
                "Không thể hủy đơn",
                err instanceof Error ? err.message : "Vui lòng thử lại."
              );
            }
          },
        },
      ]
    );
  };

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <KaggriBrand compact />
        </View>
        <View style={styles.guestWrap}>
          <EmptyState
            emoji="📋"
            title="Theo dõi đơn hàng B2B"
            description="Đăng nhập tài khoản Người mua để xem danh sách đơn hàng, thanh toán và tiến độ giao nhận."
          />
          <Pressable
            onPress={() => router.push("/auth/login?role=buyer&redirect=/(buyer)/orders")}
            style={styles.loginBtn}
          >
            <Text style={styles.loginBtnText}>Đăng nhập ngay</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const filtered = orders.filter((o) => {
    const matchTab =
      tab === "ALL" ||
      o.status === tab ||
      (tab === "CANCELLED" && (o.status === "CANCELLED" || o.status === "REJECTED" || o.status === "EXPIRED"));
    const q = searchQuery.trim().toLowerCase();
    const matchSearch =
      !q ||
      o.orderNumber.toLowerCase().includes(q) ||
      o.vendorOrders.some(
        (vo) =>
          vo.vendorDisplayName.toLowerCase().includes(q) ||
          vo.items.some((it) => it.productNameSnapshot.toLowerCase().includes(q))
      );
    return matchTab && matchSearch;
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <KaggriBrand compact />
        <Pressable style={styles.cartBtn} onPress={() => router.push("/buyer/cart")}>
          <MaterialIcons name="shopping-cart" size={20} color={colors.primary} />
        </Pressable>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <MaterialIcons name="search" size={18} color={colors.muted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm theo mã đơn, HTX hoặc nông sản..."
          placeholderTextColor={colors.muted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabScroll}
        contentContainerStyle={styles.tabContent}
      >
        {TABS.map((t) => (
          <Pressable
            key={t.key}
            style={[styles.tabPill, tab === t.key && styles.tabPillActive]}
            onPress={() => setTab(t.key)}
          >
            <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>
              {t.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {loading && orders.length === 0 ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error && orders.length === 0 ? (
        <View style={styles.centerBox}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.loginBtn} onPress={() => loadOrders()}>
            <Text style={styles.loginBtnText}>Thử lại</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadOrders(true)}
              tintColor={colors.primary}
            />
          }
        >
          {filtered.length === 0 ? (
            <EmptyState
              emoji="📦"
              title="Chưa có đơn hàng"
              description="Các đơn hàng bạn đặt sẽ hiển thị tại đây."
            />
          ) : (
            filtered.map((order) => {
              const firstVendor = order.vendorOrders[0];
              const firstItem = firstVendor?.items[0];
              const itemCount = order.vendorOrders.reduce((s, vo) => s + vo.items.length, 0);
              const canPay = order.status === "AWAITING_PAYMENT";
              const canCancel = CANCELLABLE_STATUSES.has(order.status);

              return (
                <Pressable
                  key={order.id}
                  style={styles.orderCard}
                  onPress={() => router.push(`/buyer/order/${order.id}`)}
                >
                  <View style={styles.orderTop}>
                    <View>
                      <Text style={styles.orderCode}>#{order.orderNumber}</Text>
                      <Text style={styles.orderDate}>{formatDateTime(order.createdAt)}</Text>
                    </View>
                    <View style={styles.statusBadge}>
                      <Text style={styles.statusBadgeText}>
                        {getParentOrderStatusText(order.status)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.orderBody}>
                    <Text style={styles.vendorTitle}>
                      {firstVendor?.vendorDisplayName || "Nhà cung cấp"}
                      {order.vendorOrders.length > 1
                        ? ` (+${order.vendorOrders.length - 1} HTX khác)`
                        : ""}
                    </Text>
                    {firstItem ? (
                      <Text style={styles.itemSummary} numberOfLines={2}>
                        {firstItem.productNameSnapshot} • {firstItem.quantity}{" "}
                        {formatSaleUnit(firstItem.saleUnitSnapshot)}
                        {itemCount > 1 ? ` và ${itemCount - 1} sản phẩm khác` : ""}
                      </Text>
                    ) : null}
                  </View>

                  <View style={styles.orderFooter}>
                    <View>
                      <Text style={styles.totalLabel}>Tổng thanh toán</Text>
                      <Text style={styles.totalAmount}>{formatVND(order.totalVnd)}</Text>
                    </View>
                    <View style={styles.footerActions}>
                      {canCancel ? (
                        <Pressable
                          style={styles.outlineActionBtn}
                          onPress={() => handleCancelOrder(order)}
                        >
                          <Text style={styles.outlineActionText}>Hủy đơn</Text>
                        </Pressable>
                      ) : null}
                      {canPay ? (
                        <Pressable
                          style={styles.primaryActionBtn}
                          onPress={() => router.push(`/buyer/payment?orderId=${order.id}`)}
                        >
                          <Text style={styles.primaryActionText}>Thanh toán</Text>
                        </Pressable>
                      ) : (
                        <Pressable
                          style={styles.outlineActionBtn}
                          onPress={() => router.push(`/buyer/order/${order.id}`)}
                        >
                          <Text style={styles.outlineActionText}>Chi tiết</Text>
                        </Pressable>
                      )}
                    </View>
                  </View>
                </Pressable>
              );
            })
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surfaceContainerLow },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    backgroundColor: colors.panel,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  cartBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.greenSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  guestWrap: { flex: 1, justifyContent: "center", alignItems: "center", padding: spacing.lg, gap: 16 },
  loginBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: borderRadius.lg,
  },
  loginBtnText: { color: colors.onPrimary, fontWeight: fontWeight.bold, fontSize: fontSize.sm },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.panel,
    marginHorizontal: spacing.md,
    marginTop: 10,
    paddingHorizontal: 12,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.line,
    gap: 8,
  },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: fontSize.sm, color: colors.onSurface },
  tabScroll: { maxHeight: 48, marginTop: 8 },
  tabContent: { paddingHorizontal: spacing.md, gap: 8, alignItems: "center" },
  tabPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.line,
  },
  tabPillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  tabText: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold, color: colors.onSurfaceVariant },
  tabTextActive: { color: colors.onPrimary },
  centerBox: { flex: 1, justifyContent: "center", alignItems: "center", padding: spacing.lg, gap: 12 },
  errorText: { fontSize: fontSize.sm, color: colors.error, textAlign: "center" },
  listContent: { padding: spacing.md, gap: 12, paddingBottom: 30 },
  orderCard: {
    backgroundColor: colors.panel,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: 10,
    ...shadows.sm,
  },
  orderTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 8 },
  orderCode: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: colors.onSurface },
  orderDate: { fontSize: 11, color: colors.onSurfaceVariant, marginTop: 2 },
  statusBadge: {
    backgroundColor: colors.greenSoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusBadgeText: { fontSize: 11, fontWeight: fontWeight.bold, color: colors.primary },
  orderBody: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.line,
    paddingVertical: 8,
    gap: 4,
  },
  vendorTitle: { fontSize: fontSize.xs, fontWeight: fontWeight.bold, color: colors.onSurface },
  itemSummary: { fontSize: fontSize.xs, color: colors.onSurfaceVariant },
  orderFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  totalLabel: { fontSize: 11, color: colors.onSurfaceVariant },
  totalAmount: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.primary },
  footerActions: { flexDirection: "row", gap: 8 },
  primaryActionBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: borderRadius.md,
  },
  primaryActionText: { color: colors.onPrimary, fontSize: fontSize.xs, fontWeight: fontWeight.bold },
  outlineActionBtn: {
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: borderRadius.md,
  },
  outlineActionText: { color: colors.onSurface, fontSize: fontSize.xs, fontWeight: fontWeight.semibold },
});
