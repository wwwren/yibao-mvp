import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { MvpFlowProvider } from "@/store/MvpFlowContext";

export default function RootLayout() {
  return (
    <MvpFlowProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }} />
    </MvpFlowProvider>
  );
}
