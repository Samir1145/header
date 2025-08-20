import { NavLink, useLocation, Link } from 'react-router-dom';
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
  subtitles?: string[];
}

interface MainNavigationTab extends NavigationTab {
  subtitles: string[];
  isActive: boolean;
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
  };
}

function NavigationItem({ tab, isActive, onClick }: { tab: NavigationTab; isActive: boolean; onClick?: () => void }) {
  return (
    <NavLink
      to={tab.path}
      onClick={onClick}
      className={cn(
        'cursor-pointer px-3 py-2 rounded-md text-sm font-medium transition-all',
        isActive
          ? 'bg-emerald-400 text-white'
          : 'text-muted-foreground hover:bg-accent'
      )}
    >
      {tab.label}
    </NavLink>
  );
}

function NavigationMenu({ guestMode, role, onTabClick }: { guestMode: boolean; role?: string | null; onTabClick?: (tab: MainNavigationTab) => void }) {
  const [tabs, setTabs] = useState<MainNavigationTab[]>([]);
  const location = useLocation();
  
  useEffect(() => {
    const fetchTabs = async () => {
      try {
        const docRef = doc(db, 'admin_feature_tabs', 'access_config_local');
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const config = docSnap.data() as FirebaseTabConfig;

          const entries = Object.entries(config)
            .filter(([key, val]) => {
              if (!val || typeof val !== 'object') return false;
              
              // Filter based on guest mode and permissions
              if (guestMode) return val.public;
              return val.public || val.stakeholders || val.team || val.admin;
            })
            .map(([key, val]) => {
              const label = val.customHeading || key;
              const path = val.ipAddress1 || `/${key}`;
              const order = val.order ?? 999;
              const loginUrl = val.loginUrl || key;
              
              // Collect non-empty subtitles
              const subtitles = [
                val.subtitle1 || '',
                val.subtitle2 || '',
                val.subtitle3 || ''
              ].filter(subtitle => subtitle.trim() !== '');
              
              // For tabs with subtitles, use the first IP address as the main path
              const mainPath = subtitles.length > 0 ? val.ipAddress1 || `/${key}` : path;

              return { 
                label, 
                value: key, 
                path: mainPath, 
                order, 
                loginUrl,
                subtitles,
                isActive: location.pathname === mainPath || location.pathname.startsWith(mainPath)
              };
            })
            .sort((a, b) => a.order - b.order);

          setTabs(entries);
          useNavigationTabsStore.getState().setTabs(entries);
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
  }, [guestMode, location.pathname]);

  return (
    <div className="flex items-center gap-2">
      {tabs.map(tab => (
        <NavigationItem
          key={tab.value}
          tab={tab}
          isActive={tab.isActive}
          onClick={() => onTabClick && onTabClick(tab)}
        />
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

function SubNavigationMenu({ activeTab }: { activeTab?: MainNavigationTab | null }) {
  const location = useLocation();
  
  if (!activeTab || !activeTab.subtitles || activeTab.subtitles.length === 0) {
    return null;
  }

  return (
    <div className="flex justify-center items-center gap-2 px-4 py-2 border-b bg-background sticky top-[64px] z-40">
      {activeTab.subtitles.map((subtitle, index) => {
        // Create a path for each subtitle using the corresponding IP address
        const path = activeTab.path.replace('/access/', `/access/${subtitle.toLowerCase()}/`);
        
        return (
          <NavLink
            key={index}
            to={path}
            className={cn(
              'cursor-pointer px-3 py-2 rounded-md text-sm font-medium transition-all',
              location.pathname.startsWith(path)
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
  const [activeTab, setActiveTab] = useState<MainNavigationTab | null>(null);
  const location = useLocation();

  // Find the active tab based on current location
  useEffect(() => {
    const findActiveTab = async () => {
      try {
        const docRef = doc(db, 'admin_feature_tabs', 'access_config_local');
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const config = docSnap.data() as FirebaseTabConfig;
          const tabs = Object.entries(config)
            .filter(([key, val]) => {
              if (!val || typeof val !== 'object') return false;
              if (guestMode) return val.public;
              return val.public || val.stakeholders || val.team || val.admin;
            })
            .map(([key, val]) => {
              const label = val.customHeading || key;
              const path = val.ipAddress1 || `/${key}`;
              const subtitles = [
                val.subtitle1 || '',
                val.subtitle2 || '',
                val.subtitle3 || ''
              ].filter(subtitle => subtitle.trim() !== '');
              
              const mainPath = subtitles.length > 0 ? val.ipAddress1 || `/${key}` : path;
              
              return {
                label,
                value: key,
                path: mainPath,
                subtitles,
                isActive: location.pathname === mainPath || location.pathname.startsWith(mainPath),
                order: val.order || 999,
                loginUrl: val.loginUrl || key
              };
            });

          const currentTab = tabs.find(tab => 
            location.pathname === tab.path || location.pathname.startsWith(tab.path)
          );
          
          setActiveTab(currentTab || null);
        }
      } catch (err) {
        console.error('Error finding active tab:', err);
      }
    };

    findActiveTab();
  }, [location.pathname, guestMode]);

  const handleTabClick = (tab: MainNavigationTab) => {
    setActiveTab(tab);
  };

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
          <NavigationMenu 
            guestMode={guestMode} 
            role={role} 
            onTabClick={handleTabClick}
          />
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