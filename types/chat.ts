import type { ReactNode } from "react";

type ActionVariant = "primary" | "secondary";
type TagTone = "orange" | "blue" | "green" | "red";

export type MessageTag = {
  label: string;
  tone?: TagTone;
};

export type MessageAction = {
  key: string;
  label: string;
  variant?: ActionVariant;
  onPress: () => void;
};

export type MessageChip = {
  key: string;
  label: string;
  selected?: boolean;
  onPress?: () => void;
};

export type MessageListOption = {
  key: string;
  title: string;
  meta?: string;
  hint?: string;
  tag?: MessageTag;
  selected?: boolean;
  onPress: () => void;
};

export type MessageSummaryRow = {
  label: string;
  value: string;
};

export type MapMode = "taxi" | "transit" | "drive";

export type MapModeOption = {
  key: MapMode;
  label: string;
  eta: string;
  meta: string;
  selected: boolean;
  onPress: () => void;
};

export type MapPointKind = "entrance" | "parking" | "triage" | "pharmacy";

export type MapPoint = {
  key: string;
  label: string;
  kind: MapPointKind;
  selected: boolean;
  meta?: string;
  onPress?: () => void;
};

export type MapRouteStepKind =
  | "walk"
  | "subway"
  | "taxi"
  | "drive"
  | "parking"
  | "arrival"
  | "indoor";

export type MapRouteStep = {
  key: string;
  kind: MapRouteStepKind;
  title: string;
  detail: string;
};

type BaseMessage = {
  id: string;
};

export type TextMessage = BaseMessage & {
  kind: "text";
  role: "assistant" | "user";
  text: string;
};

export type SystemMessage = BaseMessage & {
  kind: "system";
  text: string;
};

export type ActionMessage = BaseMessage & {
  kind: "action";
  action: MessageAction;
};

export type ChipGroupMessage = BaseMessage & {
  kind: "chipGroup";
  chips: MessageChip[];
};

export type FeatureCardMessage = BaseMessage & {
  kind: "featureCard";
  title: string;
  heading?: string;
  tag?: MessageTag;
  description?: string;
  bullets?: string[];
  chips?: MessageChip[];
};

export type BinaryChoiceCardMessage = BaseMessage & {
  kind: "binaryChoiceCard";
  title: string;
  question: string;
  hint?: string;
  options: MessageAction[];
};

export type ChoiceCardMessage = BaseMessage & {
  kind: "choiceCard";
  title: string;
  description?: string;
  groups: MessageChip[][];
};

export type SelectListCardMessage = BaseMessage & {
  kind: "selectListCard";
  title: string;
  description?: string;
  options: MessageListOption[];
};

export type SummaryCardMessage = BaseMessage & {
  kind: "summaryCard";
  title: string;
  description?: string;
  rows?: MessageSummaryRow[];
  bullets?: string[];
  actions?: MessageAction[];
};

export type MapCardMessage = BaseMessage & {
  kind: "mapCard";
  title: string;
  appearance?: "outdoor" | "indoor";
  currentLabel: string;
  destinationLabel: string;
  distanceLabel: string;
  routeSummary?: string;
  routeSteps?: MapRouteStep[];
  hint?: string;
  modes: MapModeOption[];
  points?: MapPoint[];
  secondaryAction?: MessageAction;
  action?: MessageAction;
};

export type CustomMessage = BaseMessage & {
  kind: "custom";
  node: ReactNode;
};

export type ChatMessage =
  | TextMessage
  | SystemMessage
  | ActionMessage
  | ChipGroupMessage
  | FeatureCardMessage
  | BinaryChoiceCardMessage
  | ChoiceCardMessage
  | SelectListCardMessage
  | SummaryCardMessage
  | MapCardMessage
  | CustomMessage;
