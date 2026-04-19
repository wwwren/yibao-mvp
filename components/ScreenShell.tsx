import { PropsWithChildren, ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors, radius } from "@/styles/theme";

type ScreenShellProps = PropsWithChildren<{
  title: string;
  subtitle: string;
  footer?: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
}>;

export function ScreenShell({
  title,
  subtitle,
  children,
  footer,
  contentStyle
}: ScreenShellProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.backgroundGlowLeft} />
      <View style={styles.backgroundGlowRight} />

      <KeyboardAvoidingView
        style={styles.layout}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
      >
        <View style={styles.header}>
          <Text style={styles.time}>9:41</Text>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>

        <View style={[styles.content, contentStyle]}>{children}</View>
        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.pageBg
  },
  layout: {
    flex: 1
  },
  backgroundGlowLeft: {
    position: "absolute",
    top: 88,
    left: -72,
    width: 260,
    height: 260,
    borderRadius: 999,
    backgroundColor: "rgba(244,154,63,0.16)"
  },
  backgroundGlowRight: {
    position: "absolute",
    top: 260,
    right: -96,
    width: 240,
    height: 240,
    borderRadius: 999,
    backgroundColor: "rgba(255,208,160,0.28)"
  },
  header: {
    paddingTop: 12,
    paddingBottom: 14,
    paddingHorizontal: 18,
    backgroundColor: "rgba(255,248,241,0.92)"
  },
  time: {
    color: colors.text,
    fontSize: 12,
    marginBottom: 4
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4
  },
  subtitle: {
    color: colors.textSoft,
    fontSize: 13,
    lineHeight: 18
  },
  content: {
    flex: 1,
    minHeight: 0
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: "rgba(240,200,164,0.9)",
    backgroundColor: "rgba(255,253,251,0.95)",
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 10,
    gap: 10
  }
});
