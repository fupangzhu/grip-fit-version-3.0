import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Scan, SlidersHorizontal, Smartphone, FileText, Database, ChevronRight, Trophy } from 'lucide-react';
import { useFlowState } from '../hooks/useFlowState';
import { scorePhoneForHand } from '../data/scoring';
import { phones } from '../data/phones';
import './DashboardPage.css';

const QUICK_LINKS = [
  { to: '/measure', icon: Scan, label: '手部测量', desc: '智能 / 手动切换' },
  { to: '/tuning', icon: SlidersHorizontal, label: '参数微调', desc: '自定义你的最优机型' },
  { to: '/library', icon: Smartphone, label: '机型库', desc: '22 款主流在售机型' },
  { to: '/report', icon: FileText, label: '手感报告', desc: '18 维度评分详情' },
  { to: '/my-data', icon: Database, label: '我的数据', desc: '历史 + 方案归档' },
] as const;

export default function DashboardPage() {
  const navigate = useNavigate();
  const [flow] = useFlowState();

  // 算 Top 3 推荐机型
  const top3 = useMemo(() => {
    return phones
      .map((p) => ({ phone: p, score: scorePhoneForHand(p, flow.handLength, flow.handWidth) }))
      .sort((a, b) => b.score.match - a.score.match)
      .slice(0, 3);
  }, [flow.handLength, flow.handWidth]);

  return (
    <div className="dashboard-page">
      <header className="dashboard-page__head">
        <div>
          <h1>仪表盘</h1>
          <p>欢迎回到 GripFit · 基于 GB/T 10000-1988 + AHP 层次分析法</p>
        </div>
      </header>

      <section className="dashboard-snapshot">
        <article className="dashboard-card glass-card dashboard-card--hand">
          <span>当前手部数据</span>
          <strong>{flow.handLength.toFixed(0)}<small>mm</small><em>×</em>{flow.handWidth.toFixed(0)}<small>mm</small></strong>
          <p>{flow.gender === 'male' ? '男性' : '女性'} · {flow.ageGroup}</p>
        </article>
        <article className="dashboard-card glass-card dashboard-card--match">
          <span>当前最佳匹配</span>
          <strong>{top3[0]?.score.match.toFixed(1)}<small>%</small></strong>
          <p>{top3[0]?.phone.name}</p>
        </article>
        <article className="dashboard-card glass-card dashboard-card--saved">
          <span>对比清单 / 收藏</span>
          <strong>{flow.compareIds.length}<em>/</em>{flow.favoriteIds.length}</strong>
          <p>{flow.compareIds.length} 个对比 · {flow.favoriteIds.length} 个收藏</p>
        </article>
      </section>

      <section className="dashboard-section">
        <header>
          <h2>快捷入口</h2>
        </header>
        <div className="dashboard-quick">
          {QUICK_LINKS.map((item, idx) => {
            const Icon = item.icon;
            return (
              <motion.button
                key={item.to}
                type="button"
                className="dashboard-quick__item glass-card"
                onClick={() => navigate(item.to)}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                whileHover={{ y: -3 }}
              >
                <Icon size={22} strokeWidth={1.5} />
                <strong>{item.label}</strong>
                <span>{item.desc}</span>
                <ChevronRight size={14} strokeWidth={1.7} />
              </motion.button>
            );
          })}
        </div>
      </section>

      <section className="dashboard-section">
        <header>
          <h2><Trophy size={16} strokeWidth={1.7} /> Top 3 推荐机型</h2>
          <button type="button" onClick={() => navigate('/library')}>查看完整列表 →</button>
        </header>
        <div className="dashboard-top">
          {top3.map((entry, idx) => (
            <motion.button
              key={entry.phone.id}
              type="button"
              className="dashboard-top__item glass-card"
              onClick={() => navigate(`/phone/${entry.phone.id}`)}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.06 }}
            >
              <strong className="dashboard-top__rank">#{idx + 1}</strong>
              <h3>{entry.phone.name}</h3>
              <p>{entry.phone.releaseDate} · {entry.phone.brand}</p>
              <div className="dashboard-top__metrics">
                <em>{entry.score.match.toFixed(1)}%</em>
                <span>匹配度</span>
                <em>{entry.score.total.toFixed(1)}</em>
                <span>评分</span>
              </div>
            </motion.button>
          ))}
        </div>
      </section>
    </div>
  );
}
