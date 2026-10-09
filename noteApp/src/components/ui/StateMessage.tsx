import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { palette } from "@/constants/colors";

interface StateMessageProps {
  loading?: boolean;
  message?: string;
  tone?: "default" | "error" | "muted";
}

export function StateMessage({ loading = false, message, tone = "default" }: StateMessageProps) {
  if (!loading && !message) return null;

  return (
    <View style={styles.container}>
      {loading ? <ActivityIndicator color={palette.primary} /> : null}
      {message ? (
        <Text
          style={[
            styles.text,
            tone === "error" && styles.error,
            tone === "muted" && styles.muted,
          ]}>
          {message}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 22,
  },
  text: {
    fontSize: 13,
    color: palette.muted,
    textAlign: "center",
  },
  error: {
    color: palette.danger,
  },
  muted: {
    color: palette.subtle,
  },
});
