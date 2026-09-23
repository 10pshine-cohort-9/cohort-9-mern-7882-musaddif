import { Redirect, Stack } from "expo-router";

import { useAppSelector } from "@/store/hooks";

export default function AuthLayout() {
  const token = useAppSelector((state) => state.auth.token);

  if (token) {
    return <Redirect href="/notes" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
