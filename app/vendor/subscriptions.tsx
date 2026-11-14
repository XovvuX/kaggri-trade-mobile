import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import {
  colors,
  fontWeight,
  spacing,
  borderRadius,
  serifFont,
} from "@/theme";
import { Header } from "@/components/Header";
import { Input } from "@/components/Input";
import { StatusBadge } from "@/components/StatusBadge";
import { formatVND } from "@/utils";

interface VendorSubscriptionProposal {
  id: string;
  buyerName: string;
  productName: string;
  frequency: string;
  quantityPerDelivery: number;
  unit: string;
  unitPrice: number;
  status: "pending" | "accepted" | "rejected" | "counter_proposed";
  notes?: string;
}

const INITIAL_PROPOSALS: VendorSubscriptionProposal[] = [
  {
    id: "PROP-01",
    buyerName: "Chuỗi Siêu thị Bách Hóa Xanh",
    productName: "Bắp cải sạch Đà Lạt VietGAP",
    frequency: "Thứ 2 & Thứ 5 hàng tuần",
    quantityPerDelivery: 300,
    unit: "kg",
    unitPrice: 16800,
    status: "pending",
    notes: "Yêu cầu giao xe lạnh 04:00 - 06:00 sáng.",
  },
  {
    id: "PROP-02",
    buyerName: "Bếp ăn Công nghiệp Khu CNC Quận 9",
    productName: "Khoai tây Đà Lạt loại 1",
    frequency: "Thứ 6 hàng tuần",
    quantityPerDelivery: 500,
    unit: "kg",
    unitPrice: 22000,
    status: "accepted",
    notes: "Bao tải lưới 25kg.",
  },
];

const STATUS_BADGE: Record<
  VendorSubscriptionProposal["status"],
  { status: "PENDING_REVIEW" | "ACCEPTED" | "REJECTED"; label: string }
> = {
  pending: { status: "PENDING_REVIEW", label: "Chờ phản hồi" },
  accepted: { status: "ACCEPTED", label: "Đã chấp nhận" },
  rejected: { status: "REJECTED", label: "Đã từ chối" },
  counter_proposed: { status: "PENDING_REVIEW", label: "Đã đề xuất lại giá" },
};

export default function VendorSubscriptionsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [proposals, setProposals] =
    useState<VendorSubscriptionProposal[]>(INITIAL_PROPOSALS);
  const [counterModalOpen, setCounterModalOpen] = useState(false);
  const [selected, setSelected] = useState<VendorSubscriptionProposal | null>(
    null
  );
  const [proposedPrice, setProposedPrice] = useState("");
  const [proposedNotes, setProposedNotes] = useState("");

  const updateStatus = (
    id: string,
    status: VendorSubscriptionProposal["status"],
    newPrice?: number,
    notes?: string
  ) => {
    setProposals((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status,
              unitPrice: newPrice ?? item.unitPrice,
              notes: notes ?? item.notes,
            }
          : item
      )
    );
  };

  const openCounter = (item: VendorSubscriptionProposal) => {
    setSelected(item);
    setProposedPrice(String(item.unitPrice + 1000));
    setProposedNotes("Đề xuất điều chỉnh giá do chi phí vận chuyển lạnh.");
    setCounterModalOpen(true);
  };

  const submitCounter = () => {
    if (!selected) return;
    const price = Number(proposedPrice);
    if (!Number.isFinite(price) || price <= 0) {
      Alert.alert("Giá không hợp lệ", "Vui lòng nhập đơn giá đề xuất.");
      return;
    }
    updateStatus(selected.id, "counter_proposed", price, proposedNotes.trim());
    setCounterModalOpen(false);
    setSelected(null);
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <Header
        eyebrow="HỢP TÁC DÀI HẠN"
        title="Đề xuất đơn định kỳ"
        subtitle="Phê duyệt hoặc đề xuất lại giá cho các lịch thu mua lặp lại từ khách sỉ."
        leftIcon="arrow-back"
        onLeftPress={() => router.back()}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.mockBanner}>
          <MaterialIcons name="info-outline" size={16} color="#8c6320" />
          <Text style={styles.mockBannerText}>
            Dữ liệu mô phỏng cục bộ — Đề xuất đơn định kỳ đang chờ API Backend.
          </Text>
        </View>

        {proposals.map((item) => {
          const badge = STATUS_BADGE[item.status];
          return (
            <View key={item.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.codeText}>{item.id}</Text>
                  <Text style={styles.cardTitle}>{item.productName}</Text>
                  <Text style={styles.buyerText}>{item.buyerName}</Text>
                </View>
                <StatusBadge status={badge.status} label={badge.label} />
              </View>

              <Text style={styles.metaText}>
                Chu kỳ: <Text style={styles.metaStrong}>{item.frequency}</Text>
              </Text>
              <Text style={styles.metaText}>
                Sản lượng:{" "}
                <Text style={styles.metaStrong}>
                  {item.quantityPerDelivery} {item.unit}/chuyến
                </Text>{" "}
                · Đơn giá:{" "}
                <Text style={[styles.metaStrong, { color: colors.green }]}>
                  {formatVND(item.unitPrice)}/{item.unit}
                </Text>
              </Text>
              {item.notes ? <Text style={styles.notesText}>{item.notes}</Text> : null}

              {item.status === "pending" && (
                <View style={styles.actionRow}>
                  <Pressable
                    onPress={() => updateStatus(item.id, "accepted")}
                    style={styles.acceptBtn}
                  >
                    <Text style={styles.acceptBtnText}>Chấp nhận</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => openCounter(item)}
                    style={styles.outlineBtn}
                  >
                    <Text style={styles.outlineBtnText}>Đề xuất giá</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => updateStatus(item.id, "rejected")}
                    style={styles.dangerOutlineBtn}
                  >
                    <Text style={styles.dangerOutlineText}>Từ chối</Text>
                  </Pressable>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      <Modal
        visible={counterModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setCounterModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.modalTitle}>Đề xuất lại đơn giá</Text>
              <Pressable onPress={() => setCounterModalOpen(false)} hitSlop={8}>
                <MaterialIcons name="close" size={20} color={colors.muted} />
              </Pressable>
            </View>
            <Input
              label="Đơn giá đề xuất (VNĐ/kg)"
              value={proposedPrice}
              onChangeText={setProposedPrice}
              keyboardType="numeric"
            />
            <Input
              label="Ghi chú gửi người mua"
              value={proposedNotes}
              onChangeText={setProposedNotes}
              multiline
            />
            <Pressable onPress={submitCounter} style={styles.acceptBtn}>
              <Text style={styles.acceptBtnText}>Gửi đề xuất lại</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scrollContent: { padding: spacing.gutter, gap: 12 },
  mockBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.badgeAmberBg,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: "#eadcc3",
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  mockBannerText: {
    flex: 1,
    fontSize: 11.5,
    color: colors.badgeAmberText,
    fontWeight: fontWeight.semibold,
  },
  card: {
    backgroundColor: colors.panel,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 14,
    gap: 8,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  },
  codeText: { fontSize: 11, fontWeight: fontWeight.bold, color: colors.eyebrow },
  cardTitle: { fontFamily: serifFont, fontSize: 16, color: colors.dark, marginTop: 2 },
  buyerText: { fontSize: 12, color: colors.green, marginTop: 2 },
  metaText: { fontSize: 12, color: colors.muted },
  metaStrong: { color: colors.dark, fontWeight: fontWeight.semibold },
  notesText: { fontSize: 12, color: colors.text, lineHeight: 17 },
  actionRow: { flexDirection: "row", gap: 6, marginTop: 4 },
  acceptBtn: {
    flex: 1,
    backgroundColor: colors.green,
    borderRadius: borderRadius.md,
    paddingVertical: 10,
    alignItems: "center",
  },
  acceptBtnText: { fontSize: 12, fontWeight: fontWeight.bold, color: colors.white },
  outlineBtn: {
    flex: 1,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.green,
    paddingVertical: 10,
    alignItems: "center",
  },
  outlineBtnText: { fontSize: 12, fontWeight: fontWeight.bold, color: colors.green },
  dangerOutlineBtn: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: "#ebcfc6",
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: "center",
  },
  dangerOutlineText: { fontSize: 12, fontWeight: fontWeight.bold, color: colors.danger },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(18, 28, 22, 0.45)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: colors.panel,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: 18,
    gap: 12,
  },
  modalTitle: { fontFamily: serifFont, fontSize: 18, color: colors.dark },
});
