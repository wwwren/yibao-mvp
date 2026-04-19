export type Hospital = {
  id: string;
  name: string;
  meta: string;
  tag: string;
  lat: number;
  lng: number;
};

export type Slot = {
  id: string;
  doctor: string;
  meta: string;
  price: string;
};

export const symptomSuggestions = [
  "咳嗽好几天了",
  "喉咙不舒服",
  "肚子不舒服",
  "有点发烧"
];

export const hospitals: Hospital[] = [
  {
    id: "zju-1",
    name: "浙大一院",
    meta: "三级甲等 · 距你 890m",
    tag: "今日有号",
    lat: 30.2575,
    lng: 120.1774
  },
  {
    id: "people-1",
    name: "省人民医院",
    meta: "三级甲等 · 距你 2.1km",
    tag: "可预约",
    lat: 30.2685,
    lng: 120.1635
  }
];

export const slotsByHospital: Record<string, Slot[]> = {
  "zju-1": [
    {
      id: "slot-1",
      doctor: "李医生 · 呼吸内科",
      meta: "今天 14:30 · 普通号",
      price: "¥28"
    },
    {
      id: "slot-2",
      doctor: "张医生 · 呼吸内科",
      meta: "今天 16:00 · 普通号",
      price: "¥30"
    }
  ],
  "people-1": [
    {
      id: "slot-3",
      doctor: "王医生 · 呼吸内科",
      meta: "今天 16:10 · 普通号",
      price: "¥26"
    },
    {
      id: "slot-4",
      doctor: "周医生 · 呼吸内科",
      meta: "明天 09:30 · 专家号",
      price: "¥60"
    }
  ]
};

export const diagnosisSummary =
  "更像是上呼吸道刺激或普通感冒后的持续性咳嗽。如果没有高热和呼吸困难，通常不属于最紧急的情况。";

export const careTips = [
  "多喝温水，减少冷空气刺激",
  "夜间尽量保持空气湿润",
  "如果超过一周仍未缓解，建议就医"
];
