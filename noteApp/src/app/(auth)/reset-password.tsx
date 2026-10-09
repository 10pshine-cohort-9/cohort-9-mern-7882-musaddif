import { useLocalSearchParams, useRouter } from "expo-router";
import { CheckCircle2, Eye, EyeOff, Lock } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text } from "react-native";

import { AuthShell } from "@/components/AuthShell";
import { AppButton } from "@/components/ui/AppButton";
import { AppTextInput } from "@/components/ui/AppTextInput";
import { palette } from "@/constants/colors";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { clearError } from "@/store/slice/authSlice";
import { resetPassword } from "@/store/thunk/authThunk";

export default function ResetPasswordScreen() {
  const params = useLocalSearchParams<{ token?: string }>();
  const token = typeof params.token === "string" ? params.token : "";

  const dispatch = useAppDispatch();
  const router = useRouter();
  const { loading, error } = useAppSelector((state) => state.auth);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState("");
  const [resetSuccess, setResetSuccess] = useState(false);

  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  const handleSubmit = async () => {
    setLocalError("");

    if (!token) {
      setLocalError("Missing reset token in URL.");
      return;
    }

    if (password.trim().length < 6) {
      setLocalError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setLocalError("Passwords do not match.");
      return;
    }

    try {
      await dispatch(resetPassword({ token, password })).unwrap();
      setResetSuccess(true);
    } catch {
      // Error surfaced from the store.
    }
  };

  if (resetSuccess) {
    return (
      <AuthShell
        icon={<CheckCircle2 size={28} color={palette.success} strokeWidth={2} />}
        title="Password Updated!"
        subtitle="Your password has been successfully reset. You can now log in with your new password.">
        <AppButton title="Go to Sign In" onPress={() => router.replace("/login")} />
      </AuthShell>
    );
  }

  const message = localError || error || (!token ? "Invalid or missing password reset link." : "");

  return (
    <AuthShell title="Reset Password" subtitle="Enter and confirm your new password below.">
      {message ? <Text style={styles.error}>{message}</Text> : null}

      <AppTextInput
        label="New Password"
        value={password}
        onChangeText={setPassword}
        placeholder="At least 6 characters"
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

      <AppTextInput
        label="Confirm New Password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        placeholder="Confirm new password"
        secureTextEntry={!showPassword}
        autoCapitalize="none"
        leftIcon={<Lock size={18} color={palette.placeholder} strokeWidth={1.8} />}
      />

      <AppButton
        title="Reset Password"
        loadingTitle="Resetting password..."
        loading={loading}
        disabled={!token}
        onPress={handleSubmit}
      />

      <AppButton
        title="Back to sign in"
        variant="ghost"
        onPress={() => router.replace("/login")}
      />
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  error: {
    fontSize: 13,
    color: "#c52a44",
    backgroundColor: palette.dangerBg,
    borderWidth: 1,
    borderColor: palette.dangerBorder,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
});
