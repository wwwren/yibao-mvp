import type { ChatMessage } from "@/types/chat";

export type EncounterStatus =
  | "SYMPTOM_INTAKE"
  | "TRIAGED"
  | "APPOINTMENT_CONFIRMED"
  | "ON_THE_WAY"
  | "ARRIVED_HOSPITAL"
  | "WAITING_PAYMENT"
  | "WAITING_RESULTS"
  | "PARTIAL_RESULT_READY"
  | "READY_FOR_PHARMACY"
  | "CARE_PLAN_READY";

export type LocationZone =
  | "home"
  | "commuting"
  | "hospital_gate"
  | "outpatient_floor"
  | "pharmacy";

export type DelegationMode = "self" | "family_proxy";

export type LocationSnapshot = {
  lat: number;
  lng: number;
  zone: LocationZone;
  label: string;
  distanceToHospitalMeters?: number;
};

export type AppointmentContext = {
  hospitalId: string;
  hospitalName: string;
  department: string;
  doctorName?: string;
  appointmentTime: string;
};

export type FamilyDelegate = {
  id: string;
  relation: string;
  name: string;
  phoneMasked: string;
  permissions: Array<"view_status" | "pay" | "receive_results" | "reschedule">;
};

export type VolunteerRequest = {
  id: string;
  pickupPoint: string;
  etaMinutes: number;
  note: string;
  status: "QUEUED" | "ASSIGNED";
};

export type CloudChatRequest = {
  sessionId: string;
  prompt: string;
  symptom: string;
  recentHistory?: string[];
  preferredTime?: string;
  expertPreference?: "normal" | "expert";
  appointment?: AppointmentContext;
  encounterStatus: EncounterStatus;
  location?: LocationSnapshot;
  delegationMode: DelegationMode;
};

export type CloudChatResponse = {
  promptVersion: string;
  messages: ChatMessage[];
  nextStatus?: EncounterStatus;
  debug?: {
    source: "model" | "fallback";
    detail?: string;
  };
};

export type SceneTriggerContext = {
  sessionId: string;
  encounterStatus: EncounterStatus;
  location: LocationSnapshot;
  appointment: AppointmentContext;
  delegationMode: DelegationMode;
  familyDelegate?: FamilyDelegate | null;
  volunteerRequest?: VolunteerRequest | null;
};

export type EncounterStatusUpdateRequest = {
  sessionId: string;
  encounterStatus: EncounterStatus;
  symptom?: string;
  delegationMode?: DelegationMode;
};
