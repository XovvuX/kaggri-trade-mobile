import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { colors, fontSize, fontWeight, spacing, borderRadius, serifFont } from "@/theme";
import { KaggriBrand } from "@/components/Header";
import { StatusBadge } from "@/components/StatusBadge";
import { EmptyState } from "@/components/EmptyState";
import { vendorProductService, formatSaleUnit } from "@/services";
import {
  resolveImageSource,
  resolveProductImageUrl,
  type KaggriVendorProduct,
} from "@/services/api";

type VendorProductItem = {
  id: string;
  sku: string;
  name: string;
  category: string;
  unitPriceVnd: number;
  saleUnit: string;
  onHandQuantity: number;
  reservedQuantity: number;
  reviewStatus: string;
  visibilityStatus: string;
  emoji: string;
  imageUrl?: string;
};

function mapKaggriVendorProductToItem(p: KaggriVendorProduct): VendorProductItem {
  const rev = p.revisions?.[0] || p.publishedRevision;
  const name = rev?.name || p.sku;
  const category = rev?.category?.name || "Nông sản";
  const text = `${name} ${category}`.toLowerCase();
  const emoji = text.includes("cà chua")
    ? "🍅"
    : text.includes("cải") || text.includes("xà lách") || text.includes("rau")
    ? "🥬"
    : text.includes("cà rốt") || text.includes("khoai")
    ? "🥕"
    : text.includes("xoài") || text.includes("cam") || text.includes("sầu riêng")
    ? "🥭"
    : "🌿";
  const mainImg = rev?.images?.find((i) => i.isMain) || rev?.images?.[0];
  return {
    id: p.id,
    sku: p.sku,
    name,
    category,
    unitPriceVnd: Number(rev?.unitPriceVnd || 0),
    saleUnit: formatSaleUnit(rev?.saleUnit),
    onHandQuantity: Number(p.inventory?.onHandQuantity ?? 0),
    reservedQuantity: Number(p.inventory?.reservedQuantity ?? 0),
    reviewStatus: rev?.status || "DRAFT",
    visibilityStatus: p.visibility || "HIDDEN",
    emoji,
    imageUrl: resolveProductImageUrl(p.id, mainImg),
  };
}

const VENDOR_PRODUCTS: VendorProductItem[] = [
  {
    id: "1",
    sku: "TC-DL-001",
    name: "Cà chua Beef Đà Lạt VietGAP",
    category: "Rau củ",
    unitPriceVnd: 45000,
    saleUnit: "kg",
    onHandQuantity: 2500,
    reservedQuantity: 320,
    reviewStatus: "APPROVED",
    visibilityStatus: "ACTIVE",
    emoji: "🍅",
    imageUrl: "https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c3/Organic_home-grown_tomatoes_-_unripe_to_ripe.jpg/960px-Organic_home-grown_tomatoes_-_unripe_to_ripe.jpg",
  },
  {
    id: "2",
    sku: "XL-LD-002",
    name: "Xà lách Thủy Canh Lollo Xanh",
    category: "Rau củ",
    unitPriceVnd: 40000,
    saleUnit: "kg",
    onHandQuantity: 180,
    reservedQuantity: 50,
    reviewStatus: "APPROVED",
    visibilityStatus: "ACTIVE",
    emoji: "🥬",
    imageUrl: "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/19/Hydroponic_Kheti_Lettuce.jpg/960px-Hydroponic_Kheti_Lettuce.jpg",
  },
  {
    id: "3",
    sku: "CR-DL-003",
    name: "Cà rốt baby Đà Lạt",
    category: "Rau củ",
    unitPriceVnd: 22000,
    saleUnit: "kg",
    onHandQuantity: 1800,
    reservedQuantity: 200,
    reviewStatus: "APPROVED",
    visibilityStatus: "ACTIVE",
    emoji: "🥕",
    imageUrl: "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a2/Vegetable-Carrot-Bundle-wStalks.jpg/960px-Vegetable-Carrot-Bundle-wStalks.jpg",
  },
  {
    id: "4",
    sku: "SR-KP-004",
    name: "Xoài cát Hòa Lộc",
    category: "Trái cây",
    unitPriceVnd: 67500,
    saleUnit: "kg",
    onHandQuantity: 0,
    reservedQuantity: 0,
    reviewStatus: "APPROVED",
    visibilityStatus: "OUT_OF_STOCK",
    emoji: "🥭",
    imageUrl: "https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d5/Alphonso_Mango_In_a_non-ripe_state.jpg/960px-Alphonso_Mango_In_a_non-ripe_state.jpg",
  },
  {
    id: "5",
    sku: "BC-LD-005",
    name: "Bắp cải trái tim Đà Lạt",
    category: "Rau củ",
    unitPriceVnd: 16800,
    saleUnit: "kg",
    onHandQuantity: 600,
    reservedQuantity: 0,
    reviewStatus: "PENDING_REVIEW",
    visibilityStatus: "HIDDEN",
    emoji: "🥬",
    imageUrl: "https://thumb.wikimedia.org/wikipedia/commons/thumb/6/69/Brassica_rapa_subsp._pekinensis_%27Manoko%27_kz01.jpg/960px-Brassica_rapa_subsp._pekinensis_%27Manoko%27_kz01.jpg",
  },
];

export default function VendorProductsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");
  const [reviewFilter, setReviewFilter] = useState<string>("ALL");
  const [visibilityFilter, setVisibilityFilter] = useState<string>("ALL");
  const [apiItems, setApiItems] = useState<VendorProductItem[] | null>(null);
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});

  const loadProducts = useCallback(async () => {
    try {
      const page = await vendorProductService.list({
        search: search.trim() || undefined,
        reviewStatus: reviewFilter !== "ALL" ? reviewFilter : undefined,
        visibility: visibilityFilter !== "ALL" ? visibilityFilter : undefined,
      });
      setApiItems(page.items.map(mapKaggriVendorProductToItem));
    } catch {
      setApiItems(null);
    }
  }, [search, reviewFilter, visibilityFilter]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const baseList = apiItems ?? VENDOR_PRODUCTS;
  const filtered = baseList.filter((p) => {
    if (reviewFilter !== "ALL" && p.reviewStatus !== reviewFilter) return false;
    if (visibilityFilter !== "ALL" && p.visibilityStatus !== visibilityFilter) return false;
    if (
      search.trim() &&
      !p.name.toLowerCase().includes(search.toLowerCase()) &&
      !p.sku.toLowerCase().includes(search.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Workspace Header matching Kaggri-Trade */}
      <View style={styles.topHeader}>
        <KaggriBrand compact />
        <Pressable
          onPress={() => router.push("/vendor/product-edit")}
          style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.9 }]}
        >
          <MaterialIcons name="add" size={16} color={colors.white} />
          <Text style={styles.primaryBtnText}>Thêm sản phẩm</Text>
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 90 }]}
      >
        {/* Title matching ProductList in Kaggri-Trade/fe/src/products.tsx */}
        <View style={styles.titleBlock}>
          <Text style={styles.eyebrow}>BƯỚC 03 · ĐƯA NÔNG SẢN LÊN KAGGRI</Text>
          <Text style={styles.h1}>Sản phẩm của tôi</Text>
          <Text style={styles.subtitle}>
            Quản lý thông tin nông sản, trạng thái xét duyệt, hiển thị và tồn kho.
          </Text>
        </View>

        {/* Toolbar matching .toolbar in Kaggri-Trade */}
        <View style={styles.toolbar}>
          <View style={styles.searchField}>
            <MaterialIcons name="search" size={16} color="#8a9387" />
            <TextInput
              placeholder="Tìm theo tên hoặc mã sản phẩm..."
              placeholderTextColor="#9aa297"
              value={search}
              onChangeText={setSearch}
              style={styles.searchInput}
            />
            {search.length > 0 && (
              <Pressable onPress={() => setSearch("")} hitSlop={6}>
                <MaterialIcons name="close" size={15} color={colors.muted} />
              </Pressable>
            )}
          </View>

          <View style={styles.filterRow}>
            <Pressable
              onPress={() =>
                setReviewFilter((prev) =>
                  prev === "ALL"
                    ? "APPROVED"
                    : prev === "APPROVED"
                    ? "PENDING_REVIEW"
                    : prev === "PENDING_REVIEW"
                    ? "DRAFT"
                    : "ALL"
                )
              }
              style={styles.filterSelect}
            >
              <Text style={styles.filterSelectLabel}>Xét duyệt:</Text>
              <Text style={styles.filterSelectValue} numberOfLines={1}>
                {reviewFilter === "ALL" ? "Tất cả" : reviewFilter}
              </Text>
              <MaterialIcons name="expand-more" size={15} color={colors.muted} />
            </Pressable>

            <Pressable
              onPress={() =>
                setVisibilityFilter((prev) =>
                  prev === "ALL"
                    ? "ACTIVE"
                    : prev === "ACTIVE"
                    ? "OUT_OF_STOCK"
                    : prev === "OUT_OF_STOCK"
                    ? "HIDDEN"
                    : "ALL"
                )
              }
              style={styles.filterSelect}
            >
              <Text style={styles.filterSelectLabel}>Hiển thị:</Text>
              <Text style={styles.filterSelectValue} numberOfLines={1}>
                {visibilityFilter === "ALL" ? "Tất cả" : visibilityFilter}
              </Text>
              <MaterialIcons name="expand-more" size={15} color={colors.muted} />
            </Pressable>
          </View>
        </View>

        {/* Product Table / List Panel matching .panel in Kaggri-Trade */}
        {filtered.length === 0 ? (
          <EmptyState
            title="Chưa có sản phẩm nào"
            description="Hãy thêm nông sản đầu tiên để giới thiệu mùa vụ và nguồn hàng của bạn trên Kaggri."
            actionLabel="Thêm sản phẩm"
            onAction={() => router.push("/vendor/product-edit")}
          />
        ) : (
          <View style={styles.listPanel}>
            {filtered.map((p, index) => {
              const imgSource = resolveImageSource(p.imageUrl);
              return (
                <Pressable
                  key={p.id}
                  onPress={() => router.push(`/vendor/product-edit?id=${p.id}` as any)}
                  style={({ pressed }) => [
                    styles.productRow,
                    index > 0 && styles.productRowBorder,
                    pressed && { backgroundColor: colors.bg },
                  ]}
                >
                  <View style={styles.productRowTop}>
                    <View style={styles.emojiThumb}>
                      {imgSource && !brokenImages[p.id] ? (
                        <Image
                          source={imgSource}
                          style={{ width: "100%", height: "100%", borderRadius: borderRadius.md }}
                          resizeMode="cover"
                          onError={() =>
                            setBrokenImages((prev) => ({ ...prev, [p.id]: true }))
                          }
                        />
                      ) : (
                        <Text style={{ fontSize: 22 }}>{p.emoji}</Text>
                      )}
                    </View>

                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.productName} numberOfLines={1}>
                      {p.name}
                    </Text>
                    <Text style={styles.productMeta}>
                      {p.sku} · {p.category}
                    </Text>
                  </View>

                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={styles.priceText}>
                      {p.unitPriceVnd.toLocaleString("vi-VN")} ₫
                    </Text>
                    <Text style={styles.unitText}>/ {p.saleUnit}</Text>
                  </View>
                </View>

                <View style={styles.stockAndStatusRow}>
                  <View style={styles.stockBox}>
                    <Text style={styles.stockLabel}>Tồn thực tế / Giữ chỗ</Text>
                    <Text style={styles.stockValue}>
                      {p.onHandQuantity.toLocaleString("vi-VN")} {p.saleUnit}{" "}
                      <Text style={styles.stockSub}>
                        (Giữ chỗ {p.reservedQuantity} {p.saleUnit})
                      </Text>
                    </Text>
                  </View>

                  <View style={styles.badgesGroup}>
                    <StatusBadge status={p.reviewStatus} />
                    <StatusBadge status={p.visibilityStatus} />
                  </View>
                </View>

                <View style={styles.rowActions}>
                  <Pressable
                    onPress={() => router.push(`/vendor/inventory?id=${p.id}` as any)}
                    style={styles.secondaryActionBtn}
                  >
                    <MaterialIcons name="inventory" size={14} color={colors.text} />
                    <Text style={styles.secondaryActionText}>Tồn kho & đặt trước</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => router.push(`/vendor/product-edit?id=${p.id}` as any)}
                    style={styles.manageActionBtn}
                  >
                    <Text style={styles.manageActionText}>Quản lý →</Text>
                  </Pressable>
                </View>
              </Pressable>
              );
            })}
          </View>
        )}
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
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: colors.green,
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: borderRadius.md,
  },
  primaryBtnText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: fontWeight.bold,
  },
  scrollContent: {
    padding: spacing.gutter,
    gap: 14,
  },
  titleBlock: {
    gap: 4,
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
    lineHeight: 18,
  },
  toolbar: {
    backgroundColor: colors.filterBox,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.filterBorder,
    padding: 12,
    gap: 8,
  },
  searchField: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: borderRadius.md,
    paddingHorizontal: 10,
    height: 38,
    gap: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    color: colors.text,
    paddingVertical: 0,
  },
  filterRow: {
    flexDirection: "row",
    gap: 8,
  },
  filterSelect: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: borderRadius.md,
    paddingHorizontal: 10,
    height: 36,
    gap: 4,
  },
  filterSelectLabel: {
    fontSize: 11,
    color: colors.muted,
  },
  filterSelectValue: {
    flex: 1,
    fontSize: 11,
    fontWeight: fontWeight.bold,
    color: colors.dark,
  },
  listPanel: {
    backgroundColor: colors.panel,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    overflow: "hidden",
  },
  productRow: {
    padding: 14,
    gap: 10,
  },
  productRowBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  productRowTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  emojiThumb: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: "center",
    justifyContent: "center",
  },
  productName: {
    fontSize: 14,
    fontWeight: fontWeight.extrabold,
    color: colors.dark,
  },
  productMeta: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 2,
  },
  priceText: {
    fontSize: 14,
    fontWeight: fontWeight.extrabold,
    color: colors.greenAccent,
  },
  unitText: {
    fontSize: 10,
    color: colors.muted,
  },
  stockAndStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.bg,
    borderRadius: borderRadius.md,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#edf0e9",
  },
  stockBox: {
    flex: 1,
  },
  stockLabel: {
    fontSize: 10,
    color: colors.muted,
  },
  stockValue: {
    fontSize: 12,
    fontWeight: fontWeight.bold,
    color: colors.dark,
    marginTop: 1,
  },
  stockSub: {
    fontWeight: fontWeight.normal,
    color: colors.muted,
  },
  badgesGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  rowActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 2,
  },
  secondaryActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: "#d8ded3",
    backgroundColor: colors.panel,
  },
  secondaryActionText: {
    fontSize: 11,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  manageActionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  manageActionText: {
    fontSize: 12,
    fontWeight: fontWeight.extrabold,
    color: colors.green,
  },
});
