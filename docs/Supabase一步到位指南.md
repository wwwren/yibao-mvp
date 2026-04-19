# Supabase 一步到位指南

这份项目现在已经补好了 Supabase 的最小后端骨架，目标是让你：

1. 先把 Expo 前端继续跑起来
2. 再用 Supabase 接数据库和云函数
3. 后面逐步把 mock 替换成真服务

## 现在仓库里已经有什么

- 前端 Supabase 入口：`lib/supabaseClient.ts`
- 路线服务接入层：`lib/routeService.ts`
- Supabase Functions：
  - `supabase/functions/route-plans`
  - `supabase/functions/route-indoor`
  - `supabase/functions/chat`
  - `supabase/functions/scene-push`
- 数据库迁移：
  - `supabase/migrations/20260408_init_mvp.sql`

## 第一步：创建 Supabase 项目

去 [Supabase Dashboard](https://supabase.com/dashboard) 新建一个 project。

创建好之后，你会拿到：

- `Project URL`
- `anon public key`

## 第二步：配置前端环境变量

在项目根目录新建 `.env`，参考 `.env.example`：

```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-public-anon-key
```

## 第三步：本地登录 Supabase CLI

如果你还没装：

```bash
brew install supabase/tap/supabase
```

然后登录：

```bash
supabase login
```

## 第四步：把这个项目链接到你的 Supabase 项目

```bash
supabase link --project-ref your-project-ref
```

## 第五步：推数据库表

```bash
supabase db push
```

这一步会把 `supabase/migrations/20260408_init_mvp.sql` 里的表结构推上去。

## 第六步：部署云函数

先部署路线和聊天相关函数：

```bash
supabase functions deploy route-plans
supabase functions deploy route-indoor
supabase functions deploy chat
supabase functions deploy scene-push
```

## 第七步：让前端直接吃 Supabase Functions

你现在不用再单独配 `EXPO_PUBLIC_ROUTE_API_BASE_URL`。

只要配好：

```bash
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
```

前端会优先请求：

- `/functions/v1/route-plans`
- `/functions/v1/route-indoor`

请求失败时，会自动回退到本地 mock。

## 当前最推荐的推进顺序

1. 先把 Supabase 项目建好
2. 先把 `route-plans` 和 `route-indoor` 部署起来
3. 确认地图卡能吃到云端数据
4. 再开始接 `chat` 和 `scene-push`
5. 最后再把 OpenAI / 高德 key 放进函数环境变量

## 你现在最先要做的 3 个命令

```bash
supabase login
supabase link --project-ref your-project-ref
supabase db push
```
