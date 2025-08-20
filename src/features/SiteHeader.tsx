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
import LoginModal from '@/features/LoginModal'; // at top

interface NavigationTab {
  label: string;
  value: string;
  path: string;
  loginUrl: string;
}


function NavigationItem({ tab, isActive }: { tab: NavigationTab; isActive: boolean }) {
  return (
    <NavLink
      to={tab.path}
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

function NavigationMenu({ guestMode, role }: { guestMode: boolean, role?: string | null }) {
  const [tabs, setTabs] = useState<NavigationTab[]>([]);
  const location = useLocation();
  useEffect(() => {
    const fetchTabs = async () => {
      try {
        const docRef = doc(db, 'admin_feature_tabs', 'access_config_local');
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const config = docSnap.data();

          const entries = Object.entries(config)
            .filter(([key, val]: any) => {
              if (!val || typeof val !== 'object') return false;

              // 👇 NEW: Exclude sub-tabs whose path starts with /access/
              const ipPath = val.ipAddress || '';
              // if (ipPath.startsWith('/access/')) return false;

              if (guestMode) return val.public;
              return val.public || val.stakeholders || val.team || val.admin;
            })
            .map(([key, val]: any) => {
              const label = val.customHeading || key;
              const path = val.ipAddress || `/${key}`;
              const order = val.order ?? 999;
              const loginUrl = val.loginUrl || key;

              return { label, value: key, path, order, loginUrl };
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
  }, [guestMode]);

  return (
    <div className="flex items-center gap-2">
      {tabs.map(tab => (
        <NavigationItem
          key={tab.value}
          tab={tab}
          isActive={
            location.pathname === tab.path ||
            (tab.path.includes('access') && location.pathname.startsWith(tab.path))
          }
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

function AccessSubNavigation({ role }: { role?: string | null }) {
  const location = useLocation();
  const [tabs, setTabs] = useState<NavigationTab[]>([]);
  const isAccessPage = location.pathname.startsWith('/access');

  useEffect(() => {
    const fetchAccessTabs = async () => {
      try {
        const docRef = doc(db, 'admin_feature_tabs', 'access_config_local');
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const config = docSnap.data();
          // console.log('Access tabs config loaded:', config);

          console.log('config', config)
          const updatedTabs = tabs.map(tab => {
            let customHeading = config[tab.value]?.customHeading || config[tab.value]?.order;
            // const customPath = config[tab.value]?.ipAddress || config[tab.value]?.order;
            const customPath = config[tab.value]?.ipAddress || tab.path;

            // Map admin settings to secondary header tabs
            if (tab.value === 'idoc') {
              // iDoc should use Documents custom heading
              customHeading = config['documents']?.customHeading || customHeading;
            } else if (tab.value === 'igraph') {
              // iGraph should use Graphs custom heading
              customHeading = config['graphs']?.customHeading || customHeading;
            } else if (tab.value === 'iask') {
              // iAsk should use AskAtul custom heading
              customHeading = config['askatul']?.customHeading || customHeading;
            } else if (tab.value === 'ilog') {
              // iLog should use Logs custom heading
              customHeading = config['logs']?.customHeading || customHeading;
            }

            const finalPath = customPath.startsWith('/') ? customPath : `/${customPath}`;

            let finalLabel = customHeading;
            if (!finalLabel && customPath !== tab.path) {
              finalLabel = tabs[customPath] || tab.label;
            }
            if (!finalLabel) {
              finalLabel = tab.label;
            }
            // console.log("tab.value", tab.value, "config[tab.value]", config[tab.value]);

            const configEntry = Object.values(config).find(
              (entry) => entry.ipAddress === tab.path
            );
            // console.log(`Access Tab ${tab.value}: Final label will be "${finalLabel}" (custom: "${customHeading}", path: "${customPath}", original: "${tab.label}")`);
            return {
              ...tab,
              label: finalLabel,
              path: finalPath,
              loginUrl: configEntry?.loginUrl || ''
            };
          });
          console.log('updatedTabs', updatedTabs)
          setTabs(updatedTabs);
          useNavigationTabsStore.getState().setAccessTabs(updatedTabs);
        } else {
          console.log('No Firebase config found for access tabs, using defaults');
          setTabs(tabs);
        }
      } catch (error) {
        console.error('Error fetching access tabs config:', error);
        setTabs(tabs);
      }
    };

    if (isAccessPage) {
      fetchAccessTabs();
    }
  }, [isAccessPage]);

  if (!isAccessPage) return null;

  return (
    <div className="flex justify-center items-center gap-2 px-4 py-2 border-b bg-background sticky top-[64px] z-40">
      {tabs.map(tab => (
        <NavigationItem
          key={tab.value}
          tab={tab}
          isActive={location.pathname === tab.path || location.pathname.startsWith(`${tab.path}/`)}
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


export default function SiteHeader({ guestMode = false }: { guestMode?: boolean }) {
  const { t } = useTranslation();
  const { role, plan, username, webuiTitle, webuiDescription } = useAuthStore();

const [showLogin, setShowLogin] = useState(false);
  return (
    <>
      <header className="border-b border-border bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 flex  w-full items-center justify-between p-4">
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
          <NavigationMenu guestMode={guestMode} role={role} />
          {/* {guestMode && (
            <span className="ml-2 px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-md">
              {t('login.guestMode', 'Guest Mode')}
            </span>
          )} */}
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
            {/* <Link to="/login" className="text-sm hover:underline">Login</Link> */}
            </>
          )}
        </div>
      </header>

      <AccessSubNavigation role={role} />
    </>
  );
}
