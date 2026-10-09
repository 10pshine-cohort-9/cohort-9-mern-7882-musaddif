import { useRouter } from "expo-router";
import { ArrowLeft, CheckCircle2, Lock, Mail } from "lucide-react-native";
import { useEffect, useState } from "react";
import { StyleSheet, Text } from "react-native";

import { AuthShell } from "@/components/AuthShell";
import { AppButton } from "@/components/ui/AppButton";
import { AppTextInput } from "@/components/ui/AppTextInput";
import { palette } from "@/constants/colors";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { clearError } from "@/store/slice/authSlice";
import { forgotPassword } from "@/store/thunk/authThunk";

export default function ForgotPasswordScreen() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { loading, error } = useAppSelector((state) => state.auth);

  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  const handleSubmit = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) return;

    try {
      await dispatch(forgotPassword(trimmedEmail)).unwrap();
      setSubmitted(true);
    } catch {
      setSubmitted(false);
    }
  };

  if (submitted) {
    return (
      <AuthShell
        icon={<CheckCircle2 size={28} color={palette.success} strokeWidth={2} />}
        title="Check your inbox"
        subtitle="We've sent a password reset link to">
        <Text style={styles.email}>{email}</Text>
        <Text style={styles.helper}>
          Didn&apos;t receive the email? Check your spam folder or try again.
        </Text>
        <AppButton title="Try another email" variant="secondary" onPress={() => setSubmitted(false)} />
        <AppButton
          title="Back to sign in"
          variant="ghost"
          icon={<ArrowLeft size={16} color={palette.muted} strokeWidth={1.8} />}
          onPress={() => router.replace("/login")}
        />
      </AuthShell>
    );
  }

  return (
    <AuthShell
      icon={<Lock size={28} color={palette.purple} strokeWidth={1.7} />}
      title="Forgot your password?"
      subtitle="No worries. Enter your email and we'll send you a reset link.">
      <AppTextInput
        label="Email address"
        value={email}
        onChangeText={setEmail}
        placeholder="Enter your email"
        keyboardType="email-address"
        autoCapitalize="none"
        editable={!loading}
        leftIcon={<Mail size={18} color={palette.placeholder} strokeWidth={1.8} />}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <AppButton
        title="Send reset link"
        loadingTitle="Sending..."
        loading={loading}
        onPress={handleSubmit}
      />

      <AppButton
        title="Back to sign in"
        variant="ghost"
        icon={<ArrowLeft size={16} color={palette.muted} strokeWidth={1.8} />}
        onPress={() => router.replace("/login")}
      />
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  email: {
    fontSize: 14,
    fontWeight: "700",
    color: palette.purple,
    textAlign: "center",
  },
  helper: {
    fontSize: 12,
    color: palette.subtle,
    textAlign: "center",
    lineHeight: 18,
  },
  error: {
    fontSize: 13,
    color: "#c52a44",
    backgroundColor: palette.dangerBg,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
});
