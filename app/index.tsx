import React from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { colors, fontSize, fontWeight, spacing, borderRadius, serifFont } from "@/theme";
import { KaggriBrand } from "@/components/Header";

export default function RoleSelectionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Site Top Bar */}
      <View style={styles.topHeader}>
        <KaggriBrand />
        <Pressable
          onPress={() => router.push("/auth/login")}
          style={({ pressed }) => [styles.loginLinkBtn, pressed && { opacity: 0.75 }]}
        >
          <Text style={styles.loginLinkText}>Đăng nhập</Text>
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
      >
        {/* Hero Story Block matching Kaggri-Trade */}
        <View style={styles.heroCard}>
          <View style={styles.eyebrowPill}>
            <View style={styles.liveDot} />
            <Text style={styles.eyebrowText}>KẾT NỐI GIÁ TRỊ NÔNG SẢN</Text>
          </View>

          <Text style={styles.heroHeading}>
            Nguồn nông sản tốt.{"\n"}
            <Text style={styles.heroHeadingItalic}>Khởi đầu hợp tác bền lâu.</Text>
          </Text>

          <Text style={styles.heroSub}>
            Từ vùng trồng trù phú đến những thương vụ tin cậy. Khám phá nông sản chọn lọc từ các hợp tác xã và nhà vườn uy tín trên khắp Việt Nam.
          </Text>

          <View style={styles.proofStrip}>
            <View style={styles.proofItem}>
              <Text style={styles.proofNum}>500+</Text>
              <Text style={styles.proofLabel}>Nông sản chọn lọc</Text>
            </View>
            <View style={styles.proofDivider} />
            <View style={styles.proofItem}>
              <Text style={styles.proofNum}>120+</Text>
              <Text style={styles.proofLabel}>Nhà vườn & HTX</Text>
            </View>
            <View style={styles.proofDivider} />
            <View style={styles.proofItem}>
              <Text style={styles.proofNum}>34</Text>
              <Text style={styles.proofLabel}>Tỉnh thành kết nối</Text>
            </View>
          </View>
        </View>

        {/* Role Selection Cards */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionEyebrow}>CHỌN KHÔNG GIAN LÀM VIỆC</Text>
          <Text style={styles.sectionTitle}>Bắt đầu cùng Kaggri Trade</Text>

          {/* Buyer Card */}
          <Pressable
            onPress={() => router.push("/(buyer)")}
            style={({ pressed }) => [
              styles.roleCard,
              styles.roleCardPrimary,
              pressed && { opacity: 0.92 },
            ]}
          >
            <View style={styles.roleTop}>
              <View style={styles.roleIconPrimary}>
                <MaterialIcons name="shopping-bag" size={20} color={colors.white} />
              </View>
              <View style={styles.roleTag}>
                <Text style={styles.roleTagText}>DÀNH CHO NGƯỜI MUA</Text>
              </View>
            </View>
            <Text style={styles.roleTitle}>Khám phá nông sản</Text>
            <Text style={styles.roleDesc}>
              Tìm kiếm nguồn nông sản tận gốc, minh bạch vùng trồng, sản lượng khả dụng và giá sỉ rõ ràng.
            </Text>
            <View style={styles.roleActionRow}>
              <Text style={styles.roleActionPrimary}>Vào Chợ Nông Sản</Text>
              <MaterialIcons name="arrow-forward" size={16} color={colors.green} />
            </View>
          </Pressable>

          {/* Vendor Card */}
          <Pressable
            onPress={() => router.push("/auth/login?role=vendor")}
            style={({ pressed }) => [
              styles.roleCard,
              pressed && { opacity: 0.92 },
            ]}
          >
            <View style={styles.roleTop}>
              <View style={styles.roleIconSecondary}>
                <MaterialIcons name="storefront" size={20} color={colors.green} />
              </View>
              <View style={[styles.roleTag, { backgroundColor: colors.badgeAmberBg }]}>
                <Text style={[styles.roleTagText, { color: colors.badgeAmberText }]}>
                  NHÀ VƯỜN & HTX
                </Text>
              </View>
            </View>
            <Text style={styles.roleTitle}>Không gian Nhà cung cấp</Text>
            <Text style={styles.roleDesc}>
              Hoàn thiện hồ sơ đối tác, ký thỏa thuận hợp tác, đăng bán nông sản và quản lý tồn kho.
            </Text>
            <View style={styles.roleActionRow}>
              <Text style={styles.roleActionSecondary}>Mở Kênh Nhà Cung Cấp</Text>
              <MaterialIcons name="arrow-forward" size={16} color={colors.dark} />
            </View>
          </Pressable>
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
          ].map((item, idx) => (
            <View
              key={idx}
              style={[styles.valueRow, idx > 0 && styles.valueRowBorder]}
            >
              <View style={styles.valueIconBox}>
                <MaterialIcons name={item.icon} size={16} color={colors.green} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.valueTitle}>{item.title}</Text>
                <Text style={styles.valueDesc}>{item.desc}</Text>
              </View>
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
    paddingVertical: 12,
    backgroundColor: colors.panel,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  loginLinkBtn: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: "#d8ded3",
    backgroundColor: colors.panel,
  },
  loginLinkText: {
    fontSize: 12,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  scrollContent: {
    padding: spacing.gutter,
    gap: 18,
  },
  heroCard: {
    backgroundColor: "#e9eedf",
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: "#dfe6d6",
    padding: 18,
    gap: 12,
  },
  eyebrowPill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 7,
    backgroundColor: "#e7ecde",
    borderWidth: 1,
    borderColor: "#d8e0ce",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#4b7b43",
  },
  eyebrowText: {
    fontSize: 9.5,
    fontWeight: fontWeight.extrabold,
    color: "#50654a",
    letterSpacing: 1.2,
  },
  heroHeading: {
    fontFamily: serifFont,
    fontSize: 27,
    lineHeight: 33,
    color: colors.dark,
  },
  heroHeadingItalic: {
    fontFamily: serifFont,
    fontStyle: "italic",
    color: "#577447",
  },
  heroSub: {
    fontSize: fontSize["body-md"],
    lineHeight: 20,
    color: "#5f6b5f",
  },
  proofStrip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 12,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: "#dce3d4",
  },
  proofItem: {
    flex: 1,
  },
  proofDivider: {
    width: 1,
    height: 26,
    backgroundColor: "#d5decb",
    marginHorizontal: 10,
  },
  proofNum: {
    fontFamily: serifFont,
    fontSize: 18,
    fontWeight: fontWeight.bold,
    color: colors.dark,
  },
  proofLabel: {
    fontSize: 10,
    color: colors.muted,
    marginTop: 2,
  },
  sectionBlock: {
    gap: 10,
  },
  sectionEyebrow: {
    fontSize: 9.5,
    fontWeight: fontWeight.bold,
    color: colors.eyebrow,
    letterSpacing: 1.4,
  },
  sectionTitle: {
    fontFamily: serifFont,
    fontSize: 21,
    color: colors.dark,
    marginBottom: 2,
  },
  roleCard: {
    backgroundColor: colors.panel,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 16,
    gap: 8,
  },
  roleCardPrimary: {
    borderColor: "#c5d4be",
    backgroundColor: "#fbfcf9",
  },
  roleTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  roleIconPrimary: {
    width: 38,
    height: 38,
    borderRadius: borderRadius.md,
    backgroundColor: colors.green,
    alignItems: "center",
    justifyContent: "center",
  },
  roleIconSecondary: {
    width: 38,
    height: 38,
    borderRadius: borderRadius.md,
    backgroundColor: colors.greenSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  roleTag: {
    backgroundColor: colors.badgeGreenBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
  },
  roleTagText: {
    fontSize: 9.5,
    fontWeight: fontWeight.extrabold,
    color: colors.badgeGreenText,
    letterSpacing: 0.5,
  },
  roleTitle: {
    fontFamily: serifFont,
    fontSize: 18,
    color: colors.dark,
    marginTop: 2,
  },
  roleDesc: {
    fontSize: fontSize["body-sm"],
    color: colors.muted,
    lineHeight: 18,
  },
  roleActionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#edf0e9",
  },
  roleActionPrimary: {
    fontSize: 12,
    fontWeight: fontWeight.extrabold,
    color: colors.green,
  },
  roleActionSecondary: {
    fontSize: 12,
    fontWeight: fontWeight.extrabold,
    color: colors.dark,
  },
  valueStrip: {
    backgroundColor: colors.panel,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 14,
    gap: 10,
  },
  valueRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  valueRowBorder: {
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  valueIconBox: {
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
});
