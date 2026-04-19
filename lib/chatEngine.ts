import type { Slot } from "@/data/mock";

export type SymptomProfileKey = "cough" | "throat" | "stomach" | "fever";

export type SymptomProfile = {
  key: SymptomProfileKey;
  headline: string;
  department: string;
  summary: string;
  careTips: string[];
  alternatives: string[];
  hospitalSummary: string;
  riskQuestion: string;
  riskHint: string;
  slotMap: Record<string, Slot[]>;
};

const symptomProfiles: Record<SymptomProfileKey, SymptomProfile> = {
  cough: {
    key: "cough",
    headline: "咳嗽",
    department: "呼吸内科",
    summary:
      "更像是上呼吸道刺激或普通感冒后的持续性咳嗽。如果没有高热和呼吸困难，通常不属于最紧急的情况。",
    careTips: [
      "多喝温水，减少冷空气刺激",
      "夜间尽量保持空气湿润",
      "如果超过一周仍未缓解，建议就医"
    ],
    alternatives: ["全科门诊", "耳鼻喉科"],
    hospitalSummary: "优先考虑离你近、呼吸相关科室成熟、今天还有号源的医院。",
    riskQuestion: "是否伴有高热、咯血或明显呼吸困难？",
    riskHint: "如果有这些情况，建议你尽快线下就诊。",
    slotMap: {
      "zju-1": [
        {
          id: "slot-cough-1",
          doctor: "李医生 · 呼吸内科",
          meta: "今天 14:30 · 普通号",
          price: "¥28"
        },
        {
          id: "slot-cough-2",
          doctor: "张医生 · 呼吸内科",
          meta: "今天 16:00 · 普通号",
          price: "¥30"
        }
      ],
      "people-1": [
        {
          id: "slot-cough-3",
          doctor: "王医生 · 呼吸内科",
          meta: "今天 16:10 · 普通号",
          price: "¥26"
        },
        {
          id: "slot-cough-4",
          doctor: "周医生 · 呼吸内科",
          meta: "明天 09:30 · 专家号",
          price: "¥60"
        }
      ]
    }
  },
  throat: {
    key: "throat",
    headline: "咽喉不适",
    department: "耳鼻喉科",
    summary:
      "更像是咽喉炎症或上呼吸道刺激引起的不适。如果没有持续高热或吞咽困难，通常可以先按普通门诊处理。",
    careTips: [
      "先减少辛辣和过烫食物刺激",
      "多喝温水，必要时用淡盐水漱口",
      "如果声音嘶哑或疼痛持续加重，建议尽快就诊"
    ],
    alternatives: ["全科门诊", "呼吸内科"],
    hospitalSummary: "优先考虑耳鼻喉门诊成熟、排队更顺畅、今天仍可预约的医院。",
    riskQuestion: "有没有持续高热、明显吞咽困难，或者喉咙肿到影响呼吸？",
    riskHint: "如果吞咽和呼吸都明显受影响，建议尽快线下就诊。",
    slotMap: {
      "zju-1": [
        {
          id: "slot-throat-1",
          doctor: "陈医生 · 耳鼻喉科",
          meta: "今天 15:10 · 普通号",
          price: "¥30"
        },
        {
          id: "slot-throat-2",
          doctor: "林医生 · 耳鼻喉科",
          meta: "今天 16:40 · 普通号",
          price: "¥30"
        }
      ],
      "people-1": [
        {
          id: "slot-throat-3",
          doctor: "赵医生 · 耳鼻喉科",
          meta: "明天 09:10 · 普通号",
          price: "¥28"
        },
        {
          id: "slot-throat-4",
          doctor: "徐医生 · 耳鼻喉科",
          meta: "明天 10:00 · 专家号",
          price: "¥65"
        }
      ]
    }
  },
  stomach: {
    key: "stomach",
    headline: "肠胃不适",
    department: "消化内科",
    summary:
      "更像是急性肠胃不适或饮食刺激后的反应。如果没有持续呕吐、便血或剧烈腹痛，可以先观察并补充水分。",
    careTips: [
      "先吃清淡食物，避免油腻和生冷",
      "少量多次补水，避免脱水",
      "如果腹痛持续加重或伴随频繁呕吐，建议就医"
    ],
    alternatives: ["全科门诊", "急诊内科"],
    hospitalSummary: "优先考虑消化门诊响应快、离你近、今天还有普通号的医院。",
    riskQuestion: "有没有持续呕吐、便血，或者腹痛已经明显影响站立和行走？",
    riskHint: "如果出现剧烈腹痛、便血或反复呕吐，建议尽快就医。",
    slotMap: {
      "zju-1": [
        {
          id: "slot-stomach-1",
          doctor: "孙医生 · 消化内科",
          meta: "今天 14:50 · 普通号",
          price: "¥32"
        },
        {
          id: "slot-stomach-2",
          doctor: "何医生 · 消化内科",
          meta: "今天 17:00 · 普通号",
          price: "¥32"
        }
      ],
      "people-1": [
        {
          id: "slot-stomach-3",
          doctor: "吴医生 · 消化内科",
          meta: "明天 09:20 · 普通号",
          price: "¥30"
        },
        {
          id: "slot-stomach-4",
          doctor: "高医生 · 消化内科",
          meta: "明天 10:40 · 专家号",
          price: "¥68"
        }
      ]
    }
  },
  fever: {
    key: "fever",
    headline: "发热",
    department: "全科门诊",
    summary:
      "更像是感染早期或炎症反应。发热本身需要结合持续时间和伴随症状来判断，先观察是否有明显加重信号。",
    careTips: [
      "先监测体温变化，注意补水和休息",
      "如果反复高热不退，建议尽快就医",
      "如伴随呼吸困难、胸闷或意识不清，应及时线下处理"
    ],
    alternatives: ["呼吸内科", "感染门诊"],
    hospitalSummary: "优先考虑全科或发热门诊接诊顺畅、今天仍可挂号的医院。",
    riskQuestion: "体温是否持续偏高，并伴有明显胸闷、气短，或者精神状态变差？",
    riskHint: "如果高热持续不退，或已经明显影响精神状态，建议尽快就诊。",
    slotMap: {
      "zju-1": [
        {
          id: "slot-fever-1",
          doctor: "方医生 · 全科门诊",
          meta: "今天 15:00 · 普通号",
          price: "¥25"
        },
        {
          id: "slot-fever-2",
          doctor: "杨医生 · 发热门诊",
          meta: "今天 16:20 · 普通号",
          price: "¥28"
        }
      ],
      "people-1": [
        {
          id: "slot-fever-3",
          doctor: "郑医生 · 全科门诊",
          meta: "明天 09:00 · 普通号",
          price: "¥24"
        },
        {
          id: "slot-fever-4",
          doctor: "蒋医生 · 感染门诊",
          meta: "明天 10:10 · 专家号",
          price: "¥58"
        }
      ]
    }
  }
};

export function getSymptomProfile(input: string): SymptomProfile {
  const normalized = input.trim();

  if (/喉|嗓|咽/.test(normalized)) {
    return symptomProfiles.throat;
  }

  if (/肚|胃|腹|拉肚子|腹泻|恶心|呕/.test(normalized)) {
    return symptomProfiles.stomach;
  }

  if (/发热|发烧|高温|低烧/.test(normalized)) {
    return symptomProfiles.fever;
  }

  return symptomProfiles.cough;
}

export function getSlotsForHospital(profileKey: SymptomProfileKey, hospitalId: string): Slot[] {
  return symptomProfiles[profileKey].slotMap[hospitalId] ?? [];
}

export function parseRiskAnswer(text: string): "yes" | "no" {
  return /没|不|否|没有|无/.test(text) ? "no" : "yes";
}

export function parsePreferenceText(text: string): {
  preferredTime?: string;
  expertPreference?: "normal" | "expert";
} {
  return {
    preferredTime: text.includes("明天")
      ? "明天上午"
      : text.includes("今天")
        ? "今天下午"
        : undefined,
    expertPreference: text.includes("专家")
      ? "expert"
      : text.includes("普通")
        ? "normal"
        : undefined
  };
}
