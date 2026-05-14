import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import CardDeck from '../components/CardDeck';
import Dots from '../components/Dots';
import { STAGES } from '../data/stages';
import './OnboardingPage.css';

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [front, setFront] = useState(0);
  const [notice, setNotice] = useState('');
  const count = STAGES.length;

  const next = useCallback(() => setFront((f) => (f + 1) % count), [count]);
  const prev = useCallback(() => setFront((f) => (f - 1 + count) % count), [count]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, prev]);

  const showNext = front >= 2;

  return (
    <div className="page-shell onb-page">
      <Navbar />

      <div className="onb-bg" aria-hidden />

      <main className="onb-main">
        <section className="onb-stage">
          <CardDeck stages={STAGES} front={front} onSelect={(i) => setFront(i)} />
        </section>
      </main>

      <button className="onb-back" onClick={() => navigate('/role-select')} aria-label="返回身份选择">
        <ArrowIcon dir="left" />
        <span>返回</span>
      </button>

      <div className="onb-dots">
        <Dots count={count} active={front} onSelect={(i) => setFront(i)} />
      </div>

      <div className="onb-actions">
        {showNext ? (
          <button className="onb-next" onClick={next} aria-label="下一张">
            <span>下一张</span>
            <ArrowIcon dir="right" />
          </button>
        ) : null}

        <motion.button
          className="onb-cta"
          onClick={() => navigate('/profile-info')}
          whileHover={{ y: -2, boxShadow: '0 18px 44px rgba(117, 150, 255, 0.32)' }}
          whileTap={{ scale: 0.985 }}
          transition={{ type: 'spring', stiffness: 320, damping: 24 }}
        >
          <span>开始使用</span>
        </motion.button>
      </div>

      <AnimatePresence>
        {notice ? (
          <motion.div
            className="onb-notice"
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

function ArrowIcon({ dir }: { dir: 'left' | 'right' }) {
  const rotate = dir === 'left' ? 180 : 0;
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" style={{ transform: `rotate(${rotate}deg)` }}>
      <path
        d="M2 7h10M8 3l4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.4"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
