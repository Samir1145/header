import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { SiteInfo } from '@/lib/constants';
import AppSettings from '@/components/AppSettings';
import { useAuthStore } from '@/stores/state';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { navigationService } from '@/services/navigation';
import { ZapIcon, LogOutIcon } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/Tooltip';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { firebaseLogout } from '@/api/firebaseAuth';
import { useNavigationTabsStore } from '@/stores/navigationTabs';
import LoginModal from '@/features/LoginModal';

interface NavigationTab {
  label: string;
  value: string;
  path: string;
  loginUrl: string;
  subtitles: string[];
  subtitleUrls: string[];
  order: number;
}

interface FirebaseTabConfig {
  [key: string]: {
    public?: boolean;
    stakeholders?: boolean;
    team?: boolean;
    admin?: boolean;
    customHeading?: string;
    ipAddress1?: string;
    order?: number;
    loginUrl?: string;
    subtitle1?: string;
    subtitle2?: string;
    subtitle3?: string;
    url1?: string;
    url2?: string;
    url3?: string;
  };
}

function NavigationMenu({ tabs, role }: { tabs: NavigationTab[]; role?: string | null }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleTabNavigation = (tab: NavigationTab) => {
    if (tab.subtitles.length > 0 && tab.subtitleUrls.length > 0) {
      navigate(tab.subtitleUrls[0]);
    } else {
      navigate(tab.path);
    }
  };

  // Improved active tab detection
  const isTabActive = (tab: NavigationTab) => {
    // Exact match for main tab path
    if (location.pathname === tab.path) return true;
    
    // Check if any subtitle URL matches exactly
    if (tab.subtitleUrls.some(url => location.pathname === url)) return true;
    
    // Check if current path starts with a subtitle URL (for nested routes)
    if (tab.subtitleUrls.some(url => 
      location.pathname.startsWith(url + '/') && 
      location.pathname !== url // Ensure it's not an exact match
    )) return true;
    
    return false;
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

      {role === 'admin' && (
        <NavLink
          to="/access/admin-features"
          className={cn(
            'cursor-pointer px-3 py-2 rounded-md text-sm font-medium transition-all',
            location.pathname.startsWith('/access/admin-features')
              ? 'bg-emerald-400 text-white'
              : 'text-muted-foreground hover:bg-accent'
          )}
        >
          Admin
        </NavLink>
      )}
    </div>
  );
}

function SubNavigationMenu({ activeTab }: { activeTab?: NavigationTab | null }) {
  const location = useLocation();
  
  if (!activeTab || !activeTab.subtitles || activeTab.subtitles.length === 0) {
    return null;
  }

  return (
    <div className="flex justify-center items-center gap-2 px-4 py-2 border-b bg-background sticky top-[64px] z-40">
      {activeTab.subtitles.map((subtitle, index) => {
        let path = activeTab.subtitleUrls[index] || '';
        
        if (!path) {
          const basePath = activeTab.path.replace(/\/+$/, '');
          const subtitleSlug = subtitle.toLowerCase().replace(/\s+/g, '-');
          path = `${basePath}/${subtitleSlug}`;
        }
        
        if (!path.startsWith('/')) path = `/${path}`;
        path = path.replace(/\/+/g, '/');
        
        const isActive = location.pathname === path || 
          (location.pathname.startsWith(path + '/') && location.pathname !== path);
        
        return (
          <NavLink
            key={index}
            to={path}
            className={cn(
              'cursor-pointer px-3 py-2 rounded-md text-sm font-medium transition-all',
              isActive
                ? 'bg-emerald-400 text-white'
                : 'text-muted-foreground hover:bg-accent'
            )}
          >
            {subtitle}
          </NavLink>
        );
      })}
    </div>
  );
}

export default function SiteHeader({ guestMode = false }: { guestMode?: boolean }) {
  const { t } = useTranslation();
  const { role, plan, username, webuiTitle, webuiDescription } = useAuthStore();
  const [showLogin, setShowLogin] = useState(false);
  const [tabs, setTabs] = useState<NavigationTab[]>([]);
  const [activeTab, setActiveTab] = useState<NavigationTab | null>(null);
  const location = useLocation();

  // Fetch tabs from Firestore
  useEffect(() => {
    const fetchTabs = async () => {
      try {
        const docRef = doc(db, 'admin_feature_tabs', 'access_config_local');
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const config = docSnap.data() as FirebaseTabConfig;
          const fetchedTabs: NavigationTab[] = [];

          for (const [key, val] of Object.entries(config)) {
            if (!val || typeof val !== 'object') continue;
            
            // Filter based on guest mode and permissions
            if (guestMode && !val.public) continue;
            if (!guestMode && !(val.public || val.stakeholders || val.team || val.admin)) continue;
            
            const label = val.customHeading || key;
            
            // Fix path formatting
            let path = val.ipAddress1 || `/${key}`;
            if (!path.startsWith('/')) path = `/${path}`;
            path = path.replace(/\/+/g, '/');
            
            // Collect non-empty subtitles and URLs
            const subtitles = [
              val.subtitle1 || '',
              val.subtitle2 || '',
              val.subtitle3 || ''
            ].filter(subtitle => subtitle.trim() !== '');
            
            const subtitleUrls = [
              val.url1 || '',
              val.url2 || '',
              val.url3 || ''
            ].filter(url => url.trim() !== '');
            
            fetchedTabs.push({
              label,
              value: key,
              path,
              order: val.order ?? 999,
              loginUrl: val.loginUrl || key,
              subtitles,
              subtitleUrls
            });
          }

          // Sort tabs by order
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

  // Update active tab when location or tabs change
  useEffect(() => {
    if (tabs.length === 0) return;
    
    // Improved active tab detection with exact matching
    const findActiveTab = () => {
      // First, try to find exact matches for main tab paths
      const exactMatch = tabs.find(tab => location.pathname === tab.path);
      if (exactMatch) return exactMatch;
      
      // Then try to find matches for subtitle URLs
      for (const tab of tabs) {
        // Check if any subtitle URL matches exactly
        if (tab.subtitleUrls.some(url => location.pathname === url)) {
          return tab;
        }
        
        // Check if current path starts with a subtitle URL (for nested routes)
        if (tab.subtitleUrls.some(url => 
          location.pathname.startsWith(url + '/') && 
          location.pathname !== url // Ensure it's not an exact match
        )) {
          return tab;
        }
      }
      
      // Finally, check if path starts with a tab path (as fallback)
      return tabs.find(tab => 
        location.pathname.startsWith(tab.path + '/') && 
        location.pathname !== tab.path
      ) || null;
    };
    
    setActiveTab(findActiveTab());
  }, [location.pathname, tabs]);

  return (
    <>
      <header className="border-b border-border bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 flex w-full items-center justify-between p-4">
        {/* Left side - Logo + Branding */}
        <div className="flex items-center min-w-[200px]">
          <NavLink to={guestMode ? "/" : "/access"} className="flex items-center gap-2">
            <ZapIcon className="h-4 w-4 text-emerald-400" />
            <span className="font-bold">{SiteInfo.name}</span>
          </NavLink>
          {webuiTitle && (
            <div className="ml-2 flex items-center">
              <span className="mx-1 text-xs text-gray-500">|</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-sm font-medium cursor-default">
                      {webuiTitle}
                    </span>
                  </TooltipTrigger>
                  {webuiDescription && (
                    <TooltipContent>{webuiDescription}</TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
        </div>

        {/* Center - Navigation Tabs */}
        <div className="flex flex-1 justify-center items-center">
          <NavigationMenu tabs={tabs} role={role} />
        </div>

        {/* Right - Actions */}
        <div className="w-[200px] flex justify-end items-center gap-2">
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

      {/* Sub Navigation for tabs with subtitles */}
      <SubNavigationMenu activeTab={activeTab} />
    </>
  );
}