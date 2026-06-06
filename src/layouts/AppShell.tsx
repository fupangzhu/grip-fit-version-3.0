import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { UserCircle } from 'lucide-react';
import SectionNav from './SectionNav';
import './AppShell.css';

// 顶栏 = 4 大分区（仪表盘 / 手部测量 / 机型库 / 报告产出）+ 右上头像→我的数据
const TOP_NAV = [
  { to: '/dashboard', label: '仪表盘', match: (p: string) => p === '/dashboard' },
  { to: '/measure', label: '手部测量', match: (p: string) => p.startsWith('/measure') },
  {
    to: '/report/best-phone',
    label: '报告产出',
    match: (p: string) => p.startsWith('/report') || p.startsWith('/tuning'),
  },
  {
    to: '/library',
    label: '机型库',
    match: (p: string) => p.startsWith('/library') || p.startsWith('/phone/') || p.startsWith('/compare'),
  },
] as const;

export default function AppShell() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const userActive = pathname.startsWith('/my-data');

  return (
    <div className="app-shell">
      <header className="app-shell__topbar">
        <button className="app-shell__brand" type="button" onClick={() => navigate('/')}>
          GRIPFIT
        </button>
        <nav className="app-shell__nav" aria-label="主导航">
          {TOP_NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={`app-shell__nav-item ${item.match(pathname) ? 'is-active' : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <button
          className={`app-shell__user glass-pill ${userActive ? 'is-active' : ''}`}
          type="button"
          onClick={() => navigate('/my-data')}
          aria-label="我的数据"
          title="我的数据"
        >
          <UserCircle size={20} strokeWidth={1.4} />
        </button>
      </header>

      <div className="app-shell__body">
        <SectionNav />
        <main className="app-shell__content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
