# 医宝 MVP：App 搭建进度梳理

## 1. 文档定位

本文档用于整理当前仓库中已经落地的 App 工程搭建进度，重点说明“代码已经做到哪里、哪些能力是可运行骨架、哪些仍是 mock 或 fallback”。

它与 `docs/产品功能树与当前进度计划.md` 的区别是：

- 产品功能树文档偏产品规划、页面方向和设计推进。
- 本文档偏工程实现、前后端边界、数据结构和当前真实完成度。

当前项目是一个面向银发用户的“AI 陪诊”MVP，技术栈以 Expo Router + React Native 为前端主体，Supabase Edge Functions / Vercel Functions 作为云端接口骨架，Supabase Postgres 作为会话、消息和场景事件的数据承接层。

## 2. 当前项目概况

### 2.1 技术栈

- 前端框架：Expo + React Native + Expo Router
- 状态管理：React Context，本地维护 MVP 主流程状态
- UI 形态：单页对话流 + 结构化消息卡片
- 云端接口：Supabase Edge Functions 为主，Vercel API Routes 保留路线接口入口
- 数据库：Supabase Postgres，已提供 MVP 初始化迁移
- AI 接入：DashScope / Qwen 兼容 OpenAI Chat Completions 接口
- 路线能力：当前以 mock 路线规划为主，支持外跳高德导航 URL

### 2.2 关键代码位置

- App 主入口与主链路：`app/index.tsx`
- App 根布局与 Provider 注入：`app/_layout.tsx`
- 主流程状态：`store/MvpFlowContext.tsx`
- 云端调用封装：`lib/cloudApi.ts`
- 症状识别与号源规则：`lib/chatEngine.ts`
- 路线服务封装：`lib/routeService.ts`
- 路线规划 mock：`lib/routePlanning.ts`
- 场景推送规则：`lib/sceneEngine.ts`
- 后端类型定义：`types/backend.ts`
- Supabase 数据库迁移：`supabase/migrations/20260408_init_mvp.sql`
- Supabase Edge Functions：`supabase/functions/*`

## 3. 当前可运行主链路

当前 App 已经不是静态页面原型，而是围绕 `step` 状态推进的一条对话式就医主链路。用户可以通过输入栏文本、快捷按钮和卡片选项逐步推进流程。

### 3.1 已接通的主流程节点

1. 症状输入
   - 用户输入症状，或点击预设症状建议。
   - 当前支持咳嗽、咽喉不适、肠胃不适、发热等症状 profile。

2. 风险追问
   - 根据症状 profile 展示风险问题。
   - 支持“是 / 否”二选一卡片，也支持用户自由输入后解析。

3. 初步分诊与科室建议
   - 根据症状规则给出推荐科室、初步判断、护理建议和替代科室。
   - 当前属于规则 + AI 结构化返回结合的 MVP 形态。

4. 医院选择
   - 使用 mock 医院数据展示候选医院。
   - 支持通过文本识别“第一家 / 第二家 / 医院名”等选择。

5. 挂号偏好
   - 支持今天下午、明天上午、普通号、专家号等偏好解析。
   - 偏好会进入后续云端 prompt 上下文。

6. 号源确认
   - 按症状 profile 与医院返回对应 mock 号源。
   - 支持选择医生号源，并进入挂号确认态。

7. 到院路线
   - 支持打车、公交 / 地铁、自驾三种路线模式。
   - 支持院内入口、停车、分诊台、药房等焦点位置切换。
   - 可生成高德导航外跳 URL。

8. 院中状态承接
   - 已覆盖到院、缴费、检查结果、回科室、取药等后半程动作。
   - App 会根据状态和位置生成对应场景提醒卡。

9. 诊后承接
   - 当前主流程末尾已推进到诊后计划和用药提醒意图。
   - 具体真实提醒、档案详情和长期随访仍待后续实现。

### 3.2 辅助分支

- 家属代办：挂号确认后的阶段可以开启 `family_proxy` 模式，当前返回 mock 家属身份与权限。
- 志愿者协助：到院后的阶段可以发起志愿者请求，当前返回 mock 集合点、ETA 和说明。
- 输入排队：云端回复等待中，用户继续发送的输入会先进入队列，等上一轮完成后自动处理。
- 重置流程：输入“重新开始 / 重来 / reset”等关键词可重置本轮会话。

## 4. 前端搭建进度

### 4.1 页面与状态

- `app/_layout.tsx` 已完成 Expo Router 根布局，注入 `MvpFlowProvider` 并隐藏默认 header。
- `app/index.tsx` 是当前唯一核心页面，承载完整 MVP 对话流程。
- `store/MvpFlowContext.tsx` 维护症状、风险回答、科室、医院、时间偏好、专家偏好和号源选择。

当前前端状态分两层：

- 全局 MVP 流程状态：由 `MvpFlowContext` 保存，便于跨组件共享。
- 页面局部推进状态：由 `app/index.tsx` 内部维护，例如 `step`、`sessionId`、路线模式、场景状态、家属代办、志愿者请求、云端消息批次等。

### 4.2 消息渲染体系

当前已经抽象出一套结构化消息渲染组件：

- `ChatScreen`：对话页面容器。
- `MessageList`：消息列表布局。
- `MessageRenderer`：根据 `ChatMessage.kind` 分发不同卡片。
- `MessageItem` / `ChatBubble`：基础消息气泡。
- `InfoCard` / `PillTag` / `OptionChip` / `ActionButton`：卡片、标签、选项和按钮。
- `LbsMapCard`：路线与院内导航卡片。
- `ChatComposer`：底部输入栏和快捷动作入口。

已支持的消息类型包括：

- 普通文本消息
- 系统提示
- 快捷 chip 组
- 功能卡片
- 二选一卡片
- 多组选项卡片
- 选择列表卡片
- 摘要卡片
- 地图 / 路线卡片
- 自定义节点

### 4.3 视觉与交互基调

- `styles/theme.ts` 已定义暖橙主色、柔和背景、文字色、辅助蓝绿红色和基础圆角。
- 当前视觉方向延续“轻医疗、温和陪伴、适合老人阅读”的基调。
- 输入栏快捷动作会根据流程阶段动态变化，例如语音描述、上传图片、同步档案、选择风险、选择时间、打车、缴费、取药、设置提醒等。

### 4.4 当前前端边界

已完成：

- 单页 MVP 主链路可运行。
- 核心消息卡片类型可渲染。
- 流程推进、选择、输入解析、云端等待、输入排队和重置已具备。
- 家属代办、志愿者协助、路线卡和场景提醒已具备前端承接。

仍待补齐：

- 多页面正式导航结构。
- 真实登录、用户档案和个人设置页面。
- 医疗档案详情页、提醒管理页、长期诊后管理页。
- 语音、图片上传、档案同步等入口目前只是交互占位或预填输入。
- 更完整的错误态、加载态、空态和可访问性验证。

## 5. 云端与后端搭建进度

### 5.1 Supabase 数据表

`supabase/migrations/20260408_init_mvp.sql` 已建立 MVP 所需的基础表：

- `profiles`：用户 profile，包含角色、昵称、手机号等。
- `consultation_sessions`：就诊会话，记录症状、就诊状态、代办模式。
- `chat_messages`：结构化聊天消息，使用 `payload jsonb` 存储卡片数据。
- `appointments`：预约记录，记录医院、科室、医生、时间和状态。
- `scene_events`：场景触发事件，记录状态、位置和原始 payload。
- `delegate_requests`：代办请求，记录代办人、关系、权限和状态。

当前迁移提供的是 MVP 数据模型骨架，尚未看到完整 RLS 策略、真实用户鉴权绑定和生产级索引设计。

### 5.2 Supabase Edge Functions

当前已实现的核心函数包括：

- `chat-v2`
  - 接收本轮用户输入和上下文。
  - 读取最近聊天历史。
  - 调用 Qwen 生成结构化消息。
  - upsert `consultation_sessions`。
  - insert 用户消息与模型消息到 `chat_messages`。

- `encounter-status`
  - 接收会话 ID 和就诊状态。
  - 更新 `consultation_sessions.encounter_status`、`delegation_mode` 和 `updated_at`。

- `scene-push-v2`
  - 根据就诊状态、位置、预约、代办和志愿者上下文生成场景消息。
  - 写入 `scene_events`。
  - 如有生成消息，则写入 `chat_messages`。

- `route-plans`
  - 返回打车、公交 / 地铁、自驾三种路线方案。
  - 当前返回 mock 路线数据。

- `route-indoor`
  - 返回院内入口、停车、分诊台、药房等焦点路线。
  - 当前返回 mock 院内导视数据。

仓库中还保留 `chat`、`scene-push` 等早期版本函数，当前主流程更偏向使用 `chat-v2` 与 `scene-push-v2`。

### 5.3 Vercel API Routes

`api/route/plans.ts` 和 `api/route/indoor.ts` 提供了 Vercel Functions 风格的路线接口入口。

当前这两个接口同样基于 `lib/routePlanning.ts` 的 mock 路线规划能力返回结果，可作为 Supabase Edge Functions 之外的 BFF 方案备选。

## 6. AI 与提示词搭建进度

### 6.1 前端 prompt 封装

`lib/cloudApi.ts` 会通过 `buildChatPrompt` 生成 prompt packet，并把 `promptVersion` 传给 `chat-v2`。

当前前端发往云端的上下文包括：

- `sessionId`
- `prompt`
- `symptom`
- `preferredTime`
- `expertPreference`
- `appointment`
- `encounterStatus`
- `location`
- `delegationMode`

### 6.2 云端模型调用

`supabase/functions/_shared/openai-chat.ts` 已接入 DashScope / Qwen 兼容接口：

- 默认 base URL：`https://dashscope.aliyuncs.com/compatible-mode/v1`
- 默认模型：`qwen-plus`
- API Key 环境变量：`DASHSCOPE_API_KEY` 或 `LLM_API_KEY`
- 当前 prompt version：`silver-companion-v3-qwen`

云端要求模型返回结构化 JSON，并映射成前端可渲染的消息对象，包括：

- `system`
- `text`
- `summaryCard`
- `featureCard`

### 6.3 fallback 机制

当前 fallback 边界比较清楚：

- 如果前端没有配置 Supabase URL / anon key，则 `lib/cloudApi.ts` 返回本地延迟模拟结果。
- 如果云端没有配置 Qwen API Key，则 `openai-chat.ts` 返回 fallback 结构化消息。
- 如果模型 HTTP 调用失败、输出为空或 schema 解析失败，也会返回 fallback 消息，并在 `debug.detail` 中记录原因。

这意味着当前 App 在无真实云端或无模型 Key 的情况下仍可演示主流程，但真实智能程度取决于云端环境变量和模型服务是否配置完成。

## 7. 数据与 Mock 搭建进度

### 7.1 症状与分诊规则

`lib/chatEngine.ts` 已内置 4 类症状 profile：

- 咳嗽：推荐呼吸内科。
- 咽喉不适：推荐耳鼻喉科。
- 肠胃不适：推荐消化内科。
- 发热：推荐全科门诊。

每个 profile 包含：

- 标题
- 推荐科室
- 初步说明
- 护理建议
- 替代科室
- 医院推荐说明
- 风险追问
- 风险提示
- 按医院区分的 mock 号源

### 7.2 医院与号源

`data/mock.ts` 已提供两家 mock 医院：

- 浙大一院
- 省人民医院

同时提供默认呼吸内科号源。更细分的按症状号源在 `lib/chatEngine.ts` 中维护。

### 7.3 路线规划

`lib/routePlanning.ts` 已提供：

- 打车路线
- 公交 / 地铁路线
- 自驾路线
- 高德导航 URL 拼接
- 门诊入口院内路线
- 停车场到门诊路线
- 分诊台路线
- 药房路线

当前路线内容是 mock 规划，不是实时高德路线计算结果。

### 7.4 场景推送

`lib/sceneEngine.ts` 和 `supabase/functions/_shared/scene-messages.ts` 已具备按状态 + 位置生成提醒卡的规则骨架。

当前覆盖的关键场景包括：

- 到院提醒
- 待缴费提醒
- 部分结果已出
- 取药提醒
- 志愿者协助已发起
- 家属代办已开启

## 8. 当前完成度总结

### 8.1 已真实落地的工程能力

- Expo / React Native 项目基础结构已搭好。
- Expo Router 根布局和单页主链路已可运行。
- 对话流、消息卡片、输入栏和路线卡片组件已完成基础抽象。
- MVP 主流程状态推进已接通。
- 症状 profile、医院选择、号源选择和偏好解析已具备规则实现。
- Supabase 数据表迁移已提供 MVP 基础模型。
- Supabase Edge Functions 已覆盖聊天、状态同步、场景推送和路线接口。
- Qwen 结构化输出链路已具备云端实现。
- 云端与模型不可用时有 fallback，便于本地演示。

### 8.2 已有骨架但仍偏 mock 的能力

- 医院、医生、号源数据目前是本地 mock。
- 路线规划和院内导航目前是 mock 文案与步骤。
- 家属代办和志愿者协助目前由前端 mock 返回固定对象。
- 语音、图片、档案同步入口当前主要用于演示交互，还没有真实上传和识别链路。
- 诊后提醒和医疗档案已有流程承接意图，但未形成完整可管理功能。

### 8.3 待补齐的真实产品能力

- 真实用户登录、身份权限和 RLS 策略。
- 真实医院、科室、医生和号源接口。
- 真实挂号、支付、取消、改约能力。
- 真实 LBS、到院检测和高德路线规划接口。
- 真实院内地图、窗口、楼层和排队信息。
- 家属代办邀请、通知和权限确认链路。
- 志愿者请求的真实派单和状态回传。
- 医疗档案归档、处方同步、用药提醒和复诊提醒。
- 端到端测试、单元测试、异常态测试和生产监控。

## 9. 当前推进建议

下一阶段建议按“先闭环、再真实接入”的顺序推进：

1. 固化当前 MVP 主链路
   - 先保证本地无云端配置时也能完整演示。
   - 梳理每个 `step` 对应的状态、消息和卡片。

2. 补齐真实云端环境
   - 部署 Supabase migration。
   - 配置 Supabase URL、anon key、service role key 和 Qwen API Key。
   - 验证 `chat-v2`、`encounter-status`、`scene-push-v2` 是否能真实写库。

3. 替换关键 mock
   - 优先替换医院 / 号源数据。
   - 再替换路线规划和位置触发。
   - 最后替换家属代办、志愿者协助和诊后提醒。

4. 增加验证体系
   - 为症状解析、偏好解析、路线构造和 scene push 规则补单元测试。
   - 为主链路补一条端到端演示脚本。
   - 为云函数补请求参数校验和错误返回验证。

## 10. 一句话结论

当前医宝 MVP 已完成“对话式 AI 陪诊主链路 + 云端状态/消息/场景推送骨架”的工程搭建，具备完整演示价值；但医院号源、路线、代办、志愿者、档案和提醒等外部依赖仍主要停留在 mock 或接口骨架阶段，下一步重点应放在真实数据接入和端到端验证。
