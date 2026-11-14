import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { colors, fontSize, fontWeight, spacing, borderRadius, serifFont } from "@/theme";
import { KaggriBrand } from "@/components/Header";
import { CategoryChip } from "@/components/CategoryChip";
import { ProductCard } from "@/components/ProductCard";
import { EmptyState } from "@/components/EmptyState";
import { productService, vendorService } from "@/services";
import { type KaggriCategory } from "@/services/api";
import { useCartStore } from "@/stores/cart-store";
import { useAuthStore } from "@/stores/auth-store";
import type { Product, Vendor } from "@/types";

type CategoryFilter = string;

const FALLBACK_CATEGORIES: Array<{ key: string; label: string }> = [
  { key: "all", label: "Tất cả nông sản" },
  { key: "fruit", label: "Trái cây" },
  { key: "vegetable", label: "Rau củ" },
  { key: "grain", label: "Gạo - Ngũ cốc" },
  { key: "herb", label: "Nông sản khô" },
  { key: "other", label: "Đặc sản vùng" },
];

const SORT_OPTIONS: Array<{ key: "newest" | "priceAsc" | "priceDesc"; label: string }> = [
  { key: "newest", label: "Mới nhất" },
  { key: "priceAsc", label: "Giá tăng dần" },
  { key: "priceDesc", label: "Giá giảm dần" },
];

function inferCategory(p: Product): string {
  if (p.categoryName) return p.categoryName;
  const n = p.name.toLowerCase();
  if (n.includes("gạo") || n.includes("lúa")) return "grain";
  if (n.includes("xoài") || n.includes("sầu riêng") || n.includes("cam") || n.includes("bưởi")) return "fruit";
  if (n.includes("cà chua") || n.includes("xà lách") || n.includes("cà rốt") || n.includes("bắp cải") || n.includes("rau")) return "vegetable";
  if (n.includes("tiêu") || n.includes("cà phê") || n.includes("điều")) return "herb";
  return "other";
}

export default function BuyerHomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<any>(null);
  const catalogYRef = useRef<number>(420);

  // Filter state matching Kaggri-Trade Catalog
  const [categories, setCategories] = useState<Array<{ key: string; label: string }>>(FALLBACK_CATEGORIES);
  const [isApiCategories, setIsApiCategories] = useState(false);
  const [selectedCat, setSelectedCat] = useState<CategoryFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [provinceFilter, setProvinceFilter] = useState("");
  const [availabilityFilter, setAvailabilityFilter] = useState<"ALL" | "IN_STOCK" | "PREORDER_AVAILABLE" | "OUT_OF_STOCK">("ALL");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "priceAsc" | "priceDesc">("newest");

  const [products, setProducts] = useState<Product[]>([]);
  const [totalProducts, setTotalProducts] = useState<number>(0);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);

  const cartItemCount = useCartStore((s) => s.totalQty());
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    productService.listCategories().then((res) => {
      if (res.isFromApi && res.items.length > 0) {
        setIsApiCategories(true);
        setCategories([
          { key: "all", label: "Tất cả nông sản" },
          ...res.items.map((c: KaggriCategory) => ({ key: c.id, label: c.name })),
        ]);
      }
    });
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const min = Number(minPrice.replace(/\D/g, ""));
      const max = Number(maxPrice.replace(/\D/g, ""));
      const [catalogRes, vends] = await Promise.all([
        productService.searchCatalog({
          categoryId: isApiCategories && selectedCat !== "all" ? selectedCat : undefined,
          search: searchQuery.trim() || undefined,
          province: provinceFilter.trim() || undefined,
          availability: availabilityFilter !== "ALL" ? availabilityFilter : undefined,
          minPrice: min > 0 ? min : undefined,
          maxPrice: max > 0 ? max : undefined,
          sort: sortBy,
        }),
        vendorService.list(),
      ]);
      setVendors(vends);

      if (catalogRes.isFromApi) {
        setProducts(catalogRes.items);
        setTotalProducts(catalogRes.total);
      } else {
        const vendorMap = new Map(vends.map((v) => [v.id, v]));
        const filtered = catalogRes.items.filter((p) => {
          const cat = inferCategory(p);
          if (!isApiCategories && selectedCat !== "all" && cat !== selectedCat) return false;
          const loc = p.originProvince || vendorMap.get(p.vendorId)?.location || "Lâm Đồng";
          if (
            provinceFilter.trim() &&
            !loc.toLowerCase().includes(provinceFilter.trim().toLowerCase())
          ) {
            return false;
          }
          return true;
        });
        setProducts(filtered);
        setTotalProducts(filtered.length);
      }
    } finally {
      setLoading(false);
    }
  }, [isApiCategories, selectedCat, searchQuery, provinceFilter, availabilityFilter, minPrice, maxPrice, sortBy]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const resetFilters = () => {
    setSelectedCat("all");
    setSearchQuery("");
    setProvinceFilter("");
    setAvailabilityFilter("ALL");
    setMinPrice("");
    setMaxPrice("");
    setSortBy("newest");
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Site Header matching .site-header in Kaggri-Trade */}
      <View style={styles.siteHeader}>
        <KaggriBrand compact />

        <View style={styles.headerActions}>
          <Pressable
            onPress={() => router.push("/buyer/cart")}
            style={styles.cartBtn}
            hitSlop={6}
          >
            <MaterialIcons name="shopping-bag" size={18} color={colors.dark} />
            {cartItemCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cartItemCount}</Text>
              </View>
            )}
          </Pressable>

          {isAuthenticated && user ? (
            <Pressable
              onPress={() => router.push("/(buyer)/profile")}
              style={styles.userChip}
            >
              <View style={styles.userAvatar}>
                <Text style={styles.userAvatarText}>
                  {user.name.slice(0, 1).toUpperCase()}
                </Text>
              </View>
              <Text style={styles.userName} numberOfLines={1}>
                {user.name.split(" ").slice(-1)[0]}
              </Text>
            </Pressable>
          ) : (
            <View style={{ flexDirection: "row", gap: 6 }}>
              <Pressable
                onPress={() => router.push("/auth/login?role=buyer")}
                style={styles.ghostHeaderBtn}
              >
                <Text style={styles.ghostHeaderBtnText}>Đăng nhập</Text>
              </Pressable>
              <Pressable
                onPress={() => router.push("/auth/register?role=buyer")}
                style={styles.primaryHeaderBtn}
              >
                <Text style={styles.primaryHeaderBtnText}>Tạo tài khoản</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero Section matching .hero in Kaggri-Trade/fe/src/catalog.tsx */}
        <View style={styles.hero}>
          <View style={styles.heroCopy}>
            <View style={styles.eyebrowPill}>
              <View style={styles.liveDot} />
              <Text style={styles.eyebrowPillText}>KẾT NỐI GIÁ TRỊ NÔNG SẢN</Text>
            </View>

            <Text style={styles.heroH1}>
              Nguồn nông sản tốt.{"\n"}
              <Text style={styles.heroH1Italic}>Khởi đầu hợp tác bền lâu.</Text>
            </Text>

            <Text style={styles.heroDesc}>
              Từ vùng trồng trù phú đến những thương vụ tin cậy. Khám phá nông sản chọn lọc từ các hợp tác xã và nhà vườn uy tín trên khắp Việt Nam.
            </Text>

            <View style={styles.heroActions}>
              <Pressable
                onPress={() =>
                  scrollRef.current?.scrollTo({ y: catalogYRef.current, animated: true })
                }
                style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.9 }]}
              >
                <Text style={styles.primaryBtnText}>Khám phá nông sản</Text>
                <MaterialIcons name="arrow-forward" size={16} color={colors.white} />
              </Pressable>
            </View>

            <View style={styles.heroProof}>
              <View style={styles.proofItem}>
                <Text style={styles.proofStrong}>500+</Text>
                <Text style={styles.proofSpan}>Nông sản chọn lọc</Text>
              </View>
              <View style={styles.proofItem}>
                <Text style={styles.proofStrong}>120+</Text>
                <Text style={styles.proofSpan}>Nhà vườn & HTX</Text>
              </View>
              <View style={styles.proofItem}>
                <Text style={styles.proofStrong}>34</Text>
                <Text style={styles.proofSpan}>Tỉnh thành kết nối</Text>
              </View>
            </View>
          </View>

          {/* Hero Visual Card + Floating Note */}
          <View style={styles.heroVisualWrap}>
            <View style={styles.heroVisualCard}>
              <View style={styles.visualSun} />
              <View style={styles.visualHillsBack} />
              <View style={styles.visualHillsFront} />
              <View style={styles.visualCenterIcon}>
                <MaterialIcons name="eco" size={36} color={colors.green} />
                <Text style={styles.visualCaption}>Vùng nguyên liệu chọn lọc</Text>
              </View>
            </View>
            {/* <View style={styles.floatingNote}>
              <View style={styles.noteIcon}>
                <MaterialIcons name="eco" size={16} color={colors.green} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.noteStrong}>Nông sản theo mùa</Text>
                <Text style={styles.noteSpan}>Minh bạch xuất xứ · Rõ sản lượng</Text>
              </View>
            </View> */}
          </View>
        </View>

        {/* Value Strip matching .value-strip in Kaggri-Trade */}
        <View style={styles.valueStrip}>
          {[
            {
              icon: "eco" as const,
              title: "Nông sản từ gốc",
              desc: "Thông tin vùng trồng, giống, phân loại và quy cách rõ ràng.",
            },
            {
              icon: "verified-user" as const,
              title: "Đối tác được xác minh",
              desc: "Nhà cung cấp hoàn tất hồ sơ và thỏa thuận hợp tác cùng Kaggri.",
            },
            {
              icon: "place" as const,
              title: "Kết nối vùng miền",
              desc: "Từ Tây Nguyên, Đồng bằng sông Cửu Long đến các vùng chuyên canh.",
            },
          ].map((v, i) => (
            <View key={i} style={styles.valueItem}>
              <View style={styles.valueIcon}>
                <MaterialIcons name={v.icon} size={16} color={colors.green} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.valueTitle}>{v.title}</Text>
                <Text style={styles.valueDesc}>{v.desc}</Text>
              </View>
            </View>
          ))}

          <Pressable
            onPress={() => router.push("/auth/login?role=vendor")}
            style={styles.valueCta}
          >
            <View>
              <Text style={styles.valueCtaSmall}>Dành cho nhà vườn & HTX</Text>
              <Text style={styles.valueCtaStrong}>Trở thành đối tác →</Text>
            </View>
            <MaterialIcons name="north-east" size={16} color={colors.green} />
          </Pressable>
        </View>

        {/* Catalog Section matching .catalog-section in Kaggri-Trade */}
        <View
          style={styles.catalogSection}
          onLayout={(e) => {
            catalogYRef.current = e.nativeEvent.layout.y;
          }}
        >
          <View style={styles.titleBlock}>
            <Text style={styles.eyebrow}>KHÁM PHÁ NGUỒN HÀNG</Text>
            <Text style={styles.sectionH1}>Nông sản dành cho bạn</Text>
            <Text style={styles.sectionSub}>
              Chọn danh mục, vùng trồng hoặc mức giá phù hợp với nhu cầu thu mua của bạn.
            </Text>
          </View>

          {/* Category Tabs matching .category-tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryTabs}
          >
            {categories.map((c) => (
              <CategoryChip
                key={c.key}
                label={c.label}
                active={selectedCat === c.key}
                onPress={() => setSelectedCat(c.key)}
              />
            ))}
          </ScrollView>

          {/* 2-Column Filter Box matching .catalog-filters on mobile (@media max-width: 600px) */}
          <View style={styles.catalogFilters}>
            <View style={styles.filterRowFull}>
              <Text style={styles.filterLabel}>Tìm kiếm nông sản</Text>
              <View style={styles.searchField}>
                <MaterialIcons name="search" size={16} color="#8a9387" />
                <TextInput
                  placeholder="Cà phê, xoài, gạo, hồ tiêu..."
                  placeholderTextColor="#9aa297"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  style={styles.searchFieldInput}
                />
                {searchQuery.length > 0 && (
                  <Pressable onPress={() => setSearchQuery("")} hitSlop={6}>
                    <MaterialIcons name="close" size={15} color={colors.muted} />
                  </Pressable>
                )}
              </View>
            </View>

            <View style={styles.filterTwoCol}>
              <View style={styles.filterCol}>
                <Text style={styles.filterLabel}>Tỉnh / vùng trồng</Text>
                <TextInput
                  placeholder="Lâm Đồng, Đắk Lắk..."
                  placeholderTextColor="#9aa297"
                  value={provinceFilter}
                  onChangeText={setProvinceFilter}
                  style={styles.filterInput}
                />
              </View>

              <View style={styles.filterCol}>
                <Text style={styles.filterLabel}>Tình trạng</Text>
                <Pressable
                  onPress={() =>
                    setAvailabilityFilter((prev) =>
                      prev === "ALL"
                        ? "IN_STOCK"
                        : prev === "IN_STOCK"
                        ? "PREORDER_AVAILABLE"
                        : prev === "PREORDER_AVAILABLE"
                        ? "OUT_OF_STOCK"
                        : "ALL"
                    )
                  }
                  style={styles.selectBox}
                >
                  <Text style={styles.selectBoxText} numberOfLines={1}>
                    {availabilityFilter === "ALL"
                      ? "Mọi tình trạng"
                      : availabilityFilter === "IN_STOCK"
                      ? "Có sẵn"
                      : availabilityFilter === "PREORDER_AVAILABLE"
                      ? "Nhận đặt trước"
                      : "Hết hàng"}
                  </Text>
                  <MaterialIcons name="expand-more" size={16} color={colors.muted} />
                </Pressable>
              </View>
            </View>

            <View style={styles.filterTwoCol}>
              <View style={styles.filterCol}>
                <Text style={styles.filterLabel}>Giá từ (VND)</Text>
                <TextInput
                  placeholder="20000"
                  placeholderTextColor="#9aa297"
                  keyboardType="numeric"
                  value={minPrice}
                  onChangeText={setMinPrice}
                  style={styles.filterInput}
                />
              </View>

              <View style={styles.filterCol}>
                <Text style={styles.filterLabel}>Giá đến (VND)</Text>
                <TextInput
                  placeholder="200000"
                  placeholderTextColor="#9aa297"
                  keyboardType="numeric"
                  value={maxPrice}
                  onChangeText={setMaxPrice}
                  style={styles.filterInput}
                />
              </View>
            </View>

            <View style={styles.filterActions}>
              <Pressable onPress={loadData} style={styles.filterPrimaryBtn}>
                <Text style={styles.filterPrimaryBtnText}>Lọc kết quả</Text>
              </Pressable>
              <Pressable onPress={resetFilters} style={styles.filterSecondaryBtn}>
                <Text style={styles.filterSecondaryBtnText}>Xóa lọc</Text>
              </Pressable>
            </View>
          </View>

          {/* Results bar matching .results-bar */}
          <View style={styles.resultsBar}>
            <Text style={styles.resultsCount}>
              Hiển thị <Text style={{ fontWeight: fontWeight.extrabold, color: colors.dark }}>{totalProducts || products.length}</Text> sản phẩm
            </Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 6 }}
            >
              {SORT_OPTIONS.map((s) => {
                const active = sortBy === s.key;
                return (
                  <Pressable
                    key={s.key}
                    onPress={() => setSortBy(s.key)}
                    style={[styles.sortPill, active && styles.sortPillActive]}
                  >
                    <Text style={[styles.sortPillText, active && styles.sortPillTextActive]}>
                      {s.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* 2-Column Product Grid matching .product-grid */}
          {loading ? (
            <View style={{ paddingVertical: 36, alignItems: "center" }}>
              <ActivityIndicator size="large" color={colors.green} />
            </View>
          ) : products.length === 0 ? (
            <EmptyState
              title="Chưa tìm thấy nông sản phù hợp"
              description="Hãy thử từ khóa khác hoặc mở rộng bộ lọc vùng trồng, mức giá để xem thêm nguồn hàng."
              actionLabel="Xem tất cả nông sản"
              onAction={resetFilters}
            />
          ) : (
            <View style={styles.productGrid}>
              {products.map((p) => {
                const v = vendors.find((vend) => vend.id === p.vendorId);
                const mainImg = p.images?.[0]?.src;
                return (
                  <View key={p.id} style={styles.gridCell}>
                    <ProductCard
                      product={{
                        id: p.id,
                        name: p.name,
                        price: p.unitPrice.toLocaleString("vi-VN"),
                        unit: p.unit,
                        emoji: p.image || "🌾",
                        image: mainImg,
                        vendor: p.vendorName || v?.shortName || "Nhà cung cấp",
                        location: p.originProvince || p.vendorProvince || v?.location || "Việt Nam",
                        stock:
                          p.availability === "IN_STOCK"
                            ? "instock"
                            : p.availability === "PREORDER_AVAILABLE"
                            ? "low"
                            : p.available > 0
                            ? "instock"
                            : "out",
                        availabilityStatus:
                          p.availability === "PREORDER_AVAILABLE"
                            ? "PREORDER"
                            : p.availability === "OUT_OF_STOCK"
                            ? "OUT_OF_STOCK"
                            : "IN_STOCK",
                        minOrder: `${p.minQty} ${p.unit}`,
                        category: inferCategory(p),
                      }}
                      onPress={() => router.push(`/buyer/product/${p.slug || p.id}`)}
                    />
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Partner Banner matching .partner-banner in Kaggri-Trade */}
        <View style={styles.partnerBanner}>
          <View style={{ gap: 6 }}>
            <Text style={styles.partnerEyebrow}>ĐỒNG HÀNH CÙNG NHÀ VƯỜN & HỢP TÁC XÃ</Text>
            <Text style={styles.partnerH2}>
              Đưa nông sản địa phương đến nhiều đối tác thu mua hơn.
            </Text>
            <Text style={styles.partnerDesc}>
              Giới thiệu mùa vụ, tiêu chuẩn canh tác và sản lượng khả dụng của bạn trên không gian trưng bày chuyên nghiệp của Kaggri.
            </Text>
          </View>
          <Pressable
            onPress={() => router.push("/auth/login?role=vendor")}
            style={styles.partnerBtn}
          >
            <Text style={styles.partnerBtnText}>Bắt đầu cùng Kaggri</Text>
            <MaterialIcons name="arrow-forward" size={16} color={colors.dark} />
          </Pressable>
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
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cartBtn: {
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
  userChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: borderRadius.full,
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: colors.line,
  },
  userAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.green,
    alignItems: "center",
    justifyContent: "center",
  },
  userAvatarText: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  userName: {
    fontSize: 11,
    fontWeight: fontWeight.bold,
    color: colors.dark,
    maxWidth: 85,
  },
  ghostHeaderBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: borderRadius.md,
  },
  ghostHeaderBtnText: {
    fontSize: 11,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  primaryHeaderBtn: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: borderRadius.md,
    backgroundColor: colors.green,
  },
  primaryHeaderBtnText: {
    fontSize: 11,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  scrollContent: {
    paddingHorizontal: spacing.gutter,
    paddingBottom: 96,
  },
  hero: {
    paddingTop: 18,
    paddingBottom: 14,
    gap: 16,
  },
  heroCopy: {
    gap: 10,
  },
  eyebrowPill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 7,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    backgroundColor: "#e7ecde",
    borderWidth: 1,
    borderColor: "#d8e0ce",
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#4b7b43",
  },
  eyebrowPillText: {
    fontSize: 9.5,
    fontWeight: fontWeight.extrabold,
    color: "#50654a",
    letterSpacing: 1.2,
  },
  heroH1: {
    fontFamily: serifFont,
    fontSize: 28,
    lineHeight: 34,
    color: colors.dark,
  },
  heroH1Italic: {
    fontFamily: serifFont,
    fontStyle: "italic",
    color: "#577447",
  },
  heroDesc: {
    fontSize: 13,
    lineHeight: 20,
    color: "#5f6b5f",
  },
  heroActions: {
    flexDirection: "row",
    marginTop: 4,
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.green,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: borderRadius.md,
  },
  primaryBtnText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: fontWeight.bold,
  },
  heroProof: {
    flexDirection: "row",
    gap: 18,
    marginTop: 6,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e2e6dc",
  },
  proofItem: {
    flex: 1,
  },
  proofStrong: {
    fontFamily: serifFont,
    fontSize: 18,
    fontWeight: fontWeight.bold,
    color: colors.dark,
  },
  proofSpan: {
    fontSize: 10,
    color: colors.muted,
    marginTop: 2,
  },
  heroVisualWrap: {
    gap: 8,
  },
  heroVisualCard: {
    height: 150,
    borderRadius: 14,
    backgroundColor: "#e9eedf",
    borderWidth: 1,
    borderColor: "#dfe6d6",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  visualSun: {
    position: "absolute",
    top: 18,
    right: 28,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#efe2b2",
  },
  visualHillsBack: {
    position: "absolute",
    bottom: -24,
    left: -20,
    right: 40,
    height: 75,
    borderRadius: 60,
    backgroundColor: "#c8d5ba",
  },
  visualHillsFront: {
    position: "absolute",
    bottom: -30,
    left: 50,
    right: -20,
    height: 75,
    borderRadius: 60,
    backgroundColor: "#9eb48f",
  },
  visualCenterIcon: {
    alignItems: "center",
    gap: 4,
    zIndex: 2,
  },
  visualCaption: {
    fontFamily: serifFont,
    fontSize: 13,
    color: colors.dark,
    fontStyle: "italic",
  },
  floatingNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: borderRadius.lg,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  noteIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.greenSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  noteStrong: {
    fontSize: 12,
    fontWeight: fontWeight.extrabold,
    color: colors.dark,
  },
  noteSpan: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 1,
  },
  valueStrip: {
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: borderRadius.xl,
    padding: 14,
    gap: 12,
    marginVertical: 8,
  },
  valueItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  valueIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.greenSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  valueTitle: {
    fontSize: 12,
    fontWeight: fontWeight.extrabold,
    color: colors.dark,
  },
  valueDesc: {
    fontSize: 11,
    color: colors.muted,
    lineHeight: 16,
    marginTop: 2,
  },
  valueCta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f3f6ee",
    borderRadius: borderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 2,
  },
  valueCtaSmall: {
    fontSize: 10,
    color: colors.muted,
  },
  valueCtaStrong: {
    fontSize: 12,
    fontWeight: fontWeight.extrabold,
    color: colors.green,
    marginTop: 1,
  },
  catalogSection: {
    paddingTop: 16,
    gap: 12,
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
  sectionH1: {
    fontFamily: serifFont,
    fontSize: 24,
    color: colors.dark,
  },
  sectionSub: {
    fontSize: 12,
    color: colors.muted,
    lineHeight: 18,
  },
  categoryTabs: {
    gap: 7,
    paddingVertical: 2,
  },
  catalogFilters: {
    backgroundColor: colors.filterBox,
    borderWidth: 1,
    borderColor: colors.filterBorder,
    borderRadius: borderRadius.lg,
    padding: 12,
    gap: 10,
  },
  filterRowFull: {
    gap: 5,
  },
  filterTwoCol: {
    flexDirection: "row",
    gap: 10,
  },
  filterCol: {
    flex: 1,
    gap: 5,
  },
  filterLabel: {
    fontSize: 11,
    fontWeight: fontWeight.bold,
    color: "#516153",
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
  searchFieldInput: {
    flex: 1,
    fontSize: 12,
    color: colors.text,
    paddingVertical: 0,
  },
  filterInput: {
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: borderRadius.md,
    paddingHorizontal: 10,
    height: 38,
    fontSize: 12,
    color: colors.text,
  },
  selectBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: borderRadius.md,
    paddingHorizontal: 10,
    height: 38,
  },
  selectBoxText: {
    fontSize: 12,
    color: colors.text,
    flex: 1,
  },
  filterActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 2,
  },
  filterPrimaryBtn: {
    flex: 1,
    height: 36,
    backgroundColor: colors.green,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  filterPrimaryBtnText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: fontWeight.bold,
  },
  filterSecondaryBtn: {
    paddingHorizontal: 14,
    height: 36,
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: "#d8ded3",
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  filterSecondaryBtnText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: fontWeight.bold,
  },
  resultsBar: {
    gap: 8,
    marginTop: 2,
  },
  resultsCount: {
    fontSize: 12,
    color: colors.muted,
  },
  sortPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: borderRadius.md,
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.line,
  },
  sortPillActive: {
    backgroundColor: colors.greenSoft,
    borderColor: colors.green,
  },
  sortPillText: {
    fontSize: 11,
    fontWeight: fontWeight.semibold,
    color: colors.muted,
  },
  sortPillTextActive: {
    color: colors.green,
    fontWeight: fontWeight.bold,
  },
  productGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -5,
    rowGap: 10,
  },
  gridCell: {
    width: "50%",
    paddingHorizontal: 5,
  },
  partnerBanner: {
    marginTop: 24,
    backgroundColor: "#244c36",
    borderRadius: 12,
    padding: 20,
    gap: 14,
  },
  partnerEyebrow: {
    fontSize: 9.5,
    fontWeight: fontWeight.extrabold,
    color: "#c8d8be",
    letterSpacing: 1.4,
  },
  partnerH2: {
    fontFamily: serifFont,
    fontSize: 22,
    lineHeight: 27,
    color: "#f7f8f2",
  },
  partnerDesc: {
    fontSize: 12,
    lineHeight: 18,
    color: "#d4dfd0",
  },
  partnerBtn: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: "#f3f4ec",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: borderRadius.md,
  },
  partnerBtnText: {
    fontSize: 12,
    fontWeight: fontWeight.extrabold,
    color: colors.dark,
  },
});
