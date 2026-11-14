import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { colors, fontSize, fontWeight, spacing, borderRadius, serifFont } from "@/theme";
import { KaggriBrand } from "@/components/Header";
import { Input } from "@/components/Input";
import { StatusBadge } from "@/components/StatusBadge";
import { vendorProductService, formatSaleUnit } from "@/services";
import { ApiError } from "@/services/api";

type AdjustmentRecord = {
  id: string;
  deltaQuantity: number;
  reason: string;
  previousOnHandQuantity: number;
  newOnHandQuantity: number;
  createdAt: string;
};

export default function VendorInventoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id?: string }>();

  const [productName, setProductName] = useState("Cà chua Beef Đà Lạt VietGAP");
  const [unitLabel, setUnitLabel] = useState("kg");
  const [onHand, setOnHand] = useState(2500);
  const [reserved, setReserved] = useState(320);
  const available = Math.max(0, onHand - reserved);

  const [deltaQuantity, setDeltaQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [allowPreorder, setAllowPreorder] = useState(true);
  const [preorderLeadDays, setPreorderLeadDays] = useState("3");
  const [preorderLimit, setPreorderLimit] = useState("1000");
  const [expectedDate, setExpectedDate] = useState("2026-10-25");
  const [notice, setNotice] = useState("");

  const [history, setHistory] = useState<AdjustmentRecord[]>([
    {
      id: "adj-1",
      deltaQuantity: 500,
      reason: "Nhập đợt thu hoạch sáng từ nhà kính số 3",
      previousOnHandQuantity: 2000,
      newOnHandQuantity: 2500,
      createdAt: "16/10/2026 · 07:30",
    },
    {
      id: "adj-2",
      deltaQuantity: -150,
      reason: "Xuất đơn sỉ Siêu thị Thực phẩm Xanh",
      previousOnHandQuantity: 2150,
      newOnHandQuantity: 2000,
      createdAt: "15/10/2026 · 16:20",
    },
  ]);

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    Promise.all([
      vendorProductService.getById(id).catch(() => null),
      vendorProductService.getInventory(id).catch(() => null),
      vendorProductService.getInventoryHistory(id).catch(() => null),
    ]).then(([prod, inv, hist]) => {
      if (!mounted) return;
      if (prod) {
        const rev = prod.revisions?.[0] || prod.publishedRevision;
        if (rev?.name) setProductName(rev.name);
        if (rev?.saleUnit) setUnitLabel(formatSaleUnit(rev.saleUnit));
        setAllowPreorder(Boolean(prod.preorderEnabled));
        if (prod.preorderLeadDays) setPreorderLeadDays(String(prod.preorderLeadDays));
      }
      if (inv) {
        setOnHand(Number(inv.onHandQuantity || 0));
        setReserved(Number(inv.reservedQuantity || 0));
      }
      if (hist && hist.length > 0) {
        setHistory(
          hist.map((h) => ({
            id: h.id,
            deltaQuantity: Number(h.changeQuantity),
            reason: h.reason,
            previousOnHandQuantity: Number(h.previousQuantity),
            newOnHandQuantity: Number(h.newQuantity),
            createdAt: new Date(h.createdAt).toLocaleString("vi-VN"),
          }))
        );
      }
    });
    return () => {
      mounted = false;
    };
  }, [id]);

  const handleAdjust = async () => {
    const delta = Number(deltaQuantity);
    if (!delta || !reason.trim()) {
      setNotice("Vui lòng nhập số lượng cộng/trừ và lý do điều chỉnh.");
      return;
    }
    if (id) {
      try {
        const inv = await vendorProductService.adjustInventory(id, delta, reason.trim());
        setOnHand(Number(inv.onHandQuantity || 0));
        setReserved(Number(inv.reservedQuantity || 0));
        const hist = await vendorProductService.getInventoryHistory(id);
        setHistory(
          hist.map((h) => ({
            id: h.id,
            deltaQuantity: Number(h.changeQuantity),
            reason: h.reason,
            previousOnHandQuantity: Number(h.previousQuantity),
            newOnHandQuantity: Number(h.newQuantity),
            createdAt: new Date(h.createdAt).toLocaleString("vi-VN"),
          }))
        );
        setDeltaQuantity("");
        setReason("");
        setNotice("Đã cập nhật tồn kho trên hệ thống Kaggri.");
        setTimeout(() => setNotice(""), 3000);
        return;
      } catch (err) {
        if (err instanceof ApiError && err.status !== 0) {
          setNotice(err.message);
          return;
        }
      }
    }
    const prev = onHand;
    const next = Math.max(0, prev + delta);
    setOnHand(next);
    setHistory([
      {
        id: "adj-" + Date.now(),
        deltaQuantity: delta,
        reason: reason.trim(),
        previousOnHandQuantity: prev,
        newOnHandQuantity: next,
        createdAt: "Vừa xong",
      },
      ...history,
    ]);
    setDeltaQuantity("");
    setReason("");
    setNotice("Đã cập nhật tồn kho.");
    setTimeout(() => setNotice(""), 3000);
  };

  const handleSavePreorder = async () => {
    if (id) {
      try {
        await vendorProductService.updatePreorder(
          id,
          allowPreorder,
          Number(preorderLeadDays) || 3
        );
        setNotice("Đã lưu cấu hình đặt trước trên Kaggri.");
        setTimeout(() => setNotice(""), 3000);
        return;
      } catch (err) {
        if (err instanceof ApiError && err.status !== 0) {
          setNotice(err.message);
          return;
        }
      }
    }
    setNotice("Đã lưu cấu hình đặt trước.");
    setTimeout(() => setNotice(""), 3000);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Workspace Header */}
      <View style={styles.topHeader}>
        <KaggriBrand compact />
        <StatusBadge
          status={available > 0 ? "IN_STOCK" : allowPreorder ? "PREORDER" : "OUT_OF_STOCK"}
        />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
      >
        {/* Back link matching .link-back in Kaggri-Trade */}
        <Pressable onPress={() => router.back()} style={styles.linkBack} hitSlop={8}>
          <Text style={styles.linkBackText}>← Chi tiết sản phẩm</Text>
        </Pressable>

        {/* Title matching InventoryPage in Kaggri-Trade/fe/src/products.tsx */}
        <View style={styles.titleBlock}>
          <Text style={styles.eyebrow}>QUẢN LÝ NGUỒN HÀNG</Text>
          <Text style={styles.h1}>Tồn kho & đặt trước</Text>
          <Text style={styles.subtitle}>
            {productName} · Đơn vị tính: {unitLabel}
          </Text>
        </View>

        {notice ? (
          <View style={styles.noticeBox}>
            <MaterialIcons name="info-outline" size={16} color={colors.green} />
            <Text style={styles.noticeText}>{notice}</Text>
          </View>
        ) : null}

        {/* 3 Stat Cards matching .stat-grid / .stat-card in Kaggri-Trade */}
        <View style={styles.statGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statSpan}>Tồn thực tế</Text>
            <Text style={styles.statStrong}>
              {onHand.toLocaleString("vi-VN")}
            </Text>
            <Text style={styles.statUnit}>kg</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statSpan}>Đã giữ chỗ</Text>
            <Text style={styles.statStrong}>
              {reserved.toLocaleString("vi-VN")}
            </Text>
            <Text style={styles.statUnit}>kg</Text>
          </View>
          <View style={[styles.statCard, styles.statCardHighlight]}>
            <Text style={styles.statSpan}>Khả dụng</Text>
            <Text style={[styles.statStrong, { color: colors.green }]}>
              {available.toLocaleString("vi-VN")}
            </Text>
            <Text style={styles.statUnit}>kg</Text>
          </View>
        </View>

        {/* Panel 1: Điều chỉnh tồn kho */}
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Điều chỉnh tồn kho</Text>
          <View style={styles.formStack}>
            <Input
              label="Số lượng cộng / trừ (dùng dấu - nếu giảm)"
              placeholder="Ví dụ: 500 hoặc -50"
              keyboardType="numbers-and-punctuation"
              value={deltaQuantity}
              onChangeText={setDeltaQuantity}
            />
            <Input
              label="Lý do điều chỉnh"
              placeholder="Nhập kho mới, xuất hàng, hao hụt..."
              value={reason}
              onChangeText={setReason}
            />
            <Pressable
              onPress={handleAdjust}
              style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.9 }]}
            >
              <Text style={styles.primaryBtnText}>Cập nhật tồn kho</Text>
            </Pressable>
          </View>
        </View>

        {/* Panel 2: Cấu hình đặt trước */}
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Cấu hình đặt trước</Text>

          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.switchTitle}>Cho phép khách đặt trước</Text>
              <Text style={styles.switchSub}>
                Nhận đơn đặt trước mùa thu hoạch kế tiếp khi hết hàng sẵn
              </Text>
            </View>
            <Switch
              value={allowPreorder}
              onValueChange={setAllowPreorder}
              trackColor={{ false: colors.line, true: colors.green }}
              thumbColor={colors.white}
            />
          </View>

          <View style={styles.formStack}>
            <Input
              label="Số ngày chuẩn bị hàng đặt trước"
              value={preorderLeadDays}
              onChangeText={setPreorderLeadDays}
              keyboardType="numeric"
            />
            <Input
              label="Sản lượng nhận đặt trước tối đa (kg)"
              value={preorderLimit}
              onChangeText={setPreorderLimit}
              keyboardType="numeric"
            />
            <Input
              label="Ngày dự kiến có hàng"
              value={expectedDate}
              onChangeText={setExpectedDate}
              placeholder="YYYY-MM-DD"
            />
            <Pressable
              onPress={handleSavePreorder}
              style={styles.secondaryBtn}
            >
              <Text style={styles.secondaryBtnText}>Lưu cấu hình đặt trước</Text>
            </Pressable>
          </View>
        </View>

        {/* Panel 3: Lịch sử điều chỉnh */}
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Lịch sử điều chỉnh</Text>

          {history.map((a, idx) => (
            <View
              key={a.id}
              style={[styles.historyItem, idx > 0 && styles.historyItemBorder]}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.historyDelta}>
                  {a.deltaQuantity > 0 ? `+${a.deltaQuantity}` : a.deltaQuantity} kg ·{" "}
                  <Text style={styles.historyReason}>{a.reason}</Text>
                </Text>
                <Text style={styles.historySub}>
                  {a.previousOnHandQuantity.toLocaleString("vi-VN")} →{" "}
                  {a.newOnHandQuantity.toLocaleString("vi-VN")} kg · {a.createdAt}
                </Text>
              </View>
              <StatusBadge
                status={a.deltaQuantity > 0 ? "IN_STOCK" : "DRAFT"}
                label={a.deltaQuantity > 0 ? "NHẬP" : "XUẤT"}
              />
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.gutter,
    paddingVertical: 11,
    backgroundColor: colors.panel,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  scrollContent: {
    padding: spacing.gutter,
    gap: 14,
  },
  linkBack: {
    alignSelf: "flex-start",
  },
  linkBackText: {
    fontSize: 12,
    fontWeight: fontWeight.bold,
    color: colors.green,
  },
  titleBlock: {
    gap: 3,
  },
  eyebrow: {
    fontSize: 9.5,
    fontWeight: fontWeight.bold,
    color: colors.eyebrow,
    letterSpacing: 1.4,
  },
  h1: {
    fontFamily: serifFont,
    fontSize: 25,
    color: colors.dark,
  },
  subtitle: {
    fontSize: 12,
    color: colors.muted,
  },
  noticeBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderRadius: borderRadius.md,
    backgroundColor: "#f7f4e9",
    borderWidth: 1,
    borderColor: "#e6dec8",
  },
  noticeText: {
    fontSize: 12,
    fontWeight: fontWeight.semibold,
    color: "#6b5937",
  },
  statGrid: {
    flexDirection: "row",
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.panel,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 13,
    gap: 2,
  },
  statCardHighlight: {
    backgroundColor: colors.greenSoft,
    borderColor: "#cfe0c2",
  },
  statSpan: {
    fontSize: 10.5,
    color: colors.muted,
  },
  statStrong: {
    fontFamily: serifFont,
    fontSize: 21,
    fontWeight: fontWeight.bold,
    color: colors.dark,
    marginTop: 2,
  },
  statUnit: {
    fontSize: 10,
    color: colors.muted,
  },
  panel: {
    backgroundColor: colors.panel,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 16,
    gap: 12,
  },
  panelTitle: {
    fontSize: 14,
    fontWeight: fontWeight.extrabold,
    color: colors.dark,
  },
  formStack: {
    gap: 11,
  },
  primaryBtn: {
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.green,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: {
    fontSize: 12,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  secondaryBtn: {
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: "#d8ded3",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryBtnText: {
    fontSize: 12,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#edf0e9",
  },
  switchTitle: {
    fontSize: 13,
    fontWeight: fontWeight.bold,
    color: colors.dark,
  },
  switchSub: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 2,
  },
  historyItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    paddingVertical: 8,
  },
  historyItemBorder: {
    borderTopWidth: 1,
    borderTopColor: "#edf0e9",
  },
  historyDelta: {
    fontSize: 12,
    fontWeight: fontWeight.extrabold,
    color: colors.dark,
  },
  historyReason: {
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  historySub: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 2,
  },
});
