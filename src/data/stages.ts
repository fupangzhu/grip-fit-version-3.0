export type StageId = 0 | 1 | 2 | 3;

export type Stage = {
  id: StageId;
  stageLabel: string;
  tag: string;
  title: string;
  desc: string;
  icon: 'compass' | 'cube' | 'chart' | 'chart-pro';
  extra: 'scanHand' | 'modelPreview' | 'metric' | 'none';
  bullets?: string[];
  metric?: { label: string; value: string };
  fitValue?: string;
};

export const STAGES: Stage[] = [
  {
    id: 0,
    stageLabel: '阶段 01',
    tag: '测量你的手',
    title: '精准手部测量',
    desc: '通过简单几步采集手部数据，系统就能计算哪款手机最适合你',
    icon: 'compass',
    extra: 'scanHand',
    bullets: ['逐步扫描引导', '光学精确校准'],
    fitValue: '98.4%',
  },
  {
    id: 1,
    stageLabel: '阶段 02',
    tag: '参数计算',
    title: '智能参数匹配',
    desc: '获取一组专属于你的"理想手机"物理参数',
    icon: 'cube',
    extra: 'modelPreview',
    bullets: ['骨骼重心解算', '指尖可达建模'],
  },
  {
    id: 2,
    stageLabel: '阶段 03',
    tag: '科学推荐报告',
    title: '你的专属手感报告',
    desc: '看看在售手机里，哪几款最适合你的手',
    icon: 'chart',
    extra: 'metric',
    bullets: ['18 项评估维度', '多维对比排序'],
    metric: { label: '测量维度', value: '18 项' },
  },
  {
    id: 3,
    stageLabel: '阶段 04',
    tag: '选购决策辅助',
    title: '探索、对比与定制',
    desc: '基于你的数据，找到、比较、甚至定制你的下一部手机',
    icon: 'chart-pro',
    extra: 'none',
    bullets: ['候选机横向对比', '参数定制重算'],
  },
];
