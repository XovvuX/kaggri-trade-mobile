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
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { colors, fontSize, fontWeight, spacing, borderRadius, shadows } from "@/theme";
import { KaggriBrand } from "@/components/Header";
import { EmptyState } from "@/components/EmptyState";
import { vendorOrderService, formatSaleUnit } from "@/services";
import type { KaggriVendorOrder } from "@/services/api";
import { formatVND, getVendorOrderStatusText, getStatusChipColor } from "@/utils";

const TABS = [
  { key: "ALL", label: "Tất cả" },
  { key: "AWAITING_CONFIRMATION", label: "Chờ xác nhận" },
  { key: "PAID", label: "Đã thanh toán" },
  { key: "PREPARING", label: "Đang chuẩn bị" },
  { key: "READY_TO_SHIP", label: "Sẵn sàng giao" },
  { key: "COMPLETED", label: "Hoàn thành" },
  { key: "CANCELLED", label: "Đã hủy" },
];

export default function VendorOrdersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [tab, setTab] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [orders, setOrders] = useState<KaggriVendorOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const res = await vendorOrderService.list({ page: 1, limit: 50 });
      setOrders(res.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải danh sách đơn hàng.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const filtered = orders.filter((o) => {
    const matchTab = tab === "ALL" || o.status === tab;
    const q = searchQuery.trim().toLowerCase();
    const matchSearch =
      !q ||
      o.orderNumber.toLowerCase().includes(q) ||
      o.items.some((it) => it.productNameSnapshot.toLowerCase().includes(q));
    return matchTab && matchSearch;
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <KaggriBrand compact />
        <Pressable style={styles.refreshIconBtn} onPress={() => loadOrders(true)}>
          <MaterialIcons name="refresh" size={20} color={colors.primary} />
        </Pressable>
      </View>

      <View style={styles.searchWrap}>
        <MaterialIcons name="search" size={18} color={colors.muted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm theo mã đơn VO hoặc tên nông sản..."
          placeholderTextColor={colors.muted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

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
          <Pressable style={styles.retryBtn} onPress={() => loadOrders()}>
            <Text style={styles.retryText}>Thử lại</Text>
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
              description="Các đơn hàng từ người mua thuộc HTX/NCC của bạn sẽ hiển thị tại đây."
            />
          ) : (
            filtered.map((order) => {
              const firstItem = order.items[0];
              const chipColor = getStatusChipColor(order.status);

              return (
                <Pressable
                  key={order.id}
                  style={styles.orderCard}
                  onPress={() => router.push(`/vendor/order/${order.id}`)}
                >
                  <View style={styles.orderTop}>
                    <Text style={styles.orderCode}>#{order.orderNumber}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: `${chipColor}20` }]}>
                      <Text style={[styles.statusBadgeText, { color: chipColor }]}>
                        {getVendorOrderStatusText(order.status)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.orderBody}>
                    {firstItem ? (
                      <Text style={styles.itemName} numberOfLines={2}>
                        {firstItem.productNameSnapshot} • {firstItem.quantity}{" "}
                        {formatSaleUnit(firstItem.saleUnitSnapshot)}
                        {order.items.length > 1
                          ? ` (+${order.items.length - 1} mặt hàng khác)`
                          : ""}
                      </Text>
                    ) : null}
                    <Text style={styles.itemSub}>
                      Tiền hàng: {formatVND(order.merchandiseSubtotalVnd)} • Phí VC:{" "}
                      {formatVND(order.shippingFeeVnd)}
                    </Text>
                  </View>

                  <View style={styles.orderFooter}>
                    <View>
                      <Text style={styles.totalLabel}>Tổng đơn con</Text>
                      <Text style={styles.totalAmount}>{formatVND(order.totalVnd)}</Text>
                    </View>
                    <View style={styles.detailBtn}>
                      <Text style={styles.detailBtnText}>Xử lý đơn</Text>
                      <MaterialIcons name="chevron-right" size={16} color={colors.primary} />
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
  refreshIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.greenSoft,
    alignItems: "center",
    justifyContent: "center",
  },
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
  retryBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: borderRadius.md,
  },
  retryText: { color: colors.onPrimary, fontWeight: fontWeight.bold, fontSize: fontSize.sm },
  listContent: { padding: spacing.md, gap: 12, paddingBottom: 30 },
  orderCard: {
    backgroundColor: colors.panel,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: 10,
    ...shadows.sm,
  },
  orderTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
  orderCode: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: colors.onSurface },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  statusBadgeText: { fontSize: 11, fontWeight: fontWeight.bold },
  orderBody: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.line,
    paddingVertical: 8,
    gap: 4,
  },
  itemName: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold, color: colors.onSurface },
  itemSub: { fontSize: 11, color: colors.onSurfaceVariant },
  orderFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  totalLabel: { fontSize: 11, color: colors.onSurfaceVariant },
  totalAmount: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.primary },
  detailBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    backgroundColor: colors.greenSoft,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: borderRadius.md,
  },
  detailBtnText: { fontSize: fontSize.xs, fontWeight: fontWeight.bold, color: colors.primary },
});
