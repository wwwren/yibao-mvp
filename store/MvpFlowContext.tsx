import {
  createContext,
  PropsWithChildren,
  useContext,
  useMemo,
  useState
} from "react";

import { slotsByHospital } from "@/data/mock";

type ExpertPreference = "normal" | "expert";
type RiskAnswer = "yes" | "no" | null;

type FlowState = {
  symptom: string;
  riskAnswer: RiskAnswer;
  department: string;
  hospitalId: string;
  preferredTime: string;
  expertPreference: ExpertPreference;
  slotId: string;
};

type FlowContextValue = FlowState & {
  setSymptom: (value: string) => void;
  setRiskAnswer: (value: RiskAnswer) => void;
  setDepartment: (value: string) => void;
  setHospitalId: (value: string) => void;
  setPreferredTime: (value: string) => void;
  setExpertPreference: (value: ExpertPreference) => void;
  setSlotId: (value: string) => void;
  resetFlow: () => void;
};

const initialState: FlowState = {
  symptom: "",
  riskAnswer: "no",
  department: "呼吸内科",
  hospitalId: "zju-1",
  preferredTime: "今天下午",
  expertPreference: "normal",
  slotId: "slot-1"
};

const FlowContext = createContext<FlowContextValue | null>(null);

export function MvpFlowProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<FlowState>(initialState);

  const value = useMemo<FlowContextValue>(
    () => ({
      ...state,
      setSymptom: (symptom) => setState((prev) => ({ ...prev, symptom })),
      setRiskAnswer: (riskAnswer) =>
        setState((prev) => ({ ...prev, riskAnswer })),
      setDepartment: (department) =>
        setState((prev) => ({ ...prev, department })),
      setHospitalId: (hospitalId) =>
        setState((prev) => ({
          ...prev,
          hospitalId,
          slotId: slotsByHospital[hospitalId]?.[0]?.id ?? prev.slotId
        })),
      setPreferredTime: (preferredTime) =>
        setState((prev) => ({ ...prev, preferredTime })),
      setExpertPreference: (expertPreference) =>
        setState((prev) => ({ ...prev, expertPreference })),
      setSlotId: (slotId) => setState((prev) => ({ ...prev, slotId })),
      resetFlow: () => setState(initialState)
    }),
    [state]
  );

  return <FlowContext.Provider value={value}>{children}</FlowContext.Provider>;
}

export function useMvpFlow() {
  const context = useContext(FlowContext);

  if (!context) {
    throw new Error("useMvpFlow must be used within MvpFlowProvider");
  }

  return context;
}
