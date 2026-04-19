import { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { colors, radius } from "@/styles/theme";

type InfoCardProps = {
  title: string;
  children: ReactNode;
};

export function InfoCard({ title, children }: InfoCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.body}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    padding: 22,
    shadowColor: "#F0B67A",
    shadowOpacity: 0.12,
    shadowRadius: 24,
    shadowOffset: {
      width: 0,
      height: 10
    },
    elevation: 2
  },
  title: {
    color: "#D67B1D",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 14
  },
  body: {
    gap: 12
  }
});
