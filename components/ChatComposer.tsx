import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { colors, radius } from "@/styles/theme";

export type ComposerAction = {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
};

type ChatComposerProps = {
  value: string;
  placeholder: string;
  onChangeText: (value: string) => void;
  onSend: () => void;
  sendDisabled?: boolean;
  disabled?: boolean;
  actions?: ComposerAction[];
};

export function ChatComposer({
  value,
  placeholder,
  onChangeText,
  onSend,
  sendDisabled = false,
  disabled = false,
  actions = []
}: ChatComposerProps) {
  return (
    <View style={styles.wrap}>
      {actions.length ? (
        <View style={styles.actionRow}>
          {actions.map((action) => (
            <Pressable
              key={action.key}
              style={[styles.actionChip, disabled && styles.actionChipDisabled]}
              onPress={action.onPress}
              disabled={disabled}
            >
              <Ionicons name={action.icon} size={16} color={colors.textSoft} />
              <Text style={styles.actionLabel}>{action.label}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={value}
          placeholder={placeholder}
          placeholderTextColor="#A48C79"
          onChangeText={onChangeText}
          editable
          multiline
        />

        <Pressable
          onPress={onSend}
          disabled={sendDisabled}
          style={({ pressed }) => [
            styles.sendButton,
            sendDisabled && styles.sendButtonDisabled,
            pressed && !sendDisabled && styles.sendButtonPressed
          ]}
        >
          <Ionicons name="send" size={18} color="#FFFFFF" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 10
  },
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  actionChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: radius.pill,
    backgroundColor: "#FFF6EC",
    borderWidth: 1,
    borderColor: colors.primaryLine,
    paddingHorizontal: 12,
    paddingVertical: 9
  },
  actionChipDisabled: {
    opacity: 0.5
  },
  actionLabel: {
    color: colors.textSoft,
    fontSize: 14,
    fontWeight: "600"
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10
  },
  input: {
    flex: 1,
    minHeight: 54,
    maxHeight: 120,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.primaryLine,
    backgroundColor: colors.surface,
    color: colors.text,
    fontSize: 16,
    lineHeight: 24,
    paddingHorizontal: 16,
    paddingVertical: 14
  },
  sendButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#F0A14F",
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 6
    },
    elevation: 2
  },
  sendButtonDisabled: {
    opacity: 0.45
  },
  sendButtonPressed: {
    opacity: 0.9
  }
});
