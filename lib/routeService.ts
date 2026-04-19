import { Linking } from "react-native";

import type { Hospital } from "@/data/mock";
import {
  buildMockIndoorRoutePlan,
  buildMockRoutePlans,
  type RoutePlan,
  type RouteStep,
  type RouteStepKind
} from "@/lib/routePlanning";
import type { LocationSnapshot } from "@/types/backend";
import type { MapMode, MapPointKind } from "@/types/chat";

type RouteContext = {
  origin: LocationSnapshot;
  hospital: Hospital;
};

type IndoorRouteContext = {
  hospital: Hospital;
  department: string;
  focus: MapPointKind;
};

type RoutePlansApiRequest = {
  origin: LocationSnapshot;
  destination: {
    hospitalId: string;
    hospitalName: string;
    lat: number;
    lng: number;
  };
};

type RoutePlansApiResponse = {
  plans: Record<MapMode, RoutePlan>;
};

type IndoorRouteApiRequest = {
  hospital: {
    id: string;
    name: string;
    lat: number;
    lng: number;
  };
  department: string;
  focus: MapPointKind;
};

type IndoorRouteApiResponse = {
  plan: RoutePlan;
};

const ROUTE_API_BASE_URL = process.env.EXPO_PUBLIC_ROUTE_API_BASE_URL?.trim();
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim();

async function postRouteJson<TResponse>(
  path: string,
  payload: unknown
): Promise<TResponse | null> {
  const directBase = ROUTE_API_BASE_URL;
  const supabaseBase = SUPABASE_URL ? `${SUPABASE_URL}/functions/v1` : "";
  const functionPath =
    path === "/route/plans"
      ? "/route-plans"
      : path === "/route/indoor"
        ? "/route-indoor"
        : path;
  const requestUrl = directBase
    ? `${directBase}${path}`
    : supabaseBase
      ? `${supabaseBase}${functionPath}`
      : "";

  if (!requestUrl) {
    return null;
  }

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json"
    };

    if (!directBase && SUPABASE_ANON_KEY) {
      headers.apikey = SUPABASE_ANON_KEY;
      headers.Authorization = `Bearer ${SUPABASE_ANON_KEY}`;
    }

    const response = await fetch(requestUrl, {
      method: "POST",
      headers,
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

export async function getRoutePlans({
  origin,
  hospital
}: RouteContext): Promise<Record<MapMode, RoutePlan>> {
  const payload: RoutePlansApiRequest = {
    origin,
    destination: {
      hospitalId: hospital.id,
      hospitalName: hospital.name,
      lat: hospital.lat,
      lng: hospital.lng
    }
  };

  const remote = await postRouteJson<RoutePlansApiResponse>("/route/plans", payload);

  if (remote?.plans?.taxi && remote.plans.transit && remote.plans.drive) {
    return remote.plans;
  }

  return buildMockRoutePlans({ origin, hospital });
}

export async function getIndoorRoutePlan({
  hospital,
  department,
  focus
}: IndoorRouteContext): Promise<RoutePlan> {
  const payload: IndoorRouteApiRequest = {
    hospital: {
      id: hospital.id,
      name: hospital.name,
      lat: hospital.lat,
      lng: hospital.lng
    },
    department,
    focus
  };

  const remote = await postRouteJson<IndoorRouteApiResponse>("/route/indoor", payload);

  if (remote?.plan) {
    return remote.plan;
  }

  return buildMockIndoorRoutePlan({ hospital, department, focus });
}

export async function openExternalNavigation(url: string) {
  await Linking.openURL(url);
}

export { buildMockRoutePlans as buildRoutePlans, buildMockIndoorRoutePlan as buildIndoorRoutePlan };
export type { RoutePlan, RouteStep, RouteStepKind };
