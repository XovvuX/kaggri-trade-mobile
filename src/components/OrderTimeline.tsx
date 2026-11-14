import React from "react";
import { View, Text, StyleSheet, ViewStyle, ScrollView } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { colors, fontSize, fontWeight, spacing } from "@/theme";

type IconName = React.ComponentProps<typeof MaterialIcons>["name"];

type Step = {
  label: string;
  description?: string;
  time?: string;
  status: "done" | "active" | "pending";
  icon?: IconName;
  meta?: React.ReactNode; // extra info row
};

type Props = {
  steps: Step[];
  style?: ViewStyle;
};

export function OrderTimeline({ steps, style }: Props) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.line} />
      {steps.map((step, i) => {
        const isLast = i === steps.length - 1;
        return (
          <View key={i} style={[styles.step, !isLast && { marginBottom: 20 }]}>
            <View
              style={[
                styles.dot,
                step.status === "done" && styles.dotDone,
                step.status === "active" && styles.dotActive,
                step.status === "pending" && styles.dotPending,
              ]}
            >
              {step.status === "done" ? (
                <MaterialIcons name="check" size={14} color={colors.onPrimary} />
              ) : step.status === "active" ? (
                <MaterialIcons name={step.icon ?? "local-shipping"} size={14} color={colors.onPrimary} />
              ) : (
                <MaterialIcons name="radio-button-unchecked" size={12} color={colors.onSurfaceVariant} />
              )}
            </View>
            <View style={{ flex: 1, paddingLeft: 8 }}>
              <Text
                style={[
                  styles.label,
                  step.status === "active" && { color: colors.primary, fontWeight: fontWeight.bold },
                  step.status === "pending" && { color: colors.onSurfaceVariant, opacity: 0.7 },
                ]}
              >
                {step.label}
              </Text>
              {step.description && (
                <Text
                  style={[
                    styles.description,
                    step.status === "pending" && { opacity: 0.7 },
                  ]}
                >
                  {step.description}
                </Text>
              )}
              {step.time && <Text style={styles.time}>{step.time}</Text>}
              {step.meta && <View style={styles.meta}>{step.meta}</View>}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: "relative", paddingLeft: 28 },
  line: {
    position: "absolute",
    left: 11,
    top: 12,
    bottom: 12,
    width: 2,
    backgroundColor: colors.surfaceVariant,
  },
  step: { flexDirection: "row", alignItems: "flex-start" },
  dot: {
    position: "absolute",
    left: -28,
    top: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  dotDone: { backgroundColor: colors.primary },
  dotActive: { backgroundColor: colors.primaryContainer, transform: [{ scale: 1.1 }] },
  dotPending: { backgroundColor: colors.surfaceVariant },
  label: {
    fontSize: fontSize["label-lg"],
    fontWeight: fontWeight.semibold,
    color: colors.onSurface,
  },
  description: {
    fontSize: fontSize["body-sm"],
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
  time: {
    fontSize: fontSize["body-sm"],
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
  meta: {
    marginTop: 6,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 6,
    padding: 8,
  },
});
