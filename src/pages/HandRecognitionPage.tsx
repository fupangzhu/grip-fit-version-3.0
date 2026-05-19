import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import './HandRecognitionPage.css';

const DESIGN_W = 1280;
const DESIGN_H = 913;

export default function HandRecognitionPage() {
  const navigate = useNavigate();
  const [notice, setNotice] = useState('');
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const updateScale = () => {
      setScale(Math.min(window.innerWidth / DESIGN_W, window.innerHeight / DESIGN_H, 1));
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  const showNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 1800);
  };

  return (
    <div className="page-shell hand-recognition-page">
      <div className="hand-scan-stage" style={{ transform: `translate(-50%, -50%) scale(${scale})` }}>
        <header className="hand-scan-brand">GRIPFIT</header>
        <div className="hand-scan-menu" aria-hidden>
          <span />
          <span />
          <span />
        </div>

        <main className="hand-scan-main" aria-labelledby="hand-scan-title">
          <section className="hand-scan-progress" aria-label="扫描流程进度">
            <div className="hand-scan-progress__top">
              <span>HAND CAPTURE</span>
              <span>02 / 02</span>
            </div>
            <div className="hand-scan-progress__track">
              <span />
            </div>
          </section>

          <section className="hand-scan-capture" aria-labelledby="hand-scan-title">
            <div className="hand-scan-corner hand-scan-corner--tl" />
            <div className="hand-scan-corner hand-scan-corner--tr" />
            <div className="hand-scan-corner hand-scan-corner--bl" />
            <div className="hand-scan-corner hand-scan-corner--br" />
            <img className="hand-guide-frame" src="/assets/hand-guide-outline.png" alt="" />
            <motion.div
              className="hand-scan-line"
              aria-hidden
              animate={{ y: [-72, 66, -72], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 4.6, repeat: Infinity, ease: 'easeInOut' }}
            />
          </section>

          <section className="hand-scan-copy">
            <h1 id="hand-scan-title">将右手掌心朝上对齐虚线</h1>
            <p>点击扫描后将调用摄像头进行实时识别</p>
          </section>

          <div className="hand-scan-actions">
            <motion.button
              className="hand-scan-primary"
              type="button"
              onClick={() => {
                sessionStorage.setItem('gripfit-camera-scan-requested', '1');
                navigate('/hand-scanning');
              }}
              whileHover={{ y: -2, boxShadow: '0 18px 46px rgba(79, 123, 255, 0.34)' }}
              whileTap={{ scale: 0.99 }}
              transition={{ type: 'spring', stiffness: 320, damping: 24 }}
            >
              进行扫描
            </motion.button>
            <motion.button
              className="hand-scan-secondary"
              type="button"
              onClick={() => navigate('/measure/manual')}
              whileHover={{ borderColor: 'rgba(180, 197, 255, 0.32)', color: 'rgba(232, 237, 250, 0.78)' }}
              whileTap={{ scale: 0.98 }}
            >
              手动输入
            </motion.button>
          </div>
        </main>
      </div>

      <AnimatePresence>
        {notice ? (
          <motion.div
            className="hand-scan-notice"
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
