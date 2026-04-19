import { StyleSheet, Text, View } from "react-native";

import { colors } from "@/styles/theme";

type FlowNoteProps = {
  title: string;
  body: string;
};

export function FlowNote({ title, body }: FlowNoteProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.noteBg,
    borderWidth: 1,
    borderColor: "#D6E7FF",
    borderRadius: 18,
    padding: 14,
    gap: 6
  },
  title: {
    fontSize: 14,
    fontWeight: "700",
    color: "#4B6D98"
  },
  body: {
    fontSize: 13,
    lineHeight: 20,
    color: colors.textSoft
  }
});
