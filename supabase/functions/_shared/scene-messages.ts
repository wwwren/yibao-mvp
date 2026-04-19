type EncounterStatus =
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

type DelegationMode = "self" | "family_proxy";

type SceneTriggerContext = {
  sessionId: string;
  encounterStatus: EncounterStatus;
  location: {
    zone: "home" | "commuting" | "hospital_gate" | "outpatient_floor" | "pharmacy";
    label?: string;
  };
  appointment: {
    hospitalId: string;
    hospitalName: string;
    department: string;
    doctorName?: string;
    appointmentTime: string;
  };
  delegationMode: DelegationMode;
  familyDelegate?: {
    id: string;
    relation: string;
    name: string;
    phoneMasked: string;
    permissions: string[];
  } | null;
  volunteerRequest?: {
    id: string;
    pickupPoint: string;
    etaMinutes: number;
    note: string;
  } | null;
};

export function buildScenePushMessages(context: SceneTriggerContext) {
  const messages: any[] = [];

  if (
    context.encounterStatus === "WAITING_PAYMENT" &&
    context.location.zone === "outpatient_floor"
  ) {
    messages.push(
      {
        id: "scene-payment-system",
        kind: "system",
        text: "已经到门诊楼里了，我先把缴费这一步提前提醒你，避免后面重复排队。"
      },
      {
        id: "scene-payment-card",
        kind: "summaryCard",
        title: "待缴费提醒",
        rows: [
          { label: "当前动作", value: "先完成挂号/检查费用支付，再去分诊台候诊" },
          { label: "建议位置", value: "门诊 3 楼自助缴费机，或直接走人工窗口" },
          { label: "处理状态", value: "缴费后我会继续提醒你看结果和取药" }
        ]
      }
    );
  }

  if (
    context.encounterStatus === "ARRIVED_HOSPITAL" &&
    context.location.zone === "hospital_gate"
  ) {
    messages.push(
      {
        id: "scene-arrival-system",
        kind: "system",
        text: "检测到你已经到院附近，我先把最容易漏掉的第一步提醒你。"
      },
      {
        id: "scene-arrival-card",
        kind: "summaryCard",
        title: "到院提醒",
        rows: [
          { label: "下一步", value: `先去门诊 3 楼 ${context.appointment.department}分诊台报到` },
          { label: "时间", value: context.appointment.appointmentTime },
          {
            label: "提醒对象",
            value: context.delegationMode === "family_proxy" ? "已同步给代办亲属" : "当前本人处理"
          }
        ]
      }
    );
  }

  if (
    context.encounterStatus === "PARTIAL_RESULT_READY" &&
    context.location.zone === "outpatient_floor"
  ) {
    messages.push(
      {
        id: "scene-result-system",
        kind: "system",
        text: "有一部分检查结果先出来了，我先把该做的动作推给你。"
      },
      {
        id: "scene-result-card",
        kind: "summaryCard",
        title: "结果部分已出",
        rows: [
          { label: "已出结果", value: "影像结果已回传，可带着结果回门诊继续看" },
          { label: "未出结果", value: "血液相关检查预计 12 分钟后继续更新" }
        ]
      }
    );
  }

  if (
    context.encounterStatus === "READY_FOR_PHARMACY" &&
    context.location.zone === "outpatient_floor"
  ) {
    messages.push(
      {
        id: "scene-pharmacy-system",
        kind: "system",
        text: "医生处方已经同步好，我把取药动作单独提到前面。"
      },
      {
        id: "scene-pharmacy-card",
        kind: "summaryCard",
        title: "取药提醒",
        rows: [
          { label: "窗口", value: "门诊 1 楼西侧 3 号窗口" },
          { label: "状态", value: "处方已同步，预计排队 6 分钟" }
        ]
      }
    );
  }

  if (context.volunteerRequest) {
    messages.push({
      id: `scene-volunteer-${context.volunteerRequest.id}`,
      kind: "summaryCard",
      title: "志愿者协助已发起",
      rows: [
        { label: "集合点", value: context.volunteerRequest.pickupPoint },
        { label: "预计到达", value: `${context.volunteerRequest.etaMinutes} 分钟` },
        { label: "备注", value: context.volunteerRequest.note }
      ]
    });
  }

  if (context.familyDelegate && context.delegationMode === "family_proxy") {
    messages.push({
      id: `scene-family-${context.familyDelegate.id}`,
      kind: "summaryCard",
      title: "家属代办已开启",
      rows: [
        {
          label: "代办人",
          value: `${context.familyDelegate.relation} · ${context.familyDelegate.name} · ${context.familyDelegate.phoneMasked}`
        },
        {
          label: "权限",
          value: context.familyDelegate.permissions.join(" / ")
        }
      ]
    });
  }

  return messages;
}
