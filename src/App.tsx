import { lazy, Suspense, useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import HomePage from './pages/HomePage';
const ThreeDemoPage = lazy(() => import('./pages/ThreeDemoPage'));
// DEV-only 页面跳转工具（生产构建中 import.meta.env.DEV 为 false，自动剔除）。上线前删除此行 + 下方渲染即可。
const DevNav = lazy(() => import('./components/DevNav'));
import HandRecognitionPage from './pages/HandRecognitionPage';
import HandScanningPage from './pages/HandScanningPage';
import LoginPage from './pages/LoginPage';
import OnboardingPage from './pages/OnboardingPage';
import RoleSelectPage from './pages/RoleSelectPage';
import { ProfileInfoPage } from './pages/CustomerWorkbenchPages';
import AppShell from './layouts/AppShell';
import MeasurementPage from './pages/MeasurementPage';
import BestPhonePage from './pages/BestPhonePage';
import TuningPage from './pages/TuningPage';
import ReportPage from './pages/ReportPage';
import PhoneLibraryPage from './pages/PhoneLibraryPage';
import PhoneDetailPage from './pages/PhoneDetailPage';
import ComparePage from './pages/ComparePage';
import MyDataPage from './pages/MyDataPage';
import DashboardPage from './pages/DashboardPage';

const RedirectHome = () => <Navigate to="/" replace />;

const MOBILE_LANDSCAPE_QUERY = '(max-width: 980px) and (orientation: landscape)';
const MOBILE_LANDSCAPE_BASE = {
  width: 760,
  height: 350,
  maxScale: 1.16,
};

type MobileLandscapeScaleState = {
  active: boolean;
  scale: number;
  stageWidth: number;
  stageHeight: number;
};

function getMobileLandscapeScale(): MobileLandscapeScaleState {
  if (typeof window === 'undefined' || !window.matchMedia(MOBILE_LANDSCAPE_QUERY).matches) {
    return { active: false, scale: 1, stageWidth: 0, stageHeight: 0 };
  }

  const viewport = window.visualViewport;
  const width = viewport?.width || window.innerWidth;
  const height = viewport?.height || window.innerHeight;
  const fitScale = Math.min(
    width / MOBILE_LANDSCAPE_BASE.width,
    height / MOBILE_LANDSCAPE_BASE.height,
  );
  const scale = Math.max(1, Math.min(MOBILE_LANDSCAPE_BASE.maxScale, fitScale));

  return {
    active: true,
    scale,
    stageWidth: width / scale,
    stageHeight: height / scale,
  };
}

function MobileLandscapeScaleFrame({ children }: { children: ReactNode }) {
  const [scaleState, setScaleState] = useState<MobileLandscapeScaleState>(() =>
    getMobileLandscapeScale(),
  );

  useEffect(() => {
    const update = () => setScaleState(getMobileLandscapeScale());
    const media = window.matchMedia(MOBILE_LANDSCAPE_QUERY);
    const viewport = window.visualViewport;

    update();
    media.addEventListener('change', update);
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    viewport?.addEventListener('resize', update);

    return () => {
      media.removeEventListener('change', update);
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
      viewport?.removeEventListener('resize', update);
    };
  }, []);

  const style = scaleState.active
    ? ({
        '--gripfit-mobile-scale': scaleState.scale,
        '--gripfit-mobile-stage-width': `${scaleState.stageWidth}px`,
        '--gripfit-mobile-stage-height': `${scaleState.stageHeight}px`,
      } as CSSProperties)
    : undefined;

  return (
    <div
      className={`gripfit-scale-frame ${scaleState.active ? 'is-mobile-landscape' : ''}`}
      style={style}
    >
      <div className="gripfit-scale-stage">{children}</div>
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={null}>
      <MobileLandscapeScaleFrame>
    {import.meta.env.DEV ? <DevNav /> : null}
    <Routes>
      {/* 保留路由：onboarding 流程 */}
      <Route path="/" element={<HomePage />} />
      <Route path="/role-select" element={<RoleSelectPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/onboarding" element={<OnboardingPage />} />
      <Route path="/profile-info" element={<ProfileInfoPage />} />
      <Route path="/onboarding/profile" element={<ProfileInfoPage />} />
      <Route path="/hand-recognition" element={<HandRecognitionPage />} />
      <Route path="/hand-scanning" element={<HandScanningPage />} />

      {/* Phase 1：AppShell 包裹的后续页面（目前是占位，Phase 2+ 替换实际内容） */}
      <Route element={<AppShell />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/measure" element={<MeasurementPage />} />
        <Route path="/tuning" element={<TuningPage />} />
        <Route path="/library" element={<PhoneLibraryPage />} />
        <Route path="/phone/:id" element={<PhoneDetailPage />} />
        <Route path="/report" element={<ReportPage />} />
        <Route path="/report/best-phone" element={<BestPhonePage />} />
        <Route path="/compare" element={<ComparePage />} />
        <Route path="/my-data" element={<MyDataPage />} />
      </Route>

      <Route path="/three-demo" element={<ThreeDemoPage />} />

      <Route path="*" element={<RedirectHome />} />
    </Routes>
      </MobileLandscapeScaleFrame>
    </Suspense>
  );
}
