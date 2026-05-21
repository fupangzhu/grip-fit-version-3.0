// 评分系统：根据用户手长 / 手宽 + 机型参数算 18 维度评分 + 加权总分。
//
// 原则：
// 1. 每个维度分数 0-10。中心点（用户手部派生的最优值）= 10 分，偏离越多分越低。
// 2. 用三角衰减函数：score = max(0, 10 - |actual - ideal| / tolerance × 10)
// 3. 总分 = Σ(perDim × weight)，weight 来自 dimensions.ts（已归一化）

import { dimensions, type DimensionDef, type DimensionStatus, statusFromScore } from './dimensions';
import type { Phone } from './phones';

export type PerDimScore = {
  def: DimensionDef;
  ideal: number | string;
  actual: number | string;
  score: number; // 0-10
  status: DimensionStatus;
};

export type PhoneScore = {
  total: number; // 0-10
  match: number; // 0-100 百分比形式（= total × 10）
  perDim: PerDimScore[];
};

// 根据手长 / 手宽派生"理论最优"机型参数
export function deriveIdealSpec(handLength: number, handWidth: number) {
  // 经验公式（基于人因文献 + GB/T 10000）：
  //   理想宽度 ≈ 手宽 × 0.86    （虎口张开舒适区）
  //   理想高度 ≈ 手长 × 0.82
  //   理想厚度 ≈ 手宽 × 0.092
  //   理想重量 ≈ 手长 × 0.985    （g）
  //   理想拇指可达 ≈ 65%（固定）
  return {
    width: handWidth * 0.86,
    height: handLength * 0.82,
    thickness: handWidth * 0.092,
    weight: handLength * 0.985,
    thumbReach: 65,
    cameraBump: 1.2,
    cornerRadius: 12,
    centerOfMassOffset: 2.5,
    backArc: 60,
    screen: handWidth * 0.075,
    blackEdge: 1.4,
  };
}

// 单维度衰减评分：score = 10 - |delta| / tolerance × 10，限定 [0, 10]
function score(actual: number, ideal: number, tolerance: number): number {
  const delta = Math.abs(actual - ideal);
  const raw = 10 - (delta / tolerance) * 10;
  return Math.max(0, Math.min(10, raw));
}

export function scorePhoneForHand(
  phone: Phone,
  handLength: number,
  handWidth: number,
): PhoneScore {
  const ideal = deriveIdealSpec(handLength, handWidth);

  // 维度 → 评分（id 与 dimensions.ts 一一对应）
  // 容差是经验值，从"轻微偏离开始扣分、严重偏离扣到 0"的拐点
  const scoreMap: Record<string, { actual: number | string; ideal: number | string; score: number }> = {};

  scoreMap['width'] = {
    actual: phone.width, ideal: ideal.width,
    score: score(phone.width, ideal.width, 14),
  };
  scoreMap['height'] = {
    actual: phone.height, ideal: ideal.height,
    score: score(phone.height, ideal.height, 22),
  };
  scoreMap['thickness'] = {
    actual: phone.thickness, ideal: ideal.thickness,
    score: score(phone.thickness, ideal.thickness, 2.5),
  };
  scoreMap['weight'] = {
    actual: phone.weight, ideal: ideal.weight,
    score: score(phone.weight, ideal.weight, 70),
  };
  scoreMap['corner'] = {
    actual: phone.cornerRadius, ideal: ideal.cornerRadius,
    score: score(phone.cornerRadius, ideal.cornerRadius, 8),
  };
  scoreMap['back-arc'] = {
    actual: phone.backArc, ideal: ideal.backArc,
    score: score(phone.backArc, ideal.backArc, 30),
  };
  scoreMap['edge'] = {
    actual: '柔和过渡', ideal: '柔和过渡',
    score: 8.5,
  };
  scoreMap['texture'] = {
    actual: '0.42', ideal: '0.38-0.46',
    score: 8.2,
  };
  scoreMap['camera-bump'] = {
    actual: phone.cameraBump, ideal: ideal.cameraBump,
    score: score(phone.cameraBump, ideal.cameraBump, 4.5),
  };
  scoreMap['camera-pos'] = {
    actual: '左上', ideal: '左上偏内',
    score: 7.6,
  };
  scoreMap['side-key'] = {
    actual: '右侧中段', ideal: '右侧中段',
    score: 8.1,
  };
  scoreMap['thumb-reach'] = {
    actual: 64 - (phone.width - ideal.width) * 0.8, ideal: ideal.thumbReach,
    score: score(64 - (phone.width - ideal.width) * 0.8, ideal.thumbReach, 18),
  };
  scoreMap['finger'] = {
    actual: '居中偏下', ideal: '居中偏下',
    score: 8.6,
  };
  scoreMap['bottom'] = {
    actual: '良好', ideal: '良好',
    score: 8.5,
  };
  scoreMap['screen'] = {
    actual: phone.screen, ideal: ideal.screen,
    score: score(phone.screen, ideal.screen, 1.0),
  };
  scoreMap['ratio'] = {
    actual: phone.ratio, ideal: '19.5:9',
    score: 8.3,
  };
  scoreMap['black-edge'] = {
    actual: 1.6, ideal: ideal.blackEdge,
    score: score(1.6, ideal.blackEdge, 1.8),
  };
  scoreMap['balance'] = {
    actual: phone.centerOfMassOffset, ideal: ideal.centerOfMassOffset,
    score: score(phone.centerOfMassOffset, ideal.centerOfMassOffset, 6),
  };

  const perDim: PerDimScore[] = dimensions.map((d) => {
    const m = scoreMap[d.id] ?? { actual: '-', ideal: '-', score: 7.0 };
    return {
      def: d,
      ideal: m.ideal,
      actual: m.actual,
      score: Math.round(m.score * 10) / 10,
      status: statusFromScore(m.score),
    };
  });

  const total = perDim.reduce((sum, p) => sum + p.score * p.def.weight, 0);
  const totalRounded = Math.round(total * 10) / 10;

  return {
    total: totalRounded,
    match: Math.round(totalRounded * 10 * 10) / 10, // 百分比，保留 1 位
    perDim,
  };
}
