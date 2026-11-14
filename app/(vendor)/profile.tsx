import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Modal,
  ActivityIndicator,
  Image,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { colors, fontSize, fontWeight, spacing, borderRadius, serifFont } from "@/theme";
import { KaggriBrand } from "@/components/Header";
import { Input } from "@/components/Input";
import { StatusBadge } from "@/components/StatusBadge";
import { useAuthStore } from "@/stores/auth-store";
import { authService, onboardingService } from "@/services";
import { ApiError, type KaggriAgreement, type KaggriDocument } from "@/services/api";

const DOCUMENT_TYPES: Array<{ value: string; label: string }> = [
  { value: "BUSINESS_REGISTRATION", label: "Giấy ĐKKD / HTX" },
  { value: "TAX_REGISTRATION", label: "Đăng ký mã số thuế" },
  { value: "REPRESENTATIVE_ID", label: "CCCD / Hộ chiếu người đại diện" },
  { value: "FARM_OR_PRODUCER_EVIDENCE", label: "Chứng minh vùng trồng / cơ sở" },
  { value: "PRODUCT_CERTIFICATION", label: "Chứng nhận VietGAP / OCOP / ATTP" },
  { value: "OTHER", label: "Tài liệu khác" },
];

function getDocumentTypeLabel(type: string) {
  return DOCUMENT_TYPES.find((item) => item.value === type)?.label || type;
}

export default function VendorProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const logout = useAuthStore((s) => s.logout);
  const switchRole = useAuthStore((s) => s.setRole);

  const [activeTab, setActiveTab] = useState<"onboarding" | "agreement" | "account">("onboarding");
  const [savedMsg, setSavedMsg] = useState("");
  const [appStatus, setAppStatus] = useState<string>("APPROVED");

  // Vendor Onboarding Form State (Module 2 in Kaggri-Trade)
  const [businessName, setBusinessName] = useState("HTX Nông Nghiệp Lạc Dương");
  const [legalName, setLegalName] = useState("HTX Nông Nghiệp Công Nghệ Cao Lạc Dương");
  const [businessType, setBusinessType] = useState("COOPERATIVE");
  const [registrationNumber, setRegistrationNumber] = useState("5800991122");
  const [taxCode, setTaxCode] = useState("5800991122");
  const [legalRepName, setLegalRepName] = useState("Trần Văn Hùng");
  const [representativePosition, setRepresentativePosition] = useState("Giám đốc HTX");
  const [contactEmail, setContactEmail] = useState("demo.vendor@example.com");
  const [contactPhone, setContactPhone] = useState("0918223344");
  const [province, setProvince] = useState("Lâm Đồng");
  const [district, setDistrict] = useState("Lạc Dương");
  const [ward, setWard] = useState("Thị trấn Lạc Dương");
  const [addressLine, setAddressLine] = useState("Khu phố Đan Kia, Thị trấn Lạc Dương");
  const [warehouseAddress, setWarehouseAddress] = useState("Kho lạnh số 1, QL27C, Lạc Dương, Lâm Đồng");
  const [bankName, setBankName] = useState("Agribank - CN Lạc Dương");
  const [bankAccountNumber, setBankAccountNumber] = useState("540020588899");
  const [bankAccountHolder, setBankAccountHolder] = useState("HTX NONG NGHIEP LAC DUONG");
  const [description, setDescription] = useState(
    "Chuyên canh rau củ quả công nghệ cao đạt chuẩn VietGAP & GlobalGAP tại cao nguyên Lạc Dương, Lâm Đồng. Cung ứng sản lượng ổn định quanh năm cho siêu thị và bếp ăn công nghiệp."
  );
  const [documents, setDocuments] = useState<KaggriDocument[]>([]);
  const [agreements, setAgreements] = useState<KaggriAgreement[]>([]);
  const [history, setHistory] = useState<
    Array<{
      id: string;
      action?: string;
      fromStatus?: string;
      toStatus?: string;
      reason?: string;
      note?: string;
      createdAt: string;
    }>
  >([]);
  const [auditTrail, setAuditTrail] = useState<
    Array<{
      id: string;
      action: string;
      actorRole?: string;
      createdAt: string;
    }>
  >([]);

  // Upload document modal state
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState("PRODUCT_CERTIFICATION");
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null);

  // Agreement state
  const [agreementSigned, setAgreementSigned] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(true);
  const [signatureAsset, setSignatureAsset] = useState<{
    uri: string;
    name: string;
    type: string;
  } | null>(null);
  const [signing, setSigning] = useState(false);

  const showToast = (text: string) => {
    setSavedMsg(text);
    setTimeout(() => setSavedMsg(""), 3500);
  };

  useEffect(() => {
    let mounted = true;
    Promise.all([
      onboardingService.getProgress().catch(() => null),
      onboardingService.listDocuments().catch(() => null),
      onboardingService.getHistory().catch(() => null),
      onboardingService.listAgreements().catch(() => null),
    ]).then(([prog, docs, hist, ags]) => {
      if (!mounted) return;
      const app = prog?.application;
      if (app) {
        setAppStatus(app.status || "DRAFT");
        if (app.displayName) setBusinessName(app.displayName);
        if (app.legalName) setLegalName(app.legalName);
        if (app.businessType) setBusinessType(app.businessType);
        if (app.registrationNumber) setRegistrationNumber(app.registrationNumber);
        if (app.taxCode) setTaxCode(app.taxCode);
        if (app.representativeName) setLegalRepName(app.representativeName);
        if (app.representativePosition) setRepresentativePosition(app.representativePosition);
        if (app.contactPhone) setContactPhone(app.contactPhone);
        if (app.province) setProvince(app.province);
        if (app.district) setDistrict(app.district);
        if (app.businessAddress) setAddressLine(app.businessAddress);
        if (app.businessDescription) setDescription(app.businessDescription);
        if (app.documents) setDocuments(app.documents);
      }
      if (Array.isArray(docs)) {
        setDocuments(docs);
      }
      if (Array.isArray(hist)) {
        setHistory(hist);
      }
      if (ags && ags.length > 0) {
        setAgreements(ags);
        setAgreementSigned(ags[0].status === "ACTIVE" || ags[0].status === "SIGNED");
        onboardingService
          .getAgreementAuditTrail(ags[0].id)
          .then((trail) => {
            if (mounted && Array.isArray(trail)) setAuditTrail(trail);
          })
          .catch(() => {});
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const handleSaveDraft = async () => {
    try {
      const prog = await onboardingService.saveDraft({
        businessType,
        legalName,
        displayName: businessName,
        contactPhone,
        businessAddress: addressLine,
        province,
        district,
        representativeName: legalRepName,
        representativePosition,
        registrationNumber,
        taxCode,
        businessDescription: description,
      });
      if (prog.application?.status) setAppStatus(prog.application.status);
      showToast("Đã lưu hồ sơ nhà cung cấp lên Kaggri.");
    } catch (err) {
      if (err instanceof ApiError && err.status !== 0) {
        showToast(err.message);
      } else {
        showToast("Đã lưu hồ sơ nhà cung cấp.");
      }
    }
  };

  const handleSubmitOnboarding = async () => {
    try {
      await handleSaveDraft();
      const prog = await onboardingService.submitApplication();
      if (prog.application?.status) setAppStatus(prog.application.status);
      const hist = await onboardingService.getHistory().catch(() => null);
      if (Array.isArray(hist)) setHistory(hist);
      showToast("Đã gửi hồ sơ đến đội ngũ Kaggri xét duyệt.");
    } catch (err) {
      if (err instanceof ApiError && err.status !== 0) {
        showToast(err.message);
      } else {
        showToast("Đã gửi hồ sơ đến đội ngũ Kaggri xét duyệt.");
      }
    }
  };

  const handlePickAndUploadDocument = async (source: "document" | "image") => {
    try {
      let file: { uri: string; name: string; type: string } | null = null;
      if (source === "document") {
        const res = await DocumentPicker.getDocumentAsync({
          type: ["application/pdf", "image/jpeg", "image/png"],
          copyToCacheDirectory: true,
        });
        if (res.canceled || !res.assets?.[0]) return;
        const asset = res.assets[0];
        file = {
          uri: asset.uri,
          name: asset.name || `document_${Date.now()}.pdf`,
          type: asset.mimeType || "application/pdf",
        };
      } else {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) {
          Alert.alert("Quyền truy cập", "Vui lòng cấp quyền thư viện ảnh để tải lên tài liệu.");
          return;
        }
        const res = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          quality: 0.85,
        });
        if (res.canceled || !res.assets?.[0]) return;
        const asset = res.assets[0];
        const fileName = asset.fileName || `document_${Date.now()}.jpg`;
        file = {
          uri: asset.uri,
          name: fileName,
          type: asset.mimeType || "image/jpeg",
        };
      }

      setUploadingDoc(true);
      const uploaded = await onboardingService.uploadDocument({
        file,
        documentType: selectedDocType,
      });
      setDocuments((prev) => [uploaded, ...prev.filter((d) => d.id !== uploaded.id)]);
      setUploadModalOpen(false);
      showToast("Đã tải lên tài liệu pháp lý.");
    } catch (err) {
      Alert.alert(
        "Tải tài liệu thất bại",
        err instanceof ApiError ? err.message : "Không thể tải tài liệu lên máy chủ."
      );
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleDeleteDocument = (doc: KaggriDocument) => {
    Alert.alert(
      "Xóa tài liệu",
      `Bạn chắc chắn muốn xóa tài liệu "${doc.originalFileName}"?`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            try {
              setDeletingDocId(doc.id);
              await onboardingService.deleteDocument(doc.id);
              setDocuments((prev) => prev.filter((item) => item.id !== doc.id));
              showToast("Đã xóa tài liệu.");
            } catch (err) {
              Alert.alert(
                "Không thể xóa",
                err instanceof ApiError ? err.message : "Đã có lỗi xảy ra khi xóa tài liệu."
              );
            } finally {
              setDeletingDocId(null);
            }
          },
        },
      ]
    );
  };

  const handlePickSignature = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Quyền truy cập", "Vui lòng cấp quyền thư viện ảnh để chọn ảnh chữ ký.");
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.85,
      });
      if (res.canceled || !res.assets?.[0]) return;
      const asset = res.assets[0];
      setSignatureAsset({
        uri: asset.uri,
        name: asset.fileName || `signature_${Date.now()}.png`,
        type: asset.mimeType || "image/png",
      });
    } catch {
      Alert.alert("Lỗi", "Không thể chọn ảnh chữ ký.");
    }
  };

  const handleCompleteSigning = async () => {
    const activeAgreement = agreements[0];
    if (!activeAgreement?.id) {
      Alert.alert(
        "Chưa có thỏa thuận",
        "Hệ thống chưa tạo bản thỏa thuận hợp tác cho hồ sơ của bạn."
      );
      return;
    }
    if (!agreedTerms) {
      Alert.alert("Chưa xác nhận điều khoản", "Vui lòng tích đồng ý với điều khoản hợp tác.");
      return;
    }
    if (!signatureAsset) {
      Alert.alert("Thiếu ảnh chữ ký", "Vui lòng chọn ảnh chữ ký (PNG/JPEG) trước khi ký.");
      return;
    }
    try {
      setSigning(true);
      const session = await onboardingService.createSigningSession(activeAgreement.id);
      await onboardingService.completeSigning({
        sessionId: session.id,
        file: signatureAsset,
        method: "UPLOADED",
        expectedDocumentHash: session.expectedDocumentHash,
        consent: true,
      });
      const [ags, trail] = await Promise.all([
        onboardingService.listAgreements().catch(() => null),
        onboardingService.getAgreementAuditTrail(activeAgreement.id).catch(() => null),
      ]);
      if (ags && ags.length > 0) {
        setAgreements(ags);
        setAgreementSigned(ags[0].status === "ACTIVE" || ags[0].status === "SIGNED");
      } else {
        setAgreementSigned(true);
      }
      if (Array.isArray(trail)) setAuditTrail(trail);
      setSignatureAsset(null);
      showToast("Đã ký xác nhận thỏa thuận hợp tác thành công.");
    } catch (err) {
      Alert.alert(
        "Ký thỏa thuận thất bại",
        err instanceof ApiError ? err.message : "Không thể hoàn tất phiên ký thỏa thuận."
      );
    } finally {
      setSigning(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Top Workspace Header matching Kaggri-Trade */}
      <View style={styles.topHeader}>
        <KaggriBrand compact />
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <StatusBadge status={appStatus} label={appStatus === "APPROVED" ? "ĐÃ XÁC MINH" : appStatus} />
          <Pressable
            onPress={async () => {
              await authService.logout();
              logout();
              router.replace("/auth/login?role=vendor");
            }}
            style={styles.logoutBtn}
          >
            <Text style={styles.logoutBtnText}>Đăng xuất</Text>
          </Pressable>
        </View>
      </View>

      {/* Module 2 Sub-navigation tabs matching Kaggri-Trade Vendor Workspace */}
      <View style={styles.subNav}>
        {[
          { key: "onboarding", label: "01. Hồ sơ nhà cung cấp" },
          { key: "agreement", label: "02. Thỏa thuận hợp tác" },
          { key: "account", label: "Tài khoản & Tiện ích" },
        ].map((t) => {
          const active = activeTab === t.key;
          return (
            <Pressable
              key={t.key}
              onPress={() => setActiveTab(t.key as any)}
              style={[styles.subNavTab, active && styles.subNavTabActive]}
            >
              <Text style={[styles.subNavText, active && styles.subNavTextActive]}>
                {t.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 90 }]}
      >
        {savedMsg ? (
          <View style={styles.noticeBox}>
            <MaterialIcons name="check-circle" size={16} color={colors.green} />
            <Text style={styles.noticeText}>{savedMsg}</Text>
          </View>
        ) : null}

        {activeTab === "onboarding" && (
          <>
            <View style={styles.titleBlock}>
              <View style={styles.titleRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.eyebrow}>BƯỚC 01 · HỒ SƠ ĐỐI TÁC</Text>
                  <Text style={styles.h1}>Hồ sơ nhà cung cấp</Text>
                  <Text style={styles.subtitle}>
                    Giới thiệu thông tin pháp lý, vùng trồng, kho hàng và tài khoản nhận thanh toán của đơn vị bạn.
                  </Text>
                </View>
                <StatusBadge status={appStatus} />
              </View>
            </View>

            {/* Panel 1: Thông tin đơn vị */}
            <View style={styles.panel}>
              <Text style={styles.panelTitle}>Thông tin đơn vị</Text>
              <View style={styles.formStack}>
                <Input
                  label="Tên nhà cung cấp / hợp tác xã"
                  value={businessName}
                  onChangeText={setBusinessName}
                />

                <View>
                  <Text style={styles.fieldLabel}>Loại hình đơn vị</Text>
                  <View style={styles.typeChips}>
                    {[
                      { id: "COOPERATIVE", label: "Hợp tác xã" },
                      { id: "COMPANY", label: "Doanh nghiệp" },
                      { id: "HOUSEHOLD", label: "Hộ kinh doanh" },
                    ].map((opt) => (
                      <Pressable
                        key={opt.id}
                        onPress={() => setBusinessType(opt.id)}
                        style={[
                          styles.typeChip,
                          businessType === opt.id && styles.typeChipActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.typeChipText,
                            businessType === opt.id && styles.typeChipTextActive,
                          ]}
                        >
                          {opt.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                <Input label="Mã số thuế" value={taxCode} onChangeText={setTaxCode} />
                <Input label="Người đại diện" value={legalRepName} onChangeText={setLegalRepName} />
                <Input label="Email liên hệ" value={contactEmail} onChangeText={setContactEmail} />
                <Input label="Số điện thoại" value={contactPhone} onChangeText={setContactPhone} />
                <Input label="Tỉnh / thành phố" value={province} onChangeText={setProvince} />
                <Input label="Quận / huyện" value={district} onChangeText={setDistrict} />
                <Input label="Phường / xã" value={ward} onChangeText={setWard} />
                <Input label="Địa chỉ liên hệ" value={addressLine} onChangeText={setAddressLine} />
                <Input
                  label="Địa chỉ kho / điểm tập kết hàng"
                  value={warehouseAddress}
                  onChangeText={setWarehouseAddress}
                />
                <Input
                  label="Giới thiệu vùng trồng & thế mạnh"
                  value={description}
                  onChangeText={setDescription}
                  multiline
                />
              </View>
            </View>

            {/* Panel 2: Tài khoản nhận thanh toán */}
            <View style={styles.panel}>
              <Text style={styles.panelTitle}>Tài khoản nhận thanh toán</Text>
              <View style={styles.formStack}>
                <Input label="Ngân hàng" value={bankName} onChangeText={setBankName} />
                <Input label="Số tài khoản" value={bankAccountNumber} onChangeText={setBankAccountNumber} />
                <Input label="Chủ tài khoản" value={bankAccountHolder} onChangeText={setBankAccountHolder} />

                <View style={styles.actionsRow}>
                  <Pressable
                    onPress={handleSaveDraft}
                    style={styles.secondaryBtn}
                  >
                    <Text style={styles.secondaryBtnText}>Lưu thông tin</Text>
                  </Pressable>
                  <Pressable
                    onPress={handleSubmitOnboarding}
                    style={styles.primaryBtn}
                  >
                    <Text style={styles.primaryBtnText}>Gửi Kaggri duyệt</Text>
                  </Pressable>
                </View>
              </View>
            </View>

            {/* Panel 3: Hồ sơ pháp lý & chứng nhận */}
            <View style={styles.panel}>
              <View style={styles.panelHeadBetween}>
                <Text style={styles.panelTitle}>Hồ sơ pháp lý & chứng nhận</Text>
                <Pressable
                  onPress={() => setUploadModalOpen(true)}
                  style={styles.smallOutlineBtn}
                >
                  <MaterialIcons name="add" size={14} color={colors.green} />
                  <Text style={styles.smallOutlineBtnText}>Thêm tài liệu</Text>
                </Pressable>
              </View>

              {documents.length === 0 ? (
                <Text style={styles.emptyDocText}>
                  Chưa có tài liệu nào được tải lên. Vui lòng thêm giấy phép kinh doanh hoặc chứng nhận chất lượng (PDF, JPG, PNG tối đa 10MB).
                </Text>
              ) : (
                documents.map((doc, idx) => (
                  <View key={doc.id} style={[styles.docItem, idx > 0 && styles.docItemBorder]}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.docType}>{getDocumentTypeLabel(doc.documentType)}</Text>
                      <Text style={styles.docName}>{doc.originalFileName}</Text>
                      <Text style={styles.docMeta}>
                        {(doc.sizeBytes / 1024).toFixed(0)} KB
                      </Text>
                    </View>
                    <StatusBadge status={doc.verificationStatus} />
                    <Pressable
                      onPress={() => handleDeleteDocument(doc)}
                      disabled={deletingDocId === doc.id}
                      style={styles.iconDeleteBtn}
                    >
                      {deletingDocId === doc.id ? (
                        <ActivityIndicator size="small" color={colors.danger} />
                      ) : (
                        <MaterialIcons name="delete-outline" size={18} color={colors.danger} />
                      )}
                    </Pressable>
                  </View>
                ))
              )}
            </View>

            {/* Panel 4: Lịch sử xét duyệt hồ sơ */}
            {history.length > 0 && (
              <View style={styles.panel}>
                <Text style={styles.panelTitle}>Lịch sử xét duyệt hồ sơ</Text>
                {history.map((item, idx) => (
                  <View
                    key={item.id}
                    style={[styles.historyRow, idx > 0 && styles.docItemBorder]}
                  >
                    <Text style={styles.historyTitle}>
                      {item.action || `${item.fromStatus || ""} → ${item.toStatus || ""}`}
                    </Text>
                    {(item.reason || item.note) && (
                      <Text style={styles.historyNote}>{item.reason || item.note}</Text>
                    )}
                    <Text style={styles.historyTime}>
                      {new Date(item.createdAt).toLocaleString("vi-VN")}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </>
        )}

        {activeTab === "agreement" && (
          <>
            <View style={styles.titleBlock}>
              <View style={styles.titleRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.eyebrow}>BƯỚC 02 · ĐỒNG HÀNH BỀN VỮNG</Text>
                  <Text style={styles.h1}>Thỏa thuận hợp tác</Text>
                  <Text style={styles.subtitle}>
                    Các nguyên tắc minh bạch nguồn gốc, chất lượng nông sản và phối hợp giao nhận cùng Kaggri.
                  </Text>
                </View>
                <StatusBadge status={agreementSigned ? "SIGNED" : "PENDING_REVIEW"} />
              </View>
            </View>

            <View style={styles.panel}>
              <View style={styles.panelHeadBetween}>
                <Text style={styles.panelTitle}>Khung hợp tác nhà cung cấp Kaggri v1.0</Text>
                <StatusBadge status={agreementSigned ? "SIGNED" : "DRAFT"} />
              </View>

              <View style={styles.termsBox}>
                <Text style={styles.termsHeading}>ĐIỀU KHOẢN HỢP TÁC CÙNG KAGGRI TRADE</Text>
                <Text style={styles.termsParagraph}>
                  1. Minh bạch nguồn gốc: Nhà cung cấp cam kết kê khai trung thực vùng trồng, giống, phân loại, quy cách đóng gói và chứng nhận chất lượng (VietGAP, GlobalGAP, OCOP).
                </Text>
                <Text style={styles.termsParagraph}>
                  2. Đảm bảo sản lượng & tồn kho: Cập nhật kịp thời số lượng tồn thực tế và khả năng nhận đặt trước để các thương vụ B2B diễn ra thuận lợi.
                </Text>
                <Text style={styles.termsParagraph}>
                  3. Phối hợp kiểm định & đối soát: Đồng hành cùng Kaggri trong khâu kiểm tra chất lượng при giao nhận và đối soát thanh toán minh bạch qua tài khoản ngân hàng đã đăng ký.
                </Text>
              </View>

              <Pressable
                onPress={() => setAgreedTerms(!agreedTerms)}
                style={styles.checkboxRow}
              >
                <View style={[styles.checkbox, agreedTerms && styles.checkboxChecked]}>
                  {agreedTerms && <MaterialIcons name="check" size={13} color={colors.white} />}
                </View>
                <Text style={styles.checkboxLabel}>
                  Tôi đã đọc, hiểu và đồng ý với thỏa thuận hợp tác nhà cung cấp Kaggri.
                </Text>
              </Pressable>

              <View style={styles.agreementMeta}>
                <Text style={styles.metaText}>
                  Mã thỏa thuận: {agreements[0]?.agreementNumber || "Chưa phát hành"}
                </Text>
                <Text style={styles.metaText}>Người đại diện ký: {legalRepName}</Text>
                <Text style={styles.metaText}>
                  Trạng thái: {agreements[0]?.status || (agreementSigned ? "SIGNED" : "DRAFT")}
                </Text>
              </View>

              {!agreementSigned && (
                <View style={styles.signatureBox}>
                  <View style={styles.panelHeadBetween}>
                    <Text style={styles.signatureLabel}>Ảnh chữ ký điện tử (PNG/JPG)</Text>
                    <Pressable onPress={handlePickSignature} style={styles.smallOutlineBtn}>
                      <MaterialIcons name="draw" size={14} color={colors.green} />
                      <Text style={styles.smallOutlineBtnText}>
                        {signatureAsset ? "Đổi chữ ký" : "Chọn ảnh chữ ký"}
                      </Text>
                    </Pressable>
                  </View>
                  {signatureAsset ? (
                    <View style={styles.signaturePreviewWrap}>
                      <Image
                        source={{ uri: signatureAsset.uri }}
                        style={styles.signaturePreview}
                        resizeMode="contain"
                      />
                      <Text style={styles.metaText}>{signatureAsset.name}</Text>
                    </View>
                  ) : (
                    <Text style={styles.metaText}>
                      Chọn ảnh chữ ký tay của người đại diện để hoàn tất ký số.
                    </Text>
                  )}
                </View>
              )}

              <Pressable
                onPress={handleCompleteSigning}
                disabled={agreementSigned || signing}
                style={[styles.primaryBtn, (agreementSigned || signing) && styles.btnDisabled]}
              >
                <Text style={styles.primaryBtnText}>
                  {signing
                    ? "Đang xử lý phiên ký..."
                    : agreementSigned
                    ? "Đã ký thỏa thuận hợp tác"
                    : "Ký thỏa thuận hợp tác"}
                </Text>
              </Pressable>
            </View>

            {auditTrail.length > 0 && (
              <View style={styles.panel}>
                <Text style={styles.panelTitle}>Nhật ký kiểm toán chữ ký</Text>
                {auditTrail.map((ev, idx) => (
                  <View key={ev.id} style={[styles.historyRow, idx > 0 && styles.docItemBorder]}>
                    <Text style={styles.historyTitle}>
                      {ev.action} {ev.actorRole ? `(${ev.actorRole})` : ""}
                    </Text>
                    <Text style={styles.historyTime}>
                      {new Date(ev.createdAt).toLocaleString("vi-VN")}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </>
        )}

        {activeTab === "account" && (
          <>
            <View style={styles.titleBlock}>
              <Text style={styles.eyebrow}>KHÔNG GIAN VẬN HÀNH</Text>
              <Text style={styles.h1}>Tiện ích nhà cung cấp</Text>
              <Text style={styles.subtitle}>
                Truy cập nhanh các phân hệ quản lý tồn kho, báo giá sỉ, đối soát và chuyển đổi vai trò.
              </Text>
            </View>

            <View style={styles.panel}>
              {[
                {
                  icon: "inventory" as const,
                  title: "Quản lý tồn kho & đặt trước",
                  desc: "Điều chỉnh tồn thực tế, giữ chỗ và cấu hình đặt trước",
                  onPress: () => router.push("/vendor/inventory"),
                },
                {
                  icon: "account-balance-wallet" as const,
                  title: "Ví & Đối soát tài chính HTX",
                  desc: "Theo dõi số dư khả dụng, ký quỹ Escrow và rút tiền Napas247",
                  onPress: () => router.push("/vendor/settlement"),
                },
                {
                  icon: "request-quote" as const,
                  title: "Tạo báo giá sỉ B2B",
                  desc: "Gửi báo giá lô lớn kèm cam kết chất lượng cho đối tác thu mua",
                  onPress: () => router.push("/vendor/quotes"),
                },
                {
                  icon: "agriculture" as const,
                  title: "Kế hoạch thu hoạch",
                  desc: "Dự báo sản lượng và theo dõi cam kết đặt trước",
                  onPress: () => router.push("/vendor/supply-plan" as any),
                },
                {
                  icon: "event-repeat" as const,
                  title: "Đề xuất đơn định kỳ",
                  desc: "Phê duyệt hoặc đề xuất lại giá cho lịch giao lặp lại",
                  onPress: () => router.push("/vendor/subscriptions" as any),
                },
                {
                  icon: "gavel" as const,
                  title: "Tranh chấp & Bồi hoàn",
                  desc: "Xử lý khiếu nại hàng hóa từ khách thu mua",
                  onPress: () => router.push("/vendor/disputes" as any),
                },
                {
                  icon: "chat" as const,
                  title: "Phòng đàm phán khách sỉ",
                  desc: "Trao đổi trực tiếp với Trưởng ban thu mua siêu thị",
                  onPress: () => router.push("/vendor/chat/buyer-green-food" as any),
                },
                {
                  icon: "shopping-bag" as const,
                  title: "Chuyển sang giao diện Người mua",
                  desc: "Xem Chợ Nông Sản Kaggri dưới góc nhìn đối tác thu mua",
                  onPress: () => {
                    switchRole("buyer");
                    router.replace("/(buyer)");
                  },
                },
              ].map((item, idx) => (
                <Pressable
                  key={idx}
                  onPress={item.onPress}
                  style={[styles.menuRow, idx > 0 && styles.docItemBorder]}
                >
                  <View style={styles.menuIconBox}>
                    <MaterialIcons name={item.icon} size={18} color={colors.green} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.menuTitle}>{item.title}</Text>
                    <Text style={styles.menuDesc}>{item.desc}</Text>
                  </View>
                  <MaterialIcons name="chevron-right" size={20} color={colors.muted} />
                </Pressable>
              ))}
            </View>
          </>
        )}
      </ScrollView>

      <Modal
        visible={uploadModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => {
          if (!uploadingDoc) setUploadModalOpen(false);
        }}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.panelHeadBetween}>
              <Text style={styles.panelTitle}>Tải lên tài liệu pháp lý</Text>
              <Pressable
                onPress={() => !uploadingDoc && setUploadModalOpen(false)}
                hitSlop={8}
              >
                <MaterialIcons name="close" size={20} color={colors.muted} />
              </Pressable>
            </View>
            <Text style={styles.modalSub}>Chọn loại tài liệu theo quy định Kaggri:</Text>
            <View style={styles.docTypeList}>
              {DOCUMENT_TYPES.map((dt) => {
                const active = selectedDocType === dt.value;
                return (
                  <Pressable
                    key={dt.value}
                    onPress={() => setSelectedDocType(dt.value)}
                    style={[styles.docTypeChip, active && styles.docTypeChipActive]}
                  >
                    <Text
                      style={[
                        styles.docTypeChipText,
                        active && styles.docTypeChipTextActive,
                      ]}
                    >
                      {dt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {uploadingDoc ? (
              <View style={styles.uploadingBox}>
                <ActivityIndicator size="small" color={colors.green} />
                <Text style={styles.metaText}>Đang tải tài liệu lên...</Text>
              </View>
            ) : (
              <View style={styles.modalActions}>
                <Pressable
                  onPress={() => handlePickAndUploadDocument("document")}
                  style={styles.primaryBtn}
                >
                  <Text style={styles.primaryBtnText}>Chọn file PDF / Ảnh</Text>
                </Pressable>
                <Pressable
                  onPress={() => handlePickAndUploadDocument("image")}
                  style={styles.outlineModalBtn}
                >
                  <Text style={styles.outlineModalBtnText}>Chọn ảnh từ thư viện</Text>
                </Pressable>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.gutter,
    paddingVertical: 11,
    backgroundColor: colors.panel,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  logoutBtn: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: "#d8ded3",
  },
  logoutBtnText: {
    fontSize: 11,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  subNav: {
    flexDirection: "row",
    backgroundColor: colors.panel,
    paddingHorizontal: spacing.gutter,
    paddingVertical: 8,
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  subNavTab: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: borderRadius.md,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.line,
  },
  subNavTabActive: {
    backgroundColor: colors.greenSoft,
    borderColor: colors.green,
  },
  subNavText: {
    fontSize: 11,
    fontWeight: fontWeight.bold,
    color: colors.muted,
  },
  subNavTextActive: {
    color: colors.green,
  },
  scrollContent: {
    padding: spacing.gutter,
    gap: 14,
  },
  noticeBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderRadius: borderRadius.md,
    backgroundColor: "#f7f4e9",
    borderWidth: 1,
    borderColor: "#e6dec8",
  },
  noticeText: {
    fontSize: 12,
    fontWeight: fontWeight.semibold,
    color: "#6b5937",
  },
  titleBlock: {
    gap: 4,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
  },
  eyebrow: {
    fontSize: 9.5,
    fontWeight: fontWeight.bold,
    color: colors.eyebrow,
    letterSpacing: 1.4,
  },
  h1: {
    fontFamily: serifFont,
    fontSize: 24,
    color: colors.dark,
    marginTop: 2,
  },
  subtitle: {
    fontSize: 12,
    color: colors.muted,
    lineHeight: 18,
    marginTop: 3,
  },
  panel: {
    backgroundColor: colors.panel,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 16,
    gap: 12,
  },
  panelTitle: {
    fontSize: 14,
    fontWeight: fontWeight.extrabold,
    color: colors.dark,
  },
  panelHeadBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  formStack: {
    gap: 11,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: fontWeight.bold,
    color: "#516153",
    marginBottom: 6,
  },
  typeChips: {
    flexDirection: "row",
    gap: 8,
  },
  typeChip: {
    flex: 1,
    height: 36,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.panel,
  },
  typeChipActive: {
    backgroundColor: colors.greenSoft,
    borderColor: colors.green,
  },
  typeChipText: {
    fontSize: 11,
    fontWeight: fontWeight.semibold,
    color: colors.muted,
  },
  typeChipTextActive: {
    color: colors.dark,
    fontWeight: fontWeight.bold,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  primaryBtn: {
    flex: 1,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.green,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  primaryBtnText: {
    fontSize: 12,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  secondaryBtn: {
    flex: 1,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: "#d8ded3",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  secondaryBtnText: {
    fontSize: 12,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  smallOutlineBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: "#d8ded3",
  },
  smallOutlineBtnText: {
    fontSize: 11,
    fontWeight: fontWeight.bold,
    color: colors.green,
  },
  docItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    paddingVertical: 8,
  },
  docItemBorder: {
    borderTopWidth: 1,
    borderTopColor: "#edf0e9",
  },
  docType: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    color: colors.eyebrow,
  },
  docName: {
    fontSize: 12,
    fontWeight: fontWeight.semibold,
    color: colors.dark,
    marginTop: 2,
  },
  termsBox: {
    backgroundColor: colors.cream,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 13,
    gap: 8,
  },
  termsHeading: {
    fontSize: 10.5,
    fontWeight: fontWeight.extrabold,
    color: colors.dark,
    letterSpacing: 0.5,
  },
  termsParagraph: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.text,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: colors.green,
    borderColor: colors.green,
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 12,
    color: colors.text,
    lineHeight: 17,
  },
  agreementMeta: {
    backgroundColor: colors.bg,
    padding: 10,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.line,
    gap: 3,
  },
  metaText: {
    fontSize: 11,
    color: colors.muted,
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
  },
  menuIconBox: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    backgroundColor: colors.greenSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  menuTitle: {
    fontSize: 13,
    fontWeight: fontWeight.bold,
    color: colors.dark,
  },
  menuDesc: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 2,
  },
  emptyDocText: {
    fontSize: 12,
    color: colors.muted,
    lineHeight: 18,
  },
  docMeta: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 2,
  },
  iconDeleteBtn: {
    padding: 6,
    borderRadius: borderRadius.sm,
  },
  historyRow: {
    paddingVertical: 8,
    gap: 2,
  },
  historyTitle: {
    fontSize: 12,
    fontWeight: fontWeight.bold,
    color: colors.dark,
  },
  historyNote: {
    fontSize: 12,
    color: colors.text,
  },
  historyTime: {
    fontSize: 11,
    color: colors.muted,
  },
  signatureBox: {
    backgroundColor: colors.bg,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 12,
    gap: 8,
  },
  signatureLabel: {
    fontSize: 12,
    fontWeight: fontWeight.bold,
    color: colors.dark,
  },
  signaturePreviewWrap: {
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
  },
  signaturePreview: {
    width: "100%",
    height: 90,
    backgroundColor: colors.white,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.line,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(18, 28, 22, 0.45)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: colors.panel,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: 18,
    gap: 12,
  },
  modalSub: {
    fontSize: 12,
    color: colors.muted,
  },
  docTypeList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  docTypeChip: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.bg,
  },
  docTypeChipActive: {
    borderColor: colors.green,
    backgroundColor: colors.greenSoft,
  },
  docTypeChipText: {
    fontSize: 11.5,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  docTypeChipTextActive: {
    color: colors.green,
  },
  uploadingBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
  },
  modalActions: {
    gap: 8,
    marginTop: 4,
  },
  outlineModalBtn: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.green,
    paddingVertical: 11,
    alignItems: "center",
  },
  outlineModalBtnText: {
    fontSize: 13,
    fontWeight: fontWeight.bold,
    color: colors.green,
  },
});
