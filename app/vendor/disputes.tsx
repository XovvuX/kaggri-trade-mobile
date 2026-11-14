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

interface VendorDisputeCase {
  id: string;
  orderId: string;
  buyerName: string;
  productName: string;
  claimAmount: number;
  issueSummary: string;
  status: "open" | "resolved_refund" | "resolved_rejected";
  vendorReply?: string;
}

const INITIAL_CASES: VendorDisputeCase[] = [
  {
    id: "VD-2026-01",
    orderId: "PO-20260917-8831",
    buyerName: "Chuỗi Siêu thị Bách Hóa Xanh",
    productName: "Bắp cải sạch Đà Lạt VietGAP (25 kg)",
    claimAmount: 420000,
    issueSummary: "Nông sản bị dập nát ở lớp đáy thùng khi vận chuyển xe lạnh.",
    status: "open",
  },
  {
    id: "VD-2026-02",
    orderId: "PO-20260910-4412",
    buyerName: "Nhà hàng An Nhiên",
    productName: "Cà chua Beef Đà Lạt loại 1 (12 kg)",
    claimAmount: 456000,
    issueSummary: "Thiếu 1 khay 12kg so với phiếu xuất kho.",
    status: "resolved_refund",
    vendorReply: "HTX xác nhận thiếu khay khi bốc xếp và đồng ý đối trừ đơn sau.",
  },
];

export default function VendorDisputesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [cases, setCases] = useState<VendorDisputeCase[]>(INITIAL_CASES);
  const [replyOpen, setReplyOpen] = useState(false);
  const [selected, setSelected] = useState<VendorDisputeCase | null>(null);
  const [replyMessage, setReplyMessage] = useState(
    "Trang trại đồng ý bồi hoàn phần hư hỏng do vận chuyển xe lạnh."
  );
  const [acceptRefund, setAcceptRefund] = useState(true);

  const openReply = (item: VendorDisputeCase) => {
    setSelected(item);
    setReplyMessage(
      "Trang trại đồng ý bồi hoàn phần hư hỏng do vận chuyển xe lạnh."
    );
    setAcceptRefund(true);
    setReplyOpen(true);
  };

  const submitReply = () => {
    if (!selected || !replyMessage.trim()) {
      Alert.alert("Thiếu nội dung", "Vui lòng nhập nội dung phản hồi.");
      return;
    }
    setCases((prev) =>
      prev.map((c) =>
        c.id === selected.id
          ? {
              ...c,
              status: acceptRefund ? "resolved_refund" : "resolved_rejected",
              vendorReply: replyMessage.trim(),
            }
          : c
      )
    );
    setReplyOpen(false);
    setSelected(null);
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <Header
        eyebrow="XỬ LÝ KHIẾU NẠI"
        title="Tranh chấp & Bồi hoàn"
        subtitle="Phản hồi khiếu nại hàng hóa từ người mua và xác nhận bồi hoàn."
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
            Dữ liệu mô phỏng cục bộ — Tranh chấp Vendor đang chờ API Backend.
          </Text>
        </View>

        {cases.map((item) => {
          const badgeStatus =
            item.status === "open"
              ? "PENDING_REVIEW"
              : item.status === "resolved_refund"
              ? "APPROVED"
              : "REJECTED";
          const badgeLabel =
            item.status === "open"
              ? "Cần phản hồi"
              : item.status === "resolved_refund"
              ? "Đã đồng ý bồi hoàn"
              : "Đã từ chối";
          return (
            <View key={item.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.codeText}>
                    {item.id} · Đơn {item.orderId}
                  </Text>
                  <Text style={styles.cardTitle}>{item.productName}</Text>
                  <Text style={styles.buyerText}>{item.buyerName}</Text>
                </View>
                <StatusBadge status={badgeStatus} label={badgeLabel} />
              </View>

              <Text style={styles.metaText}>
                Giá trị yêu cầu bồi hoàn:{" "}
                <Text style={[styles.metaStrong, { color: colors.danger }]}>
                  {formatVND(item.claimAmount)}
                </Text>
              </Text>
              <Text style={styles.descText}>{item.issueSummary}</Text>

              {item.vendorReply ? (
                <View style={styles.replyBox}>
                  <Text style={styles.replyLabel}>Phản hồi của nhà cung cấp:</Text>
                  <Text style={styles.replyText}>{item.vendorReply}</Text>
                </View>
              ) : (
                <Pressable onPress={() => openReply(item)} style={styles.primaryBtn}>
                  <Text style={styles.primaryBtnText}>Phản hồi khiếu nại</Text>
                </Pressable>
              )}
            </View>
          );
        })}
      </ScrollView>

      <Modal
        visible={replyOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setReplyOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.modalTitle}>Phản hồi tranh chấp</Text>
              <Pressable onPress={() => setReplyOpen(false)} hitSlop={8}>
                <MaterialIcons name="close" size={20} color={colors.muted} />
              </Pressable>
            </View>

            <View style={styles.toggleRow}>
              <Pressable
                onPress={() => setAcceptRefund(true)}
                style={[styles.toggleBtn, acceptRefund && styles.toggleBtnActive]}
              >
                <Text
                  style={[
                    styles.toggleText,
                    acceptRefund && styles.toggleTextActive,
                  ]}
                >
                  Đồng ý bồi hoàn
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setAcceptRefund(false)}
                style={[
                  styles.toggleBtn,
                  !acceptRefund && styles.toggleBtnDangerActive,
                ]}
              >
                <Text
                  style={[
                    styles.toggleText,
                    !acceptRefund && styles.toggleTextDangerActive,
                  ]}
                >
                  Không đồng ý
                </Text>
              </Pressable>
            </View>

            <Input
              label="Nội dung phản hồi"
              value={replyMessage}
              onChangeText={setReplyMessage}
              multiline
            />

            <Pressable onPress={submitReply} style={styles.primaryBtn}>
              <Text style={styles.primaryBtnText}>Gửi phản hồi</Text>
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
  metaStrong: { fontWeight: fontWeight.bold },
  descText: { fontSize: 12.5, color: colors.text, lineHeight: 18 },
  replyBox: {
    backgroundColor: colors.bg,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 10,
    gap: 3,
  },
  replyLabel: { fontSize: 11, fontWeight: fontWeight.bold, color: colors.green },
  replyText: { fontSize: 12, color: colors.dark, lineHeight: 17 },
  primaryBtn: {
    backgroundColor: colors.green,
    borderRadius: borderRadius.md,
    paddingVertical: 11,
    alignItems: "center",
  },
  primaryBtnText: { fontSize: 13, fontWeight: fontWeight.bold, color: colors.white },
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
  toggleRow: { flexDirection: "row", gap: 8 },
  toggleBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: "center",
    backgroundColor: colors.bg,
  },
  toggleBtnActive: { borderColor: colors.green, backgroundColor: colors.greenSoft },
  toggleBtnDangerActive: {
    borderColor: colors.danger,
    backgroundColor: colors.badgeRedBg,
  },
  toggleText: { fontSize: 12, fontWeight: fontWeight.bold, color: colors.muted },
  toggleTextActive: { color: colors.green },
  toggleTextDangerActive: { color: colors.danger },
});
