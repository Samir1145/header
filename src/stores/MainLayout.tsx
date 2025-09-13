import { useState, useCallback, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import ThemeProvider from '@/components/ThemeProvider';
import TabVisibilityProvider from '@/contexts/TabVisibilityProvider';
import ApiKeyAlert from '@/components/ApiKeyAlert';
import StatusIndicator from '@/components/status/StatusIndicator';
import NetworkStatus from '@/components/NetworkStatus';
import SiteHeader from '@/features/SiteHeader';
import { useAuthStore } from '@/stores/state';
import { useSettingsStore } from '@/stores/settings';
import { getAuthStatus } from '@/api/firebaseAuth';
import { navigationService } from '@/services/navigation';
import { ZapIcon } from 'lucide-react';

export default function MainLayout() {
  const [apiKeyAlertOpen, setApiKeyAlertOpen] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [isGuestMode, setIsGuestMode] = useState(true);

  const location = useLocation();
  const navigate = useNavigate();
  const { login, logout } = useAuthStore.getState();

  const handleApiKeyAlertOpenChange = useCallback((open: boolean) => {
    setApiKeyAlertOpen(open);
  }, []);

  useEffect(() => {
    navigationService.setNavigate(navigate);
  }, [navigate]);

  useEffect(() => {
    const auth = getAuth();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const status = await getAuthStatus();
          const token = status.access_token || '';

          login(
            token,
            status.core_version,
            status.api_version,
            status.webui_title ?? null,
            status.webui_description ?? null,
            status.role ?? null,
            status.plan ?? null
          );
console.log('status',status)
          sessionStorage.setItem('VERSION_CHECKED_FROM_LOGIN', 'true');

          // Set guestMode based on plan
          if (status.plan === 'pro' || status.role === 'admin') {
            setIsGuestMode(false);
          } else {
            setIsGuestMode(true);
          }
        } catch (err) {
          console.error('Auth state initialization failed:', err);
          logout();
          setIsGuestMode(true);
        } finally {
          setInitializing(false);
        }
      } else {
        // Not logged in
        logout();
        setIsGuestMode(true);
        setInitializing(false);
      }
    });

    return () => unsubscribe();
  }, [login, logout]);

  useEffect(() => {
    if (!initializing && location.pathname === '/') {
      console.log('isGuestMode',isGuestMode)
      if (isGuestMode) {
        navigate('/retrieval');
      } else {
        navigate('/access/idoc'); 
      }
    }
  }, [initializing, location, navigate, isGuestMode]);

  if (initializing) {
    return (
      <div className="flex h-screen w-screen flex-col">
        <header className="border-border/40 bg-background/95 sticky top-0 z-50 flex h-10 w-full border-b px-4 backdrop-blur">
          <div className="min-w-[200px] w-auto flex items-center">
            <a className="flex items-center gap-2">
              <ZapIcon className="size-4 text-emerald-400" aria-hidden="true" />
              <span className="font-bold md:inline-block">Initializing...</span>
            </a>
          </div>
        </header>
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <div className="mb-2 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p>Loading application...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <TabVisibilityProvider>
        <main className="flex h-screen w-screen overflow-hidden">
          <div className="flex flex-col grow">
            <SiteHeader guestMode={isGuestMode} />
            <div className="relative grow overflow-auto">
              <Outlet />
            </div>
          </div>
          <StatusIndicator />
          <NetworkStatus />
          <ApiKeyAlert open={apiKeyAlertOpen} onOpenChange={handleApiKeyAlertOpenChange} />
        </main>
      </TabVisibilityProvider>
    </ThemeProvider>
  );
}
