import { Pressable, StyleSheet, Text, View } from "react-native";

import { ActionButton } from "@/components/ActionButton";
import { InfoCard } from "@/components/InfoCard";
import { LbsMapCard } from "@/components/LbsMapCard";
import { MessageItem } from "@/components/MessageItem";
import { OptionChip } from "@/components/OptionChip";
import { PillTag } from "@/components/PillTag";
import { colors, radius } from "@/styles/theme";
import type { ChatMessage } from "@/types/chat";

type MessageRendererProps = {
  message: ChatMessage;
};

export function MessageRenderer({ message }: MessageRendererProps) {
  switch (message.kind) {
    case "text":
      return <MessageItem role={message.role} text={message.text} />;

    case "system":
      return <MessageItem variant="system" text={message.text} />;

    case "action":
      return (
        <MessageItem variant="custom">
          <ActionButton
            label={message.action.label}
            variant={message.action.variant}
            onPress={message.action.onPress}
          />
        </MessageItem>
      );

    case "chipGroup":
      return (
        <MessageItem variant="custom">
          <View style={styles.chipRow}>
            {message.chips.map((chip) => (
              <OptionChip
                key={chip.key}
                label={chip.label}
                selected={chip.selected}
                onPress={chip.onPress}
              />
            ))}
          </View>
        </MessageItem>
      );

    case "featureCard":
      return (
        <MessageItem variant="card">
          <InfoCard title={message.title}>
            {message.heading || message.tag ? (
              <View style={styles.headingRow}>
                {message.heading ? <Text style={styles.heading}>{message.heading}</Text> : <View />}
                {message.tag ? (
                  <PillTag label={message.tag.label} tone={message.tag.tone} />
                ) : null}
              </View>
            ) : null}

            {message.description ? (
              <Text style={styles.description}>{message.description}</Text>
            ) : null}

            {message.bullets?.length ? (
              <View style={styles.list}>
                {message.bullets.map((bullet) => (
                  <Text key={bullet} style={styles.bullet}>
                    {`\u2022 ${bullet}`}
                  </Text>
                ))}
              </View>
            ) : null}

            {message.chips?.length ? (
              <View style={styles.chipRow}>
                {message.chips.map((chip) => (
                  <OptionChip
                    key={chip.key}
                    label={chip.label}
                    selected={chip.selected}
                    onPress={chip.onPress}
                  />
                ))}
              </View>
            ) : null}
          </InfoCard>
        </MessageItem>
      );

    case "binaryChoiceCard":
      return (
        <MessageItem variant="card">
          <InfoCard title={message.title}>
            <Text style={styles.question}>{message.question}</Text>
            {message.hint ? <Text style={styles.helper}>{message.hint}</Text> : null}
            <View style={styles.buttonStack}>
              {message.options.map((option) => (
                <ActionButton
                  key={option.key}
                  label={option.label}
                  variant={option.variant}
                  onPress={option.onPress}
                />
              ))}
            </View>
          </InfoCard>
        </MessageItem>
      );

    case "choiceCard":
      return (
        <MessageItem variant="card">
          <InfoCard title={message.title}>
            {message.description ? (
              <Text style={styles.description}>{message.description}</Text>
            ) : null}
            <View style={styles.choiceGroups}>
              {message.groups.map((group, index) => (
                <View key={`${message.id}-${index}`} style={styles.chipRow}>
                  {group.map((chip) => (
                    <OptionChip
                      key={chip.key}
                      label={chip.label}
                      selected={chip.selected}
                      onPress={chip.onPress}
                    />
                  ))}
                </View>
              ))}
            </View>
          </InfoCard>
        </MessageItem>
      );

    case "selectListCard":
      return (
        <MessageItem variant="card">
          <InfoCard title={message.title}>
            {message.description ? (
              <Text style={styles.smallDescription}>{message.description}</Text>
            ) : null}
            <View style={styles.list}>
              {message.options.map((option) => (
                <Pressable
                  key={option.key}
                  onPress={option.onPress}
                  style={[styles.selectionRow, option.selected && styles.selectedRow]}
                >
                  <View style={styles.rowText}>
                    <Text style={styles.rowTitle}>{option.title}</Text>
                    {option.meta ? <Text style={styles.rowMeta}>{option.meta}</Text> : null}
                  </View>
                  {option.tag ? (
                    <PillTag label={option.tag.label} tone={option.tag.tone} />
                  ) : null}
                  {option.hint ? <Text style={styles.rowHint}>{option.hint}</Text> : null}
                </Pressable>
              ))}
            </View>
          </InfoCard>
        </MessageItem>
      );

    case "summaryCard":
      return (
        <MessageItem variant="card">
          <InfoCard title={message.title}>
            {message.description ? (
              <Text style={styles.description}>{message.description}</Text>
            ) : null}

            {message.rows?.length ? (
              <View style={styles.list}>
                {message.rows.map((row) => (
                  <SummaryRow key={`${message.id}-${row.label}`} label={row.label} value={row.value} />
                ))}
              </View>
            ) : null}

            {message.bullets?.length ? (
              <View style={styles.list}>
                {message.bullets.map((bullet) => (
                  <Text key={bullet} style={styles.bullet}>
                    {`\u2022 ${bullet}`}
                  </Text>
                ))}
              </View>
            ) : null}

            {message.actions?.length ? (
              <View style={styles.buttonStack}>
                {message.actions.map((action) => (
                  <ActionButton
                    key={action.key}
                    label={action.label}
                    variant={action.variant}
                    onPress={action.onPress}
                  />
                ))}
              </View>
            ) : null}
          </InfoCard>
        </MessageItem>
      );

    case "mapCard":
      return (
        <MessageItem variant="card">
          <LbsMapCard message={message} />
        </MessageItem>
      );

    case "custom":
      return <MessageItem variant="custom">{message.node}</MessageItem>;
  }
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  choiceGroups: {
    gap: 10
  },
  headingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12
  },
  heading: {
    color: colors.text,
    fontSize: 32,
    fontWeight: "800"
  },
  description: {
    color: colors.textSoft,
    fontSize: 16,
    lineHeight: 25
  },
  smallDescription: {
    color: colors.textSoft,
    fontSize: 15,
    lineHeight: 24
  },
  list: {
    gap: 12
  },
  bullet: {
    color: colors.textSoft,
    fontSize: 15,
    lineHeight: 24
  },
  question: {
    color: colors.text,
    fontSize: 18,
    lineHeight: 28,
    fontWeight: "700"
  },
  helper: {
    color: colors.textSoft,
    fontSize: 15,
    lineHeight: 24
  },
  buttonStack: {
    gap: 10
  },
  selectionRow: {
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.primaryLine,
    backgroundColor: colors.surface,
    padding: 16,
    gap: 10
  },
  selectedRow: {
    backgroundColor: colors.primarySoft
  },
  rowText: {
    gap: 4
  },
  rowTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "700"
  },
  rowMeta: {
    color: colors.textSoft,
    fontSize: 14,
    lineHeight: 20
  },
  rowHint: {
    color: colors.textSoft,
    fontSize: 14,
    lineHeight: 22
  },
  summaryRow: {
    flexDirection: "row",
    gap: 12
  },
  summaryLabel: {
    width: 86,
    color: colors.textSoft,
    fontSize: 15,
    lineHeight: 24
  },
  summaryValue: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "600"
  }
});
