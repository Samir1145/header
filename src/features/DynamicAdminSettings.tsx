import React, { useState, useEffect, useCallback } from "react";
import { getNavigationTabs, saveNavigationTabs } from '@/api/sqliteApi';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/state';

type TabAccess = {
  public: boolean;
  stakeholders: boolean;
  team: boolean;
  admin: boolean;
  customHeading: string;
  ipAddress: string;
  filePath: string; 
};

type TabDef = { key: string; label: string; path: string };

const AVAILABLE_PATHS = [
  '/retrieval',
  '/map', 
  '/map1',
  '/map2',
  '/map3',
  '/map4',
  '/map5',
  '/appeals',
  '/agents',
  '/access',
  '/login',
  '/graphs',
  '/forms',
  '/documents',
  '/wiki',
  '/logs',
  '/profile',
  '/iframe',
  '/iframe2',
  '/iframe3',
  '/iframe4',
  '/iframe5',
  '/iframe6',
  '/iframe7',
  '/iframe8',
  '/iframe9',
  '/iframe10',
  '/iframe11',
  '/iframe12',
  '/iframe13',
  '/iframe14',
  '/access/idoc',
  '/access/iask',
  '/access/igraph',
  '/access/ilog'
];

const PRE_LOGIN_TABS: TabDef[] = [
  { key: "askatul", label: "1. AskAtul", path: '/retrieval' },
  { key: "askip", label: "2. AskIP", path: '/map' },
  { key: "assets", label: "3. Assets", path: '/appeals' },
  { key: "forms", label: "4. Forms", path: '/forms' },
  { key: "login", label: "6. Login", path: '/login' },
];

const ALL_TABS: TabDef[] = [
  ...PRE_LOGIN_TABS,
  { key: "graphs", label: "7. Graphs", path: '/graphs' },
  { key: "agents", label: "8. Agents", path: '/agents' },
  { key: "documents", label: "9. Documents", path: '/documents' },
  { key: "wiki", label: "10. Wiki", path: '/wiki' },
  { key: "logs", label: "11. Logs", path: '/logs' },
  { key: "profile", label: "12. Profile", path: '/profile' },
];

const DynamicAdminSettings: React.FC = () => {
  const [tabState, setTabState] = useState<Record<string, TabAccess>>({});
  const [isSaving, setIsSaving] = useState(false);
  const { plan, role } = useAuthStore();
  
  const isLoggedIn = plan === 'pro' || role === 'admin';
  const currentTabs = isLoggedIn ? ALL_TABS : PRE_LOGIN_TABS;

  const initialState: Record<string, TabAccess> = Object.fromEntries(
    currentTabs.map((tab) => [
      tab.key,
      {
        public: false,
        stakeholders: false,
        team: false,
        admin: false,
        customHeading: "",
        ipAddress: "",
        filePath: tab.path, 
      },
    ])
  );

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const savedData = await getNavigationTabs();
        if (savedData && Object.keys(savedData).length > 0) {
          console.log('Loaded data from SQLite:', savedData);
          
          const mergedState: Record<string, TabAccess> = currentTabs.reduce((acc, tab) => {
            acc[tab.key] = {
              public: savedData[tab.key]?.public || false,
              stakeholders: savedData[tab.key]?.stakeholders || false,
              team: savedData[tab.key]?.team || false,
              admin: savedData[tab.key]?.admin || false,
              customHeading: savedData[tab.key]?.customHeading || '',
              ipAddress: savedData[tab.key]?.ipAddress || '',
              filePath: savedData[tab.key]?.filePath || tab.path,
            };
            return acc;
          }, {} as Record<string, TabAccess>);
          setTabState(mergedState);
        } else {
          console.log('No existing data found, using defaults');
          setTabState(initialState);
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
        toast.error('Failed to load settings from database.');
        setTabState(initialState);
      }
    };

    fetchSettings();
  }, [isLoggedIn]); 

  const handleCheck =
    (tabKey: string, field: keyof Omit<TabAccess, "customHeading" | "ipAddress" | "filePath">) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setTabState((prev) => ({
        ...prev,
        [tabKey]: { ...prev[tabKey], [field]: e.target.checked },
      }));
    };

  const handleText =
    (tabKey: string, field: "customHeading" | "ipAddress") =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setTabState((prev) => ({
        ...prev,
        [tabKey]: { ...prev[tabKey], [field]: e.target.value },
      }));
    };

  const handlePathChange = useCallback((tabKey: string, newPath: string) => {
    setTabState((prev) => ({
      ...prev,
      [tabKey]: { ...prev[tabKey], filePath: newPath },
    }));
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      console.log('Saving tabState to SQLite:', tabState);
      await saveNavigationTabs(tabState as any);
      console.log('Successfully saved to SQLite');
      toast.success('Access settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestPublic = () => {
    const testState = { ...tabState };
    Object.keys(testState).forEach(key => {
      testState[key].public = true;
    });
    setTabState(testState);
    toast.info(`All ${currentTabs.length} tabs set to public for testing`);
  };

  console.log('AVAILABLE_PATHS:', AVAILABLE_PATHS);
  console.log('Current tabState:', tabState);
  console.log('Current tabs:', currentTabs);
  console.log('Tab state:', tabState);
  console.log('Initial state:', initialState);
  
  return (
    <div className="w-full h-full flex justify-center items-center p-4">
      <div className="card flex flex-col h-full w-full max-w-6xl min-h-0" style={{
        borderRadius: 0, overflow: "hidden", background: "#fff", maxWidth: "90vw", margin: "2rem auto",
        boxShadow: "0 2px 6px #e5e7eb"
      }}>
        <div className="card-header py-2 px-6">
          <h1 className="text-2xl font-bold" style={{ color: "#dc2626" }}>
            Dynamic Admin Tab Settings {isLoggedIn ? '(Logged In)' : '(Guest Mode)'}
          </h1>
          <p className="text-sm" style={{ color: "#6b7280" }}>
            {isLoggedIn 
              ? `Showing all ${ALL_TABS.length} tabs (logged in as ${role || plan})`
              : `Showing first ${PRE_LOGIN_TABS.length} tabs (guest mode)`
            }
          </p>
          <div className="mt-2">
            <button 
              onClick={handleTestPublic}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 mr-2"
            >
              Set All Public (Test)
            </button>
            <a href="/" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 mr-2">
              Go to Home
            </a>
            <select 
              style={{ border: "1px solid #d1d5db", borderRadius: ".375rem", padding: ".4rem" }}
              onChange={(e) => console.log('Test dropdown changed:', e.target.value)}
            >
              <option value="">Test Dropdown</option>
              <option value="test1">Test Option 1</option>
              <option value="test2">Test Option 2</option>
            </select>
          </div>
        </div>
        <div className="card-content flex-1 flex flex-col min-h-0 overflow-visible">
          <div className="overflow-auto border rounded-lg shadow-sm" style={{ border: "1px solid #e5e7eb", borderRadius: ".5rem", boxShadow: "0 1px 3px #d1d5db" }}>
            <table className="min-w-full text-sm text-left" style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead style={{ background: "#f1f5f9", color: "#374151" }}>
                <tr>
                  <th className="px-4 py-3">Tabs</th>
                  <th className="px-4 py-3 text-center">Public</th>
                  <th className="px-4 py-3 text-center">Stakeholders</th>
                  <th className="px-4 py-3 text-center">Team-Mbrs</th>
                  <th className="px-4 py-3 text-center">IP-Admin</th>
                </tr>
              </thead>
              <tbody>
                {currentTabs.map((tab) => (
                  <tr key={tab.key} style={{ borderTop: "1px solid #e5e7eb" }}>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      <div>{tab.label}</div>
                      <div style={{ display: "flex", gap: "0.5rem", flexDirection: "column", marginTop: "0.5rem" }}>
                        <input
                          type="text"
                          className="heading"
                          placeholder={`Custom heading for ${tab.label.replace(/^\d+\.\s*/, "")}`}
                          value={tabState[tab.key]?.customHeading || ''}
                          onChange={handleText(tab.key, "customHeading")}
                          style={{
                            border: "1px solid #d1d5db", borderRadius: ".375rem",
                            padding: ".4rem", fontSize: ".875rem", width: "15rem"
                          }}
                        />
                        
                        <div style={{ position: "relative", zIndex: 10 }}>
                          <label style={{ fontSize: "0.75rem", color: "#6b7280", marginBottom: "0.25rem", display: "block" }}>
                            Navigation Path:
                          </label>
                          <select
                            value={tabState[tab.key]?.filePath || tab.path}
                            onChange={(e) => handlePathChange(tab.key, e.target.value)}
                            style={{
                              border: "1px solid #d1d5db", borderRadius: ".375rem",
                              padding: ".4rem", fontSize: ".875rem", width: "15rem",
                              backgroundColor: "white", cursor: "pointer",
                              minHeight: "2.5rem",
                              appearance: "auto",
                            }}
                          >
                            <option value="">Select a path...</option>
                            {AVAILABLE_PATHS.map((path) => (
                              <option key={path} value={path}>
                                {path}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div style={{ position: "relative", zIndex: 10 }}>
                          <label style={{ fontSize: "0.75rem", color: "#6b7280", marginBottom: "0.25rem", display: "block" }}>
                            Navigation Path:
                          </label>
                          <select
                            value={tabState[tab.key]?.ipAddress || `/query/${tab.key}`}
                            onChange={(e) => handleText(tab.key, "ipAddress")({ target: { value: e.target.value } } as any)}
                            style={{
                              border: "1px solid #d1d5db", borderRadius: ".375rem",
                              padding: ".4rem", fontSize: ".875rem", width: "15rem",
                              backgroundColor: "white", cursor: "pointer",
                              minHeight: "2.5rem",
                              appearance: "auto",
                              WebkitAppearance: "auto",
                              MozAppearance: "auto"
                            }}
                          >
                            <option value="">Select a path...</option>
                            {AVAILABLE_PATHS.map((path) => (
                              <option key={path} value={path}>
                                {path}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <input type="checkbox" checked={tabState[tab.key]?.public || false} onChange={handleCheck(tab.key, "public")} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <input type="checkbox" checked={tabState[tab.key]?.stakeholders || false} onChange={handleCheck(tab.key, "stakeholders")} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <input type="checkbox" checked={tabState[tab.key]?.team || false} onChange={handleCheck(tab.key, "team")} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <input type="checkbox" checked={tabState[tab.key]?.admin || false} onChange={handleCheck(tab.key, "admin")} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-6 flex justify-end" style={{ marginTop: "1.5rem", display: "flex", justifyContent: "flex-end" }}>
            <button
              type="button"
              disabled={isSaving}
              onClick={handleSave}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              style={{
                padding: "0.5rem 1.5rem", background: "#2563eb", color: "white",
                borderRadius: ".375rem", fontSize: "1rem",
                cursor: isSaving ? "not-allowed" : "pointer", opacity: isSaving ? .6 : 1
              }}
            >{isSaving ? "Saving..." : "Save Access Settings"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DynamicAdminSettings; 