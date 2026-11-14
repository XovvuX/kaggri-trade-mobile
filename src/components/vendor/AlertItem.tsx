import React from "react";
import { Pressable, Text, View, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { colors, fontSize, fontWeight, spacing, borderRadius, shadows } from "@/theme";

type IconName = React.ComponentProps<typeof MaterialIcons>["name"];

type Props = {
  icon: IconName;
  iconColor: string;
  boldText: string;
  normalText?: string;
  onPress: () => void;
};

export function AlertItem({ icon, iconColor, boldText, normalText, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: colors.surfaceContainerHigh }}
      style={({ pressed }) => [
        styles.card,
        { borderLeftColor: iconColor },
        pressed && styles.cardPressed,
      ]}
    >
      <View style={[styles.iconBox, { backgroundColor: iconColor + "1A" }]}>
        <MaterialIcons name={icon} size={18} color={iconColor} />
      </View>
      <Text style={styles.text} numberOfLines={2}>
        <Text style={styles.bold}>{boldText}</Text>
        {normalText ? ` ${normalText}` : null}
      </Text>
      <MaterialIcons name="chevron-right" size={18} color={colors.outline} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: borderRadius.md,
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 10,
    borderLeftWidth: 3,
    ...shadows.sm,
  },
  cardPressed: {
    backgroundColor: colors.surfaceContainerLow,
    transform: [{ scale: 0.99 }],
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  text: { flex: 1, fontSize: fontSize["body-sm"], color: colors.onSurface, lineHeight: 18 },
  bold: { fontWeight: fontWeight.bold, color: colors.onSurface },
});
