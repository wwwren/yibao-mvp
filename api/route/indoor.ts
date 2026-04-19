import { buildMockIndoorRoutePlan } from "../../lib/routePlanning";

type IndoorRequestBody = {
  hospital?: {
    id?: string;
    name?: string;
    lat?: number;
    lng?: number;
  };
  department?: string;
  focus?: "entrance" | "parking" | "triage" | "pharmacy";
};

export default function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method Not Allowed" });
    return;
  }

  const body = (req.body ?? {}) as IndoorRequestBody;

  if (!body.hospital?.id || !body.hospital.name || !body.department || !body.focus) {
    res.status(400).json({ error: "Missing hospital, department, or focus" });
    return;
  }

  const plan = buildMockIndoorRoutePlan({
    hospital: {
      id: body.hospital.id,
      name: body.hospital.name,
      meta: "",
      tag: "",
      lat: body.hospital.lat ?? 0,
      lng: body.hospital.lng ?? 0
    },
    department: body.department,
    focus: body.focus
  });

  res.status(200).json({ plan });
}
