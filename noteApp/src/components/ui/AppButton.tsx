import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { palette } from "@/constants/colors";

export type ButtonVariant = "primary" | "secondary" | "success" | "danger" | "ghost";

interface VariantStyle {
  bg: string;
  fg: string;
  border: string;
}

const VARIANT_STYLES: Record<ButtonVariant, VariantStyle> = {
  primary: { bg: palette.primary, fg: palette.white, border: palette.primary },
  secondary: { bg: palette.primarySoft, fg: "#5031ea", border: palette.primarySoft },
  success: { bg: palette.successBg, fg: palette.success, border: palette.successBg },
  danger: { bg: "#df3c56", fg: palette.white, border: "#df3c56" },
  ghost: { bg: "transparent", fg: palette.muted, border: palette.line },
};

interface AppButtonProps {
  title: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  loading?: boolean;
  loadingTitle?: string;
  disabled?: boolean;
  icon?: ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function AppButton({
  title,
  onPress,
  variant = "primary",
  loading = false,
  loadingTitle,
  disabled = false,
  icon,
  style,
  testID,
}: AppButtonProps) {
  const isDisabled = disabled || loading;
  const variantStyle = VARIANT_STYLES[variant];

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: variantStyle.bg,
          borderColor: variantStyle.border,
        },
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={variantStyle.fg} size="small" />
      ) : icon ? (
        <View style={styles.icon}>{icon}</View>
      ) : null}
      <Text
        style={[styles.label, { color: variantStyle.fg }]}
        numberOfLines={1}
        allowFontScaling>
        {loading ? loadingTitle || title : title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 46,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  icon: {
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
  },
  pressed: {
    opacity: 0.88,
  },
  disabled: {
    opacity: 0.6,
  },
});
