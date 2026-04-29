import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import CardDeck from '../components/CardDeck';
import Dots from '../components/Dots';
import { STAGES } from '../data/stages';
import './OnboardingPage.css';

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [front, setFront] = useState(0);
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

  const isLast = front === count - 1;

  return (
    <div className="page-shell onb-page">
      <Navbar />

      <div className="onb-bg" aria-hidden />

      <main className="onb-main">
        <section className="onb-stage">
          <CardDeck stages={STAGES} front={front} onSelect={(i) => setFront(i)} />

          <div className="onb-controls">
            <button className="onb-ghost" onClick={prev} aria-label="上一张">
              <ArrowIcon dir="left" />
              <span>返回</span>
            </button>

            <Dots count={count} active={front} onSelect={(i) => setFront(i)} />

            {!isLast ? (
              <button className="onb-ghost" onClick={next} aria-label="下一张">
                <span>下一张</span>
                <ArrowIcon dir="right" />
              </button>
            ) : (
              <motion.button
                className="onb-cta"
                onClick={() => navigate('/login')}
                whileHover={{ y: -2, boxShadow: '0 16px 40px rgba(180, 197, 255, 0.28)' }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 320, damping: 24 }}
              >
                <span>开始使用</span>
                <ArrowIcon dir="right" />
              </motion.button>
            )}
          </div>
        </section>
      </main>
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
