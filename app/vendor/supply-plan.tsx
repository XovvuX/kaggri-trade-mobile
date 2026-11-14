import React, { useMemo, useState } from "react";
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

interface HarvestPlan {
  id: string;
  productName: string;
  harvestDate: string;
  expectedQty: number;
  alreadyCommittedQty: number;
  unit: string;
  confidence: "high" | "medium" | "low";
  notes: string;
}

const INITIAL_PLANS: HarvestPlan[] = [
  {
    id: "HP-01",
    productName: "Bắp cải sạch Đà Lạt VietGAP",
    harvestDate: "18/11/2026",
    expectedQty: 2500,
    alreadyCommittedQty: 1200,
    unit: "kg",
    confidence: "high",
    notes: "Thu hoạch khu A3, độ đồng đều cao.",
  },
  {
    id: "HP-02",
    productName: "Cà chua Beef Đà Lạt loại 1",
    harvestDate: "22/11/2026",
    expectedQty: 1400,
    alreadyCommittedQty: 500,
    unit: "kg",
    confidence: "medium",
    notes: "Nhà kính số 2, theo dõi thời tiết sương muối.",
  },
];

const CONFIDENCE_MAP: Record<
  HarvestPlan["confidence"],
  { label: string; status: "APPROVED" | "PENDING_REVIEW" | "REJECTED" }
> = {
  high: { label: "Độ tin cậy cao", status: "APPROVED" },
  medium: { label: "Trung bình", status: "PENDING_REVIEW" },
  low: { label: "Rủi ro thời tiết", status: "REJECTED" },
};

export default function VendorSupplyPlanScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [plans, setPlans] = useState<HarvestPlan[]>(INITIAL_PLANS);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [productName, setProductName] = useState("Bắp cải sạch Đà Lạt VietGAP");
  const [harvestDate, setHarvestDate] = useState("25/11/2026");
  const [expectedQty, setExpectedQty] = useState("1500");
  const [confidence, setConfidence] = useState<HarvestPlan["confidence"]>("high");
  const [notes, setNotes] = useState("");

  const summary = useMemo(() => {
    const total = plans.reduce((s, p) => s + p.expectedQty, 0);
    const committed = plans.reduce((s, p) => s + p.alreadyCommittedQty, 0);
    return { total, committed, available: Math.max(0, total - committed) };
  }, [plans]);

  const openAdd = () => {
    setEditingId(null);
    setProductName("Bắp cải sạch Đà Lạt VietGAP");
    setHarvestDate("25/11/2026");
    setExpectedQty("1500");
    setConfidence("high");
    setNotes("");
    setModalOpen(true);
  };

  const openEdit = (plan: HarvestPlan) => {
    setEditingId(plan.id);
    setProductName(plan.productName);
    setHarvestDate(plan.harvestDate);
    setExpectedQty(String(plan.expectedQty));
    setConfidence(plan.confidence);
    setNotes(plan.notes);
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!productName.trim() || !harvestDate.trim()) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập tên sản phẩm và ngày thu hoạch.");
      return;
    }
    const qty = Number(expectedQty) || 0;
    if (editingId) {
      setPlans((prev) =>
        prev.map((p) =>
          p.id === editingId
            ? {
                ...p,
                productName: productName.trim(),
                harvestDate: harvestDate.trim(),
                expectedQty: qty,
                confidence,
                notes: notes.trim(),
              }
            : p
        )
      );
    } else {
      setPlans((prev) => [
        {
          id: `HP-${Date.now().toString().slice(-4)}`,
          productName: productName.trim(),
          harvestDate: harvestDate.trim(),
          expectedQty: qty,
          alreadyCommittedQty: 0,
          unit: "kg",
          confidence,
          notes: notes.trim(),
        },
        ...prev,
      ]);
    }
    setModalOpen(false);
  };

  const handleDelete = (plan: HarvestPlan) => {
    Alert.alert("Xóa kế hoạch", `Xóa kế hoạch thu hoạch "${plan.productName}"?`, [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: () => setPlans((prev) => prev.filter((p) => p.id !== plan.id)),
      },
    ]);
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <Header
        eyebrow="DỰ BÁO NGUỒN CUNG"
        title="Kế hoạch thu hoạch"
        subtitle="Theo dõi sản lượng dự kiến và phần đã cam kết đặt trước."
        leftIcon="arrow-back"
        onLeftPress={() => router.back()}
        rightActions={[{ icon: "add", onPress: openAdd }]}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.mockBanner}>
          <MaterialIcons name="info-outline" size={16} color="#8c6320" />
          <Text style={styles.mockBannerText}>
            Dữ liệu mô phỏng cục bộ — Kế hoạch thu hoạch đang chờ API Backend.
          </Text>
        </View>

        <View style={styles.kpiRow}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Dự kiến</Text>
            <Text style={styles.kpiValue}>{summary.total.toLocaleString("vi-VN")} kg</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Đã cam kết</Text>
            <Text style={styles.kpiValue}>{summary.committed.toLocaleString("vi-VN")} kg</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Khả dụng</Text>
            <Text style={[styles.kpiValue, { color: colors.green }]}>
              {summary.available.toLocaleString("vi-VN")} kg
            </Text>
          </View>
        </View>

        {plans.map((plan) => {
          const conf = CONFIDENCE_MAP[plan.confidence];
          const avail = Math.max(0, plan.expectedQty - plan.alreadyCommittedQty);
          return (
            <View key={plan.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.codeText}>
                    {plan.id} · Thu hoạch {plan.harvestDate}
                  </Text>
                  <Text style={styles.cardTitle}>{plan.productName}</Text>
                </View>
                <StatusBadge status={conf.status} label={conf.label} />
              </View>

              <Text style={styles.metaText}>
                Dự kiến: <Text style={styles.metaStrong}>{plan.expectedQty} {plan.unit}</Text> · Đã đặt trước:{" "}
                <Text style={styles.metaStrong}>{plan.alreadyCommittedQty} {plan.unit}</Text> · Còn lại:{" "}
                <Text style={[styles.metaStrong, { color: colors.green }]}>
                  {avail} {plan.unit}
                </Text>
              </Text>
              {plan.notes ? <Text style={styles.notesText}>{plan.notes}</Text> : null}

              <View style={styles.actionRow}>
                <Pressable onPress={() => openEdit(plan)} style={styles.outlineBtn}>
                  <Text style={styles.outlineBtnText}>Chỉnh sửa</Text>
                </Pressable>
                <Pressable onPress={() => handleDelete(plan)} style={styles.dangerOutlineBtn}>
                  <Text style={styles.dangerOutlineText}>Xóa</Text>
                </Pressable>
              </View>
            </View>
          );
        })}
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
              <Text style={styles.modalTitle}>
                {editingId ? "Cập nhật kế hoạch" : "Thêm kế hoạch thu hoạch"}
              </Text>
              <Pressable onPress={() => setModalOpen(false)} hitSlop={8}>
                <MaterialIcons name="close" size={20} color={colors.muted} />
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={{ gap: 10 }}>
              <Input
                label="Sản phẩm"
                value={productName}
                onChangeText={setProductName}
              />
              <Input
                label="Ngày dự kiến thu hoạch"
                value={harvestDate}
                onChangeText={setHarvestDate}
                placeholder="DD/MM/YYYY"
              />
              <Input
                label="Sản lượng dự kiến (kg)"
                value={expectedQty}
                onChangeText={setExpectedQty}
                keyboardType="numeric"
              />
              <Text style={styles.fieldLabel}>Mức độ chắc chắn</Text>
              <View style={styles.chipRow}>
                {(["high", "medium", "low"] as const).map((key) => {
                  const active = confidence === key;
                  return (
                    <Pressable
                      key={key}
                      onPress={() => setConfidence(key)}
                      style={[styles.chip, active && styles.chipActive]}
                    >
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>
                        {CONFIDENCE_MAP[key].label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <Input
                label="Ghi chú canh tác"
                value={notes}
                onChangeText={setNotes}
                multiline
              />
              <Pressable onPress={handleSave} style={styles.primaryBtn}>
                <Text style={styles.primaryBtnText}>Lưu kế hoạch</Text>
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
  kpiRow: { flexDirection: "row", gap: 8 },
  kpiCard: {
    flex: 1,
    backgroundColor: colors.panel,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 10,
    gap: 4,
  },
  kpiLabel: { fontSize: 11, color: colors.muted },
  kpiValue: { fontSize: 14, fontWeight: fontWeight.extrabold, color: colors.dark },
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
  metaText: { fontSize: 12, color: colors.muted, lineHeight: 18 },
  metaStrong: { color: colors.dark, fontWeight: fontWeight.semibold },
  notesText: { fontSize: 12, color: colors.text },
  actionRow: { flexDirection: "row", gap: 8, marginTop: 2 },
  outlineBtn: {
    flex: 1,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.green,
    paddingVertical: 8,
    alignItems: "center",
  },
  outlineBtnText: { fontSize: 12, fontWeight: fontWeight.bold, color: colors.green },
  dangerOutlineBtn: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: "#ebcfc6",
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: "center",
  },
  dangerOutlineText: { fontSize: 12, fontWeight: fontWeight.bold, color: colors.danger },
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
  modalTitle: { fontFamily: serifFont, fontSize: 18, color: colors.dark },
  fieldLabel: { fontSize: 12, fontWeight: fontWeight.bold, color: colors.dark },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.bg,
  },
  chipActive: { borderColor: colors.green, backgroundColor: colors.greenSoft },
  chipText: { fontSize: 11.5, color: colors.text },
  chipTextActive: { color: colors.green, fontWeight: fontWeight.bold },
  primaryBtn: {
    backgroundColor: colors.green,
    borderRadius: borderRadius.md,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 6,
  },
  primaryBtnText: { fontSize: 13, fontWeight: fontWeight.bold, color: colors.white },
});
