import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import './HandScanningPage.css';

const DESIGN_W = 1280;
const DESIGN_H = 913;

type CameraStatus = 'requesting' | 'active' | 'unavailable';

export default function HandScanningPage() {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [notice, setNotice] = useState('');
  const [ready, setReady] = useState(false);
  const [cameraStatus, setCameraStatus] = useState<CameraStatus>('requesting');
  const [cameraMessage, setCameraMessage] = useState('正在调用摄像头...');
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

  useEffect(() => {
    let stream: MediaStream | null = null;
    let cancelled = false;

    const stopCamera = () => {
      stream?.getTracks().forEach((track) => track.stop());
      stream = null;
    };

    const getCameraStream = (constraints: MediaStreamConstraints) =>
      new Promise<MediaStream>((resolve, reject) => {
        const timeoutId = window.setTimeout(() => {
          reject(new DOMException('Camera request timed out', 'AbortError'));
        }, 7000);

        navigator.mediaDevices
          .getUserMedia(constraints)
          .then((nextStream) => {
            window.clearTimeout(timeoutId);
            resolve(nextStream);
          })
          .catch((error: unknown) => {
            window.clearTimeout(timeoutId);
            reject(error);
          });
      });

    const requestCamera = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraStatus('unavailable');
        setCameraMessage('当前浏览器不支持摄像头调用，可继续使用手动输入。');
        return;
      }

      const preferRearCamera = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      const preferredFacingMode = preferRearCamera ? 'environment' : 'user';
      const fallbackFacingMode = preferRearCamera ? 'user' : 'environment';
      const cameraRequests: MediaStreamConstraints[] = [
        {
          audio: false,
          video: {
            facingMode: { ideal: preferredFacingMode },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        },
        {
          audio: false,
          video: {
            facingMode: { ideal: fallbackFacingMode },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        },
        { audio: false, video: true },
      ];

      for (const constraints of cameraRequests) {
        try {
          const nextStream = await getCameraStream(constraints);

          if (cancelled) {
            nextStream.getTracks().forEach((track) => track.stop());
            return;
          }

          stream = nextStream;

          if (videoRef.current) {
            videoRef.current.srcObject = nextStream;
            await videoRef.current.play().catch(() => undefined);
          }

          setCameraStatus('active');
          setCameraMessage(preferRearCamera ? '已连接手机后置摄像头' : '已连接电脑前置摄像头');
          return;
        } catch {
          stopCamera();
        }
      }

      if (!cancelled) {
        setCameraStatus('unavailable');
        setCameraMessage('未检测到可用摄像头，请检查权限或改用手动输入。');
      }
    };

    requestCamera();

    return () => {
      cancelled = true;
      stopCamera();
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, []);

  return (
    <div className="page-shell hand-scanning-page">
      <div className="hand-scanning-stage" style={{ transform: `translate(-50%, -50%) scale(${scale})` }}>
        <header className="hand-scanning-brand">GRIPFIT</header>

        <main className="hand-scanning-main" aria-labelledby="scan-title">
          <section
            className={`hand-scanning-feed ${cameraStatus === 'active' ? 'is-camera-active' : ''}`}
            aria-label="手部扫描画面"
          >
            <div className="hand-scanning-corner hand-scanning-corner--tl" />
            <div className="hand-scanning-corner hand-scanning-corner--tr" />
            <div className="hand-scanning-corner hand-scanning-corner--bl" />
            <div className="hand-scanning-corner hand-scanning-corner--br" />

            <video ref={videoRef} className="hand-scanning-video" playsInline muted autoPlay />
            <div className="hand-scanning-camera-status" role="status">
              <strong>{cameraStatus === 'active' ? 'CAMERA ONLINE' : 'CAMERA'}</strong>
              <span>{cameraMessage}</span>
            </div>

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
            <img className="hand-scanning-guide" src="/assets/hand-guide-outline.png" alt="" />
          </section>

          <section className="hand-scanning-progress" aria-labelledby="scan-title">
            <p>请将右手掌心朝上，并与虚线轮廓对齐</p>
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
