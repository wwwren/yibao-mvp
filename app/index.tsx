import { useEffect, useMemo, useState } from "react";

import { ChatComposer } from "@/components/ChatComposer";
import type { ComposerAction } from "@/components/ChatComposer";
import { ChatScreen } from "@/components/ChatScreen";
import { MessageRenderer } from "@/components/MessageRenderer";
import { hospitals, symptomSuggestions } from "@/data/mock";
import {
  sendStructuredChat,
  createVolunteerRequest,
  enableFamilyDelegate,
  triggerScenePush,
  updateEncounterStatus
} from "@/lib/cloudApi";
import {
  getSlotsForHospital,
  getSymptomProfile,
  parsePreferenceText,
  parseRiskAnswer
} from "@/lib/chatEngine";
import { useMvpFlow } from "@/store/MvpFlowContext";
import {
  buildIndoorRoutePlan,
  buildRoutePlans,
  getIndoorRoutePlan,
  getRoutePlans,
  openExternalNavigation
} from "@/lib/routeService";
import type {
  DelegationMode,
  EncounterStatus,
  FamilyDelegate,
  LocationSnapshot,
  LocationZone,
  VolunteerRequest
} from "@/types/backend";
import type { ChatMessage } from "@/types/chat";

export default function ConsultationScreen() {
  const createSessionId = () =>
    globalThis.crypto?.randomUUID?.() ?? `session-${Date.now()}`;

  const [step, setStep] = useState(0);
  const [sessionId, setSessionId] = useState(createSessionId);
  const [draftMessage, setDraftMessage] = useState("");
  const [userReplies, setUserReplies] = useState<Record<string, string>>({});
  const [transportMode, setTransportMode] = useState<"taxi" | "transit" | "drive">("taxi");
  const [mapFocus, setMapFocus] = useState<"entrance" | "parking" | "triage" | "pharmacy">(
    "entrance"
  );
  const [demoEncounterStatus, setDemoEncounterStatus] = useState<EncounterStatus | null>(null);
  const [demoLocationZone, setDemoLocationZone] = useState<LocationZone | null>(null);
  const [statusTimeline, setStatusTimeline] = useState<
    Array<{ id: string; label: string; status: EncounterStatus; zone: LocationZone }>
  >([]);
  const [delegationMode, setDelegationMode] = useState<DelegationMode>("self");
  const [familyDelegate, setFamilyDelegate] = useState<FamilyDelegate | null>(null);
  const [volunteerRequest, setVolunteerRequest] = useState<VolunteerRequest | null>(null);
  const [sceneMessages, setSceneMessages] = useState<ChatMessage[]>([]);
  const [cloudTurns, setCloudTurns] = useState<Record<string, ChatMessage[]>>({});
  const [waitingForCloud, setWaitingForCloud] = useState<string | null>(null);
  const [queuedInputs, setQueuedInputs] = useState<string[]>([]);
  const {
    symptom,
    setSymptom,
    riskAnswer,
    setRiskAnswer,
    setDepartment,
    hospitalId,
    setHospitalId,
    preferredTime,
    expertPreference,
    setPreferredTime,
    setExpertPreference,
    slotId,
    setSlotId,
    resetFlow
  } = useMvpFlow();

  const selectedHospital =
    hospitals.find((item) => item.id === hospitalId) ?? hospitals[0];
  const profile = getSymptomProfile(symptom || "咳嗽");
  const availableSlots = getSlotsForHospital(profile.key, selectedHospital.id);
  const selectedSlot =
    availableSlots.find((item) => item.id === slotId) ?? availableSlots[0];

  const setReply = (key: string, value: string) => {
    setUserReplies((prev) => ({ ...prev, [key]: value }));
  };

  const setCloudTurn = (turnKey: string, messages: ChatMessage[]) => {
    setCloudTurns((prev) => ({
      ...prev,
      [turnKey]: messages
    }));
  };

  const getCloudTurn = (turnKey: string) => cloudTurns[turnKey] ?? [];

  const persistPrompt = (
    turnKey: string,
    prompt: string,
    options?: {
      symptomOverride?: string;
      encounterStatusOverride?: EncounterStatus;
      onSettled?: () => void;
    }
  ) => {
    if (!prompt.trim()) {
      return;
    }

    setWaitingForCloud(turnKey);
    setCloudTurn(turnKey, [
      {
        id: `${turnKey}-loading`,
        kind: "system",
        text: "医宝正在整理这一轮建议，请稍等一下。"
      }
    ]);

    void sendStructuredChat({
      sessionId,
      prompt,
      symptom: options?.symptomOverride ?? symptom ?? prompt,
      preferredTime,
      expertPreference,
      appointment:
        hospitalId && selectedHospital && selectedSlot
          ? {
              hospitalId: selectedHospital.id,
              hospitalName: selectedHospital.name,
              department: profile.department,
              doctorName: selectedSlot.doctor,
              appointmentTime: preferredTime === "今天下午" ? "今天 14:30" : "明天 09:30"
            }
          : undefined,
      encounterStatus: options?.encounterStatusOverride ?? effectiveEncounterStatus,
      location: effectiveLocationSnapshot,
      delegationMode
    })
      .then((response) => {
        if (!response?.messages?.length) {
          setCloudTurn(turnKey, []);
          return;
        }

        const batchId = globalThis.crypto?.randomUUID?.() ?? `cloud-${Date.now()}`;
        const stampedMessages = response.messages.map((message, index) => ({
          ...message,
          id: `${batchId}-${index + 1}-${message.id}`
        }));

        setCloudTurn(turnKey, stampedMessages);
      })
      .catch(() => {
        setCloudTurn(turnKey, [
          {
            id: `${turnKey}-error`,
            kind: "system",
            text: "这一轮建议暂时没整理出来，你可以再试一次。"
          }
        ]);
      })
      .finally(() => {
        setWaitingForCloud((current) => (current === turnKey ? null : current));
        options?.onSettled?.();
      });
  };

  const locationSnapshot = useMemo<LocationSnapshot>(
    () => ({
      lat: 30.2741,
      lng: 120.1551,
      zone:
        step >= 13
          ? "pharmacy"
          : step >= 11
            ? "outpatient_floor"
            : step >= 10
              ? "hospital_gate"
              : step >= 9
                ? "commuting"
                : "home",
      label:
        step >= 13
          ? "门诊 1 楼药房"
          : step >= 11
            ? "门诊 3 楼"
            : step >= 10
              ? `${selectedHospital.name} 门诊入口`
              : step >= 9
                ? "前往医院途中"
                : "居家",
      distanceToHospitalMeters: step >= 10 ? 80 : step >= 9 ? 1200 : 6800
    }),
    [selectedHospital.name, step]
  );

  const baseEncounterStatus = useMemo<EncounterStatus>(
    () =>
      step >= 14
        ? "CARE_PLAN_READY"
        : step >= 13
          ? "READY_FOR_PHARMACY"
          : step >= 11
            ? "PARTIAL_RESULT_READY"
            : step >= 10
              ? "WAITING_RESULTS"
              : step >= 9
                ? "ARRIVED_HOSPITAL"
                : step >= 8
                  ? "ON_THE_WAY"
                  : step >= 7
                    ? "APPOINTMENT_CONFIRMED"
                    : step >= 2
                      ? "TRIAGED"
                      : "SYMPTOM_INTAKE",
    [step]
  );

  const effectiveEncounterStatus = demoEncounterStatus ?? baseEncounterStatus;

  const effectiveLocationSnapshot = useMemo<LocationSnapshot>(() => {
    if (!demoLocationZone) {
      return locationSnapshot;
    }

    const zoneMeta: Record<LocationZone, Pick<LocationSnapshot, "label" | "distanceToHospitalMeters">> = {
      home: {
        label: "居家",
        distanceToHospitalMeters: 6800
      },
      commuting: {
        label: "前往医院途中",
        distanceToHospitalMeters: 1200
      },
      hospital_gate: {
        label: `${selectedHospital.name} 门诊入口`,
        distanceToHospitalMeters: 80
      },
      outpatient_floor: {
        label: "门诊 3 楼",
        distanceToHospitalMeters: 20
      },
      pharmacy: {
        label: "门诊 1 楼药房",
        distanceToHospitalMeters: 10
      }
    };

    return {
      ...locationSnapshot,
      zone: demoLocationZone,
      label: zoneMeta[demoLocationZone].label,
      distanceToHospitalMeters: zoneMeta[demoLocationZone].distanceToHospitalMeters
    };
  }, [demoLocationZone, locationSnapshot, selectedHospital.name]);

  const [routePlans, setRoutePlans] = useState(() =>
    buildRoutePlans({
      origin: locationSnapshot,
      hospital: selectedHospital
    })
  );
  const [indoorRoutePlan, setIndoorRoutePlan] = useState(() =>
    buildIndoorRoutePlan({
      hospital: selectedHospital,
      department: profile.department,
      focus: mapFocus
    })
  );

  const activeRoutePlan = routePlans[transportMode];

  const resetConversation = () => {
    resetFlow();
    setSessionId(createSessionId());
    setDraftMessage("");
    setUserReplies({});
    setTransportMode("taxi");
    setMapFocus("entrance");
    setDemoEncounterStatus(null);
    setDemoLocationZone(null);
    setStatusTimeline([]);
    setDelegationMode("self");
    setFamilyDelegate(null);
    setVolunteerRequest(null);
    setSceneMessages([]);
    setCloudTurns({});
    setWaitingForCloud(null);
    setQueuedInputs([]);
    setStep(0);
  };

  const processInput = (nextText: string) => {
    if (/重新开始|重来|重新问|reset/i.test(nextText)) {
      resetConversation();
      return;
    }

    if (step >= 8 && /家属|女儿|儿子|代办/.test(nextText)) {
      void activateFamilyProxy(nextText);
      return;
    }

    if (step >= 10 && /志愿者|人工|帮忙|协助/.test(nextText)) {
      void requestVolunteerHelp(nextText);
      return;
    }

    if (step === 0) {
      submitSymptom(nextText, nextText);
      return;
    }

    if (step === 1) {
      submitRiskAnswer(parseRiskAnswer(nextText), nextText);
      return;
    }

    if (step === 2) {
      setReply("needHospital", nextText);
      setDraftMessage("");
      setStep(3);
      return;
    }

    if (step === 3) {
      setReply("department", nextText);
      setDraftMessage("");
      setStep(4);
      return;
    }

    if (step === 4) {
      const nextHospitalId = resolveHospitalFromText(nextText) ?? hospitals[0]?.id;

      if (nextHospitalId) {
        handleHospitalSelect(nextHospitalId, nextText);
      }
      setDraftMessage("");
      return;
    }

    if (step === 5) {
      submitPreferenceText(nextText, nextText);
      return;
    }

    if (step === 6) {
      const nextSlotId = resolveSlotFromText(nextText) ?? availableSlots[0]?.id;

      if (nextSlotId) {
        handleSlotSelect(nextSlotId, nextText);
      }
      setDraftMessage("");
      return;
    }

    if (step === 7) {
      setReply("confirm", nextText);
      setDraftMessage("");

      if (/改|换|重新/.test(nextText)) {
        setStep(5);
      } else {
        setStep(8);
      }
      return;
    }

    if (step === 8) {
      submitTransportChoice(resolveTransportFromText(nextText), nextText);
      return;
    }

    if (step === 9) {
      submitDeparturePlan(nextText);
      return;
    }

    if (step === 10) {
      submitPaymentReply(nextText);
      return;
    }

    if (step === 11) {
      submitResultReply(nextText);
      return;
    }

    if (step === 12) {
      submitPharmacyReply(nextText);
      return;
    }

    if (step === 13) {
      submitCareReply(nextText);
    }
  };

  const submitSymptom = (value: string, replyText?: string) => {
    const nextProfile = getSymptomProfile(value);
    const persistedText = replyText ?? value;

    setSymptom(value);
    setDepartment(nextProfile.department);
    setSlotId(getSlotsForHospital(nextProfile.key, hospitalId)[0]?.id ?? slotId);
    setDraftMessage("");
    setReply("symptom", persistedText);
    persistPrompt("symptom", persistedText, {
      symptomOverride: value,
      encounterStatusOverride: "SYMPTOM_INTAKE",
      onSettled: () => {
        setStep((current) => (current === 0 ? 1 : current));
      }
    });
  };

  const submitRiskAnswer = (value: "yes" | "no", replyText?: string) => {
    setRiskAnswer(value);
    setDraftMessage("");
    const persistedText =
      replyText ??
      (value === "yes"
        ? "有一点发热，但还没有呼吸困难。"
        : "没有，就是一直咳，但没有发烧。");

    setReply("risk", persistedText);
    persistPrompt("risk", persistedText, {
      onSettled: () => {
        setStep((current) => (current === 1 ? 2 : current));
      }
    });
  };

  const submitPreferenceText = (value: string, replyText?: string) => {
    const parsed = parsePreferenceText(value);

    if (parsed.preferredTime) {
      setPreferredTime(parsed.preferredTime);
    }

    if (parsed.expertPreference) {
      setExpertPreference(parsed.expertPreference);
    }

    setDraftMessage("");
    const persistedText = replyText ?? value;
    setReply("preference", persistedText);
    persistPrompt("preference", persistedText, {
      onSettled: () => {
        setStep((current) => (current === 5 ? 6 : current));
      }
    });
  };

  const handleHospitalSelect = (value: string, replyText?: string) => {
    setHospitalId(value);
    setSlotId(getSlotsForHospital(profile.key, value)[0]?.id ?? slotId);
    const persistedText =
      replyText ??
      `那就先去 ${hospitals.find((item) => item.id === value)?.name ?? selectedHospital.name} 吧。`;

    setReply("hospital", persistedText);
    persistPrompt("hospital", persistedText, {
      onSettled: () => {
        setStep((current) => (current === 4 ? 5 : current));
      }
    });
  };

  const handleSlotSelect = (value: string, replyText?: string) => {
    setSlotId(value);
    const persistedText =
      replyText ??
      `我想约 ${
        availableSlots.find((item) => item.id === value)?.doctor ??
        selectedSlot?.doctor ??
        "这个医生"
      } 这个号。`;

    setReply("slot", persistedText);
    persistPrompt("slot", persistedText, {
      onSettled: () => {
        setStep((current) => (current === 6 ? 7 : current));
      }
    });
  };

  const submitTransportChoice = (
    value: "taxi" | "transit" | "drive",
    replyText?: string
  ) => {
    setTransportMode(value);
    setMapFocus(value === "drive" ? "parking" : "entrance");
    const persistedText =
      replyText ??
      (value === "taxi"
        ? "帮我直接打车过去。"
        : value === "transit"
          ? "我想先看看公交路线。"
          : "我自己开车去，顺便告诉我停车。");

    setReply("arrival", persistedText);
    persistPrompt("arrival", persistedText, {
      encounterStatusOverride: "ON_THE_WAY",
      onSettled: () => {
        setStep((current) => (current === 8 ? 9 : current));
      }
    });
    setDraftMessage("");
  };

  const mapFocusMeta = {
    entrance: "门诊楼主入口，进门后右转可看到导诊屏和电梯厅。",
    parking: "停车后从 B2 电梯上到 1 楼，再按导向牌前往门诊楼。",
    triage: `当前候诊目标点，位于门诊 3 楼 ${profile.department}分诊台。`,
    pharmacy: "药房位于门诊 1 楼西侧，拿药前先确认电子处方已同步。"
  } as const;

  const triggerDemoStatus = (status: EncounterStatus, zone: LocationZone, label: string) => {
    setDemoEncounterStatus(status);
    setDemoLocationZone(zone);
    setStatusTimeline((prev) => [
      ...prev,
      {
        id: globalThis.crypto?.randomUUID?.() ?? `${status}-${Date.now()}`,
        label,
        status,
        zone
      }
    ]);
  };

  const resetDemoStatus = () => {
    setDemoEncounterStatus(null);
    setDemoLocationZone(null);
  };

  const encounterStatusLabels: Record<EncounterStatus, string> = {
    SYMPTOM_INTAKE: "症状输入",
    TRIAGED: "已完成分诊",
    APPOINTMENT_CONFIRMED: "已确认挂号",
    ON_THE_WAY: "前往医院中",
    ARRIVED_HOSPITAL: "已到院",
    WAITING_PAYMENT: "待缴费",
    WAITING_RESULTS: "待结果",
    PARTIAL_RESULT_READY: "结果已出",
    READY_FOR_PHARMACY: "待取药",
    CARE_PLAN_READY: "诊后计划已生成"
  };

  const locationZoneLabels: Record<LocationZone, string> = {
    home: "居家",
    commuting: "前往医院途中",
    hospital_gate: "医院门口",
    outpatient_floor: "门诊楼内",
    pharmacy: "药房区域"
  };

  const submitDeparturePlan = (replyText?: string) => {
    setMapFocus("triage");
    const persistedText = replyText ?? "好的，到了时间提醒我出发。";
    setReply("departure", persistedText);
    persistPrompt("departure", persistedText, {
      encounterStatusOverride: "ARRIVED_HOSPITAL",
      onSettled: () => {
        setStep((current) => (current === 9 ? 10 : current));
      }
    });
    setDraftMessage("");
  };

  const submitPaymentReply = (replyText?: string) => {
    const persistedText = replyText ?? "我先把挂号费付了。";
    setReply("payment", persistedText);
    persistPrompt("payment", persistedText, {
      encounterStatusOverride: "WAITING_RESULTS",
      onSettled: () => {
        setStep((current) => (current === 10 ? 11 : current));
      }
    });
    setDraftMessage("");
  };

  const submitResultReply = (replyText?: string) => {
    const persistedText = replyText ?? "好的，我回科室继续看。";
    setReply("result", persistedText);
    persistPrompt("result", persistedText, {
      encounterStatusOverride: "PARTIAL_RESULT_READY",
      onSettled: () => {
        setStep((current) => (current === 11 ? 12 : current));
      }
    });
    setDraftMessage("");
  };

  const submitPharmacyReply = (replyText?: string) => {
    setMapFocus("pharmacy");
    const persistedText = replyText ?? "好的，我先去取药。";
    setReply("pharmacy", persistedText);
    persistPrompt("pharmacy", persistedText, {
      encounterStatusOverride: "READY_FOR_PHARMACY",
      onSettled: () => {
        setStep((current) => (current === 12 ? 13 : current));
      }
    });
    setDraftMessage("");
  };

  const submitCareReply = (replyText?: string) => {
    const persistedText = replyText ?? "帮我把用药提醒也一起设好。";
    setReply("care", persistedText);
    persistPrompt("care", persistedText, {
      encounterStatusOverride: "CARE_PLAN_READY",
      onSettled: () => {
        setStep((current) => (current === 13 ? 14 : current));
      }
    });
    setDraftMessage("");
  };

  const activateFamilyProxy = async (replyText?: string) => {
    const delegate = await enableFamilyDelegate();

    setDelegationMode("family_proxy");
    setFamilyDelegate(delegate);
    const persistedText = replyText ?? "这次麻烦我女儿帮我一起代办。";
    setReply("delegate", persistedText);
    persistPrompt("delegate", persistedText);
    setDraftMessage("");
  };

  const requestVolunteerHelp = async (replyText?: string) => {
    const request = await createVolunteerRequest();

    setVolunteerRequest(request);
    const persistedText = replyText ?? "我想呼叫志愿者协助。";
    setReply("volunteer", persistedText);
    persistPrompt("volunteer", persistedText);
    setDraftMessage("");
  };

  const resolveHospitalFromText = (text: string) => {
    if (/第一|最近|离我近/.test(text)) {
      return hospitals[0]?.id;
    }

    if (/第二|另一家/.test(text)) {
      return hospitals[1]?.id;
    }

    const matched = hospitals.find(
      (item) =>
        text.includes(item.name) ||
        text.includes(item.name.replace("医院", "")) ||
        text.includes(item.name.slice(0, 2))
    );

    return matched?.id;
  };

  const resolveSlotFromText = (text: string) => {
    if (/第一|第一个|先看第一个/.test(text)) {
      return availableSlots[0]?.id;
    }

    if (/第二|第二个/.test(text)) {
      return availableSlots[1]?.id;
    }

    const matched = availableSlots.find((item) => {
      const doctorName = item.doctor.split(" · ")[0];
      return text.includes(doctorName) || text.includes(item.doctor);
    });

    return matched?.id;
  };

  const resolveTransportFromText = (text: string) => {
    if (/公交|地铁/.test(text)) {
      return "transit" as const;
    }

    if (/开车|自驾|停车/.test(text)) {
      return "drive" as const;
    }

    return "taxi" as const;
  };

  const handleComposerSubmit = () => {
    const nextText = draftMessage.trim();

    if (!nextText) {
      return;
    }

    if (waitingForCloud) {
      setQueuedInputs((prev) => [...prev, nextText]);
      setDraftMessage("");
      return;
    }
    processInput(nextText);
  };

  useEffect(() => {
    if (waitingForCloud || queuedInputs.length === 0) {
      return;
    }

    const [nextInput, ...rest] = queuedInputs;
    setQueuedInputs(rest);
    processInput(nextInput);
  }, [queuedInputs, waitingForCloud]);

  useEffect(() => {
    void updateEncounterStatus({
      sessionId,
      encounterStatus: effectiveEncounterStatus,
      symptom: symptom || undefined,
      delegationMode
    });
  }, [delegationMode, effectiveEncounterStatus, sessionId, symptom]);

  useEffect(() => {
    let cancelled = false;

    void getRoutePlans({
      origin: locationSnapshot,
      hospital: selectedHospital
    }).then((nextPlans) => {
      if (!cancelled) {
        setRoutePlans(nextPlans);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [locationSnapshot, selectedHospital]);

  useEffect(() => {
    let cancelled = false;

    void getIndoorRoutePlan({
      hospital: selectedHospital,
      department: profile.department,
      focus: mapFocus
    }).then((nextPlan) => {
      if (!cancelled) {
        setIndoorRoutePlan(nextPlan);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [mapFocus, profile.department, selectedHospital]);

  useEffect(() => {
    if (step < 8 || !selectedSlot) {
      setSceneMessages([]);
      return;
    }

    void triggerScenePush({
      sessionId,
      encounterStatus: effectiveEncounterStatus,
      location: effectiveLocationSnapshot,
      appointment: {
        hospitalId: selectedHospital.id,
        hospitalName: selectedHospital.name,
        department: profile.department,
        doctorName: selectedSlot.doctor,
        appointmentTime: preferredTime === "今天下午" ? "今天 14:30" : "明天 09:30"
      },
      delegationMode,
      familyDelegate,
      volunteerRequest
    }).then((result) => {
      setSceneMessages(result.messages);
    });
  }, [
    delegationMode,
    effectiveEncounterStatus,
    effectiveLocationSnapshot,
    familyDelegate,
    preferredTime,
    profile.department,
    selectedHospital.id,
    selectedHospital.name,
    selectedSlot,
    step,
    volunteerRequest
  ]);

  const composerPlaceholder =
    waitingForCloud
      ? "医宝正在整理这一轮建议，你现在发送的内容会自动排队。"
      :
    step === 0
      ? "输入症状，例如：咳嗽三天了，晚上更明显"
      : step === 1
        ? "补充有没有发热、咯血或呼吸困难"
        : step === 5
          ? "也可以直接输入你的挂号偏好"
          : step === 4
            ? "例如：帮我选最近的一家，或直接输入医院名"
            : step === 6
              ? "例如：选第一个，或直接输入医生名字"
              : step === 7
                ? "例如：确认挂号，或说我想换个时间"
                : step === 8
                  ? "例如：帮我打车，或说我想看公交路线"
                  : step === 9
                    ? "例如：20 分钟后提醒我出发"
                    : step === 10
                      ? "例如：帮我先缴费"
                      : step === 11
                        ? "例如：好的，我回科室继续看"
                        : step === 12
                          ? "例如：好的，我先去取药"
                          : step === 13
                            ? "例如：帮我设置用药提醒"
                            : "直接输入你的想法，我会继续往下帮你处理";

  const composerActions: ComposerAction[] =
    step === 0
      ? [
          {
            key: "voice",
            label: "语音描述",
            icon: "mic-outline" as const,
            onPress: () => setDraftMessage("我咳嗽好几天了，晚上会更明显。")
          },
          {
            key: "picture",
            label: "上传图片",
            icon: "image-outline" as const,
            onPress: () => setDraftMessage("我还想补充一张喉咙不舒服的图片。")
          },
          {
            key: "archive",
            label: "同步档案",
            icon: "folder-open-outline" as const,
            onPress: () => setDraftMessage("请结合我最近一次呼吸道就诊记录一起判断。")
          }
        ]
      : step === 1
        ? [
            {
              key: "safe",
              label: "没有这些症状",
              icon: "checkmark-circle-outline" as const,
              onPress: () => submitRiskAnswer("no")
            },
            {
              key: "fever",
              label: "有一点发热",
              icon: "thermometer-outline" as const,
              onPress: () => submitRiskAnswer("yes")
            }
          ]
        : step === 5
          ? [
              {
                key: "today",
                label: "今天下午",
                icon: "time-outline" as const,
                onPress: () => submitPreferenceText("今天下午可以，普通号优先。")
              },
              {
                key: "tomorrow",
                label: "明天上午",
                icon: "calendar-outline" as const,
                onPress: () => submitPreferenceText("明天上午也行，可以接受专家号。")
              }
            ]
          : step === 8
            ? [
                {
                  key: "taxi",
                  label: "帮我打车",
                  icon: "car-outline" as const,
                  onPress: () => submitTransportChoice("taxi")
                },
                {
                  key: "transit",
                  label: "看公交路线",
                  icon: "train-outline" as const,
                  onPress: () => submitTransportChoice("transit")
                },
                {
                  key: "drive",
                  label: "我自己开车",
                  icon: "navigate-outline" as const,
                  onPress: () => submitTransportChoice("drive")
                }
              ]
            : step === 9
              ? [
                  {
                    key: "depart-now",
                    label: "现在出发",
                    icon: "send-outline" as const,
                    onPress: () => submitDeparturePlan("我现在就准备出发。")
                  },
                  {
                    key: "depart-remind",
                    label: "稍后提醒我",
                    icon: "alarm-outline" as const,
                    onPress: () => submitDeparturePlan("20 分钟后提醒我出发。")
                  }
                ]
              : step === 10
                ? [
                    {
                      key: "pay",
                      label: "先去缴费",
                      icon: "card-outline" as const,
                      onPress: () => submitPaymentReply()
                    }
                  ]
                : step === 11
                  ? [
                      {
                        key: "back-clinic",
                        label: "回科室继续",
                        icon: "medkit-outline" as const,
                        onPress: () => submitResultReply()
                      }
                    ]
                  : step === 12
                    ? [
                        {
                          key: "pickup-medicine",
                          label: "去取药",
                          icon: "bag-handle-outline" as const,
                          onPress: () => submitPharmacyReply()
                        }
                      ]
                    : step === 13
                      ? [
                          {
                            key: "set-reminder",
                            label: "设置提醒",
                            icon: "notifications-outline" as const,
                            onPress: () => submitCareReply()
                          }
                        ]
                      : [
                          {
                            key: "restart",
                            label: "重新开始",
                            icon: "refresh-outline" as const,
                            onPress: resetConversation
                          }
                        ];

  if (step >= 8 && delegationMode === "self") {
    composerActions.unshift({
      key: "family-proxy",
      label: "家属代办",
      icon: "people-outline" as const,
      onPress: () => {
        void activateFamilyProxy();
      }
    });
  }

  if (step >= 10 && !volunteerRequest) {
    composerActions.unshift({
      key: "volunteer-help",
      label: "呼叫志愿者",
      icon: "hand-left-outline" as const,
      onPress: () => {
        void requestVolunteerHelp();
      }
    });
  }

  const effectiveComposerActions = waitingForCloud ? [] : composerActions;

  const messages: ChatMessage[] = [
    {
      id: "intro-system",
      kind: "system",
      text: "先别着急，我会陪你一步一步理清症状，再决定是否需要就医。"
    },
    {
      id: "intro-assistant",
      kind: "text",
      role: "assistant",
      text: "请先告诉我你哪里不舒服，持续了多久，有没有明显加重。"
    },
    {
      id: "intro-chips",
      kind: "chipGroup",
      chips: symptomSuggestions.map((item) => ({
        key: item,
        label: item,
        selected: symptom === item,
        onPress: () => submitSymptom(item)
      }))
    }
  ];

  if (symptom) {
    messages.push({
      id: "user-symptom",
      kind: "text",
      role: "user",
      text: userReplies.symptom ?? symptom
    });
    messages.push(...getCloudTurn("symptom"));
  }

  if (queuedInputs.length) {
    const queuePreview = queuedInputs[0];
    messages.push({
      id: "queued-system",
      kind: "system",
      text:
        queuedInputs.length === 1
          ? `已记下下一条消息：“${queuePreview}”，等这轮建议回来后会自动继续。`
          : `已排队 ${queuedInputs.length} 条消息，当前先处理上一轮，随后会自动继续。`
    });
  }

  if (step >= 1) {
    messages.push(
      {
        id: "risk-system",
        kind: "system",
        text: "我先陪你做一个简单筛查，排除需要尽快线下处理的情况。"
      },
      {
        id: "risk-assistant",
        kind: "text",
        role: "assistant",
        text: `我想再确认一下，${profile.riskQuestion}`
      },
      {
        id: "risk-card",
        kind: "binaryChoiceCard",
        title: "风险追问",
        question: profile.riskQuestion,
        hint: profile.riskHint,
        options: [
          {
            key: "risk-yes",
            label: "是",
            variant: riskAnswer === "yes" ? "primary" : "secondary",
            onPress: () => submitRiskAnswer("yes")
          },
          {
            key: "risk-no",
            label: "否",
            variant: riskAnswer === "no" ? "primary" : "secondary",
            onPress: () => submitRiskAnswer("no")
          }
        ]
      }
    );

    if (riskAnswer) {
      messages.push({
        id: "risk-user",
        kind: "text",
        role: "user",
        text: userReplies.risk
      });
      messages.push(...getCloudTurn("risk"));
    }
  }

  if (step >= 2) {
    messages.push(
      {
        id: "diagnosis-system",
        kind: "system",
        text: "这是基于你目前描述给出的初步判断，不替代医生面诊。"
      },
      {
        id: "diagnosis-assistant",
        kind: "text",
        role: "assistant",
        text: "我先帮你整理一下目前最可能的情况。"
      },
      {
        id: "diagnosis-card",
        kind: "featureCard",
        title: "初步判断",
        heading: profile.headline,
        tag: { label: profile.department, tone: "blue" },
        description: profile.summary,
        bullets: profile.careTips
      },
      {
        id: "need-hospital-user",
        kind: "text",
        role: "user",
        text: userReplies.needHospital ?? "那我需要去医院吗？"
      }
    );

    if (step === 2) {
      messages.push({
        id: "need-hospital-action",
        kind: "action",
        action: {
          key: "continue-department",
          label: "看看推荐科室",
          onPress: () => setStep(3)
        }
      });
    }
  }

  if (step >= 3) {
    messages.push(
      {
        id: "department-system",
        kind: "system",
        text: "如果你想更稳妥一些，我可以继续帮你定位到合适科室。"
      },
      {
        id: "department-assistant",
        kind: "text",
        role: "assistant",
        text: `结合你的症状，我建议优先考虑${profile.department}。`
      },
      {
        id: "department-card",
        kind: "featureCard",
        title: "推荐科室",
        heading: profile.department,
        tag: { label: "优先推荐" },
        description: `更适合优先处理${profile.headline}相关问题，也能更快进入对口检查。`,
        chips: profile.alternatives.map((item) => ({ key: item, label: item }))
      },
      {
        id: "department-user",
        kind: "text",
        role: "user",
        text: userReplies.department ?? "可以继续帮我找医院。"
      }
    );

    if (step === 3) {
      messages.push({
        id: "department-action",
        kind: "action",
        action: {
          key: "continue-hospital",
          label: "继续推荐医院",
          onPress: () => setStep(4)
        }
      });
    }
  }

  if (step >= 4) {
    messages.push(
      {
        id: "hospital-system",
        kind: "system",
        text: "我先帮你筛一组更省心、也更适合这次症状的医院。"
      },
      {
        id: "hospital-assistant",
        kind: "text",
        role: "assistant",
        text: "我先按科室、距离和今天可就诊情况，帮你筛一组更合适的医院。"
      },
      {
        id: "hospital-card",
        kind: "selectListCard",
        title: "推荐医院",
        description: profile.hospitalSummary,
        options: hospitals.map((item) => ({
          key: item.id,
          title: item.name,
          meta: item.meta,
          tag: { label: item.tag },
          selected: item.id === hospitalId,
          onPress: () => handleHospitalSelect(item.id)
        }))
      }
    );
  }

  if (step >= 5) {
    messages.push(
      {
        id: "hospital-user",
        kind: "text",
        role: "user",
        text: userReplies.hospital ?? `那就先去 ${selectedHospital.name} 吧。`
      }
    );
    messages.push(...getCloudTurn("hospital"));
    messages.push(
      {
        id: "preference-system",
        kind: "system",
        text: "我先把你的就诊偏好问清楚，后面就不用在号源里来回挑了。"
      },
      {
        id: "preference-assistant",
        kind: "text",
        role: "assistant",
        text: "你更希望今天去，还是明天上午去？另外，是否接受专家号？"
      },
      {
        id: "preference-card",
        kind: "choiceCard",
        title: "挂号偏好",
        description: "先告诉我你更希望什么时候去、是否接受专家号，我再帮你筛得更准。",
        groups: [
          [
            {
              key: "today-afternoon",
              label: "今天下午",
              selected: preferredTime === "今天下午",
              onPress: () => setPreferredTime("今天下午")
            },
            {
              key: "tomorrow-morning",
              label: "明天上午",
              selected: preferredTime === "明天上午",
              onPress: () => setPreferredTime("明天上午")
            }
          ],
          [
            {
              key: "normal-slot",
              label: "普通号优先",
              selected: expertPreference === "normal",
              onPress: () => setExpertPreference("normal")
            },
            {
              key: "expert-slot",
              label: "可接受专家号",
              selected: expertPreference === "expert",
              onPress: () => setExpertPreference("expert")
            }
          ]
        ]
      }
    );
  }

  if (step >= 6) {
    messages.push(
      {
        id: "preference-user",
        kind: "text",
        role: "user",
        text:
          userReplies.preference ??
          `${preferredTime}可以，${expertPreference === "normal" ? "普通号优先" : "可以看专家号"}。`
      }
    );
    messages.push(...getCloudTurn("preference"));
    messages.push(
      {
        id: "slot-system",
        kind: "system",
        text: "我不先铺很多医生给你看，而是先挑更符合你偏好的两个方案。"
      },
      {
        id: "slot-assistant",
        kind: "text",
        role: "assistant",
        text: `我先按“${preferredTime} + ${
          expertPreference === "normal" ? "普通号优先" : "可接受专家号"
        }”给你筛了一组更合适的号源。`
      },
      {
        id: "slot-card",
        kind: "selectListCard",
        title: "号源推荐",
        description: `${selectedHospital.name} · 先看两个更省心的选择。`,
        options: availableSlots.map((slot) => ({
          key: slot.id,
          title: slot.doctor,
          meta: slot.meta,
          hint: "更适合当前症状场景，时间和价格都比较平衡。",
          tag: { label: slot.price, tone: "green" },
          selected: slot.id === slotId,
          onPress: () => handleSlotSelect(slot.id)
        }))
      }
    );
  }

  if (step >= 7) {
    messages.push(
      {
        id: "slot-user",
        kind: "text",
        role: "user",
        text:
          userReplies.slot ??
          `我想约 ${selectedSlot?.doctor ?? "李医生"} 这个号。`
      }
    );
    messages.push(...getCloudTurn("slot"));
    messages.push(
      {
        id: "confirm-system",
        kind: "system",
        text: "我把关键信息整理好了，你确认一次就可以完成挂号。"
      },
      {
        id: "confirm-assistant",
        kind: "text",
        role: "assistant",
        text: "现在先别着急往下点，我帮你把医院、时间和费用再核一遍。"
      },
      {
        id: "confirm-card",
        kind: "summaryCard",
        title: "挂号确认",
        rows: [
          { label: "医院", value: `${selectedHospital.name} · ${profile.department}` },
          { label: "医生", value: selectedSlot?.doctor ?? "李医生 · 普通号" },
          {
            label: "时间",
            value: preferredTime === "今天下午" ? "今天 14:30" : "明天 09:30"
          },
          { label: "费用", value: selectedSlot?.price ?? "¥28" }
        ],
        actions: [
          {
            key: "confirm",
            label: "确认挂号",
            onPress: () => setStep(8)
          },
          {
            key: "change-time",
            label: "改个时间",
            variant: "secondary",
            onPress: () => setStep(5)
          }
        ]
      },
      {
        id: "confirm-user",
        kind: "text",
        role: "user",
        text: userReplies.confirm ?? "好的，帮我确认。"
      }
    );
  }

  if (step >= 8) {
    messages.push(
      {
        id: "confirmed-assistant",
        kind: "text",
        role: "assistant",
        text: "已经帮你确认挂号了。我继续陪你把到院这段也安排顺一点。"
      },
      {
        id: "confirmed-system",
        kind: "system",
        text: "你已经完成了挂号，接下来我会继续帮你处理到院方式、缴费、结果查看和诊后提醒。"
      },
      {
        id: "status-demo-system",
        kind: "system",
        text: "下面这张卡是状态触发 Demo。面试演示时，你可以直接点击不同状态，展示“下一张卡片如何由状态触发”。"
      },
      {
        id: "status-demo-card",
        kind: "summaryCard",
        title: "状态触发 Demo",
        description: "这张卡不替代正常流程，而是给你一个可手动触发的演示入口。",
        rows: [
          {
            label: "当前流程状态",
            value: encounterStatusLabels[effectiveEncounterStatus]
          },
          {
            label: "当前位置",
            value: locationZoneLabels[effectiveLocationSnapshot.zone]
          },
          {
            label: "触发说明",
            value: "点下面任一按钮，会更新 session 状态并自动插入对应提醒卡。"
          }
        ],
        actions: [
          {
            key: "demo-arrived",
            label: "触发：到院",
            variant: effectiveEncounterStatus === "ARRIVED_HOSPITAL" ? "primary" : "secondary",
            onPress: () => triggerDemoStatus("ARRIVED_HOSPITAL", "hospital_gate", "到院")
          },
          {
            key: "demo-payment",
            label: "触发：待缴费",
            variant: effectiveEncounterStatus === "WAITING_PAYMENT" ? "primary" : "secondary",
            onPress: () => triggerDemoStatus("WAITING_PAYMENT", "outpatient_floor", "待缴费")
          },
          {
            key: "demo-result",
            label: "触发：结果已出",
            variant:
              effectiveEncounterStatus === "PARTIAL_RESULT_READY" ? "primary" : "secondary",
            onPress: () =>
              triggerDemoStatus("PARTIAL_RESULT_READY", "outpatient_floor", "结果已出")
          },
          {
            key: "demo-pharmacy",
            label: "触发：待取药",
            variant: effectiveEncounterStatus === "READY_FOR_PHARMACY" ? "primary" : "secondary",
            onPress: () =>
              triggerDemoStatus("READY_FOR_PHARMACY", "outpatient_floor", "待取药")
          },
          {
            key: "demo-reset",
            label: "恢复流程状态",
            variant: "secondary",
            onPress: resetDemoStatus
          }
        ]
      },
      {
        id: "arrival-assistant",
        kind: "text",
        role: "assistant",
        text: `你预约的是 ${selectedHospital.name}，${
          preferredTime === "今天下午" ? "今天 14:30" : "明天 09:30"
        } 到院。你想怎么过去？`
      },
      {
        id: "arrival-card",
        kind: "mapCard",
        title: "到院协助",
        appearance: "outdoor",
        currentLabel: locationSnapshot.label,
        destinationLabel: `${selectedHospital.name} · 门诊楼`,
        distanceLabel: activeRoutePlan.distanceLabel,
        hint: "你可以先切换路线方式，再按当前路线继续。",
        routeSummary: activeRoutePlan.summary,
        modes: [
          {
            key: "taxi",
            label: routePlans.taxi.label,
            eta: routePlans.taxi.eta,
            meta: routePlans.taxi.summary,
            selected: transportMode === "taxi",
            onPress: () => {
              setTransportMode("taxi");
              setMapFocus("entrance");
            }
          },
          {
            key: "transit",
            label: routePlans.transit.label,
            eta: routePlans.transit.eta,
            meta: routePlans.transit.summary,
            selected: transportMode === "transit",
            onPress: () => {
              setTransportMode("transit");
              setMapFocus("entrance");
            }
          },
          {
            key: "drive",
            label: routePlans.drive.label,
            eta: routePlans.drive.eta,
            meta: routePlans.drive.summary,
            selected: transportMode === "drive",
            onPress: () => {
              setTransportMode("drive");
              setMapFocus("parking");
            }
          }
        ],
        routeSteps: activeRoutePlan.steps,
        points: [
          {
            key: "arrival-entrance",
            label: "门诊入口",
            kind: "entrance",
            selected: mapFocus === "entrance",
            meta: mapFocusMeta.entrance,
            onPress: () => setMapFocus("entrance")
          },
          {
            key: "arrival-parking",
            label: "停车场",
            kind: "parking",
            selected: mapFocus === "parking",
            meta: mapFocusMeta.parking,
            onPress: () => setMapFocus("parking")
          },
          {
            key: "arrival-triage",
            label: "分诊台",
            kind: "triage",
            selected: mapFocus === "triage",
            meta: mapFocusMeta.triage,
            onPress: () => setMapFocus("triage")
          },
          {
            key: "arrival-pharmacy",
            label: "药房",
            kind: "pharmacy",
            selected: mapFocus === "pharmacy",
            meta: mapFocusMeta.pharmacy,
            onPress: () => setMapFocus("pharmacy")
          }
        ],
        secondaryAction: {
          key: "arrival-open-nav",
          label: activeRoutePlan.externalLabel,
          variant: "secondary",
          onPress: () => {
            void openExternalNavigation(activeRoutePlan.externalUrl);
          }
        },
        action: {
          key: "arrival-confirm",
          label: "按当前路线继续",
          onPress: () => submitTransportChoice(transportMode)
        }
      }
    );
  }

  if (step >= 9) {
    messages.push(
      {
        id: "arrival-user",
        kind: "text",
        role: "user",
        text: userReplies.arrival
      }
    );
    messages.push(...getCloudTurn("arrival"));
    messages.push(
      {
        id: "departure-system",
        kind: "system",
        text: "出发前我会尽量把路线、时间和容易漏掉的动作都提前告诉你。"
      },
      {
        id: "departure-assistant",
        kind: "text",
        role: "assistant",
        text:
          transportMode === "taxi"
            ? "如果你打车，我建议提前 20 分钟出发，这样到院后还有余量完成报到。"
            : transportMode === "transit"
              ? "如果你走公交地铁，我建议至少提前 35 分钟出发，避免换乘耽误。"
              : "如果你自驾，我会一起提醒你停车位置和进门方向。"
      },
      {
        id: "departure-card",
        kind: "mapCard",
        title: "院内带路",
        appearance: "indoor",
        currentLabel: `${selectedHospital.name} · 门诊入口`,
        destinationLabel:
          mapFocus === "pharmacy"
            ? "门诊 1 楼西侧药房"
            : `门诊 3 楼 · ${profile.department}分诊台`,
        distanceLabel: indoorRoutePlan.distanceLabel,
        hint: "到院后可以切换查看入口、停车场、分诊台和药房的位置关系。",
        routeSummary: indoorRoutePlan.summary,
        modes: [
          {
            key: transportMode,
            label: indoorRoutePlan.label,
            eta: indoorRoutePlan.eta,
            meta: indoorRoutePlan.summary,
            selected: true,
            onPress: () => undefined
          }
        ],
        routeSteps: indoorRoutePlan.steps,
        points: [
          {
            key: "indoor-entrance",
            label: "入口",
            kind: "entrance",
            selected: mapFocus === "entrance",
            meta: mapFocusMeta.entrance,
            onPress: () => setMapFocus("entrance")
          },
          {
            key: "indoor-parking",
            label: "停车场",
            kind: "parking",
            selected: mapFocus === "parking",
            meta: mapFocusMeta.parking,
            onPress: () => setMapFocus("parking")
          },
          {
            key: "indoor-triage",
            label: "分诊台",
            kind: "triage",
            selected: mapFocus === "triage",
            meta: mapFocusMeta.triage,
            onPress: () => setMapFocus("triage")
          },
          {
            key: "indoor-pharmacy",
            label: "药房",
            kind: "pharmacy",
            selected: mapFocus === "pharmacy",
            meta: mapFocusMeta.pharmacy,
            onPress: () => setMapFocus("pharmacy")
          }
        ],
        secondaryAction: {
          key: "indoor-open-nav",
          label: indoorRoutePlan.externalLabel,
          variant: "secondary",
          onPress: () => {
            void openExternalNavigation(indoorRoutePlan.externalUrl);
          }
        },
        action: {
          key: "departure-ack",
          label: "知道了，继续",
          onPress: () => submitDeparturePlan()
        }
      }
    );
  }

  if (step >= 8 && userReplies.delegate) {
    messages.push({
      id: "delegate-user",
      kind: "text",
      role: "user",
      text: userReplies.delegate
    });
    messages.push(...getCloudTurn("delegate"));
  }

  if (step >= 10) {
    messages.push(
      {
        id: "departure-user",
        kind: "text",
        role: "user",
        text: userReplies.departure
      }
    );
    messages.push(...getCloudTurn("departure"));
    messages.push(
      {
        id: "payment-system",
        kind: "system",
        text: "到院后的第一步尽量不要靠自己记，我会把该做的动作顺序告诉你。"
      },
      {
        id: "payment-assistant",
        kind: "text",
        role: "assistant",
        text: "你到院后先到 3 楼分诊台报到，挂号费用和检查费用我也会同步提醒。"
      },
      {
        id: "payment-card",
        kind: "summaryCard",
        title: "缴费提醒",
        rows: [
          { label: "当前待支付", value: "挂号费 ¥28" },
          {
            label: "支付后",
            value: `直接去${profile.department}候诊，不需要重复排队挂号`
          }
        ],
        actions: [
          {
            key: "payment-ack",
            label: "我先去缴费",
            onPress: () => submitPaymentReply()
          }
        ]
      }
    );
  }

  if (step >= 10 && userReplies.volunteer) {
    messages.push({
      id: "volunteer-user",
      kind: "text",
      role: "user",
      text: userReplies.volunteer
    });
    messages.push(...getCloudTurn("volunteer"));
  }

  if (step >= 11) {
    messages.push(
      {
        id: "payment-user",
        kind: "text",
        role: "user",
        text: userReplies.payment
      }
    );
    messages.push(...getCloudTurn("payment"));
    messages.push(
      {
        id: "result-system",
        kind: "system",
        text: "医生开检查后，我会把“结果有没有出来”和“下一步做什么”一起告诉你。"
      },
      {
        id: "result-assistant",
        kind: "text",
        role: "assistant",
        text: "现在有一部分检查结果先出来了，没有看到明显高风险异常。你可以回科室继续就诊。"
      },
      {
        id: "result-card",
        kind: "summaryCard",
        title: "检查结果提醒",
        rows: [
          { label: "已出结果", value: "影像结果已回传，可返回门诊继续看诊" },
          { label: "未出结果", value: "化验单预计 12 分钟后更新，我会继续提醒你" }
        ],
        actions: [
          {
            key: "result-ack",
            label: "回科室继续",
            onPress: () => submitResultReply()
          }
        ]
      }
    );
  }

  if (step >= 12) {
    messages.push(
      {
        id: "result-user",
        kind: "text",
        role: "user",
        text: userReplies.result
      }
    );
    messages.push(...getCloudTurn("result"));
    messages.push(
      {
        id: "pharmacy-system",
        kind: "system",
        text: "就诊快结束时，我会把需要立刻处理的药品和后续护理分开告诉你。"
      },
      {
        id: "pharmacy-assistant",
        kind: "text",
        role: "assistant",
        text: "医生已经给你开好了药，我先告诉你去哪里拿，避免在院内来回找窗口。"
      },
      {
        id: "pharmacy-card",
        kind: "summaryCard",
        title: "取药提示",
        rows: [
          { label: "取药窗口", value: "门诊 1 楼西侧 3 号窗口" },
          { label: "当前状态", value: "处方已同步，预计排队 6 分钟" }
        ],
        actions: [
          {
            key: "pharmacy-ack",
            label: "知道了，去取药",
            onPress: () => submitPharmacyReply()
          }
        ]
      }
    );
  }

  if (step >= 13) {
    messages.push(
      {
        id: "pharmacy-user",
        kind: "text",
        role: "user",
        text: userReplies.pharmacy
      }
    );
    messages.push(...getCloudTurn("pharmacy"));
    messages.push(
      {
        id: "care-system",
        kind: "system",
        text: "离院之后最容易忘的是护理节奏和吃药时间，我先帮你整理成最简版。"
      },
      {
        id: "care-assistant",
        kind: "text",
        role: "assistant",
        text: "这次我先给你一版少而明确的护理建议，后面如果你愿意，我再继续陪你跟进恢复情况。"
      },
      {
        id: "care-card",
        kind: "summaryCard",
        title: "诊后护理",
        bullets: [
          "今天先多喝温水，尽量早点休息",
          "明天仍不舒服时，继续观察是否有发热或胸闷",
          "如果症状 3 天内明显加重，建议再次就医"
        ],
        actions: [
          {
            key: "care-ack",
            label: "帮我设置提醒",
            onPress: () => submitCareReply()
          }
        ]
      }
    );
  }

  if (step >= 14) {
    messages.push(
      {
        id: "care-user",
        kind: "text",
        role: "user",
        text: userReplies.care
      }
    );
    messages.push(...getCloudTurn("care"));
    messages.push(
      {
        id: "reminder-assistant",
        kind: "text",
        role: "assistant",
        text: "已经帮你把这次就医后的重点整理好了，后面我会按提醒继续陪你。"
      },
      {
        id: "reminder-card",
        kind: "summaryCard",
        title: "用药提醒",
        rows: [
          { label: "今晚", value: "止咳药 1 次，饭后服用" },
          { label: "明早", value: "继续按医嘱服药，注意补水" },
          { label: "复诊建议", value: "若 3 天后仍持续明显不适，可再次复诊" }
        ]
      },
      {
        id: "restart-action",
        kind: "action",
        action: {
          key: "restart",
          label: "重新开始",
          onPress: resetConversation
        }
      }
    );
  }

  if (statusTimeline.length) {
    messages.push({
      id: "status-trace-card",
      kind: "summaryCard",
      title: "状态流转记录",
      rows: statusTimeline.slice(-4).map((item) => ({
        label: item.label,
        value: `${encounterStatusLabels[item.status]} · ${locationZoneLabels[item.zone]}`
      }))
    });
  }

  messages.push(...sceneMessages);

  return (
    <ChatScreen
      title="就医助手"
      subtitle="温和陪伴版 · 单页聊天 MVP"
      footer={
        <ChatComposer
          value={draftMessage}
          placeholder={composerPlaceholder}
          onChangeText={setDraftMessage}
          onSend={handleComposerSubmit}
          sendDisabled={!draftMessage.trim()}
          disabled={Boolean(waitingForCloud)}
          actions={effectiveComposerActions}
        />
      }
    >
      {messages.map((message) => (
        <MessageRenderer key={message.id} message={message} />
      ))}
    </ChatScreen>
  );
}
