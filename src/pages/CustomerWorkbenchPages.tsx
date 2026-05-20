import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type MutableRefObject, type PointerEvent, type ReactNode } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  MatchRing,
  NumericSlider,
  RangeFilter,
  ToggleSwitch,
  WorkbenchPreview,
  type RangeValue,
} from '../components/workbench';
import {
  comparisonScores,
  optimalParams,
  phones,
  userMetrics,
  type PhoneItem,
} from '../data/customerFlow';
import './CustomerWorkbenchPages.css';

type WorkbenchPage = 'dashboard' | 'measurement' | 'tuning' | 'report' | 'library' | 'data';
type TuningView = 'front' | 'back' | 'hand' | 'risk';
type ReleaseFilter = 'all' | 'year' | 'two' | 'older';

type FlowState = {
  handLength: number;
  handWidth: number;
  thumbReach: number;
  width: number;
  height: number;
  thickness: number;
  weight: number;
  cameraBump: number;
};

const profileGenderOptions = [
  { key: 'male', label: '男 / Male', icon: '/assets/profile-figma-icon-male.svg' },
  { key: 'female', label: '女 / Female', icon: '/assets/profile-figma-icon-female.svg' },
] as const;

const profileAgeOptions = [
  { key: '18-35', label: '18-35', meta: 'EARLY-MID' },
  { key: '36-55', label: '36-55', meta: 'EXPERIENCED' },
  { key: '56+', label: '56+', meta: 'SENIOR' },
] as const;

type MeasurementViewport = 'top' | 'lateral' | 'palm' | 'wire';

const measurementViewports: Array<{ key: MeasurementViewport; label: string }> = [
  { key: 'top', label: 'TOP' },
  { key: 'lateral', label: 'LATERAL' },
  { key: 'palm', label: 'PALM' },
  { key: 'wire', label: 'WIRE' },
] as const;

type ReportDimension = {
  id: string;
  group: string;
  name: string;
  value: string;
  score: number;
  weight: number;
  status: 'risk' | 'warn' | 'good';
  advice: string;
  optimum: string;
  curve: number;
};

const FLOW_KEY = 'gripfit-flow-state-v2';

const defaultFlow: FlowState = {
  handLength: 188.5,
  handWidth: 84.2,
  thumbReach: 66,
  width: 70.6,
  height: 151.4,
  thickness: 7.6,
  weight: 180,
  cameraBump: 1.6,
};

const navItems = [
  { key: 'dashboard', label: '仪表盘', to: '/profile/data' },
  { key: 'measurement', label: '手部测量', to: '/measure/auto' },
  { key: 'library', label: '机型库', to: '/models/recommendations' },
  { key: 'report', label: '报告产出', to: '/report/handfeel-detail' },
  { key: 'tuning', label: '参数微调', to: '/report/tuning/basic' },
] as const;

const railItems = [
  { key: 'dashboard', label: '总览', tag: 'OV' },
  { key: 'measurement', label: '测量', tag: 'MS' },
  { key: 'tuning', label: '微调', tag: 'TN' },
  { key: 'library', label: '机型', tag: 'DB' },
  { key: 'report', label: '报告', tag: 'RP' },
  { key: 'data', label: '数据', tag: 'DT' },
] as const;

const tuningViews: Array<{ key: TuningView; label: string; route: string }> = [
  { key: 'front', label: '正面', route: '/report/tuning/basic' },
  { key: 'back', label: '背面', route: '/report/tuning/camera' },
  { key: 'hand', label: '手持', route: '/report/tuning/hand' },
  { key: 'risk', label: '风险点', route: '/report/tuning/risk-map' },
];

const reportDimensions: ReportDimension[] = [
  { id: 'weight', group: '基本尺寸', name: '重量', value: '182 g', score: 5.8, weight: 0.126, status: 'risk', advice: '当前重量超出最优上限，长时间握持容易增加手部疲劳。', optimum: '150-180 g', curve: 64 },
  { id: 'camera-bump', group: '功能部件', name: '镜头凸起', value: '1.6 mm', score: 6.0, weight: 0.083, status: 'risk', advice: '镜头凸起偏高，食指支撑点稳定性下降。', optimum: '0.8-1.5 mm', curve: 58 },
  { id: 'width', group: '基本尺寸', name: '宽度', value: '71.8 mm', score: 6.1, weight: 0.098, status: 'warn', advice: '宽度接近你的掌宽上限，建议控制在 72mm 以下。', optimum: '68-72 mm', curve: 74 },
  { id: 'corner', group: '形态曲率', name: '四边圆角', value: 'R6.5', score: 6.8, weight: 0.067, status: 'warn', advice: '圆角半径偏小，掌根接触压力略高。', optimum: 'R10-R14', curve: 38 },
  { id: 'center', group: '整机平衡', name: '重心位置', value: '上偏左 6 mm', score: 6.6, weight: 0.072, status: 'warn', advice: '重心轻微偏上，单手滑动时更容易前倾。', optimum: '中心偏差小于 3mm', curve: 60 },
  { id: 'black-edge', group: '视觉感知', name: '黑边宽度', value: '1.8 mm', score: 6.9, weight: 0.061, status: 'warn', advice: '黑边宽度对视觉轻量感有影响，可进一步压缩。', optimum: '1.2-1.6 mm', curve: 56 },
  { id: 'back-arc', group: '形态曲率', name: '背面弧度', value: '62 %', score: 8.7, weight: 0.074, status: 'good', advice: '背部弧度贴合掌心，稳定性表现良好。', optimum: '58-68 %', curve: 62 },
  { id: 'finger', group: '操作便利', name: '指纹位置', value: '居中', score: 9.0, weight: 0.058, status: 'good', advice: '指纹区域在拇指自然可达范围内。', optimum: '居中偏下', curve: 50 },
  { id: 'height', group: '基本尺寸', name: '机身高度', value: '151.4 mm', score: 8.6, weight: 0.092, status: 'good', advice: '高度适中，单手顶部触达压力可控。', optimum: '145-152 mm', curve: 70 },
  { id: 'thickness', group: '基本尺寸', name: '机身厚度', value: '7.6 mm', score: 8.0, weight: 0.079, status: 'good', advice: '厚度落在舒适区间内。', optimum: '7.0-8.2 mm', curve: 52 },
  { id: 'ratio', group: '视觉感知', name: '长宽比', value: '19.5:9', score: 8.4, weight: 0.052, status: 'good', advice: '比例兼顾信息密度和单手握持。', optimum: '19-20:9', curve: 57 },
  { id: 'side-key', group: '操作便利', name: '侧键位置', value: '右侧中段', score: 8.1, weight: 0.049, status: 'good', advice: '侧键在拇指自然弯曲区域。', optimum: '右侧中段', curve: 55 },
  { id: 'screen', group: '视觉感知', name: '屏幕尺寸', value: '6.3 英寸', score: 8.8, weight: 0.076, status: 'good', advice: '屏幕大小与掌宽匹配。', optimum: '6.1-6.4 英寸', curve: 49 },
  { id: 'texture', group: '形态曲率', name: '背板摩擦', value: '0.42', score: 8.2, weight: 0.054, status: 'good', advice: '背板摩擦力足够，滑落风险较低。', optimum: '0.38-0.46', curve: 53 },
  { id: 'bottom', group: '操作便利', name: '底部支撑', value: '良好', score: 8.5, weight: 0.063, status: 'good', advice: '小指支撑点与机身底部距离合理。', optimum: '良好', curve: 61 },
  { id: 'module', group: '功能部件', name: '后摄位置', value: '左上', score: 7.4, weight: 0.071, status: 'warn', advice: '左上模组对食指支撑有轻微影响。', optimum: '左上偏内', curve: 43 },
  { id: 'edge', group: '形态曲率', name: '边缘过渡', value: '柔和', score: 8.3, weight: 0.064, status: 'good', advice: '边缘过渡没有明显割手感。', optimum: '柔和过渡', curve: 60 },
  { id: 'reach', group: '操作便利', name: '拇指可达', value: '66 %', score: 8.6, weight: 0.087, status: 'good', advice: '主要操作区域可被自然覆盖。', optimum: '62-72 %', curve: 66 },
];

const categoryNames = ['全部', '基本尺寸', '形态曲率', '功能部件', '操作便利', '视觉感知', '整机平衡'];

function readFlowState(): FlowState {
  if (typeof window === 'undefined') return defaultFlow;
  try {
    const parsed = JSON.parse(window.localStorage.getItem(FLOW_KEY) ?? '{}') as Partial<FlowState>;
    return { ...defaultFlow, ...parsed };
  } catch {
    return defaultFlow;
  }
}

function writeFlowState(patch: Partial<FlowState>) {
  if (typeof window === 'undefined') return;
  const next = { ...readFlowState(), ...patch };
  window.localStorage.setItem(FLOW_KEY, JSON.stringify(next));
}

function uniquePhones(ids: string[]) {
  const uniqueIds = Array.from(new Set(ids.filter(Boolean)));
  return uniqueIds
    .map((id) => phones.find((phone) => phone.id === id))
    .filter(Boolean) as PhoneItem[];
}

function parseComparePhones(search: string, fallback: PhoneItem[] = []) {
  const params = new URLSearchParams(search);
  const raw = params.get('items');
  if (raw === null) return fallback;
  return uniquePhones(raw.split(',').map((item) => item.trim()));
}

function compareSearch(ids: string[], options?: Record<string, boolean>) {
  const params = new URLSearchParams();
  params.set('items', Array.from(new Set(ids)).join(','));
  if (options) {
    params.set('ideal', options.ideal ? '1' : '0');
    params.set('detail', options.detail ? '1' : '0');
    params.set('group', options.group ? '1' : '0');
  }
  return params.toString();
}

function priceNumber(phone: PhoneItem) {
  return Number(phone.price.replace(/\D/g, '')) || 0;
}

function screenNumber(phone: PhoneItem) {
  const size = phone.screen.match(/\d+(?:\.\d+)?/);
  return size ? Number(size[0]) : 0;
}

function releaseMatches(phone: PhoneItem, filter: ReleaseFilter) {
  if (filter === 'all') return true;
  const release = new Date(phone.releaseDate).getFullYear();
  if (filter === 'year') return release >= 2024;
  if (filter === 'two') return release >= 2023;
  return release < 2023;
}

function WorkbenchShell({
  active,
  navActive = active,
  children,
  wide = false,
  rail = true,
}: {
  active: WorkbenchPage;
  navActive?: WorkbenchPage;
  children: ReactNode;
  wide?: boolean;
  rail?: boolean;
}) {
  const navigate = useNavigate();

  return (
    <div className={`page-shell workbench-page ${wide ? 'workbench-page--wide' : ''} ${rail ? '' : 'workbench-page--no-rail'}`}>
      <header className="wb-topbar">
        <button className="wb-brand" type="button" onClick={() => navigate('/')}>GRIPFIT</button>
        <nav className="wb-nav" aria-label="主导航">
          {navItems.map((item) => (
            <button key={item.key} type="button" className={item.key === navActive ? 'is-active' : ''} onClick={() => navigate(item.to)}>
              {item.label}
            </button>
          ))}
        </nav>
        <button className="wb-user" type="button" onClick={() => navigate('/profile/data')}>ID-D3</button>
      </header>

      {rail ? (
        <aside className="wb-rail" aria-label="工作台快捷导航">
          {railItems.map((item) => (
            <button
              key={item.key}
              type="button"
              className={item.key === active ? 'is-active' : ''}
              title={item.label}
              onClick={() => {
                if (item.key === 'dashboard' || item.key === 'data') navigate('/profile/data');
                if (item.key === 'measurement') navigate('/measure/auto');
                if (item.key === 'tuning') navigate('/report/tuning/basic');
                if (item.key === 'library') navigate('/models/recommendations');
                if (item.key === 'report') navigate('/report/handfeel-detail');
              }}
            >
              <span>{item.tag}</span>
            </button>
          ))}
        </aside>
      ) : null}

      <main className="wb-content">{children}</main>
    </div>
  );
}

function PhoneMock({ phone, large = false }: { phone: PhoneItem; large?: boolean }) {
  return (
    <div className={`phone-mock phone-mock--${phone.color} ${large ? 'phone-mock--large' : ''}`} aria-hidden>
      <div className="phone-camera"><span /><span /><span /></div>
      <div className="phone-screen-lines"><i /><i /><i /><i /></div>
    </div>
  );
}

function PhoneVisual({ phone, large = false, compact = false, className = '' }: { phone: PhoneItem; large?: boolean; compact?: boolean; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <PhoneMock phone={phone} large={large} />;
  return (
    <div className={`phone-visual ${large ? 'phone-visual--large' : ''} ${compact ? 'phone-visual--compact' : ''} ${className}`}>
      <img src={phone.imageUrl} alt={phone.name} onError={() => setFailed(true)} loading="lazy" />
    </div>
  );
}

function ScoreRing({ value, label, tone = 'blue' }: { value: number; label: string; tone?: 'blue' | 'green' }) {
  const deg = Math.min(360, Math.max(0, value * 36));
  return (
    <div className={`score-ring score-ring--${tone}`} style={{ '--score-deg': `${deg}deg` } as CSSProperties}>
      <div><strong>{value.toFixed(1)}</strong><span>/10</span></div>
      <p>{label}</p>
    </div>
  );
}

function TinyCurve({ percent = 62 }: { percent?: number }) {
  return (
    <div className="tiny-curve">
      <svg viewBox="0 0 260 82" aria-hidden="true">
        <path d="M8 70 C54 70 72 22 130 22 C188 22 205 70 252 70" fill="none" stroke="rgba(75,126,255,.86)" strokeWidth="2" />
        <path d="M8 70 C54 70 72 22 130 22 C188 22 205 70 252 70 L252 72 L8 72 Z" fill="rgba(75,126,255,.12)" />
      </svg>
      <span style={{ left: `${percent}%` }} />
    </div>
  );
}

function MatchBadge({ value }: { value: number }) {
  return <span className="match-badge" style={{ '--match': `${value * 3.6}deg` } as CSSProperties}>{value.toFixed(1)}%</span>;
}

function ResponseCurve({ percent, color = 'blue' }: { percent: number; color?: 'blue' | 'orange' | 'green' }) {
  return (
    <div className={`response-curve response-curve--${color}`}>
      <svg viewBox="0 0 260 90" aria-hidden="true">
        <rect x="86" y="18" width="72" height="52" rx="3" />
        <path d="M10 72 C54 22 92 20 126 34 C168 51 196 50 250 28" />
        <line x1={`${percent}%`} x2={`${percent}%`} y1="12" y2="76" />
      </svg>
    </div>
  );
}

function CurveInput({
  title,
  desc,
  value,
  min,
  max,
  step,
  percent,
  editing,
  onChange,
}: {
  title: string;
  desc: string;
  value: number;
  min: number;
  max: number;
  step: number;
  percent: number;
  editing: boolean;
  onChange: (value: number) => void;
}) {
  return (
    <article className={`metric-curve ${editing ? 'is-editing' : ''}`}>
      <div><h2>{title}</h2><span>{value.toFixed(1)}</span></div>
      <p>{desc}</p>
      <TinyCurve percent={percent} />
      <small style={{ left: `${percent}%` }}>P{percent} (Current)</small>
      {editing ? (
        <input
          className="curve-range"
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          aria-label={`${title}手动调整`}
          onChange={(event) => onChange(event.currentTarget.valueAsNumber)}
        />
      ) : null}
    </article>
  );
}

type IntakeStage = 'profile' | 'scan-active' | 'scan-confirm';
type IntakeCameraStatus = 'requesting' | 'active' | 'unavailable';
type MpStatus = 'idle' | 'loading' | 'ready' | 'failed';

const CAROUSEL_IMAGES = [
  '/assets/profile-grip-slim.png',
  '/assets/profile-grip-normal.png',
  '/assets/profile-grip-wide.png',
];

const INTAKE_METRICS = [
  { label: '手长 · HAND LENGTH', value: '188.5', unit: 'mm' },
  { label: '手宽 · HAND WIDTH', value: '84.2', unit: 'mm' },
  { label: '拇指可达 · THUMB REACH', value: '66', unit: '%' },
  { label: '掌厚 · PALM DEPTH', value: '32.4', unit: 'mm' },
  { label: '五指跨度 · FINGER SPAN', value: '215', unit: 'mm' },
  { label: '数据置信度 · CONFIDENCE', value: '98.2', unit: '%' },
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
  const [revealedCount, setRevealedCount] = useState(0);
  const [mpStatus, setMpStatus] = useState<MpStatus>('idle');
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
      return;
    }

    let stream: MediaStream | null = null;
    let cancelled = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let handLandmarker: any = null;
    let rafId = 0;
    let fallbackTimerId = 0;
    let alignedStableTime = 0;
    let lastFrameTime = 0;

    const stopCamera = () => {
      stream?.getTracks().forEach((t) => t.stop());
      stream = null;
    };

    const cleanup = () => {
      cancelled = true;
      if (rafId) cancelAnimationFrame(rafId);
      if (fallbackTimerId) window.clearInterval(fallbackTimerId);
      try {
        handLandmarker?.close?.();
      } catch {
        /* ignore */
      }
      handLandmarker = null;
      stopCamera();
      if (videoRef.current) videoRef.current.srcObject = null;
    };

    const startFallbackTimer = () => {
      // No MediaPipe → fall back to fixed-time alignment animation
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
          window.setTimeout(() => {
            if (!cancelled) setStage('scan-confirm');
          }, 360);
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

            // Score against target: centroid near (0.5, 0.5), hand fills ~0.55 of viewport
            const centerDist = Math.hypot(cx - 0.5, cy - 0.5);
            const centerScore = Math.max(0, 1 - centerDist * 2.4);
            const sizeScore = Math.max(0, 1 - Math.abs(size - 0.55) * 2.2);
            const score = centerScore * 0.55 + sizeScore * 0.45; // 0-1

            if (score >= 0.72) {
              const dt = lastFrameTime ? Math.min(0.12, (now - lastFrameTime) / 1000) : 0;
              alignedStableTime += dt;
              if (alignedStableTime >= 1.4) {
                setAlignProgress(100);
                cleanup();
                window.setTimeout(() => setStage('scan-confirm'), 320);
                return;
              }
            } else {
              alignedStableTime *= 0.9;
            }

            const stableProgress = (alignedStableTime / 1.4) * 100;
            const liveScore = score * 80;
            setAlignProgress(Math.max(stableProgress, liveScore));

            if (score >= 0.72) {
              setCameraMessage('对齐稳定中，请保持 1.5 秒...');
            } else if (score >= 0.45) {
              setCameraMessage('继续调整位置，让右手填满虚线轮廓');
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
    return cleanup;
  }, [stage]);

  useEffect(() => {
    if (stage !== 'scan-confirm') {
      setRevealedCount(0);
      return;
    }
    setRevealedCount(0);
    let count = 0;
    const id = window.setInterval(() => {
      count += 1;
      setRevealedCount(count);
      if (count >= INTAKE_METRICS.length) window.clearInterval(id);
    }, 460);
    return () => window.clearInterval(id);
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
              onCancel={() => setStage('profile')}
            />
          ) : null}
          {stage === 'scan-confirm' ? (
            <ScanConfirmStage
              revealedCount={revealedCount}
              onConfirm={() => navigate('/measure/auto')}
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
  onCancel,
}: {
  videoRef: MutableRefObject<HTMLVideoElement | null>;
  cameraStatus: IntakeCameraStatus;
  cameraMessage: string;
  alignProgress: number;
  mpStatus: MpStatus;
  onCancel: () => void;
}) {
  const statusLabel =
    cameraStatus === 'active'
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

  return (
    <div className="profile-scan-camera">
      <div className={`profile-scan-camera__viewport is-${cameraStatus}`}>
        <div className="profile-scan-corner profile-scan-corner--tl" />
        <div className="profile-scan-corner profile-scan-corner--tr" />
        <div className="profile-scan-corner profile-scan-corner--bl" />
        <div className="profile-scan-corner profile-scan-corner--br" />
        <video ref={videoRef} className="profile-scan-camera__video" playsInline muted autoPlay />
        <img className="profile-scan-camera__guide" src="/assets/hand-guide-outline.png" alt="" />
        <div className="profile-scan-camera__status">
          <strong>{statusLabel}</strong>
          <span>{cameraMessage}</span>
        </div>
      </div>
      <div className="profile-scan-camera__align">
        <div className="profile-scan-camera__align-head">
          <span>HAND ALIGNMENT</span>
          <strong>{Math.round(alignProgress)}%</strong>
        </div>
        <div className="profile-scan-camera__align-track">
          <span style={{ width: `${alignProgress}%` }} />
        </div>
        <p>请将右手掌心朝上对齐虚线，保持稳定。MediaPipe 检测到对齐稳定后将自动采集数据。</p>
        <button type="button" className="profile-scan-camera__cancel" onClick={onCancel}>
          取消扫描
        </button>
      </div>
    </div>
  );
}

function ScanConfirmStage({
  revealedCount,
  onConfirm,
  onRetry,
}: {
  revealedCount: number;
  onConfirm: () => void;
  onRetry: () => void;
}) {
  const allRevealed = revealedCount >= INTAKE_METRICS.length;
  return (
    <div className="profile-scan-data">
      <div className="profile-scan-data__head">
        <span>CAPTURED METRICS</span>
        <strong>
          {revealedCount} / {INTAKE_METRICS.length}
        </strong>
      </div>
      <ul className="profile-scan-data__list">
        {INTAKE_METRICS.slice(0, revealedCount).map((item) => (
          <motion.li
            key={item.label}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.46, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="profile-scan-data__label">{item.label}</span>
            <strong className="profile-scan-data__value">
              {item.value}
              <small>{item.unit}</small>
            </strong>
          </motion.li>
        ))}
      </ul>
      <div className="profile-scan-data__actions">
        <button type="button" className="profile-scan-data__retry" onClick={onRetry}>
          重新扫描
        </button>
        <button
          type="button"
          className="profile-scan-data__confirm"
          onClick={onConfirm}
          disabled={!allRevealed}
        >
          确认进入测量
        </button>
      </div>
    </div>
  );
}

export { ProfileInfoPage };

function measurementModeFromPath(pathname: string) {
  return pathname.includes('manual') ? 'manual' : 'auto';
}

function measurementMarker(value: number, base: number, span: number) {
  return Math.max(0, Math.min(100, ((value - base) / span) * 100));
}

function MeasurementMetric({
  title,
  desc,
  value,
  min,
  max,
  step,
  marker,
  label,
  mode,
  asset,
  onChange,
}: {
  title: string;
  desc: string;
  value: number;
  min: number;
  max: number;
  step: number;
  marker: number;
  label: string;
  mode: 'auto' | 'manual';
  asset: string;
  onChange: (value: number) => void;
}) {
  const isManual = mode === 'manual';

  return (
    <article className={`measurement-figma-metric ${isManual ? 'is-manual' : 'is-auto'}`}>
      <div className="measurement-figma-metric__label">
        <h2>{title}</h2>
        <p>{desc}</p>
      </div>
      <strong>{value.toFixed(1)}</strong>
      {isManual ? (
        <div className="measurement-figma-slider">
          <div className="measurement-figma-slider__line">
            <span style={{ left: `${marker}%` }} />
          </div>
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            aria-label={`${title}手动调整`}
            onChange={(event) => onChange(event.currentTarget.valueAsNumber)}
          />
        </div>
      ) : null}
      <div className="measurement-figma-curve">
        <img src={asset} alt="" />
        <i style={{ left: `${marker}%` }} />
      </div>
      <div className="measurement-figma-percentiles">
        <span>P5</span>
        <span>{label}</span>
        <span>P95</span>
      </div>
    </article>
  );
}

export function MeasurementPage() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [mode, setMode] = useState<'auto' | 'manual'>(() => measurementModeFromPath(pathname));
  const [viewport, setViewport] = useState<MeasurementViewport>('top');
  const [handLength, setHandLength] = useState(() => readFlowState().handLength);
  const [handWidth, setHandWidth] = useState(() => readFlowState().handWidth);
  const [thumbReach, setThumbReach] = useState(() => readFlowState().thumbReach);

  useEffect(() => setMode(measurementModeFromPath(pathname)), [pathname]);

  const isManual = mode === 'manual';
  const lengthMarker = measurementMarker(handLength, 150, 66);
  const widthMarker = measurementMarker(handWidth, 65, 64);
  const handAsset = isManual ? '/assets/measurement-manual-hand.png' : '/assets/measurement-auto-hand.png';
  const lengthCurve = isManual ? '/assets/measurement-manual-curve.svg' : '/assets/measurement-auto-curve-length.svg';
  const widthCurve = isManual ? '/assets/measurement-manual-curve.svg' : '/assets/measurement-auto-curve-width.svg';
  const confidence = isManual ? '98.2' : '98.2';

  const submit = () => {
    writeFlowState({ handLength, handWidth, thumbReach });
    navigate('/report/best-phone');
  };

  return (
    <div className="page-shell measurement-figma-page">
      <div className={`measurement-figma-stage measurement-figma-stage--${mode}`}>
        <header className="measurement-figma-topbar">
          <button type="button" onClick={() => navigate('/')}>GRIPFIT</button>
          <nav aria-label="测量流程导航">
            <button type="button" onClick={() => navigate('/profile/data')}>仪表盘</button>
            <button className="is-active" type="button" onClick={() => navigate('/measure/auto')}>手部测量</button>
            <button type="button" onClick={() => navigate('/report/best-phone')}>报告产出</button>
          </nav>
        </header>

        <aside className="measurement-figma-panel">
          <h1>手部测量</h1>
          <div className="measurement-figma-mode-switch" role="tablist" aria-label="测量模式">
            <button
              className={mode === 'auto' ? 'is-active' : ''}
              type="button"
              role="tab"
              aria-selected={mode === 'auto'}
              onClick={() => navigate('/measure/auto')}
            >
              智能测量
            </button>
            <button
              className={mode === 'manual' ? 'is-active' : ''}
              type="button"
              role="tab"
              aria-selected={mode === 'manual'}
              onClick={() => navigate('/measure/manual')}
            >
              手动调整
            </button>
          </div>

          <div className="measurement-figma-controls">
            <div className="measurement-figma-section-head">
              <span>核心测量维度</span>
              <span>单位: MM</span>
            </div>
            <MeasurementMetric
              title="手长"
              desc="Tip of middle finger to wrist crease"
              value={handLength}
              min={150}
              max={220}
              step={0.1}
              marker={lengthMarker}
              label="P72 (Current)"
              mode={mode}
              asset={lengthCurve}
              onChange={setHandLength}
            />
            <MeasurementMetric
              title="手宽"
              desc="Metacarpal breadth at the knuckles"
              value={handWidth}
              min={65}
              max={105}
              step={0.1}
              marker={widthMarker}
              label="P30 (Current)"
              mode={mode}
              asset={widthCurve}
              onChange={setHandWidth}
            />

            <div className="measurement-figma-actions">
              <button className="measurement-figma-primary" type="button" onClick={submit}>提交测量 / COMMIT MEASUREMENT</button>
              <button className="measurement-figma-secondary" type="button" onClick={() => {
                setHandLength(defaultFlow.handLength);
                setHandWidth(defaultFlow.handWidth);
                setThumbReach(defaultFlow.thumbReach);
              }}>
                重置为默认 / RESET TO DEFAULT
              </button>
            </div>
          </div>
        </aside>

        <section className="measurement-figma-visual" aria-label="手部测量三维预览">
          <div className="measurement-figma-preview">
            <img className={`measurement-figma-hand measurement-figma-hand--${viewport}`} src={handAsset} alt="手部测量模型" />
          </div>

          <div className="measurement-figma-viewport-card">
            <div className="measurement-figma-viewport-head">
              <p>VIEWPORT</p>
              {isManual ? <img src="/assets/measurement-manual-hud-icon.svg" alt="" /> : null}
            </div>
            <div className="measurement-figma-viewport-grid">
              {measurementViewports.map((item) => (
                <button
                  key={item.key}
                  className={viewport === item.key ? 'is-active' : ''}
                  type="button"
                  aria-pressed={viewport === item.key}
                  onClick={() => setViewport(item.key)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="measurement-figma-stats">
            <div>
              <span>DATA CONFIDENCE</span>
              <strong>{confidence}<small>%</small></strong>
            </div>
            <div>
              <span>GB/T MATCH</span>
              <strong>P75<small>Rank</small></strong>
            </div>
            <div>
              <span>ESTIMATED GRIP WIDTH</span>
              <strong>{(handWidth * 0.885).toFixed(1)}mm</strong>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function tuningViewFromPath(pathname: string): TuningView {
  if (pathname.includes('camera')) return 'back';
  if (pathname.includes('hand')) return 'hand';
  if (pathname.includes('risk')) return 'risk';
  return 'front';
}

function HistogramSlider({ label, value, min, max, step, unit, onChange }: { label: string; value: number; min: number; max: number; step: number; unit: string; onChange: (value: number) => void }) {
  return (
    <div className="range-control range-control--interactive">
      <div className="range-head"><span>{label}</span><strong>{value}{unit}</strong></div>
      <div className="range-histogram">{Array.from({ length: 9 }).map((_, index) => <i key={index} className={index >= 2 && index <= 5 ? 'is-good' : ''} />)}</div>
      <NumericSlider label={label} value={value} min={min} max={max} step={step} unit={unit} onChange={onChange} />
      <div className="range-foot"><span>MIN {min}</span><span>{unit}</span><span>MAX {max}</span></div>
    </div>
  );
}

function BestPhonePanel({ onTuning }: { onTuning: () => void }) {
  const flow = readFlowState();
  return (
    <WorkbenchShell active="tuning" navActive="report">
      <section className="best-phone-layout">
        <aside className="best-menu">
          {['最优手机', '自定义调参', '机型库', '手感报告', '我的数据'].map((item, index) => (
            <button key={item} className={index === 0 ? 'is-active' : ''} type="button">{item}</button>
          ))}
        </aside>
        <div className="tuning-stage best-stage">
          <div className="tuning-hint">拖曳旋转 · 滚轮缩放</div>
          <div className="tuning-score"><ScoreRing value={8.9} label="理论最优" /></div>
          <WorkbenchPreview className="tuning-preview" title="Best phone preview" initialTransform={{ rotateX: -8, rotateY: 20, zoom: 1 }}>
            <div className="tuning-device-shell"><PhoneVisual phone={phones[0]} large /><span className="device-size-label">{flow.width} × {flow.height} mm</span></div>
          </WorkbenchPreview>
          <label className="hand-toggle"><span>显示手部</span><input type="checkbox" /></label>
        </div>
        <aside className="best-param-panel">
          <div className="tuning-panel-head"><h1>理论最优参数</h1><button type="button" onClick={onTuning}>参数微调</button></div>
          <div className="optimal-list optimal-list--full">
            {optimalParams.concat([
              { label: '侧边弧度', value: '3.8', unit: 'mm' },
              { label: '背板曲率', value: '0', unit: 'D' },
            ]).map((item, index) => (
              <div key={`${item.label}-${index}`}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <strong>{item.label}</strong>
                <em>{item.value}</em>
                <small>{item.unit}</small>
              </div>
            ))}
          </div>
        </aside>
      </section>
    </WorkbenchShell>
  );
}

export function ParameterTuningPage() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [view, setView] = useState<TuningView>(() => tuningViewFromPath(pathname));
  const [flow, setFlow] = useState<FlowState>(() => readFlowState());
  const [showHand, setShowHand] = useState(() => view === 'hand' || view === 'risk');
  const [riskTip, setRiskTip] = useState<string | null>(() => pathname.includes('tooltip') ? '食指支撑点与镜头模组冲突，建议减小凸起或调整模组位置。' : null);
  const [cameraSide, setCameraSide] = useState('左侧');
  const [corner, setCorner] = useState('柔和过渡');

  useEffect(() => {
    const next = tuningViewFromPath(pathname);
    setView(next);
    setShowHand(next === 'hand' || next === 'risk');
  }, [pathname]);

  if (pathname.includes('best-phone')) {
    return <BestPhonePanel onTuning={() => navigate('/report/tuning/basic')} />;
  }

  const updateFlow = (patch: Partial<FlowState>) => {
    setFlow((current) => {
      const next = { ...current, ...patch };
      writeFlowState(next);
      return next;
    });
  };
  const currentScore = Math.max(6.2, Number((10 - Math.abs(flow.width - 70.6) * 0.08 - Math.abs(flow.weight - 180) * 0.018 - Math.abs(flow.thickness - 7.6) * 0.22).toFixed(1)));
  const chooseView = (next: TuningView) => navigate(tuningViews.find((item) => item.key === next)?.route ?? '/report/tuning/basic');

  return (
    <WorkbenchShell active="tuning" navActive="report">
      <section className="tuning-layout">
        <div className="tuning-stage">
          <div className="tuning-hint">拖曳旋转 · 滚轮缩放</div>
          <div className="tuning-score"><ScoreRing value={currentScore} label="当前方案" /></div>
          <WorkbenchPreview className="tuning-preview" title="GripFit Interactive Preview" initialTransform={{ rotateX: -8, rotateY: view === 'back' ? -28 : 18, zoom: 1 }} minZoom={0.62} maxZoom={1.8}>
            <div className={`tuning-device-shell tuning-device-shell--${view} ${showHand ? 'is-hand-visible' : ''}`}>
              {showHand ? <img className="tuning-hand-layer" src="/assets/hero-phone-cut.png" alt="" /> : <PhoneVisual phone={phones[0]} large />}
              {!showHand ? <span className="device-size-label">{flow.width.toFixed(1)} × {flow.height.toFixed(1)} mm</span> : null}
              {view === 'back' || view === 'risk' ? <span className={`camera-plate camera-plate--${cameraSide === '左侧' ? 'left' : cameraSide === '居中' ? 'center' : 'right'}`}>{flow.cameraBump.toFixed(1)}mm</span> : null}
              {view === 'risk' ? (
                <>
                  <button className="risk-dot risk-dot--a" type="button" onMouseEnter={() => setRiskTip('掌根区域压力偏高，降低整机重量可以明显改善长时舒适度。')} onFocus={() => setRiskTip('掌根区域压力偏高，降低整机重量可以明显改善长时舒适度。')} onClick={() => setRiskTip('掌根区域压力偏高，降低整机重量可以明显改善长时舒适度。')} />
                  <button className="risk-dot risk-dot--b" type="button" onMouseEnter={() => setRiskTip('食指支撑点与镜头模组冲突，建议减小凸起或调整模组位置。')} onFocus={() => setRiskTip('食指支撑点与镜头模组冲突，建议减小凸起或调整模组位置。')} onClick={() => setRiskTip('食指支撑点与镜头模组冲突，建议减小凸起或调整模组位置。')} />
                  {riskTip ? <div className="risk-callout">{riskTip}</div> : null}
                </>
              ) : null}
            </div>
          </WorkbenchPreview>
          <div className="view-switcher">
            {tuningViews.map((item) => (
              <button key={item.key} type="button" className={view === item.key ? 'is-active' : ''} onClick={() => chooseView(item.key)}>{item.label}</button>
            ))}
          </div>
          <label className="hand-toggle">
            <span>显示手部</span>
            <input type="checkbox" checked={showHand} onChange={(event) => {
              setShowHand(event.currentTarget.checked);
              if (event.currentTarget.checked && view === 'front') chooseView('hand');
            }} />
          </label>
        </div>

        <aside className="tuning-panel">
          <div className="tuning-panel-head"><h1>参数微调</h1><button type="button" onClick={() => navigate('/report/handfeel-detail')}>方案保存</button></div>
          <div className="tuning-controls">
            <section className="tuning-group is-open"><h2>基本尺寸 <span>4 项</span></h2>
              <HistogramSlider label="宽度" value={Number(flow.width.toFixed(1))} min={65} max={80} step={0.1} unit="mm" onChange={(value) => updateFlow({ width: value })} />
              <HistogramSlider label="重量" value={Math.round(flow.weight)} min={150} max={250} step={1} unit="g" onChange={(value) => updateFlow({ weight: value })} />
              <HistogramSlider label="厚度" value={Number(flow.thickness.toFixed(1))} min={6} max={10} step={0.1} unit="mm" onChange={(value) => updateFlow({ thickness: value })} />
            </section>
            <section className={`tuning-group ${view === 'back' || view === 'risk' ? 'is-open' : ''}`}><h2>功能部件（后摄像头模组） <span>5 项</span></h2>
              <NumericSlider label="镜头凸起" value={flow.cameraBump} min={0.8} max={5.5} step={0.1} unit="mm" onChange={(value) => updateFlow({ cameraBump: value })} />
              <div className="choice-row"><p>后摄位置</p>{['左侧', '居中', '右侧'].map((item) => <button key={item} className={cameraSide === item ? 'is-active' : ''} type="button" onClick={() => setCameraSide(item)}>{item}</button>)}</div>
              <div className="camera-module-row">{['矩阵', '圆环', '横向'].map((item) => <button key={item} type="button" className={item === '矩阵' ? 'is-active' : ''}>{item}</button>)}</div>
            </section>
            <section className="tuning-group"><h2>形态曲率 <span>5 项</span></h2>
              <div className="choice-row"><p>后盖边缘过渡</p>{['生硬过渡', '柔和过渡', '圆弧过渡'].map((item) => <button key={item} className={corner === item ? 'is-active' : ''} type="button" onClick={() => setCorner(item)}>{item}</button>)}</div>
            </section>
            <ToggleSwitch label="显示风险热区" checked={view === 'risk'} helperText="打开后可查看掌根与食指支撑压力" onChange={(checked) => chooseView(checked ? 'risk' : 'front')} />
          </div>
        </aside>
      </section>
    </WorkbenchShell>
  );
}

export function ReportDetailPage() {
  const navigate = useNavigate();
  const [category, setCategory] = useState('全部');
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(['weight', 'camera-bump']));
  const rows = category === '全部' ? reportDimensions : reportDimensions.filter((row) => row.group === category);
  const toggleRow = (id: string) => setExpanded((current) => {
    const next = new Set(current);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  return (
    <WorkbenchShell active="report" navActive="report">
      <section className="report-page">
        <div className="report-title-row">
          <div><h1>手感报告详情</h1><p>评估对象：自定义方案 A</p></div>
          <select className="report-filter" value={category} onChange={(event) => setCategory(event.currentTarget.value)}>
            {categoryNames.map((item) => <option key={item}>{item}</option>)}
          </select>
        </div>
        <div className="report-summary">
          <ScoreRing value={8.3} label="综合评分" />
          <div><strong>5</strong><span>需关注项 / 中高风险</span></div>
          <div><strong className="green">9</strong><span>良好项 / 表现良好</span></div>
          <button type="button" onClick={() => navigate('/reports/compare/export-modal')}>导出报告</button>
        </div>
        <div className="report-table report-table--dense">
          <div className="report-table-head"><span>维度</span><span>当前值</span><span>评分 (/10)</span><span>AHP 权重</span><span>操作</span></div>
          {rows.map((row, index) => (
            <article className={`report-row report-row--${row.status}`} key={row.id}>
              <div className="report-row-title"><span>{index + 1}</span><strong>{row.name}</strong></div>
              <div>{row.value}</div>
              <div><em>{row.score.toFixed(1)}</em></div>
              <div>{row.weight.toFixed(3)}</div>
              <button type="button" onClick={() => toggleRow(row.id)}>{expanded.has(row.id) ? '⌃' : '⌄'}</button>
              {expanded.has(row.id) ? (
                <section className="report-row-detail">
                  <p><b>评估说明</b><br />{row.advice}</p>
                  <div><b>评分响应曲线</b><ResponseCurve percent={row.curve} color={row.status === 'risk' ? 'orange' : 'blue'} /></div>
                  <ul><b>优化建议</b><li>推荐区间：{row.optimum}</li><li>优先调整对握持稳定性影响更大的结构。</li><li>修改后重新生成报告检查风险变化。</li></ul>
                </section>
              ) : null}
            </article>
          ))}
        </div>
      </section>
    </WorkbenchShell>
  );
}

function FilterDrawer({
  brands,
  selectedBrands,
  toggleBrand,
  priceRange,
  setPriceRange,
  screenRange,
  setScreenRange,
  scoreRange,
  setScoreRange,
  weightRange,
  setWeightRange,
  thicknessRange,
  setThicknessRange,
  releaseFilter,
  setReleaseFilter,
  reset,
  onClose,
}: {
  brands: string[];
  selectedBrands: string[];
  toggleBrand: (brand: string) => void;
  priceRange: RangeValue;
  setPriceRange: (value: RangeValue) => void;
  screenRange: RangeValue;
  setScreenRange: (value: RangeValue) => void;
  scoreRange: RangeValue;
  setScoreRange: (value: RangeValue) => void;
  weightRange: RangeValue;
  setWeightRange: (value: RangeValue) => void;
  thicknessRange: RangeValue;
  setThicknessRange: (value: RangeValue) => void;
  releaseFilter: ReleaseFilter;
  setReleaseFilter: (value: ReleaseFilter) => void;
  reset: () => void;
  onClose: () => void;
}) {
  return (
    <aside className="filter-drawer">
      <div className="filter-drawer-head"><h2>筛选条件</h2><button type="button" onClick={reset}>重置</button><button type="button" onClick={onClose}>×</button></div>
      <section><h3>1 品牌</h3><div className="brand-grid">{brands.map((brand) => <button key={brand} type="button" className={selectedBrands.includes(brand) ? 'is-active' : ''} onClick={() => toggleBrand(brand)}>{brand}</button>)}</div></section>
      <section className="filter-control-stack">
        <RangeFilter label="价格区间" value={priceRange} min={1000} max={12000} step={100} unit="¥" onChange={setPriceRange} />
        <RangeFilter label="屏幕尺寸" value={screenRange} min={4} max={8} step={0.1} unit="英寸" onChange={setScreenRange} />
        <div className="release-filter">{[
          ['all', '全部'], ['year', '一年内'], ['two', '近两年'], ['older', '更早'],
        ].map(([value, label]) => <button key={value} type="button" className={releaseFilter === value ? 'is-active' : ''} onClick={() => setReleaseFilter(value as ReleaseFilter)}>{label}</button>)}</div>
        <RangeFilter label="握持评分" value={scoreRange} min={0} max={100} step={1} unit="分" onChange={setScoreRange} />
        <RangeFilter label="机身重量" value={weightRange} min={80} max={400} step={1} unit="g" onChange={setWeightRange} />
        <RangeFilter label="机身厚度" value={thicknessRange} min={4} max={15} step={0.1} unit="mm" onChange={setThicknessRange} />
      </section>
      <button className="wb-primary full" type="button" onClick={onClose}>显示结果 →</button>
    </aside>
  );
}

export function PhoneLibraryPage() {
  const navigate = useNavigate();
  const { search } = useLocation();
  const [filterOpen, setFilterOpen] = useState(() => new URLSearchParams(search).has('filter'));
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<RangeValue>({ min: 1000, max: 12000 });
  const [screenRange, setScreenRange] = useState<RangeValue>({ min: 4, max: 8 });
  const [scoreRange, setScoreRange] = useState<RangeValue>({ min: 70, max: 95 });
  const [weightRange, setWeightRange] = useState<RangeValue>({ min: 80, max: 400 });
  const [thicknessRange, setThicknessRange] = useState<RangeValue>({ min: 4, max: 15 });
  const [releaseFilter, setReleaseFilter] = useState<ReleaseFilter>('all');
  const [sortMode, setSortMode] = useState<'match' | 'price' | 'weight'>('match');
  const [page, setPage] = useState(1);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [notice, setNotice] = useState('');
  const brands = useMemo(() => Array.from(new Set(phones.map((phone) => phone.brand))), []);
  const filteredPhones = useMemo(() => {
    return phones
      .filter((phone) => selectedBrands.length === 0 || selectedBrands.includes(phone.brand))
      .filter((phone) => priceNumber(phone) >= priceRange.min && priceNumber(phone) <= priceRange.max)
      .filter((phone) => screenNumber(phone) >= screenRange.min && screenNumber(phone) <= screenRange.max)
      .filter((phone) => releaseMatches(phone, releaseFilter))
      .filter((phone) => phone.weight >= weightRange.min && phone.weight <= weightRange.max)
      .filter((phone) => phone.thickness >= thicknessRange.min && phone.thickness <= thicknessRange.max)
      .filter((phone) => phone.match >= scoreRange.min && phone.match <= scoreRange.max)
      .sort((a, b) => {
        if (sortMode === 'price') return priceNumber(a) - priceNumber(b);
        if (sortMode === 'weight') return a.weight - b.weight;
        return b.match - a.match;
      });
  }, [priceRange, releaseFilter, scoreRange, screenRange, selectedBrands, sortMode, thicknessRange, weightRange]);
  const visiblePhones = filteredPhones.slice((page - 1) * 6, page * 6);
  const maxPage = Math.max(1, Math.ceil(filteredPhones.length / 6));

  const toggleBrand = (brand: string) => setSelectedBrands((current) => current.includes(brand) ? current.filter((item) => item !== brand) : [...current, brand]);
  const toggleCompare = (id: string) => setCompareIds((current) => {
    if (current.includes(id)) return current.filter((item) => item !== id);
    if (current.length >= 3) {
      setNotice('最多选择 3 款机型进行对比');
      window.setTimeout(() => setNotice(''), 1600);
      return current;
    }
    return [...current, id];
  });
  const resetFilters = () => {
    setSelectedBrands([]);
    setPriceRange({ min: 1000, max: 12000 });
    setScreenRange({ min: 4, max: 8 });
    setScoreRange({ min: 70, max: 95 });
    setWeightRange({ min: 80, max: 400 });
    setThicknessRange({ min: 4, max: 15 });
    setReleaseFilter('all');
  };

  return (
    <WorkbenchShell active="library" navActive="library">
      <section className={`library-page ${filterOpen ? 'has-filter' : ''}`}>
        <div className="library-title-row">
          <div><h1>最佳匹配在售机型</h1><p>基于人机握持舒适度模型，为你找到最匹配的在售机型。</p></div>
          <button className="wb-secondary" type="button" onClick={() => navigate(compareIds.length ? `/reports/compare/edit?${compareSearch(compareIds)}` : '/reports/compare/empty')}>查看对比 ({compareIds.length})</button>
        </div>
        <div className="library-stats">
          <div><span className="stat-icon">128</span><p>匹配机型总数</p><strong>128</strong><small>款</small></div>
          <div><span className="stat-icon">TOP</span><p>最高匹配度</p><strong>{filteredPhones[0]?.match.toFixed(1) ?? '--'}%</strong><small>{filteredPhones[0]?.name ?? '暂无结果'}</small></div>
        </div>
        <div className="library-filters">
          <button type="button" onClick={() => setFilterOpen(true)}>匹配度区间：{scoreRange.min}-{scoreRange.max}%</button>
          <button type="button" onClick={() => setFilterOpen(true)}>品牌：{selectedBrands.length ? selectedBrands.join(' / ') : '全部品牌'}</button>
          <button type="button" onClick={() => setFilterOpen(true)}>价格区间：¥{priceRange.min} - ¥{priceRange.max}</button>
          <button type="button" onClick={() => setSortMode(sortMode === 'match' ? 'price' : sortMode === 'price' ? 'weight' : 'match')}>排序方式：{sortMode === 'match' ? '匹配度从高到低' : sortMode === 'price' ? '价格从低到高' : '重量从轻到重'}</button>
          <button type="button" className="filter-toggle" onClick={() => setFilterOpen(true)}>筛选</button>
        </div>
        <div className="phone-table">
          <div className="phone-table-head"><span>排名</span><span>机型</span><span>关键参数</span><span>匹配度</span><span>握持评分</span><span>价格</span><span>操作</span></div>
          {visiblePhones.map((phone, index) => (
            <article className="phone-row" key={phone.id}>
              <strong className={index < 3 && page === 1 ? 'is-top' : ''}>{(page - 1) * 6 + index + 1}</strong>
              <div className="phone-row-name"><PhoneVisual phone={phone} compact /><div><h2>{phone.name}</h2><p>{phone.date}</p></div></div>
              <span>{phone.width} mm · {phone.weight} g · {phone.thickness} mm</span>
              <MatchBadge value={phone.match} />
              <span>{phone.gripScore.toFixed(1)} / 10</span>
              <span>{phone.price}</span>
              <div className="phone-actions">
                <button type="button" className={compareIds.includes(phone.id) ? 'is-active' : ''} onClick={() => toggleCompare(phone.id)}>{compareIds.includes(phone.id) ? '已选' : '+ 对比'}</button>
                <button type="button" className={favoriteIds.includes(phone.id) ? 'is-active' : ''} onClick={() => setFavoriteIds((current) => current.includes(phone.id) ? current.filter((item) => item !== phone.id) : [...current, phone.id])}>☆</button>
                <button type="button" onClick={() => navigate(`/models/${phone.id}`)}>›</button>
              </div>
            </article>
          ))}
        </div>
        <div className="pagination">
          <button type="button" disabled={page === 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>‹</button>
          {Array.from({ length: maxPage }).map((_, index) => <button key={index} type="button" className={page === index + 1 ? 'is-active' : ''} onClick={() => setPage(index + 1)}>{index + 1}</button>)}
          <button type="button" disabled={page === maxPage} onClick={() => setPage((current) => Math.min(maxPage, current + 1))}>›</button>
        </div>
        {notice ? <div className="wb-toast">{notice}</div> : null}
        {filterOpen ? (
          <FilterDrawer
            brands={brands}
            selectedBrands={selectedBrands}
            toggleBrand={toggleBrand}
            priceRange={priceRange}
            setPriceRange={setPriceRange}
            screenRange={screenRange}
            setScreenRange={setScreenRange}
            scoreRange={scoreRange}
            setScoreRange={setScoreRange}
            weightRange={weightRange}
            setWeightRange={setWeightRange}
            thicknessRange={thicknessRange}
            setThicknessRange={setThicknessRange}
            releaseFilter={releaseFilter}
            setReleaseFilter={setReleaseFilter}
            reset={resetFilters}
            onClose={() => setFilterOpen(false)}
          />
        ) : null}
      </section>
    </WorkbenchShell>
  );
}

export function PhoneDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const phone = phones.find((item) => item.id === id) ?? phones[0];
  const [activeGroup, setActiveGroup] = useState('基本尺寸');
  const [expanded, setExpanded] = useState('机身宽度');
  const compareIds = Array.from(new Set([phone.id, 'iphone-16-pro', 's24-ultra'].filter((item) => item !== phone.id || item === phone.id))).slice(0, 2);

  return (
    <WorkbenchShell active="library" navActive="library">
      <section className="phone-detail-page">
        <button className="back-link" type="button" onClick={() => navigate('/models/recommendations')}>← D3 — 机型详情页</button>
        <div className="detail-grid">
          <article className="detail-hero-card">
            <PhoneVisual phone={phone} large />
            <div><p>{phone.brand}</p><h1>{phone.name}</h1><span>{phone.date}</span><strong>{phone.price}</strong><div className="detail-actions"><button type="button" onClick={() => navigate(`/reports/compare/edit?${compareSearch(compareIds)}`)}>＋ 加入对比</button><button type="button" onClick={() => navigate('/report/handfeel-detail')}>查看风险详情 →</button></div></div>
            <ScoreRing value={phone.gripScore} label="握持评分" />
            <MatchRing value={phone.match} label="匹配度" size={118} stroke={9} />
          </article>
          <aside className="grip-overview"><h2>握持表现概览</h2>{['单手握持', '拇指可达性', '长时舒适度'].map((label, index) => { const score = [phone.gripScore, phone.gripScore - 0.5, phone.gripScore - 0.8][index]; return <div key={label}><span>{label}</span><strong>{score.toFixed(1)} /10</strong><i style={{ width: `${score * 10}%` }} /></div>; })}</aside>
          <article className="param-table"><h2>参数对照</h2>{[
            ['宽度', `${phone.width} mm`, '76-80 mm', phone.width < 73 ? '接近' : '偏宽'],
            ['重量', `${phone.weight} g`, '200-230 g', phone.weight <= 200 ? '良好' : '偏重'],
            ['厚度', `${phone.thickness} mm`, '8.0-9.0 mm', phone.thickness <= 8.8 ? '接近' : '偏厚'],
            ['屏幕尺寸', phone.screen, '6.4-6.8 英寸', '参考'],
            ['周边圆角', '12.0 mm', '10-14 mm', '优秀'],
            ['重心位置', '52.2 %', '48-52 %', '接近'],
          ].map((row) => <div key={row[0]}><span>{row[0]}</span><span>{row[1]}</span><span>{row[2]}</span><em>{row[3]}</em></div>)}</article>
          <article className="dimension-score dimension-score--detail">
            <h2>18维度逐项评分</h2>
            <div className="dimension-category-list">{['基本尺寸', '形态曲率', '功能控件', '操作便利', '视觉感知'].map((group) => <button key={group} type="button" className={activeGroup === group ? 'is-active' : ''} onClick={() => setActiveGroup(group)}>{group}<span>›</span></button>)}</div>
            <div className="dimension-detail-list">{['机身宽度', '机身重量', '机身厚度'].map((label, index) => { const score = [8.5, 7.0, 8.0][index]; return <section key={label} className={expanded === label ? 'is-open' : ''}><button type="button" onClick={() => setExpanded(label)}><strong>{label}</strong><span>{score.toFixed(1)} /10</span></button>{expanded === label ? <div><p>评分解读：{activeGroup}中该指标对握持稳定性影响较高。</p><ResponseCurve percent={[72, 58, 66][index]} /></div> : null}</section>; })}</div>
          </article>
          <aside className="spec-card"><h2>完整规格参数</h2><p>上市时间：{phone.releaseDate}</p><p>影像：{phone.rearCamera}</p><p>屏幕：{phone.screen}</p><p>电池：{phone.battery}</p><p>资料来源：官方规格页与新闻稿</p><button type="button">展开全部⌄</button></aside>
        </div>
      </section>
    </WorkbenchShell>
  );
}

export function ComparePage() {
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const forceEmpty = pathname.includes('empty');
  const initialPhones = useMemo(() => parseComparePhones(search, pathname.includes('edit') ? [phones[0], phones[1]] : []), [pathname, search]);
  const [selectedPhones, setSelectedPhones] = useState(initialPhones);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [includeIdeal, setIncludeIdeal] = useState(true);
  const [showDetail, setShowDetail] = useState(true);
  const [separateGroup, setSeparateGroup] = useState(false);
  const [notice, setNotice] = useState('');
  const hasItems = !forceEmpty && selectedPhones.length > 0;
  const canGenerate = selectedPhones.length >= 2;
  const generate = () => {
    if (!canGenerate) {
      setNotice('至少选择 2 款机型才能生成对比报告');
      window.setTimeout(() => setNotice(''), 1600);
      return;
    }
    navigate(`/reports/compare/result?${compareSearch(selectedPhones.map((phone) => phone.id), { ideal: includeIdeal, detail: showDetail, group: separateGroup })}`);
  };
  const handleDrop = (targetIndex: number) => {
    if (dragIndex === null || dragIndex === targetIndex) return;
    setSelectedPhones((current) => {
      const next = [...current];
      const [dragged] = next.splice(dragIndex, 1);
      next.splice(targetIndex, 0, dragged);
      return next;
    });
    setDragIndex(null);
  };

  return (
    <WorkbenchShell active="report" navActive="report">
      <section className="compare-page">
        {!hasItems ? (
          <div className="compare-empty"><div className="empty-devices"><span /><span /><span /></div><h1>还没有要对比的机型</h1><p>添加 2-3 款手机，生成基于你手部数据的横向对比报告。</p><button className="wb-primary" type="button" onClick={() => navigate('/models/recommendations')}>去探索手机库 →</button></div>
        ) : (
          <>
            <div className="compare-head"><div><h1>对比清单 {selectedPhones.length}/3</h1><p>拖拽卡片可调整对比顺序，最多支持 3 款机型。</p></div><button className="wb-primary" type="button" onClick={generate}>生成对比报告 →</button></div>
            <div className="compare-cards">
              {selectedPhones.map((phone, index) => (
                <article key={phone.id} className="compare-card" draggable onDragStart={() => setDragIndex(index)} onDragOver={(event) => event.preventDefault()} onDrop={() => handleDrop(index)}>
                  <button type="button" onClick={() => setSelectedPhones((current) => current.filter((item) => item.id !== phone.id))}>×</button>
                  <PhoneVisual phone={phone} large />
                  <h2>{phone.name}</h2><p>{phone.date}</p>
                  <div className="compare-card-metrics"><span>评分 <strong>{phone.gripScore.toFixed(1)}</strong>/10</span><span>匹配 <strong>{(phone.match / 10).toFixed(1)}</strong>/10</span></div>
                </article>
              ))}
              <button className="compare-add" type="button" onClick={() => navigate('/models/recommendations')}>＋<span>添加机型</span></button>
            </div>
            <div className="compare-options"><ToggleSwitch label="包含我的最优模型作为基准线" checked={includeIdeal} onChange={setIncludeIdeal} /><ToggleSwitch label="显示详细18维度评分" checked={showDetail} onChange={setShowDetail} /><ToggleSwitch label="按你的手型分组单独评分" checked={separateGroup} onChange={setSeparateGroup} /></div>
            <button className="wb-primary compare-submit" type="button" onClick={generate}>生成对比报告</button>
            {notice ? <div className="wb-toast">{notice}</div> : null}
          </>
        )}
      </section>
    </WorkbenchShell>
  );
}

export function CompareReportPage() {
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const [exportOpen, setExportOpen] = useState(() => pathname.includes('export-modal'));
  const selectedPhones = parseComparePhones(search, [phones[0], phones[1]]);
  const best = selectedPhones[0] ?? phones[0];
  const second = selectedPhones[1] ?? phones[1];

  return (
    <WorkbenchShell active="report" navActive="report" wide>
      <section className={`compare-report-page ${exportOpen ? 'is-exporting' : ''}`}>
        <div className="compare-report-head"><h1>对比报告</h1><div><button className="wb-secondary" type="button" onClick={() => navigate(`/reports/compare/edit?${compareSearch(selectedPhones.map((phone) => phone.id))}`)}>编辑对比清单 ←</button><button className="wb-primary" type="button" onClick={() => setExportOpen(true)}>导出报告</button></div></div>
        <article className="report-hero-strip"><div className="ideal-device" /><div><span>我的最优</span><strong>9.1</strong><em>/10</em></div>{selectedPhones.map((phone) => <div className="strip-phone" key={phone.id}><PhoneVisual phone={phone} compact /><span>{phone.name}</span><strong>{phone.gripScore.toFixed(1)}</strong><em>/10</em></div>)}</article>
        <div className="compare-report-grid">
          <article className="bar-card"><h2>综合评分对比</h2><div className="bars"><i className="ideal" /><i className="iphone" style={{ height: `${best.gripScore * 14}px` }} /><i className="galaxy" style={{ height: `${second.gripScore * 14}px` }} /></div></article>
          <article className="score-compare-card"><h2>核心分数对比</h2>{comparisonScores.map((score) => <div key={score.label}><span>{score.label}</span><i style={{ width: `${score.iphone * 10}%` }} /><b>{score.iphone}</b><i className="orange" style={{ width: `${score.galaxy * 10}%` }} /><b>{score.galaxy}</b></div>)}</article>
          <article className="dimension-table"><h2>逐维度评分对比</h2>{['基本尺寸', '形态曲率', '功能部件', '操作便利', '视觉感知'].map((row, index) => <div key={row}><span>{row}</span><em>{index < 4 ? best.name : '我的最优模型'}</em><strong>{[9.1, 9.0, 9.2, 9.0, 9.1][index]}</strong></div>)}</article>
          <article className="spec-compare"><h2>详细参数对照</h2>{[
            ['机身宽度', '70.6 mm', `${best.width} mm`, `${second.width} mm`],
            ['机身高度', '151.4 mm', `${best.height} mm`, `${second.height} mm`],
            ['功能厚度', '7.6 mm', `${best.thickness} mm`, `${second.thickness} mm`],
            ['重量', '180 g', `${best.weight} g`, `${second.weight} g`],
            ['屏幕尺寸', '6.3 英寸', best.screen, second.screen],
            ['电池容量', '4700 mAh', best.battery, second.battery],
            ['后置模组', '3 镜头', best.rearCamera, second.rearCamera],
          ].map((row) => <div key={row[0]}><span>{row[0]}</span><span>{row[1]}</span><span>{row[2]}</span><span>{row[3]}</span></div>)}</article>
        </div>
        <footer className="best-match"><strong>您的最佳匹配</strong><p>基于你的手部数据，<b>{best.name}</b> 的握持匹配度最高（{(best.match / 10).toFixed(1)} / 10）。</p><button type="button" onClick={() => navigate(`/models/${best.id}`)}>查看详情 →</button><button type="button" onClick={() => navigate('/models/recommendations')}>重新对比其他机型</button></footer>
        {exportOpen ? <ExportDialog onClose={() => setExportOpen(false)} /> : null}
      </section>
    </WorkbenchShell>
  );
}

function ExportDialog({ onClose }: { onClose: () => void }) {
  const [format, setFormat] = useState('pdf');
  const [includeSpecs, setIncludeSpecs] = useState(false);
  const [done, setDone] = useState('');
  return (
    <div className="export-modal">
      <div className="export-card">
        <button className="export-close" type="button" onClick={onClose}>×</button>
        <h2>导出对比报告</h2><p>选择导出格式，报告将基于当前对比内容生成。</p>
        {[['pdf', 'PDF', '保存为 PDF'], ['image', 'IMG', '生成长图'], ['link', 'LINK', '复制分享链接']].map(([value, tag, label]) => <label key={value} className={format === value ? 'is-selected' : ''}><span>{tag}</span><strong>{label}</strong><input type="radio" name="export" checked={format === value} onChange={() => setFormat(value)} /></label>)}
        <div className="export-checks"><label><input type="checkbox" defaultChecked /> 综合评分对比</label><label><input type="checkbox" defaultChecked /> 逐维度详细评分</label><label><input type="checkbox" checked={includeSpecs} onChange={(event) => setIncludeSpecs(event.currentTarget.checked)} /> 完整规格参数表</label></div>
        {done ? <p className="export-done">{done}</p> : null}
        <div className="export-actions"><button type="button" onClick={onClose}>取消</button><button type="button" onClick={() => setDone(`已生成 ${format.toUpperCase()} 报告`) }>导出报告</button></div>
      </div>
    </div>
  );
}

export function MyDataPage() {
  const navigate = useNavigate();
  const [handType, setHandType] = useState('中手型');
  const flow = readFlowState();
  return (
    <WorkbenchShell active="data" navActive="tuning" wide>
      <section className="my-data-page">
        <div className="my-data-title"><h1>我的数据</h1><button type="button" onClick={() => navigate('/report/best-phone')}>×</button></div>
        <div className="my-data-grid">
          <article className="hand-data-card"><h2>手部数据</h2><div className="metric-pair">{[
            { label: '手长', value: flow.handLength, unit: 'mm', percent: 62, desc: '超过62%的中国成年人' },
            { label: '手宽', value: flow.handWidth, unit: 'mm', percent: 58, desc: '超过58%的中国成年人' },
          ].map((metric) => <div key={metric.label}><p>{metric.label}</p><strong>{Math.round(metric.value)}<span>{metric.unit}</span></strong><em>{metric.desc}</em><TinyCurve percent={metric.percent} /><small>P{metric.percent}</small></div>)}</div><div className="hand-type">{['小手型', '中手型', '大手型'].map((item) => <button key={item} className={handType === item ? 'is-active' : ''} type="button" onClick={() => setHandType(item)}>{item}</button>)}</div></article>
          <aside className="profile-card"><h2>用户画像</h2><p><span>性别</span><strong>男性</strong></p><p><span>年龄段</span><strong>26-45 岁 · 中青年</strong></p></aside>
          <aside className="summary-card"><h2>最优参数摘要</h2><p><span>最优宽度</span><strong>{flow.width.toFixed(1)} mm</strong></p><p><span>最优高度</span><strong>{flow.height.toFixed(0)} mm</strong></p><p><span>最优厚度</span><strong>{flow.thickness.toFixed(1)} mm</strong></p><p><span>最优重量</span><strong>{flow.weight.toFixed(0)} g</strong></p></aside>
          <div className="data-actions"><button className="wb-secondary" type="button" onClick={() => navigate('/hand-recognition')}>重新测量</button><button className="wb-primary" type="button" onClick={() => navigate('/onboarding/profile')}>修改画像</button></div>
          <article className="history-card"><h2>历史记录</h2>{phones.slice(0, 3).map((phone, index) => <button type="button" key={phone.id} onClick={() => navigate(`/models/${phone.id}`)}><PhoneVisual phone={phone} compact /><span>{phone.name} vs 自定义方案 A</span><em>2024.05.{22 - index * 2}</em><MatchBadge value={phone.match} /></button>)}</article>
          <article className="plan-history-card"><h2>自定义手机历史</h2>{['自定义方案 A', '轻量化方案 B', '大屏握持方案 C'].map((item, index) => <button type="button" key={item} onClick={() => navigate('/report/tuning/basic')}><span>PLAN</span><strong>{item}</strong><em>最近编辑：2024.05.{22 - index * 2} 14:32</em><b>{['已应用', '草稿', '已存档'][index]}</b></button>)}</article>
        </div>
      </section>
    </WorkbenchShell>
  );
}
