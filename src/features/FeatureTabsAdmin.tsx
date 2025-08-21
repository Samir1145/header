import React, { useState, useEffect } from "react";
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { toast } from 'sonner';

type TabAccess = {
  public: boolean;
  admin: boolean;
  customHeading: string;
  subtitle1: string;
  subtitle2: string;
  subtitle3: string;
  url1: string;
  url2: string;
  url3: string;
  ipAddress1: string;
  ipAddress2: string;
  ipAddress3: string;
  order: number;
};

type TabDef = { key: string };
const TABS: TabDef[] = [
  { key: "assets" }, { key: "forms" }, { key: "aboutus" },
  { key: "graphs" }, { key: "agents" }, { key: "appeals" }
];

const URL_OPTIONS = [
  { value: "", label: "Select a path..." },
  { value: "/aboutus", label: "/aboutus" },
  { value: "/retrieval", label: "/retrieval" },
  { value: "/retrieval2", label: "/retrieval2" },
  { value: "/retrieval3", label: "/retrieval3" },
  { value: "/retrieval4", label: "/retrieval4" },
  { value: "/retrieval5", label: "/retrieval5" },

  { value: "/map", label: "/map" },
  { value: "/appeals", label: "/appeals" },
  { value: "/agents", label: "/agents" },
  { value: "/forms", label: "/forms" },
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
  { value: "/access/idoc", label: "/access/idoc" },
  { value: "/access/iask", label: "/access/iask" },
  { value: "/access/igraph", label: "/access/igraph" },
  { value: "/access/ilog", label: "/access/ilog" }
];

const initialState: Record<string, TabAccess> = Object.fromEntries(
  TABS.map((tab, index) => [
    tab.key,
    {
      public: false,
      admin: false,
      customHeading: "",
      subtitle1: "",
      subtitle2: "",
      subtitle3: "",
      url1: "",
      url2: "",
      url3: "",
      ipAddress1: "",
      ipAddress2: "",
      ipAddress3: "",
      order: index,
    },
  ])
);

const AdminTabSettings: React.FC = () => {
  const [tabState, setTabState] = useState(initialState);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, 'admin_feature_tabs', 'access_config_local');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const savedData = docSnap.data();
          const mergedState: Record<string, TabAccess> = TABS.reduce((acc, tab, index) => {
            acc[tab.key] = {
              public: savedData[tab.key]?.public || false,
              admin: savedData[tab.key]?.admin || false,
              customHeading: savedData[tab.key]?.customHeading || '',
              subtitle1: savedData[tab.key]?.subtitle1 || '',
              subtitle2: savedData[tab.key]?.subtitle2 || '',
              subtitle3: savedData[tab.key]?.subtitle3 || '',
              url1: savedData[tab.key]?.url1 || '',
              url2: savedData[tab.key]?.url2 || '',
              url3: savedData[tab.key]?.url3 || '',
              ipAddress1: savedData[tab.key]?.ipAddress || '',
              ipAddress2: savedData[tab.key]?.ipAddress || '',
              ipAddress3: savedData[tab.key]?.ipAddress || '',
              order: savedData[tab.key]?.order !== undefined ? savedData[tab.key].order : index
            };
            return acc;
          }, {} as Record<string, TabAccess>);
          setTabState(mergedState);
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
        toast.error('Failed to load settings from database.');
      }
    };

    fetchSettings();
  }, []);

  const handleCheck =
    (tabKey: string, field: keyof Omit<TabAccess, "customHeading" | "subtitle1" | "subtitle2" | "subtitle3" | "url1" | "url2" | "url3" | "ipAddress1" | "ipAddress2" |"ipAddress3"   >) =>
      (e: React.ChangeEvent<HTMLInputElement>) => {
        setTabState((prev) => ({
          ...prev,
          [tabKey]: { ...prev[tabKey], [field]: e.target.checked },
        }));
      };

  const handleText =
    (tabKey: string, field: "customHeading" | "subtitle1" | "subtitle2" | "subtitle3" | "ipAddress1" | "ipAddress2" | "ipAddress3") =>
      (e: React.ChangeEvent<HTMLInputElement>) => {
        setTabState((prev) => ({
          ...prev,
          [tabKey]: { ...prev[tabKey], [field]: e.target.value },
        }));
      };

  const handleSelect =
    (tabKey: string, field: "url1" | "url2" | "url3") =>
      (e: React.ChangeEvent<HTMLSelectElement>) => {
        setTabState((prev) => ({
          ...prev,
          [tabKey]: { ...prev[tabKey], [field]: e.target.value },
        }));
      };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'admin_feature_tabs', 'access_config_local'), tabState);
      toast.success('Access settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full h-full flex justify-center items-center p-4">
      <div className="card flex flex-col h-full w-full max-w-5xl min-h-0" style={{ borderRadius: 0, overflow: "hidden", background: "#fff", maxWidth: "80vw", margin: "2rem auto", boxShadow: "0 2px 6px #e5e7eb" }}>
        <div className="card-header py-2 px-6">
          <h1 className="text-2xl font-bold" style={{ color: "#dc2626" }}>Admin Tab Settings</h1>
          <p className="text-sm" style={{ color: "#6b7280" }}>
            Define which tabs are visible to Public or Admin users and map custom labels/IPs.
          </p>
        </div>
        <div className="card-content flex-1 flex flex-col min-h-0 overflow-auto">
          <div className="overflow-auto border rounded-lg shadow-sm">
            <table className="min-w-full text-sm text-left">
              <thead style={{ background: "#f1f5f9", color: "#374151" }}>
                <tr>
                  <th className="px-4 py-3">Index</th>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Sub Title</th>
                  <th className="px-4 py-3">URL</th>
                  <th className="px-4 py-3">IP Address</th>
                  <th className="px-4 py-3 text-center">Public</th>
                  <th className="px-4 py-3 text-center">IP-Admin</th>
                </tr>
              </thead>
              <tbody>
                {TABS.map((tab, index) => {
                  const config = tabState[tab.key];
                  
                  return (
                    <tr key={tab.key} style={{ borderTop: "1px solid #e5e7eb" }}>
                      <td className="px-4 py-3 text-center font-medium text-gray-900">
                        {index + 1}
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          className="heading"
                          value={config.customHeading}
                          onChange={handleText(tab.key, "customHeading")}
                          style={{
                            border: "1px solid #d1d5db", borderRadius: ".375rem",
                            padding: ".4rem", fontSize: ".875rem", width: "100%"
                          }}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                          <input
                            type="text"
                            placeholder="Subtitle 1"
                            value={config.subtitle1}
                            onChange={handleText(tab.key, "subtitle1")}
                            style={{
                              border: "1px solid #d1d5db", borderRadius: ".375rem",
                              padding: ".4rem", fontSize: ".875rem", width: "100%"
                            }}
                          />
                          <input
                            type="text"
                            placeholder="Subtitle 2"
                            value={config.subtitle2}
                            onChange={handleText(tab.key, "subtitle2")}
                            style={{
                              border: "1px solid #d1d5db", borderRadius: ".375rem",
                              padding: ".4rem", fontSize: ".875rem", width: "100%"
                            }}
                          />
                          <input
                            type="text"
                            placeholder="Subtitle 3"
                            value={config.subtitle3}
                            onChange={handleText(tab.key, "subtitle3")}
                            style={{
                              border: "1px solid #d1d5db", borderRadius: ".375rem",
                              padding: ".4rem", fontSize: ".875rem", width: "100%"
                            }}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                          {/* URL Dropdown 1 */}
                          <select
                            value={config.url1}
                            onChange={handleSelect(tab.key, "url1")}
                            style={{
                              border: "1px solid #d1d5db", borderRadius: ".375rem",
                              padding: ".4rem", fontSize: ".875rem", width: "100%",
                              backgroundColor: "white", cursor: "pointer",
                              minHeight: "2.5rem"
                            }}
                          >
                            {URL_OPTIONS.map(option => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                          
                          {/* URL Dropdown 2 */}
                          <select
                            value={config.url2}
                            onChange={handleSelect(tab.key, "url2")}
                            style={{
                              border: "1px solid #d1d5db", borderRadius: ".375rem",
                              padding: ".4rem", fontSize: ".875rem", width: "100%",
                              backgroundColor: "white", cursor: "pointer",
                              minHeight: "2.5rem"
                            }}
                          >
                            {URL_OPTIONS.map(option => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                          
                          {/* URL Dropdown 3 */}
                          <select
                            value={config.url3}
                            onChange={handleSelect(tab.key, "url3")}
                            style={{
                              border: "1px solid #d1d5db", borderRadius: ".375rem",
                              padding: ".4rem", fontSize: ".875rem", width: "100%",
                              backgroundColor: "white", cursor: "pointer",
                              minHeight: "2.5rem"
                            }}
                          >
                            {URL_OPTIONS.map(option => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                         <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        <input
                          type="text"
                          placeholder="IP Address"
                          value={config.ipAddress1}
                          onChange={handleText(tab.key, "ipAddress1")}
                          style={{
                            border: "1px solid #d1d5db", borderRadius: ".375rem",
                            padding: ".4rem", fontSize: ".875rem", width: "100%"
                          }}
                        />
                        <input
                          type="text"
                          placeholder="IP Address"
                          value={config.ipAddress2}
                          onChange={handleText(tab.key, "ipAddress2")}
                          style={{
                            border: "1px solid #d1d5db", borderRadius: ".375rem",
                            padding: ".4rem", fontSize: ".875rem", width: "100%"
                          }}
                        />
                        <input
                          type="text"
                          placeholder="IP Address"
                          value={config.ipAddress3}
                          onChange={handleText(tab.key, "ipAddress3")}
                          style={{
                            border: "1px solid #d1d5db", borderRadius: ".375rem",
                            padding: ".4rem", fontSize: ".875rem", width: "100%"
                          }}
                        />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <input type="checkbox" checked={config.public} onChange={handleCheck(tab.key, "public")} />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <input type="checkbox" checked={config.admin} onChange={handleCheck(tab.key, "admin")} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex justify-end">
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

export default AdminTabSettings;