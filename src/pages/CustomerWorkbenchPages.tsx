import { useEffect, useLayoutEffect, useRef, useState, type MutableRefObject } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import HandGuideOutline from '../components/HandGuideOutline';
import { writeFlowState } from '../hooks/useFlowState';
import './CustomerWorkbenchPages.css';

// Phase 0：删除后续所有页面，仅保留 ProfileInfoPage 的 onboarding intake 流程。
// FlowState / readFlowState / writeFlowState 已迁移到 src/hooks/useFlowState.ts（Phase 1）

const profileGenderOptions = [
  { key: 'male', label: '男 / Male', icon: '/assets/profile-figma-icon-male.svg' },
  { key: 'female', label: '女 / Female', icon: '/assets/profile-figma-icon-female.svg' },
] as const;

const profileAgeOptions = [
  { key: '18-35', label: '18-35', meta: 'EARLY-MID' },
  { key: '36-55', label: '36-55', meta: 'EXPERIENCED' },
  { key: '56+', label: '56+', meta: 'SENIOR' },
] as const;

// GB/T 10000-1988《中国成年人人体尺寸》— 手长 / 手宽分组采样表（单位 mm）
type DimSpec = { mean: number; std: number; min: number; max: number };
type GenderKey = (typeof profileGenderOptions)[number]['key'];
type AgeKey = (typeof profileAgeOptions)[number]['key'];

const HAND_DIMENSIONS: Record<GenderKey, Record<AgeKey, { length: DimSpec; width: DimSpec }>> = {
  male: {
    '18-35': { length: { mean: 183, std: 8, min: 170, max: 196 }, width: { mean: 82, std: 4, min: 76, max: 89 } },
    '36-55': { length: { mean: 184, std: 8, min: 171, max: 197 }, width: { mean: 83, std: 4, min: 77, max: 90 } },
    '56+':   { length: { mean: 180, std: 8, min: 167, max: 193 }, width: { mean: 81, std: 4, min: 75, max: 88 } },
  },
  female: {
    '18-35': { length: { mean: 171, std: 7, min: 159, max: 184 }, width: { mean: 76, std: 4, min: 70, max: 83 } },
    '36-55': { length: { mean: 172, std: 7, min: 160, max: 185 }, width: { mean: 77, std: 4, min: 71, max: 84 } },
    '56+':   { length: { mean: 169, std: 7, min: 157, max: 181 }, width: { mean: 75, std: 4, min: 69, max: 82 } },
  },
};

function sampleNormal(spec: DimSpec): number {
  // Box-Muller 正态分布采样 → clamp 到 P5-P95 范围
  const u1 = Math.random() || 1e-9;
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  const raw = spec.mean + z * spec.std;
  return Math.min(spec.max, Math.max(spec.min, raw));
}

function sampleHandSize(gender: GenderKey, age: AgeKey) {
  const spec = HAND_DIMENSIONS[gender][age];
  return {
    length: Math.round(sampleNormal(spec.length) * 10) / 10,
    width: Math.round(sampleNormal(spec.width) * 10) / 10,
  };
}

type Pt = { x: number; y: number };

type CapturedHand = {
  dataUrl: string;
  /** 镜像后的归一化 [0,1] 关键点（与 dataUrl 显示方向一致） */
  landmarks: Pt[];
};

function captureHandFrame(
  video: HTMLVideoElement,
  landmarks: { x: number; y: number }[],
): CapturedHand | null {
  // Phase 0: 用户决定不抠图，直接 bbox 裁剪截图。
  const W = video.videoWidth;
  const H = video.videoHeight;
  if (!W || !H) return null;

  // 1. 算关键点轴对齐 bbox，外扩 50%（25% padding × 两侧），再 clamp 到画面
  let minX = 1;
  let maxX = 0;
  let minY = 1;
  let maxY = 0;
  for (const p of landmarks) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const half = (Math.max(maxX - minX, maxY - minY) / 2) * 1.5;
  const lx = Math.max(0, cx - half);
  const rx = Math.min(1, cx + half);
  const ty = Math.max(0, cy - half);
  const by = Math.min(1, cy + half);
  const bw = rx - lx;
  const bh = by - ty;
  if (bw < 0.1 || bh < 0.1) return null;

  const cw = Math.round(bw * W);
  const ch = Math.round(bh * H);
  const canvas = document.createElement('canvas');
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // 镜像绘制视频 bbox 区域（与画面方向一致）
  ctx.save();
  ctx.translate(cw, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(video, lx * W, ty * H, bw * W, bh * H, 0, 0, cw, ch);
  ctx.restore();

  // 关键点 → 镜像后裁剪后的归一化坐标（confirm 页 SVG 引线用）
  const canvasLandmarks: Pt[] = landmarks.map((p) => ({
    x: (rx - p.x) / bw,
    y: (p.y - ty) / bh,
  }));

  return { dataUrl: canvas.toDataURL('image/png'), landmarks: canvasLandmarks };
}

type IntakeStage = 'profile' | 'scan-active' | 'scan-confirm';
type IntakeCameraStatus = 'requesting' | 'active' | 'unavailable';
type MpStatus = 'idle' | 'loading' | 'ready' | 'failed';
type ScanPhase = 'alignment' | 'analyzing';

const CAROUSEL_IMAGES = [
  '/assets/profile-grip-slim.png',
  '/assets/profile-grip-normal.png',
  '/assets/profile-grip-wide.png',
];

function ProfileInfoPage() {
  const navigate = useNavigate();
  const [gender, setGender] = useState<(typeof profileGenderOptions)[number]['key']>('male');
  const [ageGroup, setAgeGroup] = useState<(typeof profileAgeOptions)[number]['key']>('18-35');
  const [stage, setStage] = useState<IntakeStage>('profile');
  const [carouselIdx, setCarouselIdx] = useState(0);
  const [cameraStatus, setCameraStatus] = useState<IntakeCameraStatus>('requesting');
  const [cameraMessage, setCameraMessage] = useState('正在调用摄像头...');
  const [alignProgress, setAlignProgress] = useState(0);
  const [mpStatus, setMpStatus] = useState<MpStatus>('idle');
  const [scanPhase, setScanPhase] = useState<ScanPhase>('alignment');
  const [capturedHand, setCapturedHand] = useState<CapturedHand | null>(null);
  const [handMeasure, setHandMeasure] = useState<{ length: number; width: number } | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useLayoutEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [stage]);

  useEffect(() => {
    const reset = () => {
      if (scrollRef.current) scrollRef.current.scrollTop = 0;
    };
    window.addEventListener('resize', reset);
    document.addEventListener('fullscreenchange', reset);
    return () => {
      window.removeEventListener('resize', reset);
      document.removeEventListener('fullscreenchange', reset);
    };
  }, []);

  useEffect(() => {
    if (stage !== 'profile') return;
    const id = window.setInterval(() => {
      setCarouselIdx((i) => (i + 1) % CAROUSEL_IMAGES.length);
    }, 3600);
    return () => window.clearInterval(id);
  }, [stage]);

  useEffect(() => {
    if (stage !== 'scan-active') {
      setAlignProgress(0);
      setMpStatus('idle');
      setScanPhase('alignment');
      return;
    }
    // 进入扫描时清空上一次的捕获结果
    setCapturedHand(null);
    setHandMeasure(null);

    let stream: MediaStream | null = null;
    let cancelled = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let handLandmarker: any = null;
    let rafId = 0;
    let fallbackTimerId = 0;
    let analyzingTimerId = 0;
    let alignedStableTime = 0;
    let lastFrameTime = 0;

    const stopCamera = () => {
      stream?.getTracks().forEach((t) => t.stop());
      stream = null;
    };

    // Release camera + MediaPipe without marking the effect as cancelled,
    // so the analyzing phase timer can still drive progress to scan-confirm.
    const stopCameraAndMp = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = 0;
      try {
        handLandmarker?.close?.();
      } catch {
        /* ignore */
      }
      handLandmarker = null;
      stopCamera();
      if (videoRef.current) videoRef.current.srcObject = null;
    };

    const startAnalyzingPhase = () => {
      if (cancelled) return;
      setScanPhase('analyzing');
      setAlignProgress(0);
      setCameraMessage('MediaPipe 正在解算 21 个关键点尺寸，请保持稳定');
      const start = Date.now();
      const duration = 3600;
      analyzingTimerId = window.setInterval(() => {
        if (cancelled) return;
        const pct = Math.min(100, ((Date.now() - start) / duration) * 100);
        setAlignProgress(pct);
        if (pct >= 100) {
          window.clearInterval(analyzingTimerId);
          analyzingTimerId = 0;
          window.setTimeout(() => {
            if (!cancelled) setStage('scan-confirm');
          }, 320);
        }
      }, 90);
    };

    const handleAlignmentSuccess = () => {
      setAlignProgress(100);
      stopCameraAndMp();
      window.setTimeout(() => {
        if (cancelled) return;
        startAnalyzingPhase();
      }, 400);
    };

    const startFallbackTimer = () => {
      // No MediaPipe → fall back to fixed-time alignment animation,
      // then chain into the analyzing phase like the success branch.
      const start = Date.now();
      const duration = 4400;
      fallbackTimerId = window.setInterval(() => {
        if (cancelled) return;
        const elapsed = Date.now() - start;
        const pct = Math.min(100, (elapsed / duration) * 100);
        setAlignProgress(pct);
        if (pct >= 100) {
          window.clearInterval(fallbackTimerId);
          fallbackTimerId = 0;
          // 没有 MediaPipe 关键点，仍按 GB/T 采样数据；capturedHand 保持 null → 渲染静态图
          const measure = sampleHandSize(gender, ageGroup);
          setHandMeasure(measure);
          writeFlowState({ handLength: measure.length, handWidth: measure.width, gender, ageGroup });
          window.setTimeout(() => {
            if (!cancelled) handleAlignmentSuccess();
          }, 320);
        }
      }, 90);
    };

    const startDetectionLoop = () => {
      const detect = () => {
        if (cancelled || !handLandmarker) return;
        const video = videoRef.current;
        if (!video || video.readyState < 2 || video.paused || video.ended) {
          rafId = requestAnimationFrame(detect);
          return;
        }
        const now = performance.now();
        try {
          const result = handLandmarker.detectForVideo(video, now);
          const landmarks = result?.landmarks?.[0];
          if (landmarks && landmarks.length >= 21) {
            // Compute centroid + bounding box in normalized [0,1] coords
            let sx = 0;
            let sy = 0;
            let minX = 1;
            let maxX = 0;
            let minY = 1;
            let maxY = 0;
            for (const p of landmarks) {
              sx += p.x;
              sy += p.y;
              if (p.x < minX) minX = p.x;
              if (p.x > maxX) maxX = p.x;
              if (p.y < minY) minY = p.y;
              if (p.y > maxY) maxY = p.y;
            }
            const cx = sx / landmarks.length;
            const cy = sy / landmarks.length;
            const size = Math.max(maxX - minX, maxY - minY);

            // 评分（宽松档）：手心居中度 + 手大小合适度
            const centerDist = Math.hypot(cx - 0.5, cy - 0.5);
            const centerScore = Math.max(0, 1 - centerDist * 1.8);       // 中心容差 0.56
            const sizeScore = Math.max(0, 1 - Math.abs(size - 0.55) * 1.6); // 大小容差 0.63
            const score = centerScore * 0.55 + sizeScore * 0.45; // 0-1

            const ALIGN_THRESHOLD = 0.50;
            const STABLE_DURATION = 0.8;

            if (score >= ALIGN_THRESHOLD) {
              const dt = lastFrameTime ? Math.min(0.12, (now - lastFrameTime) / 1000) : 0;
              alignedStableTime += dt;
              if (alignedStableTime >= STABLE_DURATION) {
                // 在释放摄像头之前抓帧（纯 bbox 裁剪，不抠图）
                const captured = video ? captureHandFrame(video, landmarks) : null;
                if (captured) setCapturedHand(captured);
                const measure = sampleHandSize(gender, ageGroup);
                setHandMeasure(measure);
                writeFlowState({ handLength: measure.length, handWidth: measure.width, gender, ageGroup });
                handleAlignmentSuccess();
                return;
              }
            } else {
              alignedStableTime *= 0.9;
            }

            const stableProgress = (alignedStableTime / STABLE_DURATION) * 100;
            const liveScore = score * 95;
            setAlignProgress(Math.max(stableProgress, liveScore));

            if (score >= ALIGN_THRESHOLD) {
              setCameraMessage('对齐稳定中，请保持 0.8 秒...');
            } else if (score >= 0.30) {
              setCameraMessage('继续调整位置，让右手伸入画面中央');
            } else {
              setCameraMessage('请将右手掌心朝上对齐虚线');
            }
          } else {
            alignedStableTime *= 0.88;
            setAlignProgress((prev) => prev * 0.92);
            setCameraMessage('未检测到手部，请把右手伸入画面中央');
          }
        } catch {
          /* skip frame on detection error */
        }
        lastFrameTime = now;
        rafId = requestAnimationFrame(detect);
      };
      detect();
    };

    const initMediaPipe = async () => {
      setMpStatus('loading');
      setCameraMessage('已连接摄像头，正在加载手部识别模型...');
      try {
        const { HandLandmarker, FilesetResolver } = await import('@mediapipe/tasks-vision');
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm',
        );
        if (cancelled) return;
        handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numHands: 1,
        });
        if (cancelled) {
          handLandmarker?.close?.();
          return;
        }
        setMpStatus('ready');
        setCameraMessage('请将右手掌心朝上对齐虚线');
        startDetectionLoop();
      } catch (err) {
        console.warn('MediaPipe Hands 加载失败，回退到基础计时模式：', err);
        if (cancelled) return;
        setMpStatus('failed');
        setCameraMessage('手部识别模型加载失败，使用基础对齐计时');
        startFallbackTimer();
      }
    };

    const requestCamera = async () => {
      setCameraStatus('requesting');
      setCameraMessage('正在调用摄像头...');

      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraStatus('unavailable');
        setCameraMessage('当前浏览器不支持摄像头调用');
        return;
      }

      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      const preferred = isMobile ? 'environment' : 'user';
      const fallback = isMobile ? 'user' : 'environment';
      const requests: MediaStreamConstraints[] = [
        { audio: false, video: { facingMode: { ideal: preferred }, width: { ideal: 1280 }, height: { ideal: 720 } } },
        { audio: false, video: { facingMode: { ideal: fallback }, width: { ideal: 1280 }, height: { ideal: 720 } } },
        { audio: false, video: true },
      ];

      let acquired = false;
      for (const constraints of requests) {
        try {
          const next = await navigator.mediaDevices.getUserMedia(constraints);
          if (cancelled) {
            next.getTracks().forEach((t) => t.stop());
            return;
          }
          stream = next;
          if (videoRef.current) {
            videoRef.current.srcObject = next;
            await videoRef.current.play().catch(() => undefined);
          }
          setCameraStatus('active');
          acquired = true;
          break;
        } catch {
          stopCamera();
        }
      }

      if (!acquired) {
        if (!cancelled) {
          setCameraStatus('unavailable');
          setCameraMessage('摄像头不可用，请检查浏览器权限');
        }
        return;
      }

      // Camera ready → start MediaPipe
      await initMediaPipe();
    };

    requestCamera();
    return () => {
      cancelled = true;
      if (rafId) cancelAnimationFrame(rafId);
      if (fallbackTimerId) window.clearInterval(fallbackTimerId);
      if (analyzingTimerId) window.clearInterval(analyzingTimerId);
      stopCameraAndMp();
    };
  }, [stage]);

  const stepNumber = stage === 'profile' ? 1 : 2;
  const stepLabel = stepNumber === 1 ? '01' : '02';
  const trackPercent = stepNumber === 1 ? 50 : 100;
  const formLocked = stage !== 'profile';

  return (
    <div className="page-shell profile-info-page">
      <div className={`profile-stage profile-stage--${stage}`}>
        <header className="profile-topbar">
          <span>GRIPFIT</span>
        </header>
        <section className="profile-panel">
          <div className="profile-panel-scroll" ref={scrollRef}>
            <div className="profile-progress">
              <div className="profile-progress__meta">
                <span>PROFILE INTAKE</span>
                <span>{stepLabel} / 02</span>
              </div>
              <div className="profile-progress__track">
                <motion.span
                  initial={{ width: 0 }}
                  animate={{ width: `${trackPercent}%` }}
                  transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.05 }}
                />
              </div>
            </div>
            <h1>补充一点信息，<br />让推荐更精准</h1>

            <div className={`profile-option-section profile-option-section--gender ${formLocked ? 'is-locked' : ''}`}>
              <p className="profile-section-label">性别选择 / SELECT GENDER</p>
              <div className="profile-gender-grid">
                {profileGenderOptions.map((item) => (
                  <button
                    key={item.key}
                    className={gender === item.key ? 'is-selected' : ''}
                    type="button"
                    aria-pressed={gender === item.key}
                    disabled={formLocked}
                    onClick={() => setGender(item.key)}
                  >
                    <img src={item.icon} alt="" />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className={`profile-option-section profile-option-section--age ${formLocked ? 'is-locked' : ''}`}>
              <p className="profile-section-label">年龄区间 / AGE GROUP</p>
              <div className="profile-age-grid">
                {profileAgeOptions.map((item) => (
                  <button
                    key={item.key}
                    className={ageGroup === item.key ? 'is-selected' : ''}
                    type="button"
                    aria-pressed={ageGroup === item.key}
                    disabled={formLocked}
                    onClick={() => setAgeGroup(item.key)}
                  >
                    <strong>{item.label}</strong>
                    <span>{item.meta}</span>
                  </button>
                ))}
              </div>
            </div>

            {!formLocked ? (
              <button className="profile-primary" type="button" onClick={() => setStage('scan-active')}>
                <span>确认提交</span>
                <img src="/assets/profile-figma-icon-arrow.svg" alt="" />
              </button>
            ) : (
              <button className="profile-primary profile-primary--locked" type="button" disabled>
                <span>信息已确认 · 继续右侧采集</span>
              </button>
            )}
          </div>
        </section>

        <section className="profile-visual" aria-hidden>
          {stage === 'profile' ? <ProfileCarousel idx={carouselIdx} /> : null}
          {stage === 'scan-active' ? (
            <ScanActiveStage
              videoRef={videoRef}
              cameraStatus={cameraStatus}
              cameraMessage={cameraMessage}
              alignProgress={alignProgress}
              mpStatus={mpStatus}
              scanPhase={scanPhase}
              onCancel={() => setStage('profile')}
            />
          ) : null}
          {stage === 'scan-confirm' ? (
            <ScanConfirmStage
              captured={capturedHand}
              measure={handMeasure}
              onConfirm={() => navigate('/measure')}
              onRetry={() => setStage('scan-active')}
            />
          ) : null}
        </section>
      </div>
    </div>
  );
}

function ProfileCarousel({ idx }: { idx: number }) {
  return (
    <>
      <div className="profile-corner-dots">
        {CAROUSEL_IMAGES.map((_, i) => (
          <span key={i} className={i === idx ? 'is-active' : ''} />
        ))}
      </div>
      <div className="profile-phone-crop">
        {CAROUSEL_IMAGES.map((src, i) => (
          <img key={src} src={src} alt="" className={i === idx ? 'is-active' : ''} />
        ))}
      </div>
    </>
  );
}

function ScanActiveStage({
  videoRef,
  cameraStatus,
  cameraMessage,
  alignProgress,
  mpStatus,
  scanPhase,
  onCancel,
}: {
  videoRef: MutableRefObject<HTMLVideoElement | null>;
  cameraStatus: IntakeCameraStatus;
  cameraMessage: string;
  alignProgress: number;
  mpStatus: MpStatus;
  scanPhase: ScanPhase;
  onCancel: () => void;
}) {
  const isAnalyzing = scanPhase === 'analyzing';

  const statusLabel = isAnalyzing
    ? 'ANALYZING DIMENSIONS'
    : cameraStatus === 'active'
      ? mpStatus === 'loading'
        ? 'LOADING MEDIAPIPE'
        : mpStatus === 'ready'
          ? 'HAND DETECT · MEDIAPIPE'
          : mpStatus === 'failed'
            ? 'FALLBACK · TIMER ALIGN'
            : 'CAMERA ONLINE'
      : cameraStatus === 'unavailable'
        ? 'CAMERA OFFLINE'
        : 'CAMERA INITIALIZING';

  const progressLabel = isAnalyzing ? 'DIMENSION SCAN' : 'HAND ALIGNMENT';
  const footnote = isAnalyzing
    ? 'MediaPipe 正在解算 21 个关键点尺寸，请保持稳定。'
    : '请将右手掌心朝上对齐虚线，保持稳定。MediaPipe 检测到对齐稳定后将自动采集数据。';

  return (
    <div className="profile-scan-camera">
      <div className={`profile-scan-camera__viewport is-${cameraStatus}`}>
        <div className="profile-scan-corner profile-scan-corner--tl" />
        <div className="profile-scan-corner profile-scan-corner--tr" />
        <div className="profile-scan-corner profile-scan-corner--bl" />
        <div className="profile-scan-corner profile-scan-corner--br" />
        <video ref={videoRef} className="profile-scan-camera__video" playsInline muted autoPlay />
        <HandGuideOutline className="profile-scan-camera__guide" />
        <div className="profile-scan-camera__status">
          <strong>{statusLabel}</strong>
          <span>{cameraMessage}</span>
        </div>
      </div>
      <div className="profile-scan-camera__align">
        <div className="profile-scan-camera__align-head">
          <span>{progressLabel}</span>
          <strong>{Math.round(alignProgress)}%</strong>
        </div>
        <div className="profile-scan-camera__align-track">
          <span style={{ width: `${alignProgress}%` }} />
        </div>
        <p>{footnote}</p>
        <button type="button" className="profile-scan-camera__cancel" onClick={onCancel}>
          取消扫描
        </button>
      </div>
    </div>
  );
}

function AnimatedNumber({ value, decimals = 1, duration = 800 }: { value: number; decimals?: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(value * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return <>{display.toFixed(decimals)}</>;
}

function ScanConfirmStage({
  captured,
  measure,
  onConfirm,
  onRetry,
}: {
  captured: CapturedHand | null;
  measure: { length: number; width: number } | null;
  onConfirm: () => void;
  onRetry: () => void;
}) {
  const safeMeasure = measure ?? { length: 0, width: 0 };
  // 关键点索引：0=wrist, 12=middle_tip, 5=index_mcp, 17=pinky_mcp
  const lm = captured?.landmarks;
  const wrist = lm?.[0];
  const middleTip = lm?.[12];
  const indexMcp = lm?.[5];
  const pinkyMcp = lm?.[17];
  const haveOverlay = !!(wrist && middleTip && indexMcp && pinkyMcp);

  return (
    <div className="profile-scan-data">
      <div className="profile-scan-data__head">
        <span>CAPTURED METRICS</span>
        <strong>2 / 2</strong>
      </div>

      <div className={`profile-scan-result ${captured ? '' : 'is-fallback'}`}>
        <div className="profile-scan-result__frame">
          {captured ? (
            <img src={captured.dataUrl} className="profile-scan-result__hand" alt="" />
          ) : (
            <img src="/assets/measurement-auto-hand.png" className="profile-scan-result__hand profile-scan-result__hand--fallback" alt="" />
          )}

          {haveOverlay && wrist && middleTip && indexMcp && pinkyMcp ? (
            <svg className="profile-scan-result__overlay" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
              {/* 手长引线：wrist (0) ↔ middle_tip (12) */}
              <line
                x1={middleTip.x * 100}
                y1={middleTip.y * 100}
                x2={wrist.x * 100}
                y2={wrist.y * 100}
                stroke="rgba(180,197,255,0.78)"
                strokeWidth="0.35"
                strokeDasharray="0.9 0.9"
                vectorEffect="non-scaling-stroke"
              />
              <circle cx={middleTip.x * 100} cy={middleTip.y * 100} r="0.6" fill="#b4c5ff" />
              <circle cx={wrist.x * 100} cy={wrist.y * 100} r="0.6" fill="#b4c5ff" />
              {/* 手宽引线：index_mcp (5) ↔ pinky_mcp (17) */}
              <line
                x1={indexMcp.x * 100}
                y1={indexMcp.y * 100}
                x2={pinkyMcp.x * 100}
                y2={pinkyMcp.y * 100}
                stroke="rgba(180,197,255,0.78)"
                strokeWidth="0.35"
                strokeDasharray="0.9 0.9"
                vectorEffect="non-scaling-stroke"
              />
              <circle cx={indexMcp.x * 100} cy={indexMcp.y * 100} r="0.6" fill="#b4c5ff" />
              <circle cx={pinkyMcp.x * 100} cy={pinkyMcp.y * 100} r="0.6" fill="#b4c5ff" />
            </svg>
          ) : null}
        </div>

        <div className="profile-scan-result__chip profile-scan-result__chip--length">
          <span>手长 · HAND LENGTH</span>
          <strong>
            <AnimatedNumber value={safeMeasure.length} />
            <small>mm</small>
          </strong>
        </div>
        <div className="profile-scan-result__chip profile-scan-result__chip--width">
          <span>手宽 · HAND WIDTH</span>
          <strong>
            <AnimatedNumber value={safeMeasure.width} />
            <small>mm</small>
          </strong>
        </div>
      </div>

      <div className="profile-scan-data__actions">
        <button type="button" className="profile-scan-data__retry" onClick={onRetry}>
          重新扫描
        </button>
        <button
          type="button"
          className="profile-scan-data__confirm"
          onClick={onConfirm}
          disabled={!measure}
        >
          确认进入测量
        </button>
      </div>
    </div>
  );
}

export { ProfileInfoPage };
