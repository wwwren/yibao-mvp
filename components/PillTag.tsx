import { StyleSheet, Text, View } from "react-native";

import { colors, radius } from "@/styles/theme";

type PillTagProps = {
  label: string;
  tone?: "orange" | "blue" | "green" | "red";
};

const toneStyles = {
  orange: { backgroundColor: colors.primarySoft, textColor: "#C97618" },
  blue: { backgroundColor: colors.blueSoft, textColor: colors.blueText },
  green: { backgroundColor: colors.greenSoft, textColor: colors.greenText },
  red: { backgroundColor: colors.redSoft, textColor: colors.redText }
};

export function PillTag({ label, tone = "orange" }: PillTagProps) {
  const toneStyle = toneStyles[tone];

  return (
    <View style={[styles.container, { backgroundColor: toneStyle.backgroundColor }]}>
      <Text style={[styles.label, { color: toneStyle.textColor }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: "flex-start",
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 8
  },
  label: {
    fontSize: 14,
    fontWeight: "600"
  }
});
