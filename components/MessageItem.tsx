import { PropsWithChildren, ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { ChatBubble } from "@/components/ChatBubble";
import { colors } from "@/styles/theme";

type MessageItemProps = PropsWithChildren<{
  role?: "assistant" | "user";
  text?: string;
  variant?: "system" | "card" | "custom";
  label?: ReactNode;
}>;

export function MessageItem({
  role,
  text,
  variant = "custom",
  label,
  children
}: MessageItemProps) {
  if (role && text) {
    return <ChatBubble role={role} text={text} />;
  }

  if (variant === "system" && text) {
    return (
      <View style={styles.systemCard}>
        {label ? <View style={styles.labelWrap}>{label}</View> : null}
        <Text style={styles.systemText}>{text}</Text>
      </View>
    );
  }

  if (variant === "card") {
    return <View style={styles.cardWrap}>{children}</View>;
  }

  return <View style={styles.customWrap}>{children}</View>;
}

const styles = StyleSheet.create({
  systemCard: {
    backgroundColor: "#FFF8F0",
    borderColor: colors.primaryLine,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 16,
    gap: 8
  },
  labelWrap: {
    alignSelf: "flex-start"
  },
  systemText: {
    color: colors.textSoft,
    fontSize: 16,
    lineHeight: 24
  },
  cardWrap: {
    width: "100%"
  },
  customWrap: {
    width: "100%"
  },
  labelText: {
    color: colors.textSoft
  }
});
