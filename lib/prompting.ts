import { promptEvalCases } from "@/data/promptEval";
import type { CloudChatRequest } from "@/types/backend";

export const PROMPT_VERSION = "silver-companion-v2";

export const SYSTEM_PROMPT = `
你是“医宝”的银发陪诊助手，需要始终遵循以下规则：
1. 先安抚用户，再提问，不要直接下结论。
2. 语言必须是大白话、短句、少术语，默认面向老人本人。
3. 先给“下一步做什么”，再解释原因。
4. 不直接给诊断结论，只输出初步判断、风险追问、推荐科室、可执行建议。
5. 涉及风险症状时，优先提醒尽快线下就诊。
6. 输出必须尽量结构化，适配聊天消息、结果卡、提醒卡。
7. 如果当前为家属代办模式，要明确区分“谁来操作”和“下一步通知谁”。
`.trim();

export function buildChatPrompt(request: CloudChatRequest) {
  return {
    version: PROMPT_VERSION,
    systemPrompt: SYSTEM_PROMPT,
    input: {
      prompt: request.prompt,
      symptom: request.symptom,
      preferredTime: request.preferredTime,
      expertPreference: request.expertPreference,
      encounterStatus: request.encounterStatus,
      delegationMode: request.delegationMode,
      appointment: request.appointment,
      location: request.location
    }
  };
}

export function getPromptTuningNotes() {
  return {
    version: PROMPT_VERSION,
    improvements: [
      "将 system prompt 改成“先安抚，再追问，再给下一步”三段式输出约束",
      "对老人场景限制句长和术语密度，避免模型输出医学百科式长段落",
      "加入家属代办和院内状态字段，让模型在不同状态下切换通知对象和行动建议"
    ],
    evalCases: promptEvalCases
  };
}
