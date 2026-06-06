import { useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Compass, ChevronDown, ChevronUp, GripVertical } from 'lucide-react';
import './DevNav.css';

// ⚠️ 仅开发期使用的页面跳转工具，正式上线前删除（App.tsx 中 import.meta.env.DEV 已自动屏蔽生产构建）。

type LinkItem = { to: string; label: string };

const GROUPS: { title: string; links: LinkItem[] }[] = [
  {
    title: '入口流程',
    links: [
      { to: '/', label: '首页' },
      { to: '/role-select', label: '角色选择' },
      { to: '/login', label: '登录' },
      { to: '/onboarding', label: '功能引导' },
      { to: '/profile-info', label: '信息/扫描' },
    ],
  },
  {
    title: '工作台',
    links: [
      { to: '/dashboard', label: '仪表盘' },
      { to: '/measure', label: '手部测量' },
      { to: '/report/best-phone', label: '理论最优' },
      { to: '/tuning', label: '参数微调' },
      { to: '/report', label: '手感报告' },
      { to: '/library', label: '机型库' },
      { to: '/phone/s24-ultra', label: '机型详情' },
      { to: '/compare', label: '对比' },
      { to: '/my-data', label: '我的数据' },
    ],
  },
  {
    title: '调试',
    links: [{ to: '/three-demo', label: '3D Demo' }],
  },
];

const POS_KEY = 'gripfit-devnav-pos';
const OPEN_KEY = 'gripfit-devnav-open';

export default function DevNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const [open, setOpen] = useState(() => {
    try {
      return localStorage.getItem(OPEN_KEY) !== '0';
    } catch {
      return true;
    }
  });
  const [pos, setPos] = useState<{ x: number; y: number } | null>(() => {
    try {
      const raw = localStorage.getItem(POS_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const drag = useRef<{ dx: number; dy: number } | null>(null);

  const toggleOpen = () => {
    setOpen((o) => {
      const next = !o;
      try {
        localStorage.setItem(OPEN_KEY, next ? '1' : '0');
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const onPointerDown = (e: React.PointerEvent) => {
    const box = (e.currentTarget as HTMLElement).closest('.dev-nav') as HTMLElement | null;
    if (!box) return;
    const rect = box.getBoundingClientRect();
    drag.current = { dx: e.clientX - rect.left, dy: e.clientY - rect.top };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const x = Math.max(0, Math.min(window.innerWidth - 46, e.clientX - drag.current.dx));
    const y = Math.max(0, Math.min(window.innerHeight - 28, e.clientY - drag.current.dy));
    setPos({ x, y });
  };
  const onPointerUp = (e: React.PointerEvent) => {
    drag.current = null;
    try {
      const box = (e.currentTarget as HTMLElement).closest('.dev-nav') as HTMLElement | null;
      if (box) {
        const r = box.getBoundingClientRect();
        localStorage.setItem(POS_KEY, JSON.stringify({ x: Math.round(r.left), y: Math.round(r.top) }));
      }
    } catch {
      /* ignore */
    }
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
  };

  const style = pos ? { left: pos.x, top: pos.y, right: 'auto', bottom: 'auto' } : undefined;

  return (
    <div className="dev-nav" style={style as React.CSSProperties}>
      <div
        className="dev-nav__bar"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        <GripVertical size={12} className="dev-nav__grip" />
        <Compass size={12} />
        <span className="dev-nav__title">DEV 跳转</span>
        <button
          type="button"
          className="dev-nav__collapse"
          onClick={toggleOpen}
          onPointerDown={(e) => e.stopPropagation()}
          aria-label={open ? '收起' : '展开'}
          title={open ? '收起' : '展开'}
        >
          {open ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
        </button>
      </div>

      {open ? (
        <div className="dev-nav__body">
          {GROUPS.map((g) => (
            <div key={g.title} className="dev-nav__group">
              <p className="dev-nav__group-title">{g.title}</p>
              <div className="dev-nav__links">
                {g.links.map((l) => {
                  const active = pathname === l.to;
                  return (
                    <button
                      key={l.to}
                      type="button"
                      className={`dev-nav__link ${active ? 'is-active' : ''}`}
                      onClick={() => navigate(l.to)}
                    >
                      {l.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
