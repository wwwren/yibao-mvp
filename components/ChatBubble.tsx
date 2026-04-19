import { StyleSheet, Text, View } from "react-native";

import { colors, radius } from "@/styles/theme";

type ChatBubbleProps = {
  role: "assistant" | "user";
  text: string;
};

export function ChatBubble({ role, text }: ChatBubbleProps) {
  const isUser = role === "user";

  return (
    <View style={[styles.row, isUser ? styles.userRow : styles.assistantRow]}>
      {!isUser ? <View style={styles.avatar} /> : null}
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.aiBubble]}>
        <Text style={[styles.text, isUser ? styles.userText : styles.aiText]}>
          {text}
        </Text>
      </View>
      {isUser ? <View style={styles.avatar} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 12
  },
  assistantRow: {
    width: "100%"
  },
  userRow: {
    width: "100%",
    justifyContent: "flex-end"
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F3D6BC"
  },
  bubble: {
    borderRadius: radius.bubble,
    paddingHorizontal: 18,
    paddingVertical: 16
  },
  aiBubble: {
    maxWidth: "82%",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primaryLine
  },
  userBubble: {
    maxWidth: "72%",
    backgroundColor: colors.userBubble
  },
  text: {
    fontSize: 18,
    lineHeight: 28
  },
  aiText: {
    color: colors.text
  },
  userText: {
    color: colors.userBubbleText
  }
});
