import React from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { colors } from "@/theme";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="auth/login" />
        <Stack.Screen name="auth/register" />
        <Stack.Screen name="(buyer)" />
        <Stack.Screen name="(vendor)" />
        <Stack.Screen name="buyer/product/[id]" />
        <Stack.Screen name="buyer/cart" />
        <Stack.Screen name="buyer/checkout" />
        <Stack.Screen name="buyer/payment" />
        <Stack.Screen name="buyer/order-success" options={{ gestureEnabled: false }} />
        <Stack.Screen name="buyer/order/[id]" />
        <Stack.Screen name="vendor/product-edit" />
        <Stack.Screen name="vendor/inventory" />
        <Stack.Screen name="vendor/settlement" />
        <Stack.Screen name="vendor/quotes" />
        <Stack.Screen name="vendor/order/[id]" />
        <Stack.Screen name="vendor/chat/[id]" />
      </Stack>
    </SafeAreaProvider>
  );
}
