# 千问接入说明

当前项目的 `chat-v2` 已经支持调用真实大模型，并保持以下回退策略：

- 配置了 `DASHSCOPE_API_KEY`：优先走通义千问 / 百炼兼容接口
- 未配置或调用失败：自动回退为本地 fallback 文案

## 1. 推荐接法：通义千问 / 百炼

在项目根目录执行：

```bash
npx supabase secrets set DASHSCOPE_API_KEY=你的-dashscope-key DASHSCOPE_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1 DASHSCOPE_MODEL=qwen-plus
```

说明：

- `DASHSCOPE_API_KEY` 必填
- `DASHSCOPE_BASE_URL` 需要和你的 key 所属环境一致；你当前这把 key 只验证通过了国内节点
- `DASHSCOPE_MODEL` 默认是 `qwen-plus`

如果你想用你贴出来那条更强的模型，也可以改成：

```bash
npx supabase secrets set DASHSCOPE_MODEL=qwen3.6-plus
```

## 2. 重新部署聊天函数

```bash
npx supabase functions deploy chat-v2
```

## 3. 本地前端不用暴露模型 key

前端只需要继续保留：

```bash
EXPO_PUBLIC_SUPABASE_URL=https://你的-project-ref.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=你的-anon-key
```

模型 key 只放在 Supabase Functions 侧，不放进 Expo 客户端。

## 4. 当前消息输出协议

`chat-v2` 返回的是结构化消息 JSON，前端直接交给 `MessageRenderer`：

- `system`
- `text`
- `featureCard`
- `summaryCard`

这样后续可以继续扩展，但不会让模型直接输出不可控的界面结构。

## 5. 当前实现边界

这版已经能做到：

- 根据用户输入调用真实大模型
- 返回结构化聊天消息
- 将消息写入 `chat_messages`
- 更新 `consultation_sessions`

这版还没有做：

- 多轮对话历史回灌给模型
- 医学知识库检索
- 医疗安全规则的更细致分诊校验

如果后面要继续增强，优先顺序建议是：

1. 带最近 5 到 10 条消息上下文请求模型
2. 为不同就诊阶段拆更细的 prompt 模板
3. 加一个服务端的医疗安全兜底规则层
