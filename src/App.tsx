import { Navigate, Route, Routes } from 'react-router-dom';
import HomePage from './pages/HomePage';
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
import {
  ComparePage,
  DashboardPage,
  MyDataPage,
  PhoneDetailPage,
  PhoneLibraryPage,
  ReportPage,
} from './pages/_placeholders';

const RedirectHome = () => <Navigate to="/" replace />;

export default function App() {
  return (
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

      <Route path="*" element={<RedirectHome />} />
    </Routes>
  );
}
