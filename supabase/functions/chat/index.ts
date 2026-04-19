import { corsHeaders } from "../_shared/cors.ts";
import { createAdminClient } from "../_shared/supabase-admin.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const sessionId = body.sessionId;
    const prompt = body.prompt ?? "";
    const symptom = body.symptom ?? prompt ?? "";
    const encounterStatus = body.encounterStatus ?? "TRIAGED";
    const delegationMode = body.delegationMode ?? "self";

    if (!sessionId) {
      return new Response(JSON.stringify({ error: "Missing sessionId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const supabase = createAdminClient();

    await supabase.from("consultation_sessions").upsert(
      {
        id: sessionId,
        symptom,
        encounter_status: encounterStatus,
        delegation_mode: delegationMode,
        updated_at: new Date().toISOString()
      },
      { onConflict: "id" }
    );

    const messages = [
      {
        id: "supabase-chat-system",
        kind: "system",
        text: "云端已接收本轮症状描述，并完成会话入库。"
      },
      {
        id: "supabase-chat-assistant",
        kind: "text",
        role: "assistant",
        text: prompt
          ? `我收到了你的描述：“${prompt}”。后面这里可以替换成真实大模型输出。`
          : "我已经准备好接收你的症状描述。"
      }
    ];

    await supabase.from("chat_messages").insert([
      {
        session_id: sessionId,
        role: "user",
        kind: "text",
        payload: {
          prompt,
          symptom
        }
      },
      ...messages.map((message) => ({
        session_id: sessionId,
        role: message.kind === "system" ? "system" : "assistant",
        kind: message.kind,
        payload: message
      }))
    ]);

    return new Response(JSON.stringify({ messages, nextStatus: encounterStatus }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Chat function failed", detail: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
