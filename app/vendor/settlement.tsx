import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  Alert,
  Platform,
  Linking,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { colors, fontSize, fontWeight, spacing, borderRadius, shadows } from "@/theme";

type TimeFilter = "week" | "month" | "quarter" | "custom";
type StatusFilter = "all" | "escrow" | "settled" | "withdrawn";

interface TransactionItem {
  id: string;
  type: "order_escrow" | "order_settled" | "withdrawal";
  code: string;
  timestamp: string;
  buyerName?: string;
  buyerTier?: string;
  destinationWarehouse?: string;
  grossAmount?: number;
  platformFee?: number;
  vatAmount?: number;
  netAmount: number;
  statusLabel: string;
  note?: string;
  matchCode?: string;
  vehiclePlate?: string;
}

const INITIAL_TRANSACTIONS: TransactionItem[] = [
  {
    id: "tx1",
    type: "order_escrow",
    code: "#VO-20261016-8831",
    timestamp: "16/10/2026 • 15:45",
    vehiclePlate: "Xe lạnh 49C-188.22",
    buyerName: "Chuỗi Siêu Thị Thực Phẩm Xanh",
    buyerTier: "B2B Gold",
    destinationWarehouse: "Tổng kho Thủ Đức, TP.HCM",
    grossAmount: 14400000,
    platformFee: -720000,
    vatAmount: 0,
    netAmount: 13680000,
    statusLabel: "Escrow giữ (Còn 03:28:38)",
    note: "320 kg Cà chua Beef loại 1",
  },
  {
    id: "tx2",
    type: "order_settled",
    code: "#VO-20261014-7712",
    timestamp: "14/10/2026 • 09:15",
    vehiclePlate: "Container 51D-902.11",
    buyerName: "Hệ Thống Bách Hóa Sạch Miền Nam",
    buyerTier: "B2B Prime",
    destinationWarehouse: "Trung tâm phân phối Bình Dương",
    grossAmount: 36000000,
    platformFee: -1800000,
    vatAmount: 0,
    netAmount: 34200000,
    statusLabel: "Đã nghiệm thu trạm cân",
    matchCode: "TXN-AGRI-883921",
    note: "1.200 kg Xà lách Thủy Canh",
  },
  {
    id: "tx3",
    type: "withdrawal",
    code: "#WD-20261012-0091",
    timestamp: "12/10/2026 • 11:30",
    netAmount: -80000000,
    statusLabel: "Thành công (Napas247)",
    note: "Lệnh rút tiền về Agribank Chi nhánh Lạc Dương",
    matchCode: "NAPAS-WD-8899-01",
  },
];

export default function VendorSettlementScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Balance state
  const [balance, setBalance] = useState(128450000);
  const [escrowTotal, setEscrowTotal] = useState(34800000);
  const [isBalanceVisible, setIsBalanceVisible] = useState(true);

  // Filters
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("month");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");

  // Transactions list
  const [transactions, setTransactions] = useState<TransactionItem[]>(INITIAL_TRANSACTIONS);

  // Withdrawal modal
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("50.000.000");

  const handleCopyBankAccount = () => {
    Alert.alert("Đã sao chép", "Số tài khoản Agribank: 5400 2058 8899 đã được sao chép vào bộ nhớ tạm.");
  };

  const handleSetQuickPercent = (pct: number) => {
    const calculated = Math.round(balance * pct);
    setWithdrawAmount(calculated.toLocaleString("vi-VN"));
  };

  const handleConfirmWithdraw = () => {
    const rawNumber = parseInt(withdrawAmount.replace(/\./g, "").replace(/,/g, ""), 10);
    if (!rawNumber || rawNumber < 200000) {
      Alert.alert("Lỗi số tiền", "Số tiền rút tối thiểu là 200.000₫.");
      return;
    }
    if (rawNumber > balance) {
      Alert.alert("Số dư không đủ", "Số tiền yêu cầu rút vượt quá số dư khả dụng.");
      return;
    }

    setBalance((prev) => prev - rawNumber);
    const newTx: TransactionItem = {
      id: "tx_" + Date.now(),
      type: "withdrawal",
      code: `#WD-${Date.now().toString().slice(-8)}`,
      timestamp: "Vừa xong • Lệnh rút tiền tài khoản",
      netAmount: -rawNumber,
      statusLabel: "Đang xử lý (Napas247)",
      note: "Lệnh rút tiền về Agribank Chi nhánh Lạc Dương",
    };
    setTransactions([newTx, ...transactions]);
    setIsWithdrawOpen(false);
    Alert.alert(
      "Tạo lệnh thành công!",
      `Đã chuyển lệnh rút ${rawNumber.toLocaleString("vi-VN")}₫ về tài khoản Agribank HTX. Dự kiến nhận tiền trong 5-15 phút.`
    );
  };

  const filteredTransactions = transactions.filter((t) => {
    if (statusFilter === "escrow" && t.type !== "order_escrow") return false;
    if (statusFilter === "settled" && t.type !== "order_settled") return false;
    if (statusFilter === "withdrawn" && t.type !== "withdrawal") return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const codeMatch = t.code.toLowerCase().includes(q);
      const buyerMatch = t.buyerName ? t.buyerName.toLowerCase().includes(q) : false;
      return codeMatch || buyerMatch;
    }
    return true;
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable onPress={() => router.back()} style={styles.iconBtn} hitSlop={8}>
            <MaterialIcons name="arrow-back" size={24} color={colors.onSurface} />
          </Pressable>
          <View>
            <Text style={styles.headerTitle}>Ví & Đối Soát Tài Chính</Text>
            <Text style={styles.headerSubtitle}>QUY TRÌNH QUYẾT TOÁN HTX</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <Pressable
            onPress={() => Alert.alert("Xuất báo cáo", "Đang xuất sao kê tài chính PDF Tháng 10/2026...")}
            style={styles.iconBtn}
            hitSlop={8}
          >
            <MaterialIcons name="picture-as-pdf" size={22} color={colors.primary} />
          </Pressable>
          <Pressable
            onPress={() => Alert.alert("Trợ giúp đối soát", "Tổng đài Kế toán VOVU: 1900 6868 (Ext 2)")}
            style={styles.iconBtn}
            hitSlop={8}
          >
            <MaterialIcons name="help-outline" size={22} color={colors.primary} />
          </Pressable>
        </View>
      </View>

      {/* Cooperative Identification Sub-bar */}
      <View style={styles.coopBar}>
        <View style={styles.coopInfo}>
          <View style={styles.coopIconBox}>
            <MaterialIcons name="agriculture" size={18} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Text style={styles.coopName}>HTX Nông Nghiệp Lạc Dương</Text>
              <View style={styles.vietgapTag}>
                <MaterialIcons name="verified" size={10} color={colors.onPrimary} />
                <Text style={styles.vietgapTagText}>VietGAP</Text>
              </View>
            </View>
            <Text style={styles.coopIdText}>Mã định danh: #HTX-2024-LD • Lâm Đồng</Text>
          </View>
        </View>
        <Pressable
          onPress={() => Alert.alert("Xuất sao kê", "Đang tải xuống bảng kê Excel đối soát 14 đơn hàng...")}
          style={styles.exportStatementBtn}
        >
          <MaterialIcons name="download" size={14} color={colors.primary} />
          <Text style={styles.exportStatementText}>Xuất sao kê</Text>
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* 1. HTX Hero Wallet & Escrow Balance Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View style={styles.heroBalanceLabelRow}>
              <Text style={styles.heroBalanceLabel}>SỐ DƯ KHẢ DỤNG THANH TOÁN</Text>
              <Pressable onPress={() => setIsBalanceVisible(!isBalanceVisible)} hitSlop={6}>
                <MaterialIcons
                  name={isBalanceVisible ? "visibility" : "visibility-off"}
                  size={16}
                  color={colors.primaryFixedDim}
                />
              </Pressable>
            </View>
            <View style={styles.autoMatchBadge}>
              <View style={styles.livePulseDot} />
              <Text style={styles.autoMatchText}>Tự động khớp lệnh</Text>
            </View>
          </View>

          {/* Amount Display */}
          <View style={styles.heroAmountRow}>
            <Text style={styles.heroAmountText}>
              {isBalanceVisible ? balance.toLocaleString("vi-VN") : "••••••••"}
            </Text>
            <Text style={styles.heroCurrencyText}>₫</Text>
          </View>

          <View style={styles.heroSubRow}>
            <MaterialIcons name="check-circle" size={14} color={colors.primaryFixed} />
            <Text style={styles.heroSubText}>Sẵn sàng rút về tài khoản ngân hàng HTX (24/7)</Text>
          </View>

          {/* Escrow Lock Trust Container */}
          <View style={styles.escrowTrustBox}>
            <View style={styles.escrowTrustTop}>
              <View style={styles.escrowShieldIcon}>
                <MaterialIcons name="shield" size={18} color={colors.secondaryContainer} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <Text style={styles.escrowTrustTitle}>Bảo chứng ký quỹ Escrow VOVU</Text>
                  <View style={styles.transitBadge}>
                    <Text style={styles.transitBadgeText}>4 xe đang giao</Text>
                  </View>
                </View>
                <Text style={styles.escrowTrustAmount}>{escrowTotal.toLocaleString("vi-VN")}₫</Text>
                <Text style={styles.escrowTrustDesc}>
                  ⚡ Giải ngân tự động trong <Text style={{ fontWeight: fontWeight.bold, color: colors.white }}>2h</Text> sau khi Bên Mua xác nhận cân hàng đạt chuẩn tại trạm tiếp nhận.
                </Text>
              </View>
            </View>
          </View>

          {/* Action Buttons Row */}
          <View style={styles.heroActionRow}>
            <Pressable onPress={() => setIsWithdrawOpen(true)} style={styles.withdrawBtn}>
              <MaterialIcons name="account-balance-wallet" size={18} color={colors.primary} />
              <Text style={styles.withdrawBtnText}>Rút tiền về tài khoản</Text>
            </Pressable>

            <Pressable onPress={handleCopyBankAccount} style={styles.bankLinkBtn}>
              <MaterialIcons name="account-balance" size={16} color={colors.surfaceContainerLowest} />
              <Text style={styles.bankLinkBtnText}>Agribank •••• 8899</Text>
              <MaterialIcons name="content-copy" size={14} color={colors.primaryFixedDim} />
            </Pressable>
          </View>
        </View>

        {/* 2. Monthly Settlement Performance Metrics */}
        <View style={styles.monthlyCard}>
          <View style={styles.monthlyHeader}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <MaterialIcons name="analytics" size={18} color={colors.primary} />
              <Text style={styles.monthlyTitle}>Kỳ Quyết Toán: Tháng 10/2026</Text>
            </View>
            <View style={styles.disbursedBadge}>
              <Text style={styles.disbursedText}>Đã giải ngân 60%</Text>
            </View>
          </View>

          <View style={styles.metricsGrid}>
            <View style={styles.metricsCol}>
              <Text style={styles.metricLabel}>Doanh thu thô</Text>
              <Text style={styles.metricVal}>342.5M₫</Text>
              <Text style={styles.metricSub}>14 chuyến xe</Text>
            </View>
            <View style={[styles.metricsCol, { backgroundColor: colors.surfaceContainerLowest, borderRadius: borderRadius.sm, paddingHorizontal: 6 }]}>
              <Text style={styles.metricLabel}>Phí sàn (5%)</Text>
              <Text style={[styles.metricVal, { color: colors.error }]}>-17.1M₫</Text>
              <Text style={styles.metricSub}>Bảo trợ đơn</Text>
            </View>
            <View style={styles.metricsCol}>
              <Text style={[styles.metricLabel, { color: colors.primary, fontWeight: fontWeight.bold }]}>Thực nhận HTX</Text>
              <Text style={[styles.metricVal, { color: colors.primary }]}>325.3M₫</Text>
              <Text style={styles.metricSub}>VAT 0% (NĐ209)</Text>
            </View>
          </View>

          {/* Progress bar */}
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Tiến độ thanh toán hợp đồng</Text>
              <Text style={styles.progressVal}>195.2M / 325.3M (60%)</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: "60%" }]} />
            </View>
          </View>
        </View>

        {/* 3. Time Filter & Search Bar */}
        <View style={styles.filterSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.timeChipsRow}>
            <Pressable
              onPress={() => setTimeFilter("week")}
              style={[styles.timeChip, timeFilter === "week" && styles.timeChipActive]}
            >
              <Text style={[styles.timeChipText, timeFilter === "week" && styles.timeChipTextActive]}>Tuần này</Text>
            </Pressable>
            <Pressable
              onPress={() => setTimeFilter("month")}
              style={[styles.timeChip, timeFilter === "month" && styles.timeChipActive]}
            >
              <Text style={[styles.timeChipText, timeFilter === "month" && styles.timeChipTextActive]}>Tháng 10/2026</Text>
            </Pressable>
            <Pressable
              onPress={() => setTimeFilter("quarter")}
              style={[styles.timeChip, timeFilter === "quarter" && styles.timeChipActive]}
            >
              <Text style={[styles.timeChipText, timeFilter === "quarter" && styles.timeChipTextActive]}>Quý 3/2026</Text>
            </Pressable>
            <Pressable
              onPress={() => setTimeFilter("custom")}
              style={[styles.timeChip, timeFilter === "custom" && styles.timeChipActive]}
            >
              <MaterialIcons name="calendar-month" size={14} color={timeFilter === "custom" ? colors.onPrimary : colors.outline} />
              <Text style={[styles.timeChipText, timeFilter === "custom" && styles.timeChipTextActive]}>Tùy chọn ngày</Text>
            </Pressable>
          </ScrollView>

          <View style={styles.searchRow}>
            <MaterialIcons name="search" size={18} color={colors.outline} style={{ marginRight: 6 }} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Tìm theo mã đơn (#VO-...), bên mua, lệnh..."
              placeholderTextColor={colors.outline}
              style={styles.searchInput}
            />
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statusChipsRow}>
            <Pressable
              onPress={() => setStatusFilter("all")}
              style={[styles.statusChip, statusFilter === "all" && styles.statusChipActive]}
            >
              <Text style={[styles.statusChipText, statusFilter === "all" && styles.statusChipTextActive]}>Tất cả ({transactions.length})</Text>
            </Pressable>
            <Pressable
              onPress={() => setStatusFilter("escrow")}
              style={[styles.statusChip, statusFilter === "escrow" && styles.statusChipActiveEscrow]}
            >
              <View style={[styles.statusDot, { backgroundColor: colors.secondary }]} />
              <Text style={[styles.statusChipText, statusFilter === "escrow" && { color: colors.secondary, fontWeight: fontWeight.bold }]}>
                Đang giữ Escrow (1)
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setStatusFilter("settled")}
              style={[styles.statusChip, statusFilter === "settled" && styles.statusChipActiveSettled]}
            >
              <Text style={[styles.statusChipText, statusFilter === "settled" && { color: colors.primary, fontWeight: fontWeight.bold }]}>
                Đã quyết toán (1)
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setStatusFilter("withdrawn")}
              style={[styles.statusChip, statusFilter === "withdrawn" && styles.statusChipActive]}
            >
              <Text style={[styles.statusChipText, statusFilter === "withdrawn" && styles.statusChipTextActive]}>Đã rút về bank (1)</Text>
            </Pressable>
          </ScrollView>
        </View>

        {/* 4. Detailed Order Settlement Statement List */}
        <View style={styles.listSection}>
          <View style={styles.listSectionHeader}>
            <Text style={styles.listSectionTitle}>Bảng Kê Chi Tiết Giao Dịch</Text>
            <Text style={styles.listSectionSub}>Cập nhật 5 phút trước</Text>
          </View>

          {filteredTransactions.map((tx) => {
            const isEscrow = tx.type === "order_escrow";
            const isSettled = tx.type === "order_settled";
            const isWithdraw = tx.type === "withdrawal";

            return (
              <View key={tx.id} style={styles.txCard}>
                {/* Top Stripe Indicator */}
                <View
                  style={[
                    styles.txStripe,
                    isEscrow && { backgroundColor: colors.secondary },
                    isSettled && { backgroundColor: colors.primary },
                    isWithdraw && { backgroundColor: colors.outline },
                  ]}
                />

                {/* Card Top */}
                <View style={styles.txTopRow}>
                  <View>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <Text style={styles.txCode}>{tx.code}</Text>
                      <Pressable
                        onPress={() => Alert.alert("Đã sao chép", `Mã giao dịch ${tx.code} đã sao chép.`)}
                        hitSlop={6}
                      >
                        <MaterialIcons name="content-copy" size={14} color={colors.outline} />
                      </Pressable>
                    </View>
                    <Text style={styles.txTimestamp}>
                      {tx.timestamp} {tx.vehiclePlate ? `• (${tx.vehiclePlate})` : ""}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.txStatusBadge,
                      isEscrow && { backgroundColor: colors.secondaryContainer + "33" },
                      isSettled && { backgroundColor: colors.primaryFixed },
                      isWithdraw && { backgroundColor: colors.surfaceContainerHigh },
                    ]}
                  >
                    <MaterialIcons
                      name={isEscrow ? "schedule" : isSettled ? "check-circle" : "done-all"}
                      size={12}
                      color={isEscrow ? colors.secondary : isSettled ? colors.primary : colors.onSurface}
                    />
                    <Text
                      style={[
                        styles.txStatusText,
                        isEscrow && { color: colors.secondary },
                        isSettled && { color: colors.primary },
                        isWithdraw && { color: colors.onSurface },
                      ]}
                    >
                      {tx.statusLabel}
                    </Text>
                  </View>
                </View>

                {/* Buyer / Destination details if order */}
                {tx.buyerName && (
                  <View style={styles.txBuyerBox}>
                    <View style={styles.txBuyerIcon}>
                      <MaterialIcons name="storefront" size={16} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.txBuyerName}>{tx.buyerName}</Text>
                      <Text style={styles.txWarehouse}>{tx.destinationWarehouse}</Text>
                    </View>
                    <View style={styles.buyerTierBadge}>
                      <Text style={styles.buyerTierText}>{tx.buyerTier}</Text>
                    </View>
                  </View>
                )}

                {/* Accounting breakdown for orders */}
                {(isEscrow || isSettled) && (
                  <View style={styles.breakdownBox}>
                    <View style={styles.breakdownRow}>
                      <Text style={styles.breakdownLabel}>Tiền hàng gốc ({tx.note}):</Text>
                      <Text style={styles.breakdownVal}>+{tx.grossAmount?.toLocaleString("vi-VN")}₫</Text>
                    </View>
                    <View style={styles.breakdownRow}>
                      <Text style={styles.breakdownLabel}>Phí nền tảng VOVU (5%):</Text>
                      <Text style={[styles.breakdownVal, { color: colors.error }]}>
                        {tx.platformFee?.toLocaleString("vi-VN")}₫
                      </Text>
                    </View>
                    <View style={styles.breakdownRow}>
                      <Text style={styles.breakdownLabel}>Khấu trừ thuế GTGT đầu ra:</Text>
                      <Text style={styles.breakdownVal}>0₫ (NĐ 209/2013)</Text>
                    </View>

                    <View style={styles.payoutHighlightRow}>
                      <Text style={styles.payoutHighlightLabel}>
                        {isEscrow ? "Dự kiến thực nhận ví:" : "Đã cộng số dư khả dụng:"}
                      </Text>
                      <Text style={styles.payoutHighlightVal}>
                        +{tx.netAmount.toLocaleString("vi-VN")}₫
                      </Text>
                    </View>
                  </View>
                )}

                {/* Withdrawal specific info */}
                {isWithdraw && (
                  <View style={styles.breakdownBox}>
                    <View style={styles.breakdownRow}>
                      <Text style={styles.breakdownLabel}>Tài khoản nhận:</Text>
                      <Text style={styles.breakdownValBold}>Agribank Chi nhánh Lạc Dương</Text>
                    </View>
                    <View style={styles.breakdownRow}>
                      <Text style={styles.breakdownLabel}>Phí chuyển khoản B2B:</Text>
                      <Text style={[styles.breakdownVal, { color: colors.primary, fontWeight: fontWeight.bold }]}>
                        0₫ (Miễn phí HTX)
                      </Text>
                    </View>
                    <View style={styles.payoutHighlightRow}>
                      <Text style={styles.payoutHighlightLabel}>Số tiền đã chuyển:</Text>
                      <Text style={[styles.payoutHighlightVal, { color: colors.onSurface }]}>
                        {tx.netAmount.toLocaleString("vi-VN")}₫
                      </Text>
                    </View>
                  </View>
                )}

                {/* POD / Match Code footer */}
                <View style={styles.txFooter}>
                  {isEscrow && (
                    <Pressable
                      onPress={() => router.push("/vendor/order/VO-20261016-8831" as any)}
                      style={styles.podLinkBtn}
                    >
                      <MaterialIcons name="receipt-long" size={16} color={colors.primary} />
                      <Text style={styles.podLinkText}>Xem biên bản giao nhận & Cân hàng (POD điện tử)</Text>
                      <MaterialIcons name="arrow-forward" size={14} color={colors.primary} />
                    </Pressable>
                  )}
                  {isSettled && (
                    <View style={styles.matchCodeRow}>
                      <MaterialIcons name="verified-user" size={14} color={colors.primary} />
                      <Text style={styles.matchCodeLabel}>
                        Mã khớp lệnh: <Text style={{ fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace", fontWeight: fontWeight.bold }}>{tx.matchCode}</Text>
                      </Text>
                    </View>
                  )}
                  {isWithdraw && (
                    <Text style={styles.withdrawNoteText}>Giao dịch hoàn tất qua cổng liên ngân hàng Napas247</Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {/* 5. Support Hotline Banner */}
        <View style={styles.supportBanner}>
          <View style={styles.supportIconBox}>
            <MaterialIcons name="support-agent" size={24} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.supportTitle}>Ban Đối Soát & Kế Toán Sàn VOVU</Text>
            <Text style={styles.supportDesc}>
              Thắc mắc về biên bản trạm cân hoặc sai lệch trọng lượng thực tế? Đội ngũ kế toán hỗ trợ trực tiếp hợp tác xã.
            </Text>
            <View style={styles.supportActionsRow}>
              <Pressable
                onPress={() => Linking.openURL("tel:19006868")}
                style={styles.supportPhoneBtn}
              >
                <MaterialIcons name="call" size={14} color={colors.primary} />
                <Text style={styles.supportPhoneText}>1900 6868 (Máy lẻ 2)</Text>
              </Pressable>
              <Pressable
                onPress={() => Linking.openURL("mailto:ketoan@vovu.vn")}
                style={styles.supportMailBtn}
              >
                <MaterialIcons name="mail" size={14} color={colors.onSurfaceVariant} />
                <Text style={styles.supportMailText}>ketoan@vovu.vn</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bank Withdrawal BottomSheet Modal */}
      <Modal visible={isWithdrawOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalScrim} onPress={() => setIsWithdrawOpen(false)} />
          <View style={[styles.modalSheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
            <View style={styles.dragHandle} />

            <View style={styles.sheetHeader}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <View style={styles.modalIconBox}>
                  <MaterialIcons name="payments" size={20} color={colors.primary} />
                </View>
                <View>
                  <Text style={styles.sheetTitle}>Lệnh Rút Tiền Về HTX</Text>
                  <Text style={styles.sheetSubtitle}>Quyết toán qua Napas247 (24/7)</Text>
                </View>
              </View>
              <Pressable onPress={() => setIsWithdrawOpen(false)} style={styles.closeBtn}>
                <MaterialIcons name="close" size={20} color={colors.outline} />
              </Pressable>
            </View>

            {/* Bank Card Info */}
            <View style={styles.bankCardBox}>
              <View style={styles.bankLogo}>
                <Text style={styles.bankLogoText}>AGRI</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.bankName}>Agribank - CN Lạc Dương</Text>
                <Text style={styles.bankAccountNo}>5400 2058 8899</Text>
                <Text style={styles.bankOwner}>HTX NÔNG NGHIỆP LẠC DƯƠNG</Text>
              </View>
              <MaterialIcons name="check-circle" size={20} color={colors.primary} />
            </View>

            {/* Amount input */}
            <View style={styles.withdrawInputGroup}>
              <Text style={styles.withdrawInputLabel}>Nhập số tiền muốn rút:</Text>
              <View style={styles.withdrawInputRow}>
                <TextInput
                  value={withdrawAmount}
                  onChangeText={setWithdrawAmount}
                  keyboardType="numeric"
                  style={styles.withdrawTextInput}
                />
                <Text style={styles.withdrawCurrency}>₫</Text>
              </View>
              <View style={styles.limitRow}>
                <Text style={styles.limitText}>
                  Khả dụng: <Text style={{ fontWeight: fontWeight.bold, color: colors.onSurface }}>{balance.toLocaleString("vi-VN")}₫</Text>
                </Text>
                <Text style={styles.limitText}>Tối thiểu: 200.000₫</Text>
              </View>
            </View>

            {/* Quick percent chips */}
            <View style={styles.percentChipsRow}>
              <Pressable onPress={() => handleSetQuickPercent(0.25)} style={styles.percentChip}>
                <Text style={styles.percentChipText}>25% (32.1M)</Text>
              </Pressable>
              <Pressable onPress={() => handleSetQuickPercent(0.5)} style={styles.percentChip}>
                <Text style={styles.percentChipText}>50% (64.2M)</Text>
              </Pressable>
              <Pressable onPress={() => handleSetQuickPercent(1.0)} style={[styles.percentChip, styles.percentChipAll]}>
                <Text style={[styles.percentChipText, styles.percentChipAllText]}>100% (Tất cả)</Text>
              </Pressable>
            </View>

            {/* Terms note */}
            <View style={styles.withdrawalNoteBox}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <MaterialIcons name="bolt" size={14} color={colors.primary} />
                <Text style={styles.withdrawalFastText}>Tiền về tài khoản trong 5-15 phút qua Napas247</Text>
              </View>
              <Text style={styles.withdrawalSubNote}>Hạn mức rút trong ngày: Còn lại 371.550.000₫ / 500.000.000₫</Text>
              <Text style={styles.withdrawalSubNote}>Miễn phí giao dịch 100% cho hợp tác xã thành viên VietGAP.</Text>
            </View>

            {/* Submit button */}
            <Pressable onPress={handleConfirmWithdraw} style={styles.submitWithdrawBtn}>
              <MaterialIcons name="send" size={18} color={colors.onPrimary} />
              <Text style={styles.submitWithdrawText}>Xác nhận tạo lệnh rút tiền</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.gutter,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surfaceContainerLowest,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceContainerHigh,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: spacing.xs, flex: 1 },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: fontSize["title-md"], fontWeight: fontWeight.bold, color: colors.onSurface },
  headerSubtitle: { fontSize: 10, color: colors.outline, letterSpacing: 0.5, textTransform: "uppercase" },
  headerRight: { flexDirection: "row", alignItems: "center" },
  coopBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surfaceContainerLowest,
    paddingHorizontal: spacing.gutter,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceContainerHigh,
  },
  coopInfo: { flexDirection: "row", alignItems: "center", gap: spacing.xs, flex: 1 },
  coopIconBox: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.primaryContainer + "22",
    alignItems: "center",
    justifyContent: "center",
  },
  coopName: { fontSize: fontSize["label-md"], fontWeight: fontWeight.bold, color: colors.onSurface },
  vietgapTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    backgroundColor: colors.primaryContainer,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: borderRadius.sm,
  },
  vietgapTagText: { fontSize: 8, fontWeight: fontWeight.bold, color: colors.onPrimary },
  coopIdText: { fontSize: 10, color: colors.outline },
  exportStatementBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.surfaceContainer,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.md,
  },
  exportStatementText: { fontSize: 10, fontWeight: fontWeight.semibold, color: colors.onSurface },
  scrollContent: { padding: spacing.gutter, gap: spacing.md, paddingBottom: 60 },
  heroCard: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    gap: spacing.sm,
    ...shadows.md,
  },
  heroTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  heroBalanceLabelRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  heroBalanceLabel: { fontSize: 10, fontWeight: fontWeight.bold, color: colors.primaryFixedDim, letterSpacing: 0.5 },
  autoMatchBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  livePulseDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.tertiaryFixed },
  autoMatchText: { fontSize: 9, fontWeight: fontWeight.bold, color: colors.tertiaryFixed },
  heroAmountRow: { flexDirection: "row", alignItems: "baseline", gap: 4, marginVertical: 2 },
  heroAmountText: { fontSize: 28, fontWeight: fontWeight.bold, color: colors.surfaceContainerLowest },
  heroCurrencyText: { fontSize: 18, fontWeight: fontWeight.bold, color: colors.primaryFixedDim },
  heroSubRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 4 },
  heroSubText: { fontSize: 11, color: colors.primaryFixed },
  escrowTrustBox: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginVertical: 4,
  },
  escrowTrustTop: { flexDirection: "row", gap: spacing.sm },
  escrowShieldIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "rgba(254,166,25,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  escrowTrustTitle: { fontSize: 11, fontWeight: fontWeight.bold, color: colors.surfaceContainerLowest },
  transitBadge: {
    backgroundColor: "rgba(254,166,25,0.3)",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: borderRadius.sm,
  },
  transitBadgeText: { fontSize: 9, fontWeight: fontWeight.bold, color: colors.secondaryFixed },
  escrowTrustAmount: { fontSize: 16, fontWeight: fontWeight.bold, color: colors.secondaryFixed, marginTop: 2 },
  escrowTrustDesc: { fontSize: 10, color: colors.primaryFixedDim, marginTop: 4, lineHeight: 14 },
  heroActionRow: { flexDirection: "row", gap: spacing.sm, marginTop: 4 },
  withdrawBtn: {
    flex: 1.2,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceContainerLowest,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    ...shadows.sm,
  },
  withdrawBtnText: { fontSize: 12, fontWeight: fontWeight.bold, color: colors.primary },
  bankLinkBtn: {
    flex: 1,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: "rgba(255,255,255,0.15)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  bankLinkBtnText: { fontSize: 11, color: colors.surfaceContainerLowest, fontWeight: fontWeight.medium },
  monthlyCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    gap: spacing.sm,
    ...shadows.sm,
  },
  monthlyHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  monthlyTitle: { fontSize: 12, fontWeight: fontWeight.bold, color: colors.onSurface },
  disbursedBadge: {
    backgroundColor: colors.tertiaryFixed + "33",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  disbursedText: { fontSize: 10, fontWeight: fontWeight.bold, color: colors.tertiaryContainer },
  metricsGrid: {
    flexDirection: "row",
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: borderRadius.md,
    padding: 8,
  },
  metricsCol: { flex: 1, paddingHorizontal: 4 },
  metricLabel: { fontSize: 9, color: colors.outline },
  metricVal: { fontSize: 14, fontWeight: fontWeight.bold, color: colors.onSurface, marginTop: 2 },
  metricSub: { fontSize: 9, color: colors.onSurfaceVariant, marginTop: 1 },
  progressSection: { gap: 4, marginTop: 4 },
  progressHeader: { flexDirection: "row", justifyContent: "space-between" },
  progressLabel: { fontSize: 10, color: colors.outline },
  progressVal: { fontSize: 10, fontWeight: fontWeight.bold, color: colors.primary },
  progressBarBg: { height: 6, borderRadius: 3, backgroundColor: colors.surfaceContainerHigh, overflow: "hidden" },
  progressBarFill: { height: "100%", backgroundColor: colors.primary, borderRadius: 3 },
  filterSection: { gap: spacing.sm },
  timeChipsRow: { flexDirection: "row", gap: spacing.xs },
  timeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceContainerLowest,
  },
  timeChipActive: { backgroundColor: colors.primary },
  timeChipText: { fontSize: 11, fontWeight: fontWeight.medium, color: colors.onSurfaceVariant },
  timeChipTextActive: { color: colors.onPrimary, fontWeight: fontWeight.bold },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
    height: 42,
    ...shadows.xs,
  },
  searchInput: { flex: 1, fontSize: fontSize["body-sm"], color: colors.onSurface },
  statusChipsRow: { flexDirection: "row", gap: spacing.xs },
  statusChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surfaceContainerLowest,
  },
  statusChipActive: { backgroundColor: colors.surfaceContainerHigh },
  statusChipActiveEscrow: { backgroundColor: colors.secondaryContainer + "33" },
  statusChipActiveSettled: { backgroundColor: colors.primaryFixed },
  statusChipText: { fontSize: 10, fontWeight: fontWeight.medium, color: colors.onSurfaceVariant },
  statusChipTextActive: { fontWeight: fontWeight.bold, color: colors.onSurface },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  listSection: { gap: spacing.sm },
  listSectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  listSectionTitle: { fontSize: fontSize["headline-sm"], fontWeight: fontWeight.bold, color: colors.onSurface },
  listSectionSub: { fontSize: 10, color: colors.outline },
  txCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    gap: spacing.sm,
    ...shadows.sm,
    position: "relative",
    overflow: "hidden",
  },
  txStripe: { position: "absolute", top: 0, left: 0, right: 0, height: 3 },
  txTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginTop: 2 },
  txCode: { fontSize: fontSize["body-md"], fontWeight: fontWeight.bold, color: colors.onSurface },
  txTimestamp: { fontSize: 10, color: colors.outline, marginTop: 2 },
  txStatusBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: borderRadius.full },
  txStatusText: { fontSize: 9, fontWeight: fontWeight.bold },
  txBuyerBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: borderRadius.md,
    padding: 8,
  },
  txBuyerIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: "center",
    justifyContent: "center",
  },
  txBuyerName: { fontSize: 11, fontWeight: fontWeight.bold, color: colors.onSurface },
  txWarehouse: { fontSize: 9, color: colors.outline, marginTop: 1 },
  buyerTierBadge: { backgroundColor: colors.secondaryFixed, paddingHorizontal: 6, paddingVertical: 1, borderRadius: borderRadius.sm },
  buyerTierText: { fontSize: 8, fontWeight: fontWeight.bold, color: colors.onSecondaryFixed },
  breakdownBox: { backgroundColor: colors.surfaceBright, borderRadius: borderRadius.md, padding: spacing.sm, gap: 4 },
  breakdownRow: { flexDirection: "row", justifyContent: "space-between" },
  breakdownLabel: { fontSize: 10, color: colors.onSurfaceVariant },
  breakdownVal: { fontSize: 10, fontWeight: fontWeight.semibold, color: colors.onSurface },
  breakdownValBold: { fontSize: 10, fontWeight: fontWeight.bold, color: colors.onSurface },
  payoutHighlightRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    borderTopWidth: 1,
    borderTopColor: colors.surfaceContainerHigh,
    paddingTop: 6,
    marginTop: 2,
  },
  payoutHighlightLabel: { fontSize: 11, fontWeight: fontWeight.bold, color: colors.onSurface },
  payoutHighlightVal: { fontSize: 14, fontWeight: fontWeight.bold, color: colors.primary },
  txFooter: { paddingTop: 2 },
  podLinkBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  podLinkText: { fontSize: 10, fontWeight: fontWeight.semibold, color: colors.primary, flex: 1 },
  matchCodeRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  matchCodeLabel: { fontSize: 9, color: colors.outline },
  withdrawNoteText: { fontSize: 9, color: colors.outline, fontStyle: "italic" },
  supportBanner: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  supportIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: "center",
    justifyContent: "center",
  },
  supportTitle: { fontSize: 11, fontWeight: fontWeight.bold, color: colors.onSurface },
  supportDesc: { fontSize: 10, color: colors.onSurfaceVariant, marginTop: 2, lineHeight: 14 },
  supportActionsRow: { flexDirection: "row", gap: spacing.xs, marginTop: 8 },
  supportPhoneBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.surfaceContainerLowest,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  supportPhoneText: { fontSize: 10, fontWeight: fontWeight.bold, color: colors.primary },
  supportMailBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.surfaceContainerLowest,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  supportMailText: { fontSize: 10, color: colors.onSurfaceVariant },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalScrim: { flex: 1 },
  modalSheet: {
    backgroundColor: colors.surfaceContainerLowest,
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
    paddingHorizontal: spacing.gutter,
    paddingTop: spacing.sm,
    gap: spacing.md,
    ...shadows.xl,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.outlineVariant,
    alignSelf: "center",
    marginBottom: 4,
  },
  sheetHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  modalIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryFixed,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetTitle: { fontSize: fontSize["title-md"], fontWeight: fontWeight.bold, color: colors.onSurface },
  sheetSubtitle: { fontSize: 10, color: colors.outline },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceContainer,
    alignItems: "center",
    justifyContent: "center",
  },
  bankCardBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  bankLogo: {
    width: 38,
    height: 38,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surfaceContainerLowest,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.xs,
  },
  bankLogoText: { fontSize: 11, fontWeight: fontWeight.bold, color: colors.primary },
  bankName: { fontSize: 11, fontWeight: fontWeight.bold, color: colors.onSurface },
  bankAccountNo: { fontSize: 11, color: colors.outline, fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace", marginVertical: 1 },
  bankOwner: { fontSize: 9, fontWeight: fontWeight.bold, color: colors.primary },
  withdrawInputGroup: { gap: 4 },
  withdrawInputLabel: { fontSize: fontSize["label-md"], fontWeight: fontWeight.semibold, color: colors.onSurfaceVariant },
  withdrawInputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceBright,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    height: 50,
  },
  withdrawTextInput: { flex: 1, fontSize: 22, fontWeight: fontWeight.bold, color: colors.onSurface },
  withdrawCurrency: { fontSize: 18, fontWeight: fontWeight.bold, color: colors.outline },
  limitRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 2 },
  limitText: { fontSize: 10, color: colors.outline },
  percentChipsRow: { flexDirection: "row", gap: spacing.xs },
  percentChip: {
    flex: 1,
    height: 38,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceContainer,
    alignItems: "center",
    justifyContent: "center",
  },
  percentChipText: { fontSize: 11, fontWeight: fontWeight.semibold, color: colors.onSurface },
  percentChipAll: { backgroundColor: colors.primaryFixed },
  percentChipAllText: { color: colors.onPrimaryFixedVariant, fontWeight: fontWeight.bold },
  withdrawalNoteBox: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    gap: 3,
  },
  withdrawalFastText: { fontSize: 10, fontWeight: fontWeight.bold, color: colors.primary },
  withdrawalSubNote: { fontSize: 9, color: colors.outline },
  submitWithdrawBtn: {
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: spacing.xs,
    ...shadows.md,
  },
  submitWithdrawText: { fontSize: fontSize["label-lg"], fontWeight: fontWeight.bold, color: colors.onPrimary },
});
