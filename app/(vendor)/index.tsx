import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { colors, fontSize, fontWeight, spacing, borderRadius, serifFont } from "@/theme";
import { KaggriBrand } from "@/components/Header";
import { StatusBadge } from "@/components/StatusBadge";
import { onboardingService, vendorProductService } from "@/services";
import type { KaggriEligibility, KaggriProgress } from "@/services/api";

export default function VendorDashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [eligibility, setEligibility] = useState<KaggriEligibility | null>(null);
  const [progress, setProgress] = useState<KaggriProgress | null>(null);
  const [totalProducts, setTotalProducts] = useState<number>(12);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      onboardingService.getSellingEligibility().catch(() => null),
      onboardingService.getProgress().catch(() => null),
      vendorProductService.list({ page: 1, limit: 1 }).catch(() => null),
    ]).then(([elig, prog, prodPage]) => {
      if (!mounted) return;
      if (elig) setEligibility(elig);
      if (prog) setProgress(prog);
      if (prodPage) setTotalProducts(prodPage.pagination.total);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const isEligible = eligibility ? eligibility.eligible : true;
  const appStatus = progress?.application?.status || "APPROVED";
  const agreementStatus =
    progress?.application?.agreement?.status ||
    (eligibility?.requirements.agreementSigned ? "SIGNED" : "SIGNED");
  const docCount = progress?.application?.documents?.length ?? 3;
  const vendorDisplayName =
    progress?.application?.displayName || "HTX Nông Nghiệp Lạc Dương";

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Workspace Top Bar matching Kaggri-Trade */}
      <View style={styles.topHeader}>
        <KaggriBrand compact />
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Pressable
            onPress={() => router.push("/(buyer)")}
            style={styles.marketLinkBtn}
          >
            <MaterialIcons name="storefront" size={14} color={colors.green} />
            <Text style={styles.marketLinkText}>Chợ Nông Sản</Text>
          </Pressable>
          <Pressable
            onPress={() => router.push("/vendor/product-edit")}
            style={styles.addBtn}
          >
            <MaterialIcons name="add" size={15} color={colors.white} />
            <Text style={styles.addBtnText}>Đăng bán</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 90 }]}
      >
        {/* Page Title matching VendorOverview in Kaggri-Trade */}
        <View style={styles.titleBlock}>
          <Text style={styles.eyebrow}>KHÔNG GIAN NHÀ CUNG CẤP</Text>
          <Text style={styles.h1}>Cùng vun trồng cơ hội mới</Text>
          <Text style={styles.subtitle}>
            Hoàn thiện hồ sơ, xác nhận thỏa thuận hợp tác và đưa nông sản của bạn đến khách hàng trên Kaggri.
          </Text>
        </View>

        {/* Eligibility Banner matching .eligibility-banner in Kaggri-Trade */}
        <View style={styles.eligibilityBanner}>
          <View style={styles.eligibilityLeft}>
            <View style={styles.eligibilityIcon}>
              <MaterialIcons name="verified-user" size={20} color={colors.green} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.eligibilityTitle}>
                {isEligible
                  ? "Bạn đã đủ điều kiện hiển thị nông sản trên Kaggri"
                  : "Hoàn tất hồ sơ và thỏa thuận để đưa nông sản lên Kaggri"}
              </Text>
              <Text style={styles.eligibilitySub}>
                {isEligible
                  ? `Hồ sơ ${vendorDisplayName} và thỏa thuận hợp tác đã được xác nhận.`
                  : eligibility?.reasons?.join(" · ") ||
                    "Vui lòng hoàn thiện hồ sơ và ký thỏa thuận hợp tác."}
              </Text>
            </View>
          </View>
          <StatusBadge
            status={isEligible ? "APPROVED" : "PENDING_REVIEW"}
            label={isEligible ? "SẴN SÀNG BÁN HÀNG" : "ĐANG HOÀN THIỆN"}
          />
        </View>

        {/* 3 Step Cards matching .step-grid / .step-card in Kaggri-Trade */}
        <View style={styles.stepStack}>
          {/* Step 01 */}
          <Pressable
            onPress={() => router.push("/(vendor)/profile")}
            style={({ pressed }) => [styles.stepCard, pressed && { borderColor: "#b8c7b3" }]}
          >
            <View style={styles.stepTop}>
              <Text style={styles.stepNum}>01</Text>
              <StatusBadge status={appStatus} />
            </View>
            <Text style={styles.stepTitle}>Hồ sơ nhà cung cấp</Text>
            <Text style={styles.stepDesc}>
              Thông tin nhà vườn, hợp tác xã, vùng trồng, kho hàng và giấy tờ pháp lý.
            </Text>
            <Text style={styles.stepLink}>Cập nhật hồ sơ →</Text>
          </Pressable>

          {/* Step 02 */}
          <Pressable
            onPress={() => router.push("/(vendor)/profile")}
            style={({ pressed }) => [styles.stepCard, pressed && { borderColor: "#b8c7b3" }]}
          >
            <View style={styles.stepTop}>
              <Text style={styles.stepNum}>02</Text>
              <StatusBadge status={agreementStatus} />
            </View>
            <Text style={styles.stepTitle}>Thỏa thuận hợp tác</Text>
            <Text style={styles.stepDesc}>
              Cam kết minh bạch nguồn gốc, chất lượng nông sản và quy trình làm việc cùng Kaggri.
            </Text>
            <Text style={styles.stepLink}>Xem & ký thỏa thuận →</Text>
          </Pressable>

          {/* Step 03 */}
          <Pressable
            onPress={() => router.push("/(vendor)/products")}
            style={({ pressed }) => [styles.stepCard, pressed && { borderColor: "#b8c7b3" }]}
          >
            <View style={styles.stepTop}>
              <Text style={styles.stepNum}>03</Text>
              <StatusBadge status="ACTIVE" label={`${totalProducts} SẢN PHẨM`} />
            </View>
            <Text style={styles.stepTitle}>Đăng bán nông sản</Text>
            <Text style={styles.stepDesc}>
              Tạo sản phẩm, gửi duyệt thông tin, cập nhật tồn kho và hiển thị tới người mua.
            </Text>
            <Text style={styles.stepLink}>Quản lý sản phẩm →</Text>
          </Pressable>
        </View>

        {/* Panel: Tiến độ hồ sơ matching .panel in Kaggri-Trade */}
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Tiến độ hồ sơ</Text>
          <View style={styles.kvGrid}>
            {[
              { label: "Trạng thái hồ sơ", value: appStatus },
              { label: "Thỏa thuận hợp tác", value: agreementStatus },
              { label: "Tài liệu đã tải", value: `${docCount} tài liệu` },
              {
                label: "Ghi chú từ Kaggri",
                value: isEligible
                  ? "Đủ điều kiện niêm yết"
                  : progress?.nextActions?.[0] || "Hoàn thiện hồ sơ",
              },
            ].map((item, idx) => (
              <View key={idx} style={styles.kvBox}>
                <Text style={styles.kvLabel}>{item.label}</Text>
                <Text style={styles.kvStrong}>{item.value}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Panel: Vận hành & Thương vụ B2B (Keeping existing vovu modules styled in Kaggri) */}
        <View style={styles.panel}>
          <View style={styles.panelHeaderBetween}>
            <Text style={styles.panelTitle}>Hoạt động kinh doanh & Đối soát</Text>
            <StatusBadge status="ACTIVE" label="HÔM NAY" />
          </View>

          <View style={styles.quickGrid}>
            <Pressable
              onPress={() => router.push("/(vendor)/orders")}
              style={styles.quickBox}
            >
              <View style={styles.quickBoxHead}>
                <MaterialIcons name="local-shipping" size={18} color={colors.green} />
                <StatusBadge status="PENDING_REVIEW" label="1 ĐƠN MỚI" />
              </View>
              <Text style={styles.quickBoxTitle}>Đơn hàng B2B</Text>
              <Text style={styles.quickBoxSub}>5 đơn · 14,4M ₫ chờ xác nhận</Text>
            </Pressable>

            <Pressable
              onPress={() => router.push("/vendor/inventory")}
              style={styles.quickBox}
            >
              <View style={styles.quickBoxHead}>
                <MaterialIcons name="inventory" size={18} color={colors.green} />
                <StatusBadge status="IN_STOCK" label="KHO LẠNH" />
              </View>
              <Text style={styles.quickBoxTitle}>Tồn kho & Đặt trước</Text>
              <Text style={styles.quickBoxSub}>Cập nhật sản lượng khả dụng</Text>
            </Pressable>

            <Pressable
              onPress={() => router.push("/vendor/settlement")}
              style={styles.quickBox}
            >
              <View style={styles.quickBoxHead}>
                <MaterialIcons name="account-balance-wallet" size={18} color={colors.green} />
                <StatusBadge status="APPROVED" label="ESCROW" />
              </View>
              <Text style={styles.quickBoxTitle}>Ví & Đối soát</Text>
              <Text style={styles.quickBoxSub}>Khả dụng: 128.450.000 ₫</Text>
            </Pressable>

            <Pressable
              onPress={() => router.push("/vendor/quotes")}
              style={styles.quickBox}
            >
              <View style={styles.quickBoxHead}>
                <MaterialIcons name="request-quote" size={18} color={colors.amber} />
                <StatusBadge status="PREORDER" label="B2B" />
              </View>
              <Text style={styles.quickBoxTitle}>Báo giá & Đàm phán</Text>
              <Text style={styles.quickBoxSub}>Gửi báo giá lô sỉ cho đối tác</Text>
            </Pressable>
          </View>
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
  marketLinkBtn: {
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
  marketLinkText: {
    fontSize: 11,
    fontWeight: fontWeight.bold,
    color: colors.green,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: borderRadius.md,
    backgroundColor: colors.green,
  },
  addBtnText: {
    fontSize: 11,
    fontWeight: fontWeight.bold,
    color: colors.white,
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
  eligibilityBanner: {
    backgroundColor: colors.greenSoft,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: "#d7e3ca",
    padding: 15,
    gap: 10,
  },
  eligibilityLeft: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  eligibilityIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.panel,
    alignItems: "center",
    justifyContent: "center",
  },
  eligibilityTitle: {
    fontSize: 13,
    fontWeight: fontWeight.extrabold,
    color: colors.dark,
  },
  eligibilitySub: {
    fontSize: 11.5,
    color: "#576555",
    lineHeight: 17,
    marginTop: 2,
  },
  stepStack: {
    gap: 10,
  },
  stepCard: {
    backgroundColor: colors.panel,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 16,
    gap: 6,
  },
  stepTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  stepNum: {
    fontFamily: serifFont,
    fontSize: 22,
    fontWeight: fontWeight.bold,
    color: colors.green,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: fontWeight.extrabold,
    color: colors.dark,
  },
  stepDesc: {
    fontSize: 12,
    color: colors.muted,
    lineHeight: 18,
  },
  stepLink: {
    fontSize: 12,
    fontWeight: fontWeight.extrabold,
    color: colors.green,
    marginTop: 4,
  },
  panel: {
    backgroundColor: colors.panel,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 16,
    gap: 12,
  },
  panelHeaderBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  panelTitle: {
    fontSize: 14,
    fontWeight: fontWeight.extrabold,
    color: colors.dark,
  },
  kvGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -4,
    rowGap: 8,
  },
  kvBox: {
    width: "50%",
    paddingHorizontal: 4,
  },
  kvLabel: {
    fontSize: 10,
    color: colors.muted,
    backgroundColor: colors.bg,
    borderTopLeftRadius: borderRadius.md,
    borderTopRightRadius: borderRadius.md,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: colors.line,
    paddingHorizontal: 10,
    paddingTop: 8,
  },
  kvStrong: {
    fontSize: 12,
    fontWeight: fontWeight.bold,
    color: colors.dark,
    backgroundColor: colors.bg,
    borderBottomLeftRadius: borderRadius.md,
    borderBottomRightRadius: borderRadius.md,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: colors.line,
    paddingHorizontal: 10,
    paddingBottom: 8,
    paddingTop: 2,
  },
  quickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -4,
    rowGap: 8,
  },
  quickBox: {
    width: "50%",
    paddingHorizontal: 4,
  },
  quickBoxHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.bg,
    borderTopLeftRadius: borderRadius.md,
    borderTopRightRadius: borderRadius.md,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: colors.line,
    paddingHorizontal: 10,
    paddingTop: 10,
  },
  quickBoxTitle: {
    fontSize: 12,
    fontWeight: fontWeight.extrabold,
    color: colors.dark,
    backgroundColor: colors.bg,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 10,
    paddingTop: 6,
  },
  quickBoxSub: {
    fontSize: 10.5,
    color: colors.muted,
    backgroundColor: colors.bg,
    borderBottomLeftRadius: borderRadius.md,
    borderBottomRightRadius: borderRadius.md,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: colors.line,
    paddingHorizontal: 10,
    paddingBottom: 10,
    paddingTop: 2,
  },
});
