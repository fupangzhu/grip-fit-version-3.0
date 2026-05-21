// 18 维度评分定义 — 基于 AHP 层次分析法的握持舒适度评估体系。
// 权重已归一化（sum = 1.000），数据参考人因工程文献。

export type DimensionStatus = 'risk' | 'warn' | 'good';

export type DimensionGroup = '基本尺寸' | '形态曲率' | '功能部件' | '操作便利' | '视觉感知' | '整机平衡';

export type DimensionDef = {
  id: string;
  group: DimensionGroup;
  name: string;
  unit: string;
  /** AHP 权重，所有维度合 = 1 */
  weight: number;
  /** 最优区间（用户手长 / 手宽派生时会重算） */
  optimum: string;
  /** 评分响应曲线百分位（0-100，曲线最高点位置） */
  curve: number;
  /** 描述 / 改进建议 */
  advice: string;
};

export const dimensions: DimensionDef[] = [
  // —— 基本尺寸 5 项 · 合计权重 0.298 ——
  { id: 'width',      group: '基本尺寸', name: '宽度',     unit: 'mm', weight: 0.078, optimum: '68-72 mm',    curve: 74, advice: '宽度直接决定虎口张开程度。' },
  { id: 'height',     group: '基本尺寸', name: '高度',     unit: 'mm', weight: 0.072, optimum: '145-152 mm',  curve: 70, advice: '高度影响单手顶部触达。' },
  { id: 'thickness',  group: '基本尺寸', name: '厚度',     unit: 'mm', weight: 0.063, optimum: '7.0-8.2 mm',  curve: 52, advice: '厚度落在舒适区间内手指环握更稳。' },
  { id: 'weight',     group: '基本尺寸', name: '重量',     unit: 'g',  weight: 0.085, optimum: '150-180 g',   curve: 64, advice: '重量是长时握持疲劳的首要因素。' },

  // —— 形态曲率 4 项 · 合计权重 0.184 ——
  { id: 'corner',     group: '形态曲率', name: '四边圆角', unit: 'R',  weight: 0.051, optimum: 'R10-R14',     curve: 38, advice: '圆角越大掌根接触压力越分散。' },
  { id: 'back-arc',   group: '形态曲率', name: '背面弧度', unit: '%',  weight: 0.048, optimum: '58-68 %',     curve: 62, advice: '背面适当弧度贴合掌心曲线。' },
  { id: 'edge',       group: '形态曲率', name: '边缘过渡', unit: '',   weight: 0.043, optimum: '柔和过渡',    curve: 60, advice: '边缘过渡顺滑可避免割手感。' },
  { id: 'texture',    group: '形态曲率', name: '背板摩擦', unit: 'μ',  weight: 0.042, optimum: '0.38-0.46',   curve: 53, advice: '摩擦力影响防滑安全感。' },

  // —— 功能部件 3 项 · 合计权重 0.142 ——
  { id: 'camera-bump',group: '功能部件', name: '镜头凸起', unit: 'mm', weight: 0.058, optimum: '0.8-1.5 mm',  curve: 58, advice: '凸起过高会顶到食指支撑点。' },
  { id: 'camera-pos', group: '功能部件', name: '后摄位置', unit: '',   weight: 0.045, optimum: '左上偏内',    curve: 43, advice: '后摄位置影响食指落点。' },
  { id: 'side-key',   group: '操作便利', name: '侧键位置', unit: '',   weight: 0.039, optimum: '右侧中段',    curve: 55, advice: '侧键应落在拇指自然弯曲区域。' },

  // —— 操作便利 4 项 · 合计权重 0.219 ——
  { id: 'thumb-reach',group: '操作便利', name: '拇指可达', unit: '%',  weight: 0.078, optimum: '62-72 %',     curve: 66, advice: '主要操作区域应在拇指自然覆盖范围。' },
  { id: 'finger',     group: '操作便利', name: '指纹位置', unit: '',   weight: 0.044, optimum: '居中偏下',    curve: 50, advice: '指纹应落在拇指自然摆放处。' },
  { id: 'bottom',     group: '操作便利', name: '底部支撑', unit: '',   weight: 0.046, optimum: '良好',        curve: 61, advice: '底部应留有小指支撑空间。' },
  { id: 'screen',     group: '视觉感知', name: '屏幕尺寸', unit: '寸', weight: 0.051, optimum: '6.1-6.4 英寸', curve: 49, advice: '屏幕大小需与掌宽匹配。' },

  // —— 视觉感知 3 项 + 整机平衡 1 项 · 合计权重 0.157 ——
  { id: 'ratio',      group: '视觉感知', name: '长宽比',   unit: '',   weight: 0.038, optimum: '19-20:9',     curve: 57, advice: '比例影响视野与握持平衡。' },
  { id: 'black-edge', group: '视觉感知', name: '黑边宽度', unit: 'mm', weight: 0.041, optimum: '1.2-1.6 mm',  curve: 56, advice: '黑边窄能提升视觉沉浸感。' },
  { id: 'balance',    group: '整机平衡', name: '重心位置', unit: '',   weight: 0.078, optimum: '中心偏差 < 3mm', curve: 60, advice: '重心偏移会让单手操作产生前倾。' },
];

// 类目顺序（与 hi-fi 报告页 fold 一致）
export const dimensionGroups: DimensionGroup[] = [
  '基本尺寸', '形态曲率', '功能部件', '操作便利', '视觉感知', '整机平衡',
];

export const dimensionGroupLabels = ['全部', ...dimensionGroups];

// 状态阈值（评分 0-10）
export function statusFromScore(score: number): DimensionStatus {
  if (score < 6.5) return 'risk';
  if (score < 7.8) return 'warn';
  return 'good';
}

// 调试用：检查权重和
export const totalWeight = dimensions.reduce((s, d) => s + d.weight, 0);
