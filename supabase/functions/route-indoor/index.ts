import { corsHeaders } from "../_shared/cors.ts";
import { buildIndoorRoutePlan } from "../_shared/route-planning.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const hospital = body.hospital ?? {};
    const department = body.department;
    const focus = body.focus;

    if (!hospital.name || !department || !focus) {
      return new Response(JSON.stringify({ error: "Missing hospital, department, or focus" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const plan = buildIndoorRoutePlan({
      hospitalName: hospital.name,
      hospitalLat: hospital.lat ?? 0,
      hospitalLng: hospital.lng ?? 0,
      department,
      focus
    });

    return new Response(JSON.stringify({ plan }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Invalid request", detail: String(error) }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
