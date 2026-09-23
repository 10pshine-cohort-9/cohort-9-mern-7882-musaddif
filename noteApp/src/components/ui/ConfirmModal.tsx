import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { palette } from "@/constants/colors";

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
      statusBarTranslucent>
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <Pressable style={styles.card} onPress={(event) => event.stopPropagation()}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              onPress={onCancel}
              style={({ pressed }) => [styles.button, styles.cancel, pressed && styles.pressed]}>
              <Text style={styles.cancelText}>{cancelLabel}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={loading}
              onPress={onConfirm}
              style={({ pressed }) => [
                styles.button,
                destructive ? styles.confirmDanger : styles.confirm,
                pressed && styles.pressed,
                loading && styles.disabled,
              ]}>
              <Text style={styles.confirmText}>{confirmLabel}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: palette.overlay,
    alignItems: "center",
    justifyContent: "center",
    padding: 22,
  },
  card: {
    width: "100%",
    maxWidth: 390,
    backgroundColor: palette.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#eceef7",
    padding: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: palette.ink,
    marginBottom: 8,
  },
  message: {
    fontSize: 13,
    lineHeight: 20,
    color: palette.muted,
    marginBottom: 20,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
  },
  button: {
    minHeight: 40,
    minWidth: 104,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  cancel: {
    backgroundColor: palette.primarySoft,
  },
  confirm: {
    backgroundColor: palette.primary,
  },
  confirmDanger: {
    backgroundColor: "#e83d59",
  },
  cancelText: {
    color: "#5536e7",
    fontWeight: "600",
    fontSize: 13,
  },
  confirmText: {
    color: palette.white,
    fontWeight: "600",
    fontSize: 13,
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.6,
  },
});
