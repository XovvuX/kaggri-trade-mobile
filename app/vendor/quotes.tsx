import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  Platform,
  Linking,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { colors, fontSize, fontWeight, spacing, borderRadius, shadows } from "@/theme";

interface QuotedItem {
  id: string;
  name: string;
  emoji: string;
  certLabel: string;
  certColor: string;
  lotCode: string;
  spec: string;
  qty: string;
  unit: string;
  unitPrice: string;
  originalPrice: string;
  discountPct: string;
}

const INITIAL_ITEMS: QuotedItem[] = [
  {
    id: "item1",
    name: "Cà chua Beef Đà Lạt loại 1",
    emoji: "🍅",
    certLabel: "VietGAP",
    certColor: colors.primary,
    lotCode: "LO-DL-20261015",
    spec: "Thùng carton 10kg có lót khay, bảo quản lạnh 8-12°C",
    qty: "1.000",
    unit: "kg",
    unitPrice: "42.000",
    originalPrice: "45.000",
    discountPct: "-6.6%",
  },
  {
    id: "item2",
    name: "Xà lách Thủy Canh Lollo Xanh",
    emoji: "🥬",
    certLabel: "OCOP 4★",
    certColor: colors.secondaryContainer,
    lotCode: "LO-LL-20261016",
    spec: "Thùng xốp màng thở 5kg, thu hoạch sáng sớm",
    qty: "300",
    unit: "kg",
    unitPrice: "40.000",
    originalPrice: "40.000",
    discountPct: "Giá sàn",
  },
];

export default function VendorQuotesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [validityHours, setValidityHours] = useState<number>(24);
  const [items, setItems] = useState<QuotedItem[]>(INITIAL_ITEMS);
  const [sellerNotes, setSellerNotes] = useState(
    "Cam kết độ tươi mới 100%, thu hái sáng sớm trước 05:00, dư lượng BVTV chuẩn test lab kiểm định Chi cục Trồng trọt. Hỗ trợ đổi trả 1:1 nếu dập nát quá 2% khi kiểm đếm tại dock bốc hàng xe lạnh."
  );

  // Financial calculations
  const calculateGrossTotal = () => {
    let sum = 0;
    items.forEach((item) => {
      const q = parseFloat(item.qty.replace(/\./g, "").replace(/,/g, "")) || 0;
      const p = parseFloat(item.unitPrice.replace(/\./g, "").replace(/,/g, "")) || 0;
      sum += q * p;
    });
    return sum;
  };

  const grossTotal = calculateGrossTotal(); // 54.000.000₫
  const volumeDiscount = 2000000;
  const buyerPayAmount = grossTotal - volumeDiscount; // 52.000.000₫
  const platformFee = Math.round(buyerPayAmount * 0.05); // 2.600.000₫ (5%)
  const netHtxPayout = buyerPayAmount - platformFee; // 49.400.000₫

  const handleUpdateItem = (id: string, field: "qty" | "unitPrice", val: string) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, [field]: val } : it))
    );
  };

  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) {
      Alert.alert("Thông báo", "Báo giá sỉ cần có ít nhất 1 mặt hàng nông sản.");
      return;
    }
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const handleAppendTemplate = (text: string) => {
    setSellerNotes((prev) => `${prev} ${text}`);
  };

  const handleSubmitQuote = () => {
    Alert.alert(
      "Xác thực chữ ký số & Gửi báo giá",
      "Báo giá chính thức #BG-20261016-8831 kèm điều khoản ký quỹ Escrow VOVU sẽ được gửi trực tiếp vào phòng hội thoại với Chuỗi Siêu Thị Thực Phẩm Xanh.",
      [
        { text: "Xem lại", style: "cancel" },
        {
          text: "Gửi báo giá ngay",
          onPress: () => {
            Alert.alert("Thành công!", "Đã gửi bảng báo giá sỉ đến Giám đốc Thu Mua!");
            router.push("/vendor/chat/buyer-green-food" as any);
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable onPress={() => router.back()} style={styles.iconBtn} hitSlop={8}>
            <MaterialIcons name="arrow-back" size={24} color={colors.onSurface} />
          </Pressable>
          <View>
            <Text style={styles.headerTitle}>Tạo Báo Giá Sỉ B2B</Text>
            <Text style={styles.headerSubtitle}>HTX NÔNG NGHIỆP LẠC DƯƠNG</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <Pressable
            onPress={() => Alert.alert("Lịch sử báo giá", "Hiển thị các báo giá đã phát hành trong tháng.")}
            style={styles.iconBtn}
            hitSlop={8}
          >
            <MaterialIcons name="history" size={22} color={colors.onSurfaceVariant} />
          </Pressable>
          <Pressable
            onPress={() => Alert.alert("Lưu nháp", "Đã lưu bản nháp báo giá thành công.")}
            style={styles.draftBtn}
            hitSlop={8}
          >
            <MaterialIcons name="drafts" size={16} color={colors.primary} />
            <Text style={styles.draftText}>Lưu nháp</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* 1. Sub-bar / HTX Status Banner */}
        <View style={styles.htxBanner}>
          <View style={styles.htxBannerTop}>
            <View style={styles.htxIconBox}>
              <MaterialIcons name="agriculture" size={18} color={colors.onPrimary} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Text style={styles.htxName}>HTX Lạc Dương</Text>
                <View style={styles.vietgapTag}>
                  <MaterialIcons name="verified" size={10} color={colors.onPrimary} />
                  <Text style={styles.vietgapTagText}>VietGAP</Text>
                </View>
              </View>
            </View>
            <View style={styles.htxIdBadge}>
              <Text style={styles.htxIdText}>#HTX-2024-LD</Text>
            </View>
          </View>

          <View style={styles.htxBannerBottom}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <View style={styles.pulseDot} />
              <Text style={styles.sessionTitle}>Tạo Báo Giá Đơn Lớn</Text>
              <Text style={styles.sessionSub}>(B2B Bulk Offer)</Text>
            </View>
            <View style={styles.sessionBadge}>
              <Text style={styles.sessionBadgeText}>Phiên sáng</Text>
            </View>
          </View>
        </View>

        {/* 2. Buyer Target Selection Card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderBetween}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <MaterialIcons name="domain" size={20} color={colors.primary} />
              <Text style={styles.cardTitle}>Khách hàng B2B nhận báo giá</Text>
            </View>
            <Pressable
              onPress={() => Alert.alert("Chọn đối tác", "Danh sách 156 khách hàng B2B thân thiết của HTX.")}
              style={styles.changePartnerBtn}
            >
              <Text style={styles.changePartnerText}>Đổi đối tác</Text>
              <MaterialIcons name="swap-horiz" size={16} color={colors.primary} />
            </Pressable>
          </View>

          <View style={styles.partnerBox}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.partnerName}>Chuỗi Siêu Thị Thực Phẩm Xanh</Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 3 }}>
                  <View style={styles.goldBadge}>
                    <MaterialIcons name="workspace-premium" size={12} color={colors.onSecondary} />
                    <Text style={styles.goldBadgeText}>B2B Gold</Text>
                  </View>
                  <Text style={styles.partnerMst}>• MST: 0312345678</Text>
                </View>
              </View>
            </View>

            <View style={styles.contactRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.contactName}>
                  Nguyễn Văn Tuấn <Text style={styles.contactRole}>(Trưởng ban Thu mua)</Text>
                </Text>
                <Text style={styles.contactPhone}>0912 345 678</Text>
              </View>
              <View style={styles.contactActionBtns}>
                <Pressable onPress={() => Linking.openURL("tel:0912345678")} style={styles.callIconBtn}>
                  <MaterialIcons name="call" size={16} color={colors.primary} />
                </Pressable>
                <Pressable
                  onPress={() => router.push("/vendor/chat/buyer-green-food" as any)}
                  style={styles.chatIconBtn}
                >
                  <MaterialIcons name="chat" size={16} color={colors.onPrimary} />
                </Pressable>
              </View>
            </View>

            <View style={styles.destinationRow}>
              <MaterialIcons name="local-shipping" size={16} color={colors.secondary} style={{ marginTop: 2 }} />
              <Text style={styles.destinationText}>
                <Text style={{ fontWeight: fontWeight.bold, color: colors.onSurface }}>Điểm nhận: </Text>
                Kho lạnh số 2, 123 Nguyễn Huệ, P. Bến Nghé, Q.1, TP.HCM
              </Text>
            </View>
          </View>
        </View>

        {/* 3. Quote Validity & Delivery Terms Card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderBetween}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <MaterialIcons name="timelapse" size={18} color={colors.secondary} />
              <Text style={styles.cardTitle}>Thời hạn giữ giá sỉ</Text>
            </View>
            <View style={styles.marketBadge}>
              <Text style={styles.marketBadgeText}>Theo phiên chợ</Text>
            </View>
          </View>

          {/* Validity Options (24h / 48h / 7d) */}
          <View style={styles.validityRow}>
            <Pressable
              onPress={() => setValidityHours(24)}
              style={[styles.validityBtn, validityHours === 24 && styles.validityBtnActive]}
            >
              <Text style={[styles.validityBtnTitle, validityHours === 24 && styles.validityBtnTitleActive]}>
                24 giờ
              </Text>
              <Text style={[styles.validityBtnSub, validityHours === 24 && { opacity: 0.85 }]}>
                (Khuyên dùng)
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setValidityHours(48)}
              style={[styles.validityBtn, validityHours === 48 && styles.validityBtnActive]}
            >
              <Text style={[styles.validityBtnTitle, validityHours === 48 && styles.validityBtnTitleActive]}>
                48 giờ
              </Text>
              <Text style={styles.validityBtnSub}>Tiêu chuẩn</Text>
            </Pressable>

            <Pressable
              onPress={() => setValidityHours(168)}
              style={[styles.validityBtn, validityHours === 168 && styles.validityBtnActive]}
            >
              <Text style={[styles.validityBtnTitle, validityHours === 168 && styles.validityBtnTitleActive]}>
                7 ngày
              </Text>
              <Text style={styles.validityBtnSub}>Hợp đồng</Text>
            </Pressable>
          </View>

          <View style={styles.validityNoteRow}>
            <MaterialIcons name="bolt" size={14} color={colors.secondary} />
            <Text style={styles.validityNoteText}>
              Giá giữ ổn định trong {validityHours}h theo biến động phiên đấu giá chợ đầu mối
            </Text>
          </View>

          {/* Delivery logistics terms */}
          <View style={styles.logisticsBox}>
            <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 6 }}>
              <MaterialIcons name="ac-unit" size={16} color={colors.primary} style={{ marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.logisticsLabel}>Hình thức giao nhận:</Text>
                <Text style={styles.logisticsDesc}>Xe tải lạnh chuyên dụng 4-8°C (Giao tận kho bên mua)</Text>
              </View>
            </View>

            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 }}>
              <MaterialIcons name="schedule" size={16} color={colors.primary} />
              <Text style={styles.logisticsDesc}>
                <Text style={{ fontWeight: fontWeight.bold }}>Khung giờ giao nhận: </Text>
                03:30 - 08:00 sáng mai (17/10)
              </Text>
            </View>

            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 }}>
              <MaterialIcons name="verified-user" size={16} color={colors.primary} />
              <Text style={styles.escrowGuaranteeText}>Bảo hộ thanh toán Escrow 100% qua VOVU</Text>
            </View>
          </View>
        </View>

        {/* 4. Quoted Commodity Items Matrix */}
        <View style={styles.itemsSection}>
          <View style={styles.cardHeaderBetween}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <MaterialIcons name="format-list-bulleted" size={20} color={colors.primary} />
              <Text style={styles.cardTitle}>Danh mục nông sản ({items.length} mặt hàng)</Text>
            </View>
            <Pressable
              onPress={() => Alert.alert("Thêm nông sản", "Mở danh mục nông sản kho HTX để thêm vào báo giá.")}
              style={styles.addItemBtn}
            >
              <MaterialIcons name="add" size={16} color={colors.onPrimary} />
              <Text style={styles.addItemBtnText}>Thêm nông sản</Text>
            </Pressable>
          </View>

          {/* Items List */}
          {items.map((item) => {
            const qtyNum = parseFloat(item.qty.replace(/\./g, "").replace(/,/g, "")) || 0;
            const priceNum = parseFloat(item.unitPrice.replace(/\./g, "").replace(/,/g, "")) || 0;
            const rowTotal = Math.round(qtyNum * priceNum);

            return (
              <View key={item.id} style={styles.itemCard}>
                <View style={styles.itemCardTop}>
                  <View style={styles.itemImgBox}>
                    <Text style={{ fontSize: 32 }}>{item.emoji}</Text>
                    <View style={[styles.itemCertBadge, { backgroundColor: item.certColor }]}>
                      <Text style={styles.itemCertText}>{item.certLabel}</Text>
                    </View>
                  </View>

                  <View style={styles.itemInfo}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                      <Pressable onPress={() => handleRemoveItem(item.id)} hitSlop={6}>
                        <MaterialIcons name="close" size={18} color={colors.outline} />
                      </Pressable>
                    </View>
                    <Text style={styles.itemLot}>Lô kho: <Text style={{ fontWeight: fontWeight.bold, color: colors.onSurface }}>{item.lotCode}</Text></Text>
                    <View style={styles.itemSpecBadge}>
                      <Text style={styles.itemSpecText} numberOfLines={1}>{item.spec}</Text>
                    </View>
                  </View>
                </View>

                {/* Editable Inputs */}
                <View style={styles.inputsGrid}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputFieldLabel}>Khối lượng chào sỉ</Text>
                    <View style={styles.inputWrap}>
                      <TextInput
                        value={item.qty}
                        onChangeText={(val) => handleUpdateItem(item.id, "qty", val)}
                        keyboardType="numeric"
                        style={styles.cellInput}
                      />
                      <View style={styles.unitPill}>
                        <Text style={styles.unitPillText}>{item.unit}</Text>
                      </View>
                    </View>
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputFieldLabel}>Đơn giá đề xuất</Text>
                    <View style={styles.inputWrap}>
                      <TextInput
                        value={item.unitPrice}
                        onChangeText={(val) => handleUpdateItem(item.id, "unitPrice", val)}
                        keyboardType="numeric"
                        style={styles.cellInput}
                      />
                      <Text style={styles.currencySuffix}>₫/{item.unit}</Text>
                    </View>
                  </View>
                </View>

                {/* Subtotal & Discount row */}
                <View style={styles.itemSubtotalRow}>
                  <View style={styles.discountTag}>
                    <MaterialIcons name="trending-down" size={12} color={colors.secondary} />
                    <Text style={styles.discountTagText}>
                      Chiết khấu {item.discountPct} (Niêm yết: {item.originalPrice}₫)
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={styles.subtotalText}>
                      Thành tiền: <Text style={styles.subtotalAmount}>{rowTotal.toLocaleString("vi-VN")}₫</Text>
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        {/* 5. Financial Summary & Reconciliation Preview Card */}
        <View style={styles.calcCard}>
          <View style={styles.cardHeaderBetween}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <MaterialIcons name="calculate" size={20} color={colors.primary} />
              <Text style={styles.cardTitle}>Dự toán thanh toán & Đối soát HTX</Text>
            </View>
            <View style={styles.autoCalcBadge}>
              <Text style={styles.autoCalcBadgeText}>Tự động tính</Text>
            </View>
          </View>

          <View style={styles.calcRows}>
            <View style={styles.calcRow}>
              <Text style={styles.calcRowLabel}>Tổng tiền hàng sỉ (1.300 kg)</Text>
              <Text style={styles.calcRowVal}>{grossTotal.toLocaleString("vi-VN")}₫</Text>
            </View>

            <View style={styles.calcRow}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <MaterialIcons name="sell" size={14} color={colors.secondary} />
                <Text style={[styles.calcRowLabel, { color: colors.secondary }]}>Chiết khấu khối lượng lớn (Volume)</Text>
              </View>
              <Text style={[styles.calcRowVal, { color: colors.secondary, fontWeight: fontWeight.bold }]}>
                -{volumeDiscount.toLocaleString("vi-VN")}₫
              </Text>
            </View>

            <View style={styles.calcRow}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <MaterialIcons name="shield" size={14} color={colors.error} />
                <Text style={[styles.calcRowLabel, { color: colors.error }]}>Phí bảo trợ sàn & Quỹ ký quỹ Escrow (5%)</Text>
              </View>
              <Text style={[styles.calcRowVal, { color: colors.error, fontWeight: fontWeight.bold }]}>
                -{platformFee.toLocaleString("vi-VN")}₫
              </Text>
            </View>

            <View style={styles.calcRow}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Text style={styles.calcRowLabel}>Thuế VAT nông sản sơ chế (NĐ 209)</Text>
                <MaterialIcons name="info-outline" size={14} color={colors.outline} />
              </View>
              <Text style={[styles.calcRowVal, { color: colors.primary, fontWeight: fontWeight.bold }]}>
                0₫ (Miễn thuế HTX)
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.calcRow}>
              <Text style={styles.buyerPayLabel}>Tổng bên mua thanh toán:</Text>
              <Text style={styles.buyerPayVal}>{buyerPayAmount.toLocaleString("vi-VN")}₫</Text>
            </View>
          </View>

          {/* Hero Net Payout Card */}
          <View style={styles.heroPayoutBox}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={styles.heroPayoutLabel}>HTX thực nhận sau đối soát trạm cân:</Text>
              <View style={styles.escrowGuaranteedBadge}>
                <Text style={styles.escrowGuaranteedText}>Đảm bảo Escrow</Text>
              </View>
            </View>
            <View style={{ flexDirection: "row", alignItems: "baseline", gap: 4, marginTop: 4 }}>
              <Text style={styles.heroPayoutAmount}>{netHtxPayout.toLocaleString("vi-VN")}₫</Text>
              <Text style={styles.heroPayoutUnit}>VNĐ</Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 }}>
              <MaterialIcons name="account-balance-wallet" size={14} color={colors.primary} />
              <Text style={styles.heroPayoutSub}>Giải ngân tự động trong 2h vào tài khoản Agribank sau nghiệm thu POD</Text>
            </View>
          </View>
        </View>

        {/* 6. Seller Note & Quality Guarantee */}
        <View style={styles.card}>
          <View style={styles.cardHeaderBetween}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <MaterialIcons name="verified" size={18} color={colors.primary} />
              <Text style={styles.cardTitle}>Cam kết chất lượng từ HTX</Text>
            </View>
            <Text style={styles.legalNoticeText}>Có giá trị pháp lý</Text>
          </View>

          <TextInput
            value={sellerNotes}
            onChangeText={setSellerNotes}
            multiline
            numberOfLines={3}
            style={styles.notesInput}
          />

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.templateChipsRow}>
            <Pressable
              onPress={() => handleAppendTemplate("Cam kết đạt chuẩn VietGAP 100%.")}
              style={styles.templateChip}
            >
              <Text style={styles.templateChipText}>+ Cam kết VietGAP</Text>
            </Pressable>
            <Pressable
              onPress={() => handleAppendTemplate("Đúng giờ giao xe lạnh trước 07:00.")}
              style={styles.templateChip}
            >
              <Text style={styles.templateChipText}>+ Đúng giờ giao xe lạnh</Text>
            </Pressable>
            <Pressable
              onPress={() => handleAppendTemplate("Đổi trả 1:1 trực tiếp tại trạm cân nếu không đạt độ già.")}
              style={styles.templateChip}
            >
              <Text style={styles.templateChipText}>+ Đổi trả trạm cân</Text>
            </Pressable>
          </ScrollView>
        </View>
      </ScrollView>

      {/* 7. Sticky Bottom Action Bar */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        <View style={styles.bottomButtonsRow}>
          <Pressable
            onPress={() => Alert.alert("Xem file PDF", "Đang mở bản xem trước báo giá PDF có chữ ký số...")}
            style={styles.pdfBtn}
          >
            <MaterialIcons name="picture-as-pdf" size={20} color={colors.primary} />
            <Text style={styles.pdfBtnText}>Xem file PDF</Text>
          </Pressable>

          <Pressable onPress={handleSubmitQuote} style={styles.sendQuoteBtn}>
            <MaterialIcons name="send" size={20} color={colors.onPrimary} />
            <Text style={styles.sendQuoteBtnText}>Gửi báo giá ngay</Text>
          </Pressable>
        </View>

        <View style={styles.signCertRow}>
          <MaterialIcons name="enhanced-encryption" size={13} color={colors.primary} />
          <Text style={styles.signCertText}>Báo giá xác thực chữ ký số HTX Nông Nghiệp Lạc Dương</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.gutter,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surfaceContainerLowest,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceContainerHigh,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: spacing.xs, flex: 1 },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: fontSize["title-md"], fontWeight: fontWeight.bold, color: colors.onSurface },
  headerSubtitle: { fontSize: 10, color: colors.outline, letterSpacing: 0.5, textTransform: "uppercase" },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 6 },
  draftBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.surfaceContainerLow,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
  },
  draftText: { fontSize: 11, fontWeight: fontWeight.semibold, color: colors.primary },
  scrollContent: { padding: spacing.gutter, gap: spacing.md, paddingBottom: 110 },
  htxBanner: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    gap: spacing.sm,
  },
  htxBannerTop: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  htxIconBox: {
    width: 28,
    height: 28,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.primaryContainer,
    alignItems: "center",
    justifyContent: "center",
  },
  htxName: { fontSize: fontSize["label-lg"], fontWeight: fontWeight.bold, color: colors.primary },
  vietgapTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    backgroundColor: colors.primaryFixed,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: borderRadius.full,
  },
  vietgapTagText: { fontSize: 9, fontWeight: fontWeight.bold, color: colors.onPrimaryFixedVariant },
  htxIdBadge: {
    backgroundColor: colors.surfaceContainerHigh,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  htxIdText: { fontSize: 10, color: colors.onSurfaceVariant, fontWeight: fontWeight.medium },
  htxBannerBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: colors.surfaceContainerHigh,
    paddingTop: 6,
  },
  pulseDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.secondaryContainer },
  sessionTitle: { fontSize: fontSize["label-md"], fontWeight: fontWeight.semibold, color: colors.onSurface },
  sessionSub: { fontSize: 11, color: colors.onSurfaceVariant },
  sessionBadge: {
    backgroundColor: colors.secondaryFixed + "55",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  sessionBadgeText: { fontSize: 9, fontWeight: fontWeight.bold, color: colors.secondary },
  card: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    gap: spacing.sm,
    ...shadows.sm,
  },
  cardHeaderBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cardTitle: { fontSize: fontSize["label-lg"], fontWeight: fontWeight.bold, color: colors.onSurface },
  changePartnerBtn: { flexDirection: "row", alignItems: "center", gap: 2 },
  changePartnerText: { fontSize: 11, fontWeight: fontWeight.semibold, color: colors.primary },
  partnerBox: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.xs,
  },
  partnerName: { fontSize: fontSize["label-lg"], fontWeight: fontWeight.bold, color: colors.onSurface },
  goldBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.secondaryContainer,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: borderRadius.full,
  },
  goldBadgeText: { fontSize: 9, fontWeight: fontWeight.bold, color: colors.onSecondaryContainer },
  partnerMst: { fontSize: 11, color: colors.onSurfaceVariant },
  contactRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: colors.surfaceContainerHigh,
    paddingTop: 6,
    marginTop: 2,
  },
  contactName: { fontSize: 12, fontWeight: fontWeight.semibold, color: colors.onSurface },
  contactRole: { fontWeight: fontWeight.normal, color: colors.onSurfaceVariant },
  contactPhone: { fontSize: 11, color: colors.outline, marginTop: 1 },
  contactActionBtns: { flexDirection: "row", gap: spacing.xs },
  callIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: "center",
    justifyContent: "center",
  },
  chatIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primaryContainer,
    alignItems: "center",
    justifyContent: "center",
  },
  destinationRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 4,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceContainerHigh,
    paddingTop: 6,
    marginTop: 2,
  },
  destinationText: { fontSize: 11, color: colors.onSurfaceVariant, flex: 1, lineHeight: 16 },
  marketBadge: {
    backgroundColor: colors.secondaryFixed + "44",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  marketBadgeText: { fontSize: 9, fontWeight: fontWeight.bold, color: colors.secondary },
  validityRow: { flexDirection: "row", gap: spacing.xs },
  validityBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: "center",
    justifyContent: "center",
  },
  validityBtnActive: { backgroundColor: colors.primary },
  validityBtnTitle: { fontSize: 12, fontWeight: fontWeight.semibold, color: colors.onSurface },
  validityBtnTitleActive: { color: colors.onPrimary, fontWeight: fontWeight.bold },
  validityBtnSub: { fontSize: 9, color: colors.onSurfaceVariant, marginTop: 1 },
  validityNoteRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  validityNoteText: { fontSize: 10, color: colors.onSurfaceVariant },
  logisticsBox: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    gap: 4,
    marginTop: 4,
  },
  logisticsLabel: { fontSize: 11, fontWeight: fontWeight.bold, color: colors.onSurface },
  logisticsDesc: { fontSize: 11, color: colors.onSurfaceVariant },
  escrowGuaranteeText: { fontSize: 10, fontWeight: fontWeight.bold, color: colors.primary },
  itemsSection: { gap: spacing.sm },
  addItemBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.primaryContainer,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: borderRadius.full,
  },
  addItemBtnText: { fontSize: 11, fontWeight: fontWeight.bold, color: colors.onPrimary },
  itemCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    gap: spacing.sm,
    ...shadows.sm,
  },
  itemCardTop: { flexDirection: "row", gap: spacing.sm },
  itemImgBox: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceContainerLow,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  itemCertBadge: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 1,
    alignItems: "center",
    borderBottomLeftRadius: borderRadius.md,
    borderBottomRightRadius: borderRadius.md,
  },
  itemCertText: { fontSize: 8, fontWeight: fontWeight.bold, color: colors.onPrimary },
  itemInfo: { flex: 1, minWidth: 0 },
  itemName: { fontSize: 13, fontWeight: fontWeight.bold, color: colors.onSurface, flex: 1 },
  itemLot: { fontSize: 10, color: colors.outline, marginTop: 1 },
  itemSpecBadge: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: borderRadius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 3,
  },
  itemSpecText: { fontSize: 9, color: colors.onSurfaceVariant },
  inputsGrid: { flexDirection: "row", gap: spacing.sm },
  inputFieldLabel: { fontSize: 10, color: colors.onSurfaceVariant, fontWeight: fontWeight.medium, marginBottom: 2 },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: borderRadius.md,
    paddingHorizontal: 8,
    height: 40,
  },
  cellInput: { flex: 1, fontSize: 15, fontWeight: fontWeight.bold, color: colors.onSurface },
  unitPill: {
    backgroundColor: colors.surfaceContainer,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  unitPillText: { fontSize: 10, color: colors.onSurfaceVariant, fontWeight: fontWeight.semibold },
  currencySuffix: { fontSize: 11, color: colors.outline, fontWeight: fontWeight.medium },
  itemSubtotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: colors.surfaceContainerHigh,
    paddingTop: 6,
  },
  discountTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: colors.secondaryFixed,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  discountTagText: { fontSize: 9, fontWeight: fontWeight.semibold, color: colors.onSecondaryFixed },
  subtotalText: { fontSize: 10, color: colors.outline },
  subtotalAmount: { fontSize: 13, fontWeight: fontWeight.bold, color: colors.primary },
  calcCard: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    gap: spacing.sm,
  },
  autoCalcBadge: {
    backgroundColor: colors.primaryFixed,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  autoCalcBadgeText: { fontSize: 9, fontWeight: fontWeight.bold, color: colors.primary },
  calcRows: { gap: 6 },
  calcRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  calcRowLabel: { fontSize: 11, color: colors.onSurfaceVariant },
  calcRowVal: { fontSize: 12, fontWeight: fontWeight.semibold, color: colors.onSurface },
  divider: { height: 1, backgroundColor: colors.surfaceContainerHigh, marginVertical: 2 },
  buyerPayLabel: { fontSize: 12, fontWeight: fontWeight.bold, color: colors.onSurface },
  buyerPayVal: { fontSize: 14, fontWeight: fontWeight.bold, color: colors.onSurface },
  heroPayoutBox: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginTop: 4,
    ...shadows.xs,
  },
  heroPayoutLabel: { fontSize: 11, fontWeight: fontWeight.medium, color: colors.onSurfaceVariant },
  escrowGuaranteedBadge: {
    backgroundColor: colors.primaryFixed,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: borderRadius.full,
  },
  escrowGuaranteedText: { fontSize: 8, fontWeight: fontWeight.bold, color: colors.onPrimaryFixedVariant },
  heroPayoutAmount: { fontSize: 24, fontWeight: fontWeight.bold, color: colors.primary },
  heroPayoutUnit: { fontSize: 11, fontWeight: fontWeight.semibold, color: colors.onSurfaceVariant },
  heroPayoutSub: { fontSize: 9, color: colors.onSurfaceVariant, flex: 1, lineHeight: 13 },
  legalNoticeText: { fontSize: 9, color: colors.outline },
  notesInput: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    fontSize: fontSize["body-sm"],
    color: colors.onSurface,
    lineHeight: 18,
    minHeight: 64,
    textAlignVertical: "top",
  },
  templateChipsRow: { flexDirection: "row", gap: spacing.xs, marginTop: 2 },
  templateChip: {
    backgroundColor: colors.surfaceContainer,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  templateChipText: { fontSize: 9, color: colors.onSurfaceVariant },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surfaceContainerLowest,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceContainerHigh,
    paddingHorizontal: spacing.gutter,
    paddingTop: 10,
    gap: 6,
    ...shadows.lg,
  },
  bottomButtonsRow: { flexDirection: "row", gap: spacing.sm },
  pdfBtn: {
    flex: 1,
    height: 46,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceContainerHigh,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  pdfBtnText: { fontSize: 12, fontWeight: fontWeight.bold, color: colors.onSurface },
  sendQuoteBtn: {
    flex: 1.5,
    height: 46,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    ...shadows.md,
  },
  sendQuoteBtnText: { fontSize: 12, fontWeight: fontWeight.bold, color: colors.onPrimary },
  signCertRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4 },
  signCertText: { fontSize: 9, color: colors.onSurfaceVariant },
});
