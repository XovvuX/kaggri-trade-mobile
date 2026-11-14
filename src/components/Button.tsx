import React from "react";
import { Pressable, Text, StyleSheet, ViewStyle, TextStyle } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { colors, fontSize, fontWeight, borderRadius } from "@/theme";

type IconName = React.ComponentProps<typeof MaterialIcons>["name"];

type Props = {
  title: string;
  onPress?: () => void;
  variant?: "primary" | "secondary" | "outline" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  icon?: IconName;
  iconRight?: IconName;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
};

export function Button({
  title,
  onPress,
  variant = "primary",
  size = "md",
  icon,
  iconRight,
  disabled,
  fullWidth,
  style,
  textStyle,
}: Props) {
  const bgMap: Record<string, string> = {
    primary: colors.green,
    secondary: colors.panel,
    outline: colors.panel,
    danger: colors.badgeRedBg,
    ghost: "transparent",
  };
  const textColorMap: Record<string, string> = {
    primary: colors.white,
    secondary: colors.text,
    outline: colors.text,
    danger: colors.badgeRedText,
    ghost: colors.green,
  };
  const borderMap: Record<string, string | undefined> = {
    primary: colors.green,
    secondary: "#d8ded3",
    outline: "#d8ded3",
    danger: "#ebcfc6",
    ghost: undefined,
  };

  const heights = { sm: 34, md: 40, lg: 44 };
  const paddings = { sm: 12, md: 15, lg: 18 };
  const fontSizes = { sm: 11, md: 12, lg: 13 };
  const iconSizes = { sm: 14, md: 16, lg: 17 };

  const borderColor = borderMap[variant];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: bgMap[variant],
          height: heights[size],
          paddingHorizontal: paddings[size],
          opacity: disabled ? 0.5 : pressed ? 0.88 : 1,
          borderWidth: borderColor ? 1 : 0,
          borderColor: borderColor,
        },
        fullWidth && { width: "100%" },
        style,
      ]}
    >
      {icon && <MaterialIcons name={icon} size={iconSizes[size]} color={textColorMap[variant]} />}
      <Text
        style={[
          styles.label,
          { color: textColorMap[variant], fontSize: fontSizes[size] },
          textStyle,
        ]}
      >
        {title}
      </Text>
      {iconRight && (
        <MaterialIcons name={iconRight} size={iconSizes[size]} color={textColorMap[variant]} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: borderRadius.md,
    gap: 7,
  },
  label: {
    fontWeight: fontWeight.bold,
  },
});
