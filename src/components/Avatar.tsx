import React from "react";
import { View, Text, Image, Pressable, StyleSheet, ViewStyle } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { colors, fontSize, fontWeight, spacing, borderRadius, shadows } from "@/theme";

type IconName = React.ComponentProps<typeof MaterialIcons>["name"];

type Props = {
  name: string;
  subtitle?: string;
  size?: number;
  backgroundColor?: string;
  initial?: string;
  icon?: IconName;
    onPress?: () => void;
  verified?: boolean;
  badge?: { icon: IconName; color?: string };
  style?: ViewStyle;
  children?: React.ReactNode;
};

export function Avatar({
  name,
  subtitle,
  size = 40,
  backgroundColor,
  initial,
  icon,
  onPress,
  verified,
  badge,
  style,
}: Props) {
  const bg = backgroundColor ?? colors.primaryContainer;
  const fg = backgroundColor ? colors.onPrimary : colors.onPrimary;
  const content = icon ? (
    <MaterialIcons name={icon} size={size * 0.5} color={fg} />
  ) : (
    <Text style={[styles.initial, { fontSize: size * 0.4, color: fg }]}>
      {(initial ?? name.charAt(0)).toUpperCase()}
    </Text>
  );

  const avatar = (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: bg,
        },
        verified && { borderWidth: 2, borderColor: colors.onPrimary },
        style,
      ]}
    >
      {content}
      {verified && (
        <View style={[styles.verifiedBadge, { right: -2, top: -2 }]}>
          <MaterialIcons name="verified" size={size * 0.32} color={colors.primary} />
        </View>
      )}
      {badge && !verified && (
        <View style={[styles.badgeDot, { right: 0, top: 0, backgroundColor: badge.color ?? colors.error }]}>
          <MaterialIcons name={badge.icon} size={size * 0.28} color={colors.onPrimary} />
        </View>
      )}
    </View>
  );

  if (onPress) {
    return <Pressable onPress={onPress}>{avatar}</Pressable>;
  }
  return avatar;
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible",
  },
  initial: { fontWeight: fontWeight.bold },
  verifiedBadge: {
    position: "absolute",
    backgroundColor: colors.primaryFixed,
    borderRadius: 9999,
  },
  badgeDot: {
    position: "absolute",
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
});
