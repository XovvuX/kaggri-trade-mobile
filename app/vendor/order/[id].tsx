import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { colors, fontSize, fontWeight, spacing, borderRadius, shadows } from "@/theme";
import { vendorOrderService, formatSaleUnit } from "@/services";
import type { KaggriVendorOrder } from "@/services/api";
import {
  formatVND,
  formatDateTime,
  getVendorOrderStatusText,
  getStatusChipColor,
} from "@/utils";

export default function VendorOrderDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id?: string }>();

  const [order, setOrder] = useState<KaggriVendorOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Confirm / Reject Preorder Modals
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [estimatedDate, setEstimatedDate] = useState(
    new Date(Date.now() + 3 * 86400_000).toISOString().split("T")[0]
  );
  const [vendorNote, setVendorNote] = useState("");

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const loadOrder = useCallback(async () => {
    if (!id) {
      setError("Không tìm thấy mã đơn hàng.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await vendorOrderService.getById(id);
      setOrder(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải chi tiết đơn hàng.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  const runAction = async (fn: () => Promise<KaggriVendorOrder>, successMsg: string) => {
    setActionLoading(true);
    try {
      const updated = await fn();
      setOrder(updated);
      Alert.alert("Thành công", successMsg);
    } catch (err) {
      Alert.alert("Thao tác thất bại", err instanceof Error ? err.message : "Vui lòng thử lại.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmPreorder = async () => {
    if (!order) return;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(estimatedDate.trim())) {
      Alert.alert("Ngày không hợp lệ", "Vui lòng nhập ngày dự kiến theo định dạng YYYY-MM-DD.");
      return;
    }
    const iso = `${estimatedDate.trim()}T08:00:00Z`;
    setShowConfirmModal(false);
    await runAction(
      () =>
        vendorOrderService.confirmPreorder(order.id, {
          estimatedReadyAt: iso,
          vendorNote: vendorNote.trim() || undefined,
        }),
      "Đã xác nhận nguồn cung cho đơn đặt trước."
    );
  };

  const handleRejectPreorder = async () => {
    if (!order) return;
    if (!rejectReason.trim()) {
      Alert.alert("Thiếu lý do", "Vui lòng nhập lý do từ chối đơn hàng.");
      return;
    }
    setShowRejectModal(false);
    await runAction(
      () => vendorOrderService.rejectPreorder(order.id, rejectReason.trim()),
      "Đã từ chối đơn đặt trước."
    );
  };

  const chipColor = order ? getStatusChipColor(order.status) : colors.primary;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top + 8, 12) }]}>
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.replace("/(vendor)/orders"))}
          style={styles.iconBtn}
          hitSlop={6}
        >
          <MaterialIcons name="arrow-back" size={22} color={colors.onPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>
          {order ? `Đơn #${order.orderNumber}` : "Chi tiết đơn Vendor"}
        </Text>
        <Pressable onPress={loadOrder} style={styles.iconBtn} hitSlop={6}>
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
          <Pressable style={styles.primaryBtn} onPress={loadOrder}>
            <Text style={styles.primaryBtnText}>Thử lại</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
            {/* Status Card */}
            <View style={styles.statusCard}>
              <View style={[styles.statusPill, { backgroundColor: `${chipColor}20` }]}>
                <Text style={[styles.statusPillText, { color: chipColor }]}>
                  {getVendorOrderStatusText(order.status)}
                </Text>
              </View>
              <Text style={styles.voTitle}>Đơn con #{order.orderNumber}</Text>
              <Text style={styles.voPrivacyNote}>
                Thông tin cá nhân người mua được ẩn theo chính sách bảo mật nền tảng.
              </Text>
              {order.estimatedReadyAt ? (
                <Text style={styles.metaText}>
                  Dự kiến sẵn sàng: {formatDateTime(order.estimatedReadyAt)}
                </Text>
              ) : null}
              {order.vendorNote ? (
                <Text style={styles.metaText}>Ghi chú NCC: {order.vendorNote}</Text>
              ) : null}
              {order.rejectionReason ? (
                <Text style={[styles.metaText, { color: colors.error }]}>
                  Lý do từ chối: {order.rejectionReason}
                </Text>
              ) : null}
            </View>

            {/* Items */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Sản phẩm trong đơn ({order.items.length})</Text>
              {order.items.map((item) => (
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
            </View>

            {/* Totals */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Giá trị đơn hàng</Text>
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
                <Text style={styles.grandLabel}>Tổng cộng</Text>
                <Text style={styles.grandVal}>{formatVND(order.totalVnd)}</Text>
              </View>
            </View>
          </ScrollView>

          {/* Bottom Actions based on VendorOrderStatus */}
          {(order.status === "AWAITING_CONFIRMATION" ||
            order.status === "PAID" ||
            order.status === "PREPARING") && (
            <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom + 8, 12) }]}>
              {order.status === "AWAITING_CONFIRMATION" ? (
                <>
                  <Pressable
                    style={styles.rejectBtn}
                    disabled={actionLoading}
                    onPress={() => setShowRejectModal(true)}
                  >
                    <Text style={styles.rejectBtnText}>Từ chối</Text>
                  </Pressable>
                  <Pressable
                    style={styles.acceptBtn}
                    disabled={actionLoading}
                    onPress={() => setShowConfirmModal(true)}
                  >
                    <Text style={styles.acceptBtnText}>Xác nhận nguồn cung</Text>
                  </Pressable>
                </>
              ) : null}

              {order.status === "PAID" ? (
                <Pressable
                  style={styles.acceptBtn}
                  disabled={actionLoading}
                  onPress={() =>
                    runAction(
                      () => vendorOrderService.prepare(order.id),
                      "Đã chuyển đơn sang trạng thái Đang chuẩn bị hàng."
                    )
                  }
                >
                  {actionLoading ? (
                    <ActivityIndicator size="small" color={colors.onPrimary} />
                  ) : (
                    <Text style={styles.acceptBtnText}>Bắt đầu chuẩn bị hàng</Text>
                  )}
                </Pressable>
              ) : null}

              {order.status === "PREPARING" ? (
                <>
                  <Pressable
                    style={styles.secondaryBtn}
                    disabled={actionLoading}
                    onPress={() =>
                      runAction(
                        () => vendorOrderService.allocateStock(order.id),
                        "Đã phân bổ tồn kho thực tế cho đơn hàng."
                      )
                    }
                  >
                    <Text style={styles.secondaryBtnText}>Phân bổ kho</Text>
                  </Pressable>
                  <Pressable
                    style={styles.acceptBtn}
                    disabled={actionLoading}
                    onPress={() =>
                      runAction(
                        () => vendorOrderService.readyToShip(order.id),
                        "Đơn hàng đã sẵn sàng bàn giao vận chuyển."
                      )
                    }
                  >
                    {actionLoading ? (
                      <ActivityIndicator size="small" color={colors.onPrimary} />
                    ) : (
                      <Text style={styles.acceptBtnText}>Sẵn sàng giao</Text>
                    )}
                  </Pressable>
                </>
              ) : null}
            </View>
          )}
        </>
      )}

      {/* Confirm Preorder Modal */}
      <Modal visible={showConfirmModal} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Xác nhận nguồn cung Preorder</Text>
            <Text style={styles.modalLabel}>Ngày dự kiến có hàng (YYYY-MM-DD) *</Text>
            <TextInput
              style={styles.modalInput}
              value={estimatedDate}
              onChangeText={setEstimatedDate}
              placeholder="2026-11-20"
            />
            <Text style={styles.modalLabel}>Ghi chú thêm (tùy chọn)</Text>
            <TextInput
              style={[styles.modalInput, { height: 70, textAlignVertical: "top" }]}
              multiline
              value={vendorNote}
              onChangeText={setVendorNote}
              placeholder="Ví dụ: Thu hoạch sáng sớm..."
            />
            <View style={styles.modalActions}>
              <Pressable style={styles.modalCancel} onPress={() => setShowConfirmModal(false)}>
                <Text style={styles.modalCancelText}>Hủy</Text>
              </Pressable>
              <Pressable style={styles.modalConfirm} onPress={handleConfirmPreorder}>
                <Text style={styles.modalConfirmText}>Xác nhận</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Reject Preorder Modal */}
      <Modal visible={showRejectModal} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Từ chối đơn đặt trước</Text>
            <Text style={styles.modalLabel}>Lý do từ chối *</Text>
            <TextInput
              style={[styles.modalInput, { height: 84, textAlignVertical: "top" }]}
              multiline
              value={rejectReason}
              onChangeText={setRejectReason}
              placeholder="Nhập lý do không đủ nguồn cung..."
            />
            <View style={styles.modalActions}>
              <Pressable style={styles.modalCancel} onPress={() => setShowRejectModal(false)}>
                <Text style={styles.modalCancelText}>Đóng</Text>
              </Pressable>
              <Pressable
                style={[styles.modalConfirm, { backgroundColor: colors.error }]}
                onPress={handleRejectPreorder}
              >
                <Text style={styles.modalConfirmText}>Xác nhận từ chối</Text>
              </Pressable>
            </View>
          </View>
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
    backgroundColor: colors.panel,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: 6,
    ...shadows.sm,
  },
  statusPill: { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  statusPillText: { fontSize: 11, fontWeight: fontWeight.bold },
  voTitle: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.onSurface },
  voPrivacyNote: { fontSize: 11, color: colors.onSurfaceVariant, fontStyle: "italic" },
  metaText: { fontSize: fontSize.xs, color: colors.onSurface },
  card: {
    backgroundColor: colors.panel,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: 8,
    ...shadows.sm,
  },
  cardTitle: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: colors.onSurface },
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
  rejectBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.error,
    paddingVertical: 12,
    borderRadius: borderRadius.lg,
    alignItems: "center",
  },
  rejectBtnText: { color: colors.error, fontWeight: fontWeight.bold, fontSize: fontSize.sm },
  secondaryBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingVertical: 12,
    borderRadius: borderRadius.lg,
    alignItems: "center",
  },
  secondaryBtnText: { color: colors.primary, fontWeight: fontWeight.bold, fontSize: fontSize.sm },
  acceptBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: borderRadius.lg,
    alignItems: "center",
  },
  acceptBtnText: { color: colors.onPrimary, fontWeight: fontWeight.bold, fontSize: fontSize.sm },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    padding: spacing.lg,
  },
  modalCard: {
    backgroundColor: colors.panel,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: 10,
  },
  modalTitle: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.onSurface },
  modalLabel: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold, color: colors.onSurfaceVariant },
  modalInput: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: borderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: fontSize.sm,
    color: colors.onSurface,
  },
  modalActions: { flexDirection: "row", gap: 10, marginTop: 6 },
  modalCancel: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.line,
    paddingVertical: 10,
    borderRadius: borderRadius.md,
    alignItems: "center",
  },
  modalCancelText: { color: colors.onSurface, fontWeight: fontWeight.semibold, fontSize: fontSize.sm },
  modalConfirm: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: 10,
    borderRadius: borderRadius.md,
    alignItems: "center",
  },
  modalConfirmText: { color: colors.onPrimary, fontWeight: fontWeight.bold, fontSize: fontSize.sm },
});
