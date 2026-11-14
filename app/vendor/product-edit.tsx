import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Image,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { colors, fontSize, fontWeight, spacing, borderRadius, serifFont } from "@/theme";
import { KaggriBrand } from "@/components/Header";
import { Input } from "@/components/Input";
import { StatusBadge } from "@/components/StatusBadge";
import { productService, vendorProductService } from "@/services";
import {
  ApiError,
  resolveImageSource,
  resolveProductImageUrl,
  type KaggriCategory,
  type KaggriRevision,
} from "@/services/api";

const DEFAULT_CATEGORIES: Array<{ id: string; name: string }> = [
  { id: "rau-cu", name: "Rau củ" },
  { id: "trai-cay", name: "Trái cây" },
  { id: "gao-ngu-coc", name: "Gạo - Ngũ cốc" },
  { id: "nong-san-kho", name: "Nông sản khô" },
  { id: "dac-san-vung", name: "Đặc sản vùng" },
];

export default function VendorProductEditScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [productId, setProductId] = useState<string | undefined>(id);
  const [sku, setSku] = useState("TC-DL-001");
  const [revisionNumber, setRevisionNumber] = useState(2);
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>(DEFAULT_CATEGORIES);

  // Form state matching ProductEditor in Kaggri-Trade/fe/src/products.tsx
  const [name, setName] = useState(id ? "Cà chua Beef Đà Lạt VietGAP" : "");
  const [categoryId, setCategoryId] = useState("rau-cu");
  const [saleUnit, setSaleUnit] = useState("KG");
  const [unitPriceVnd, setUnitPriceVnd] = useState("45000");
  const [minimumOrderQuantity, setMinimumOrderQuantity] = useState("50");
  const [originProvince, setOriginProvince] = useState("Lâm Đồng");
  const [originDistrict, setOriginDistrict] = useState("Đà Lạt");
  const [variety, setVariety] = useState("Beef Hà Lan");
  const [grade, setGrade] = useState("Loại 1 (4-5 quả/kg)");
  const [packagingDescription, setPackagingDescription] = useState("Thùng carton 10kg có lót khay");
  const [storageCondition, setStorageCondition] = useState("Kho mát 8 - 12°C");
  const [shelfLifeDays, setShelfLifeDays] = useState("10");
  const [description, setDescription] = useState(
    "Cà chua Beef trồng nhà kính công nghệ cao tại Đà Lạt, thu hoạch chín cây buổi sáng, thịt dày, ít hạt, đạt tiêu chuẩn VietGAP."
  );

  const [reviewStatus, setReviewStatus] = useState<string>("APPROVED");
  const [visibilityStatus, setVisibilityStatus] = useState<string>("ACTIVE");
  const [revisions, setRevisions] = useState<KaggriRevision[]>([]);
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});
  const [notice, setNotice] = useState("");

  const showNotice = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(""), 3500);
  };

  useEffect(() => {
    let mounted = true;
    productService.listCategories().then((res) => {
      if (!mounted) return;
      if (res.items.length > 0) {
        setCategories(res.items.map((c: KaggriCategory) => ({ id: c.id, name: c.name })));
        if (!id) setCategoryId(res.items[0].id);
      }
    });
    if (id) {
      vendorProductService
        .getById(id)
        .then((prod) => {
          if (!mounted) return;
          setProductId(prod.id);
          setSku(prod.sku);
          setVisibilityStatus(prod.visibility || "HIDDEN");
          setRevisions(prod.revisions || []);
          const rev = prod.revisions?.[0] || prod.publishedRevision;
          if (rev) {
            setRevisionNumber(rev.revisionNumber || 1);
            setName(rev.name || "");
            if (rev.categoryId) setCategoryId(rev.categoryId);
            setSaleUnit(rev.saleUnit || "KG");
            setUnitPriceVnd(String(rev.unitPriceVnd || 0));
            setMinimumOrderQuantity(String(rev.minimumOrderQuantity || 1));
            setOriginProvince(rev.originProvince || "");
            setOriginDistrict(rev.originDistrict || "");
            setVariety(rev.variety || "");
            setGrade(rev.grade || "");
            setPackagingDescription(rev.packagingDescription || "");
            setStorageCondition(rev.storageCondition || "");
            setShelfLifeDays(rev.shelfLifeDays ? String(rev.shelfLifeDays) : "");
            setDescription(rev.description || "");
            setReviewStatus(rev.status || "DRAFT");
          }
        })
        .catch(() => {
          // Keep default demo data if offline or using demo ID
        });
    }
    return () => {
      mounted = false;
    };
  }, [id]);

  const handleSaveProduct = async () => {
    const payload = {
      name: name.trim() || "Nông sản Kaggri",
      categoryId,
      saleUnit: saleUnit.trim().toUpperCase() || "KG",
      unitPriceVnd: Number(unitPriceVnd) || 0,
      minimumOrderQuantity: Number(minimumOrderQuantity) || 1,
      originProvince: originProvince.trim() || undefined,
      originDistrict: originDistrict.trim() || undefined,
      variety: variety.trim() || undefined,
      grade: grade.trim() || undefined,
      packagingDescription: packagingDescription.trim() || undefined,
      storageCondition: storageCondition.trim() || undefined,
      shelfLifeDays: shelfLifeDays ? Number(shelfLifeDays) : undefined,
      description: description.trim(),
    };
    try {
      const saved = productId
        ? await vendorProductService.update(productId, payload)
        : await vendorProductService.create(payload);
      setProductId(saved.id);
      setSku(saved.sku);
      setRevisions(saved.revisions || []);
      const rev = saved.revisions?.[0];
      if (rev) {
        setRevisionNumber(rev.revisionNumber);
        setReviewStatus(rev.status);
      }
      showNotice("Đã lưu phiên bản sản phẩm trên Kaggri.");
    } catch (err) {
      if (err instanceof ApiError && err.status !== 0) {
        showNotice(err.message);
      } else {
        showNotice("Đã cập nhật thông tin sản phẩm.");
      }
    }
  };

  const handleSubmitReview = async () => {
    if (!productId) {
      await handleSaveProduct();
    }
    try {
      if (productId) {
        const res = await vendorProductService.submitForReview(productId);
        const rev = res.revisions?.[0];
        if (rev) setReviewStatus(rev.status);
      } else {
        setReviewStatus("PENDING_REVIEW");
      }
      showNotice("Đã gửi sản phẩm để Kaggri xét duyệt.");
    } catch (err) {
      setReviewStatus("PENDING_REVIEW");
      if (err instanceof ApiError && err.status !== 0) {
        showNotice(err.message);
      } else {
        showNotice("Đã gửi sản phẩm để Kaggri xét duyệt.");
      }
    }
  };

  const handleUpdateVisibility = async (vis: "ACTIVE" | "HIDDEN") => {
    try {
      if (productId) {
        const res = await vendorProductService.updateVisibility(productId, vis);
        setVisibilityStatus(res.visibility);
      } else {
        setVisibilityStatus(vis);
      }
      showNotice(
        vis === "ACTIVE"
          ? "Sản phẩm đã được hiển thị trên chợ nông sản."
          : "Đã tạm ẩn sản phẩm."
      );
    } catch (err) {
      setVisibilityStatus(vis);
      if (err instanceof ApiError && err.status !== 0) {
        showNotice(err.message);
      } else {
        showNotice(
          vis === "ACTIVE"
            ? "Sản phẩm đã được hiển thị trên chợ nông sản."
            : "Đã tạm ẩn sản phẩm."
        );
      }
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Workspace Header */}
      <View style={styles.topHeader}>
        <KaggriBrand compact />
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <StatusBadge status={reviewStatus} />
          <StatusBadge status={visibilityStatus} />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
      >
        {/* Back link matching .link-back in Kaggri-Trade */}
        <Pressable onPress={() => router.back()} style={styles.linkBack} hitSlop={8}>
          <Text style={styles.linkBackText}>← Sản phẩm của tôi</Text>
        </Pressable>

        {/* Title matching ProductEditor in Kaggri-Trade */}
        <View style={styles.titleBlock}>
          <Text style={styles.eyebrow}>CHI TIẾT SẢN PHẨM</Text>
          <Text style={styles.h1}>{name || "Thêm nông sản mới"}</Text>
          <Text style={styles.subtitle}>
            Mã SKU: {sku} · Phiên bản #{revisionNumber}
          </Text>
        </View>

        {notice ? (
          <View style={styles.noticeBox}>
            <MaterialIcons name="check-circle" size={16} color={colors.green} />
            <Text style={styles.noticeText}>{notice}</Text>
          </View>
        ) : null}

        {/* Panel 1: Thông tin sản phẩm */}
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Thông tin sản phẩm</Text>

          <View style={styles.formStack}>
            <Input
              label="Tên nông sản"
              value={name}
              onChangeText={setName}
              placeholder="Xoài cát Hòa Lộc loại 1"
            />

            <View>
              <Text style={styles.fieldLabel}>Danh mục</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 6 }}
              >
                {categories.map((c) => {
                  const active = categoryId === c.id;
                  return (
                    <Pressable
                      key={c.id}
                      onPress={() => setCategoryId(c.id)}
                      style={[styles.catChip, active && styles.catChipActive]}
                    >
                      <Text style={[styles.catChipText, active && styles.catChipTextActive]}>
                        {c.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            <View style={styles.twoCol}>
              <View style={{ flex: 1 }}>
                <Input
                  label="Đơn vị bán"
                  value={saleUnit}
                  onChangeText={setSaleUnit}
                  placeholder="kg, tấn, thùng..."
                />
              </View>
              <View style={{ flex: 1 }}>
                <Input
                  label="Giá bán (VND)"
                  value={unitPriceVnd}
                  onChangeText={setUnitPriceVnd}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.twoCol}>
              <View style={{ flex: 1 }}>
                <Input
                  label="Số lượng đặt tối thiểu"
                  value={minimumOrderQuantity}
                  onChangeText={setMinimumOrderQuantity}
                  keyboardType="numeric"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Input
                  label="Hạn sử dụng (ngày)"
                  value={shelfLifeDays}
                  onChangeText={setShelfLifeDays}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.twoCol}>
              <View style={{ flex: 1 }}>
                <Input
                  label="Tỉnh / vùng trồng"
                  value={originProvince}
                  onChangeText={setOriginProvince}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Input
                  label="Huyện / khu vực"
                  value={originDistrict}
                  onChangeText={setOriginDistrict}
                />
              </View>
            </View>

            <View style={styles.twoCol}>
              <View style={{ flex: 1 }}>
                <Input label="Giống" value={variety} onChangeText={setVariety} />
              </View>
              <View style={{ flex: 1 }}>
                <Input label="Phân loại" value={grade} onChangeText={setGrade} />
              </View>
            </View>

            <Input
              label="Quy cách đóng gói"
              value={packagingDescription}
              onChangeText={setPackagingDescription}
            />
            <Input
              label="Điều kiện bảo quản"
              value={storageCondition}
              onChangeText={setStorageCondition}
            />
            <Input
              label="Mô tả nông sản"
              value={description}
              onChangeText={setDescription}
              multiline
            />

            <Pressable
              onPress={handleSaveProduct}
              style={styles.primaryBtn}
            >
              <Text style={styles.primaryBtnText}>Lưu thay đổi</Text>
            </Pressable>
          </View>
        </View>

        {/* Panel 2: Ảnh sản phẩm */}
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Ảnh sản phẩm</Text>

          <View style={styles.mediaGrid}>
            {(revisions[0]?.images && revisions[0].images.length > 0
              ? revisions[0].images.map((img) => ({
                  id: img.id,
                  label: img.altText || "Ảnh sản phẩm",
                  primary: img.isMain,
                  emoji: "🍅",
                  src: resolveProductImageUrl(productId, img),
                }))
              : [
                  {
                    id: "m1",
                    label: "Ảnh đại diện lô hàng",
                    primary: true,
                    emoji: "🍅",
                    src: "https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c3/Organic_home-grown_tomatoes_-_unripe_to_ripe.jpg/960px-Organic_home-grown_tomatoes_-_unripe_to_ripe.jpg",
                  },
                  {
                    id: "m2",
                    label: "Ảnh quy cách đóng thùng",
                    primary: false,
                    emoji: "📦",
                    src: "https://thumb.wikimedia.org/wikipedia/commons/thumb/b/be/Picture_of_a_ripe_tomato.jpg/960px-Picture_of_a_ripe_tomato.jpg",
                  },
                ]
            ).map((m) => {
              const imgSource = resolveImageSource(m.src);
              return (
                <View key={m.id} style={styles.mediaCard}>
                  <View style={styles.mediaPreview}>
                    {imgSource && !brokenImages[m.id] ? (
                      <Image
                        source={imgSource}
                        style={{ width: "100%", height: "100%", borderRadius: borderRadius.sm }}
                        resizeMode="cover"
                        onError={() =>
                          setBrokenImages((prev) => ({ ...prev, [m.id]: true }))
                        }
                      />
                    ) : (
                      <Text style={{ fontSize: 28 }}>{m.emoji}</Text>
                    )}
                  </View>
                  <View style={styles.mediaRow}>
                    <Text style={styles.mediaLabel} numberOfLines={1}>
                      {m.primary ? "Ảnh chính" : "Ảnh phụ"}
                    </Text>
                    <Pressable hitSlop={6}>
                      <Text style={styles.deleteLink}>Xóa</Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>

          <Pressable
            onPress={() => Alert.alert("Thêm ảnh", "Chọn ảnh thực tế từ thư viện hoặc chụp tại vườn.")}
            style={styles.secondaryBtn}
          >
            <MaterialIcons name="add-a-photo" size={16} color={colors.text} />
            <Text style={styles.secondaryBtnText}>Thêm ảnh sản phẩm</Text>
          </Pressable>
        </View>

        {/* Panel 3: Gửi sản phẩm xét duyệt */}
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Gửi sản phẩm xét duyệt</Text>
          <Text style={styles.mutedText}>
            Sau khi hoàn thiện thông tin và hình ảnh, gửi sản phẩm để Kaggri kiểm tra trước khi hiển thị.
          </Text>
          <View style={styles.actionsRow}>
            <Pressable
              onPress={handleSubmitReview}
              style={styles.primaryBtn}
            >
              <Text style={styles.primaryBtnText}>Gửi duyệt</Text>
            </Pressable>
            <Pressable
              onPress={() =>
                router.push(
                  productId
                    ? (`/vendor/inventory?id=${productId}` as any)
                    : "/vendor/inventory"
                )
              }
              style={styles.secondaryBtn}
            >
              <Text style={styles.secondaryBtnText}>Quản lý tồn kho</Text>
            </Pressable>
          </View>
        </View>

        {/* Panel 4: Hiển thị sản phẩm */}
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Hiển thị sản phẩm</Text>
          <View style={styles.actionsRow}>
            <Pressable
              onPress={() => handleUpdateVisibility("ACTIVE")}
              style={styles.primaryBtn}
            >
              <Text style={styles.primaryBtnText}>Hiển thị bán</Text>
            </Pressable>
            <Pressable
              onPress={() => handleUpdateVisibility("HIDDEN")}
              style={styles.secondaryBtn}
            >
              <Text style={styles.secondaryBtnText}>Tạm ẩn</Text>
            </Pressable>
          </View>
        </View>

        {/* Panel 5: Phiên bản & lịch sử xét duyệt */}
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Phiên bản & lịch sử xét duyệt</Text>
          {(revisions.length > 0
            ? revisions.map((r) => ({
                num: r.revisionNumber,
                sub: `${Number(r.unitPriceVnd).toLocaleString("vi-VN")} ₫ / ${r.saleUnit.toLowerCase()}`,
                status: r.status,
              }))
            : [
                { num: 2, sub: "45.000 ₫ / kg · Đã duyệt hiển thị", status: "APPROVED" },
                { num: 1, sub: "42.000 ₫ / kg · Khởi tạo ban đầu", status: "ARCHIVED" },
              ]
          ).map((ver, idx) => (
            <View
              key={ver.num}
              style={[styles.versionItem, idx > 0 && styles.versionItemBorder]}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.versionStrong}>Phiên bản #{ver.num}</Text>
                <Text style={styles.versionSub}>{ver.sub}</Text>
              </View>
              <StatusBadge status={ver.status} />
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
    fontSize: 24,
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
  fieldLabel: {
    fontSize: 11,
    fontWeight: fontWeight.bold,
    color: "#516153",
    marginBottom: 6,
  },
  catChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: borderRadius.md,
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.inputBorder,
  },
  catChipActive: {
    backgroundColor: colors.green,
    borderColor: colors.green,
  },
  catChipText: {
    fontSize: 11,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  catChipTextActive: {
    color: colors.white,
  },
  twoCol: {
    flexDirection: "row",
    gap: 10,
  },
  primaryBtn: {
    flex: 1,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.green,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 14,
  },
  primaryBtnText: {
    fontSize: 12,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  secondaryBtn: {
    flex: 1,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: "#d8ded3",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 14,
  },
  secondaryBtnText: {
    fontSize: 12,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 8,
  },
  mutedText: {
    fontSize: 12,
    color: colors.muted,
    lineHeight: 18,
  },
  mediaGrid: {
    flexDirection: "row",
    gap: 10,
  },
  mediaCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: borderRadius.md,
    padding: 8,
    backgroundColor: colors.bg,
    gap: 6,
  },
  mediaPreview: {
    height: 84,
    borderRadius: borderRadius.sm,
    backgroundColor: "#eef1e5",
    alignItems: "center",
    justifyContent: "center",
  },
  mediaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  mediaLabel: {
    fontSize: 11,
    fontWeight: fontWeight.bold,
    color: colors.dark,
  },
  deleteLink: {
    fontSize: 11,
    fontWeight: fontWeight.bold,
    color: colors.badgeRedText,
  },
  versionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  versionItemBorder: {
    borderTopWidth: 1,
    borderTopColor: "#edf0e9",
    paddingTop: 10,
  },
  versionStrong: {
    fontSize: 12,
    fontWeight: fontWeight.bold,
    color: colors.dark,
  },
  versionSub: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 2,
  },
});
