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
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { firebaseLogout } from '@/api/firebaseAuth';
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
  directPath?: string; // For single-row menu direct navigation
}

interface FirebaseTabConfig {
  [key: string]: {
    public?: boolean;
    stakeholders?: boolean;
    team?: boolean;
    admin?: boolean;
    customHeading?: string;
    order?: number;
    loginUrl?: string;
    
    subtabs?: SubTab[];
    
    ipAddress1?: string;
    ipAddress2?: string;
    ipAddress3?: string;
    ipAddress4?: string;
    ipAddress5?: string;
    subtitle1?: string;
    subtitle2?: string;
    subtitle3?: string;
    subtitle4?: string;
    subtitle5?: string;
    url1?: string;
    url2?: string;
    url3?: string;
    url4?: string;
    url5?: string;
  };
}

function NavigationMenu({ tabs }: { tabs: NavigationTab[]; role?: string | null }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleTabNavigation = (tab: NavigationTab) => {
    const validSubtabs = tab.subtabs.filter(subtab => subtab.title && subtab.path);
    
    if (validSubtabs.length > 0) {
      navigate(validSubtabs[0].path);
    } else {
      navigate(tab.path);
    }
  };

const isTabActive = (tab: NavigationTab) => {
  // Active only if one of the subtabs matches
  return tab.subtabs.some(subtab =>
    location.pathname === subtab.path ||
    location.pathname.startsWith(subtab.path + '/')
  );
};


  return (
    <div className="flex items-center gap-2">
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

export default function SiteHeader({ guestMode = false }: { guestMode?: boolean }) {
  const { role, plan } = useAuthStore();
  const { menuStyle } = useSettingsStore();
  const [showLogin, setShowLogin] = useState(false);
  const [tabs, setTabs] = useState<NavigationTab[]>([]);
  const [activeTab, setActiveTab] = useState<NavigationTab | null>(null);
  const location = useLocation();
  const [siteInfo, setSiteInfo] = useState<{ siteTitle: string; siteHeader: string }>({
    siteTitle: "",
    siteHeader: "",
  });

  useEffect(() => {
    const fetchTabs = async () => {
      try {
        const docRef = doc(db, 'admin_feature_tabs', 'access_config_new');
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const config = docSnap.data() as FirebaseTabConfig;
          const data = docSnap.data();
          const fetchedTabs: NavigationTab[] = [];
          
          if (data.siteSettings) {
            setSiteInfo({
              siteTitle: data.siteSettings.siteTitle || "",
              siteHeader: data.siteSettings.siteHeader || "",
            });
          }

          for (const [key, val] of Object.entries(config)) {
            if (!val || typeof val !== 'object' || key === 'siteSettings' || key === 'resourceTypes') continue;

            // For dynamically created menus (like menu_7), show them if they have any content
            // even if visibility flags are not set, to prevent them from disappearing
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
              directPath: (val as any).path // Add directPath for single-row menu
            });
          }

          fetchedTabs.sort((a, b) => a.order - b.order);
          setTabs(fetchedTabs);
          useNavigationTabsStore.getState().setTabs(fetchedTabs);
        } else {
          console.warn('No config found in Firebase');
          setTabs([]);
        }
      } catch (err) {
        console.error('Error loading tabs:', err);
        setTabs([]);
      }
    };

    fetchTabs();
  }, [guestMode]);

  useEffect(() => {
    if (tabs.length === 0) return;
const findActiveTab = () => {
  for (const tab of tabs) {
    const matchingSubtab = tab.subtabs.find(subtab =>
      location.pathname === subtab.path ||
      location.pathname.startsWith(subtab.path + '/')
    );
    if (matchingSubtab) return tab;
  }
  return null;
};

    // const findActiveTab = () => {
    //   const exactMatch = tabs.find(tab => location.pathname === tab.path);
    //   if (exactMatch) return exactMatch;

    //   for (const tab of tabs) {
    //     const matchingSubtab = tab.subtabs.find(subtab => 
    //       location.pathname === subtab.path ||
    //       location.pathname.startsWith(subtab.path + '/')
    //     );
    //     if (matchingSubtab) return tab;
    //   }

    //   return tabs.find(tab =>
    //     location.pathname.startsWith(tab.path + '/') &&
    //     location.pathname !== tab.path
    //   ) || null;
    // };

    setActiveTab(findActiveTab());
  }, [location.pathname, tabs]);

  return (
    <>
      <header className="bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 flex w-full items-center justify-between px-4 pt-4 pb-0">
        {/* Left side - Logo + Branding */}
        <div className="flex items-center min-w-[200px]">
          <NavLink to={guestMode ? "/" : "/access"} className="flex items-center gap-2">
            <img src="apnet_logo.jpeg" alt="Logo" className="h-8 w-auto" />
            <span className="font-bold">{siteInfo.siteTitle || SiteInfo.name}</span>
          </NavLink>
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
          {menuStyle === 'single-row' ? (
            <SingleRowMenu tabs={tabs} role={role} />
          ) : (
            <NavigationMenu tabs={tabs} role={role} />
          )}
        </div>

        {/* Right - Actions */}
        <div className="w-[200px] flex justify-end items-center gap-2">
          <NavLink to={'/aboutus'} className='p-2 rounded-full hover:bg-muted transition-colors'>
            <img src="advocate.png" alt="about us" className="h-5 w-5" />
          </NavLink>
          {role === 'admin' && (
            <SettingsMenu role={role} />
          )}
          <AppSettings />
          {plan ? (
            <button
              onClick={async () => {
                try {
                  await firebaseLogout();
                  useAuthStore.getState().logout();
                  navigationService.navigateToLogin();
                } catch (error) {
                  console.error('Logout failed:', error);
                }
              }}
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