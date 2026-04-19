# 医宝 MVP：System Prompt 调优与评估

## 1. 调优目标

这个项目里的大模型，不追求“像医生一样诊断”，而追求 3 件事：

- 先安抚，再追问，再给下一步
- 面向老人本人，语言必须短句、低术语、可执行
- 输出要结构化，方便前端渲染为气泡、结果卡、提醒卡

## 2. 当前提示词版本

当前提示词代码：
- [prompting.ts](/Users/gujinyu/Documents/Playground/ai医疗问诊/lib/prompting.ts)

当前版本号：
- `silver-companion-v2`

核心改进点：
- 从“泛问诊助手”改成“银发陪诊助手”
- 强制输出节奏为：安抚 -> 风险追问 -> 初步判断 -> 下一步动作
- 加入 `delegationMode`、`encounterStatus`、`location` 等字段，支持家属代办和场景推流

## 3. 最小评估样例

评估样例数据：
- [promptEval.ts](/Users/gujinyu/Documents/Playground/ai医疗问诊/data/promptEval.ts)

目前覆盖 4 类高频症状：
- 咳嗽
- 咽喉不适
- 肠胃不适
- 发热

每条样例至少验证：
- 推荐科室是否合理
- 风险追问是否对焦
- 语言是否足够通俗
- 是否给出明确下一步

## 4. 面试中可以强调的调优方法

- 先定义评估维度，而不是直接堆 prompt：
  - 科室准确性
  - 风险追问覆盖度
  - 老年友好表达
  - 下一步行动明确度

- 用固定 case 反复比较 prompt 版本，而不是只看单次主观感觉

- 将输出约束成结构化消息，降低模型“说很多但不落地”的问题

## 5. 当前项目代码中的落地点

- 提示词构建：[prompting.ts](/Users/gujinyu/Documents/Playground/ai医疗问诊/lib/prompting.ts)
- 症状理解与 mock 分流：[chatEngine.ts](/Users/gujinyu/Documents/Playground/ai医疗问诊/lib/chatEngine.ts)
- 单页消息流渲染：[index.tsx](/Users/gujinyu/Documents/Playground/ai医疗问诊/app/index.tsx)
- 消息协议与渲染器：
  - [chat.ts](/Users/gujinyu/Documents/Playground/ai医疗问诊/types/chat.ts)
  - [MessageRenderer.tsx](/Users/gujinyu/Documents/Playground/ai医疗问诊/components/MessageRenderer.tsx)

## 6. 更稳的简历表达

如果你还没有接入真实线上模型，建议在简历中写：

- 设计并持续调试面向老年陪诊场景的 system prompt，建立包含症状、状态、代办角色在内的结构化输入约束
- 通过固定评估样例对 prompt 版本进行迭代，优化初步分诊与行动建议的输出稳定性

比“显著提升准确率”更稳，也更不容易在面试里被追着问具体医学指标。
