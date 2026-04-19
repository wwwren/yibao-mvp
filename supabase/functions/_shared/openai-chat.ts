type EncounterStatus =
  | "SYMPTOM_INTAKE"
  | "TRIAGED"
  | "APPOINTMENT_CONFIRMED"
  | "ON_THE_WAY"
  | "ARRIVED_HOSPITAL"
  | "WAITING_PAYMENT"
  | "WAITING_RESULTS"
  | "PARTIAL_RESULT_READY"
  | "READY_FOR_PHARMACY"
  | "CARE_PLAN_READY";

type DelegationMode = "self" | "family_proxy";

type CloudChatRequest = {
  sessionId: string;
  prompt: string;
  symptom: string;
  recentHistory?: string[];
  preferredTime?: string;
  expertPreference?: "normal" | "expert";
  appointment?: {
    hospitalId: string;
    hospitalName: string;
    department: string;
    doctorName?: string;
    appointmentTime: string;
  };
  encounterStatus: EncounterStatus;
  location?: {
    lat: number;
    lng: number;
    zone: string;
    label: string;
    distanceToHospitalMeters?: number;
  };
  delegationMode: DelegationMode;
  promptVersion?: string;
};

type StructuredChatResponse = {
  promptVersion: string;
  messages: Array<Record<string, unknown>>;
  nextStatus: EncounterStatus;
  debug?: {
    source: "model" | "fallback";
    detail?: string;
  };
};

type ModelCardPayload = {
  nextStatus: EncounterStatus;
  assistantText: string;
  summaryTitle: string;
  summaryTagLabel?: string;
  summaryTagTone?: "orange" | "blue" | "green" | "red";
  summaryRows?: Array<{ label: string; value: string }>;
  summaryBullets: string[];
  featureTitle?: string;
  featureHeading?: string;
  featureTagLabel?: string;
  featureTagTone?: "orange" | "blue" | "green" | "red";
  featureDescription?: string;
  featureBullets?: string[];
};

const PROMPT_VERSION = "silver-companion-v3-qwen";
const DEFAULT_QWEN_BASE_URL =
  Deno.env.get("DASHSCOPE_BASE_URL") ??
  Deno.env.get("LLM_BASE_URL") ??
  "https://dashscope.aliyuncs.com/compatible-mode/v1";
const DEFAULT_QWEN_MODEL =
  Deno.env.get("DASHSCOPE_MODEL") ??
  Deno.env.get("LLM_MODEL") ??
  "qwen-plus";

const SYSTEM_PROMPT = `
你是“医宝”的银发陪诊助手。
你的输出必须服务于老年用户就医，不要写成医学百科。

规则：
1. 先安抚，再解释，再给下一步。
2. 默认面向老人本人，短句，大白话，少术语。
3. 不直接做医学诊断，只做初步判断、风险提示、推荐科室、下一步建议。
4. 如果是风险症状，要明确建议尽快线下就医。
5. 输出必须是结构化 JSON，便于前端渲染消息卡片。
6. 请只输出一个 JSON 对象，不要输出数组，不要输出额外解释。
7. 文本要短，适合老人阅读。
8. 固定输出字段：
   - nextStatus
   - assistantText
   - summaryTitle
   - summaryTagLabel
   - summaryTagTone
   - summaryRows
   - summaryBullets
   - featureTitle
   - featureHeading
   - featureTagLabel
   - featureTagTone
   - featureDescription
   - featureBullets
`.trim();

const CHAT_SCHEMA = {
  name: "silver_companion_payload",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["nextStatus", "assistantText", "summaryTitle", "summaryBullets"],
    properties: {
      nextStatus: {
        type: "string",
        enum: [
          "SYMPTOM_INTAKE",
          "TRIAGED",
          "APPOINTMENT_CONFIRMED",
          "ON_THE_WAY",
          "ARRIVED_HOSPITAL",
          "WAITING_PAYMENT",
          "WAITING_RESULTS",
          "PARTIAL_RESULT_READY",
          "READY_FOR_PHARMACY",
          "CARE_PLAN_READY"
        ]
      },
      assistantText: { type: "string" },
      summaryTitle: { type: "string" },
      summaryTagLabel: { type: "string" },
      summaryTagTone: {
        type: "string",
        enum: ["orange", "blue", "green", "red"]
      },
      summaryRows: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["label", "value"],
          properties: {
            label: { type: "string" },
            value: { type: "string" }
          }
        }
      },
      summaryBullets: {
        type: "array",
        minItems: 2,
        maxItems: 4,
        items: { type: "string" }
      },
      featureTitle: { type: "string" },
      featureHeading: { type: "string" },
      featureTagLabel: { type: "string" },
      featureTagTone: {
        type: "string",
        enum: ["orange", "blue", "green", "red"]
      },
      featureDescription: { type: "string" },
      featureBullets: {
        type: "array",
        items: { type: "string" }
      }
    }
  }
};

function fallbackStructuredChat(request: CloudChatRequest): StructuredChatResponse {
  return {
    promptVersion: request.promptVersion ?? PROMPT_VERSION,
    nextStatus: request.encounterStatus ?? "TRIAGED",
    debug: {
      source: "fallback"
    },
    messages: buildMessagesFromPayload(request, {
      nextStatus: request.encounterStatus ?? "TRIAGED",
      assistantText: request.prompt
        ? `我收到了你的描述：“${request.prompt}”。后面这里可以替换成真实大模型输出。`
        : "我已经准备好接收你的症状描述。",
      summaryTitle: "当前建议",
      summaryRows: [
        { label: "当前阶段", value: request.encounterStatus ?? "TRIAGED" }
      ],
      summaryBullets: [
        "先把主要症状继续告诉我",
        "如果有发热、胸闷、呼吸困难，请及时线下就医"
      ]
    })
  };
}

function buildModelInput(request: CloudChatRequest) {
  return [
    {
      role: "user",
      content: [
        {
          type: "input_text",
          text: JSON.stringify({
            prompt: request.prompt,
            symptom: request.symptom,
            encounterStatus: request.encounterStatus,
            preferredTime: request.preferredTime,
            expertPreference: request.expertPreference,
            delegationMode: request.delegationMode,
            appointment: request.appointment,
            location: request.location
          })
        }
      ]
    }
  ];
}

function withIds(messages: Array<Record<string, unknown>>) {
  return messages.map((message, index) => ({
    id: String(message.id ?? `openai-msg-${index + 1}`),
    ...message
  }));
}

function getOutputText(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const record = payload as Record<string, unknown>;

  if (typeof record.output_text === "string" && record.output_text.trim()) {
    return record.output_text;
  }

  const output = record.output;

  if (!Array.isArray(output)) {
    return null;
  }

  const parts = output.flatMap((item) => {
    if (!item || typeof item !== "object") {
      return [];
    }

    const message = item as Record<string, unknown>;

    if (message.type !== "message" || !Array.isArray(message.content)) {
      return [];
    }

    return message.content.flatMap((contentItem) => {
      if (!contentItem || typeof contentItem !== "object") {
        return [];
      }

      const content = contentItem as Record<string, unknown>;

      if (content.type !== "output_text" || typeof content.text !== "string") {
        return [];
      }

      return [content.text];
    });
  });

  return parts.length ? parts.join("\n").trim() : null;
}

function buildMessagesFromPayload(request: CloudChatRequest, payload: ModelCardPayload) {
  const messages: Array<Record<string, unknown>> = [
    {
      id: "supabase-chat-system",
      kind: "system",
      text: "云端已接收本轮症状描述，并完成会话入库。"
    },
    {
      id: "supabase-chat-assistant",
      kind: "text",
      role: "assistant",
      text: payload.assistantText.trim()
    },
    {
      id: "supabase-chat-summary",
      kind: "summaryCard",
      title: payload.summaryTitle.trim(),
      rows: Array.isArray(payload.summaryRows)
        ? payload.summaryRows
            .filter(
              (item): item is { label: string; value: string } =>
                !!item &&
                typeof item.label === "string" &&
                typeof item.value === "string" &&
                item.label.trim().length > 0 &&
                item.value.trim().length > 0
            )
            .map((item) => ({
              label: item.label.trim(),
              value: item.value.trim()
            }))
        : undefined,
      tag: payload.summaryTagLabel?.trim()
        ? {
            label: payload.summaryTagLabel.trim(),
            tone: payload.summaryTagTone ?? "orange"
          }
        : undefined,
      bullets: payload.summaryBullets
        .filter((item) => typeof item === "string" && item.trim())
        .map((item) => item.trim())
    }
  ];

  if (payload.featureTitle?.trim()) {
    messages.push({
      id: "supabase-chat-feature",
      kind: "featureCard",
      title: payload.featureTitle.trim(),
      heading: payload.featureHeading?.trim() || undefined,
      tag: payload.featureTagLabel?.trim()
        ? {
            label: payload.featureTagLabel.trim(),
            tone: payload.featureTagTone ?? "orange"
          }
        : undefined,
      description: payload.featureDescription?.trim() || undefined,
      bullets: Array.isArray(payload.featureBullets)
        ? payload.featureBullets
            .filter((item) => typeof item === "string" && item.trim())
            .map((item) => item.trim())
        : undefined
    });
  }

  return messages;
}

function parseModelPayload(outputText: string): ModelCardPayload | null {
  const parsed = JSON.parse(outputText) as unknown;

  if (!parsed || typeof parsed !== "object") {
    return null;
  }

  const record = parsed as Record<string, unknown>;

  if (
    typeof record.nextStatus !== "string" ||
    typeof record.assistantText !== "string" ||
    typeof record.summaryTitle !== "string" ||
    !Array.isArray(record.summaryBullets)
  ) {
    return null;
  }

  const summaryBullets = record.summaryBullets.filter(
    (item): item is string => typeof item === "string" && item.trim().length > 0
  );

  if (!summaryBullets.length) {
    return null;
  }

  return {
    nextStatus: record.nextStatus as EncounterStatus,
    assistantText: record.assistantText.trim(),
    summaryTitle: record.summaryTitle.trim(),
    summaryTagLabel:
      typeof record.summaryTagLabel === "string" && record.summaryTagLabel.trim()
        ? record.summaryTagLabel.trim()
        : undefined,
    summaryTagTone:
      record.summaryTagTone === "blue" ||
      record.summaryTagTone === "green" ||
      record.summaryTagTone === "red" ||
      record.summaryTagTone === "orange"
        ? (record.summaryTagTone as "orange" | "blue" | "green" | "red")
        : undefined,
    summaryRows: Array.isArray(record.summaryRows)
      ? record.summaryRows
          .filter(
            (item): item is { label: string; value: string } =>
              !!item &&
              typeof item === "object" &&
              typeof (item as { label?: unknown }).label === "string" &&
              typeof (item as { value?: unknown }).value === "string"
          )
          .map((item) => ({
            label: item.label.trim(),
            value: item.value.trim()
          }))
      : undefined,
    summaryBullets: summaryBullets.map((item) => item.trim()),
    featureTitle:
      typeof record.featureTitle === "string" && record.featureTitle.trim()
        ? record.featureTitle.trim()
        : undefined,
    featureHeading:
      typeof record.featureHeading === "string" && record.featureHeading.trim()
        ? record.featureHeading.trim()
        : undefined,
    featureTagLabel:
      typeof record.featureTagLabel === "string" && record.featureTagLabel.trim()
        ? record.featureTagLabel.trim()
        : undefined,
    featureTagTone:
      record.featureTagTone === "blue" ||
      record.featureTagTone === "green" ||
      record.featureTagTone === "red" ||
      record.featureTagTone === "orange"
        ? (record.featureTagTone as "orange" | "blue" | "green" | "red")
        : undefined,
    featureDescription:
      typeof record.featureDescription === "string" && record.featureDescription.trim()
        ? record.featureDescription.trim()
        : undefined,
    featureBullets: Array.isArray(record.featureBullets)
      ? record.featureBullets
          .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
          .map((item) => item.trim())
      : undefined
  };
}

export async function generateStructuredChat(
  request: CloudChatRequest
): Promise<StructuredChatResponse> {
  const qwenApiKey =
    Deno.env.get("DASHSCOPE_API_KEY") ??
    Deno.env.get("LLM_API_KEY");

  if (!qwenApiKey) {
    return {
      ...fallbackStructuredChat(request),
      debug: {
        source: "fallback",
        detail: "missing DASHSCOPE_API_KEY"
      }
    };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    const response = await fetch(`${DEFAULT_QWEN_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${qwenApiKey}`
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: DEFAULT_QWEN_MODEL,
        messages: [
          {
            role: "system",
            content: `${SYSTEM_PROMPT}\n当前 prompt 版本：${request.promptVersion ?? PROMPT_VERSION}`
          },
          {
            role: "user",
            content: JSON.stringify({
              prompt: request.prompt,
              symptom: request.symptom,
              encounterStatus: request.encounterStatus,
              preferredTime: request.preferredTime,
              expertPreference: request.expertPreference,
              delegationMode: request.delegationMode,
              appointment: request.appointment,
              location: request.location,
              recentHistory: request.recentHistory,
              outputInstruction:
                "请严格按指定字段返回一个 JSON 对象，不要输出数组，不要输出 schema 之外的解释文字。"
            })
          }
        ],
        response_format: {
          type: "json_schema",
          json_schema: CHAT_SCHEMA
        }
      })
    });
    clearTimeout(timeout);

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      return {
        ...fallbackStructuredChat(request),
        debug: {
          source: "fallback",
          detail: `http_${response.status}${errorText ? `:${errorText.slice(0, 240)}` : ""}`
        }
      };
    }

    const payload = await response.json();
    const outputText = (() => {
      const content = payload?.choices?.[0]?.message?.content;
      return typeof content === "string" ? content : null;
    })();

    if (!outputText || typeof outputText !== "string") {
      return {
        ...fallbackStructuredChat(request),
        debug: {
          source: "fallback",
          detail: "empty model output"
        }
      };
    }

    const parsed = parseModelPayload(outputText);

    if (!parsed) {
      return {
        ...fallbackStructuredChat(request),
        debug: {
          source: "fallback",
          detail: `schema_parse_failed:${outputText.slice(0, 240)}`
        }
      };
    }

    return {
      promptVersion: request.promptVersion ?? PROMPT_VERSION,
      nextStatus: parsed.nextStatus,
      messages: withIds(buildMessagesFromPayload(request, parsed)),
      debug: {
        source: "model"
      }
    };
  } catch (error) {
    return {
      ...fallbackStructuredChat(request),
      debug: {
        source: "fallback",
        detail: String(error)
      }
    };
  }
}
