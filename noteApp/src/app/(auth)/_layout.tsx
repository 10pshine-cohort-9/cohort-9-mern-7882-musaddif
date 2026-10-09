import { Redirect, Stack } from "expo-router";

import { useAppSelector } from "@/store/hooks";

export default function AuthLayout() {
  const token = useAppSelector((state) => state.auth.token);
  const sessionRestored = useAppSelector((state) => state.auth.sessionRestored);

  if (!sessionRestored) {
    return null;
  }

  if (token) {
    return <Redirect href="/notes" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
