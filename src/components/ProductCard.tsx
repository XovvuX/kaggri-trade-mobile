import React from "react";
import { View, Text, Pressable, Image, StyleSheet, ViewStyle } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { colors, fontSize, fontWeight, borderRadius } from "@/theme";
import { resolveImageSource } from "@/services/api";
import { StatusBadge } from "./StatusBadge";

export type Product = {
  id: string;
  name: string;
  price: string;
  unit: string;
  emoji: string;
  image?: string;
  vendor: string;
  location: string;
  stock: "instock" | "low" | "out";
  stockQty?: string;
  certification?: "vietgap" | "ocop" | "globalgap" | "organic";
  minOrder?: string;
  category?: string;
  availabilityStatus?: "IN_STOCK" | "OUT_OF_STOCK" | "PREORDER";
};

const CATEGORY_MAP: Record<string, string> = {
  fruit: "Trái cây",
  vegetable: "Rau củ",
  grain: "Gạo - Ngũ cốc",
  herb: "Nông sản khô",
  other: "Đặc sản vùng",
};

type Props = {
  product: Product;
  onPress?: () => void;
  style?: ViewStyle;
};

export function ProductCard({ product, onPress, style }: Props) {
  const [imgBroken, setImgBroken] = React.useState(false);

  React.useEffect(() => {
    setImgBroken(false);
  }, [product.image]);

  const imgSource = resolveImageSource(product.image);
  const categoryLabel = product.category
    ? CATEGORY_MAP[product.category] ?? product.category
    : "Nông sản";

  const availabilityStatus =
    product.availabilityStatus ??
    (product.stock === "instock"
      ? "IN_STOCK"
      : product.stock === "low"
      ? "PREORDER"
      : "OUT_OF_STOCK");

  const availabilityLabel =
    availabilityStatus === "IN_STOCK"
      ? "Sẵn hàng"
      : availabilityStatus === "PREORDER"
      ? "Đặt trước"
      : "Tạm hết";

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        pressed && { opacity: 0.94, borderColor: "#b8c7b3" },
        style,
      ]}
    >
      {/* Top photo / placeholder matching .card-photo */}
      <View style={styles.cardPhoto}>
        {imgSource && !imgBroken ? (
          <Image
            source={imgSource}
            style={styles.photoImage}
            onError={() => setImgBroken(true)}
          />
        ) : (
          <View style={styles.placeholderWrap}>
            <Text style={styles.emoji}>{product.emoji || "🌾"}</Text>
          </View>
        )}
      </View>

      {/* Body matching .card-body */}
      <View style={styles.cardBody}>
        <View style={styles.cardTopline}>
          <Text style={styles.categoryText} numberOfLines={1}>
            {categoryLabel}
          </Text>
          <StatusBadge status={availabilityStatus} label={availabilityLabel} />
        </View>

        <Text style={styles.name} numberOfLines={2}>
          {product.name}
        </Text>

        <View style={styles.originRow}>
          <MaterialIcons name="place" size={12} color={colors.muted} />
          <Text style={styles.originText} numberOfLines={1}>
            {product.location}
          </Text>
        </View>

        <View style={styles.priceBox}>
          <View style={styles.priceLine}>
            <Text style={styles.priceAmount}>{product.price} ₫</Text>
            <Text style={styles.priceUnit}> / {product.unit}</Text>
          </View>
          <Text style={styles.moqText}>
            Tối thiểu {product.minOrder ?? `20 ${product.unit}`}
          </Text>
        </View>

        <View style={styles.cardVendor}>
          <MaterialIcons name="verified-user" size={12} color="#587055" />
          <Text style={styles.vendorName} numberOfLines={1}>
            {product.vendor}
          </Text>
          <MaterialIcons name="north-east" size={12} color="#587055" />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.panel,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    overflow: "hidden",
  },
  cardPhoto: {
    width: "100%",
    height: 118,
    backgroundColor: "#f1f1e8",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
  },
  photoImage: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  placeholderWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#e6eadc",
    alignItems: "center",
    justifyContent: "center",
  },
  emoji: {
    fontSize: 28,
  },
  cardBody: {
    padding: 11,
    gap: 5,
  },
  cardTopline: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 4,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    color: "#6b7768",
    flex: 1,
  },
  name: {
    fontSize: 13,
    fontWeight: fontWeight.bold,
    color: colors.dark,
    lineHeight: 17,
    minHeight: 34,
  },
  originRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  originText: {
    fontSize: 11,
    color: colors.muted,
    flex: 1,
  },
  priceBox: {
    marginTop: 2,
  },
  priceLine: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  priceAmount: {
    fontSize: fontSize["price-display"],
    fontWeight: fontWeight.extrabold,
    color: colors.greenAccent,
  },
  priceUnit: {
    fontSize: 11,
    color: "#6e786c",
  },
  moqText: {
    fontSize: 10,
    color: colors.muted,
    marginTop: 1,
  },
  cardVendor: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingTop: 8,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: "#edf0e9",
  },
  vendorName: {
    flex: 1,
    fontSize: 11,
    color: "#587055",
    fontWeight: fontWeight.medium,
  },
});
