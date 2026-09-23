import { Redirect, Stack } from "expo-router";

import { useAppSelector } from "@/store/hooks";

export default function AppLayout() {
  const token = useAppSelector((state) => state.auth.token);

  if (!token) {
    return <Redirect href="/login" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
