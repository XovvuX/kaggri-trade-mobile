import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { colors, fontSize, fontWeight, spacing, borderRadius, shadows } from "@/theme";
import { EmptyState } from "@/components/EmptyState";
import { useCartStore } from "@/stores/cart-store";
import { useCheckoutStore } from "@/stores/checkout-store";
import { useAuthStore } from "@/stores/auth-store";
import { resolveImageSource } from "@/services/api";
import { formatVND, groupCartByVendor } from "@/utils";

function getIssueMessage(issue: string, minQty: number, available: number, unit: string): string {
  switch (issue) {
    case "MINIMUM_ORDER_QUANTITY_NOT_MET":
      return `Chưa đạt số lượng tối thiểu (MOQ: ${minQty} ${unit})`;
    case "INSUFFICIENT_STOCK_AND_PREORDER_DISABLED":
      return `Tồn kho không đủ (còn ${available} ${unit}) và không hỗ trợ đặt trước`;
    case "INVALID_UNIT_PRECISION":
      return `Số lượng chưa đúng quy cách đơn vị (${unit})`;
    case "VENDOR_NOT_ELIGIBLE":
      return "Nhà cung cấp hiện chưa đủ điều kiện mở bán";
    case "PRODUCT_NOT_AVAILABLE":
      return "Sản phẩm hiện không còn khả dụng";
    case "CATEGORY_INACTIVE":
      return "Danh mục của sản phẩm đã tạm ngưng";
    default:
      return issue;
  }
}

export default function CartScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const items = useCartStore((s) => s.items);
  const loading = useCartStore((s) => s.loading);
  const syncing = useCartStore((s) => s.syncing);
  const fetchCart = useCartStore((s) => s.fetchCart);
  const updateQty = useCartStore((s) => s.updateQty);
  const remove = useCartStore((s) => s.remove);
  const clearCart = useCartStore((s) => s.clear);
  const setSelectedCartItemIds = useCheckoutStore((s) => s.setSelectedCartItemIds);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const [selectedItems, setSelectedItems] = useState<Set<string>>(
    new Set(items.filter((i) => i.isValidForCheckout !== false).map((i) => i.productId))
  );

  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
    }
  }, [isAuthenticated, fetchCart]);

  useEffect(() => {
    setSelectedItems((prev) => {
      const validIds = items
        .filter((i) => i.isValidForCheckout !== false)
        .map((i) => i.productId);
      if (prev.size === 0 && validIds.length > 0) {
        return new Set(validIds);
      }
      const currentProductIds = new Set(items.map((i) => i.productId));
      const next = new Set(Array.from(prev).filter((id) => currentProductIds.has(id)));
      return next.size > 0 ? next : new Set(validIds);
    });
  }, [items]);

  const handleCheckout = () => {
    const selected = items.filter((i) => selectedItems.has(i.productId));
    if (selected.length === 0) {
      Alert.alert("Chưa chọn sản phẩm", "Vui lòng chọn ít nhất một sản phẩm để thanh toán.");
      return;
    }
    const invalid = selected.find((i) => i.isValidForCheckout === false);
    if (invalid) {
      Alert.alert(
        "Sản phẩm chưa hợp lệ",
        invalid.validationIssues?.[0] || `${invalid.name} hiện không đủ điều kiện đặt hàng.`
      );
      return;
    }
    setSelectedCartItemIds(selected.map((i) => i.id || i.productId));
    if (!isAuthenticated) {
      router.push("/auth/login?role=buyer&redirect=/buyer/checkout");
    } else {
      router.push("/buyer/checkout");
    }
  };

  const handleQtyChange = async (productId: string, nextQty: number, itemId?: string) => {
    try {
      await updateQty(productId, nextQty, itemId);
    } catch (err) {
      Alert.alert("Không thể cập nhật", err instanceof Error ? err.message : "Vui lòng thử lại.");
    }
  };

  const handleRemove = async (productId: string, itemId?: string) => {
    try {
      await remove(productId, itemId);
    } catch (err) {
      Alert.alert("Không thể xóa", err instanceof Error ? err.message : "Vui lòng thử lại.");
    }
  };

  const handleClearCart = () => {
    Alert.alert("Xóa giỏ hàng", "Bạn có chắc muốn xóa toàn bộ sản phẩm trong giỏ hàng?", [
      { text: "Hủy", style: "cancel" },
      { text: "Xóa tất cả", style: "destructive", onPress: () => clearCart() },
    ]);
  };

  const groups = groupCartByVendor(items);

  if (items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyTopBar}>
          <Pressable onPress={() => router.back()} style={styles.iconBtn} hitSlop={6}>
            <MaterialIcons name="arrow-back" size={20} color={colors.onSurface} />
          </Pressable>
          <Text style={styles.emptyTopTitle}>Giỏ hàng</Text>
          <View style={{ width: 36 }} />
        </View>
        <EmptyState
          emoji="🛒"
          title="Giỏ hàng trống"
          description="Khám phá các sản phẩm nông sản tươi từ HTX đã xác minh"
        />
        <Pressable
          onPress={() => router.push("/(buyer)")}
          style={({ pressed }) => [styles.continueBtn, pressed && { transform: [{ scale: 0.98 }] }]}
        >
          <MaterialIcons name="storefront" size={18} color={colors.onPrimary} />
          <Text style={styles.continueText}>Tiếp tục mua hàng</Text>
        </Pressable>
      </View>
    );
  }

  const toggleItem = (productId: string) => {
    const newSet = new Set(selectedItems);
    if (newSet.has(productId)) {
      newSet.delete(productId);
    } else {
      newSet.add(productId);
    }
    setSelectedItems(newSet);
  };

  const selectedTotal = items
    .filter((i) => selectedItems.has(i.productId))
    .reduce((sum, i) => sum + i.amount, 0);

  return (
    <View style={styles.container}>
      {/* Top bar */}
      <View style={[styles.topBar, { paddingTop: Math.max(insets.top + 8, 12) }]}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn} hitSlop={6}>
          <MaterialIcons name="arrow-back" size={20} color={colors.onSurface} />
        </Pressable>
        <Text style={styles.topTitle}>
          Giỏ hàng ({items.length}) {syncing ? "•" : ""}
        </Text>
        <Pressable hitSlop={6} style={{ paddingHorizontal: 4 }} onPress={handleClearCart}>
          <Text style={styles.editText}>Xóa hết</Text>
        </Pressable>
      </View>

      {/* B2B Banner */}
      <View style={styles.b2bBanner}>
        <MaterialIcons name="verified-user" size={16} color={colors.tertiaryFixed} style={{ fontVariationSettings: "'FILL' 1" } as any} />
        <Text style={styles.b2bText}>THANH TOÁN TRƯỚC 100% • KHÔNG COD</Text>
        <Text style={styles.b2bContract}>Bảo hộ Escrow</Text>
      </View>

      {loading && items.length === 0 ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : null}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetchCart} tintColor={colors.primary} />
        }
      >
        {Object.entries(groups).map(([vendorId, vendorItems]) => (
          <View key={vendorId} style={styles.vendorCard}>
            <View style={styles.vendorHeader}>
              <View style={styles.vendorLeft}>
                <Pressable
                  style={[styles.checkbox, selectedItems.has(vendorItems[0].productId) && styles.checkboxActive]}
                  onPress={() => vendorItems.forEach((i) => toggleItem(i.productId))}
                >
                  {selectedItems.has(vendorItems[0].productId) && (
                    <MaterialIcons name="check" size={12} color={colors.onPrimary} />
                  )}
                </Pressable>
                <MaterialIcons name="storefront" size={18} color={colors.primaryContainer} />
                <Text style={styles.vendorName} numberOfLines={1}>
                  {vendorItems[0].vendorName}
                </Text>
                <MaterialIcons name="check-circle" size={14} color={colors.primaryContainer} style={{ fontVariationSettings: "'FILL' 1" } as any} />
              </View>
              <View style={styles.locationPill}>
                <MaterialIcons name="location-on" size={12} color={colors.onSurfaceVariant} />
                <Text style={styles.locationText}>
                  {vendorItems[0].vendorName.includes("Đà Lạt") ? "Lâm Đồng" : "Sóc Trăng"}
                </Text>
              </View>
            </View>

            <View style={styles.itemsList}>
              {vendorItems.map((item) => {
                const selected = selectedItems.has(item.productId);
                return (
                  <View key={item.productId} style={styles.itemRow}>
                    <View style={styles.itemTop}>
                      <Pressable
                        style={[styles.checkbox, selected && styles.checkboxActive]}
                        onPress={() => toggleItem(item.productId)}
                      >
                        {selected && <MaterialIcons name="check" size={12} color={colors.onPrimary} />}
                      </Pressable>
                      <View style={styles.itemImage}>
                        {item.imageUrl && resolveImageSource(item.imageUrl) ? (
                          <Image
                            source={resolveImageSource(item.imageUrl)}
                            style={{ width: "100%", height: "100%", borderRadius: borderRadius.md }}
                            resizeMode="cover"
                          />
                        ) : (
                          <Text style={styles.itemEmoji}>{item.image}</Text>
                        )}
                      </View>
                      <View style={styles.itemInfo}>
                        <Text style={styles.itemName} numberOfLines={2}>
                          {item.name}
                        </Text>
                        <Text style={styles.itemSubtitle}>
                          {item.unit} • Tối thiểu {item.minQty} {item.unit}
                          {item.availability === "PREORDER"
                            ? ` • Đặt trước (${item.preorderLeadDays ?? 7} ngày)`
                            : item.availability === "UNAVAILABLE"
                            ? " • Tạm hết hàng"
                            : ` • Sẵn kho (${item.available})`}
                        </Text>
                        {item.validationIssues && item.validationIssues.length > 0 ? (
                          <Text style={{ fontSize: 11, color: colors.error, marginTop: 2 }}>
                            {getIssueMessage(
                              item.validationIssues[0],
                              item.minQty,
                              item.available,
                              item.unit
                            )}
                          </Text>
                        ) : null}
                        <View style={styles.itemPriceRow}>
                          <Text style={styles.itemPrice}>{formatVND(item.unitPrice)}</Text>
                          <Text style={styles.itemUnit}>/{item.unit}</Text>
                        </View>
                      </View>
                    </View>
                    <View style={styles.itemActions}>
                      <Pressable style={styles.deleteBtn} onPress={() => handleRemove(item.productId, item.id)}>
                        <MaterialIcons name="delete" size={14} color={colors.error} />
                        <Text style={styles.deleteText}>Xóa</Text>
                      </Pressable>
                      <View style={styles.qtyControl}>
                        <Pressable
                          style={styles.qtyBtn}
                          onPress={() =>
                            handleQtyChange(
                              item.productId,
                              Math.max(item.minQty, item.qty - 1),
                              item.id
                            )
                          }
                        >
                          <Text style={styles.qtyBtnText}>−</Text>
                        </Pressable>
                        <Text style={styles.qtyValue}>{item.qty}</Text>
                        <Pressable
                          style={styles.qtyBtn}
                          onPress={() => handleQtyChange(item.productId, item.qty + 1, item.id)}
                        >
                          <Text style={styles.qtyBtnText}>+</Text>
                        </Pressable>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        ))}

        {/* Logistics Banner */}
        <View style={styles.logisticsBanner}>
          <View style={styles.logisticsIcon}>
            <MaterialIcons name="local-shipping" size={18} color={colors.onPrimary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.logisticsTitle}>Vận chuyển lạnh Logistics 24/7</Text>
            <Text style={styles.logisticsDesc}>
              Cam kết bồi hoàn 100% nếu dập nát khi nhận hàng
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Checkout Bar */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 8 }]}>
        <Pressable
          style={styles.selectAllRow}
          onPress={() => {
            if (selectedItems.size === items.length) {
              setSelectedItems(new Set());
            } else {
              setSelectedItems(new Set(items.map((i) => i.productId)));
            }
          }}
        >
          <View style={[styles.checkbox, selectedItems.size === items.length && styles.checkboxActive]}>
            {selectedItems.size === items.length && <MaterialIcons name="check" size={12} color={colors.onPrimary} />}
          </View>
          <Text style={styles.selectAllText}>Chọn tất cả ({selectedItems.size})</Text>
        </Pressable>
        <View style={styles.checkoutGroup}>
          <View>
            <Text style={styles.totalLabel}>Tạm tính</Text>
            <Text style={styles.totalValue}>{formatVND(selectedTotal)}</Text>
          </View>
          <Pressable
            style={({ pressed }) => [styles.checkoutBtn, pressed && { transform: [{ scale: 0.98 }] }]}
            onPress={handleCheckout}
          >
            <Text style={styles.checkoutText}>Tạo báo giá & Thanh toán</Text>
            <View style={styles.checkoutBadge}>
              <Text style={styles.checkoutBadgeText}>{selectedItems.size}</Text>
            </View>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  emptyContainer: { 
    flex: 1, 
    backgroundColor: colors.surface ,},
  emptyTopBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.gutter,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: colors.surfaceContainerLowest,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  emptyTopTitle: { fontSize: fontSize["headline-sm"], fontWeight: fontWeight.semibold, color: colors.onSurface },
  continueBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: colors.primaryContainer,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.xl,
    paddingVertical: 14,
    borderRadius: borderRadius.xl,
  },
  continueText: { color: colors.onPrimary, fontSize: fontSize["label-lg"], fontWeight: fontWeight.semibold },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.gutter,
    paddingVertical: 10,
    backgroundColor: colors.surfaceContainerLowest,
    ...shadows.sm,
    paddingTop:30
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceContainerLow,
    alignItems: "center",
    justifyContent: "center",
  },
  topTitle: { fontSize: fontSize["headline-sm"], fontWeight: fontWeight.semibold, color: colors.onSurface },
  editText: { color: colors.onPrimaryContainer, fontSize: fontSize["label-lg"], fontWeight: fontWeight.semibold },
  b2bBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primaryContainer,
    paddingHorizontal: spacing.gutter,
    paddingVertical: 8,
    gap: 8,
  },
  b2bText: {
    flex: 1,
    color: colors.surfaceBright,
    fontSize: 10,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.5,
  },
  b2bContract: { color: colors.primaryFixed, fontSize: 10, fontWeight: fontWeight.semibold },
  scroll: { padding: spacing.md, paddingBottom: 120, gap: spacing.md },
  vendorCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: borderRadius.xl,
    overflow: "hidden",
    ...shadows.sm,
  },
  vendorHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surfaceContainerLow,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  vendorLeft: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
  vendorName: { fontSize: fontSize["label-lg"], fontWeight: fontWeight.semibold, color: colors.onSurface, flex: 1 },
  locationPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.surfaceContainer,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  locationText: { fontSize: 10, color: colors.onSurfaceVariant, fontWeight: fontWeight.semibold },
  itemsList: { padding: spacing.md, gap: spacing.lg },
  itemRow: { gap: 8 },
  itemTop: { flexDirection: "row", gap: 8 },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  checkboxActive: { backgroundColor: colors.primaryContainer },
  itemImage: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.xl,
    overflow: "hidden",
    backgroundColor: colors.surfaceContainer,
    alignItems: "center",
    justifyContent: "center",
  },
  itemEmoji: { fontSize: 36 },
  itemInfo: { flex: 1, minWidth: 0 },
  itemName: { fontSize: fontSize["label-lg"], fontWeight: fontWeight.semibold, color: colors.onSurface, lineHeight: 18 },
  itemSubtitle: { fontSize: 10, color: colors.onSurfaceVariant, marginTop: 4 },
  itemPriceRow: { flexDirection: "row", alignItems: "baseline", gap: 2, marginTop: 4 },
  itemPrice: { fontSize: fontSize["price-unit"], color: colors.error, fontWeight: fontWeight.bold },
  itemUnit: { fontSize: fontSize["price-unit"], color: colors.onSurfaceVariant, fontWeight: fontWeight.medium },
  itemActions: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingLeft: 28 },
  deleteBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  deleteText: { fontSize: fontSize["label-md"], color: colors.error, fontWeight: fontWeight.semibold },
  qtyControl: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 8,
    padding: 2,
    ...shadows.sm,
  },
  qtyBtn: { width: 28, height: 28, alignItems: "center", justifyContent: "center", borderRadius: 6 },
  qtyBtnText: { fontSize: 18, fontWeight: fontWeight.bold, color: colors.onSurface },
  qtyValue: {
    width: 32,
    textAlign: "center",
    fontSize: fontSize["label-md"],
    color: colors.onSurface,
    fontWeight: fontWeight.semibold,
  },
  logisticsBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    gap: spacing.md,
    marginTop: 4,
  },
  logisticsIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryContainer,
    alignItems: "center",
    justifyContent: "center",
  },
  logisticsTitle: { fontSize: fontSize["label-md"], color: colors.onSurface, fontWeight: fontWeight.semibold },
  logisticsDesc: { fontSize: fontSize["body-sm"], color: colors.onSurfaceVariant, marginTop: 2 },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surfaceContainerLowest,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.gutter,
    paddingTop: 12,
    ...shadows.xl,
    shadowOffset: { width: 0, height: -4 },
  },
  selectAllRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  selectAllText: { fontSize: fontSize["label-md"], color: colors.onSurface, fontWeight: fontWeight.medium },
  checkoutGroup: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  totalLabel: { fontSize: 10, color: colors.onSurfaceVariant, textAlign: "right" },
  totalValue: { fontSize: fontSize["label-lg"], color: colors.error, fontWeight: fontWeight.bold },
  checkoutBtn: {
    backgroundColor: colors.primaryContainer,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: borderRadius.xl,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    ...shadows.md,
  },
  checkoutText: { color: colors.onPrimary, fontSize: fontSize["label-lg"], fontWeight: fontWeight.semibold },
  checkoutBadge: {
    backgroundColor: colors.primaryFixed,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 9999,
  },
  checkoutBadgeText: { color: colors.onPrimaryFixed, fontSize: 10, fontWeight: fontWeight.bold },
});

