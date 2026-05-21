import { Navigate, Route, Routes } from 'react-router-dom';
import HomePage from './pages/HomePage';
import HandRecognitionPage from './pages/HandRecognitionPage';
import HandScanningPage from './pages/HandScanningPage';
import LoginPage from './pages/LoginPage';
import OnboardingPage from './pages/OnboardingPage';
import RoleSelectPage from './pages/RoleSelectPage';
import { ProfileInfoPage } from './pages/CustomerWorkbenchPages';

// Phase 0：删除手部识别后所有页面的路由。后续 Phase 2-6 重建时按模块加回。
const RedirectHome = () => <Navigate to="/" replace />;

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/role-select" element={<RoleSelectPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/onboarding" element={<OnboardingPage />} />
      <Route path="/profile-info" element={<ProfileInfoPage />} />
      <Route path="/onboarding/profile" element={<ProfileInfoPage />} />
      <Route path="/hand-recognition" element={<HandRecognitionPage />} />
      <Route path="/hand-scanning" element={<HandScanningPage />} />
      {/* 已删除：/measure/* /tuning /report/* /phones /models/* /compare /compare-report /my-data /profile/data */}
      <Route path="*" element={<RedirectHome />} />
    </Routes>
  );
}
