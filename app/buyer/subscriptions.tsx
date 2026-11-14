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
import { formatVND } from "@/utils";

interface SubscriptionPlan {
  id: string;
  vendorName: string;
  productName: string;
  frequency: string;
  quantityPerDelivery: number;
  unit: string;
  unitPrice: number;
  deliveryWindow: string;
  status: "active" | "paused";
  nextDeliveryDate: string;
  warehouseAddress: string;
}

const INITIAL_SUBSCRIPTIONS: SubscriptionPlan[] = [
  {
    id: "SUB-2026-001",
    vendorName: "HTX Nông nghiệp Công nghệ cao Lạc Dương",
    productName: "Bắp cải sạch Đà Lạt VietGAP",
    frequency: "Thứ 2 & Thứ 5 hàng tuần",
    quantityPerDelivery: 300,
    unit: "kg",
    unitPrice: 16800,
    deliveryWindow: "04:00 - 06:00 sáng",
    status: "active",
    nextDeliveryDate: "16/11/2026",
    warehouseAddress: "Kho Trung chuyển Bình Tân, TP. HCM",
  },
  {
    id: "SUB-2026-002",
    vendorName: "Trang trại Rau sạch Đơn Dương",
    productName: "Cà chua Beef Đà Lạt loại 1",
    frequency: "Thứ 4 hàng tuần",
    quantityPerDelivery: 150,
    unit: "kg",
    unitPrice: 38000,
    deliveryWindow: "05:00 - 07:00 sáng",
    status: "paused",
    nextDeliveryDate: "Tạm dừng theo yêu cầu",
    warehouseAddress: "Kho Lạnh Thủ Đức, TP. HCM",
  },
];

export default function BuyerSubscriptionsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [plans, setPlans] = useState<SubscriptionPlan[]>(INITIAL_SUBSCRIPTIONS);
  const [filter, setFilter] = useState<"all" | "active" | "paused">("all");
  const [modalOpen, setModalOpen] = useState(false);

  const [vendorName, setVendorName] = useState("HTX Nông Nghiệp Lạc Dương");
  const [productName, setProductName] = useState("");
  const [frequency, setFrequency] = useState("Thứ 2 & Thứ 5 hàng tuần");
  const [qty, setQty] = useState("200");
  const [unitPrice, setUnitPrice] = useState("18000");
  const [warehouse, setWarehouse] = useState("Kho Trung chuyển TP. HCM");

  const filteredPlans = useMemo(() => {
    if (filter === "all") return plans;
    return plans.filter((p) => p.status === filter);
  }, [plans, filter]);

  const toggleStatus = (id: string) => {
    setPlans((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, status: p.status === "active" ? "paused" : "active" }
          : p
      )
    );
  };

  const handleDelete = (plan: SubscriptionPlan) => {
    Alert.alert("Hủy lịch định kỳ", `Xóa lịch giao "${plan.productName}"?`, [
      { text: "Giữ lại", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: () => setPlans((prev) => prev.filter((p) => p.id !== plan.id)),
      },
    ]);
  };

  const handleCreate = () => {
    if (!productName.trim() || !vendorName.trim()) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập nhà cung cấp và tên nông sản.");
      return;
    }
    const created: SubscriptionPlan = {
      id: `SUB-${Date.now().toString().slice(-5)}`,
      vendorName: vendorName.trim(),
      productName: productName.trim(),
      frequency: frequency.trim() || "Hàng tuần",
      quantityPerDelivery: Number(qty) || 100,
      unit: "kg",
      unitPrice: Number(unitPrice) || 15000,
      deliveryWindow: "05:00 - 07:00 sáng",
      status: "active",
      nextDeliveryDate: "18/11/2026",
      warehouseAddress: warehouse.trim() || "Kho nhận mặc định",
    };
    setPlans((prev) => [created, ...prev]);
    setProductName("");
    setModalOpen(false);
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <Header
        eyebrow="NGUỒN CUNG ỔN ĐỊNH"
        title="Đơn giao định kỳ"
        subtitle="Thiết lập lịch thu mua lặp lại theo tuần/tháng với nhà vườn."
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
            Dữ liệu mô phỏng cục bộ — tính năng Đơn định kỳ đang chờ API Backend.
          </Text>
        </View>

        <View style={styles.filterRow}>
          {[
            { key: "all", label: `Tất cả (${plans.length})` },
            {
              key: "active",
              label: `Đang chạy (${plans.filter((p) => p.status === "active").length})`,
            },
            {
              key: "paused",
              label: `Tạm dừng (${plans.filter((p) => p.status === "paused").length})`,
            },
          ].map((tab) => {
            const active = filter === tab.key;
            return (
              <Pressable
                key={tab.key}
                onPress={() => setFilter(tab.key as any)}
                style={[styles.filterBtn, active && styles.filterBtnActive]}
              >
                <Text
                  style={[styles.filterText, active && styles.filterTextActive]}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {filteredPlans.map((plan) => (
          <View key={plan.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.codeText}>{plan.id}</Text>
                <Text style={styles.cardTitle}>{plan.productName}</Text>
                <Text style={styles.vendorText}>{plan.vendorName}</Text>
              </View>
              <StatusBadge
                status={plan.status === "active" ? "ACTIVE" : "HIDDEN"}
                label={plan.status === "active" ? "Đang chạy" : "Tạm dừng"}
              />
            </View>

            <View style={styles.metaGrid}>
              <Text style={styles.metaText}>
                Chu kỳ: <Text style={styles.metaStrong}>{plan.frequency}</Text>
              </Text>
              <Text style={styles.metaText}>
                Sản lượng mỗi chuyến:{" "}
                <Text style={styles.metaStrong}>
                  {plan.quantityPerDelivery} {plan.unit} ·{" "}
                  {formatVND(plan.unitPrice)}/{plan.unit}
                </Text>
              </Text>
              <Text style={styles.metaText}>
                Khung giờ & Chuyến tới:{" "}
                <Text style={styles.metaStrong}>
                  {plan.deliveryWindow} · {plan.nextDeliveryDate}
                </Text>
              </Text>
              <Text style={styles.metaText}>
                Kho nhận: <Text style={styles.metaStrong}>{plan.warehouseAddress}</Text>
              </Text>
            </View>

            <View style={styles.actionRow}>
              <Pressable
                onPress={() => toggleStatus(plan.id)}
                style={styles.outlineBtn}
              >
                <Text style={styles.outlineBtnText}>
                  {plan.status === "active" ? "Tạm dừng" : "Kích hoạt lại"}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => handleDelete(plan)}
                style={styles.dangerOutlineBtn}
              >
                <Text style={styles.dangerOutlineText}>Hủy lịch</Text>
              </Pressable>
            </View>
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
              <Text style={styles.modalTitle}>Tạo lịch giao định kỳ</Text>
              <Pressable onPress={() => setModalOpen(false)} hitSlop={8}>
                <MaterialIcons name="close" size={20} color={colors.muted} />
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={{ gap: 10 }}>
              <Input
                label="Nhà cung cấp"
                value={vendorName}
                onChangeText={setVendorName}
              />
              <Input
                label="Tên nông sản"
                value={productName}
                onChangeText={setProductName}
                placeholder="VD: Cải thảo Đà Lạt VietGAP"
              />
              <Input
                label="Chu kỳ giao"
                value={frequency}
                onChangeText={setFrequency}
              />
              <View style={{ flexDirection: "row", gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Input
                    label="Số lượng/chuyến (kg)"
                    value={qty}
                    onChangeText={setQty}
                    keyboardType="numeric"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Input
                    label="Đơn giá dự kiến (đ)"
                    value={unitPrice}
                    onChangeText={setUnitPrice}
                    keyboardType="numeric"
                  />
                </View>
              </View>
              <Input
                label="Kho nhận hàng"
                value={warehouse}
                onChangeText={setWarehouse}
              />
              <Pressable onPress={handleCreate} style={styles.primaryBtn}>
                <Text style={styles.primaryBtnText}>Lưu lịch định kỳ</Text>
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
  filterRow: { flexDirection: "row", gap: 6 },
  filterBtn: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.panel,
  },
  filterBtnActive: {
    borderColor: colors.green,
    backgroundColor: colors.greenSoft,
  },
  filterText: { fontSize: 11.5, color: colors.muted, fontWeight: fontWeight.bold },
  filterTextActive: { color: colors.green },
  card: {
    backgroundColor: colors.panel,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 14,
    gap: 10,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  },
  codeText: { fontSize: 11, fontWeight: fontWeight.bold, color: colors.eyebrow },
  cardTitle: { fontFamily: serifFont, fontSize: 16, color: colors.dark, marginTop: 2 },
  vendorText: { fontSize: 12, color: colors.green, marginTop: 2 },
  metaGrid: { gap: 4 },
  metaText: { fontSize: 12, color: colors.muted },
  metaStrong: { color: colors.dark, fontWeight: fontWeight.semibold },
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
  primaryBtn: {
    backgroundColor: colors.green,
    borderRadius: borderRadius.md,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 6,
  },
  primaryBtnText: { fontSize: 13, fontWeight: fontWeight.bold, color: colors.white },
});
