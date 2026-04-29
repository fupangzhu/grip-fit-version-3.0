import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import './LoginPage.css';

export default function LoginPage() {
  const navigate = useNavigate();

  return (
    <div className="page-shell login-page">
      <Navbar />

      <LoginWave />

      <motion.div
        className="login-card"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
      >
        <header className="login-card__header">
          <h1>欢迎来到GripFit</h1>
          <p>登录以保存您的测量数据和报告</p>
        </header>

        <form
          className="login-form"
          onSubmit={(e) => {
            e.preventDefault();
            navigate('/onboarding');
          }}
        >
          <div className="login-field">
            <label>账号 (手机号/邮箱)</label>
            <input type="text" placeholder="name@precision.fit" />
          </div>

          <div className="login-field">
            <label>密码</label>
            <input type="password" placeholder="••••••••" />
          </div>

          <motion.button
            type="submit"
            className="login-cta"
            whileHover={{ y: -1, boxShadow: '0 14px 36px rgba(180,197,255,0.35)' }}
            whileTap={{ scale: 0.98 }}
          >
            <span>登录</span>
            <svg
              width="10"
              height="10"
              viewBox="0 0 9.33333 9.33333"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M1 4.66h7M5 1.5l3.16 3.16L5 7.83"
                stroke="#002a78"
                strokeWidth="1"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </motion.button>

          <div className="login-links">
            <a>注册新账号</a>
            <a>忘记密码？</a>
          </div>
        </form>

        <div className="login-guest">
          <a onClick={() => navigate('/onboarding')}>以游客身份登录</a>
        </div>
      </motion.div>
    </div>
  );
}

function LoginWave() {
  const paths = [
    'M-120 214 C 72 312, 176 166, 328 218 S 542 324, 714 220 S 950 134, 1124 230 S 1322 304, 1460 198',
    'M-116 254 C 94 344, 218 200, 370 252 S 590 354, 754 254 S 986 178, 1150 270 S 1318 338, 1462 238',
    'M-118 292 C 74 372, 230 240, 386 280 S 606 382, 780 286 S 986 214, 1168 306 S 1330 374, 1470 282',
    'M-98 330 C 112 410, 266 282, 424 322 S 638 420, 814 332 S 1026 254, 1190 344 S 1336 420, 1474 326',
    'M-128 180 C 88 264, 208 136, 356 182 S 562 286, 738 192 S 962 118, 1128 204 S 1308 270, 1468 172',
  ];

  return (
    <div className="login-wave" aria-hidden="true">
      <svg className="login-wave__svg" viewBox="0 0 1280 520" preserveAspectRatio="none">
        <defs>
          <linearGradient id="loginWaveStroke" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(72, 115, 178, 0)" />
            <stop offset="18%" stopColor="rgba(94, 143, 213, 0.24)" />
            <stop offset="50%" stopColor="rgba(184, 222, 247, 0.32)" />
            <stop offset="82%" stopColor="rgba(80, 128, 197, 0.22)" />
            <stop offset="100%" stopColor="rgba(72, 115, 178, 0)" />
          </linearGradient>
          <filter id="loginWaveBlur">
            <feGaussianBlur stdDeviation="1.7" />
          </filter>
        </defs>
        {paths.map((d, index) => (
          <path
            key={d}
            className={`login-wave__path login-wave__path--${index + 1}`}
            d={d}
            fill="none"
            stroke="url(#loginWaveStroke)"
            strokeWidth={index % 2 === 0 ? 1.35 : 0.9}
            filter="url(#loginWaveBlur)"
          />
        ))}
      </svg>
    </div>
  );
}
