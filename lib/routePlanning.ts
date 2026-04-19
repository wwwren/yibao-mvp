import type { Hospital } from "../data/mock";
import type { LocationSnapshot } from "../types/backend";
import type { MapMode, MapPointKind } from "../types/chat";

export type RouteStepKind =
  | "walk"
  | "subway"
  | "taxi"
  | "drive"
  | "parking"
  | "arrival"
  | "indoor";

export type RouteStep = {
  key: string;
  kind: RouteStepKind;
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

type RouteContext = {
  origin: LocationSnapshot;
  hospital: Hospital;
};

type IndoorRouteContext = {
  hospital: Hospital;
  department: string;
  focus: MapPointKind;
};

export function buildAmapNavigationUrl({
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

export function buildMockRoutePlans({
  origin,
  hospital
}: RouteContext): Record<MapMode, RoutePlan> {
  const distanceLabel =
    origin.distanceToHospitalMeters && origin.distanceToHospitalMeters > 1000
      ? `距医院约 ${(origin.distanceToHospitalMeters / 1000).toFixed(1)} km`
      : `距医院约 ${origin.distanceToHospitalMeters ?? 1200} m`;

  return {
    taxi: {
      mode: "taxi",
      label: "打车前往",
      eta: "18 分钟",
      distanceLabel,
      summary: "推荐在门诊楼东侧临停区下车，少走一段路，比较适合老人直接到门口。",
      steps: [
        {
          key: "taxi-call",
          kind: "taxi",
          title: "呼叫网约车",
          detail: "预计 3 分钟上车，司机会在小区南门接你。"
        },
        {
          key: "taxi-route",
          kind: "taxi",
          title: "沿城市主干道直达医院",
          detail: `全程约 7.2 km，预计 18 分钟到 ${hospital.name}。`
        },
        {
          key: "taxi-dropoff",
          kind: "arrival",
          title: "门诊楼东侧下车",
          detail: "下车后步行约 120 米，进入门诊大厅更顺。"
        }
      ],
      externalLabel: "打开高德导航",
      externalUrl: buildAmapNavigationUrl({
        mode: "taxi",
        destinationName: `${hospital.name}门诊楼`,
        lat: hospital.lat,
        lng: hospital.lng
      })
    },
    transit: {
      mode: "transit",
      label: "公交 / 地铁",
      eta: "31 分钟",
      distanceLabel,
      summary: "优先推荐地铁 + 短接驳步行的路线，换乘少，适合路线更明确的出行方式。",
      steps: [
        {
          key: "transit-walk",
          kind: "walk",
          title: "步行到最近地铁口",
          detail: "先步行 260 米到凤起路站 D 口。"
        },
        {
          key: "transit-subway",
          kind: "subway",
          title: "乘坐 2 号线",
          detail: "往良渚方向坐 4 站，到庆春广场站下车。"
        },
        {
          key: "transit-transfer",
          kind: "subway",
          title: "换乘医院接驳车",
          detail: "C 口出站后步行 90 米，换乘院区接驳巴士 1 站。"
        },
        {
          key: "transit-arrival",
          kind: "arrival",
          title: "从门诊入口进院",
          detail: "下车后再步行 180 米，就能到门诊楼主入口。"
        }
      ],
      externalLabel: "打开高德路线",
      externalUrl: buildAmapNavigationUrl({
        mode: "transit",
        destinationName: `${hospital.name}门诊楼`,
        lat: hospital.lat,
        lng: hospital.lng
      })
    },
    drive: {
      mode: "drive",
      label: "自驾",
      eta: "22 分钟",
      distanceLabel,
      summary: "停车库还有空位，自驾更灵活，但要预留步行和电梯上楼时间。",
      steps: [
        {
          key: "drive-route",
          kind: "drive",
          title: "导航到门诊停车楼",
          detail: `建议直接导航到 ${hospital.name} B2 停车库入口。`
        },
        {
          key: "drive-parking",
          kind: "parking",
          title: "停车后换乘电梯",
          detail: "当前剩余车位约 18 个，B2 电梯可直达 1 楼大厅。"
        },
        {
          key: "drive-arrival",
          kind: "arrival",
          title: "按导视前往门诊入口",
          detail: "出电梯后右转，步行约 6 分钟到门诊分诊区。"
        }
      ],
      externalLabel: "打开高德导航",
      externalUrl: buildAmapNavigationUrl({
        mode: "drive",
        destinationName: `${hospital.name}停车楼`,
        lat: hospital.lat,
        lng: hospital.lng
      })
    }
  };
}

export function buildMockIndoorRoutePlan({
  hospital,
  department,
  focus
}: IndoorRouteContext): RoutePlan {
  const stepMap: Record<MapPointKind, RoutePlan> = {
    entrance: {
      mode: "taxi",
      label: "门诊入口",
      eta: "步行 2 分钟",
      distanceLabel: "院内步行约 120 m",
      summary: `从 ${hospital.name} 门诊入口进入后，右转可看到导诊屏和上楼电梯。`,
      steps: [
        {
          key: "indoor-entrance-1",
          kind: "indoor",
          title: "进入门诊大厅",
          detail: "进门后先看右侧导诊屏，确认楼层和分诊台位置。"
        },
        {
          key: "indoor-entrance-2",
          kind: "indoor",
          title: "乘电梯到 3 楼",
          detail: `到 3 楼后沿指引前往 ${department} 分诊台。`
        }
      ],
      externalLabel: "查看院内导视",
      externalUrl: buildAmapNavigationUrl({
        mode: "taxi",
        destinationName: `${hospital.name}门诊入口`,
        lat: hospital.lat,
        lng: hospital.lng
      })
    },
    parking: {
      mode: "drive",
      label: "停车场",
      eta: "步行 6 分钟",
      distanceLabel: "停车场到门诊约 280 m",
      summary: "适合自驾到院后先确认电梯和楼层，避免从地下停车场走错出口。",
      steps: [
        {
          key: "indoor-parking-1",
          kind: "parking",
          title: "从 B2 停车区前往电梯厅",
          detail: "找到蓝色导视柱，沿电梯标识前往 3 号电梯。"
        },
        {
          key: "indoor-parking-2",
          kind: "indoor",
          title: "上到 1 楼门诊大厅",
          detail: "出电梯后左转进入门诊大厅，再看导诊屏。"
        }
      ],
      externalLabel: "查看院内导视",
      externalUrl: buildAmapNavigationUrl({
        mode: "drive",
        destinationName: `${hospital.name}停车楼`,
        lat: hospital.lat,
        lng: hospital.lng
      })
    },
    triage: {
      mode: "taxi",
      label: "分诊台",
      eta: "步行 2 分钟",
      distanceLabel: "院内步行约 140 m",
      summary: `到院后优先去 ${department} 分诊台报到，后面的候诊和检查都会更顺。`,
      steps: [
        {
          key: "indoor-triage-1",
          kind: "indoor",
          title: "乘电梯到 3 楼",
          detail: `跟着 ${department} 标识走，到分诊台先报到。`
        },
        {
          key: "indoor-triage-2",
          kind: "arrival",
          title: "完成报到后候诊",
          detail: "护士会告知你当前号段和下一步检查安排。"
        }
      ],
      externalLabel: "查看院内导视",
      externalUrl: buildAmapNavigationUrl({
        mode: "taxi",
        destinationName: `${hospital.name}${department}分诊台`,
        lat: hospital.lat,
        lng: hospital.lng
      })
    },
    pharmacy: {
      mode: "taxi",
      label: "药房",
      eta: "步行 4 分钟",
      distanceLabel: "院内步行约 220 m",
      summary: "看诊结束后再下楼去药房，路线更直接，也不容易遗漏取药窗口。",
      steps: [
        {
          key: "indoor-pharmacy-1",
          kind: "indoor",
          title: "从门诊楼下到 1 楼",
          detail: "沿西侧电梯或扶梯下楼，朝药房窗口方向走。"
        },
        {
          key: "indoor-pharmacy-2",
          kind: "arrival",
          title: "前往 3 号药房窗口",
          detail: "处方同步后刷电子码即可取药，预计排队 6 分钟。"
        }
      ],
      externalLabel: "查看院内导视",
      externalUrl: buildAmapNavigationUrl({
        mode: "taxi",
        destinationName: `${hospital.name}药房`,
        lat: hospital.lat,
        lng: hospital.lng
      })
    }
  };

  return stepMap[focus];
}
