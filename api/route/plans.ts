import { buildMockRoutePlans } from "../../lib/routePlanning";

type PlansRequestBody = {
  origin?: {
    lat?: number;
    lng?: number;
    zone?: string;
    label?: string;
    distanceToHospitalMeters?: number;
  };
  destination?: {
    hospitalId?: string;
    hospitalName?: string;
    lat?: number;
    lng?: number;
  };
};

export default function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method Not Allowed" });
    return;
  }

  const body = (req.body ?? {}) as PlansRequestBody;

  if (!body.origin || !body.destination?.hospitalId || !body.destination.hospitalName) {
    res.status(400).json({ error: "Missing origin or destination" });
    return;
  }

  const plans = buildMockRoutePlans({
    origin: {
      lat: body.origin.lat ?? 0,
      lng: body.origin.lng ?? 0,
      zone: (body.origin.zone as any) ?? "commuting",
      label: body.origin.label ?? "前往医院途中",
      distanceToHospitalMeters: body.origin.distanceToHospitalMeters ?? 1200
    },
    hospital: {
      id: body.destination.hospitalId,
      name: body.destination.hospitalName,
      meta: "",
      tag: "",
      lat: body.destination.lat ?? 0,
      lng: body.destination.lng ?? 0
    }
  });

  res.status(200).json({ plans });
}
