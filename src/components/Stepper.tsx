import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { colors, fontSize, fontWeight, spacing, borderRadius } from "@/theme";

type Item = {
  key: string;
  label: string;
};

type Props = {
  steps: Item[];
  current: number; // 0-based index
  onChange?: (index: number) => void;
};

export function Stepper({ steps, current }: Props) {
  return (
    <View style={styles.container}>
      {steps.map((step, index) => {
        const isActive = index === current;
        const isCompleted = index < current;

        return (
          <React.Fragment key={step.key}>
            <View style={styles.stepItem}>
              <View
                style={[
                  styles.dot,
                  {
                    backgroundColor: isActive
                      ? colors.primary
                      : isCompleted
                      ? colors.success
                      : colors.gray300,
                  },
                ]}
              >
                <Text style={styles.dotText}>
                  {isCompleted ? "✓" : index + 1}
                </Text>
              </View>
              <Text
                style={[
                  styles.label,
                  {
                    color: isActive
                      ? colors.primary
                      : isCompleted
                      ? colors.textPrimary
                      : colors.textMuted,
                    fontWeight: isActive ? fontWeight.bold : fontWeight.medium,
                  },
                ]}
                numberOfLines={1}
              >
                {step.label}
              </Text>
            </View>
            {index < steps.length - 1 && (
              <View
                style={[
                  styles.line,
                  { backgroundColor: isCompleted ? colors.success : colors.gray300 },
                ]}
              />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
  },
  stepItem: {
    alignItems: "center",
    flex: 1,
  },
  dot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
  },
  dotText: {
    color: colors.white,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  label: {
    fontSize: fontSize.xs,
    textAlign: "center",
  },
  line: {
    width: 32,
    height: 2,
    marginTop: -18,
  },
});
