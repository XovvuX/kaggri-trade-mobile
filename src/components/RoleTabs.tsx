import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { colors, fontWeight, borderRadius } from "@/theme";

type Role = "buyer" | "vendor";

type Props = {
  value: Role;
  onChange: (role: Role) => void;
};

export function RoleTabs({ value, onChange }: Props) {
  return (
    <View style={styles.container}>
      <Pressable
        onPress={() => onChange("buyer")}
        style={[styles.tab, value === "buyer" && styles.tabActive]}
      >
        <View style={styles.tabTop}>
          <MaterialIcons
            name="shopping-bag"
            size={15}
            color={value === "buyer" ? colors.green : colors.muted}
          />
          <Text style={[styles.label, value === "buyer" && styles.labelActive]}>
            Người mua
          </Text>
        </View>
        <Text style={styles.subLabel}>Tìm nông sản tốt</Text>
      </Pressable>
      <Pressable
        onPress={() => onChange("vendor")}
        style={[styles.tab, value === "vendor" && styles.tabActive]}
      >
        <View style={styles.tabTop}>
          <MaterialIcons
            name="storefront"
            size={15}
            color={value === "vendor" ? colors.green : colors.muted}
          />
          <Text style={[styles.label, value === "vendor" && styles.labelActive]}>
            Nhà cung cấp
          </Text>
        </View>
        <Text style={styles.subLabel}>Đưa hàng lên Kaggri</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: 10,
  },
  tab: {
    flex: 1,
    alignItems: "flex-start",
    padding: 12,
    borderRadius: borderRadius.md,
    backgroundColor: "#f3f5ef",
    borderWidth: 1,
    borderColor: "#dfe5da",
    gap: 3,
  },
  tabActive: {
    backgroundColor: colors.greenSoft,
    borderColor: colors.green,
  },
  tabTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: fontWeight.extrabold,
    color: colors.dark,
  },
  labelActive: {
    color: colors.dark,
  },
  subLabel: {
    fontSize: 11,
    color: "#6e796d",
  },
});
