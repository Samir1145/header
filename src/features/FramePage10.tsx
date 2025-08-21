import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useNavigationTabsStore } from '@/stores/navigationTabs';

export default function FramePage10() {
  const allTabs = useNavigationTabsStore(state => state.tabs);
  const location = useLocation();

  // Normalize pathname (e.g., '/agents' => 'agents')
  const currentPath = location.pathname.replace(/^\/+/, '');

  // Memoize matched tab from store
  const matchedTab = useMemo(() => {
    return allTabs.find(tab => tab.path.replace(/^\/+/, '') === currentPath) || null;
  }, [allTabs, currentPath]);

  const loginUrl = matchedTab?.loginUrl;

  return (
    <div className="w-full h-full">
      {loginUrl ? (
        <iframe
          src={loginUrl}
          className="w-full h-screen border-none"
          allowFullScreen
          title="Full Page App"
        ></iframe>
      ) : (
        <div className="flex items-center justify-center h-full">
          <p className="text-lg text-muted-foreground">No iframe available</p>
        </div>
      )}
    </div>
  );
}