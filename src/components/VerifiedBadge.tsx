import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { colors, fontWeight, borderRadius } from "@/theme";

type BadgeVariant = "vietgap" | "ocop" | "globalgap" | "organic";

const CONFIG: Record<BadgeVariant, { label: string; bg: string; text: string; icon: "verified" | "stars" }> = {
  vietgap: {
    label: "VietGAP",
    bg: colors.badgeGreenBg,
    text: colors.badgeGreenText,
    icon: "verified",
  },
  globalgap: {
    label: "GlobalGAP",
    bg: colors.badgeGreenBg,
    text: colors.badgeGreenText,
    icon: "verified",
  },
  organic: {
    label: "Hữu cơ",
    bg: colors.badgeGreenBg,
    text: colors.badgeGreenText,
    icon: "verified",
  },
  ocop: {
    label: "OCOP 4★",
    bg: colors.badgeAmberBg,
    text: colors.badgeAmberText,
    icon: "stars",
  },
};

type Props = {
  variant: BadgeVariant;
};

export function VerifiedBadge({ variant }: Props) {
  const cfg = CONFIG[variant];
  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
      <MaterialIcons name={cfg.icon} size={11} color={cfg.text} />
      <Text style={[styles.text, { color: cfg.text }]}>{cfg.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    gap: 3,
    alignSelf: "flex-start",
  },
  text: {
    fontSize: 9.5,
    fontWeight: fontWeight.extrabold,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
});
