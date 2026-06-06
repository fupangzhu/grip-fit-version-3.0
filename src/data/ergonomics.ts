/**
 * ergonomics.ts — 手机手感人因实验数据（直板机）
 * ===================================================================
 * 数据来源（原始文件）：
 *   1. 《手机手感最佳人因设计参考手册》 F:\毕业设计\1011-手机手感最佳人因设计参考手册.pdf（210页）
 *      —— 18 维度的「实验最佳值 / 拟合最佳值 / 最佳区间」，按 人群·性别·年龄·手长·价位 5 种分层
 *   2. 手机手感人因实验数据分析报告（杨真）.docx —— 整机宽拟合方程、ANOVA 均值±标准差
 *   3. AHP专家打分矩阵.xlsx ×3 —— 18 维度 AHP 权重
 *
 * 研究对象：小米直板机；量表：0–10 分 11 点 Likert（体验评分）。
 *
 * 方法论（每个连续维度共用）：
 *   ① 实验最佳值 experimentBest = 体验评分均值最高的那一档样机值。
 *   ② 拟合最佳值 fitBest        = 二阶多项式 y=ax²+bx+c 顶点 x* = -b/2a
 *                                （a<0 倒U才存在；a>0 正U记 null；x* 越界记 outOfRange=true）。
 *   ③ 最佳区间 bestInterval（★绿块）= 评分 > 6.6 分（"优"档）对应的自变量区间。
 *      满分三等分：0–3.33 差 / 3.33–6.66 良 / 6.66–10 优。
 *   ④ 接受底线 = 对"低于6.6分频数"用三阶多项式拟合后二阶求导取变化率最大点。
 *
 * UI 用法（/tuning 参数微调页）：
 *   - 滑块默认锚点 = experimentBest
 *   - 绿色块区间   = bestInterval
 *   - 千人千面推荐 = 按用户 性别/年龄/手长 查 SEGMENTED_BEST
 */

// ───────────────────────────────────────────────────────────────────
// 量表与等级常量
// ───────────────────────────────────────────────────────────────────
export const LIKERT = { min: 0, max: 10, points: 11 } as const;

/** 评分三等分：差 / 良 / 优（优 = 绿块所在档） */
export const GRADE_BANDS = {
  poor: [0, 3.33] as const,
  fair: [3.33, 6.66] as const,
  good: [6.66, 10] as const, // "优"
};
/** 接受底线阈值：低于此分视为"不接受 / 不确定接受" */
export const ACCEPT_THRESHOLD = 6.6;

/** 分层定义（用于个性化推荐查表） */
export const SEGMENT_DEFS = {
  age: { X: '44–59岁', Y: '29–43岁', Z: '18–28岁' },
  hand: { small: '<175mm', medium: '175–190mm', large: '>190mm' },
  price: { low: '<2000元', mid: '2000–5000元', high: '>5000元' },
} as const;

// ───────────────────────────────────────────────────────────────────
// 类型定义
// ───────────────────────────────────────────────────────────────────
export type ErgoGroup =
  | 'size'        // 基本尺寸
  | 'curvature'   // 形态曲率
  | 'camera'      // 功能部件·后摄模组
  | 'operability' // 操作便利性
  | 'balance'     // 整机平衡
  | 'visual';     // 视觉感知结构

export interface FitValue {
  /** 拟合最佳值；正U曲线无最优值时为 null */
  value: number | null;
  /** true = 拟合值超出实验测试范围，仅供参考（手册中标 *） */
  outOfRange?: boolean;
}

/** 连续型维度（有数值区间，可做绿块/滑块） */
export interface ContinuousDim {
  id: string;
  group: ErgoGroup;
  label: string;            // 中文名
  labelEn: string;
  unit: string;             // 'mm' | 'g' | '%' | ':9' 等
  type: 'continuous';
  testRange: [number, number];   // 实验自变量范围
  experimentBest: number;        // 实验最佳值（滑块默认锚点）
  fitBest: FitValue;             // 拟合最佳值
  bestInterval: [number, number] | null; // ★绿块：优区间
  /** 仅个别维度有完整拟合方程（系数 a,b,c）+ R² */
  fitEquation?: { a: number; b: number; c: number; r2: number };
  note?: string;
}

/** 类别型维度（自变量非自然数，无数值区间） */
export interface CategoricalDim {
  id: string;
  group: ErgoGroup;
  label: string;
  labelEn: string;
  unit?: string;
  type: 'categorical';
  options: string[];        // 候选项
  best: string;             // 推荐选项（所有人群实验最佳）
  note?: string;
}

export type ErgoDim = ContinuousDim | CategoricalDim;

// ───────────────────────────────────────────────────────────────────
// 18 维度数据（所有人群 / 通用默认）
// ───────────────────────────────────────────────────────────────────
export const ERGO_DIMENSIONS: ErgoDim[] = [
  // ===== 基本尺寸 size =====
  {
    id: 'width', group: 'size', label: '整机宽度', labelEn: 'Width', unit: 'mm',
    type: 'continuous',
    testRange: [70.6, 79.0],
    experimentBest: 70.6,
    fitBest: { value: 68.05, outOfRange: true },
    bestInterval: [70.6, 72.79],
    fitEquation: { a: -0.02, b: 3.3, c: -108.11, r2: 0.93 },
    note: '理论最优69.72mm(超范围)；接受底线74.94mm → 接受范围70.6–74.94mm。',
  },
  {
    id: 'aspectRatio', group: 'size', label: '整机长宽比', labelEn: 'Aspect Ratio', unit: ':9',
    type: 'continuous',
    testRange: [18.5, 21], // 单位 x:9
    experimentBest: 19.3,
    fitBest: { value: 19.35 },
    bestInterval: [18.63, 20.07],
    note: '数值以 x:9 表示（如 19.3 = 19.3:9）。',
  },
  {
    id: 'thickness', group: 'size', label: '整机厚度', labelEn: 'Thickness', unit: 'mm',
    type: 'continuous',
    testRange: [6.8, 10.0],
    experimentBest: 7.6,
    fitBest: { value: 7.34 },
    bestInterval: [6.80, 8.40],
    note: '厚度拟合为倒U曲线，最优值稳定存在。',
  },
  {
    id: 'weight', group: 'size', label: '整机重量', labelEn: 'Weight', unit: 'g',
    type: 'continuous',
    testRange: [170, 259],
    experimentBest: 180,
    fitBest: { value: 148.38, outOfRange: true },
    bestInterval: [170, 194.8],
  },

  // ===== 形态曲率 curvature =====
  {
    id: 'cornerRadius', group: 'curvature', label: '四边圆角', labelEn: 'Corner Radius', unit: 'mm',
    type: 'continuous',
    testRange: [5, 11],
    experimentBest: 10.5,
    fitBest: { value: 19.08, outOfRange: true },
    bestInterval: [9.21, 11],
    note: '正U曲线，越大越好趋势；绿块贴近测试上限。',
  },
  {
    id: 'sideCurvature', group: 'curvature', label: '侧边弧度', labelEn: 'Side Curvature', unit: 'mm',
    type: 'continuous',
    testRange: [0, 3.8],
    experimentBest: 3,
    fitBest: { value: 4.59, outOfRange: true },
    bestInterval: [1.36, 3],
  },
  {
    id: 'frontCurvature', group: 'curvature', label: '正面弧度', labelEn: 'Front Curvature', unit: '',
    type: 'categorical',
    options: ['(X)1.0&(Z)0.2', '(X)2.5&(Z)3', '(X)3.5&(Z)4', '(X)4.5&(Z)4', '(X)5.5&(Z)4'],
    best: '(X)2.5&(Z)3',
    note: '以 (X轴弧度)&(Z轴弧度) 组合表示，无数值区间。',
  },
  {
    id: 'backCurvature', group: 'curvature', label: '背面弧度', labelEn: 'Back Curvature', unit: '',
    type: 'categorical',
    options: ['(X)到中心&(Z)3.2', '(X)到中心&(Z)1.8', '(X)到中心&(Z)0.6', '(X)1.0&(Z)0.2', '(X)2.5&(Z)3', '(X)3.5&(Z)4', '(X)4.5&(Z)4', '(X)5.5&(Z)4'],
    best: '(X)4.5&(Z)4',
  },
  {
    id: 'frontBackTransition', group: 'curvature', label: '正反面过渡', labelEn: 'Front-Back Transition', unit: '',
    type: 'categorical',
    options: ['iPhone11', '小米14pro', '小米14', '小米13pro', '三星s23', '华为mate60pro', 'iPhone15pro'],
    best: 'iPhone11',
    note: '以基准机型代表过渡形态；iPhone11 式过渡得分最高。',
  },

  // ===== 功能部件·后摄模组 camera =====
  {
    id: 'cameraBumpHeight', group: 'camera', label: '镜头凸起（后摄高·正圆）', labelEn: 'Camera Bump Height', unit: 'mm',
    type: 'continuous',
    testRange: [0, 6.2],
    experimentBest: 1.4,
    fitBest: { value: -0.95, outOfRange: true },
    bestInterval: [0, 2.30],
    note: '正方带倒角款另测；通用取正圆款。',
  },
  {
    id: 'cameraDecoSizeRound', group: 'camera', label: '后摄装饰圈大小（圆形）', labelEn: 'Deco Size (Round)', unit: '%',
    type: 'continuous',
    testRange: [20, 60],
    experimentBest: 40,
    fitBest: { value: 41 },
    bestInterval: [33, 51],
    note: '% = 占背面上部面积比。',
  },
  {
    id: 'cameraDecoSizeSquare', group: 'camera', label: '后摄装饰圈大小（方形）', labelEn: 'Deco Size (Square)', unit: '%',
    type: 'continuous',
    testRange: [20, 80],
    experimentBest: 40,
    fitBest: { value: 36 },
    bestInterval: [30, 43],
  },
  {
    id: 'cameraDecoSizeTrack', group: 'camera', label: '后摄装饰圈大小（跑道形）', labelEn: 'Deco Size (Track)', unit: '%',
    type: 'continuous',
    testRange: [20, 70],
    experimentBest: 20,
    fitBest: { value: null },
    bestInterval: [20, 24],
  },
  {
    id: 'cameraDecoPosition', group: 'camera', label: '后摄装饰圈位置', labelEn: 'Deco Position', unit: '',
    type: 'categorical',
    options: ['背面上部偏左', '背面上部居中', '上部整体'],
    best: '背面上部居中',
  },

  // ===== 操作便利性 operability =====
  {
    id: 'fingerprintPosition', group: 'operability', label: '指纹位置', labelEn: 'Fingerprint Position', unit: '',
    type: 'categorical',
    options: ['边框顶部右侧区域', '边框左侧区域', '边框右侧区域', '屏幕下方区域', '机身背面上方区域'],
    best: '屏幕下方区域',
  },
  {
    id: 'buttonPosition', group: 'operability', label: '按键位置', labelEn: 'Button Position', unit: '',
    type: 'categorical',
    options: ['边框右侧上部区域', '边框右侧中部偏上区域', '边框左侧上部区域'],
    best: '边框右侧中部偏上区域 & 边框左侧上部区域',
  },

  // ===== 整机平衡 balance =====
  {
    id: 'centerOfMass', group: 'balance', label: '重心位置', labelEn: 'Center of Mass', unit: '',
    type: 'categorical',
    options: ['比几何中心偏上1.1mm', '与几何中心对齐', '比几何中心偏下1.4mm', '比几何中心偏下2.4mm'],
    best: '比几何中心偏上1.1mm / 与几何中心对齐',
    note: '基于180g机型实验。',
  },

  // ===== 视觉感知结构 visual =====
  {
    id: 'screenRatio', group: 'visual', label: '屏占比（边框宽度）', labelEn: 'Screen-to-Body (Border)', unit: 'mm',
    type: 'continuous',
    testRange: [1.1, 2.3],
    experimentBest: 1.1,
    fitBest: { value: null },
    bestInterval: [1.1, 1.59],
    note: '边框越窄屏占比越高、手感越好（四边等宽款）。',
  },
];

// ───────────────────────────────────────────────────────────────────
// 个性化分层 —— 连续参数的实验最佳值（用于千人千面推荐）
// 行：维度；列：性别/年龄/手长/价位
// 单位同 ERGO_DIMENSIONS 对应维度；'/' 表示无最优/无数据
// ───────────────────────────────────────────────────────────────────
export interface SegmentRow {
  all: number;
  gender: { male: number; female: number | string };
  age: { X: number | string; Y: number; Z: number };
  hand: { small: number | string; medium: number; large: number };
  price: { low: number | string; mid: number; high: number };
}

export const SEGMENTED_BEST: Record<string, SegmentRow> = {
  // 整机宽度（实验最佳值 mm）
  width: {
    all: 70.6,
    gender: { male: 70.6, female: 71.6 },
    age: { X: 71.6, Y: 70.6, Z: 74.6 },
    hand: { small: '73.6/74.6', medium: 70.6, large: 70.6 },
    price: { low: 71.6, mid: 70.6, high: 71.6 },
  },
  // 整机厚度（实验最佳值 mm）
  thickness: {
    all: 7.6,
    gender: { male: 7.6, female: '7.6&7.0' },
    age: { X: 6.8, Y: 7.6, Z: 8.1 },
    hand: { small: 7.6, medium: 6.8, large: 8.1 },
    price: { low: '7.6&8.7', mid: 7.6, high: 7.6 },
  },
  // 整机重量（实验最佳值 g）
  weight: {
    all: 180,
    gender: { male: 190, female: 180 },
    age: { X: 170, Y: 190, Z: 200 },
    hand: { small: '170&180', medium: 190, large: 170 },
    price: { low: '170&210', mid: 200, high: 180 },
  },
  // 整机长宽比（实验最佳值 x:9）
  aspectRatio: {
    all: 19.3,
    gender: { male: 19.3, female: 19.3 },
    age: { X: 19.5, Y: 19.3, Z: 18.5 },
    hand: { small: 19.5, medium: 19.3, large: 18.5 },
    price: { low: 19.5, mid: 19.3, high: 19.3 },
  },
};

// ───────────────────────────────────────────────────────────────────
// 便捷查询
// ───────────────────────────────────────────────────────────────────
export const GROUP_LABELS: Record<ErgoGroup, string> = {
  size: '基本尺寸',
  curvature: '形态曲率',
  camera: '功能部件（后摄像头模组）',
  operability: '操作便利性',
  balance: '整机平衡',
  visual: '视觉感知结构',
};

export function getDim(id: string): ErgoDim | undefined {
  return ERGO_DIMENSIONS.find((d) => d.id === id);
}

export function getDimsByGroup(group: ErgoGroup): ErgoDim[] {
  return ERGO_DIMENSIONS.filter((d) => d.group === group);
}

/** 判断某个连续值是否落在"优"区间（绿块）内 */
export function isInBestInterval(id: string, value: number): boolean {
  const d = getDim(id);
  if (!d || d.type !== 'continuous' || !d.bestInterval) return false;
  const [lo, hi] = d.bestInterval;
  return value >= lo && value <= hi;
}
