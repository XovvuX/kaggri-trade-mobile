import React from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import { colors, fontSize, fontWeight } from "@/theme";

type Props = {
  amount: string;
  unit?: string;
  size?: "sm" | "md" | "lg";
  color?: string;
  style?: ViewStyle;
};

export function PriceText({
  amount,
  unit,
  size = "md",
  color = colors.greenAccent,
  style,
}: Props) {
  const sizes = {
    sm: fontSize["price-unit"],
    md: fontSize["price-display"],
    lg: fontSize["price-lg"],
  };

  return (
    <View style={[styles.row, style]}>
      <Text style={[styles.amount, { fontSize: sizes[size], color }]}>
        {amount}₫
      </Text>
      {unit && <Text style={styles.unit}> / {unit}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  amount: {
    fontWeight: fontWeight.extrabold,
    letterSpacing: -0.3,
  },
  unit: {
    fontSize: 11,
    color: "#6e786c",
    fontWeight: fontWeight.normal,
  },
});
