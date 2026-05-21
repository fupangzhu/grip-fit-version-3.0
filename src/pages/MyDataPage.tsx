import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { UserCircle, Trophy, RotateCcw, Edit3, ChevronRight } from 'lucide-react';
import { useFlowState } from '../hooks/useFlowState';
import { deriveIdealSpec } from '../data/scoring';
import { phones } from '../data/phones';
import './MyDataPage.css';

const HAND_TYPES = ['小手型', '中手型', '大手型'] as const;

function classifyHandType(handLength: number) {
  if (handLength < 175) return '小手型';
  if (handLength > 192) return '大手型';
  return '中手型';
}

export default function MyDataPage() {
  const navigate = useNavigate();
  const [flow] = useFlowState();
  const ideal = useMemo(() => deriveIdealSpec(flow.handLength, flow.handWidth), [flow.handLength, flow.handWidth]);
  const handType = classifyHandType(flow.handLength);

  const lengthPct = Math.round(((flow.handLength - 159) / (196 - 159)) * 100);
  const widthPct = Math.round(((flow.handWidth - 70) / (89 - 70)) * 100);

  // 把收藏 / 对比的机型当历史记录
  const historyPhones = phones.filter((p) => flow.favoriteIds.includes(p.id) || flow.compareIds.includes(p.id)).slice(0, 4);
  const fallbackHistory = phones.slice(0, 3);
  const historyToShow = historyPhones.length > 0 ? historyPhones : fallbackHistory;

  const planHistory = [
    { name: '自定义方案 A', date: '2024.05.22 14:32', status: '已应用' },
    { name: '轻量化方案 B', date: '2024.05.20 11:08', status: '草稿' },
    { name: '大屏握持方案 C', date: '2024.05.18 09:46', status: '已存档' },
  ];

  return (
    <div className="my-data-page">
      <header className="my-data-head">
        <h1>我的数据</h1>
        <span className="my-data-head__id">ID-D3</span>
      </header>

      <div className="my-data-grid">
        <article className="my-data-card glass-card my-data-card--hand">
          <h2>手部数据</h2>
          <div className="my-data-pair">
            <MetricColumn label="手长" value={flow.handLength} unit="mm" percent={lengthPct} desc={`超过 ${lengthPct}% 的中国成年人`} />
            <MetricColumn label="手宽" value={flow.handWidth} unit="mm" percent={widthPct} desc={`超过 ${widthPct}% 的中国成年人`} />
          </div>
          <div className="my-data-handtype">
            {HAND_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                className={handType === type ? 'is-active' : ''}
                disabled
              >
                {type}
              </button>
            ))}
          </div>
          <div className="my-data-actions">
            <button type="button" className="glass-button" onClick={() => navigate('/measure')}>
              <RotateCcw size={13} strokeWidth={1.7} /> 重新测量
            </button>
            <button type="button" className="my-data-actions__primary" onClick={() => navigate('/profile-info')}>
              <Edit3 size={13} strokeWidth={1.7} /> 修改画像
            </button>
          </div>
        </article>

        <aside className="my-data-card glass-card my-data-card--profile">
          <h2>用户画像</h2>
          <div className="my-data-profile-avatar">
            <UserCircle size={56} strokeWidth={1} />
          </div>
          <div className="my-data-profile-list">
            <p><span>性别</span><strong>{flow.gender === 'male' ? '男性' : '女性'}</strong></p>
            <p><span>年龄段</span><strong>{flow.ageGroup}</strong></p>
            <p><span>手部分类</span><strong>{handType}</strong></p>
          </div>
        </aside>

        <aside className="my-data-card glass-card my-data-card--summary">
          <h2>最优参数摘要</h2>
          <div className="my-data-summary-grid">
            <div><span>最优宽度</span><strong>{ideal.width.toFixed(1)}<small>mm</small></strong></div>
            <div><span>最优高度</span><strong>{ideal.height.toFixed(1)}<small>mm</small></strong></div>
            <div><span>最优厚度</span><strong>{ideal.thickness.toFixed(2)}<small>mm</small></strong></div>
            <div><span>最优重量</span><strong>{ideal.weight.toFixed(0)}<small>g</small></strong></div>
          </div>
          <button type="button" className="my-data-summary-cta" onClick={() => navigate('/report/best-phone')}>
            查看最优手机 →
          </button>
        </aside>

        <article className="my-data-card glass-card my-data-card--history">
          <header>
            <h2>历史记录</h2>
            <button type="button" onClick={() => navigate('/library')}>查看全部 →</button>
          </header>
          <div className="my-data-history-list">
            {historyToShow.map((phone, idx) => (
              <motion.button
                key={phone.id}
                type="button"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => navigate(`/phone/${phone.id}`)}
              >
                <div className="my-data-history-mock" />
                <div>
                  <strong>{phone.name}</strong>
                  <em>vs 自定义方案 A · {2024 - idx}-05-{22 - idx * 2}</em>
                </div>
                <ChevronRight size={14} strokeWidth={1.6} />
              </motion.button>
            ))}
          </div>
        </article>

        <article className="my-data-card glass-card my-data-card--plans">
          <header>
            <h2>自定义手机历史</h2>
            <button type="button" onClick={() => navigate('/tuning')}>新建方案 →</button>
          </header>
          <div className="my-data-plan-list">
            {planHistory.map((plan, idx) => (
              <motion.button
                key={plan.name}
                type="button"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => navigate('/tuning')}
              >
                <span className="my-data-plan-tag">PLAN</span>
                <div>
                  <strong>{plan.name}</strong>
                  <em>最近编辑：{plan.date}</em>
                </div>
                <b className={`my-data-plan-status my-data-plan-status--${idx}`}>{plan.status}</b>
              </motion.button>
            ))}
          </div>
        </article>
      </div>
    </div>
  );
}

function MetricColumn({ label, value, unit, percent, desc }: { label: string; value: number; unit: string; percent: number; desc: string }) {
  return (
    <div className="my-data-metric">
      <span className="my-data-metric__label">{label}</span>
      <strong className="my-data-metric__value">{value.toFixed(0)}<small>{unit}</small></strong>
      <em className="my-data-metric__desc">{desc}</em>
      <div className="my-data-metric__curve">
        <svg viewBox="0 0 200 56" preserveAspectRatio="none">
          <path d="M 4 50 C 56 50 70 8 100 8 C 130 8 144 50 196 50" fill="none" stroke="rgba(180, 197, 255, 0.45)" strokeWidth="1.2" />
          <line x1={`${percent}%`} x2={`${percent}%`} y1="0" y2="54" stroke="var(--accent)" strokeDasharray="2 2" strokeWidth="1" />
          <circle cx={`${percent}%`} cy="28" r="2.6" fill="var(--accent)" />
        </svg>
        <div className="my-data-metric__scale">
          <span>P5</span>
          <span>P{percent}</span>
          <span>P95</span>
        </div>
      </div>
    </div>
  );
}
