import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import ThemeProvider from '@/components/ThemeProvider';
import MainLayout from '@/stores/MainLayout';
import RetrievalTestingFree from '@/features/RetrievalTestingFree';
import UshahidiMapPage from '@/features/UshahidiMapPage';
import UshahidiMapPage1 from '@/features/UshahidiMap1';
import UshahidiMapPage2 from '@/features/UshahidiMap2';
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
import FormBuilderPage1 from '@/features/FormBuilderPage1';
import FormBuilderPage2 from '@/features/FormBuilderPage1';

import RetrievalTestingFree2 from './features/RetrievalTestingFree2';
import RetrievalTestingFree3 from './features/RetrievalTestingFree3';
import RetrievalTestingFree4 from './features/RetrievalTestingFree4';
import RetrievalTestingFree5 from './features/RetrievalTestingFree5';
import FramePage from '@/features/FramePage';
import FramePage2 from '@/features/FramePage2';
import FramePage3 from '@/features/FramePage3';
import FramePage4 from '@/features/FramePage4';
import FramePage5 from '@/features/FramePage5';
import FramePage6 from '@/features/FramePage6';
import FramePage7 from '@/features/FramePage7';
import FramePage8 from '@/features/FramePage8';
import FramePage9 from '@/features/FramePage9';
import FramePage10 from '@/features/FramePage10';


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
          {/* <Route path="/login" element={<LoginPage />} /> */}
          {/* <Route path="/register" element={<RegisterPage />} /> */}
          {/* <Route path="/forgot-password" element={<ForgotPasswordPage />} /> */}

          {/* <Route path="/about" element={<AboutPage />} /> */}

          {/* Main layout routes */}
          <Route path="/" element={<MainLayout />}>
            {/* Free user and public routes */}
            <Route index path="retrieval" element={<RetrievalTestingFree />} />
            <Route index path="retrieval2" element={<RetrievalTestingFree2 />} />
            <Route index path="retrieval3" element={<RetrievalTestingFree3 />} />
            <Route index path="retrieval4" element={<RetrievalTestingFree4 />} />
            <Route index path="retrieval5" element={<RetrievalTestingFree5 />} />
            <Route path="map" element={<UshahidiMapPage />} />
            <Route path="map1" element={<UshahidiMapPage1 />} />
            <Route path="map2" element={<UshahidiMapPage2 />} />
            <Route path="appeals" element={<AboutPage />} />
            <Route path="agents" element={<AgentsPage />} />
            <Route path="iframe" element={<FramePage />} />
            <Route path="iframe2" element={<FramePage2 />} />
            <Route path="iframe3" element={<FramePage3 />} />
            <Route path="iframe4" element={<FramePage4 />} /> 
            <Route path="iframe5" element={<FramePage5 />} />
            <Route path="iframe6" element={<FramePage6 />} />
            <Route path="iframe7" element={<FramePage7 />} />
            <Route path="iframe8" element={<FramePage8 />} />
            <Route path="iframe9" element={<FramePage9 />} />
            <Route path="iframe10" element={<FramePage10 />} />
            <Route path="aboutus" element={<AboutPage />} />

            {/* Protected pro plan /access routes */}
            {/* <Route
              path="access"
              element={
                <RequireProPlan>
                  <DocumentManager />
                </RequireProPlan>
              }
            > */}

            <Route path="forms" element={<FormBuilderPage />} />
            <Route path="forms1" element={<FormBuilderPage1 />} />
            <Route path="forms2" element={<FormBuilderPage2 />} />

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
