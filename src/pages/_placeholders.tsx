// Phase 1 占位页面 —— Phase 2+ 会按 hi-fi 重建每一页。

type PlaceholderProps = {
  title: string;
  phase: string;
  desc?: string;
};

function Placeholder({ title, phase, desc }: PlaceholderProps) {
  return (
    <section className="shell-placeholder glass-card">
      <h1>{title}</h1>
      <p>{desc ?? '此模块的内容将在 ' + phase + ' 阶段按高保真重建。'}</p>
      <small>{phase}</small>
    </section>
  );
}

export function DashboardPage() {
  return <Placeholder title="仪表盘" phase="PHASE · TBD" desc="仪表盘暂未在高保真中规划，将作为承接 my-data 的快捷入口。" />;
}

export function MeasurementPage() {
  return <Placeholder title="手部测量" phase="PHASE · 2" desc="智能 / 手动模式切换、手长手宽滑条、三维手部预览。" />;
}

export function TuningPage() {
  return <Placeholder title="参数微调" phase="PHASE · 3" desc="最优手机预览 + 4 视图切换 + 风险点热区 + 参数滑条。" />;
}

export function PhoneLibraryPage() {
  return <Placeholder title="机型库" phase="PHASE · 5" desc="22 款主流机型 + 筛选抽屉 + 匹配度排序 + 加入对比。" />;
}

export function PhoneDetailPage() {
  return <Placeholder title="机型详情" phase="PHASE · 5" desc="单机型完整参数对照 + 18 维度评分 + 风险报告。" />;
}

export function ReportPage() {
  return <Placeholder title="手感报告" phase="PHASE · 4" desc="18 维度评分表 + 响应曲线 + 优化建议 + 导出。" />;
}

export function ComparePage() {
  return <Placeholder title="对比报告" phase="PHASE · 6" desc="对比清单 → 详细图表 → 导出 PDF / 长图 / 链接。" />;
}

export function MyDataPage() {
  return <Placeholder title="我的数据" phase="PHASE · 6" desc="手部数据曲线 + 用户画像 + 最优参数 + 历史记录。" />;
}
