import { create } from 'zustand';

interface NavigationTab {
  subtabs: any;
  label: string;
  value: string;
  path: string;
  order?: number;
  loginUrl?: string; 
}

interface NavigationTabsState {
  tabs: NavigationTab[];
  accessTabs: NavigationTab[];
  setTabs: (tabs: NavigationTab[]) => void;
  setAccessTabs: (tabs: NavigationTab[]) => void;
}

export const useNavigationTabsStore = create<NavigationTabsState>((set) => ({
  tabs: [],
  accessTabs: [],
  setTabs: (tabs) => set({ tabs }),
  setAccessTabs: (accessTabs) => set({ accessTabs }),
}));
