import { Redirect } from "expo-router";

import { useAppSelector } from "@/store/hooks";

export default function Index() {
  const token = useAppSelector((state) => state.auth.token);
  const sessionRestored = useAppSelector((state) => state.auth.sessionRestored);

  // Wait for the keychain restore before deciding where to send the user.
  if (!sessionRestored) {
    return null;
  }

  return <Redirect href={token ? "/notes" : "/login"} />;
}
