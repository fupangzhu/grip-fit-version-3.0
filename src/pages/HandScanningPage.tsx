import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import './HandScanningPage.css';

const DESIGN_W = 1280;
const DESIGN_H = 913;

export default function HandScanningPage() {
  const navigate = useNavigate();
  const [notice, setNotice] = useState('');
  const [ready, setReady] = useState(false);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const updateScale = () => {
      setScale(Math.min(window.innerWidth / DESIGN_W, window.innerHeight / DESIGN_H, 1));
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => setReady(true), 4200);
    return () => window.clearTimeout(timer);
  }, []);

  const showNotice = () => {
    setNotice('手动输入页将在确认后继续实现');
    window.setTimeout(() => setNotice(''), 1800);
  };

  return (
    <div className="page-shell hand-scanning-page">
      <div className="hand-scanning-stage" style={{ transform: `translate(-50%, -50%) scale(${scale})` }}>
        <header className="hand-scanning-brand">GRIPFIT</header>

        <main className="hand-scanning-main" aria-labelledby="scan-title">
          <section className="hand-scanning-feed" aria-label="手部扫描画面">
            <div className="hand-scanning-corner hand-scanning-corner--tl" />
            <div className="hand-scanning-corner hand-scanning-corner--tr" />
            <div className="hand-scanning-corner hand-scanning-corner--bl" />
            <div className="hand-scanning-corner hand-scanning-corner--br" />

            <motion.div
              className="hand-scanning-beam"
              aria-hidden
              animate={{ y: [-46, 56, -46], opacity: [0.52, 1, 0.52] }}
              transition={{ duration: 3.8, repeat: Infinity, ease: 'easeInOut' }}
            />

            <div className="hand-scanning-hand" aria-hidden>
              <img src="/assets/hand-scan.png" alt="" />
              <div className="hand-scanning-mesh" />
              <div className="hand-scanning-hand-glow" />
            </div>
          </section>

          <section className="hand-scanning-progress" aria-labelledby="scan-title">
            <p>校对进程</p>
            <h1 id="scan-title">64.18%</h1>
            <div className="hand-scanning-progressbar" aria-hidden>
              <motion.span
                initial={{ width: '0%' }}
                animate={{ width: '64.18%' }}
                transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
          </section>

          <div className="hand-scanning-actions">
            <button
              className={`hand-scanning-primary ${ready ? 'is-ready' : ''}`}
              type="button"
              aria-disabled={!ready}
              onClick={() => {
                if (ready) {
                  navigate('/measure/auto');
                } else {
                  setNotice('扫描仍在校对中，请稍后查看测量结果');
                  window.setTimeout(() => setNotice(''), 1600);
                }
              }}
            >
              {ready ? '查看测量结果' : '扫描中...'}
            </button>
            <motion.button
              className="hand-scanning-secondary"
              type="button"
              onClick={() => navigate('/measure/manual')}
              whileHover={{ borderColor: 'rgba(180, 197, 255, 0.32)', color: 'rgba(232, 237, 250, 0.72)' }}
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
            className="hand-scanning-notice"
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
