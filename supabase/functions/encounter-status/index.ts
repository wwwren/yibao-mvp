import { corsHeaders } from "../_shared/cors.ts";
import { createAdminClient } from "../_shared/supabase-admin.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const sessionId = body.sessionId;
    const encounterStatus = body.encounterStatus;

    if (!sessionId || !encounterStatus) {
      return new Response(JSON.stringify({ error: "Missing sessionId or encounterStatus" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const supabase = createAdminClient();

    await supabase.from("consultation_sessions").upsert(
      {
        id: sessionId,
        symptom: body.symptom ?? null,
        encounter_status: encounterStatus,
        delegation_mode: body.delegationMode ?? "self",
        updated_at: new Date().toISOString()
      },
      { onConflict: "id" }
    );

    return new Response(JSON.stringify({ ok: true, nextStatus: encounterStatus }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Encounter status update failed", detail: String(error) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
