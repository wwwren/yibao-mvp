export type PromptEvalCase = {
  id: string;
  userInput: string;
  expectedDepartment: string;
  expectedRiskFocus: string;
  expectedStyle: string;
};

export const promptEvalCases: PromptEvalCase[] = [
  {
    id: "case-cough",
    userInput: "我咳嗽四天了，晚上更明显，没有发烧。",
    expectedDepartment: "呼吸内科",
    expectedRiskFocus: "高热、咯血、呼吸困难",
    expectedStyle: "短句、安抚、避免术语堆叠"
  },
  {
    id: "case-throat",
    userInput: "喉咙痛两天了，吞口水有点难受。",
    expectedDepartment: "耳鼻喉科",
    expectedRiskFocus: "吞咽困难、影响呼吸、持续高热",
    expectedStyle: "先解释再给行动建议"
  },
  {
    id: "case-stomach",
    userInput: "肚子不舒服，还想吐，吃了东西就难受。",
    expectedDepartment: "消化内科",
    expectedRiskFocus: "剧烈腹痛、便血、频繁呕吐",
    expectedStyle: "护理建议要具体，可执行"
  },
  {
    id: "case-fever",
    userInput: "今天有点发烧，感觉浑身没力气。",
    expectedDepartment: "全科门诊",
    expectedRiskFocus: "反复高热、意识状态、胸闷气短",
    expectedStyle: "明确观察点与就医阈值"
  }
];
