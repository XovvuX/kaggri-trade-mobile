import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { colors, fontSize, fontWeight, spacing, shadows } from "@/theme";

type IconName = React.ComponentProps<typeof MaterialIcons>["name"];

type Badge = { label: string; icon?: IconName; bg?: string; fg?: string };

type Props = {
  hello: string;
  company: string;
  initial: string;
  certifications?: Badge[];
  notificationCount?: number;
  onNotificationPress?: () => void;
  onAvatarPress?: () => void;
};

export function HeroHeader({
  hello,
  company,
  initial,
  certifications = [],
  notificationCount,
  onNotificationPress,
  onAvatarPress,
}: Props) {
  return (
    <View style={styles.hero}>
      {/* Decorative blurred circles */}
      <View style={styles.decorCircle1} />
      <View style={styles.decorCircle2} />

      <View style={styles.heroLeft}>
        <View style={styles.heroLabel}>
          <View style={styles.heroLabelDot} />
          <Text style={styles.heroLabelText}>HTX ĐÃ XÁC MINH</Text>
        </View>
        <Text style={styles.heroHello}>{hello}</Text>
        <Text style={styles.heroCompany} numberOfLines={1}>
          {company}
        </Text>
        {certifications.length > 0 && (
          <View style={styles.heroBadges}>
            {certifications.map((c, i) => (
              <View
                key={i}
                style={[
                  styles.heroBadge,
                  c.bg ? { backgroundColor: c.bg } : null,
                ]}
              >
                {c.icon && (
                  <MaterialIcons
                    name={c.icon}
                    size={12}
                    color={c.fg ?? colors.surfaceContainerLowest}
                    style={{ fontVariationSettings: "'FILL' 1" } as any}
                  />
                )}
                <Text
                  style={[
                    styles.heroBadgeText,
                    c.fg ? { color: c.fg } : null,
                  ]}
                >
                  {c.label}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={styles.heroRight}>
        <Pressable
          onPress={onNotificationPress}
          hitSlop={6}
          style={({ pressed }) => [
            styles.bellBox,
            pressed && styles.bellBoxPressed,
          ]}
        >
          <MaterialIcons
            name="notifications"
            size={22}
            color={colors.surfaceContainerLowest}
          />
          {notificationCount ? <View style={styles.bellDot} /> : null}
        </Pressable>
        <Pressable
          onPress={onAvatarPress}
          hitSlop={6}
          style={({ pressed }) => [styles.avatar, pressed && { opacity: 0.85 }]}
        >
          <Text style={styles.avatarText}>{initial}</Text>
          <View style={styles.avatarDot} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: colors.primaryContainer,
    flexDirection: "row",
    padding: spacing.lg,
    paddingTop: spacing.xl,
    gap: spacing.md,
    overflow: "hidden",
    position: "relative",
  },
  // Decorative blurred orbs for depth
  decorCircle1: {
    position: "absolute",
    top: -40,
    right: -30,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: colors.tertiaryFixed + "22",
  },
  decorCircle2: {
    position: "absolute",
    bottom: -60,
    left: -40,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: colors.onPrimary + "10",
  },
  heroLeft: { flex: 1, zIndex: 1 },
  heroLabel: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
  heroLabelDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.tertiaryFixed,
    // Glow
    shadowColor: colors.tertiaryFixed,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 2,
  },
  heroLabelText: {
    fontSize: 10,
    color: colors.surfaceContainerLowest,
    fontWeight: fontWeight.bold,
    letterSpacing: 1,
  },
  heroHello: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.surfaceContainerLowest,
    lineHeight: 28,
  },
  heroCompany: {
    fontSize: fontSize["body-md"],
    color: colors.surfaceContainerLowest + "CC",
    marginTop: 4,
  },
  heroBadges: { flexDirection: "row", gap: 6, marginTop: 10 },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.onPrimary + "33",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: colors.onPrimary + "20",
  },
  heroBadgeText: {
    fontSize: 10,
    color: colors.surfaceContainerLowest,
    fontWeight: fontWeight.bold,
  },
  heroRight: { alignItems: "flex-end", gap: 10, zIndex: 1 },
  bellBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.onPrimary + "26",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  bellBoxPressed: { backgroundColor: colors.onPrimary + "40" },
  bellDot: {
    position: "absolute",
    top: 6,
    right: 8,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.tertiaryFixed,
    borderWidth: 2,
    borderColor: colors.primaryContainer,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.tertiary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.onPrimary + "55",
    ...shadows.sm,
  },
  avatarText: {
    fontSize: fontSize["title-md"],
    fontWeight: fontWeight.bold,
    color: colors.onTertiary,
  },
  avatarDot: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.tertiaryFixed,
    borderWidth: 2,
    borderColor: colors.primaryContainer,
  },
});
