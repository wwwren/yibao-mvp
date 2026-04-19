import { corsHeaders } from "../_shared/cors.ts";
import { buildRoutePlans } from "../_shared/route-planning.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const origin = body.origin ?? {};
    const destination = body.destination ?? {};

    if (!destination.hospitalName) {
      return new Response(JSON.stringify({ error: "Missing hospitalName" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const plans = buildRoutePlans({
      hospitalName: destination.hospitalName,
      hospitalLat: destination.lat ?? 0,
      hospitalLng: destination.lng ?? 0,
      distanceToHospitalMeters: origin.distanceToHospitalMeters ?? 1200
    });

    return new Response(JSON.stringify({ plans }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Invalid request", detail: String(error) }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
