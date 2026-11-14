import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  Linking,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { colors, fontSize, fontWeight, spacing, borderRadius, shadows } from "@/theme";

interface ChatMessage {
  id: string;
  sender: "buyer" | "vendor";
  senderName: string;
  timestamp: string;
  text: string;
  hasPhotos?: boolean;
  hasQuoteCard?: boolean;
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: "m1",
    sender: "buyer",
    senderName: "Nguyễn Văn Tuấn • Thu Mua",
    timestamp: "08:15",
    text: "Chào HTX Lạc Dương, bên mình chuẩn bị nhập 1 tấn Cà chua Beef cho hệ thống siêu thị cuối tuần này. Giá 42.000₫/kg đã bao gồm vận chuyển xe lạnh tới kho Thủ Đức chưa?",
  },
  {
    id: "m2",
    sender: "vendor",
    senderName: "HTX Lạc Dương (Bạn)",
    timestamp: "08:18",
    text: "Chào anh Tuấn! Giá 42.000₫/kg đã gồm trọn gói xe tải lạnh 4-8°C giao tận dock bốc hàng Thủ Đức. Nông sản vừa chụp sáng nay tại nhà kính, quả đỏ đều chuẩn VietGAP 4-5 quả/kg.",
    hasPhotos: true,
  },
  {
    id: "m3",
    sender: "buyer",
    senderName: "Nguyễn Văn Tuấn • Thu Mua",
    timestamp: "08:22",
    text: "Bên mình chốt khối lượng 1.000 kg. HTX gửi lại bảng chốt giá chính thức có mã ký quỹ Escrow để kế toán bên mình duyệt chuyển khoản nhé.",
  },
  {
    id: "m4",
    sender: "vendor",
    senderName: "HTX Lạc Dương (Báo giá B2B)",
    timestamp: "08:25",
    text: "Gửi anh Tuấn bảng báo giá sỉ chính thức có bảo chứng ký quỹ Escrow VOVU.",
    hasQuoteCard: true,
  },
];

const QUICK_CHIPS = [
  "📦 Xác nhận lịch xe lạnh",
  "📸 Gửi thêm ảnh thực tế vườn",
  "📑 Gửi chứng nhận VietGAP",
  "⚖️ Phiếu cân điện tử",
];

export default function VendorChatScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id?: string }>();

  const scrollViewRef = useRef<any>(null);
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState("");

  const handleSend = () => {
    if (!inputText.trim()) return;

    const newMsg: ChatMessage = {
      id: "m_" + Date.now(),
      sender: "vendor",
      senderName: "HTX Lạc Dương (Bạn)",
      timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
      text: inputText.trim(),
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputText("");
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleSendQuickChip = (chipText: string) => {
    const newMsg: ChatMessage = {
      id: "m_" + Date.now(),
      sender: "vendor",
      senderName: "HTX Lạc Dương (Bạn)",
      timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
      text: chipText,
    };

    setMessages((prev) => [...prev, newMsg]);
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Pressable onPress={() => router.back()} style={styles.iconBtn} hitSlop={8}>
              <MaterialIcons name="arrow-back" size={24} color={colors.onSurface} />
            </Pressable>

            {/* Avatar with Online Badge */}
            <View style={styles.avatarBox}>
              <MaterialIcons name="storefront" size={22} color={colors.primary} />
              <View style={styles.onlineDot} />
            </View>

            <View style={{ flex: 1, minWidth: 0 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Text style={styles.partnerName} numberOfLines={1}>Nguyễn Văn Tuấn</Text>
                <View style={styles.goldBadge}>
                  <Text style={styles.goldBadgeText}>B2B Gold</Text>
                </View>
              </View>
              <Text style={styles.partnerCompany} numberOfLines={1}>
                Siêu Thị Thực Phẩm Xanh • Trực tuyến
              </Text>
            </View>
          </View>

          {/* Action icons */}
          <View style={styles.headerRight}>
            <Pressable
              onPress={() => Linking.openURL("tel:0912345678")}
              style={styles.headerIconBtn}
              hitSlop={6}
            >
              <MaterialIcons name="phone-in-talk" size={20} color={colors.onSurfaceVariant} />
            </Pressable>
            <Pressable
              onPress={() => Alert.alert("Kiểm tra hiện trường", "Đang kết nối luồng video trực tiếp vườn nhà kính...")}
              style={styles.headerIconBtn}
              hitSlop={6}
            >
              <MaterialIcons name="videocam" size={20} color={colors.onSurfaceVariant} />
            </Pressable>
            <Pressable
              onPress={() => router.push("/vendor/quotes" as any)}
              style={styles.headerIconBtn}
              hitSlop={6}
            >
              <MaterialIcons name="request-quote" size={20} color={colors.secondary} />
            </Pressable>
          </View>
        </View>

        {/* Pinned Contextual Order/Quote Banner */}
        <View style={styles.pinnedBanner}>
          <View style={styles.pinnedLeft}>
            <View style={styles.truckIconBox}>
              <MaterialIcons name="local-shipping" size={20} color={colors.primaryContainer} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Text style={styles.pinnedTitle} numberOfLines={1}>Đang đàm phán: 1.000 kg Cà chua Beef</Text>
                <View style={styles.quoteCodeBadge}>
                  <Text style={styles.quoteCodeText}>#BG-8831</Text>
                </View>
              </View>
              <View style={styles.timerRow}>
                <MaterialIcons name="timer" size={12} color={colors.secondary} />
                <Text style={styles.timerText}>Hiệu lực còn 18h:24m</Text>
              </View>
            </View>
          </View>

          <Pressable
            onPress={() => router.push("/vendor/quotes" as any)}
            style={styles.pinnedActionBtn}
          >
            <Text style={styles.pinnedActionText}>Báo giá</Text>
            <MaterialIcons name="chevron-right" size={16} color={colors.onPrimary} />
          </Pressable>
        </View>

        {/* Message Stream */}
        <ScrollView
          ref={scrollViewRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.streamContent}
        >
          {/* Date Divider */}
          <View style={styles.dateDivider}>
            <Text style={styles.dateDividerText}>Hôm nay, 16 Tháng 10, 2026</Text>
          </View>

          {messages.map((m) => {
            const isVendor = m.sender === "vendor";

            return (
              <View
                key={m.id}
                style={[
                  styles.msgContainer,
                  isVendor ? styles.msgVendor : styles.msgBuyer,
                ]}
              >
                <Text style={[styles.msgSenderName, isVendor && { color: colors.primary, alignSelf: "flex-end" }]}>
                  {m.senderName}
                </Text>

                <View
                  style={[
                    styles.bubble,
                    isVendor ? styles.bubbleVendor : styles.bubbleBuyer,
                    m.hasQuoteCard && styles.bubbleQuoteCard,
                  ]}
                >
                  {/* Normal Text */}
                  <Text style={styles.bubbleText}>{m.text}</Text>

                  {/* Farm photo attachments if any */}
                  {m.hasPhotos && (
                    <View style={styles.photoAttachments}>
                      <View style={styles.photoRow}>
                        <View style={styles.photoSquare}>
                          <Text style={{ fontSize: 32 }}>🍅</Text>
                          <View style={styles.photoTag}>
                            <Text style={styles.photoTagText}>Thực tế lô</Text>
                          </View>
                        </View>
                        <View style={styles.photoSquare}>
                          <Text style={{ fontSize: 32 }}>📦</Text>
                          <View style={styles.photoTag}>
                            <Text style={styles.photoTagText}>Thu hoạch</Text>
                          </View>
                        </View>
                      </View>
                      <View style={styles.photoCaption}>
                        <MaterialIcons name="photo-camera" size={12} color={colors.primary} />
                        <Text style={styles.photoCaptionText}>
                          Chụp lúc 07:15 sáng nay (Nhà kính #03 - Đơn nguyên VietGAP)
                        </Text>
                      </View>
                    </View>
                  )}

                  {/* Embedded Interactive B2B Quote Card */}
                  {m.hasQuoteCard && (
                    <View style={styles.quoteCardInsideBubble}>
                      <View style={styles.quoteCardHeader}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                          <View style={styles.quoteIconBadge}>
                            <MaterialIcons name="request-quote" size={16} color={colors.onPrimary} />
                          </View>
                          <View>
                            <Text style={styles.quoteCardTitle}>BÁO GIÁ SỈ CHÍNH THỨC</Text>
                            <Text style={styles.quoteCardId}>Mã: #BG-20261016-8831</Text>
                          </View>
                        </View>
                        <View style={styles.vietgapPill}>
                          <Text style={styles.vietgapPillText}>VietGAP</Text>
                        </View>
                      </View>

                      {/* Specs */}
                      <View style={styles.quoteSpecsBox}>
                        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                          <Text style={styles.quoteCommodityName}>Cà chua Beef Đà Lạt (Loại 1)</Text>
                          <Text style={styles.quoteCommodityQty}>1.000 kg</Text>
                        </View>
                        <Text style={styles.quoteCommoditySpec}>Quy cách: Thùng xốp 10kg • Size 4-5 quả/kg</Text>
                        <View style={styles.specDivider} />
                        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                          <Text style={styles.specDimLabel}>Đơn giá sỉ xuất kho:</Text>
                          <Text style={styles.specDimVal}>42.000 ₫/kg</Text>
                        </View>
                        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                          <Text style={styles.specDimLabel}>Vận chuyển lạnh (Thủ Đức):</Text>
                          <Text style={[styles.specDimVal, { color: colors.primary }]}>Bao gồm (0 ₫)</Text>
                        </View>
                      </View>

                      {/* Total */}
                      <View style={styles.quoteTotalBox}>
                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}>
                          <Text style={styles.quoteTotalLabel}>Tổng thanh toán đơn sỉ:</Text>
                          <Text style={styles.quoteTotalAmount}>42.000.000 ₫</Text>
                        </View>
                        <Text style={styles.quoteTotalSub}>
                          (Đã bao gồm xe lạnh chuyên dụng 4-8°C • Miễn thuế VAT HTX 0%)
                        </Text>
                      </View>

                      {/* Escrow Guarantee */}
                      <View style={styles.escrowNoticeBox}>
                        <MaterialIcons name="verified-user" size={16} color={colors.primary} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.escrowNoticeTitle}>Bảo chứng ký quỹ Escrow VOVU</Text>
                          <Text style={styles.escrowNoticeDesc}>
                            Giữ tiền an toàn 100% • Tự động giải ngân sau 2h nghiệm thu trạm cân kho Thủ Đức.
                          </Text>
                        </View>
                      </View>

                      {/* CTA Buttons inside Card */}
                      <View style={styles.quoteCardActions}>
                        <Pressable
                          onPress={() => router.push("/vendor/quotes" as any)}
                          style={styles.editQuoteBtn}
                        >
                          <MaterialIcons name="edit-note" size={16} color={colors.onSurface} />
                          <Text style={styles.editQuoteBtnText}>Sửa báo giá</Text>
                        </Pressable>

                        <Pressable
                          onPress={() => router.push("/vendor/order/VO-20261016-8831" as any)}
                          style={styles.createOrderBtn}
                        >
                          <Text style={styles.createOrderBtnText}>Tạo đơn sỉ ngay</Text>
                          <MaterialIcons name="arrow-forward" size={16} color={colors.onPrimary} />
                        </Pressable>
                      </View>
                    </View>
                  )}
                </View>

                {/* Timestamp & Read Receipt */}
                <View style={[styles.msgStatusRow, isVendor && { alignSelf: "flex-end" }]}>
                  <Text style={styles.msgTime}>{m.timestamp}</Text>
                  {isVendor && (
                    <MaterialIcons name="done-all" size={13} color={colors.primary} />
                  )}
                  {isVendor && <Text style={styles.seenText}>Đã xem</Text>}
                </View>
              </View>
            );
          })}
        </ScrollView>

        {/* Quick Suggestion Response Chips */}
        <View style={styles.chipsSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
            {QUICK_CHIPS.map((chip, idx) => (
              <Pressable
                key={idx}
                onPress={() => handleSendQuickChip(chip)}
                style={styles.quickChip}
              >
                <Text style={styles.quickChipText}>{chip}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Chat Input Bar */}
        <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
          <Pressable
            onPress={() => Alert.alert("Đính kèm", "Đính kèm hợp đồng, phiếu cân trạm hoặc chứng nhận VietGAP...")}
            style={styles.inputActionIconBtn}
          >
            <MaterialIcons name="add-circle" size={24} color={colors.onSurfaceVariant} />
          </Pressable>

          <Pressable
            onPress={() => Alert.alert("Chụp ảnh", "Mở camera chụp ảnh thực tế tại vườn nông sản...")}
            style={styles.inputActionIconBtn}
          >
            <MaterialIcons name="photo-camera" size={22} color={colors.onSurfaceVariant} />
          </Pressable>

          <View style={styles.textInputBox}>
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              placeholder="Nhập tin nhắn hoặc thương lượng..."
              placeholderTextColor={colors.outline}
              style={styles.textInputField}
              onSubmitEditing={handleSend}
            />

            {/* Dedicated B2B Quote Action Button */}
            <Pressable
              onPress={() => router.push("/vendor/quotes" as any)}
              style={styles.b2bQuoteShortcutBtn}
            >
              <MaterialIcons name="request-quote" size={14} color={colors.onSecondaryContainer} />
              <Text style={styles.b2bQuoteShortcutText}>Báo giá</Text>
            </Pressable>
          </View>

          <Pressable onPress={handleSend} style={styles.sendBtn}>
            <MaterialIcons name="send" size={18} color={colors.onPrimary} />
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surfaceContainerLowest,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceContainerHigh,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: spacing.xs, flex: 1 },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surfaceContainerLow,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  onlineDot: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.surfaceContainerLowest,
  },
  partnerName: { fontSize: fontSize["body-md"], fontWeight: fontWeight.bold, color: colors.onSurface },
  goldBadge: {
    backgroundColor: colors.secondaryContainer,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: borderRadius.sm,
  },
  goldBadgeText: { fontSize: 8, fontWeight: fontWeight.bold, color: colors.onSecondaryContainer },
  partnerCompany: { fontSize: 10, color: colors.onSurfaceVariant, marginTop: 1 },
  headerRight: { flexDirection: "row", alignItems: "center" },
  headerIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  pinnedBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surfaceContainerLow,
    paddingHorizontal: spacing.gutter,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceContainerHigh,
  },
  pinnedLeft: { flexDirection: "row", alignItems: "center", gap: spacing.sm, flex: 1 },
  truckIconBox: {
    width: 34,
    height: 34,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.primaryContainer + "22",
    alignItems: "center",
    justifyContent: "center",
  },
  pinnedTitle: { fontSize: 11, fontWeight: fontWeight.bold, color: colors.onSurface },
  quoteCodeBadge: {
    backgroundColor: colors.surfaceContainerHigh,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: borderRadius.sm,
  },
  quoteCodeText: { fontSize: 9, color: colors.onSurfaceVariant, fontWeight: fontWeight.bold },
  timerRow: { flexDirection: "row", alignItems: "center", gap: 3, marginTop: 2 },
  timerText: { fontSize: 9, fontWeight: fontWeight.semibold, color: colors.secondary },
  pinnedActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    backgroundColor: colors.primaryContainer,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: borderRadius.sm,
  },
  pinnedActionText: { fontSize: 10, fontWeight: fontWeight.bold, color: colors.onPrimary },
  streamContent: { padding: spacing.gutter, gap: spacing.md, paddingBottom: 20 },
  dateDivider: { alignSelf: "center", marginVertical: 4 },
  dateDividerText: {
    fontSize: 10,
    color: colors.outline,
    backgroundColor: colors.surfaceContainerHigh,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
  },
  msgContainer: { maxWidth: "88%", gap: 2 },
  msgBuyer: { alignSelf: "flex-start" },
  msgVendor: { alignSelf: "flex-end" },
  msgSenderName: { fontSize: 10, color: colors.onSurfaceVariant, marginHorizontal: 4 },
  bubble: {
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    gap: 6,
    ...shadows.xs,
  },
  bubbleBuyer: {
    backgroundColor: colors.surfaceContainerLowest,
    borderTopLeftRadius: 2,
  },
  bubbleVendor: {
    backgroundColor: colors.surfaceContainerHigh,
    borderTopRightRadius: 2,
  },
  bubbleQuoteCard: {
    backgroundColor: colors.surfaceContainerLowest,
    width: "100%",
    padding: 0,
    overflow: "hidden",
  },
  bubbleText: { fontSize: 13, color: colors.onSurface, lineHeight: 18 },
  photoAttachments: { gap: 4, marginTop: 4 },
  photoRow: { flexDirection: "row", gap: 6 },
  photoSquare: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceContainerLow,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  photoTag: {
    position: "absolute",
    bottom: 4,
    left: 4,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 2,
  },
  photoTagText: { fontSize: 8, color: colors.white, fontWeight: fontWeight.bold },
  photoCaption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.7)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  photoCaptionText: { fontSize: 9, color: colors.onSurfaceVariant },
  quoteCardInsideBubble: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  quoteCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.surfaceContainerLow,
    marginHorizontal: -spacing.md,
    marginTop: -spacing.md,
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceContainerHigh,
  },
  quoteIconBadge: {
    width: 28,
    height: 28,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.primaryContainer,
    alignItems: "center",
    justifyContent: "center",
  },
  quoteCardTitle: { fontSize: 10, fontWeight: fontWeight.bold, color: colors.primary, letterSpacing: 0.5 },
  quoteCardId: { fontSize: 10, color: colors.onSurfaceVariant, marginTop: 1 },
  vietgapPill: {
    backgroundColor: colors.primaryFixed,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  vietgapPillText: { fontSize: 9, fontWeight: fontWeight.bold, color: colors.primary },
  quoteSpecsBox: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    gap: 3,
  },
  quoteCommodityName: { fontSize: 12, fontWeight: fontWeight.bold, color: colors.onSurface },
  quoteCommodityQty: { fontSize: 12, fontWeight: fontWeight.bold, color: colors.onSurface },
  quoteCommoditySpec: { fontSize: 10, color: colors.onSurfaceVariant },
  specDivider: { height: 1, backgroundColor: colors.surfaceContainerHigh, marginVertical: 3 },
  specDimLabel: { fontSize: 10, color: colors.outline },
  specDimVal: { fontSize: 10, fontWeight: fontWeight.semibold, color: colors.onSurface },
  quoteTotalBox: {
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    gap: 2,
  },
  quoteTotalLabel: { fontSize: 11, fontWeight: fontWeight.bold, color: colors.onSurface },
  quoteTotalAmount: { fontSize: 18, fontWeight: fontWeight.bold, color: colors.primary },
  quoteTotalSub: { fontSize: 9, color: colors.onSurfaceVariant },
  escrowNoticeBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
  },
  escrowNoticeTitle: { fontSize: 10, fontWeight: fontWeight.bold, color: colors.primary },
  escrowNoticeDesc: { fontSize: 9, color: colors.onSurfaceVariant, marginTop: 1, lineHeight: 13 },
  quoteCardActions: { flexDirection: "row", gap: spacing.xs, paddingTop: 2 },
  editQuoteBtn: {
    flex: 1,
    height: 38,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceContainerHigh,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  editQuoteBtnText: { fontSize: 11, fontWeight: fontWeight.semibold, color: colors.onSurface },
  createOrderBtn: {
    flex: 1.2,
    height: 38,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primaryContainer,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  createOrderBtnText: { fontSize: 11, fontWeight: fontWeight.bold, color: colors.onPrimary },
  msgStatusRow: { flexDirection: "row", alignItems: "center", gap: 3, marginHorizontal: 4 },
  msgTime: { fontSize: 9, color: colors.outline },
  seenText: { fontSize: 8, color: colors.outline },
  chipsSection: {
    backgroundColor: colors.surfaceContainerLowest,
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceContainerHigh,
  },
  chipsRow: { flexDirection: "row", gap: spacing.xs, paddingHorizontal: spacing.gutter },
  quickChip: {
    backgroundColor: colors.surfaceContainerLow,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.surfaceContainerHigh,
  },
  quickChipText: { fontSize: 10, color: colors.onSurfaceVariant, fontWeight: fontWeight.medium },
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceContainerLowest,
    paddingHorizontal: spacing.sm,
    paddingTop: 8,
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceContainerHigh,
  },
  inputActionIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  textInputBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: borderRadius.full,
    paddingHorizontal: 12,
    height: 40,
  },
  textInputField: { flex: 1, fontSize: 13, color: colors.onSurface, paddingVertical: 0 },
  b2bQuoteShortcutBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    backgroundColor: colors.secondaryContainer,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
  },
  b2bQuoteShortcutText: { fontSize: 9, fontWeight: fontWeight.bold, color: colors.onSecondaryContainer },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryContainer,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.sm,
  },
});
