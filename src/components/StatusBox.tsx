import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, fontSize, fontWeight, spacing, borderRadius } from "@/theme";

type Variant = "success" | "warning" | "danger" | "info";

type Props = {
  message: string;
  variant?: Variant;
  icon?: string;
};

export function StatusBox({ message, variant = "info", icon }: Props) {
  const palette = {
    success: { bg: colors.successLight, fg: "#047857", icon: "✓" },
    warning: { bg: colors.warningLight, fg: "#92400e", icon: "⚠" },
    danger: { bg: colors.dangerLight, fg: "#b91c1c", icon: "×" },
    info: { bg: colors.infoLight, fg: "#1e40af", icon: "ℹ" },
  }[variant];

  return (
    <View style={[styles.box, { backgroundColor: palette.bg }]}>
      <Text style={[styles.icon, { color: palette.fg }]}>{icon ?? palette.icon}</Text>
      <Text style={[styles.text, { color: palette.fg }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  icon: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  text: {
    flex: 1,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    lineHeight: 18,
  },
});
