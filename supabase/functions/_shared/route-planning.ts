export type MapMode = "taxi" | "transit" | "drive";
export type MapPointKind = "entrance" | "parking" | "triage" | "pharmacy";

export type RouteStep = {
  key: string;
  kind: "walk" | "subway" | "taxi" | "drive" | "parking" | "arrival" | "indoor";
  title: string;
  detail: string;
};

export type RoutePlan = {
  mode: MapMode;
  label: string;
  eta: string;
  distanceLabel: string;
  summary: string;
  steps: RouteStep[];
  externalLabel: string;
  externalUrl: string;
};

function buildAmapNavigationUrl({
  mode,
  destinationName,
  lat,
  lng
}: {
  mode: MapMode;
  destinationName: string;
  lat: number;
  lng: number;
}) {
  const modeValue = mode === "transit" ? "bus" : "car";
  const query = [
    ["to", `${lng},${lat},${destinationName}`],
    ["mode", modeValue],
    ["coordinate", "gaode"],
    ["callnative", "1"],
    ["src", "医宝MVP"]
  ]
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join("&");

  return `https://uri.amap.com/navigation?${query}`;
}

export function buildRoutePlans(input: {
  hospitalName: string;
  hospitalLat: number;
  hospitalLng: number;
  distanceToHospitalMeters?: number;
}) {
  const distanceLabel =
    input.distanceToHospitalMeters && input.distanceToHospitalMeters > 1000
      ? `距医院约 ${(input.distanceToHospitalMeters / 1000).toFixed(1)} km`
      : `距医院约 ${input.distanceToHospitalMeters ?? 1200} m`;

  return {
    taxi: {
      mode: "taxi",
      label: "打车前往",
      eta: "18 分钟",
      distanceLabel,
      summary: "推荐在门诊楼东侧临停区下车，少走一段路，比较适合老人直接到门口。",
      steps: [
        { key: "1", kind: "taxi", title: "呼叫网约车", detail: "预计 3 分钟上车。" },
        {
          key: "2",
          kind: "taxi",
          title: "沿主干道直达医院",
          detail: `预计 18 分钟到 ${input.hospitalName}。`
        },
        {
          key: "3",
          kind: "arrival",
          title: "门诊楼东侧下车",
          detail: "下车后步行约 120 米进入门诊大厅。"
        }
      ],
      externalLabel: "打开高德导航",
      externalUrl: buildAmapNavigationUrl({
        mode: "taxi",
        destinationName: `${input.hospitalName}门诊楼`,
        lat: input.hospitalLat,
        lng: input.hospitalLng
      })
    },
    transit: {
      mode: "transit",
      label: "公交 / 地铁",
      eta: "31 分钟",
      distanceLabel,
      summary: "优先推荐地铁 + 短接驳步行的路线，换乘少，适合路线更明确的出行方式。",
      steps: [
        { key: "1", kind: "walk", title: "步行到地铁口", detail: "先步行 260 米到最近入口。" },
        { key: "2", kind: "subway", title: "乘坐地铁", detail: "乘 4 站后出站换乘接驳。" },
        { key: "3", kind: "arrival", title: "从门诊入口进院", detail: "出站后再步行 180 米。" }
      ],
      externalLabel: "打开高德路线",
      externalUrl: buildAmapNavigationUrl({
        mode: "transit",
        destinationName: `${input.hospitalName}门诊楼`,
        lat: input.hospitalLat,
        lng: input.hospitalLng
      })
    },
    drive: {
      mode: "drive",
      label: "自驾",
      eta: "22 分钟",
      distanceLabel,
      summary: "停车库还有空位，自驾更灵活，但要预留步行和电梯上楼时间。",
      steps: [
        { key: "1", kind: "drive", title: "导航到门诊停车楼", detail: "建议直接导航到 B2 停车库入口。" },
        { key: "2", kind: "parking", title: "停车后换乘电梯", detail: "B2 电梯可直达 1 楼大厅。" },
        { key: "3", kind: "arrival", title: "按导视前往门诊入口", detail: "步行约 6 分钟到门诊分诊区。" }
      ],
      externalLabel: "打开高德导航",
      externalUrl: buildAmapNavigationUrl({
        mode: "drive",
        destinationName: `${input.hospitalName}停车楼`,
        lat: input.hospitalLat,
        lng: input.hospitalLng
      })
    }
  };
}

export function buildIndoorRoutePlan(input: {
  hospitalName: string;
  hospitalLat: number;
  hospitalLng: number;
  department: string;
  focus: MapPointKind;
}) {
  const stepMap: Record<MapPointKind, RoutePlan> = {
    entrance: {
      mode: "taxi",
      label: "门诊入口",
      eta: "步行 2 分钟",
      distanceLabel: "院内步行约 120 m",
      summary: `从 ${input.hospitalName} 门诊入口进入后，右转可看到导诊屏和上楼电梯。`,
      steps: [
        { key: "1", kind: "indoor", title: "进入门诊大厅", detail: "先看右侧导诊屏确认楼层。" },
        {
          key: "2",
          kind: "indoor",
          title: "乘电梯到 3 楼",
          detail: `沿指引前往 ${input.department} 分诊台。`
        }
      ],
      externalLabel: "查看院内导视",
      externalUrl: buildAmapNavigationUrl({
        mode: "taxi",
        destinationName: `${input.hospitalName}门诊入口`,
        lat: input.hospitalLat,
        lng: input.hospitalLng
      })
    },
    parking: {
      mode: "drive",
      label: "停车场",
      eta: "步行 6 分钟",
      distanceLabel: "停车场到门诊约 280 m",
      summary: "适合自驾到院后先确认电梯和楼层，避免从地下停车场走错出口。",
      steps: [
        { key: "1", kind: "parking", title: "从 B2 停车区前往电梯厅", detail: "沿电梯标识前往 3 号电梯。" },
        { key: "2", kind: "indoor", title: "上到 1 楼门诊大厅", detail: "出电梯后左转进入门诊大厅。" }
      ],
      externalLabel: "查看院内导视",
      externalUrl: buildAmapNavigationUrl({
        mode: "drive",
        destinationName: `${input.hospitalName}停车楼`,
        lat: input.hospitalLat,
        lng: input.hospitalLng
      })
    },
    triage: {
      mode: "taxi",
      label: "分诊台",
      eta: "步行 2 分钟",
      distanceLabel: "院内步行约 140 m",
      summary: `到院后优先去 ${input.department} 分诊台报到。`,
      steps: [
        { key: "1", kind: "indoor", title: "乘电梯到 3 楼", detail: `跟着 ${input.department} 标识走。` },
        { key: "2", kind: "arrival", title: "完成报到后候诊", detail: "护士会告知当前号段和下一步安排。" }
      ],
      externalLabel: "查看院内导视",
      externalUrl: buildAmapNavigationUrl({
        mode: "taxi",
        destinationName: `${input.hospitalName}${input.department}分诊台`,
        lat: input.hospitalLat,
        lng: input.hospitalLng
      })
    },
    pharmacy: {
      mode: "taxi",
      label: "药房",
      eta: "步行 4 分钟",
      distanceLabel: "院内步行约 220 m",
      summary: "看诊结束后再下楼去药房，路线更直接，也不容易遗漏取药窗口。",
      steps: [
        { key: "1", kind: "indoor", title: "从门诊楼下到 1 楼", detail: "沿西侧电梯或扶梯下楼。" },
        { key: "2", kind: "arrival", title: "前往 3 号药房窗口", detail: "预计排队 6 分钟。" }
      ],
      externalLabel: "查看院内导视",
      externalUrl: buildAmapNavigationUrl({
        mode: "taxi",
        destinationName: `${input.hospitalName}药房`,
        lat: input.hospitalLat,
        lng: input.hospitalLng
      })
    }
  };

  return stepMap[input.focus];
}
