import { LinearGradient } from "expo-linear-gradient";
import { NotebookPen } from "lucide-react-native";
import type { ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { palette } from "@/constants/colors";
import { KeyboardAwareScrollView } from "@/components/KeyboardAwareScrollView";

interface AuthShellProps {
  icon?: ReactNode;
  title?: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthShell({
  icon,
  title,
  subtitle,
  children,
  footer,
}: AuthShellProps) {
  return (
    <LinearGradient
      colors={["#f3efff", "#faf9ff", "#ffffff"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.flex}
    >
      <SafeAreaView style={styles.flex} edges={["top", "bottom"]}>
        {/* iOS: KeyboardAvoidingView with behavior="padding" lifts the whole
            form by the actual keyboard height. Android: no behavior — the
            native softwareKeyboardLayoutMode:"resize" in app.json resizes the
            window instead. The KeyboardAwareScrollView adds an explicit
            measurement pass so the focused input is always scrolled above the
            keyboard with a comfortable gap — this also covers Android Expo Go
            / edge-to-edge, where the window is not resized and a plain
            ScrollView has nothing to scroll. */}
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={0}
        >
          <KeyboardAwareScrollView
            contentContainerStyle={styles.scroll}
            contentStyle={styles.content}
          >
            <View style={styles.brand}>
              <View style={styles.brandMark}>
                <NotebookPen
                  size={21}
                  color={palette.white}
                  strokeWidth={1.8}
                />
              </View>
              <Text style={styles.brandText}>notes</Text>
            </View>

            <View style={styles.card}>
              {icon ? <View style={styles.cardIcon}>{icon}</View> : null}
              {title ? <Text style={styles.title}>{title}</Text> : null}
              {subtitle ? (
                <Text style={styles.subtitle}>{subtitle}</Text>
              ) : null}
              <View style={styles.body}>{children}</View>
            </View>

            {footer}
          </KeyboardAwareScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 32,
    // Base bottom space when the keyboard is closed. While it is open the
    // KeyboardAwareScrollView replaces this with the actual keyboard height
    // and auto-scrolls the focused field above the keyboard with its own
    // comfortable 20-40px gap.
    paddingBottom: 60,
  },
  content: {
    width: "100%",
    maxWidth: 440,
    alignSelf: "center",
    // "auto" margins keep the card vertically centred when it fits, but
    // collapse to 0 when the keyboard shrinks the viewport — unlike
    // justifyContent: "center", the top of an overflowing form stays
    // reachable while scrolling.
    marginVertical: "auto",
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginBottom: 26,
  },
  brandMark: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: palette.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  brandText: {
    fontSize: 24,
    fontWeight: "800",
    color: palette.ink,
  },
  card: {
    backgroundColor: palette.white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#f0f0f8",
    paddingHorizontal: 22,
    paddingVertical: 28,
    shadowColor: "#5b3daa",
    shadowOpacity: 0.08,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 18 },
    elevation: 4,
  },
  cardIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: palette.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: palette.ink,
    textAlign: "center",
  },
  subtitle: {
    marginTop: 6,
    fontSize: 13,
    color: palette.muted,
    textAlign: "center",
  },
  body: {
    marginTop: 22,
    gap: 16,
  },
});
