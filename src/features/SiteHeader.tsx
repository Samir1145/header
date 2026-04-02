import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { SiteInfo } from '@/lib/constants';
import AppSettings from '@/components/AppSettings';
import SettingsMenu from '@/components/SettingsMenu';
import SingleRowMenu from '@/components/SingleRowMenu';
import { useAuthStore } from '@/stores/state';
import { useSettingsStore } from '@/stores/settings';
import { cn } from '@/lib/utils';
import { navigationService } from '@/services/navigation';
import { LogOutIcon } from 'lucide-react';
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/Tooltip';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { getNavigationTabs, getSiteSettings, TabConfig } from '@/api/sqliteApi';
import { sqliteLogout } from '@/api/sqliteAuth';
import { useNavigationTabsStore } from '@/stores/navigationTabs';
import LoginModal from '@/features/LoginModal';

interface SubTab {
  title: string;
  path: string;
  loginUrl: string;
}

interface NavigationTab {
  label: string;
  value: string;
  path: string;
  loginUrl: string;
  subtabs: SubTab[];
  order: number;
  directPath?: string;
}

function NavigationMenu({ tabs, homeTabSettings }: { tabs: NavigationTab[]; homeTabSettings: { title: string; path: string; url: string } }) {
  const navigate = useNavigate();
  const location = useLocation();

  // Handle Home tab navigation — always internal
  const handleHomeNavigation = () => {
    if (homeTabSettings.path) {
      navigate(homeTabSettings.path);
    }
  };

  const isHomeTabActive = homeTabSettings.path
    ? location.pathname === homeTabSettings.path || location.pathname.startsWith(homeTabSettings.path + '/')
    : false;

  const handleTabNavigation = useCallback((tab: NavigationTab) => {
    const validSubtabs = tab.subtabs.filter(subtab => subtab.title && subtab.path);

    if (validSubtabs.length > 0) {
      navigate(validSubtabs[0].path);
    } else {
      navigate(tab.path);
    }
  }, [navigate]);

  const isTabActive = useCallback((tab: NavigationTab) => {
    return tab.subtabs.some(subtab =>
      location.pathname === subtab.path ||
      location.pathname.startsWith(subtab.path + '/')
    );
  }, [location.pathname]);

  return (
    <div className="flex items-center gap-2">
      {/* Home Tab */}
      {homeTabSettings.path && (
        <div
          onClick={handleHomeNavigation}
          className={cn(
            'cursor-pointer px-3 py-2 rounded-md text-sm font-medium transition-all',
            isHomeTabActive
              ? 'bg-emerald-400 text-white'
              : 'text-muted-foreground hover:bg-accent'
          )}
        >
          {homeTabSettings.title || 'Home'}
        </div>
      )}

      {tabs.map(tab => (
        <div
          key={tab.value}
          onClick={() => handleTabNavigation(tab)}
          className={cn(
            'cursor-pointer px-3 py-2 rounded-md text-sm font-medium transition-all',
            isTabActive(tab)
              ? 'bg-emerald-400 text-white'
              : 'text-muted-foreground hover:bg-accent'
          )}
        >
          {tab.label}
        </div>
      ))}
    </div>
  );
}

function SubNavigationMenu({ activeTab }: { activeTab?: NavigationTab | null }) {
  const location = useLocation();

  if (!activeTab || !activeTab.subtabs || activeTab.subtabs.length === 0) {
    return null;
  }

  const validSubtabs = activeTab.subtabs.filter(subtab => subtab.title && subtab.path);

  if (validSubtabs.length === 0) {
    return null;
  }

  return (
    <div className="border-b bg-background sticky top-[55px] z-40">
      <div className="flex justify-center items-center gap-6">
        {validSubtabs.map((subtab, index) => {
          const isActive = location.pathname === subtab.path ||
            location.pathname.startsWith(subtab.path + '/');

          return (
            <NavLink
              key={index}
              to={subtab.path}
              className={cn(
                'relative px-4 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'text-emerald-500'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {subtab.title}
              {isActive && (
                <span className="absolute left-0 right-0 -bottom-[1px] h-[2px] bg-emerald-500 rounded-t" />
              )}
            </NavLink>
          );
        })}
      </div>
    </div>
  );
}

// Transform API config to NavigationTab format
function transformTabConfig(config: TabConfig, guestMode: boolean): NavigationTab[] {
  const fetchedTabs: NavigationTab[] = [];

  for (const [key, val] of Object.entries(config)) {
    if (!val || typeof val !== 'object' || key === 'siteSettings' || key === 'resourceTypes') continue;

    const isDynamicMenu = key.startsWith('menu_');
    const hasContent = val.customHeading || (val.subtabs && val.subtabs.some((sub: any) => sub.title || sub.path));

    if (guestMode && !val.public && !(isDynamicMenu && hasContent)) continue;
    if (!guestMode && !(val.public || val.stakeholders || val.team || val.admin) && !(isDynamicMenu && hasContent)) continue;

    const label = val.customHeading || key;

    let path = val.ipAddress1 || `/${key}`;
    if (!path.startsWith('/')) path = `/${path}`;
    path = path.replace(/\/+/g, '/');

    let subtabs: SubTab[] = [];

    if (val.subtabs && Array.isArray(val.subtabs)) {
      subtabs = val.subtabs.filter(subtab =>
        subtab && subtab.title && subtab.path
      );
    } else {
      const legacySubtabs = [];
      for (let i = 1; i <= 5; i++) {
        const title = val[`subtitle${i}` as keyof typeof val] as string;
        const url = val[`url${i}` as keyof typeof val] as string;

        if (title && url) {
          legacySubtabs.push({
            title,
            path: url,
            loginUrl: key
          });
        }
      }
      subtabs = legacySubtabs;
    }

    fetchedTabs.push({
      label,
      value: key,
      path,
      order: val.order ?? 999,
      loginUrl: val.loginUrl || key,
      subtabs,
      directPath: (val as any).path
    });
  }

  return fetchedTabs.sort((a, b) => a.order - b.order);
}

export default function SiteHeader({ guestMode = false }: { guestMode?: boolean }) {
  const { role, plan } = useAuthStore();
  const { menuStyle } = useSettingsStore();
  const [showLogin, setShowLogin] = useState(false);
  const [tabs, setTabs] = useState<NavigationTab[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();
  const [siteInfo, setSiteInfo] = useState<{ siteTitle: string; siteHeader: string }>({
    siteTitle: "",
    siteHeader: "",
  });
  const [homeTabSettings, setHomeTabSettings] = useState<{ title: string; path: string; url: string }>({
    title: "",
    path: "",
    url: "",
  });

  // Fetch tabs from SQLite API with caching
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);

      // Fetch tabs and site settings in parallel
      const [tabConfig, settings] = await Promise.all([
        getNavigationTabs(),
        getSiteSettings()
      ]);

      // Transform and filter tabs
      const transformedTabs = transformTabConfig(tabConfig, guestMode);
      setTabs(transformedTabs);
      useNavigationTabsStore.getState().setTabs(transformedTabs);

      // Set site info
      setSiteInfo({
        siteTitle: settings.siteTitle || "",
        siteHeader: settings.siteHeader || "",
      });

      // Set home tab settings (stored in navigation tabs config)
      const savedHomeTab = tabConfig.homeTabSettings as { title?: string; path?: string; url?: string } | undefined;
      setHomeTabSettings({
        title: savedHomeTab?.title || "Home",
        path: savedHomeTab?.path || "",
        url: savedHomeTab?.url || "",
      });
    } catch (err) {
      console.error('Error loading header data:', err);
      setTabs([]);
    } finally {
      setIsLoading(false);
    }
  }, [guestMode]);

  useEffect(() => {
    let isMounted = true;

    fetchData();

    // Listen for settings changes
    const handleSettingsUpdate = () => {
      if (isMounted) {
        fetchData();
      }
    };

    window.addEventListener('site-settings-updated', handleSettingsUpdate);

    return () => {
      isMounted = false;
      window.removeEventListener('site-settings-updated', handleSettingsUpdate);
    };
  }, [fetchData]);

  // Memoized active tab calculation
  const activeTab = useMemo(() => {
    if (tabs.length === 0) return null;

    for (const tab of tabs) {
      const matchingSubtab = tab.subtabs.find(subtab =>
        location.pathname === subtab.path ||
        location.pathname.startsWith(subtab.path + '/')
      );
      if (matchingSubtab) return tab;
    }
    return null;
  }, [location.pathname, tabs]);

  // Memoized logout handler
  const handleLogout = useCallback(async () => {
    try {
      await sqliteLogout();
      useAuthStore.getState().logout();
      navigationService.navigateToLogin();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }, []);

  return (
    <>
      <header className="bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 flex w-full items-center justify-between px-4 pt-4 pb-0">
        {/* Left side - Branding */}
        <div className="flex items-center min-w-[200px]">
          {siteInfo.siteTitle && (
            <NavLink to={guestMode ? "/" : "/access"} className="flex items-center gap-2">
              <span className="font-bold">{siteInfo.siteTitle}</span>
            </NavLink>
          )}
          {siteInfo.siteHeader && (
            <div className="ml-2 flex items-center">
              <span className="mx-1 text-xs text-gray-500">|</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-sm font-medium cursor-default">
                      {siteInfo.siteHeader}
                    </span>
                  </TooltipTrigger>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
        </div>

        {/* Center - Navigation Tabs */}
        <div className="flex flex-1 justify-center items-center">
          {isLoading ? (
            <div className="h-8 w-48 bg-muted animate-pulse rounded" />
          ) : menuStyle === 'single-row' ? (
            <SingleRowMenu tabs={tabs} role={role} homeTabSettings={homeTabSettings} />
          ) : (
            <NavigationMenu tabs={tabs} homeTabSettings={homeTabSettings} />
          )}
        </div>

        {/* Right - Actions */}
        <div className="w-[200px] flex justify-end items-center gap-2">
          {role === 'admin' && (
            <SettingsMenu role={role} />
          )}
          <AppSettings />
          {plan ? (
            <button
              onClick={handleLogout}
              className="p-2 rounded-full hover:bg-muted transition-colors"
              aria-label="Logout"
            >
              <LogOutIcon className="h-4 w-4" />
            </button>
          ) : (
            <>
              <button
                onClick={() => setShowLogin(true)}
                className="text-sm hover:underline"
              >
                Login
              </button>
              <LoginModal open={showLogin} onOpenChange={setShowLogin} />
            </>
          )}
        </div>
      </header>

      {menuStyle === 'two-row' && <SubNavigationMenu activeTab={activeTab} />}
    </>
  );
}