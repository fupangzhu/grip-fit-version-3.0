import { useNavigate } from 'react-router-dom';
import './Navbar.css';

type NavbarProps = {
  loginVariant?: 'plain' | 'icon';
};

export default function Navbar({ loginVariant = 'plain' }: NavbarProps) {
  const navigate = useNavigate();
  return (
    <nav className="gf-nav">
      <span className="gf-nav__logo" onClick={() => navigate('/')}>
        GRIPFIT
      </span>
      <ul className="gf-nav__links">
        <li>功能介绍</li>
        <li>使用方法</li>
        <li>关于项目</li>
      </ul>
      <button className="gf-nav__login" onClick={() => navigate('/login')}>
        {loginVariant === 'icon' ? <LoginIcon /> : null}
        <span>登录</span>
      </button>
    </nav>
  );
}

function LoginIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path
        d="M5 2H2.6C2.25 2 2 2.25 2 2.6v6.8c0 .35.25.6.6.6H5"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
      <path
        d="M6 3.4 8.6 6 6 8.6M8.4 6H2.8"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
