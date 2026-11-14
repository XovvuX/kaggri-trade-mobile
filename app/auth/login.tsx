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
import { colors, fontSize, fontWeight, spacing, borderRadius, serifFont } from "@/theme";
import { RoleTabs } from "@/components/RoleTabs";
import { Input } from "@/components/Input";
import { KaggriBrand } from "@/components/Header";
import { useAuthStore } from "@/stores/auth-store";
import { useCartStore } from "@/stores/cart-store";
import { useCheckoutStore } from "@/stores/checkout-store";
import { authService } from "@/services";
import { ApiError } from "@/services/api";

const DEMO_CREDENTIALS = {
  buyer: {
    email: "demo.buyer@example.com",
    password: "Demo-1dqVcXNaDSijgC0lKoM8aW6-",
  },
  vendor: {
    email: "demo.vendor@example.com",
    password: "Demo-1dqVcXNaDSijgC0lKoM8aW6-",
  },
};

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ role?: "buyer" | "vendor"; redirect?: string }>();
  const [role, setRole] = useState<"buyer" | "vendor">(params.role ?? "buyer");
  const [phone, setPhone] = useState(
    (params.role ?? "buyer") === "vendor"
      ? DEMO_CREDENTIALS.vendor.email
      : DEMO_CREDENTIALS.buyer.email
  );
  const [password, setPassword] = useState(
    (params.role ?? "buyer") === "vendor"
      ? DEMO_CREDENTIALS.vendor.password
      : DEMO_CREDENTIALS.buyer.password
  );
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loginStore = useAuthStore((s) => s.login);

  const handleRoleSwitch = (nextRole: "buyer" | "vendor") => {
    setRole(nextRole);
    if (
      !phone ||
      phone === DEMO_CREDENTIALS.buyer.email ||
      phone === DEMO_CREDENTIALS.vendor.email
    ) {
      setPhone(DEMO_CREDENTIALS[nextRole].email);
      setPassword(DEMO_CREDENTIALS[nextRole].password);
    }
  };

  const handleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const targetEmail =
        phone.trim() || DEMO_CREDENTIALS[role].email;
      const targetPassword =
        password || DEMO_CREDENTIALS[role].password;
      const res = await authService.login(targetEmail, targetPassword, role);
      loginStore(res.user);
      if (res.user.role === "buyer") {
        try {
          const pending = await useCartStore.getState().flushPendingAdd();
          if (pending?.added?.id && pending.goToCheckout) {
            useCheckoutStore.getState().setSelectedCartItemIds([pending.added.id]);
          }
        } catch {
          // Ignore pending cart sync error; user can retry on product/cart screen
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
        setError("Không thể đăng nhập. Vui lòng kiểm tra lại email/mật khẩu.");
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

          <View style={styles.storyQuotes}>
            <View style={styles.quoteLine}>
              <MaterialIcons name="eco" size={14} color="#4d6f46" />
              <Text style={styles.quoteText}>Nguồn hàng rõ vùng trồng, rõ tiêu chuẩn</Text>
            </View>
            <View style={styles.quoteLine}>
              <MaterialIcons name="verified-user" size={14} color="#4d6f46" />
              <Text style={styles.quoteText}>Nhà cung cấp được xác minh cùng Kaggri</Text>
            </View>
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
          <Text style={styles.formTitle}>Đăng nhập</Text>
          <Text style={styles.formLead}>
            Tiếp tục hành trình kết nối nông sản cùng Kaggri.
          </Text>

          <View style={{ marginTop: 14, marginBottom: 14 }}>
            <RoleTabs value={role} onChange={handleRoleSwitch} />
          </View>

          {error && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.fieldsWrap}>
            <Input
              label="Email hoặc Số điện thoại"
              placeholder="ban@doanhnghiep.vn hoặc 0912345678"
              value={phone}
              onChangeText={setPhone}
              autoCapitalize="none"
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

            <Pressable
              onPress={handleLogin}
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
                  <Text style={styles.submitBtnText}>Đăng nhập</Text>
                  <MaterialIcons name="arrow-forward" size={16} color={colors.white} />
                </>
              )}
            </Pressable>
          </View>

          {/* Switch link */}
          <View style={styles.switchLine}>
            <Text style={styles.switchLabel}>Chưa có tài khoản?</Text>
            <Pressable
              onPress={() =>
                router.push({
                  pathname: "/auth/register",
                  params: {
                    role,
                    ...(params.redirect ? { redirect: params.redirect } : {}),
                  },
                })
              }
            >
              <Text style={styles.switchLink}>Tạo tài khoản mới</Text>
            </Pressable>
          </View>

          {/* Secure note */}
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
    paddingBottom: 22,
    borderBottomWidth: 1,
    borderBottomColor: "#dce4d2",
    gap: 18,
  },
  storyContent: {
    gap: 8,
  },
  storyEyebrow: {
    fontSize: 9.5,
    fontWeight: fontWeight.bold,
    color: colors.eyebrow,
    letterSpacing: 1.4,
  },
  storyTitle: {
    fontFamily: serifFont,
    fontSize: 28,
    lineHeight: 33,
    color: colors.dark,
  },
  storyTitleItalic: {
    fontFamily: serifFont,
    fontStyle: "italic",
    color: "#4d6f46",
  },
  storyDesc: {
    fontSize: fontSize["body-md"],
    lineHeight: 20,
    color: "#576556",
  },
  storyQuotes: {
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#d6dfd0",
  },
  quoteLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  quoteText: {
    fontSize: 12,
    fontWeight: fontWeight.semibold,
    color: "#334739",
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
