import { useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../components/Navbar';
import './RoleSelectPage.css';

export default function RoleSelectPage() {
  const navigate = useNavigate();
  const [notice, setNotice] = useState('');

  const chooseEnterprise = () => {
    setNotice('企业端将在后续页面确认后接入');
    window.setTimeout(() => setNotice(''), 1800);
  };

  return (
    <div className="page-shell role-page">
      <Navbar />
      <RoleWave />

      <main className="role-main" aria-labelledby="role-title">
        <motion.h1
          id="role-title"
          className="role-title"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          请问你是?
        </motion.h1>

        <motion.div
          className="role-card-row"
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
        >
          <RoleCard
            icon={<UserIcon />}
            title="消费者"
            description="Personalized ergonomic tracking. Sync your devices for a perfect fit and improve daily grip health with real-time feedback."
            onClick={() => navigate('/login')}
          />
          <RoleCard
            icon={<BuildingIcon />}
            title="企业人员"
            description="Scalable solutions for organizations. Access advanced analytics, secure collaboration tools, and administrative control."
            onClick={chooseEnterprise}
          />
        </motion.div>
      </main>

      <AnimatePresence>
        {notice ? (
          <motion.div
            className="role-notice"
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

function RoleCard({
  icon,
  title,
  description,
  onClick,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      className="role-card"
      onClick={onClick}
      whileHover={{ y: -5, borderColor: 'rgba(178, 205, 255, 0.48)' }}
      whileTap={{ scale: 0.985 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
    >
      <span className="role-card__glare" aria-hidden />
      <span className="role-card__icon">{icon}</span>
      <span className="role-card__title">{title}</span>
      <span className="role-card__desc">{description}</span>
    </motion.button>
  );
}

function RoleWave() {
  const paths = [
    'M-90 240 C 70 322, 154 186, 292 232 S 538 318, 690 226 S 916 145, 1088 232 S 1312 318, 1462 196',
    'M-96 276 C 98 350, 210 204, 360 252 S 565 341, 736 246 S 1005 170, 1162 260 S 1320 322, 1458 234',
    'M-100 310 C 72 378, 235 250, 382 286 S 566 377, 756 286 S 940 218, 1104 302 S 1302 370, 1468 280',
    'M-80 340 C 112 414, 262 274, 414 318 S 602 406, 790 322 S 1004 250, 1180 334 S 1310 398, 1472 322',
    'M-108 202 C 72 264, 206 164, 338 196 S 526 294, 708 202 S 930 122, 1095 206 S 1284 258, 1458 182',
    'M-92 366 C 96 430, 260 320, 414 350 S 602 436, 784 364 S 982 294, 1160 372 S 1324 438, 1478 374',
  ];

  return (
    <div className="role-wave" aria-hidden="true">
      <svg className="role-wave__svg" viewBox="0 0 1280 520" preserveAspectRatio="none">
        <defs>
          <linearGradient id="roleWaveStroke" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(78, 126, 190, 0)" />
            <stop offset="20%" stopColor="rgba(111, 161, 230, 0.28)" />
            <stop offset="52%" stopColor="rgba(178, 217, 245, 0.34)" />
            <stop offset="82%" stopColor="rgba(85, 135, 204, 0.24)" />
            <stop offset="100%" stopColor="rgba(78, 126, 190, 0)" />
          </linearGradient>
          <filter id="roleWaveBlur">
            <feGaussianBlur stdDeviation="1.8" />
          </filter>
        </defs>
        {paths.map((d, index) => (
          <path
            key={d}
            className={`role-wave__path role-wave__path--${index + 1}`}
            d={d}
            fill="none"
            stroke="url(#roleWaveStroke)"
            strokeWidth={index % 2 === 0 ? 1.4 : 0.9}
            filter="url(#roleWaveBlur)"
          />
        ))}
      </svg>
    </div>
  );
}

function UserIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path
        d="M9 8.35a2.42 2.42 0 1 0 0-4.84 2.42 2.42 0 0 0 0 4.84ZM4.55 14.2c.35-2.08 2.13-3.48 4.45-3.48s4.1 1.4 4.45 3.48"
        fill="currentColor"
      />
    </svg>
  );
}

function BuildingIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path
        d="M3.6 14.6V4.2h6.05v10.4H3.6Zm7.08 0V7.5h3.72v7.1h-3.72ZM5.25 6.15h1.08v1.08H5.25V6.15Zm2.65 0h1.08v1.08H7.9V6.15ZM5.25 8.6h1.08v1.08H5.25V8.6Zm2.65 0h1.08v1.08H7.9V8.6Zm0 2.44h1.08v1.08H7.9v-1.08Zm4.02-.98h1.08v1.08h-1.08v-1.08Zm0 2.2h1.08v1.08h-1.08v-1.08Z"
        fill="currentColor"
      />
    </svg>
  );
}
