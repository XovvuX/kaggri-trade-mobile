import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { colors, fontSize, fontWeight, borderRadius, serifFont } from "@/theme";
import { RoleTabs } from "@/components/RoleTabs";
import { Input } from "@/components/Input";
import { KaggriBrand } from "@/components/Header";
import { useAuthStore } from "@/stores/auth-store";
import { useCartStore } from "@/stores/cart-store";
import { useCheckoutStore } from "@/stores/checkout-store";
import { authService } from "@/services";
import { ApiError } from "@/services/api";

export default function RegisterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ role?: "buyer" | "vendor"; redirect?: string }>();
  const [role, setRole] = useState<"buyer" | "vendor">(params.role ?? "buyer");
  const [buyerType, setBuyerType] = useState<"INDIVIDUAL" | "BUSINESS">("BUSINESS");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [taxCode, setTaxCode] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loginStore = useAuthStore((s) => s.login);

  const handleRegister = async () => {
    setError(null);
    if (!email.trim() || !password || !fullName.trim()) {
      setError("Vui lòng điền Họ tên, Email và Mật khẩu (tối thiểu 8 ký tự).");
      return;
    }
    setLoading(true);
    try {
      const res = await authService.register({
        name: fullName.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        role,
        buyerType,
        password,
        company: businessName.trim() || undefined,
        taxCode: taxCode.trim() || undefined,
      });
      loginStore(res.user);
      if (res.user.role === "buyer") {
        try {
          const pending = await useCartStore.getState().flushPendingAdd();
          if (pending?.added?.id && pending.goToCheckout) {
            useCheckoutStore.getState().setSelectedCartItemIds([pending.added.id]);
          }
        } catch {
          // Ignore pending cart sync error
        }
      } else {
        useCartStore.getState().setPendingAdd(null);
      }
      if (params.redirect) {
        router.replace(params.redirect as any);
      } else {
        router.replace(res.user.role === "vendor" ? "/(vendor)" : "/(buyer)");
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Không thể tạo tài khoản. Vui lòng thử lại.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Story Panel matching .auth-story in Kaggri-Trade */}
        <View style={[styles.authStory, { paddingTop: insets.top + 16 }]}>
          <KaggriBrand />

          <View style={styles.storyContent}>
            <Text style={styles.storyEyebrow}>NÔNG SẢN VIỆT · CHỌN LỌC TỪ VÙNG TRỒNG</Text>
            <Text style={styles.storyTitle}>
              Kết nối nguồn tốt.{"\n"}
              <Text style={styles.storyTitleItalic}>Gieo trồng niềm tin.</Text>
            </Text>
            <Text style={styles.storyDesc}>
              Kaggri đồng hành cùng nhà vườn, hợp tác xã và đối tác thu mua trên hành trình đưa nông sản Việt đi xa hơn.
            </Text>
          </View>
        </View>

        {/* Form Panel matching .auth-form in Kaggri-Trade */}
        <View style={styles.authForm}>
          <Pressable
            onPress={() => router.push("/(buyer)")}
            style={styles.backToCatalog}
            hitSlop={6}
          >
            <Text style={styles.backToCatalogText}>← Trở về khám phá</Text>
          </Pressable>

          <Text style={styles.formEyebrow}>CHÀO MỪNG ĐẾN KAGGRI</Text>
          <Text style={styles.formTitle}>Tạo tài khoản</Text>
          <Text style={styles.formLead}>
            Chọn vai trò phù hợp để bắt đầu mua hàng hoặc giới thiệu nông sản của bạn.
          </Text>

          <View style={{ marginTop: 14, marginBottom: 14 }}>
            <RoleTabs value={role} onChange={setRole} />
          </View>

          {error && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.fieldsWrap}>
            <Input
              label="Họ và tên"
              placeholder="Nguyễn Văn A"
              value={fullName}
              onChangeText={setFullName}
            />

            <Input
              label="Email"
              placeholder="ban@doanhnghiep.vn"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />

            <Input
              label="Mật khẩu"
              placeholder="••••••••"
              secureTextEntry={!showPass}
              value={password}
              onChangeText={setPassword}
              rightElement={
                <Pressable onPress={() => setShowPass(!showPass)} hitSlop={8}>
                  <MaterialIcons
                    name={showPass ? "visibility" : "visibility-off"}
                    size={18}
                    color={colors.muted}
                  />
                </Pressable>
              }
            />

            <Input
              label="Số điện thoại"
              placeholder="0912345678"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />

            {role === "buyer" && (
              <View>
                <Text style={styles.fieldLabel}>Hình thức mua hàng</Text>
                <View style={styles.buyerTypeRow}>
                  <Pressable
                    onPress={() => setBuyerType("INDIVIDUAL")}
                    style={[
                      styles.buyerTypeOption,
                      buyerType === "INDIVIDUAL" && styles.buyerTypeOptionActive,
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
                      styles.buyerTypeOption,
                      buyerType === "BUSINESS" && styles.buyerTypeOptionActive,
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
            )}

            {(role === "vendor" || buyerType === "BUSINESS") && (
              <>
                <Input
                  label={role === "vendor" ? "Tên nhà vườn / Hợp tác xã" : "Tên doanh nghiệp"}
                  placeholder={role === "vendor" ? "HTX Nông sản Kaggri" : "Công ty Thực phẩm Xanh"}
                  value={businessName}
                  onChangeText={setBusinessName}
                />
                <Input
                  label="Mã số thuế"
                  placeholder="0312345678"
                  keyboardType="numeric"
                  value={taxCode}
                  onChangeText={setTaxCode}
                />
              </>
            )}

            <Pressable
              onPress={handleRegister}
              disabled={loading}
              style={({ pressed }) => [
                styles.submitBtn,
                pressed && { opacity: 0.9 },
                loading && { opacity: 0.6 },
              ]}
            >
              {loading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <>
                  <Text style={styles.submitBtnText}>Tạo tài khoản</Text>
                  <MaterialIcons name="arrow-forward" size={16} color={colors.white} />
                </>
              )}
            </Pressable>
          </View>

          <View style={styles.switchLine}>
            <Text style={styles.switchLabel}>Đã có tài khoản?</Text>
            <Pressable
              onPress={() =>
                router.push({
                  pathname: "/auth/login",
                  params: {
                    role,
                    ...(params.redirect ? { redirect: params.redirect } : {}),
                  },
                })
              }
            >
              <Text style={styles.switchLink}>Đăng nhập</Text>
            </Pressable>
          </View>

          <View style={styles.secureNote}>
            <MaterialIcons name="verified-user" size={14} color={colors.muted} />
            <Text style={styles.secureNoteText}>
              Thông tin tài khoản được bảo mật theo chính sách đối tác Kaggri Trade.
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  authStory: {
    backgroundColor: "#e9eedf",
    paddingHorizontal: 22,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#dce4d2",
    gap: 14,
  },
  storyContent: {
    gap: 6,
  },
  storyEyebrow: {
    fontSize: 9.5,
    fontWeight: fontWeight.bold,
    color: colors.eyebrow,
    letterSpacing: 1.4,
  },
  storyTitle: {
    fontFamily: serifFont,
    fontSize: 26,
    lineHeight: 31,
    color: colors.dark,
  },
  storyTitleItalic: {
    fontFamily: serifFont,
    fontStyle: "italic",
    color: "#4d6f46",
  },
  storyDesc: {
    fontSize: fontSize["body-md"],
    lineHeight: 19,
    color: "#576556",
  },
  authForm: {
    flex: 1,
    backgroundColor: colors.panel,
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 28,
  },
  backToCatalog: {
    alignSelf: "flex-start",
    marginBottom: 14,
  },
  backToCatalogText: {
    fontSize: 12,
    fontWeight: fontWeight.bold,
    color: colors.green,
  },
  formEyebrow: {
    fontSize: 9.5,
    fontWeight: fontWeight.bold,
    color: colors.eyebrow,
    letterSpacing: 1.4,
    marginBottom: 4,
  },
  formTitle: {
    fontFamily: serifFont,
    fontSize: 28,
    color: colors.dark,
  },
  formLead: {
    fontSize: 13,
    color: colors.muted,
    marginTop: 4,
    lineHeight: 19,
  },
  errorBanner: {
    backgroundColor: colors.badgeRedBg,
    borderColor: "#ebcfc6",
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 12,
    color: colors.badgeRedText,
    fontWeight: fontWeight.semibold,
  },
  fieldsWrap: {
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
  buyerTypeOption: {
    flex: 1,
    height: 38,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    backgroundColor: colors.panel,
    alignItems: "center",
    justifyContent: "center",
  },
  buyerTypeOptionActive: {
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
  submitBtn: {
    height: 42,
    borderRadius: borderRadius.md,
    backgroundColor: colors.green,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 6,
  },
  submitBtnText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: fontWeight.bold,
  },
  switchLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 18,
  },
  switchLabel: {
    fontSize: 12,
    color: colors.muted,
  },
  switchLink: {
    fontSize: 12,
    fontWeight: fontWeight.extrabold,
    color: colors.green,
  },
  secureNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#edf0ea",
  },
  secureNoteText: {
    flex: 1,
    fontSize: 11,
    color: colors.muted,
    lineHeight: 16,
  },
});
