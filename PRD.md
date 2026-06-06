# GripFit · 用户端 PRD

> 一份手机握持舒适度数字化辅助系统的设计 PRD。覆盖 16 个页面、内部状态机、评分逻辑、设计系统。
> 仓库：`grip-fit-version-3.0` · 主干分支：`v3.0-merged-intake`

---

## 1. 项目定位

GripFit 是一个面向消费者的手机选型工具：基于用户的手部数据（手长 + 手宽），结合 GB/T 10000-1988 中国成年人体尺寸 + AHP 层次分析法，对市售 22 款主流机型评分排序，并提供 18 维度的握持手感报告 + 自定义参数微调 + 多机型对比 + 历史归档。

**目标用户**：选购手机时关心握持舒适度的消费者。
**核心价值**：把"手感好不好"从主观感受变成 18 个可量化、可对比的维度。

---

## 2. 技术栈

| 层 | 选型 |
|---|---|
| 前端框架 | React 18 + TypeScript + Vite 5 |
| 路由 | react-router-dom v6 |
| 动画 | framer-motion 11 |
| 图标 | lucide-react |
| 手部识别 | @mediapipe/tasks-vision (HandLandmarker) |
| 状态持久化 | localStorage (key: `gripfit-flow-state-v2`) |
| 部署 | Vercel |

---

## 3. 路由 / 页面总览

### 3.1 入口段（独立布局，无 AppShell）

| 路由 | 页面 | 用途 |
|---|---|---|
| `/` | HomePage | 粒子 GRIPFIT 标题 + Hero 手机 + 滚动渐入分析流程介绍 |
| `/role-select` | RoleSelectPage | 消费者 / 企业人员二选一 |
| `/login` | LoginPage | 邮箱密码登录（视觉演示） |
| `/onboarding` | OnboardingPage | 4 张卡片轮播介绍 4 大功能 |
| `/profile-info` | ProfileInfoPage | 4 阶段 onboarding 主流程（见 §4） |
| `/hand-recognition` | HandRecognitionPage | 独立可访问的虚线对齐引导（已合并进 /profile-info） |
| `/hand-scanning` | HandScanningPage | 独立可访问的摄像头扫描（已合并进 /profile-info） |

### 3.2 工作台段（共用 AppShell：顶导 + 左 icon rail）

| 路由 | 页面 | 用途 |
|---|---|---|
| `/dashboard` | DashboardPage | 中转 hub · snapshot + 5 快捷入口 + Top 3 推荐 |
| `/measure` | MeasurementPage | 手部测量（智能 / 手动） |
| `/tuning` | TuningPage | 参数微调 · 4 视角 + 风险点 |
| `/report/best-phone` | BestPhonePage | 理论最优机型预览 + 10 项参数 |
| `/report` | ReportPage | 18 维度评分详情 |
| `/library` | PhoneLibraryPage | 22 款机型排行榜 + 筛选抽屉 |
| `/phone/:id` | PhoneDetailPage | 单机型详情 |
| `/compare` | ComparePage | 对比清单 + 对比报告 + 导出弹窗 |
| `/my-data` | MyDataPage | 手部数据 + 用户画像 + 历史归档 |

### 3.3 企业端跳出

`/role-select` 选择「企业人员」→ `window.location.href = https://grip-fit-tob.vercel.app/`，由 ToB 子系统接管。

---

## 4. 核心流程：/profile-info 4 阶段状态机

`profile-info` 是 onboarding 主流程，**单页内部用状态机驱动 4 个 stage**，所有阶段共享左侧表单 + 进度条。

```
profile  ──确认提交──▶  scan-active  ──MediaPipe 对齐 1.2s + 分析 3.6s──▶  scan-confirm
   ▲                                                                            │
   └────────────────────────── 重新扫描 ────────────────────────────────────────┘
                                                                  确认进入测量
                                                                       │
                                                                       ▼
                                                                  /measure
```

| Stage | 左侧 | 右侧 |
|---|---|---|
| `profile` | 进度 `01/02` · 性别 + 年龄表单 · 确认提交按钮 | 3 张手持手机产品图 carousel（3.6s 自动切换） |
| `scan-active` | 进度 `02/02`，表单锁定 | MediaPipe 摄像头 + 虚线手掌引导 PNG + 实时 HAND ALIGNMENT 进度条 |
| 同 active 子阶段 alignment → analyzing | 同上 | 对齐成功后进度归零再走 3.6s 的 DIMENSION SCAN |
| `scan-confirm` | 同上 | 抓取的真实摄像头帧（bbox 裁剪） + 手长 / 手宽 chip + 重新扫描 / 确认进入测量按钮 |

**关键交互**：
- 摄像头自动选择前置（桌面）/ 后置（移动 UA），失败时显示 `CAMERA OFFLINE` fallback timer
- 对齐评分公式：`centerDist × 1.8` + `|size − 0.55| × 1.6` 加权 → 阈值 0.50，稳定 0.8s 触发
- 摄像头画面镜像（`scaleX(-1)`）= 自拍视角，举右手在画面右侧
- 数据采样：性别 × 年龄 → GB/T 表查找 → Box-Muller 正态采样 → clamp P5-P95

---

## 5. AppShell 全局布局

工作台段 9 个页面共用同一个 shell。

```
┌─────────────────────────────────────────────────────────────┐
│  GRIPFIT │ 仪表盘  手部测量  机型库  报告产出  │   👤        │  ← topbar 64px
├──────────┼─────────────────────────────────────────────────┤
│ ▢        │                                                  │
│ 📊       │                                                  │
│ ✋ (active)│         <Outlet />                              │
│ ⚙        │                                                  │
│ 📱       │                                                  │
│ 📄       │                                                  │
│ 💾       │                                                  │
└──────────┴─────────────────────────────────────────────────┘
   ↑ rail 64px
```

- **Topbar**：4 项主导航（仪表盘 / 手部测量 / 机型库 / 报告产出）·当前页底部 2px 蓝条·右上头像 → `/my-data`
- **Icon rail**：6 个 lucide 图标（LayoutDashboard / Scan / SlidersHorizontal / Smartphone / FileText / Database）·激活态紫蓝填充 + 边框
- **毛玻璃工具类**：`.glass-pill` / `.glass-card` / `.glass-button` `backdrop-filter: blur(10-14px)`

---

## 6. 各页面详细

### 6.1 / HomePage
- 粒子 GRIPFIT 大字（Canvas 渲染，鼠标扩散 + shimmer 扫光）
- 右侧 hero 手机图，缓慢上下漂浮
- 滚动渐入：第二屏显示「寻找最适合您的智能手机」+ 5 步分析流程介绍
- 「开始体验」按钮 → `/role-select`

### 6.2 /role-select RoleSelectPage
- 两张毛玻璃卡：**消费者**（默认）/ **企业人员**
- 流光背景动画
- 消费者 → `/onboarding`；企业 → 跳 ToB 站
- 左上角加「返回首页」用于 ToB 端跳回（仅 ToB 站有）

### 6.3 /login LoginPage
- 毛玻璃 card · 邮箱 + 密码 + 登录按钮
- 视觉演示，不做真实鉴权

### 6.4 /onboarding OnboardingPage
- CardDeck 组件 · 4 张介绍卡：
  1. 精准手部测量
  2. 智能参数匹配
  3. 你的专属手感报告
  4. 探索、对比与定制
- 左右箭头 / 圆点切换 · 第 3 张后出现「开始使用」CTA → `/profile-info`

### 6.5 /profile-info ProfileInfoPage
见 §4 详述。

### 6.6 /dashboard DashboardPage
- 顶部 snapshot 3 卡：当前手部数据 · 当前最佳匹配 · 对比+收藏数
- 快捷入口 5 卡：测量 / 微调 / 机型库 / 报告 / 我的数据
- Top 3 推荐：按 `scorePhoneForHand` 实时排序

### 6.7 /measure MeasurementPage
**左侧表单**：
- 模式 tab：智能测量（滑条只读）/ 手动调整（滑条可拖）
- 手长 MetricCard：150-220mm · 钟形曲线 + 当前百分位 marker
- 手宽 MetricCard：65-105mm
- 「提交测量 / COMMIT MEASUREMENT」→ `/report/best-phone`
- 「重置为默认 / RESET TO DEFAULT」→ 按当前 gender+age 从 GB/T 重置

**右侧**：
- 大手图（智能 / 手动模式两套图）
- VIEWPORT 浮卡：TOP / LATERAL / PALM / WIRE 通过 CSS transform 切换
- 底部 3 统计：DATA CONFIDENCE / GB/T MATCH / ESTIMATED GRIP WIDTH

**联动**：滑条变化 → `useFlowState` 写 localStorage → 下游所有页面评分自动重算

### 6.8 /report/best-phone BestPhonePage
- 左侧 ReportSubnav 5 项（高亮"最优手机"）
- 中央 stage：
  - 评分环 8.9/10
  - 手持手机产品图（profile-grip-normal.png）
  - 理想尺寸 chip 标签（手宽×0.86 × 手长×0.82 mm）
- 右侧 panel：10 项理论最优参数（实时 `deriveIdealSpec` 派生）
- 「参数微调 →」按钮 → `/tuning`

### 6.9 /tuning TuningPage
**左侧** ReportSubnav（高亮"自定义调参"）

**中央 stage**：
- 实时评分环（拖动右侧滑条会实时变化）
- 手机产品图：
  - 正面 → `hero-phone-cut.png`
  - 背面 / 手持 / 风险点 → `profile-grip-normal.png`
- 4 视角 tab 浮卡：正面 / 背面 / 手持 / 风险点（毛玻璃胶囊 + 当前态渐变蓝）
- 风险点视图：3 个固定红点（镜头模组冲突 / 重量重心 / 圆角压力），hover/click → glass-card callout 浮在底部显示建议文案
- 「显示手部」毛玻璃 toggle（hand/risk 视图自动禁用 + 视为开启）

**右侧 panel**：
- 「方案保存 →」按钮 → `/report`
- 4 可折叠 Section：基本尺寸（4 滑条）/ 功能部件（1 滑条 + 1 单选 + 1 模组单选）/ 形态曲率（1 滑条 + 1 单选）/ 整机平衡（1 滑条）
- RangeRow：标题 + 当前值 + 单位 · 双色滑条（紫蓝填充 + 绿色"理想值"marker）
- 「显示风险热区」toggle = 切换到风险点视图

**评分联动**：所有滑条变化 → `useFlowState` 写 `flow.custom` → `scorePhoneForHand(customAsPhone)` 实时计算 → 评分环数字 + /report 18 维度评分变化

### 6.10 /report ReportPage
- 顶部：标题 + 评估对象 · 分类下拉（全部 / 6 个 group）· 「导出报告」按钮（toast 提示）
- 汇总卡：评分环 + 需关注项数 + 良好项数 + 回参数微调
- 18 维度评分表：
  - 排序：risk → warn → good，相同 status 按权重降序
  - 列：序号 + 状态 icon + 维度名 + group chip · 当前值 · 评分 + bar · AHP 权重 · 展开
  - 展开内容：评估说明 · 响应曲线（inline SVG，颜色随 status）· 优化建议（推荐区间 / 当前 / 理想）
  - 多展开：自由 accordion，可同时开多个

### 6.11 /library PhoneLibraryPage
- 顶部：标题 + 「查看对比 (N)」按钮 → `/compare`
- 统计 2 卡：匹配机型总数 · 最高匹配度机型
- Chip 行 5 个：匹配度区间 / 品牌 / 价格 / 排序 / 筛选
- 排序循环：匹配度 → 价格 → 重量 → 匹配度
- 表格 7 列：排名 / 机型（SVG PhoneVisual + 名 + 日期）/ 关键参数 / 匹配饼 / 评分 / 价格 / 操作（对比 + 收藏 + 详情）
- 22 款机型实时评分排序，分页 6/页
- 筛选抽屉（右侧 360px 滑入）：
  - 品牌 chip 多选
  - 价格 / 屏幕尺寸 / 握持评分 / 重量 / 厚度 5 个 dual-range 双滑条
  - 上市时间 chip（全部 / 一年内 / 近两年 / 更早）
  - 重置 + 显示 N 个结果

### 6.12 /phone/:id PhoneDetailPage
- 返回链接 → `/library`
- Hero card：phone 大图 + 品牌 + 名称 + 日期 + 价格 + 操作（加对比 / 风险详情 / 收藏）+ 双评分环（握持评分 + 匹配度）
- 握持表现概览：3 项进度条（单手握持 / 拇指可达 / 长时舒适度）
- 参数对照：10 项规格
- 18 维度逐项评分：6 group tab + 当前 group 的 dim rows（risk/warn/good 边框着色）
- 完整规格参数 sidebar：6 项 + 资料来源声明

### 6.13 /compare ComparePage
**三态自动切换**：根据 `flow.compareIds.length` 自动选择
- `length === 0` → **empty 态**：3 个虚线 phone outline + CTA「去探索机型库 →」
- `length < 2` → **edit 态**：购物车清单 1-3 张机型卡 + 加号位 + 2 个 toggle 选项 + 「生成对比报告 →」
- `length >= 2` → **result 态**：

**Result 态**：
- 标题 + 编辑清单 / 导出报告按钮
- Strip：「我的最优」基准 + N 个对比机型缩略图 + 综合评分
- 综合评分对比 bar chart（绿色基准线 / 紫蓝 / 橙色）
- 核心 5 项评分对比（宽度 / 重量 / 厚度 / 拇指可达 / 重心）
- 18 维度逐项评分表（risk/warn/good 着色）
- 详细参数对照表（包含理想列）
- 「您的最佳匹配」footer

**导出弹窗**：
- 3 个格式 radio（PDF / IMG / LINK）+ icon tag
- 3 项可选内容 checkbox（综合 / 详细 / 规格）
- 「导出报告」按钮显示「已生成 X 报告 · 演示版」反馈

### 6.14 /my-data MyDataPage
5 个 glass-card 网格布局：
- **手部数据**：手长 + 手宽双 metric（含钟形曲线 + 百分位 marker）· 手型分类 chip（小/中/大） · 重新测量 + 修改画像按钮
- **用户画像**：头像 + 性别 + 年龄段 + 手部分类
- **最优参数**：4 项 deriveIdealSpec 结果 + 查看最优手机 CTA
- **历史记录**：列出 compareIds + favoriteIds 中的机型（或前 3 款 fallback）
- **自定义手机历史**：3 个 mock 方案（已应用 / 草稿 / 已存档）

---

## 7. 数据模型

### 7.1 localStorage 状态（FlowState）

```ts
type FlowState = {
  handLength: number;       // mm
  handWidth: number;        // mm
  gender: 'male' | 'female';
  ageGroup: '18-35' | '36-55' | '56+';
  custom: {                 // /tuning 自定义参数
    width, height, thickness, weight,
    cameraBump, cornerRadius, backArc, centerOfMassOffset
  };
  compareIds: string[];     // 最多 3 个机型 id
  favoriteIds: string[];    // 收藏机型 id
  history: { id, timestamp, label, phoneId? }[];
};
```

钩子：`useFlowState()` 返回 `[state, update]`，写入会派发 `gripfit-flow-state-change` CustomEvent 让其他组件同步。

### 7.2 GB/T 10000-1988 采样表

`HAND_DIMENSIONS[gender][age] = { length: {mean, std, min, max}, width: {...} }` × 6 组合

|  | 男 18-35 | 男 36-55 | 男 56+ | 女 18-35 | 女 36-55 | 女 56+ |
|---|---|---|---|---|---|---|
| 手长 mean | 183 | 184 | 180 | 171 | 172 | 169 |
| 手宽 mean | 82 | 83 | 81 | 76 | 77 | 75 |
| std (长/宽) | 8/4 | 8/4 | 8/4 | 7/4 | 7/4 | 7/4 |

采样：Box-Muller 正态分布 → clamp 到 P5-P95。

### 7.3 18 维度（dimensions.ts）

按 6 group 分类，AHP 权重已归一化（Σ = 1.000）：
- **基本尺寸**（0.298）：宽 0.078 · 高 0.072 · 厚 0.063 · 重 0.085
- **形态曲率**（0.184）：圆角 0.051 · 背弧 0.048 · 边过渡 0.043 · 摩擦 0.042
- **功能部件**（0.142）：镜头凸起 0.058 · 后摄位置 0.045 · 侧键 0.039
- **操作便利**（0.219）：拇指可达 0.078 · 指纹 0.044 · 底部 0.046 · 屏幕 0.051
- **视觉感知 + 整机平衡**（0.157）：长宽比 0.038 · 黑边 0.041 · 重心 0.078

### 7.4 评分算法（scoring.ts）

**deriveIdealSpec(handLength, handWidth)**：
```
理想宽度 = 手宽 × 0.86
理想高度 = 手长 × 0.82
理想厚度 = 手宽 × 0.092
理想重量 = 手长 × 0.985
理想拇指可达 = 65 %（固定）
```

**单维度评分**（三角衰减）：
```
score = max(0, 10 − |actual − ideal| / tolerance × 10)
```

**总分**：`Σ(perDim × weight)`，0-10 区间，× 10 得百分比 match。

**status 阈值**：`< 6.5 risk · < 7.8 warn · ≥ 7.8 good`

---

## 8. 设计令牌（tokens.css）

| 类别 | 变量 | 值 |
|---|---|---|
| 背景 | `--bg-deep` | `#000000` |
| 背景渐变 | `--bg-gradient` | 椭圆径向 + 黑色 |
| 卡 | `--card-front` / `--card-back` / `--card-input` | `#272a2f` / `#1d2024` / `#0b0e13` |
| 卡边 | `--card-border` | `rgba(66, 70, 85, 0.4)` |
| 主文 | `--text-1` | `#e0e2e8` |
| 次文 | `--text-2` | `#8d90a1` |
| 辅文 | `--text-3` | `#c3c6d8` |
| 强调 | `--accent` | `#b4c5ff` |
| 强调蓝 | `--accent-blue` | `#618bff` |
| CTA 渐变 | `--cta-gradient` | `linear-gradient(158deg, #b4c5ff 0%, #618bff 100%)` |
| 字 - 中文 | `--font-zh` | Noto Sans SC / PingFang SC |
| 字 - 英文 | `--font-en` | Inter |
| 字 - 品牌 | `--font-brand` | Space Grotesk |

**GRIPFIT 字标规范**（所有 page 左上一致）：
`font-family: var(--font-brand)` · `font-size: 14px` · `font-weight: 700` · `line-height: 21px` · `letter-spacing: 3.08px` · 位置：`top 30px / left 38px`（onboarding 段）或 `padding 0 32px` topbar 中（工作台段）

---

## 9. 关键交互模式

| 模式 | 出现位置 |
|---|---|
| 实时联动评分 | /measure 滑条改手长手宽 → /tuning /report /library /dashboard 等 7 个页同步重算 |
| 跨页对比清单 | /library 加对比 → /compare 自动激活，state 通过 localStorage 同步 |
| 三态自动切换 | /compare 根据 compareIds.length 自动 empty / edit / result |
| 多展开 accordion | /report 评分表行可同时展开 |
| 抽屉式筛选 | /library 右侧 360px 滑入，backdrop 点击关闭 |
| 模态弹窗 | /compare 导出弹窗 + backdrop |
| Toast | /report 导出按钮 · /compare 选择不足提示 |
| 视角切换 | /measure VIEWPORT (4 角度) · /tuning view (4 类) |
| Hover 浮层 | /tuning 风险点 dot · 各页 icon tooltip |
| 数字滚动动画 | /profile-info confirm 阶段手长手宽 · /report/best-phone 参数列 |
| 进度条入场动画 | /profile-info 进度 0→50%、50→100% · /profile-info scan-active 对齐 + analyzing 双阶段 |

---

## 10. 验证 / 边界

- **摄像头不可用**：MediaPipe 失败 → fallback timer 4.4s 自动通过；ImageSegmenter 不可用 → 仅 bbox 裁剪（不抠图）
- **手部识别失败**：保留兜底数据（GB/T 默认 male 18-35 mean）让下游不崩
- **没有扫描就直接进 /measure**：读 flowState 默认值（183 / 82），正常显示
- **0 对比清单进 /compare**：empty 态 CTA
- **22 款机型筛选无结果**：表格空态文案

---

## 11. 路由跳转图

```
                  ┌──────┐
                  │  /   │ 首页（粒子大字）
                  └──┬───┘
                     │ 开始体验
                  ┌──▼────────┐
                  │/role-select│
                  └──┬─────┬───┘
                     │     └─ 企业 → grip-fit-tob.vercel.app
                     │ 消费者
                  ┌──▼───────┐
                  │/onboarding│ 4 卡介绍
                  └──┬────────┘
                     │ 开始使用
              ┌──────▼──────────┐
              │ /profile-info   │ ← 4 stage 状态机
              │ ┌─────────────┐ │
              │ │ profile     │ │ 性别/年龄 + 手机轮播
              │ ├─────────────┤ │
              │ │ scan-active │ │ 摄像头 + MediaPipe
              │ ├─────────────┤ │
              │ │ scan-confirm│ │ 抓帧 + 手长/手宽
              │ └─────────────┘ │
              └──────┬──────────┘
                     │ 确认进入测量
        ┌────────────▼─────────┐
        │ AppShell 工作台      │
        ├──────────────────────┤
        │ /measure ←────────┐  │
        │   ↓ 提交           │  │
        │ /report/best-phone │  │
        │   ↓ 参数微调       │  │
        │ /tuning ──┐        │  │
        │   ↓ 保存  │        │  │
        │ /report   │        │  │
        │           ▼        │  │
        │ /library → /phone/:id ↺
        │   ↓ 对比            │  │
        │ /compare            │  │
        │ /my-data ───────────┘  │
        └────────────────────────┘
                     ▲
              鼠标点右上头像
```

---

## 12. 已知限制

- 22 款机型的产品大图不存在，库列表用 SVG `PhoneVisual` 按品牌动态生成（Apple 方形模组 / Samsung 竖排 / Google 横条等）
- /best-phone 和 /tuning 中央 phone 用 `profile-grip-normal.png` 真实产品照（手持背面）
- 导出弹窗仅显示「已生成 演示版」反馈，不真实生成 PDF / 长图 / 链接
- 历史记录是 mock，没有真实归档逻辑
- 手部识别精度依赖 MediaPipe 模型（首次加载约 10MB），网络差时回退 timer
