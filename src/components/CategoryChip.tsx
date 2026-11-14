import React from "react";
import { Pressable, Text, StyleSheet, ViewStyle } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { colors, fontWeight } from "@/theme";

type IconName = React.ComponentProps<typeof MaterialIcons>["name"];

type Props = {
  label: string;
  emoji?: string;
  icon?: IconName;
  active?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
};

export function CategoryChip({ label, emoji, icon, active, onPress, style }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        active && styles.chipActive,
        pressed && { opacity: 0.85 },
        style,
      ]}
    >
      {icon && (
        <MaterialIcons
          name={icon}
          size={14}
          color={active ? colors.white : colors.text}
        />
      )}
      {emoji && !icon && <Text style={styles.emoji}>{emoji}</Text>}
      <Text style={[styles.label, active && styles.labelActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 6,
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: "#dee4da",
    gap: 6,
  },
  chipActive: {
    backgroundColor: colors.green,
    borderColor: colors.green,
  },
  emoji: {
    fontSize: 13,
  },
  label: {
    fontSize: 11,
    fontWeight: fontWeight.bold,
    color: "#4d594e",
  },
  labelActive: {
    color: colors.white,
  },
});
