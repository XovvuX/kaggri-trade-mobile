import React from "react";
import { Text, View, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { colors, fontSize, fontWeight, spacing, borderRadius, shadows } from "@/theme";

type Props = {
  title: string;
  description: string;
  pillText: string;
};

export function ContractFooter({ title, description, pillText }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.iconBox}>
        <MaterialIcons
          name="verified-user"
          size={22}
          color={colors.onPrimary}
          style={{ fontVariationSettings: "'FILL' 1" } as any}
        />
      </View>
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <MaterialIcons name="verified" size={14} color={colors.primary} />
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
        </View>
        <Text style={styles.desc} numberOfLines={2}>
          {description}
        </Text>
      </View>
      <View style={styles.pill}>
        <Text style={styles.pillText}>{pillText}</Text>
        <MaterialIcons name="arrow-forward" size={12} color={colors.onPrimaryContainer} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: spacing.gutter,
    marginTop: 8,
    marginBottom: 16,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.primaryContainer + "30",
    ...shadows.sm,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primaryContainer,
    alignItems: "center",
    justifyContent: "center",
  },
  body: { flex: 1 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  title: { fontSize: fontSize["body-sm"], color: colors.onSurface, fontWeight: fontWeight.bold },
  desc: { fontSize: 11, color: colors.onSurfaceVariant, marginTop: 2, lineHeight: 15 },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.surfaceContainer,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  pillText: { fontSize: 11, color: colors.onPrimaryContainer, fontWeight: fontWeight.semibold },
});
