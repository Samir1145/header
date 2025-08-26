import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { useNavigationTabsStore } from "@/stores/navigationTabs";

export function useLoginUrl() {
  const allTabs = useNavigationTabsStore(state => state.tabs);
  const location = useLocation();
  const currentPath = location.pathname.replace(/^\/+/, ""); // normalize

  const loginUrl = useMemo(() => {
    if (allTabs.length === 0) return null;

    // 🔍 1. Check subtabs first
    for (const tab of allTabs) {
      if (tab.subtabs && tab.subtabs.length > 0) {
        const matchedSubtab = tab.subtabs.find(
          (s) => s.path.replace(/^\/+/, "") === currentPath
        );
        if (matchedSubtab) {
          return matchedSubtab.loginUrl || null;
        }
      }
    }

    // 🔍 2. Fallback: check top-level tab
    const matchedTab = allTabs.find(
      (tab) => tab.path.replace(/^\/+/, "") === currentPath
    );

    if (matchedTab) {
      return matchedTab.loginUrl || null;
    }

    // 🔍 3. No match at all
    return null;
  }, [allTabs, currentPath]);

  console.log("Final loginUrl:", loginUrl);
  return loginUrl;
}
