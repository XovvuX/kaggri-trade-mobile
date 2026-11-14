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

interface DisputeItem {
  id: string;
  orderId: string;
  productName: string;
  affectedQty: number;
  unit: string;
  issueType: "damaged" | "spoiled" | "missing" | "quality_unmet" | "wrong_item";
  issueLabel: string;
  requestedSolution: "refund_partial" | "refund_full" | "redelivery" | "credit";
  solutionLabel: string;
  description: string;
  status: "pending" | "completed" | "cancelled";
  statusLabel: string;
  createdAt: string;
}

const ISSUE_OPTIONS: Array<{ key: DisputeItem["issueType"]; label: string }> = [
  { key: "damaged", label: "Nông sản bị dập nát do vận chuyển" },
  { key: "spoiled", label: "Hư hỏng do nhiệt độ bảo quản" },
  { key: "missing", label: "Thiếu hụt số lượng so với phiếu cân" },
  { key: "quality_unmet", label: "Không đạt chuẩn VietGAP công bố" },
  { key: "wrong_item", label: "Giao sai quy cách / chủng loại" },
];

const SOLUTION_OPTIONS: Array<{
  key: DisputeItem["requestedSolution"];
  label: string;
}> = [
  { key: "refund_partial", label: "Hoàn tiền phần hàng bị ảnh hưởng" },
  { key: "refund_full", label: "Hoàn tiền toàn bộ mặt hàng" },
  { key: "redelivery", label: "Giao bù vào chuyến xe kế tiếp" },
  { key: "credit", label: "Đối trừ công nợ đơn sau" },
];

const INITIAL_DISPUTES: DisputeItem[] = [
  {
    id: "KN-2026-001",
    orderId: "PO-20260917-8831",
    productName: "Bắp cải sạch Đà Lạt VietGAP",
    affectedQty: 25,
    unit: "kg",
    issueType: "damaged",
    issueLabel: "Nông sản bị dập nát do vận chuyển",
    requestedSolution: "refund_partial",
    solutionLabel: "Hoàn tiền phần hàng bị ảnh hưởng",
    description:
      "Khoảng 25kg bắp cải ở lớp đáy thùng bị dập nát do xếp chồng quá tải trong xe tải lạnh.",
    status: "pending",
    statusLabel: "Đang chờ HTX phản hồi",
    createdAt: "12/11/2026 08:30",
  },
  {
    id: "KN-2026-002",
    orderId: "PO-20260910-4412",
    productName: "Cà chua Beef Đà Lạt loại 1",
    affectedQty: 12,
    unit: "kg",
    issueType: "missing",
    issueLabel: "Thiếu hụt số lượng so với phiếu cân",
    requestedSolution: "credit",
    solutionLabel: "Đối trừ công nợ đơn sau",
    description: "Thiếu 1 khay 12kg khi kiểm đếm tại kho nhận Bình Tân.",
    status: "completed",
    statusLabel: "Đã thống nhất đối trừ",
    createdAt: "06/11/2026 14:15",
  },
];

export default function BuyerDisputeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [disputes, setDisputes] = useState<DisputeItem[]>(INITIAL_DISPUTES);
  const [modalOpen, setModalOpen] = useState(false);

  const [orderId, setOrderId] = useState("PO-20260917-8831");
  const [productName, setProductName] = useState("Bắp cải sạch Đà Lạt VietGAP");
  const [affectedQty, setAffectedQty] = useState("20");
  const [unit, setUnit] = useState("kg");
  const [issueType, setIssueType] = useState<DisputeItem["issueType"]>("damaged");
  const [requestedSolution, setRequestedSolution] =
    useState<DisputeItem["requestedSolution"]>("refund_partial");
  const [description, setDescription] = useState("");

  const handleSubmit = () => {
    if (!orderId.trim() || !productName.trim() || !description.trim()) {
      Alert.alert(
        "Thiếu thông tin",
        "Vui lòng nhập mã đơn hàng, tên sản phẩm và mô tả sự cố."
      );
      return;
    }
    const qty = Number(affectedQty) || 1;
    const issueLabel =
      ISSUE_OPTIONS.find((i) => i.key === issueType)?.label || "";
    const solutionLabel =
      SOLUTION_OPTIONS.find((s) => s.key === requestedSolution)?.label || "";

    const created: DisputeItem = {
      id: `KN-${Date.now().toString().slice(-6)}`,
      orderId: orderId.trim(),
      productName: productName.trim(),
      affectedQty: qty,
      unit: unit.trim() || "kg",
      issueType,
      issueLabel,
      requestedSolution,
      solutionLabel,
      description: description.trim(),
      status: "pending",
      statusLabel: "Đang chờ HTX phản hồi",
      createdAt: new Date().toLocaleString("vi-VN"),
    };
    setDisputes((prev) => [created, ...prev]);
    setDescription("");
    setModalOpen(false);
    Alert.alert("Đã tạo khiếu nại", `Mã khiếu nại ${created.id} đã được ghi nhận cục bộ.`);
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <Header
        eyebrow="HẬU MÃI & ĐỐI SOÁT"
        title="Khiếu nại & Tranh chấp"
        subtitle="Gửi yêu cầu xử lý sự cố hàng hóa và theo dõi phản hồi nhà cung cấp."
        leftIcon="arrow-back"
        onLeftPress={() => router.back()}
        rightActions={[{ icon: "add", onPress: () => setModalOpen(true) }]}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.mockBanner}>
          <MaterialIcons name="info-outline" size={16} color="#8c6320" />
          <Text style={styles.mockBannerText}>
            Dữ liệu mô phỏng cục bộ — phân hệ Khiếu nại đang chờ tích hợp API Backend.
          </Text>
        </View>

        <Pressable onPress={() => setModalOpen(true)} style={styles.primaryBtn}>
          <MaterialIcons name="report-problem" size={16} color={colors.white} />
          <Text style={styles.primaryBtnText}>Tạo yêu cầu khiếu nại mới</Text>
        </Pressable>

        {disputes.map((item) => (
          <View key={item.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.codeText}>
                  {item.id} · Đơn {item.orderId}
                </Text>
                <Text style={styles.cardTitle}>{item.productName}</Text>
              </View>
              <StatusBadge status={item.status} label={item.statusLabel} />
            </View>

            <View style={styles.metaGrid}>
              <Text style={styles.metaText}>
                Số lượng ảnh hưởng:{" "}
                <Text style={styles.metaStrong}>
                  {item.affectedQty} {item.unit}
                </Text>
              </Text>
              <Text style={styles.metaText}>
                Vấn đề: <Text style={styles.metaStrong}>{item.issueLabel}</Text>
              </Text>
              <Text style={styles.metaText}>
                Đề xuất xử lý:{" "}
                <Text style={styles.metaStrong}>{item.solutionLabel}</Text>
              </Text>
            </View>

            <Text style={styles.descText}>{item.description}</Text>
            <Text style={styles.timeText}>Gửi lúc: {item.createdAt}</Text>
          </View>
        ))}
      </ScrollView>

      <Modal
        visible={modalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.modalTitle}>Gửi khiếu nại mới</Text>
              <Pressable onPress={() => setModalOpen(false)} hitSlop={8}>
                <MaterialIcons name="close" size={20} color={colors.muted} />
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ gap: 12, paddingBottom: 16 }}
            >
              <Input
                label="Mã đơn hàng"
                value={orderId}
                onChangeText={setOrderId}
                placeholder="PO-20260917-8831"
              />
              <Input
                label="Tên sản phẩm"
                value={productName}
                onChangeText={setProductName}
                placeholder="Nhập tên nông sản bị ảnh hưởng"
              />
              <View style={styles.twoCol}>
                <View style={{ flex: 1 }}>
                  <Input
                    label="Số lượng ảnh hưởng"
                    value={affectedQty}
                    onChangeText={setAffectedQty}
                    keyboardType="numeric"
                  />
                </View>
                <View style={{ width: 90 }}>
                  <Input label="Đơn vị" value={unit} onChangeText={setUnit} />
                </View>
              </View>

              <Text style={styles.fieldLabel}>Loại sự cố</Text>
              <View style={styles.chipWrap}>
                {ISSUE_OPTIONS.map((opt) => {
                  const active = issueType === opt.key;
                  return (
                    <Pressable
                      key={opt.key}
                      onPress={() => setIssueType(opt.key)}
                      style={[styles.chip, active && styles.chipActive]}
                    >
                      <Text
                        style={[styles.chipText, active && styles.chipTextActive]}
                      >
                        {opt.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={styles.fieldLabel}>Hướng giải quyết mong muốn</Text>
              <View style={styles.chipWrap}>
                {SOLUTION_OPTIONS.map((opt) => {
                  const active = requestedSolution === opt.key;
                  return (
                    <Pressable
                      key={opt.key}
                      onPress={() => setRequestedSolution(opt.key)}
                      style={[styles.chip, active && styles.chipActive]}
                    >
                      <Text
                        style={[styles.chipText, active && styles.chipTextActive]}
                      >
                        {opt.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Input
                label="Mô tả chi tiết"
                value={description}
                onChangeText={setDescription}
                placeholder="Mô tả tình trạng hàng hóa khi nhận..."
                multiline
              />

              <Pressable onPress={handleSubmit} style={styles.primaryBtn}>
                <Text style={styles.primaryBtnText}>Gửi khiếu nại</Text>
              </Pressable>
            </ScrollView>
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
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: colors.green,
    borderRadius: borderRadius.md,
    paddingVertical: 12,
  },
  primaryBtnText: {
    fontSize: 13,
    fontWeight: fontWeight.bold,
    color: colors.white,
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
  codeText: {
    fontSize: 11,
    fontWeight: fontWeight.bold,
    color: colors.eyebrow,
  },
  cardTitle: {
    fontFamily: serifFont,
    fontSize: 16,
    color: colors.dark,
    marginTop: 2,
  },
  metaGrid: { gap: 3 },
  metaText: { fontSize: 12, color: colors.muted },
  metaStrong: { color: colors.dark, fontWeight: fontWeight.semibold },
  descText: { fontSize: 12.5, color: colors.text, lineHeight: 18 },
  timeText: { fontSize: 11, color: colors.muted },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(18, 28, 22, 0.45)",
    justifyContent: "flex-end",
  },
  modalCard: {
    maxHeight: "88%",
    backgroundColor: colors.panel,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: 18,
    gap: 12,
  },
  modalTitle: {
    fontFamily: serifFont,
    fontSize: 18,
    color: colors.dark,
  },
  twoCol: { flexDirection: "row", gap: 10 },
  fieldLabel: {
    fontSize: 12,
    fontWeight: fontWeight.bold,
    color: colors.dark,
  },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.bg,
  },
  chipActive: {
    borderColor: colors.green,
    backgroundColor: colors.greenSoft,
  },
  chipText: { fontSize: 11.5, color: colors.text },
  chipTextActive: { color: colors.green, fontWeight: fontWeight.bold },
});
