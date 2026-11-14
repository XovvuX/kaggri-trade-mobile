import React from "react";
import { View, Text, Pressable, StyleSheet, ViewStyle } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { colors, fontSize, fontWeight, spacing, borderRadius } from "@/theme";

type IconName = React.ComponentProps<typeof MaterialIcons>["name"];

type Props = {
  selected: boolean;
  onSelect: () => void;
  icon: IconName;
  title: string;
  duration: string;
  description: string;
  price: string;
  iconColor?: string;
  style?: ViewStyle;
};

export function ShippingOption({
  selected,
  onSelect,
  icon,
  title,
  duration,
  description,
  price,
  iconColor,
  style,
}: Props) {
  return (
    <Pressable
      onPress={onSelect}
      style={({ pressed }) => [
        styles.row,
        selected ? styles.rowSelected : styles.rowDefault,
        pressed && { opacity: 0.9 },
        style,
      ]}
    >
      <View
        style={[
          styles.radio,
          {
            backgroundColor: selected ? colors.green : colors.line,
          },
        ]}
      >
        {selected && <MaterialIcons name="check" size={13} color={colors.white} />}
      </View>
      <View style={{ flex: 1, marginLeft: spacing.sm }}>
        <View style={styles.titleRow}>
          <MaterialIcons name={icon} size={17} color={iconColor ?? colors.green} />
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.duration}>· {duration}</Text>
        </View>
        <Text style={styles.description}>{description}</Text>
      </View>
      <Text style={styles.price}>{price} ₫</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  rowDefault: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
  },
  rowSelected: {
    backgroundColor: colors.greenSoft,
    borderColor: colors.green,
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  title: { fontSize: fontSize["label-lg"], fontWeight: fontWeight.bold, color: colors.dark },
  duration: { fontSize: fontSize["body-sm"], color: colors.muted },
  description: {
    fontSize: fontSize["body-sm"],
    color: colors.muted,
    marginTop: 2,
    marginLeft: 23,
  },
  price: {
    fontSize: fontSize["price-display"],
    fontWeight: fontWeight.extrabold,
    color: colors.green,
  },
});
