import React from "react";
import { View, Text, ScrollView, StyleSheet, ViewStyle } from "react-native";
import { colors, fontSize, fontWeight, spacing } from "@/theme";

type TickerItem = {
  symbol: string;
  price: string;
  change: string; // e.g. "+2.4%" or "-1.2%"
};

type Props = {
  title?: string;
  items: TickerItem[];
  variant?: "primary" | "tertiary" | "dark";
  style?: ViewStyle;
};

const variantStyle = {
  primary: { bg: colors.primary, fg: colors.onPrimary, subFg: colors.onPrimary + "AA" },
  tertiary: { bg: colors.tertiary, fg: colors.onTertiary, subFg: colors.onTertiary + "AA" },
  dark: { bg: colors.inverseSurface, fg: colors.inverseOnSurface, subFg: colors.inverseOnSurface + "AA" },
};

export function Ticker({ title, items, variant = "primary", style }: Props) {
  const v = variantStyle[variant];
  return (
    <View style={[styles.container, { backgroundColor: v.bg }, style]}>
      {title && (
        <View style={styles.labelBox}>
          <View style={[styles.dot, { backgroundColor: v.fg }]} />
          <Text style={[styles.label, { color: v.subFg }]}>{title}</Text>
        </View>
      )}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.items}
      >
        {items.map((item, i) => (
          <View key={i} style={styles.item}>
            <Text style={[styles.symbol, { color: v.subFg }]}>{item.symbol}</Text>
            <Text style={[styles.price, { color: v.fg }]}>{item.price}</Text>
            <Text
              style={[
                styles.change,
                {
                  color: item.change.startsWith("+") ? colors.tertiaryFixed : colors.errorContainer,
                },
              ]}
            >
              {item.change}
            </Text>
            {i < items.length - 1 && (
              <View style={[styles.divider, { backgroundColor: v.subFg + "44" }]} />
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: spacing.gutter,
    gap: 12,
  },
  labelBox: { flexDirection: "row", alignItems: "center", gap: 6, flexShrink: 0 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  label: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  items: { gap: 14, alignItems: "center" },
  item: { flexDirection: "row", alignItems: "center", gap: 4 },
  symbol: { fontSize: 11 },
  price: { fontSize: 12, fontWeight: fontWeight.bold },
  change: { fontSize: 10, fontWeight: fontWeight.medium },
  divider: { width: 1, height: 12, marginLeft: 10 },
});
