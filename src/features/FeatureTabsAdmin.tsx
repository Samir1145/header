import React, { useState, useEffect } from "react";
import { toast } from 'sonner';
import { useSettingsStore } from '@/stores/settings';
import { getNavigationTabs, saveNavigationTabs, invalidateTabsCache } from '@/api/sqliteApi';

type SubTab = {
  title: string;
  path: string;
  loginUrl: string;
};

type TabAccess = {
  public: boolean;
  admin: boolean;
  customHeading: string;
  order: number;
  subtabs: SubTab[];
  path?: string; // For single-row menu direct navigation
};

type ResourceType = {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
};

type SiteSettings = {
  siteTitle: string;
  siteHeader: string;
};

type TabDef = { key: string };
const TABS: TabDef[] = [
  { key: "assets" }, { key: "forms" },
  { key: "graphs" }, { key: "agents" }, { key: "appeals" }
];


const BASE_URL_OPTIONS = [
  { value: "", label: "Select a path..." },
  { value: "/retrieval", label: "/retrieval" },
  { value: "/retrieval2", label: "/retrieval2" },
  { value: "/retrieval3", label: "/retrieval3" },
  { value: "/retrieval4", label: "/retrieval4" },
  { value: "/retrieval5", label: "/retrieval5" },
  { value: "/resources", label: "/resources" },
  { value: "/map", label: "/map" },
  { value: "/map1", label: "/map1" },
  { value: "/map2", label: "/map2" },
  { value: "/map3", label: "/map3" },
  { value: "/map4", label: "/map4" },
  { value: "/map5", label: "/map5" },
  { value: "/appeals", label: "/appeals" },
  { value: "/agents", label: "/agents" },
  { value: "/forms", label: "/forms" },
  { value: "/forms1", label: "/forms1" },
  { value: "/forms2", label: "/forms2" },
  { value: "/graphs", label: "/graphs" },
  { value: "/documents", label: "/documents" },
  { value: "/iframe", label: "/iframe" },
  { value: "/iframe2", label: "/iframe2" },
  { value: "/iframe3", label: "/iframe3" },
  { value: "/iframe4", label: "/iframe4" },
  { value: "/iframe5", label: "/iframe5" },
  { value: "/iframe6", label: "/iframe6" },
  { value: "/iframe7", label: "/iframe7" },
  { value: "/iframe8", label: "/iframe8" },
  { value: "/iframe9", label: "/iframe9" },
  { value: "/iframe10", label: "/iframe10" },
  { value: "/iframe11", label: "/iframe11" },
  { value: "/iframe12", label: "/iframe12" },
  { value: "/iframe13", label: "/iframe13" },
  { value: "/iframe14", label: "/iframe14" },
  { value: "/access/idoc", label: "/access/idoc" },
  { value: "/access/iask", label: "/access/iask" },
  { value: "/access/igraph", label: "/access/igraph" },
  { value: "/access/ilog", label: "/access/ilog" },
  { value: "/wren-chat", label: "/wren-chat" },
  { value: "/neon-search", label: "/neon-search" }
];

// Function to generate URL options with dynamic resource types
const getUrlOptions = (resourceTypes: ResourceType[]) => {
  const resourceOptions = resourceTypes
    .filter(rt => rt.isActive)
    .map(rt => ({
      value: `/resources/${rt.name.toLowerCase().replace(/\s+/g, '-')}`,
      label: `/resources/${rt.name.toLowerCase().replace(/\s+/g, '-')}`
    }));

  return [...BASE_URL_OPTIONS, ...resourceOptions];
};

const initialState: Record<string, TabAccess> = Object.fromEntries(
  TABS.map((tab, index) => [
    tab.key,
    {
      public: false,
      admin: false,
      customHeading: "",
      order: index,
      path: "",
      subtabs: Array.from({ length: 5 }).map(() => ({
        title: "",
        path: "",
        loginUrl: ""
      }))
    }
  ])
);

const AdminTabSettings: React.FC = () => {
  const [tabState, setTabState] = useState(initialState);
  const [isSaving, setIsSaving] = useState(false);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>({
    siteTitle: "",
    siteHeader: "",
  });
  const [resourceTypes, setResourceTypes] = useState<ResourceType[]>([]);
  const [newResourceType, setNewResourceType] = useState({ name: '', description: '' });
  const { menuStyle, setMenuStyle } = useSettingsStore();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        // Invalidate cache to ensure fresh data on admin page
        invalidateTabsCache();
        const savedData = await getNavigationTabs();

        if (savedData && Object.keys(savedData).length > 0) {
          // Handle both predefined tabs and dynamically added menus
          const mergedState: Record<string, TabAccess> = {};

          // First, add predefined tabs
          TABS.forEach((tab, index) => {
            const savedTab = (savedData as any)[tab.key] || {};
            mergedState[tab.key] = {
              public: savedTab.public || false,
              admin: savedTab.admin || false,
              customHeading: savedTab.customHeading || "",
              order: savedTab.order !== undefined ? savedTab.order : index,
              path: savedTab.path || "",
              subtabs: savedTab.subtabs || [
                { title: "", path: "", loginUrl: "" },
                { title: "", path: "", loginUrl: "" },
                { title: "", path: "", loginUrl: "" },
                { title: "", path: "", loginUrl: "" },
                { title: "", path: "", loginUrl: "" }
              ]
            };
          });

          // Then, add any dynamically added menus
          Object.keys(savedData).forEach(key => {
            if (!TABS.find(tab => tab.key === key) && key !== 'siteSettings' && key !== 'resourceTypes') {
              const savedTab = (savedData as any)[key];
              if (savedTab && typeof savedTab === 'object' && 'customHeading' in savedTab) {
                mergedState[key] = {
                  public: savedTab.public || false,
                  admin: savedTab.admin || false,
                  customHeading: savedTab.customHeading || "",
                  order: savedTab.order !== undefined ? savedTab.order : 999,
                  path: savedTab.path || "",
                  subtabs: savedTab.subtabs || [
                    { title: "", path: "", loginUrl: "" },
                    { title: "", path: "", loginUrl: "" },
                    { title: "", path: "", loginUrl: "" },
                    { title: "", path: "", loginUrl: "" },
                    { title: "", path: "", loginUrl: "" }
                  ]
                };
              }
            }
          });
          setTabState(mergedState);

          if ((savedData as any).siteSettings) {
            setSiteSettings({
              siteTitle: (savedData as any).siteSettings.siteTitle || "",
              siteHeader: (savedData as any).siteSettings.siteHeader || "",
            });
          }

          if ((savedData as any).resourceTypes) {
            setResourceTypes((savedData as any).resourceTypes);
          }
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
        toast.error('Failed to load settings from database.');
      }
    };

    fetchSettings();
  }, []);

  const handleCheck =
    (tabKey: string, field: "public" | "admin") =>
      (e: React.ChangeEvent<HTMLInputElement>) => {
        setTabState((prev) => ({
          ...prev,
          [tabKey]: { ...prev[tabKey], [field]: e.target.checked },
        }));
      };

  const handleHeading =
    (tabKey: string) =>
      (e: React.ChangeEvent<HTMLInputElement>) => {
        setTabState((prev) => ({
          ...prev,
          [tabKey]: { ...prev[tabKey], customHeading: e.target.value },
        }));
      };

  const handlePath =
    (tabKey: string) =>
      (e: React.ChangeEvent<HTMLInputElement>) => {
        setTabState((prev) => ({
          ...prev,
          [tabKey]: { ...prev[tabKey], path: e.target.value },
        }));
      };

  const addNewMenu = () => {
    const newKey = `menu_${Date.now()}`;
    const newOrder = Math.max(...Object.values(tabState).map(tab => tab.order)) + 1;
    setTabState((prev) => ({
      ...prev,
      [newKey]: {
        public: true, // Make new menus visible by default
        admin: true,   // Make new menus visible by default
        customHeading: "",
        order: newOrder,
        path: "",
        subtabs: Array.from({ length: 5 }).map(() => ({
          title: "",
          path: "",
          loginUrl: ""
        }))
      }
    }));
  };

  const removeMenu = (tabKey: string) => {
    setTabState((prev) => {
      const newState = { ...prev };
      delete newState[tabKey];
      return newState;
    });
  };

  const handleSubtabChange =
    (tabKey: string, index: number, field: keyof SubTab) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setTabState((prev) => {
          const updated = [...prev[tabKey].subtabs];
          updated[index] = { ...updated[index], [field]: e.target.value };
          return { ...prev, [tabKey]: { ...prev[tabKey], subtabs: updated } };
        });
      };

  // Resource Type Management Functions
  const addResourceType = () => {
    if (!newResourceType.name.trim()) return;

    const resourceType: ResourceType = {
      id: `resource_${Date.now()}`,
      name: newResourceType.name.trim(),
      description: newResourceType.description.trim(),
      isActive: true
    };

    setResourceTypes(prev => [...prev, resourceType]);
    setNewResourceType({ name: '', description: '' });
  };

  const removeResourceType = (id: string) => {
    setResourceTypes(prev => prev.filter(rt => rt.id !== id));
  };

  const toggleResourceType = (id: string) => {
    setResourceTypes(prev =>
      prev.map(rt =>
        rt.id === id ? { ...rt, isActive: !rt.isActive } : rt
      )
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const normalizedState = Object.fromEntries(
        Object.entries(tabState).map(([key, tab]) => {
          const paddedSubtabs = Array.from({ length: 5 }).map((_, i) => ({
            title: tab.subtabs[i]?.title || "",
            path: tab.subtabs[i]?.path || "",
            loginUrl: tab.subtabs[i]?.loginUrl || "",
          }));
          return [key, {
            ...tab,
            subtabs: paddedSubtabs,
            path: tab.path || ""
          }];
        })
      );

      await saveNavigationTabs({
        ...normalizedState,
        siteSettings,
        resourceTypes,
      } as any);

      toast.success("Access settings saved successfully!");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings.");
    } finally {
      setIsSaving(false);
    }
  };


  return (
    <div className="w-full h-full flex justify-center items-center p-4">
      <div className="card flex flex-col h-full w-full max-w-5xl min-h-0" style={{ borderRadius: 0, overflow: "hidden", background: "#fff", maxWidth: "80vw", margin: "2rem auto", boxShadow: "0 2px 6px #e5e7eb" }}>
        <div className="card-header py-2 px-6">
          <h1 className="text-2xl font-bold text-red-600">Admin Tab Settings</h1>
          <p className="text-sm text-gray-600">Define which tabs are visible to Public or Admin users and map custom labels/IPs.</p>
        </div>
        <div className="card-content flex-1 flex flex-col min-h-0 overflow-auto">
          <div className="overflow-auto border rounded-lg shadow-sm">
            <div className="mb-6 grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={siteSettings.siteTitle}
                  onChange={(e) => setSiteSettings({ ...siteSettings, siteTitle: e.target.value })}
                  className="w-full border border-gray-300 rounded-md p-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Info</label>
                <input
                  type="text"
                  value={siteSettings.siteHeader}
                  onChange={(e) => setSiteSettings({ ...siteSettings, siteHeader: e.target.value })}
                  className="w-full border border-gray-300 rounded-md p-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Menu Style</label>
                <select
                  value={menuStyle}
                  onChange={(e) => setMenuStyle(e.target.value as 'two-row' | 'single-row')}
                  className="w-full border border-gray-300 rounded-md p-2 text-sm"
                >
                  <option value="two-row">Two Row Menu (Current)</option>
                  <option value="single-row">Single Row Menu</option>
                </select>
              </div>
            </div>

            {/* Resource Type Management Section */}
            <div className="mb-6 border rounded-lg p-4 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">📚 Dynamic Resource Types</h3>
              <p className="text-sm text-gray-600 mb-4">
                Manage resource types that will appear as dynamic paths in the menu (e.g., /resources/documentation, /resources/tutorials)
              </p>

              {/* Add New Resource Type */}
              <div className="mb-4 p-4 border rounded-lg bg-white">
                <h4 className="text-md font-medium text-gray-700 mb-3">Add New Resource Type</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Resource Type Name</label>
                    <input
                      type="text"
                      placeholder="e.g., Documentation, Tutorials"
                      value={newResourceType.name}
                      onChange={(e) => setNewResourceType(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md p-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                    <input
                      type="text"
                      placeholder="Brief description"
                      value={newResourceType.description}
                      onChange={(e) => setNewResourceType(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md p-2 text-sm"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={addResourceType}
                      disabled={!newResourceType.name.trim()}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 text-sm"
                    >
                      + Add Resource Type
                    </button>
                  </div>
                </div>
              </div>

              {/* Existing Resource Types */}
              {resourceTypes.length > 0 && (
                <div className="border rounded-lg bg-white">
                  <h4 className="text-md font-medium text-gray-700 p-4 border-b">Existing Resource Types</h4>
                  <div className="divide-y">
                    {resourceTypes.map((resourceType) => (
                      <div key={resourceType.id} className="p-4 flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${resourceType.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-600'
                              }`}>
                              {resourceType.isActive ? 'Active' : 'Inactive'}
                            </span>
                            <span className="font-medium text-gray-800">{resourceType.name}</span>
                            <span className="text-sm text-gray-500">
                              → /resources/{resourceType.name.toLowerCase().replace(/\s+/g, '-')}
                            </span>
                          </div>
                          {resourceType.description && (
                            <p className="text-sm text-gray-600 mt-1">{resourceType.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleResourceType(resourceType.id)}
                            className={`px-3 py-1 rounded text-xs ${resourceType.isActive
                              ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                              : 'bg-green-100 text-green-800 hover:bg-green-200'
                              }`}
                          >
                            {resourceType.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            onClick={() => removeResourceType(resourceType.id)}
                            className="px-3 py-1 bg-red-100 text-red-800 rounded text-xs hover:bg-red-200"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <table className="min-w-full text-sm text-left">
              <thead className="bg-slate-100 text-gray-700">
                <tr>
                  <th className="px-4 py-3">Index</th>
                  <th className="px-4 py-3">Title</th>
                  {menuStyle === 'single-row' && <th className="px-4 py-3">Path</th>}
                  {menuStyle === 'two-row' && <th className="px-4 py-3">Subtabs</th>}
                  <th className="px-4 py-3 text-center">Public</th>
                  <th className="px-4 py-3 text-center">Admin</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(tabState)
                  .sort(([, a], [, b]) => a.order - b.order)
                  .map(([tabKey, config], index) => {
                    return (
                      <tr key={tabKey} className="border-t border-slate-200">
                        <td className="px-4 py-3 text-center font-medium text-gray-900">
                          {index + 1}
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={config.customHeading}
                            onChange={handleHeading(tabKey)}
                            className="w-full border border-gray-300 rounded-md p-2 text-sm"
                          />
                        </td>
                        {menuStyle === 'single-row' && (
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              placeholder="Enter URL path (e.g., /aboutus, /forms, https://example.com)"
                              value={config.path || ""}
                              onChange={handlePath(tabKey)}
                              className="w-full border border-gray-300 rounded-md p-2 text-sm"
                            />
                          </td>
                        )}
                        {menuStyle === 'two-row' && (
                          <td className="px-4 py-3">
                            <div className="flex flex-col gap-2">
                              {config.subtabs.map((sub, i) => (
                                <div key={i} className="grid grid-cols-3 gap-2">
                                  <input
                                    type="text"
                                    placeholder="Subtitle"
                                    value={sub.title}
                                    onChange={handleSubtabChange(tabKey, i, "title")}
                                    className="border border-gray-300 rounded-md p-2 text-sm"
                                  />
                                  <select
                                    value={sub.path}
                                    onChange={handleSubtabChange(tabKey, i, "path")}
                                    className="border border-gray-300 rounded-md p-2 text-sm"
                                  >
                                    {getUrlOptions(resourceTypes).map(option => (
                                      <option key={option.value} value={option.value}>{option.label}</option>
                                    ))}
                                  </select>
                                  <input
                                    type="text"
                                    placeholder="Login URL"
                                    value={sub.loginUrl}
                                    onChange={handleSubtabChange(tabKey, i, "loginUrl")}
                                    className="border border-gray-300 rounded-md p-2 text-sm"
                                  />
                                </div>
                              ))}
                            </div>
                          </td>
                        )}
                        <td className="px-4 py-3 text-center">
                          <input type="checkbox" checked={config.public} onChange={handleCheck(tabKey, "public")} />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <input type="checkbox" checked={config.admin} onChange={handleCheck(tabKey, "admin")} />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => removeMenu(tabKey)}
                            className="px-2 py-1 text-red-600 hover:bg-red-50 rounded text-sm"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex justify-between">
            <button
              type="button"
              onClick={addNewMenu}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
            >
              + Add New Menu
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={handleSave}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              {isSaving ? "Saving..." : "Save Access Settings"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminTabSettings;
