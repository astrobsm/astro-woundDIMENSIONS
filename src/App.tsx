/**
 * AstroWound-MEASURE Main Application Component
 */

import React, { useEffect, Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAppStore } from './store';
import { Loader2, Activity } from 'lucide-react';

// Lazy load components for better performance
const Dashboard = lazy(() => import('./components/Dashboard').then(m => ({ default: m.Dashboard })));
const PatientForm = lazy(() => import('./components/PatientForm').then(m => ({ default: m.PatientForm })));
const PatientDetail = lazy(() => import('./components/PatientDetail').then(m => ({ default: m.PatientDetail })));
const PatientTimelinePage = lazy(() => import('./components/PatientTimelinePage').then(m => ({ default: m.default })));
// WoundCapture is used within CaptureFlow
const CaptureFlow = lazy(() => import('./components/CaptureFlow').then(m => ({ default: m.CaptureFlow })));
const CalibrationRuler = lazy(() => import('./components/CalibrationRuler').then(m => ({ default: m.CalibrationRuler })));
const ReportModulePage = lazy(() => import('./components/ReportModulePage').then(m => ({ default: m.default })));
const Settings = lazy(() => import('./components/Settings').then(m => ({ default: m.Settings })));
const UserGuide = lazy(() => import('./components/UserGuide').then(m => ({ default: m.UserGuide })));

// Loading component
const LoadingScreen: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => (
  <div className="min-h-screen bg-gradient-to-br from-astro-500 to-astro-700 flex flex-col items-center justify-center">
    <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center mb-6">
      <Activity className="w-10 h-10 text-white animate-pulse" />
    </div>
    <div className="flex items-center gap-3 text-white">
      <Loader2 className="w-5 h-5 animate-spin" />
      <span className="text-lg font-medium">{message}</span>
    </div>
    <p className="text-white/60 text-sm mt-2">AstroWound-MEASURE</p>
  </div>
);

// Error Boundary
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('App Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <Activity className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h1>
            <p className="text-gray-600 mb-4">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-astro-500 text-white rounded-lg hover:bg-astro-600 transition-colors"
            >
              Reload App
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const App: React.FC = () => {
  const { setOnlineStatus } = useAppStore();

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => setOnlineStatus(true);
    const handleOffline = () => setOnlineStatus(false);

    document.addEventListener('app:online', handleOnline);
    document.addEventListener('app:offline', handleOffline);

    // Set initial status
    setOnlineStatus(navigator.onLine);

    return () => {
      document.removeEventListener('app:online', handleOnline);
      document.removeEventListener('app:offline', handleOffline);
    };
  }, [setOnlineStatus]);

  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          {/* Dashboard */}
          <Route path="/" element={<Dashboard />} />

          {/* Patient Management */}
          <Route path="/patients/new" element={<PatientForm />} />
          <Route path="/patients/:id" element={<PatientDetail />} />
          <Route path="/patients/:id/edit" element={<PatientForm />} />
          <Route path="/patients/:id/timeline" element={<PatientTimelinePage />} />

          {/* Wound Capture */}
          <Route path="/capture" element={<CaptureFlow />} />
          <Route path="/wounds/:woundId/capture" element={<CaptureFlow />} />

          {/* Reports */}
          <Route path="/wounds/:woundId/report" element={<ReportModulePage />} />
          <Route path="/assessments/:assessmentId/report" element={<ReportModulePage />} />

          {/* Calibration */}
          <Route path="/calibration" element={<CalibrationRuler />} />

          {/* Settings */}
          <Route path="/settings" element={<Settings />} />

          {/* User Guide */}
          <Route path="/guide" element={<UserGuide />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
};

export default App;
