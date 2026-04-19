import { corsHeaders } from "../_shared/cors.ts";
import { buildScenePushMessages } from "../_shared/scene-messages.ts";
import { createAdminClient } from "../_shared/supabase-admin.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const sessionId = body.sessionId;
    const encounterStatus = body.encounterStatus ?? "ON_THE_WAY";
    const zone = body.location?.zone ?? "commuting";

    if (!sessionId) {
      return new Response(JSON.stringify({ error: "Missing sessionId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const supabase = createAdminClient();
    const messages = buildScenePushMessages(body);

    await supabase.from("consultation_sessions").upsert(
      {
        id: sessionId,
        encounter_status: encounterStatus,
        delegation_mode: body.delegationMode ?? "self",
        updated_at: new Date().toISOString()
      },
      { onConflict: "id" }
    );

    await supabase.from("scene_events").insert({
      session_id: sessionId,
      event_type: "scene_push",
      encounter_status: encounterStatus,
      location_zone: zone,
      payload: body
    });

    if (messages.length) {
      await supabase.from("chat_messages").insert(
        messages.map((message: any) => ({
          session_id: sessionId,
          role: message.kind === "system" ? "system" : "assistant",
          kind: message.kind,
          payload: message
        }))
      );
    }

    return new Response(JSON.stringify({ ok: true, messages }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Scene push failed", detail: String(error) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
