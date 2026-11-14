import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { colors, fontSize, fontWeight, spacing, borderRadius, serifFont } from "@/theme";
import { KaggriBrand } from "@/components/Header";
import { Input } from "@/components/Input";
import { StatusBadge } from "@/components/StatusBadge";
import { useAuthStore, mapKaggriUserToAppUser } from "@/stores/auth-store";
import { authService } from "@/services";
import { ApiError } from "@/services/api";

export default function BuyerProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const updateUser = useAuthStore((s) => s.updateUser);
  const logout = useAuthStore((s) => s.logout);
  const switchRole = useAuthStore((s) => s.setRole);

  const [fullName, setFullName] = useState(user?.name || "Nguyễn Minh Anh");
  const [email, setEmail] = useState(user?.email || "demo.buyer@example.com");
  const [phone, setPhone] = useState(user?.phone || "");
  const [accountStatus, setAccountStatus] = useState(user?.accountStatus || "ACTIVE");
  const [buyerType, setBuyerType] = useState<"INDIVIDUAL" | "BUSINESS">(
    user?.buyerType || "BUSINESS"
  );
  const [businessName, setBusinessName] = useState(user?.company || "");
  const [taxCode, setTaxCode] = useState(user?.taxCode || "");
  const [saving, setSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!isAuthenticated) return;
    let mounted = true;
    authService
      .getMe()
      .then((me) => {
        if (!mounted) return;
        const mapped = mapKaggriUserToAppUser(me, user?.token, user?.refreshToken);
        updateUser(mapped);
        setFullName(mapped.name);
        setEmail(mapped.email);
        setPhone(mapped.phone || "");
        setAccountStatus(mapped.accountStatus || "ACTIVE");
        setBuyerType(mapped.buyerType || "INDIVIDUAL");
        setBusinessName(mapped.company || "");
        setTaxCode(mapped.taxCode || "");
      })
      .catch(() => {
        // Keep cached store values if offline
      });
    return () => {
      mounted = false;
    };
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.siteHeader}>
          <KaggriBrand compact />
          <Pressable
            onPress={() => router.push("/auth/login?role=buyer")}
            style={styles.headerBtn}
          >
            <Text style={styles.headerBtnText}>Đăng nhập</Text>
          </Pressable>
        </View>

        <View style={styles.guestWrap}>
          <View style={styles.guestCard}>
            <View style={styles.guestIcon}>
              <MaterialIcons name="person-outline" size={28} color={colors.green} />
            </View>
            <Text style={styles.guestEyebrow}>TÀI KHOẢN CỦA TÔI</Text>
            <Text style={styles.guestTitle}>Chào mừng đến Kaggri Trade</Text>
            <Text style={styles.guestDesc}>
              Đăng nhập hoặc tạo tài khoản để quản lý hồ sơ thu mua doanh nghiệp, theo dõi đơn hàng và kết nối trực tiếp với nhà vườn, hợp tác xã.
            </Text>
            <View style={styles.guestActions}>
              <Pressable
                onPress={() => router.push("/auth/login?role=buyer&redirect=/(buyer)/profile")}
                style={styles.primaryBtn}
              >
                <Text style={styles.primaryBtnText}>Đăng nhập</Text>
                <MaterialIcons name="arrow-forward" size={16} color={colors.white} />
              </Pressable>
              <Pressable
                onPress={() => router.push("/auth/register?role=buyer&redirect=/(buyer)/profile")}
                style={styles.secondaryBtn}
              >
                <Text style={styles.secondaryBtnText}>Tạo tài khoản mới</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    );
  }

  const handleSave = async () => {
    setSaving(true);
    setErrorMsg("");
    setSavedNotice("");
    try {
      await authService.updateMe({
        fullName: fullName.trim(),
        phone: phone.trim() || undefined,
      });
      await authService.updateBuyerProfile({
        buyerType,
        companyName: businessName.trim() || undefined,
        taxCode: taxCode.trim() || undefined,
      });
      const me = await authService.getMe();
      updateUser(mapKaggriUserToAppUser(me, user?.token, user?.refreshToken));
      setSavedNotice("Đã lưu thông tin hồ sơ lên hệ thống Kaggri.");
    } catch (err) {
      if (err instanceof ApiError && err.status === 0) {
        updateUser({
          name: fullName.trim(),
          phone: phone.trim(),
          buyerType,
          company: businessName.trim(),
          taxCode: taxCode.trim(),
        });
        setSavedNotice("Đã lưu thông tin hồ sơ (chế độ ngoại tuyến).");
      } else if (err instanceof ApiError) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg("Không thể cập nhật hồ sơ. Vui lòng thử lại.");
      }
    } finally {
      setSaving(false);
      setTimeout(() => setSavedNotice(""), 3500);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Site Header */}
      <View style={styles.siteHeader}>
        <KaggriBrand compact />
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <StatusBadge status="ACTIVE" label={user?.role === "vendor" ? "VENDOR" : "BUYER"} />
          <Pressable
            onPress={async () => {
              await authService.logout();
              logout();
              router.replace("/auth/login");
            }}
            style={styles.headerBtn}
          >
            <Text style={styles.headerBtnText}>Đăng xuất</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 90 }]}
      >
        {/* Title Section matching Kaggri Title component */}
        <View style={styles.pageTitle}>
          <Text style={styles.eyebrow}>TÀI KHOẢN CỦA TÔI</Text>
          <Text style={styles.h1}>Hồ sơ cá nhân</Text>
          <Text style={styles.subtitle}>
            Quản lý thông tin liên hệ và thông tin giao dịch trên Kaggri.
          </Text>
        </View>

        {savedNotice ? (
          <View style={styles.noticeBox}>
            <MaterialIcons name="check-circle" size={16} color={colors.green} />
            <Text style={styles.noticeText}>{savedNotice}</Text>
          </View>
        ) : null}

        {errorMsg ? (
          <View style={[styles.noticeBox, { backgroundColor: colors.badgeRedBg, borderColor: "#ebcfc6" }]}>
            <MaterialIcons name="error-outline" size={16} color={colors.badgeRedText} />
            <Text style={[styles.noticeText, { color: colors.badgeRedText }]}>{errorMsg}</Text>
          </View>
        ) : null}

        {/* Profile Panel matching .profile-panel in Kaggri-Trade */}
        <View style={styles.profilePanel}>
          <View style={styles.profileBanner}>
            <View style={styles.profileAvatar}>
              <Text style={styles.profileAvatarText}>
                {(fullName || "K").slice(0, 1).toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.profileName}>{fullName}</Text>
              <Text style={styles.profileEmail}>{email}</Text>
            </View>
            <StatusBadge status="APPROVED" label="BUYER" />
          </View>

          <View style={styles.formStack}>
            <Input
              label="Họ và tên"
              value={fullName}
              onChangeText={setFullName}
            />
            <Input
              label="Email"
              value={email}
              editable={false}
              style={{ backgroundColor: "#f3f5ef", color: colors.muted }}
            />
            <Input
              label="Số điện thoại"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
            <Input
              label="Trạng thái tài khoản"
              value={accountStatus}
              editable={false}
              style={{ backgroundColor: "#f3f5ef", color: colors.badgeGreenText, fontWeight: "700" }}
            />

            <View>
              <Text style={styles.fieldLabel}>Hình thức mua hàng</Text>
              <View style={styles.buyerTypeRow}>
                <Pressable
                  onPress={() => setBuyerType("INDIVIDUAL")}
                  style={[
                    styles.buyerTypeBtn,
                    buyerType === "INDIVIDUAL" && styles.buyerTypeBtnActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.buyerTypeText,
                      buyerType === "INDIVIDUAL" && styles.buyerTypeTextActive,
                    ]}
                  >
                    Cá nhân
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setBuyerType("BUSINESS")}
                  style={[
                    styles.buyerTypeBtn,
                    buyerType === "BUSINESS" && styles.buyerTypeBtnActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.buyerTypeText,
                      buyerType === "BUSINESS" && styles.buyerTypeTextActive,
                    ]}
                  >
                    Doanh nghiệp / đại lý
                  </Text>
                </Pressable>
              </View>
            </View>

            <Input
              label="Tên doanh nghiệp"
              value={businessName}
              onChangeText={setBusinessName}
              placeholder="Công ty / đại lý thu mua"
            />
            <Input
              label="Mã số thuế"
              value={taxCode}
              onChangeText={setTaxCode}
              placeholder="0312345678"
              keyboardType="numeric"
            />

            <Pressable
              onPress={handleSave}
              disabled={saving}
              style={({ pressed }) => [
                styles.primaryBtn,
                pressed && { opacity: 0.9 },
                saving && { opacity: 0.6 },
              ]}
            >
              {saving ? (
                <ActivityIndicator color={colors.white} size="small" />
              ) : (
                <Text style={styles.primaryBtnText}>Cập nhật hồ sơ</Text>
              )}
            </Pressable>
          </View>
        </View>

        {/* Quick Workspace Navigation Panel */}
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Tiện ích giao dịch</Text>

          <Pressable
            onPress={() => router.push("/(buyer)/orders")}
            style={styles.menuRow}
          >
            <View style={styles.menuIcon}>
              <MaterialIcons name="receipt-long" size={18} color={colors.green} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.menuLabel}>Đơn hàng & Vận đơn B2B</Text>
              <Text style={styles.menuSub}>Theo dõi tiến độ giao nhận và hóa đơn VAT</Text>
            </View>
            <MaterialIcons name="chevron-right" size={20} color={colors.muted} />
          </Pressable>

          <Pressable
            onPress={() => router.push("/buyer/cart")}
            style={[styles.menuRow, styles.menuRowBorder]}
          >
            <View style={styles.menuIcon}>
              <MaterialIcons name="shopping-bag" size={18} color={colors.green} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.menuLabel}>Giỏ hàng thu mua</Text>
              <Text style={styles.menuSub}>Xem các lô nông sản đã chọn</Text>
            </View>
            <MaterialIcons name="chevron-right" size={20} color={colors.muted} />
          </Pressable>

          <Pressable
            onPress={() => router.push("/buyer/subscriptions" as any)}
            style={[styles.menuRow, styles.menuRowBorder]}
          >
            <View style={styles.menuIcon}>
              <MaterialIcons name="event-repeat" size={18} color={colors.green} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.menuLabel}>Đơn giao định kỳ</Text>
              <Text style={styles.menuSub}>Quản lý lịch thu mua lặp lại theo tuần</Text>
            </View>
            <MaterialIcons name="chevron-right" size={20} color={colors.muted} />
          </Pressable>

          <Pressable
            onPress={() => router.push("/buyer/dispute" as any)}
            style={[styles.menuRow, styles.menuRowBorder]}
          >
            <View style={styles.menuIcon}>
              <MaterialIcons name="report-problem" size={18} color={colors.green} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.menuLabel}>Khiếu nại & Tranh chấp</Text>
              <Text style={styles.menuSub}>Gửi yêu cầu xử lý sự cố giao nhận</Text>
            </View>
            <MaterialIcons name="chevron-right" size={20} color={colors.muted} />
          </Pressable>

          <Pressable
            onPress={() => {
              switchRole("vendor");
              router.replace("/(vendor)");
            }}
            style={[styles.menuRow, styles.menuRowBorder]}
          >
            <View style={[styles.menuIcon, { backgroundColor: colors.badgeAmberBg }]}>
              <MaterialIcons name="storefront" size={18} color={colors.badgeAmberText} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.menuLabel}>Chuyển sang Kênh Nhà cung cấp</Text>
              <Text style={styles.menuSub}>Đăng bán nông sản và quản lý tồn kho trên Kaggri</Text>
            </View>
            <MaterialIcons name="arrow-forward" size={18} color={colors.green} />
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
  headerBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: "#d8ded3",
    backgroundColor: colors.panel,
  },
  headerBtnText: {
    fontSize: 11,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  scrollContent: {
    padding: spacing.gutter,
    gap: 14,
  },
  pageTitle: {
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
  profilePanel: {
    backgroundColor: colors.panel,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 16,
    gap: 16,
  },
  profileBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#edf0e9",
  },
  profileAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.green,
    alignItems: "center",
    justifyContent: "center",
  },
  profileAvatarText: {
    fontFamily: serifFont,
    fontSize: 19,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  profileName: {
    fontSize: 15,
    fontWeight: fontWeight.extrabold,
    color: colors.dark,
  },
  profileEmail: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
  formStack: {
    gap: 12,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: fontWeight.bold,
    color: "#516153",
    marginBottom: 6,
  },
  buyerTypeRow: {
    flexDirection: "row",
    gap: 8,
  },
  buyerTypeBtn: {
    flex: 1,
    height: 38,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    backgroundColor: colors.panel,
    alignItems: "center",
    justifyContent: "center",
  },
  buyerTypeBtnActive: {
    backgroundColor: colors.greenSoft,
    borderColor: colors.green,
  },
  buyerTypeText: {
    fontSize: 12,
    fontWeight: fontWeight.semibold,
    color: colors.muted,
  },
  buyerTypeTextActive: {
    color: colors.dark,
    fontWeight: fontWeight.bold,
  },
  primaryBtn: {
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.green,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingHorizontal: 16,
    marginTop: 4,
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
    paddingHorizontal: 16,
  },
  secondaryBtnText: {
    fontSize: 12,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  panel: {
    backgroundColor: colors.panel,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 16,
  },
  panelTitle: {
    fontSize: 14,
    fontWeight: fontWeight.extrabold,
    color: colors.dark,
    marginBottom: 10,
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
  },
  menuRowBorder: {
    borderTopWidth: 1,
    borderTopColor: "#edf0e9",
  },
  menuIcon: {
    width: 34,
    height: 34,
    borderRadius: borderRadius.md,
    backgroundColor: colors.greenSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  menuLabel: {
    fontSize: 13,
    fontWeight: fontWeight.bold,
    color: colors.dark,
  },
  menuSub: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 2,
  },
  guestWrap: {
    flex: 1,
    justifyContent: "center",
    padding: spacing.gutter,
  },
  guestCard: {
    backgroundColor: colors.panel,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 22,
    gap: 8,
  },
  guestIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.greenSoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  guestEyebrow: {
    fontSize: 9.5,
    fontWeight: fontWeight.bold,
    color: colors.eyebrow,
    letterSpacing: 1.4,
  },
  guestTitle: {
    fontFamily: serifFont,
    fontSize: 24,
    color: colors.dark,
  },
  guestDesc: {
    fontSize: 12,
    color: colors.muted,
    lineHeight: 18,
  },
  guestActions: {
    gap: 8,
    marginTop: 8,
  },
});
