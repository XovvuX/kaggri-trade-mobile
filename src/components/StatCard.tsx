import React from "react";
import { View, Text, Pressable, StyleSheet, ViewStyle } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { colors, fontSize, fontWeight, spacing, borderRadius, shadows } from "@/theme";

type IconName = React.ComponentProps<typeof MaterialIcons>["name"];

type Props = {
  label: string;
  value: string;
  delta?: { value: string; up?: boolean };
  icon: IconName;
  iconBg?: string;
  iconColor?: string;
  style?: ViewStyle;
};

export function StatCard({ label, value, delta, icon, iconBg, iconColor, style }: Props) {
  return (
    <View style={[styles.card, style]}>
      <View style={styles.header}>
        <View style={[styles.iconBox, { backgroundColor: iconBg ?? colors.surfaceContainerHigh }]}>
          <MaterialIcons name={icon} size={20} color={iconColor ?? colors.primary} />
        </View>
        {delta && (
          <View
            style={[
              styles.delta,
              { backgroundColor: delta.up ? colors.primaryFixed : colors.surfaceContainerHigh },
            ]}
          >
            <MaterialIcons
              name={delta.up ? "trending-up" : "trending-down"}
              size={12}
              color={delta.up ? colors.onPrimaryFixedVariant : colors.onSurfaceVariant}
            />
            <Text
              style={[
                styles.deltaText,
                { color: delta.up ? colors.onPrimaryFixedVariant : colors.onSurfaceVariant },
              ]}
            >
              {delta.value}
            </Text>
          </View>
        )}
      </View>
      <View style={{ marginTop: spacing.md }}>
        <Text style={styles.label}>{label}</Text>
        <View style={styles.valueRow}>
          <Text style={styles.value}>{value}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceContainerLowest,
    padding: spacing.md,
    borderRadius: 14,
    ...shadows.sm,
    flex: 1,
  },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  delta: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 9999,
    gap: 2,
  },
  deltaText: { fontSize: 10, fontWeight: fontWeight.bold },
  label: {
    fontSize: fontSize["body-sm"],
    color: colors.onSurfaceVariant,
  },
  valueRow: { flexDirection: "row", alignItems: "baseline", gap: 4, marginTop: 2 },
  value: {
    fontSize: fontSize["price-display"],
    fontWeight: fontWeight.bold,
    color: colors.onSurface,
  },
});
