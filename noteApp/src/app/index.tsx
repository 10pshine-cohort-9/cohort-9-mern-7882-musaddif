import { Redirect } from "expo-router";

import { useAppSelector } from "@/store/hooks";

export default function Index() {
  const token = useAppSelector((state) => state.auth.token);

  return <Redirect href={token ? "/notes" : "/login"} />;
}
