import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import ThemeProvider from '@/components/ThemeProvider';
import MainLayout from '@/stores/MainLayout';
import RetrievalTestingFree from '@/features/RetrievalTestingFree';
import MapPage from '@/features/MapPage';
import AgentsPage from '@/features/AgentsPage';
import RetrievalTesting from '@/features/RetrievalTesting';
import DocumentManager from '@/features/DocumentManager';
import ChatLogsPage from '@/features/ChatLogsPage';
import GraphViewer from '@/features/GraphViewer';
import FeatureTabsAdmin from '@/features/FeatureTabsAdmin';
import TempAdminSettings from '@/features/TempAdminSettings';
import DynamicAdminSettings from '@/features/DynamicAdminSettings';
import ResourcesPage from '@/features/ResourcesPage';
import WrenChatPage from '@/features/WrenChatPage';
import NeonSearchPage from '@/features/NeonSearchPage';
import NotFound from '@/features/NotFound';
import { useAuthStore } from '@/stores/state';
import { useLocation } from 'react-router-dom';
import FormBuilderPage from '@/features/FormBuilderPage';
import FormBuilderPage1 from '@/features/FormBuilderPage1';
import FormBuilderPage2 from '@/features/FormBuilderPage2';

import RetrievalTestingFree2 from './features/RetrievalTestingFree2';
import RetrievalTestingFree3 from './features/RetrievalTestingFree3';
import RetrievalTestingFree4 from './features/RetrievalTestingFree4';
import RetrievalTestingFree5 from './features/RetrievalTestingFree5';
import FramePage from '@/features/FramePage';


function RequireProPlan({ children }: { children: React.ReactNode }) {
  const { plan, role } = useAuthStore();
  const location = useLocation();

  // Allow access if user has pro plan OR is an admin
  const hasAccess = plan === 'pro' || plan === 'premium' || plan === 'enterprise' || role === 'admin';

  if (!hasAccess) {
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
            {['1','2','3','4','5','6'].map(n => (
              <Route key={n} path={`map${n}`} element={<MapPage mapId={`map${n}`} />} />
            ))}
            <Route path="agents" element={<AgentsPage />} />
            {['1','2','3','4','5','6','7','8','9','10','11','12','13','14'].map(n => (
              <Route key={n} path={`iframe${n}`} element={<FramePage />} />
            ))}
            <Route path="resources/:resourceType" element={<ResourcesPage />} />
            <Route path="wren-chat" element={<WrenChatPage />} />
            <Route path="neon-search" element={<NeonSearchPage />} />

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
