import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ChevronDownIcon } from 'lucide-react';

interface SubTab {
  title: string;
  path: string;
  loginUrl: string;
}

interface NavigationTab {
  label: string;
  value: string;
  path: string;
  subtabs: SubTab[];
  directPath?: string; // For single-row menu direct navigation
}

interface SingleRowMenuProps {
  tabs: NavigationTab[];
  role?: string | null;
  homeTabSettings: { title: string; path: string; url: string };
}

export default function SingleRowMenu({ tabs, homeTabSettings }: SingleRowMenuProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // Handle Home tab navigation
  const handleHomeNavigation = () => {
    if (homeTabSettings.url) {
      // Open external URL in current tab
      window.location.href = homeTabSettings.url;
    } else if (homeTabSettings.path) {
      // Navigate to internal path
      navigate(homeTabSettings.path);
    }
  };

  const handleTabNavigation = (tab: NavigationTab) => {
    // For single-row menu, prioritize directPath if available
    if (tab.directPath) {
      navigate(tab.directPath);
      return;
    }
    
    const validSubtabs = tab.subtabs.filter(subtab => subtab.title && subtab.path);
    
    if (validSubtabs.length > 0) {
      // Navigate to first subtab directly
      navigate(validSubtabs[0].path);
    } else {
      navigate(tab.path);
    }
  };

  const handleSubtabNavigation = (subtab: SubTab) => {
    navigate(subtab.path);
    setOpenDropdown(null); // Close dropdown after navigation
  };

  const isTabActive = (tab: NavigationTab) => {
    return tab.subtabs.some(subtab =>
      location.pathname === subtab.path ||
      location.pathname.startsWith(subtab.path + '/')
    );
  };

  const toggleDropdown = (tabValue: string) => {
    setOpenDropdown(openDropdown === tabValue ? null : tabValue);
  };

  return (
    <div className="flex items-center gap-2">
      {/* Home Tab */}
      <div
        onClick={handleHomeNavigation}
        className={cn(
          'cursor-pointer px-3 py-2 rounded-md text-sm font-medium transition-all',
          homeTabSettings.url || homeTabSettings.path
            ? 'text-muted-foreground hover:bg-accent'
            : 'text-muted-foreground cursor-not-allowed'
        )}
        title={homeTabSettings.url || homeTabSettings.path
          ? `Navigate to ${homeTabSettings.url || homeTabSettings.path}`
          : 'Configure Home tab in Admin Settings'}
      >
        {homeTabSettings.title || 'Home'}
      </div>

      {tabs.map(tab => {
        const validSubtabs = tab.subtabs.filter(subtab => subtab.title && subtab.path);
        const hasSubtabs = validSubtabs.length > 0;
        const isActive = isTabActive(tab);
        const isDropdownOpen = openDropdown === tab.value;

        return (
          <div key={tab.value} className="relative">
            {hasSubtabs ? (
              // Tab with dropdown
              <div className="relative">
                <button
                  onClick={() => toggleDropdown(tab.value)}
                  className={cn(
                    'flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium transition-all',
                    isActive
                      ? 'bg-emerald-400 text-white'
                      : 'text-muted-foreground hover:bg-accent'
                  )}
                >
                  {tab.label}
                  <ChevronDownIcon 
                    className={cn(
                      'h-4 w-4 transition-transform',
                      isDropdownOpen ? 'rotate-180' : ''
                    )} 
                  />
                </button>
                
                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                    <div className="py-1">
                      {validSubtabs.map((subtab, index) => {
                        const isSubtabActive = location.pathname === subtab.path || 
                                             location.pathname.startsWith(subtab.path + '/');
                        
                        return (
                          <button
                            key={index}
                            onClick={() => handleSubtabNavigation(subtab)}
                            className={cn(
                              'w-full text-left px-4 py-2 text-sm transition-colors',
                              isSubtabActive
                                ? 'bg-emerald-50 text-emerald-600 font-medium'
                                : 'text-gray-700 hover:bg-gray-50'
                            )}
                          >
                            {subtab.title}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // Tab without dropdown
              <div
                onClick={() => handleTabNavigation(tab)}
                className={cn(
                  'cursor-pointer px-3 py-2 rounded-md text-sm font-medium transition-all',
                  isActive
                    ? 'bg-emerald-400 text-white'
                    : 'text-muted-foreground hover:bg-accent'
                )}
              >
                {tab.label}
              </div>
            )}
          </div>
        );
      })}
      
      {/* Click outside to close dropdown */}
      {openDropdown && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setOpenDropdown(null)}
        />
      )}
    </div>
  );
}
