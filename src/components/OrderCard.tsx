import React from "react";
import { View, Text, Pressable, Image, StyleSheet, ViewStyle } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { colors, fontSize, fontWeight, spacing, borderRadius } from "@/theme";
import { StatusBadge } from "./StatusBadge";
import { VerifiedBadge } from "./VerifiedBadge";
import { resolveImageSource } from "@/services/api";

type IconName = React.ComponentProps<typeof MaterialIcons>["name"];

export type OrderItem = {
  name: string;
  subtitle?: string;
  price: string;
  unit?: string;
  qty: string;
  emoji: string;
  image?: string;
};

export type Order = {
  id: string;
  vendor: string;
  status: "pending" | "preparing" | "shipping" | "completed" | "cancelled";
  items: OrderItem[];
  total: string;
  totalLabel?: string;
  certification?: "vietgap" | "ocop" | "globalgap" | "organic";
  badge?: string;
  actions?: Array<{ label: string; icon?: IconName; variant?: "primary" | "outline" }>;
  onPress?: () => void;
};

type Props = {
  order: Order;
  style?: ViewStyle;
  onPress?: () => void;
};

export function OrderCard({ order, style, onPress }: Props) {
  const [brokenImages, setBrokenImages] = React.useState<Record<number, boolean>>({});

  return (
    <Pressable
      onPress={onPress || order.onPress}
      style={({ pressed }) => [
        styles.card,
        pressed && { borderColor: "#b8c7b3" },
        style,
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={styles.idRow}>
            <Text style={styles.orderId}>#{order.id}</Text>
            <Pressable hitSlop={6}>
              <MaterialIcons name="content-copy" size={13} color={colors.muted} />
            </Pressable>
          </View>
          <View style={styles.vendorRow}>
            <MaterialIcons name="verified-user" size={14} color={colors.green} />
            <Text style={styles.vendor} numberOfLines={1}>
              {order.vendor}
            </Text>
          </View>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          {order.certification && <VerifiedBadge variant={order.certification} />}
          <StatusBadge status={order.status} />
        </View>
      </View>

      <View style={styles.divider} />

      {/* Items */}
      {order.items.slice(0, 2).map((item, i) => {
        const imgSource = resolveImageSource(item.image);
        return (
          <View key={i} style={styles.itemRow}>
            <View style={styles.itemImage}>
              {imgSource && !brokenImages[i] ? (
                <Image
                  source={imgSource}
                  style={styles.itemImg}
                  onError={() =>
                    setBrokenImages((prev) => ({ ...prev, [i]: true }))
                  }
                />
              ) : (
                <Text style={styles.itemEmoji}>{item.emoji}</Text>
              )}
            </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <View style={styles.itemTopRow}>
              <Text style={styles.itemName} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={styles.itemPrice}>
                {item.price}₫{item.unit ? `/${item.unit}` : ""}
              </Text>
            </View>
            <View style={styles.itemBottomRow}>
              <Text style={styles.itemSubtitle} numberOfLines={1}>
                {item.subtitle}
              </Text>
              <Text style={styles.itemQty}>SL: {item.qty}</Text>
            </View>
            </View>
          </View>
        );
      })}

      {order.items.length > 2 && (
        <Text style={styles.moreItems}>+{order.items.length - 2} sản phẩm khác</Text>
      )}

      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>
          {order.totalLabel ?? "Tổng cộng:"} {order.items.length} mặt hàng
        </Text>
        <Text style={styles.total}>{order.total} ₫</Text>
      </View>

      {order.actions && order.actions.length > 0 && (
        <>
          <View style={styles.divider} />
          <View style={styles.actionsRow}>
            {order.actions.map((action, i) => (
              <Pressable
                key={i}
                style={({ pressed }) => [
                  styles.actionBtn,
                  action.variant === "primary" ? styles.actionBtnPrimary : styles.actionBtnOutline,
                  pressed && { opacity: 0.85 },
                ]}
              >
                {action.icon && (
                  <MaterialIcons
                    name={action.icon}
                    size={14}
                    color={action.variant === "primary" ? colors.white : colors.text}
                  />
                )}
                <Text
                  style={[
                    styles.actionLabel,
                    { color: action.variant === "primary" ? colors.white : colors.text },
                  ]}
                >
                  {action.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.panel,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.lg,
  },
  header: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  idRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  orderId: {
    fontSize: 11,
    fontWeight: fontWeight.bold,
    color: colors.eyebrow,
    letterSpacing: 0.4,
  },
  vendorRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 4 },
  vendor: {
    fontSize: fontSize["label-lg"],
    fontWeight: fontWeight.bold,
    color: colors.dark,
  },
  divider: { height: 1, backgroundColor: colors.line, marginVertical: spacing.md },
  itemRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 8 },
  itemImage: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  itemImg: { width: "100%", height: "100%" },
  itemEmoji: { fontSize: 24 },
  itemTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  itemName: {
    fontSize: fontSize["label-lg"],
    fontWeight: fontWeight.bold,
    color: colors.dark,
    flex: 1,
  },
  itemPrice: {
    fontSize: fontSize["label-md"],
    fontWeight: fontWeight.bold,
    color: colors.greenAccent,
  },
  itemBottomRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 2 },
  itemSubtitle: { fontSize: fontSize["body-sm"], color: colors.muted, flex: 1 },
  itemQty: { fontSize: fontSize["label-sm"], color: colors.muted, fontWeight: fontWeight.semibold },
  moreItems: {
    fontSize: fontSize["body-sm"],
    color: colors.green,
    fontWeight: fontWeight.semibold,
    textAlign: "center",
    marginVertical: 4,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginTop: 8,
  },
  totalLabel: { fontSize: fontSize["body-sm"], color: colors.muted },
  total: {
    fontSize: fontSize["price-display"],
    fontWeight: fontWeight.extrabold,
    color: colors.green,
  },
  actionsRow: { flexDirection: "row", justifyContent: "flex-end", gap: 8 },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 13,
    height: 34,
    borderRadius: borderRadius.md,
  },
  actionBtnPrimary: { backgroundColor: colors.green },
  actionBtnOutline: {
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: "#d8ded3",
  },
  actionLabel: { fontSize: fontSize["label-md"], fontWeight: fontWeight.bold },
});
