import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { colors, borderRadius, spacing } from "@/theme";

type Props = {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: "default" | "low" | "high" | "cream";
  noPadding?: boolean;
};

export function Card({ children, style, variant = "default", noPadding }: Props) {
  const bgMap = {
    default: colors.panel,
    low: colors.cream,
    high: colors.filterBox,
    cream: colors.cream,
  };

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: bgMap[variant] },
        noPadding && { padding: 0 },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.line,
  },
});
