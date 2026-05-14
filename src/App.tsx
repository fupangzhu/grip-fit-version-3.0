import { Navigate, Route, Routes } from 'react-router-dom';
import HomePage from './pages/HomePage';
import HandRecognitionPage from './pages/HandRecognitionPage';
import HandScanningPage from './pages/HandScanningPage';
import LoginPage from './pages/LoginPage';
import OnboardingPage from './pages/OnboardingPage';
import RoleSelectPage from './pages/RoleSelectPage';
import {
  ComparePage,
  CompareReportPage,
  MeasurementPage,
  MyDataPage,
  ParameterTuningPage,
  PhoneDetailPage,
  PhoneLibraryPage,
  ProfileInfoPage,
  ReportDetailPage,
} from './pages/CustomerWorkbenchPages';

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
      <Route path="/measurement" element={<MeasurementPage />} />
      <Route path="/measure/auto" element={<MeasurementPage />} />
      <Route path="/measure/manual" element={<MeasurementPage />} />
      <Route path="/tuning" element={<ParameterTuningPage />} />
      <Route path="/report/best-phone" element={<ParameterTuningPage />} />
      <Route path="/report/tuning/basic" element={<ParameterTuningPage />} />
      <Route path="/report/tuning/camera" element={<ParameterTuningPage />} />
      <Route path="/report/tuning/hand" element={<ParameterTuningPage />} />
      <Route path="/report/tuning/risk-map" element={<ParameterTuningPage />} />
      <Route path="/report/tuning/risk-tooltip" element={<ParameterTuningPage />} />
      <Route path="/report" element={<ReportDetailPage />} />
      <Route path="/report/handfeel-detail" element={<ReportDetailPage />} />
      <Route path="/phones" element={<PhoneLibraryPage />} />
      <Route path="/models/recommendations" element={<PhoneLibraryPage />} />
      <Route path="/phone-detail/:id" element={<PhoneDetailPage />} />
      <Route path="/models/:id" element={<PhoneDetailPage />} />
      <Route path="/compare" element={<ComparePage />} />
      <Route path="/reports/compare/empty" element={<ComparePage />} />
      <Route path="/reports/compare/edit" element={<ComparePage />} />
      <Route path="/compare-report" element={<CompareReportPage />} />
      <Route path="/reports/compare/result" element={<CompareReportPage />} />
      <Route path="/reports/compare/export-modal" element={<CompareReportPage />} />
      <Route path="/my-data" element={<MyDataPage />} />
      <Route path="/profile/data" element={<MyDataPage />} />
      <Route path="/analysis-intro" element={<Navigate to="/" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
