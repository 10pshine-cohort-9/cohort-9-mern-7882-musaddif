import { useRouter } from "expo-router";
import { Eye, EyeOff, Lock, Mail, NotebookPen, ShieldCheck } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AuthShell } from "@/components/AuthShell";
import { AppButton } from "@/components/ui/AppButton";
import { AppTextInput } from "@/components/ui/AppTextInput";
import { palette } from "@/constants/colors";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { clearError } from "@/store/slice/authSlice";
import { loginUser } from "@/store/thunk/authThunk";

export default function LoginScreen() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { loading, error } = useAppSelector((state) => state.auth);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  const handleSubmit = async () => {
    if (!email || !password) return;

    try {
      await dispatch(loginUser({ email: email.trim(), password })).unwrap();
      router.replace("/notes");
    } catch {
      // Error surfaced from the store.
    }
  };

  return (
    <AuthShell
      icon={<NotebookPen size={28} color={palette.purple} strokeWidth={1.7} />}
      title="Welcome back 👋"
      subtitle="Sign in to continue to your account"
      footer={
        <View style={styles.security}>
          <ShieldCheck size={16} color={palette.subtle} />
          <Text style={styles.securityText}>Your notes are private and secure</Text>
        </View>
      }>
      <AppTextInput
        label="Email address"
        value={email}
        onChangeText={setEmail}
        placeholder="Enter your email"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        leftIcon={<Mail size={18} color={palette.placeholder} strokeWidth={1.8} />}
      />

      <View>
        <View style={styles.passwordHeader}>
          <Text style={styles.passwordLabel}>Password</Text>
          <Pressable onPress={() => router.push("/forgot-password")}>
            <Text style={styles.link}>Forgot password?</Text>
          </Pressable>
        </View>
        <AppTextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Enter your password"
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          leftIcon={<Lock size={18} color={palette.placeholder} strokeWidth={1.8} />}
          rightElement={
            <Pressable
              accessibilityLabel="Toggle password visibility"
              hitSlop={8}
              onPress={() => setShowPassword((visible) => !visible)}>
              {showPassword ? (
                <EyeOff size={18} color={palette.placeholder} strokeWidth={1.8} />
              ) : (
                <Eye size={18} color={palette.placeholder} strokeWidth={1.8} />
              )}
            </Pressable>
          }
        />
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <AppButton
        title="Sign in"
        loadingTitle="Signing in..."
        loading={loading}
        onPress={handleSubmit}
      />

      <Text style={styles.switchText}>
        Don&apos;t have an account?{" "}
        <Text style={styles.link} onPress={() => router.push("/signup")}>
          Sign up
        </Text>
      </Text>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  passwordHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 7,
  },
  passwordLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#33405f",
  },
  link: {
    fontSize: 12,
    fontWeight: "700",
    color: palette.purple,
  },
  error: {
    fontSize: 13,
    color: "#c52a44",
    backgroundColor: palette.dangerBg,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  switchText: {
    marginTop: 4,
    fontSize: 13,
    color: palette.muted,
    textAlign: "center",
  },
  security: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    marginTop: 20,
  },
  securityText: {
    fontSize: 12,
    color: palette.subtle,
  },
});
