import { NavLink } from 'react-router-dom';
import './ReportSubnav.css';

// 5 项子导航，在最优手机页和参数微调页之间共用
const SUBNAV = [
  { to: '/report/best-phone', label: '最优手机' },
  { to: '/tuning', label: '自定义调参' },
  { to: '/library', label: '机型库' },
  { to: '/report', label: '手感报告' },
  { to: '/my-data', label: '我的数据' },
] as const;

export default function ReportSubnav() {
  return (
    <aside className="report-subnav" aria-label="报告产出子导航">
      {SUBNAV.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end
          className={({ isActive }) => `report-subnav__item ${isActive ? 'is-active' : ''}`}
        >
          {item.label}
        </NavLink>
      ))}
    </aside>
  );
}
