import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, fontSize, fontWeight, spacing, borderRadius, shadows } from "@/theme";

type Props = {
  emoji: string;
  size?: "sm" | "md" | "lg" | "xl";
  productId?: string;
};

export function ProductThumb({ emoji, size = "md" }: Props) {
  const dim = {
    sm: 48,
    md: 64,
    lg: 96,
    xl: 140,
  }[size];

  const fontSizeMap = {
    sm: 24,
    md: 32,
    lg: 56,
    xl: 80,
  }[size];

  return (
    <View
      style={[
        styles.thumb,
        { width: dim, height: dim, borderRadius: borderRadius.md },
      ]}
    >
      <Text style={{ fontSize: fontSizeMap }}>{emoji}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  thumb: {
    backgroundColor: colors.successLight,
    alignItems: "center",
    justifyContent: "center",
  },
});
