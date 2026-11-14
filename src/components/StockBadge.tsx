import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, fontWeight, borderRadius } from "@/theme";

type StockLevel = "instock" | "low" | "out";

const CONFIG: Record<StockLevel, { label: string; bg: string; text: string }> = {
  instock: {
    label: "Sẵn hàng",
    bg: colors.badgeGreenBg,
    text: colors.badgeGreenText,
  },
  low: {
    label: "Đặt trước",
    bg: colors.badgeAmberBg,
    text: colors.badgeAmberText,
  },
  out: {
    label: "Tạm hết",
    bg: colors.badgeRedBg,
    text: colors.badgeRedText,
  },
};

type Props = {
  level: StockLevel;
  quantity?: string;
};

export function StockBadge({ level, quantity }: Props) {
  const cfg = CONFIG[level];
  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
      <Text style={[styles.text, { color: cfg.text }]}>
        {quantity ? `${cfg.label} (${quantity})` : cfg.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
    alignSelf: "flex-start",
  },
  text: {
    fontSize: 10,
    fontWeight: fontWeight.extrabold,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
});
