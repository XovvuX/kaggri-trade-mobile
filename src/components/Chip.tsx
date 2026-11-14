import React from "react";
import { Text, View, StyleSheet } from "react-native";
import { colors, fontSize, fontWeight, spacing } from "@/theme";

type Props = {
  text: string;
  variant?: "default" | "success" | "warning" | "danger" | "info";
  size?: "sm" | "md";
  style?: any;
};

export function Chip({ text, variant = "default", size = "sm", style }: Props) {
  const palette = {
    default: { bg: colors.gray100, fg: colors.gray700 },
    success: { bg: colors.successLight, fg: "#047857" },
    warning: { bg: colors.warningLight, fg: "#92400e" },
    danger: { bg: colors.dangerLight, fg: "#b91c1c" },
    info: { bg: colors.infoLight, fg: "#1e40af" },
  }[variant];

  return (
    <View
      style={[
        styles.chip,
        { backgroundColor: palette.bg },
        size === "md" && styles.chipMd,
        style,
      ]}
    >
      <Text style={[styles.text, { color: palette.fg }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignSelf: "flex-start",
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 999,
  },
  chipMd: {
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
  },
  text: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
});
