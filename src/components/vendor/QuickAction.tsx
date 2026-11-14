import React, { useState } from "react";
import { Pressable, Text, View, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { colors, fontSize, fontWeight, shadows } from "@/theme";

type IconName = React.ComponentProps<typeof MaterialIcons>["name"];

type Props = {
  icon: IconName;
  label: string;
  color: string;
  fg: string;
  badge?: string;
  onPress: () => void;
};

export function QuickAction({ icon, label, color, fg, badge, onPress }: Props) {
  const [pressed, setPressed] = useState(false);

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={[styles.item, pressed && styles.itemPressed]}
    >
      <View
        style={[
          styles.iconBox,
          { backgroundColor: color },
          pressed && styles.iconBoxPressed,
        ]}
      >
        <MaterialIcons name={icon} size={22} color={fg} />
        {badge ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.label} numberOfLines={2}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  item: { width: "33%", alignItems: "center", padding: 8, gap: 8 },
  itemPressed: { opacity: 0.85 },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    ...shadows.md,
    shadowOffset: { width: 0, height: 2 },
  },
  iconBoxPressed: {
    transform: [{ scale: 0.95 }],
    ...shadows.sm,
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: colors.error,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 5,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.surface,
  },
  badgeText: {
    color: colors.onError,
    fontSize: 10,
    fontWeight: fontWeight.bold,
    lineHeight: 12,
  },
  label: {
    fontSize: 12,
    color: colors.onSurface,
    fontWeight: fontWeight.semibold,
    textAlign: "center",
    lineHeight: 16,
  },
});
