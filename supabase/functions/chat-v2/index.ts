import { corsHeaders } from "../_shared/cors.ts";
import { generateStructuredChat } from "../_shared/openai-chat.ts";
import { createAdminClient } from "../_shared/supabase-admin.ts";

function compactPayloadText(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const record = payload as Record<string, unknown>;

  if (typeof record.text === "string" && record.text.trim()) {
    return record.text.trim();
  }

  if (typeof record.title === "string" && Array.isArray(record.bullets)) {
    const bullets = record.bullets
      .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
      .slice(0, 2)
      .join("；");

    return bullets ? `${record.title}：${bullets}` : record.title;
  }

  if (typeof record.title === "string" && Array.isArray(record.rows)) {
    const rows = record.rows
      .filter(
        (row): row is { label: string; value: string } =>
          !!row &&
          typeof row === "object" &&
          typeof (row as { label?: unknown }).label === "string" &&
          typeof (row as { value?: unknown }).value === "string"
      )
      .slice(0, 2)
      .map((row) => `${row.label} ${row.value}`)
      .join("；");

    return rows ? `${record.title}：${rows}` : record.title;
  }

  if (typeof record.prompt === "string" && record.prompt.trim()) {
    return record.prompt.trim();
  }

  return null;
}

function formatRecentHistory(
  rows:
    | Array<{
        role: string | null;
        kind: string | null;
        payload: unknown;
      }>
    | null
) {
  if (!rows?.length) {
    return [];
  }

  return rows
    .reverse()
    .map((row) => {
      const text = compactPayloadText(row.payload);

      if (!text) {
        return null;
      }

      const role =
        row.role === "user" ? "用户" : row.role === "assistant" ? "助手" : "系统";

      return `${role}：${text}`;
    })
    .filter((item): item is string => Boolean(item))
    .slice(-8);
}

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
    const promptVersion = body.promptVersion;

    if (!sessionId) {
      return new Response(JSON.stringify({ error: "Missing sessionId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const supabase = createAdminClient();
    const { data: historyRows } = await supabase
      .from("chat_messages")
      .select("role, kind, payload")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: false })
      .limit(8);

    const generated = await generateStructuredChat({
      sessionId,
      prompt,
      symptom,
      recentHistory: formatRecentHistory(historyRows),
      preferredTime: body.preferredTime,
      expertPreference: body.expertPreference,
      appointment: body.appointment,
      encounterStatus,
      location: body.location,
      delegationMode,
      promptVersion
    });

    await supabase.from("consultation_sessions").upsert(
      {
        id: sessionId,
        symptom,
        encounter_status: generated.nextStatus,
        delegation_mode: delegationMode,
        updated_at: new Date().toISOString()
      },
      { onConflict: "id" }
    );

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
      ...generated.messages.map((message) => ({
        session_id: sessionId,
        role: message.kind === "system" ? "system" : "assistant",
        kind: message.kind,
        payload: message
      }))
    ]);

    return new Response(
      JSON.stringify({
        promptVersion: generated.promptVersion,
        messages: generated.messages,
        nextStatus: generated.nextStatus,
        debug: generated.debug
      }),
      {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: "Chat function failed", detail: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
