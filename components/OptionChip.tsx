import { Pressable, StyleSheet, Text } from "react-native";

import { colors, radius } from "@/styles/theme";

type OptionChipProps = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
};

export function OptionChip({
  label,
  selected = false,
  onPress
}: OptionChipProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        selected ? styles.selected : styles.defaultChip,
        pressed && styles.pressed
      ]}
    >
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 42,
    borderRadius: 18,
    paddingHorizontal: 16,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.primaryLine
  },
  defaultChip: {
    backgroundColor: colors.surface
  },
  selected: {
    backgroundColor: colors.primarySoft
  },
  pressed: {
    opacity: 0.92
  },
  label: {
    fontSize: 15,
    color: colors.text,
    fontWeight: "600"
  }
});
