import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { colors, fontWeight, spacing, borderRadius, serifFont } from "@/theme";
import { KaggriBrand } from "@/components/Header";
import { StatusBadge } from "@/components/StatusBadge";
import { productService, vendorService } from "@/services";
import { resolveImageSource } from "@/services/api";
import { useCartStore } from "@/stores/cart-store";
import { useCheckoutStore } from "@/stores/checkout-store";
import { useAuthStore } from "@/stores/auth-store";
import { formatVND, getUnitPriceForQty } from "@/utils";
import type { Product, Vendor } from "@/types";

export default function ProductDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(50);
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});

  const addToCart = useCartStore((s) => s.add);
  const setPendingAdd = useCartStore((s) => s.setPendingAdd);
  const cartCount = useCartStore((s) => s.totalQty());
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    Promise.all([
      id ? productService.getById(id) : Promise.resolve(null),
      vendorService.list(),
    ])
      .then(async ([found, vends]) => {
        if (!mounted) return;
        let target = found;
        if (!target) {
          const all = await productService.list();
          target = all.find((item) => item.id === id || item.slug === id) ?? all[0] ?? null;
        }
        setProduct(target);
        if (target) {
          setQty(target.minQty || 20);
          const v =
            vends.find((vend) => vend.id === target.vendorId) ??
            (target.vendorName
              ? {
                  id: target.vendorId,
                  name: target.vendorName,
                  shortName: target.vendorName,
                  location: target.originProvince || target.vendorProvince || "Việt Nam",
                  certification: target.certificationVerified
                    ? "Chứng nhận đã xác minh"
                    : "Nhà cung cấp đã được xét duyệt trên Kaggri",
                  status: "verified" as const,
                }
              : vends[0] ?? null);
          setVendor(v);
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [id]);

  if (loading || !product) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={colors.green} />
      </View>
    );
  }

  const p = product;
  const v: Vendor = vendor ?? {
    id: p.vendorId,
    name: "HTX Nông sản Kaggri",
    shortName: "HTX Kaggri",
    location: "Lâm Đồng",
    certification: "VietGAP",
    status: "verified",
  };

  const unitPrice = getUnitPriceForQty(p, qty);
  const totalPrice = qty * unitPrice;

  const availabilityStatus =
    p.availability === "PREORDER_AVAILABLE"
      ? "PREORDER"
      : p.availability === "OUT_OF_STOCK"
      ? "OUT_OF_STOCK"
      : p.available > 0
      ? "IN_STOCK"
      : "OUT_OF_STOCK";

  const activeImage = p.images?.[selectedImageIdx];
  const activeImageSource = resolveImageSource(activeImage?.src);
  const hasValidMainImage =
    activeImage && activeImageSource && !brokenImages[activeImage.id];

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      setPendingAdd({ product: p, vendor: v, qty, goToCheckout: false });
      router.push(`/auth/login?role=buyer&redirect=/buyer/product/${p.id}`);
      return;
    }
    try {
      await addToCart(p, v, qty);
      Alert.alert("Đã thêm vào giỏ hàng", `Đã thêm ${qty} ${p.unit} ${p.name} vào giỏ hàng B2B.`);
    } catch (err) {
      Alert.alert(
        "Không thể thêm vào giỏ hàng",
        err instanceof Error ? err.message : "Vui lòng thử lại."
      );
    }
  };

  const handleBuyNow = async () => {
    if (!isAuthenticated) {
      setPendingAdd({ product: p, vendor: v, qty, goToCheckout: true });
      router.push("/auth/login?role=buyer&redirect=/buyer/checkout");
      return;
    }
    try {
      const addedItem = await addToCart(p, v, qty);
      useCheckoutStore
        .getState()
        .setSelectedCartItemIds(addedItem?.id ? [addedItem.id] : []);
      router.push("/buyer/checkout");
    } catch (err) {
      Alert.alert(
        "Không thể đặt mua ngay",
        err instanceof Error ? err.message : "Vui lòng thử lại."
      );
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Site Header matching Kaggri-Trade */}
      <View style={styles.siteHeader}>
        <KaggriBrand compact />
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Pressable
            onPress={() => router.push("/buyer/cart")}
            style={styles.headerIconBtn}
          >
            <MaterialIcons name="shopping-bag" size={18} color={colors.dark} />
            {cartCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cartCount}</Text>
              </View>
            )}
          </Pressable>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 140 }]}
      >
        {/* Back link matching .link-back in Kaggri-Trade */}
        <Pressable onPress={() => router.back()} style={styles.linkBack} hitSlop={8}>
          <Text style={styles.linkBackText}>← Tất cả nông sản</Text>
        </Pressable>

        {/* Detail Image matching .detail-image & .thumbnails */}
        <View style={styles.detailImage}>
          {hasValidMainImage && activeImageSource ? (
            <Image
              source={activeImageSource}
              style={styles.detailPhoto}
              resizeMode="cover"
              onError={() =>
                setBrokenImages((prev) => ({ ...prev, [activeImage.id]: true }))
              }
            />
          ) : (
            <View style={styles.detailPlaceholder}>
              <Text style={styles.detailEmoji}>{p.image || "🌾"}</Text>
            </View>
          )}
        </View>

        {p.images && p.images.length > 0 ? (
          <View style={styles.thumbnails}>
            {p.images.map((img, idx) => {
              const thumbSource = resolveImageSource(img.src);
              return (
                <Pressable
                  key={img.id || idx}
                  onPress={() => setSelectedImageIdx(idx)}
                  style={[styles.thumbItem, idx === selectedImageIdx && styles.thumbItemActive]}
                >
                  {thumbSource && !brokenImages[img.id] ? (
                    <Image
                      source={thumbSource}
                      style={styles.thumbPhoto}
                      resizeMode="cover"
                      onError={() =>
                        setBrokenImages((prev) => ({ ...prev, [img.id]: true }))
                      }
                    />
                  ) : (
                    <Text style={{ fontSize: 20 }}>{img.icon || p.image || "🌾"}</Text>
                  )}
                </Pressable>
              );
            })}
          </View>
        ) : (
          <View style={styles.thumbnails}>
            {[p.image || "🌾", "🌱", "📦"].map((em, idx) => (
              <View
                key={idx}
                style={[styles.thumbItem, idx === 0 && styles.thumbItemActive]}
              >
                <Text style={{ fontSize: 20 }}>{em}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Product Summary matching .detail-grid right column in Kaggri-Trade */}
        <View style={styles.summarySection}>
          <View style={styles.summaryHead}>
            <View style={{ flex: 1 }}>
              <Text style={styles.eyebrow}>
                {p.categoryName || "Nông sản chọn lọc"} · {p.sku}
              </Text>
              <Text style={styles.detailH1}>{p.name}</Text>
            </View>
            <StatusBadge status={availabilityStatus} />
          </View>

          <View style={styles.detailPriceRow}>
            <Text style={styles.detailPrice}>{formatVND(unitPrice)}</Text>
            <Text style={styles.detailPriceUnit}> / {p.unit}</Text>
          </View>

          {/* 2x2 Spec Grid matching .spec-grid in Kaggri-Trade */}
          <View style={styles.specGrid}>
            <View style={styles.specBox}>
              <Text style={styles.specSpan}>Đặt tối thiểu</Text>
              <Text style={styles.specStrong}>
                {p.minQty} {p.unit}
              </Text>
            </View>
            <View style={styles.specBox}>
              <Text style={styles.specSpan}>Số lượng khả dụng</Text>
              <Text style={styles.specStrong}>
                {p.available.toLocaleString("vi-VN")} {p.unit}
              </Text>
            </View>
            <View style={styles.specBox}>
              <Text style={styles.specSpan}>Xuất xứ</Text>
              <Text style={styles.specStrong}>
                {p.originProvince || v.location || "Chưa cập nhật"}
              </Text>
            </View>
            <View style={styles.specBox}>
              <Text style={styles.specSpan}>Đặt trước</Text>
              <Text style={styles.specStrong}>
                {p.preorderEnabled
                  ? `${p.preorderLeadDays || 3} ngày chuẩn bị`
                  : "Có hỗ trợ"}
              </Text>
            </View>
          </View>

          {/* Vendor Note matching .vendor-note in Kaggri-Trade */}
          <View style={styles.vendorNote}>
            <View style={styles.vendorNoteIcon}>
              <MaterialIcons name="verified-user" size={18} color={colors.green} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.vendorNoteTitle}>{v.name}</Text>
              <Text style={styles.vendorNoteSub}>
                Nhà cung cấp đã xác minh trên Kaggri · {v.certification}
              </Text>
            </View>
          </View>

          {/* Notice matching .notice in Kaggri-Trade */}
          <View style={styles.notice}>
            <Text style={styles.noticeText}>
              Liên hệ hoặc đặt hàng theo số lượng tối thiểu{" "}
              <Text style={{ fontWeight: fontWeight.extrabold }}>
                {p.minQty} {p.unit}
              </Text>{" "}
              để nhận báo giá và lịch giao từ nhà cung cấp.
            </Text>
          </View>
        </View>

        {/* Panel: Thông tin nông sản matching .panel in Kaggri-Trade */}
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Thông tin nông sản</Text>
          <Text style={styles.descriptionText}>{p.description || p.note}</Text>

          <View style={styles.infoGrid}>
            {(p.quality && p.quality.length > 0
              ? p.quality.map(([label, value]) => ({ label, value }))
              : [
                  { label: "Giống", value: "Giống tuyển chọn" },
                  { label: "Phân loại", value: "Loại 1 (Chuẩn B2B)" },
                  { label: "Đóng gói", value: "Thùng / Bao tiêu chuẩn" },
                  { label: "Bảo quản", value: "Kho mát 8 - 12°C" },
                  { label: "Hạn dùng", value: "10 ngày" },
                  { label: "Tình trạng", value: availabilityStatus },
                ]
            ).map((item, idx) => (
              <View key={idx} style={styles.infoBox}>
                <Text style={styles.specSpan}>{item.label}</Text>
                <Text style={styles.specStrong}>{item.value}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* B2B Quantity & Tier Selector */}
        <View style={styles.panel}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={styles.panelTitle}>Số lượng đặt mua ({p.unit})</Text>
            <Text style={styles.moqBadge}>
              Tối thiểu {p.minQty} {p.unit}
            </Text>
          </View>

          <View style={styles.qtyControlRow}>
            <Pressable
              onPress={() => setQty(Math.max(p.minQty || 10, qty - 10))}
              style={styles.qtyStepBtn}
            >
              <MaterialIcons name="remove" size={18} color={colors.dark} />
            </Pressable>
            <View style={styles.qtyDisplay}>
              <Text style={styles.qtyValueText}>{qty}</Text>
              <Text style={styles.qtyUnitText}>{p.unit}</Text>
            </View>
            <Pressable
              onPress={() => setQty(Math.min(p.available, qty + 10))}
              style={styles.qtyStepBtn}
            >
              <MaterialIcons name="add" size={18} color={colors.dark} />
            </Pressable>
          </View>

          <View style={styles.quickQtyRow}>
            {Array.from(new Set([p.minQty || 20, 50, 100, 300, 500]))
              .filter((preset) => preset >= (p.minQty || 1))
              .slice(0, 4)
              .map((preset) => (
              <Pressable
                key={preset}
                onPress={() => setQty(preset)}
                style={[styles.quickQtyChip, qty === preset && styles.quickQtyChipActive]}
              >
                <Text
                  style={[
                    styles.quickQtyChipText,
                    qty === preset && styles.quickQtyChipTextActive,
                  ]}
                >
                  {preset} {p.unit}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Bottom Sticky Purchase Bar styled in Kaggri-Trade palette */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        <View style={styles.bottomPriceCol}>
          <Text style={styles.bottomTotalLabel}>
            Tạm tính ({qty} {p.unit})
          </Text>
          <Text style={styles.bottomTotalValue}>{formatVND(totalPrice)}</Text>
        </View>
        <View style={styles.bottomBtns}>
          <Pressable
            onPress={handleAddToCart}
            style={({ pressed }) => [styles.outlineActionBtn, pressed && { opacity: 0.85 }]}
          >
            <MaterialIcons name="add-shopping-cart" size={16} color={colors.green} />
            <Text style={styles.outlineActionText}>Thêm giỏ</Text>
          </Pressable>
          <Pressable
            onPress={handleBuyNow}
            style={({ pressed }) => [styles.primaryActionBtn, pressed && { opacity: 0.9 }]}
          >
            <Text style={styles.primaryActionText}>Đặt mua ngay</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  siteHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.gutter,
    paddingVertical: 11,
    backgroundColor: colors.panel,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  headerIconBtn: {
    width: 34,
    height: 34,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  cartBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.green,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  cartBadgeText: {
    color: colors.white,
    fontSize: 9,
    fontWeight: fontWeight.bold,
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
  detailImage: {
    width: "100%",
    height: 220,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: "#eef1e5",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
  },
  detailPhoto: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    width: "100%",
    height: "100%",
  },
  detailPlaceholder: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: "#e1e8d5",
    alignItems: "center",
    justifyContent: "center",
  },
  detailEmoji: {
    fontSize: 48,
  },
  thumbnails: {
    flexDirection: "row",
    gap: 8,
  },
  thumbItem: {
    width: 58,
    height: 46,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: "#eef1e5",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
  },
  thumbPhoto: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    width: "100%",
    height: "100%",
  },
  thumbItemActive: {
    borderColor: colors.green,
    borderWidth: 1.5,
  },
  summarySection: {
    gap: 12,
    marginTop: 2,
  },
  summaryHead: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
  },
  eyebrow: {
    fontSize: 9.5,
    fontWeight: fontWeight.bold,
    color: colors.eyebrow,
    letterSpacing: 1.3,
    textTransform: "uppercase",
  },
  detailH1: {
    fontFamily: serifFont,
    fontSize: 26,
    lineHeight: 31,
    color: colors.dark,
    marginTop: 4,
  },
  detailPriceRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  detailPrice: {
    fontSize: 22,
    fontWeight: fontWeight.extrabold,
    color: colors.green,
  },
  detailPriceUnit: {
    fontSize: 13,
    color: colors.muted,
  },
  specGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -4,
    rowGap: 8,
  },
  specBox: {
    width: "50%",
    paddingHorizontal: 4,
  },
  specSpan: {
    fontSize: 10,
    color: colors.muted,
    backgroundColor: colors.panel,
    borderTopLeftRadius: borderRadius.md,
    borderTopRightRadius: borderRadius.md,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: colors.line,
    paddingHorizontal: 11,
    paddingTop: 9,
  },
  specStrong: {
    fontSize: 12,
    fontWeight: fontWeight.bold,
    color: colors.dark,
    backgroundColor: colors.panel,
    borderBottomLeftRadius: borderRadius.md,
    borderBottomRightRadius: borderRadius.md,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: colors.line,
    paddingHorizontal: 11,
    paddingBottom: 9,
    paddingTop: 2,
  },
  vendorNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: borderRadius.md,
    backgroundColor: colors.greenSoft,
    borderWidth: 1,
    borderColor: "#dce6cf",
  },
  vendorNoteIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.panel,
    alignItems: "center",
    justifyContent: "center",
  },
  vendorNoteTitle: {
    fontSize: 13,
    fontWeight: fontWeight.extrabold,
    color: colors.dark,
  },
  vendorNoteSub: {
    fontSize: 11,
    color: "#576555",
    marginTop: 2,
  },
  notice: {
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderRadius: borderRadius.md,
    backgroundColor: "#f7f4e9",
    borderWidth: 1,
    borderColor: "#e6dec8",
  },
  noticeText: {
    fontSize: 12,
    lineHeight: 18,
    color: "#6b5937",
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
  descriptionText: {
    fontSize: 13,
    lineHeight: 20,
    color: colors.text,
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -4,
    rowGap: 8,
  },
  infoBox: {
    width: "50%",
    paddingHorizontal: 4,
  },
  moqBadge: {
    fontSize: 11,
    fontWeight: fontWeight.bold,
    color: colors.green,
  },
  qtyControlRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  qtyStepBtn: {
    width: 38,
    height: 38,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyDisplay: {
    flex: 1,
    height: 38,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    backgroundColor: colors.panel,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  qtyValueText: {
    fontSize: 15,
    fontWeight: fontWeight.extrabold,
    color: colors.dark,
  },
  qtyUnitText: {
    fontSize: 12,
    color: colors.muted,
  },
  quickQtyRow: {
    flexDirection: "row",
    gap: 8,
  },
  quickQtyChip: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.bg,
    alignItems: "center",
  },
  quickQtyChipActive: {
    backgroundColor: colors.greenSoft,
    borderColor: colors.green,
  },
  quickQtyChipText: {
    fontSize: 11,
    fontWeight: fontWeight.semibold,
    color: colors.muted,
  },
  quickQtyChipTextActive: {
    color: colors.green,
    fontWeight: fontWeight.bold,
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.panel,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingHorizontal: spacing.gutter,
    paddingTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  bottomPriceCol: {
    flex: 1,
  },
  bottomTotalLabel: {
    fontSize: 10,
    color: colors.muted,
  },
  bottomTotalValue: {
    fontSize: 17,
    fontWeight: fontWeight.extrabold,
    color: colors.green,
    marginTop: 1,
  },
  bottomBtns: {
    flexDirection: "row",
    gap: 8,
  },
  outlineActionBtn: {
    height: 40,
    paddingHorizontal: 13,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.green,
    backgroundColor: colors.panel,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  outlineActionText: {
    fontSize: 12,
    fontWeight: fontWeight.bold,
    color: colors.green,
  },
  primaryActionBtn: {
    height: 40,
    paddingHorizontal: 16,
    borderRadius: borderRadius.md,
    backgroundColor: colors.green,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryActionText: {
    fontSize: 12,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
});
