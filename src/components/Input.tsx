import React from "react";
import { View, Text, TextInput, StyleSheet, ViewStyle, TextInputProps } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { colors, fontSize, fontWeight, borderRadius } from "@/theme";

type IconName = React.ComponentProps<typeof MaterialIcons>["name"];

type Props = TextInputProps & {
  label?: string;
  required?: boolean;
  icon?: IconName;
  rightElement?: React.ReactNode;
  containerStyle?: ViewStyle;
  hint?: string;
};

export function Input({
  label,
  required,
  icon,
  rightElement,
  containerStyle,
  hint,
  style,
  ...rest
}: Props) {
  return (
    <View style={containerStyle}>
      {label && (
        <Text style={styles.label}>
          {label}
          {required && <Text style={{ color: colors.danger }}> *</Text>}
        </Text>
      )}
      <View style={styles.inputRow}>
        {icon && (
          <MaterialIcons
            name={icon}
            size={16}
            color="#8a9387"
            style={styles.leftIcon}
          />
        )}
        <TextInput
          placeholderTextColor="#9aa297"
          style={[
            styles.input,
            icon && { paddingLeft: 34 },
            rightElement ? { paddingRight: 44 } : undefined,
            rest.multiline && {
              minHeight: 84,
              textAlignVertical: "top",
              paddingTop: 10,
            },
            style,
          ]}
          {...rest}
        />
        {rightElement && <View style={styles.rightEl}>{rightElement}</View>}
      </View>
      {hint && <Text style={styles.hint}>{hint}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 11,
    fontWeight: fontWeight.bold,
    color: "#516153",
    marginBottom: 6,
  },
  inputRow: {
    position: "relative",
    justifyContent: "center",
  },
  leftIcon: {
    position: "absolute",
    left: 11,
    zIndex: 1,
  },
  input: {
    backgroundColor: colors.panel,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    paddingHorizontal: 11,
    paddingVertical: 9,
    fontSize: fontSize["body-md"],
    color: colors.text,
  },
  rightEl: {
    position: "absolute",
    right: 11,
  },
  hint: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 4,
  },
});
