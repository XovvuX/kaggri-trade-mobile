import React from "react";
import { Pressable, Text, View, StyleSheet, ViewStyle } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { colors, fontSize, fontWeight, spacing, borderRadius, shadows } from "@/theme";
import { StatusBadge, type StatusBadgeStatus } from "@/components/StatusBadge";

type Props = {
  id: string;
  buyer: string;
  product: string;
  qty: string;
  amount: string;
  time: string;
  status: StatusBadgeStatus;
  priority?: string;
  onPress: () => void;
  /** Bỏ margin ngang khi dùng trong carousel/grid */
  compact?: boolean;
  style?: ViewStyle;
};

export function OrderCard({
  id,
  buyer,
  product,
  qty,
  amount,
  time,
  status,
  priority,
  onPress,
  compact,
  style,
}: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        compact && styles.cardCompact,
        pressed && styles.cardPressed,
        style,
      ]}
    >
      {priority ? <View style={styles.priorityRibbon} /> : null}

      <View style={styles.top}>
        <View style={styles.idRow}>
          <Text style={styles.id} numberOfLines={1}>
            {id}
          </Text>
          {priority ? (
            <View style={styles.priorityPill}>
              <MaterialIcons name="priority-high" size={10} color={colors.onSecondaryFixed} />
              <Text style={styles.priorityText}>{priority}</Text>
            </View>
          ) : null}
        </View>
        <StatusBadge status={status} />
      </View>

      <View style={styles.buyerRow}>
        <View style={styles.buyerIcon}>
          <MaterialIcons name="storefront" size={16} color={colors.onPrimary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.buyerName} numberOfLines={1}>
            {buyer}
          </Text>
          <Text style={styles.time}>{time}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.productRow}>
        <Text style={styles.productText} numberOfLines={1}>
          🥬 {product}
        </Text>
        <View style={styles.qtyPill}>
          <Text style={styles.qtyText}>{qty}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <View>
          <Text style={styles.totalLabel}>Tổng cộng</Text>
          <Text style={styles.total}>{amount}</Text>
        </View>
        <View style={styles.actionBtn}>
          <Text style={styles.actionText}>Chi tiết</Text>
          <MaterialIcons name="arrow-forward" size={14} color={colors.onPrimaryContainer} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceContainerLowest,
    marginHorizontal: spacing.gutter,
    marginBottom: 14,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    paddingLeft: spacing.lg + 3, // leave room for priority ribbon
    overflow: "hidden",
    position: "relative",
    ...shadows.md,
    shadowOffset: { width: 0, height: 2 },
  },
  cardPressed: {
    transform: [{ scale: 0.99 }],
    ...shadows.sm,
  },
  cardCompact: {
    marginHorizontal: 0,
    marginBottom: 0,
  },
  priorityRibbon: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: colors.secondary,
  },
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  idRow: { flexDirection: "row", alignItems: "center", gap: 6, flex: 1, marginRight: 8 },
  id: {
    fontSize: 11,
    color: colors.outline,
    fontFamily: "monospace",
    fontWeight: fontWeight.semibold,
    letterSpacing: 0.3,
  },
  priorityPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    backgroundColor: colors.secondary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priorityText: { fontSize: 9, color: colors.onSecondary, fontWeight: fontWeight.bold, letterSpacing: 0.5 },
  buyerRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 10 },
  buyerIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primaryContainer,
    alignItems: "center",
    justifyContent: "center",
  },
  buyerName: { fontSize: fontSize["body-md"], color: colors.onSurface, fontWeight: fontWeight.bold },
  time: { fontSize: 11, color: colors.onSurfaceVariant, marginTop: 2 },
  divider: {
    height: 1,
    backgroundColor: colors.outlineVariant + "55",
    marginVertical: 12,
  },
  productRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  productText: { flex: 1, fontSize: fontSize["body-sm"], color: colors.onSurface, fontWeight: fontWeight.medium },
  qtyPill: {
    backgroundColor: colors.primaryContainer + "20",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  qtyText: { fontSize: 11, color: colors.primary, fontWeight: fontWeight.bold },
  footer: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginTop: 14,
  },
  totalLabel: { fontSize: 10, color: colors.onSurfaceVariant, fontWeight: fontWeight.medium, marginBottom: 2 },
  total: { fontSize: fontSize["headline-sm"], fontWeight: fontWeight.bold, color: colors.primary },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.surfaceContainer,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionText: { fontSize: 12, color: colors.onPrimaryContainer, fontWeight: fontWeight.semibold },
});
