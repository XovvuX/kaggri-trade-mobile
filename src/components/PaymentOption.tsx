import React from "react";
import { View, Text, Pressable, StyleSheet, ViewStyle } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { colors, fontSize, fontWeight, spacing, borderRadius, shadows } from "@/theme";

type IconName = React.ComponentProps<typeof MaterialIcons>["name"];

type Props = {
  selected: boolean;
  onSelect: () => void;
  icon: IconName;
  title: string;
  badge?: string;
  description?: string;
  meta?: React.ReactNode;
  rightElement?: React.ReactNode;
  style?: ViewStyle;
};

export function PaymentOption({
  selected,
  onSelect,
  icon,
  title,
  badge,
  description,
  meta,
  rightElement,
  style,
}: Props) {
  return (
    <Pressable
      onPress={onSelect}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: selected ? colors.surfaceContainerLow : colors.surfaceContainerLowest },
        pressed && { opacity: 0.9 },
        style,
      ]}
    >
      <View
        style={[
          styles.iconBox,
          { backgroundColor: selected ? colors.primaryContainer : colors.surfaceContainerHigh },
        ]}
      >
        <MaterialIcons
          name={icon}
          size={22}
          color={selected ? colors.onPrimary : colors.onSurface}
        />
      </View>
      <View style={{ flex: 1, marginLeft: spacing.md }}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{title}</Text>
          {badge && (
            <View
              style={[
                styles.badge,
                {
                  backgroundColor:
                    badge === "Mặc định" ? colors.primary : colors.surfaceContainerHigh,
                },
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  { color: badge === "Mặc định" ? colors.onPrimary : colors.primary },
                ]}
              >
                {badge}
              </Text>
            </View>
          )}
        </View>
        {description && <Text style={styles.description}>{description}</Text>}
        {meta && <View style={styles.metaRow}>{meta}</View>}
      </View>
      {rightElement ?? (
        <View
          style={[
            styles.radio,
            {
              backgroundColor: selected ? colors.primary : colors.surfaceContainerHigh,
            },
          ]}
        >
          {selected && <View style={styles.radioDot} />}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: spacing.lg,
    gap: 0,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
  title: { fontSize: fontSize["label-lg"], fontWeight: fontWeight.bold, color: colors.onSurface },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 9999 },
  badgeText: { fontSize: 10, fontWeight: fontWeight.bold, textTransform: "uppercase" },
  description: {
    fontSize: fontSize["body-sm"],
    color: colors.onSurfaceVariant,
    marginTop: 2,
    lineHeight: 18,
  },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.onPrimary,
  },
});
