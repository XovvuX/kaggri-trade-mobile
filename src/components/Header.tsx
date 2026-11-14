import React from "react";
import { View, Text, Pressable, StyleSheet, ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { colors, fontSize, fontWeight, spacing, serifFont } from "@/theme";

type IconName = React.ComponentProps<typeof MaterialIcons>["name"];

type Props = {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  leftIcon?: IconName;
  onLeftPress?: () => void;
  rightActions?: Array<{ icon: IconName; onPress?: () => void; badge?: number }>;
  variant?: "primary" | "surface";
  showBrand?: boolean;
  children?: React.ReactNode;
  style?: ViewStyle;
};

export function KaggriBrand({ compact = false }: { compact?: boolean }) {
  return (
    <View style={styles.brandRow}>
      <View style={[styles.brandIcon, compact && { width: 28, height: 28, borderRadius: 9 }]}>
        <MaterialIcons name="eco" size={compact ? 15 : 17} color="#ffffff" />
      </View>
      <View>
        <Text style={[styles.brandTitle, compact && { fontSize: 14 }]}>Kaggri</Text>
        <Text style={styles.brandSub}>TRADE</Text>
      </View>
    </View>
  );
}

export function Header({
  title,
  subtitle,
  eyebrow,
  leftIcon,
  onLeftPress,
  rightActions,
  variant = "surface",
  showBrand = false,
  children,
  style,
}: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top + 8,
          backgroundColor: colors.panel,
        },
        style,
      ]}
    >
      <View style={styles.row}>
        {leftIcon && (
          <Pressable onPress={onLeftPress} style={styles.iconBtn} hitSlop={8}>
            <MaterialIcons name={leftIcon} size={20} color={colors.text} />
          </Pressable>
        )}
        <View style={styles.titleContainer}>
          {showBrand ? (
            <KaggriBrand compact />
          ) : (
            <>
              {eyebrow && <Text style={styles.eyebrow}>{eyebrow}</Text>}
              <Text style={styles.title} numberOfLines={1}>
                {title}
              </Text>
              {subtitle && (
                <Text style={styles.subtitle} numberOfLines={1}>
                  {subtitle}
                </Text>
              )}
            </>
          )}
        </View>
        {rightActions && (
          <View style={styles.actions}>
            {rightActions.map((a, i) => (
              <Pressable key={i} onPress={a.onPress} style={styles.actionBtn} hitSlop={6}>
                <MaterialIcons name={a.icon} size={19} color={colors.text} />
                {a.badge !== undefined && a.badge > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{a.badge}</Text>
                  </View>
                )}
              </Pressable>
            ))}
          </View>
        )}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.gutter,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  titleContainer: {
    flex: 1,
    minWidth: 0,
  },
  eyebrow: {
    fontSize: 9,
    fontWeight: fontWeight.bold,
    color: colors.eyebrow,
    letterSpacing: 1.3,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  title: {
    fontFamily: serifFont,
    fontSize: 18,
    fontWeight: fontWeight.normal,
    color: colors.dark,
  },
  subtitle: {
    fontSize: fontSize["body-sm"],
    color: colors.muted,
    marginTop: 2,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  actionBtn: {
    width: 34,
    height: 34,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.panel,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
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
  badgeText: {
    color: colors.white,
    fontSize: 9,
    fontWeight: fontWeight.bold,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  brandIcon: {
    width: 32,
    height: 32,
    borderRadius: 11,
    borderBottomLeftRadius: 3,
    backgroundColor: colors.green,
    alignItems: "center",
    justifyContent: "center",
  },
  brandTitle: {
    fontSize: 15,
    fontWeight: fontWeight.extrabold,
    color: colors.dark,
    lineHeight: 16,
    letterSpacing: -0.2,
  },
  brandSub: {
    fontSize: 8.5,
    fontWeight: fontWeight.bold,
    color: "#697567",
    letterSpacing: 1.8,
    marginTop: 1,
  },
});
