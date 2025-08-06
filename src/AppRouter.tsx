import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import ThemeProvider from '@/components/ThemeProvider';
import MainLayout from '@/stores/MainLayout';
import LoginPage from '@/features/LoginPage';
import RegisterPage from '@/features/RegisterPage';
import ForgotPasswordPage from '@/features/ForgotPasswordPage';
import RetrievalTestingFree from '@/features/RetrievalTestingFree';
import UshahidiMapPage from '@/features/UshahidiMapPage';
import AgentsPage from '@/features/AgentsPage';
import RetrievalTesting from '@/features/RetrievalTesting';
import DocumentManager from '@/features/DocumentManager';
import ChatLogsPage from '@/features/ChatLogsPage';
import GraphViewer from '@/features/GraphViewer';
import FeatureTabsAdmin from '@/features/FeatureTabsAdmin';
import TempAdminSettings from '@/features/TempAdminSettings';
import DynamicAdminSettings from '@/features/DynamicAdminSettings';
import AboutPage from '@/features/AboutPage';
import NotFound from '@/features/NotFound';
import { useAuthStore } from '@/stores/state';
import { useLocation } from 'react-router-dom';
import FormBuilderPage from '@/features/FormBuilderPage';
import RetrievalTestingFree2 from './features/RetrievalTestingFree2';
import RetrievalTestingFree3 from './features/RetrievalTestingFree3';


function RequireProPlan({ children }: { children: React.ReactNode }) {
  const { plan } = useAuthStore();
  const location = useLocation();

  const isPro = plan === 'pro';

  if (!isPro) {
    return <Navigate to="/retrieval" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}

export default function AppRouter() {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          {/* <Route path="/about" element={<AboutPage />} /> */}

          {/* Main layout routes */}
          <Route path="/" element={<MainLayout />}>
            {/* Free user and public routes */}
            <Route index path="retrieval" element={<RetrievalTestingFree />} />
            <Route index path="retrieval2" element={<RetrievalTestingFree2 />} />
            <Route index path="retrieval3" element={<RetrievalTestingFree3 />} />
            <Route path="map" element={<UshahidiMapPage />} />
            <Route path="appeals" element={<AboutPage />} />
            <Route path="agents" element={<AgentsPage />} />

            {/* Protected pro plan /access routes */}
            {/* <Route
              path="access"
              element={
                <RequireProPlan>
                  <DocumentManager />
                </RequireProPlan>
              }
            > */}

            <Route path="forms" element={<RequireProPlan><FormBuilderPage /></RequireProPlan>} />

            <Route path="/access" element={<RequireProPlan><Navigate to="/access/idoc" replace /></RequireProPlan>} />
            <Route path="access/iask" element={<RequireProPlan><RetrievalTesting /></RequireProPlan>} />
            <Route path="access/idoc" element={<RequireProPlan><DocumentManager /></RequireProPlan>} />
            <Route path="access/ilog" element={<RequireProPlan><ChatLogsPage /></RequireProPlan>} />
            {/* <Route path="access/irun" element={<RequireProPlan><GraphViewer /></RequireProPlan>} /> */}
            <Route path="access/igraph" element={<RequireProPlan><GraphViewer /></RequireProPlan>} />
            <Route path="access/admin-features" element={<RequireProPlan><FeatureTabsAdmin /></RequireProPlan>} />
            <Route path="temp-admin" element={<TempAdminSettings />} />
            <Route path="dynamic-admin" element={<DynamicAdminSettings />} />



            {/* Catch-all under layout */}
            <Route path="*" element={<NotFound />} />
          </Route>

          {/* Catch-all outside layout */}
          <Route path="*" element={<NotFound />} />
        </Routes>

        <Toaster position="bottom-center" theme="system" closeButton richColors />
      </Router>
    </ThemeProvider>
  );
}
