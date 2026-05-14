import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useSpring, useTransform } from 'framer-motion';
import Navbar from '../components/Navbar';
import GripfitTitle from '../components/GripfitTitle';
import { AnalysisIntroContent } from './AnalysisIntroPage';
import './HomePage.css';

export default function HomePage() {
  const navigate = useNavigate();
  const pageRef = useRef<HTMLDivElement>(null);
  const [showGate, setShowGate] = useState(false);
  const { scrollYProgress } = useScroll({ container: pageRef });
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 42,
    damping: 32,
    restDelta: 0.001,
  });
  const heroOpacity = useTransform(smoothProgress, [0, 0.16], [1, 0]);
  const transitionOpacity = useTransform(smoothProgress, [0.04, 0.18, 0.34], [0, 1, 0]);
  const analysisOpacity = useTransform(smoothProgress, [0.1, 0.24], [0, 1]);
  const analysisY = useTransform(smoothProgress, [0.1, 0.24], [160, 0]);
  const analysisScale = useTransform(smoothProgress, [0.1, 0.24], [0.96, 1]);

  useEffect(() => {
    const onWheel = (event: WheelEvent) => {
      const page = pageRef.current;
      if (!page) return;

      const maxScroll = page.scrollHeight - page.clientHeight;
      if (maxScroll <= 0) return;

      event.preventDefault();
      page.scrollTop = Math.max(0, Math.min(maxScroll, page.scrollTop + event.deltaY * 0.48));
    };

    window.addEventListener('wheel', onWheel, { passive: false });
    return () => window.removeEventListener('wheel', onWheel);
  }, []);

  return (
    <div className="page-shell home-page" ref={pageRef}>
      <motion.div className="home-fixed-stage" style={{ opacity: heroOpacity }}>
        <Navbar />

        <main className="home-main">
          <section className="home-hero" aria-labelledby="home-title">
            <motion.div
              className="home-copy"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              <h1 id="home-title" className="home-title">
                <GripfitTitle width={724} height={178} />
              </h1>
              <p className="home-kicker">FIND THE PERFECT PHONE FOR YOUR GRIP.</p>
              <motion.button
                type="button"
                className="home-start"
                onClick={() => {
                  setShowGate(true);
                  window.setTimeout(() => navigate('/role-select'), 260);
                }}
                whileHover={{ y: -2, borderColor: 'rgba(255,255,255,0.82)' }}
                whileTap={{ scale: 0.98 }}
              >
                开始体验
              </motion.button>
            </motion.div>

            <motion.div
              className="home-art"
              aria-hidden="true"
              initial={{ opacity: 0, x: 42 }}
              animate={{ opacity: 1, x: 0, y: [0, -9, 0, 6, 0] }}
              transition={{
                opacity: { duration: 0.9, delay: 0.08, ease: [0.22, 1, 0.36, 1] },
                x: { duration: 0.9, delay: 0.08, ease: [0.22, 1, 0.36, 1] },
                y: { duration: 6.5, repeat: Infinity, ease: 'easeInOut' },
              }}
            >
              <img className="home-art__img" src="/assets/hero-phone-cut.png" alt="" />
            </motion.div>
          </section>
        </main>

        <footer className="home-footer" aria-label="项目版本信息">
          <span>© 2025 GripFit · 毕业设计项目</span>
          <span>Ergonomics Lab · v2.0</span>
        </footer>
      </motion.div>

      <motion.div className="home-transition-glow" style={{ opacity: transitionOpacity }} aria-hidden />

      <div className="home-scroll-content">
        <motion.section
          className="home-analysis-stage"
          style={{ opacity: analysisOpacity, y: analysisY, scale: analysisScale }}
        >
          <AnalysisIntroContent
            onStart={() => navigate('/profile-info')}
          />
        </motion.section>
      </div>

      <AnimatePresence>
        {showGate ? (
          <motion.div
            className="home-gate"
            role="status"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}
          >
            正在进入身份选择
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
