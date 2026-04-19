import { Pressable, StyleSheet, Text } from "react-native";

import { colors, radius } from "@/styles/theme";

type ActionButtonProps = {
  label: string;
  variant?: "primary" | "secondary";
  onPress: () => void;
};

export function ActionButton({
  label,
  variant = "primary",
  onPress
}: ActionButtonProps) {
  const isPrimary = variant === "primary";

  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        isPrimary ? styles.primary : styles.secondary,
        pressed && styles.pressed
      ]}
      onPress={onPress}
    >
      <Text style={[styles.label, isPrimary ? styles.primaryLabel : styles.secondaryLabel]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: radius.button,
    minHeight: 58,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 18
  },
  primary: {
    backgroundColor: colors.primary
  },
  secondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primaryLine
  },
  pressed: {
    opacity: 0.92
  },
  label: {
    fontSize: 18,
    fontWeight: "700"
  },
  primaryLabel: {
    color: "#FFFFFF"
  },
  secondaryLabel: {
    color: colors.text
  }
});
