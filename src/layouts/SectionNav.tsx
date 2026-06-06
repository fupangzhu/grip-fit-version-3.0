import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import './SectionNav.css';

type Item = { to: string; label: string; active: (p: string) => boolean };
type Section = { id: string; title: string; match: (p: string) => boolean; items: Item[] };

// 仅「报告产出」「机型库」两个分区有子页 → 出现左侧上下文子导航；其余分区无左栏（全宽）
const SECTIONS: Section[] = [
  {
    id: 'report',
    title: '报告产出',
    match: (p) => p.startsWith('/report') || p.startsWith('/tuning'),
    items: [
      { to: '/report/best-phone', label: '理论最优', active: (p) => p.startsWith('/report/best-phone') },
      { to: '/tuning', label: '参数微调', active: (p) => p.startsWith('/tuning') },
      { to: '/report', label: '手感报告', active: (p) => p === '/report' },
    ],
  },
  {
    id: 'library',
    title: '机型库',
    match: (p) => p.startsWith('/library') || p.startsWith('/phone/') || p.startsWith('/compare'),
    items: [
      { to: '/library', label: '机型排行', active: (p) => p.startsWith('/library') || p.startsWith('/phone/') },
      { to: '/compare', label: '对比清单', active: (p) => p.startsWith('/compare') },
    ],
  },
];

const STORAGE_KEY = 'gripfit-subnav-collapsed';

function readCollapsed(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export default function SectionNav() {
  const { pathname } = useLocation();
  const [collapsed, setCollapsed] = useState(readCollapsed);

  const section = SECTIONS.find((s) => s.match(pathname));
  if (!section) return null;

  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    try {
      localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
    } catch {
      /* ignore */
    }
  };

  return (
    <aside className={`section-nav ${collapsed ? 'is-collapsed' : ''}`} aria-label={`${section.title}子导航`}>
      <button
        type="button"
        className="section-nav__toggle"
        onClick={toggle}
        aria-label={collapsed ? '展开子导航' : '收起子导航'}
        title={collapsed ? '展开' : '收起'}
      >
        {collapsed ? <ChevronRight size={14} strokeWidth={2} /> : <ChevronLeft size={14} strokeWidth={2} />}
      </button>

      <div className="section-nav__inner" aria-hidden={collapsed}>
        <p className="section-nav__title">{section.title}</p>
        <nav className="section-nav__list">
          {section.items.map((item) => {
            const isActive = item.active(pathname);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`section-nav__item ${isActive ? 'is-active' : ''}`}
                aria-current={isActive ? 'page' : undefined}
                tabIndex={collapsed ? -1 : 0}
              >
                <span className="section-nav__dot" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
