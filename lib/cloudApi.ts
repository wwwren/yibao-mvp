import { buildChatPrompt, PROMPT_VERSION } from "@/lib/prompting";
import { buildScenePushMessages } from "@/lib/sceneEngine";
import type {
  CloudChatRequest,
  CloudChatResponse,
  EncounterStatus,
  EncounterStatusUpdateRequest,
  FamilyDelegate,
  SceneTriggerContext,
  VolunteerRequest
} from "@/types/backend";

function delay<T>(payload: T, ms = 120) {
  return new Promise<T>((resolve) => {
    setTimeout(() => resolve(payload), ms);
  });
}

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim();

async function postFunction<TResponse>(name: string, payload: unknown): Promise<TResponse | null> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return null;
  }

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as TResponse;
  } catch {
    return null;
  }
}

export async function sendStructuredChat(request: CloudChatRequest): Promise<CloudChatResponse> {
  const promptPacket = buildChatPrompt(request);
  const remote = await postFunction<CloudChatResponse>("chat-v2", {
    ...request,
    promptVersion: promptPacket.version
  });

  if (remote) {
    return remote;
  }

  return delay({
    promptVersion: promptPacket.version,
    messages: [
      {
        id: "cloud-chat-system",
        kind: "system",
        text: `云端对话已按 ${promptPacket.version} 版本提示词完成编排。`
      }
    ],
    nextStatus: request.encounterStatus
  });
}

export async function updateEncounterStatus(request: EncounterStatusUpdateRequest) {
  const remote = await postFunction<{ ok: boolean; nextStatus: EncounterStatus }>(
    "encounter-status",
    request
  );

  if (remote) {
    return remote;
  }

  return delay({
    ok: true,
    nextStatus: request.encounterStatus
  });
}

export async function triggerScenePush(context: SceneTriggerContext) {
  const remote = await postFunction<{ ok: boolean; messages: ReturnType<typeof buildScenePushMessages> }>(
    "scene-push-v2",
    context
  );

  if (remote) {
    return remote;
  }

  return delay({
    ok: true,
    messages: buildScenePushMessages(context)
  });
}

export async function enableFamilyDelegate(): Promise<FamilyDelegate> {
  return delay({
    id: "delegate-1",
    relation: "女儿",
    name: "王女士",
    phoneMasked: "138****8821",
    permissions: ["view_status", "pay", "receive_results", "reschedule"]
  });
}

export async function createVolunteerRequest(): Promise<VolunteerRequest> {
  return delay({
    id: "volunteer-1",
    pickupPoint: "门诊大厅服务台",
    etaMinutes: 6,
    note: "志愿者会陪同前往缴费机和药房",
    status: "ASSIGNED"
  });
}

export function getCloudArchitectureSnapshot() {
  return {
    promptVersion: PROMPT_VERSION,
    endpoints: [
      "POST /chat",
      "POST /encounter-status",
      "POST /scene-push-v2",
      "POST /delegation/invite",
      "POST /volunteer/request"
    ]
  };
}
