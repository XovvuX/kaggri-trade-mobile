import React from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import { colors, fontWeight, borderRadius } from "@/theme";

export type BadgeStatus =
  | "pending"
  | "preparing"
  | "shipping"
  | "completed"
  | "cancelled"
  | "selling"
  | "outofstock"
  | "hidden"
  | "accepted"
  | "expired"
  // Kaggri-Trade native statuses
  | "APPROVED"
  | "ACTIVE"
  | "SIGNED"
  | "IN_STOCK"
  | "ACCEPTED"
  | "REJECTED"
  | "SUSPENDED"
  | "OUT_OF_STOCK"
  | "CANCELLED"
  | "DRAFT"
  | "HIDDEN"
  | "ARCHIVED"
  | "PENDING_REVIEW"
  | "SUBMITTED"
  | "PREORDER";

export type StatusBadgeStatus = BadgeStatus;

const STATUS_MAP: Record<string, { label: string; bg: string; text: string }> = {
  // Kaggri green tone
  APPROVED: { label: "APPROVED", bg: colors.badgeGreenBg, text: colors.badgeGreenText },
  ACTIVE: { label: "ACTIVE", bg: colors.badgeGreenBg, text: colors.badgeGreenText },
  SIGNED: { label: "SIGNED", bg: colors.badgeGreenBg, text: colors.badgeGreenText },
  IN_STOCK: { label: "Sẵn hàng", bg: colors.badgeGreenBg, text: colors.badgeGreenText },
  ACCEPTED: { label: "ACCEPTED", bg: colors.badgeGreenBg, text: colors.badgeGreenText },
  selling: { label: "Sẵn hàng", bg: colors.badgeGreenBg, text: colors.badgeGreenText },
  completed: { label: "Hoàn thành", bg: colors.badgeGreenBg, text: colors.badgeGreenText },
  accepted: { label: "Đã chấp nhận", bg: colors.badgeGreenBg, text: colors.badgeGreenText },

  // Kaggri amber tone
  PENDING_REVIEW: { label: "PENDING REVIEW", bg: colors.badgeAmberBg, text: colors.badgeAmberText },
  SUBMITTED: { label: "SUBMITTED", bg: colors.badgeAmberBg, text: colors.badgeAmberText },
  PREORDER: { label: "Đặt trước", bg: colors.badgeAmberBg, text: colors.badgeAmberText },
  pending: { label: "Chờ xác nhận", bg: colors.badgeAmberBg, text: colors.badgeAmberText },
  preparing: { label: "Đang chuẩn bị", bg: colors.badgeAmberBg, text: colors.badgeAmberText },
  shipping: { label: "Đang giao", bg: colors.badgeGreenBg, text: colors.badgeGreenText },

  // Kaggri red tone
  REJECTED: { label: "REJECTED", bg: colors.badgeRedBg, text: colors.badgeRedText },
  SUSPENDED: { label: "SUSPENDED", bg: colors.badgeRedBg, text: colors.badgeRedText },
  OUT_OF_STOCK: { label: "Tạm hết", bg: colors.badgeRedBg, text: colors.badgeRedText },
  CANCELLED: { label: "CANCELLED", bg: colors.badgeRedBg, text: colors.badgeRedText },
  cancelled: { label: "Đã hủy", bg: colors.badgeRedBg, text: colors.badgeRedText },
  outofstock: { label: "Tạm hết", bg: colors.badgeRedBg, text: colors.badgeRedText },

  // Kaggri gray tone
  DRAFT: { label: "DRAFT", bg: colors.badgeGrayBg, text: colors.badgeGrayText },
  HIDDEN: { label: "HIDDEN", bg: colors.badgeGrayBg, text: colors.badgeGrayText },
  ARCHIVED: { label: "ARCHIVED", bg: colors.badgeGrayBg, text: colors.badgeGrayText },
  hidden: { label: "Đang ẩn", bg: colors.badgeGrayBg, text: colors.badgeGrayText },
  expired: { label: "Hết hạn", bg: colors.badgeGrayBg, text: colors.badgeGrayText },
};

type Props = {
  status: BadgeStatus | string;
  label?: string;
  style?: ViewStyle;
};

export function StatusBadge({ status, label, style }: Props) {
  const cfg = STATUS_MAP[status] ?? {
    label: String(status).replace(/_/g, " "),
    bg: colors.badgeAmberBg,
    text: colors.badgeAmberText,
  };
  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg }, style]}>
      <Text style={[styles.text, { color: cfg.text }]}>{label ?? cfg.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
    alignSelf: "flex-start",
  },
  text: {
    fontSize: 10,
    fontWeight: fontWeight.extrabold,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
});
