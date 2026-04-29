import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../components/Navbar';
import GripfitTitle from '../components/GripfitTitle';
import './HomePage.css';

export default function HomePage() {
  const navigate = useNavigate();
  const [showGate, setShowGate] = useState(false);

  return (
    <div className="page-shell home-page">
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
