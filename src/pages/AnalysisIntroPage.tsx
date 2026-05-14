import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import './AnalysisIntroPage.css';

const featureCards = [
  {
    title: '匹配引擎',
    desc: '精确分析，将手部尺寸与数以千计的设备蓝图进行比较。',
    icon: 'engine',
  },
  {
    title: '人体工学标准',
    desc: '基于 GB/T 国家标准的人机工程和人体工学指标。',
    icon: 'ruler',
  },
  {
    title: '多维度评分',
    desc: '跨越握持舒适度、可及性和骨骼劳损评分的综合评估。',
    icon: 'score',
  },
  {
    title: '报告导出',
    desc: '生成详细的技术 PDF 报告，展示您的符合人体工学的兼容性。',
    icon: 'download',
  },
] as const;

const flowSteps = [
  {
    id: '01',
    title: '数据输入',
    desc: '首先输入您的主要手部测量数据，或使用我们的智能光学识别引擎，获得实验室级别的精度。',
    icon: 'touch',
    iconSide: 'left',
  },
  {
    id: '02',
    title: '数字孪生',
    desc: '系统生成您手部的高保真 3D 模型，映射骨骼结构和关节的灵活范围。',
    icon: 'sync',
    iconSide: 'right',
  },
  {
    id: '03',
    title: '偏好过滤',
    desc: '选择您的使用场景 -- 游戏、摄影或商务。我们的 AI 会根据您的生活方式对不同的人体工学因素进行加权。',
    icon: 'filter',
    iconSide: 'left',
  },
  {
    id: '04',
    title: '模拟交互',
    desc: '对数千种手机型号进行虚拟压力测试，计算到达区域和潜在的肌肉疲劳点。',
    icon: 'network',
    iconSide: 'right',
  },
  {
    id: '05',
    title: '优化循环',
    desc: '收到一份综合报告，其中包含您理想的手机尺寸和前 3 名市售的最佳匹配项。',
    icon: 'check',
    iconSide: 'left',
  },
] as const;

export default function AnalysisIntroPage() {
  const [notice, setNotice] = useState('');

  return (
    <div className="page-shell analysis-page">
      <AnalysisIntroContent
        onStart={() => {
          setNotice('下一页将在确认后继续实现');
          window.setTimeout(() => setNotice(''), 1800);
        }}
      />

      <AnimatePresence>
        {notice ? (
          <motion.div
            className="analysis-notice"
            role="status"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}
          >
            {notice}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

type AnalysisIntroContentProps = {
  className?: string;
  onStart: () => void;
};

export function AnalysisIntroContent({ className = '', onStart }: AnalysisIntroContentProps) {
  return (
    <main className={`analysis-content ${className}`}>
      <section className="analysis-hero" aria-labelledby="analysis-title">
        <p className="analysis-kicker">科学人体工学分析</p>
        <h1 id="analysis-title" className="analysis-title">
          <span>寻找</span>
          <span>
            <strong>最适合您</strong>的智能手机
          </span>
        </h1>
        <p className="analysis-lede">
          GripFit 使用精准的生物识别分析，为您匹配最佳的符合人体工学的握持感，重新定义人机交互体验。
        </p>
      </section>

      <section className="analysis-features" aria-label="功能特性">
        {featureCards.map((card) => (
          <article className="analysis-feature-card" key={card.title}>
            <h2>{card.title}</h2>
            <p>{card.desc}</p>
          </article>
        ))}
      </section>

      <section className="analysis-flow" aria-labelledby="analysis-flow-title">
        <h2 id="analysis-flow-title">分析流程</h2>
        <div className="analysis-flow-grid">
          {flowSteps.map((step) => (
            <article className="analysis-flow-row" key={step.id}>
              {step.iconSide === 'left' ? (
                <>
                  <div className="analysis-flow-icon">
                    <AnalysisIcon name={step.icon} large />
                  </div>
                  <FlowCopy step={step} />
                </>
              ) : (
                <>
                  <FlowCopy step={step} />
                  <div className="analysis-flow-icon">
                    <AnalysisIcon name={step.icon} large />
                  </div>
                </>
              )}
            </article>
          ))}
        </div>
      </section>

      <footer className="analysis-footer">
        <motion.button
          type="button"
          className="analysis-start"
          onClick={onStart}
          whileHover={{ y: -2, boxShadow: '0 18px 46px rgba(57, 111, 255, 0.34)' }}
          whileTap={{ scale: 0.985 }}
          transition={{ type: 'spring', stiffness: 320, damping: 24 }}
        >
          <span>开始手部测量</span>
          <ArrowIcon />
        </motion.button>
      </footer>
    </main>
  );
}

type FlowStep = (typeof flowSteps)[number];

function FlowCopy({ step }: { step: FlowStep }) {
  return (
    <div className="analysis-flow-copy">
      <h3>
        <span>{step.id}</span>
        {step.title}
      </h3>
      <p>{step.desc}</p>
    </div>
  );
}

function ArrowIcon() {
  return (
    <svg width="17" height="14" viewBox="0 0 17 14" fill="none" aria-hidden="true">
      <path
        d="M1.6 7h12.7M10 2.7 14.3 7 10 11.3"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function AnalysisIcon({ name, large }: { name: string; large?: boolean }) {
  const className = `analysis-icon ${large ? 'analysis-icon--large' : ''}`;

  switch (name) {
    case 'engine':
      return (
        <svg className={className} viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <path d="M14 23v-5.6a4.8 4.8 0 1 1 5.2 0V23" stroke="currentColor" strokeWidth="2" />
          <path d="M10.5 25h8M21.5 15.5h3.2l1.8 2.1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <circle cx="15.6" cy="12.8" r="1.4" fill="currentColor" />
          <path d="M12 7.4 10 5.2M19.1 7.4l2-2.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'ruler':
      return (
        <svg className={className} viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <rect x="8" y="12" width="16" height="8" rx="1.4" stroke="currentColor" strokeWidth="2" />
          <path d="M11 13v4M15 13v3M19 13v4M23 13v3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      );
    case 'score':
      return (
        <svg className={className} viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <rect x="8" y="6" width="16" height="20" rx="1.7" stroke="currentColor" strokeWidth="2" />
          <path d="M13 21v-4M16 21v-8M19 21v-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'download':
      return (
        <svg className={className} viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <path d="M16 6v13M11.5 14.8 16 19.3l4.5-4.5M9 24h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'touch':
      return (
        <svg className={className} viewBox="0 0 64 64" fill="none" aria-hidden="true">
          <path d="M30 18v21M30 39l-8-7a5.2 5.2 0 0 0-6.9.2l-.7.7 13.2 17.3h15.8l4.1-13.1a7.4 7.4 0 0 0-7-9.6H30" stroke="currentColor" strokeWidth="4" strokeLinejoin="round" />
          <path d="M23.7 15.2a8.4 8.4 0 0 1 12.6 0M19.8 10.3a14.7 14.7 0 0 1 20.4 0" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
        </svg>
      );
    case 'sync':
      return (
        <svg className={className} viewBox="0 0 64 64" fill="none" aria-hidden="true">
          <path d="M44 19a17 17 0 0 0-27.8 9.5M20 45a17 17 0 0 0 27.8-9.5" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
          <path d="M43.8 10.6V19h-8.4M20.2 53.4V45h8.4" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="32" cy="32" r="7" stroke="currentColor" strokeWidth="4" />
        </svg>
      );
    case 'filter':
      return (
        <svg className={className} viewBox="0 0 64 64" fill="none" aria-hidden="true">
          <path d="M18 23h28M24 32h16M29 41h6" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
        </svg>
      );
    case 'network':
      return (
        <svg className={className} viewBox="0 0 64 64" fill="none" aria-hidden="true">
          <circle cx="32" cy="14" r="5" stroke="currentColor" strokeWidth="4" />
          <circle cx="15" cy="34" r="5" stroke="currentColor" strokeWidth="4" />
          <circle cx="49" cy="34" r="5" stroke="currentColor" strokeWidth="4" />
          <circle cx="24" cy="52" r="5" stroke="currentColor" strokeWidth="4" />
          <circle cx="40" cy="52" r="5" stroke="currentColor" strokeWidth="4" />
          <path d="M29 18 18 30M35 18l11 12M19 38l6 10M45 38l-6 10M29 52h6M20 34h24" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
        </svg>
      );
    case 'check':
    default:
      return (
        <svg className={className} viewBox="0 0 64 64" fill="none" aria-hidden="true">
          <circle cx="32" cy="32" r="21" stroke="currentColor" strokeWidth="4" />
          <path d="M22.5 32.5 29.5 39.5 43 25.5" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
  }
}
