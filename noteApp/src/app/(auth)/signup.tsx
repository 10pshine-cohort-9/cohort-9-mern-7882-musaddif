import { useRouter } from "expo-router";
import { Eye, EyeOff, Lock, Mail, ShieldCheck, UserRound } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AuthShell } from "@/components/AuthShell";
import { AppButton } from "@/components/ui/AppButton";
import { AppTextInput } from "@/components/ui/AppTextInput";
import { palette } from "@/constants/colors";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { clearError } from "@/store/slice/authSlice";
import { registerUser } from "@/store/thunk/authThunk";

export default function SignupScreen() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { loading, error: serverError } = useAppSelector((state) => state.auth);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [localError, setLocalError] = useState("");

  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  const handleSubmit = async () => {
    setLocalError("");

    if (!name.trim() || !email.trim() || !password) {
      setLocalError("Please fill in all fields.");
      return;
    }

    if (password !== confirmPassword) {
      setLocalError("Passwords do not match.");
      return;
    }

    try {
      await dispatch(registerUser({ name: name.trim(), email: email.trim(), password })).unwrap();
      router.replace("/login");
    } catch {
      // Error surfaced from the store.
    }
  };

  const toggle = (visible: boolean, setVisible: (value: boolean) => void) => (
    <Pressable
      accessibilityLabel="Toggle password visibility"
      hitSlop={8}
      onPress={() => setVisible(!visible)}>
      {visible ? (
        <EyeOff size={18} color={palette.placeholder} strokeWidth={1.8} />
      ) : (
        <Eye size={18} color={palette.placeholder} strokeWidth={1.8} />
      )}
    </Pressable>
  );

  return (
    <AuthShell
      icon={<UserRound size={28} color={palette.purple} strokeWidth={1.7} />}
      title="Create your account"
      subtitle="Start organizing your thoughts today"
      footer={
        <View style={styles.security}>
          <ShieldCheck size={16} color={palette.subtle} />
          <Text style={styles.securityText}>Your notes are private and secure</Text>
        </View>
      }>
      {localError || serverError ? (
        <Text style={styles.error}>{localError || serverError}</Text>
      ) : null}

      <AppTextInput
        label="Full name"
        value={name}
        onChangeText={setName}
        placeholder="Enter your full name"
        autoCapitalize="words"
        leftIcon={<UserRound size={18} color={palette.placeholder} strokeWidth={1.8} />}
      />

      <AppTextInput
        label="Email address"
        value={email}
        onChangeText={setEmail}
        placeholder="Enter your email"
        keyboardType="email-address"
        autoCapitalize="none"
        leftIcon={<Mail size={18} color={palette.placeholder} strokeWidth={1.8} />}
      />

      <AppTextInput
        label="Password"
        value={password}
        onChangeText={setPassword}
        placeholder="Create a password"
        secureTextEntry={!showPassword}
        autoCapitalize="none"
        leftIcon={<Lock size={18} color={palette.placeholder} strokeWidth={1.8} />}
        rightElement={toggle(showPassword, setShowPassword)}
        hint="At least 8 characters with upper, lower, and a number"
      />

      <AppTextInput
        label="Confirm password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        placeholder="Confirm your password"
        secureTextEntry={!showConfirmPassword}
        autoCapitalize="none"
        leftIcon={<Lock size={18} color={palette.placeholder} strokeWidth={1.8} />}
        rightElement={toggle(showConfirmPassword, setShowConfirmPassword)}
      />

      <AppButton
        title="Create account"
        loadingTitle="Creating account..."
        loading={loading}
        onPress={handleSubmit}
      />

      <Text style={styles.switchText}>
        Already have an account?{" "}
        <Text style={styles.link} onPress={() => router.push("/login")}>
          Sign in
        </Text>
      </Text>
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
  link: {
    fontSize: 13,
    fontWeight: "700",
    color: palette.purple,
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
