import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Scan,
  SlidersHorizontal,
  Smartphone,
  FileText,
  Database,
  UserCircle,
} from 'lucide-react';
import './AppShell.css';

const TOP_NAV = [
  { to: '/dashboard', label: '仪表盘' },
  { to: '/measure', label: '手部测量' },
  { to: '/library', label: '机型库' },
  { to: '/report', label: '报告产出' },
] as const;

const RAIL = [
  { to: '/dashboard', icon: LayoutDashboard, label: '仪表盘' },
  { to: '/measure', icon: Scan, label: '手部测量' },
  { to: '/tuning', icon: SlidersHorizontal, label: '参数微调' },
  { to: '/library', icon: Smartphone, label: '机型库' },
  { to: '/report', icon: FileText, label: '手感报告' },
  { to: '/my-data', icon: Database, label: '我的数据' },
] as const;

// 判断 topbar 哪一项激活：路径前缀匹配（/library/123 也算 /library 激活）
function isTopNavActive(currentPath: string, targetPath: string): boolean {
  if (targetPath === '/dashboard') return currentPath === '/dashboard';
  if (targetPath === '/report') {
    return currentPath.startsWith('/report') || currentPath.startsWith('/tuning') || currentPath === '/my-data';
  }
  if (targetPath === '/library') {
    return currentPath.startsWith('/library') || currentPath.startsWith('/phone/') || currentPath.startsWith('/compare');
  }
  return currentPath.startsWith(targetPath);
}

export default function AppShell() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  return (
    <div className="app-shell">
      <header className="app-shell__topbar">
        <button className="app-shell__brand" type="button" onClick={() => navigate('/')}>GRIPFIT</button>
        <nav className="app-shell__nav" aria-label="主导航">
          {TOP_NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={() => `app-shell__nav-item ${isTopNavActive(pathname, item.to) ? 'is-active' : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <button
          className="app-shell__user glass-pill"
          type="button"
          onClick={() => navigate('/my-data')}
          aria-label="我的数据"
          title="我的数据"
        >
          <UserCircle size={20} strokeWidth={1.4} />
        </button>
      </header>

      <aside className="app-shell__rail" aria-label="快捷导航">
        {RAIL.map((item) => {
          const Icon = item.icon;
          const active = pathname.startsWith(item.to);
          return (
            <button
              key={item.to}
              type="button"
              className={`app-shell__rail-item ${active ? 'is-active' : ''}`}
              onClick={() => navigate(item.to)}
              title={item.label}
              aria-label={item.label}
            >
              <Icon size={18} strokeWidth={1.6} />
            </button>
          );
        })}
      </aside>

      <main className="app-shell__content">
        <Outlet />
      </main>
    </div>
  );
}
