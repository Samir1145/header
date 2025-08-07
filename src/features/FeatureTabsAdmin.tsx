import React, { useState, useEffect } from "react";
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { toast } from 'sonner';

type TabAccess = {
  public: boolean;
  admin: boolean;
  customHeading: string;
  ipAddress: string;
  order: number;
  loginUrl?: string; // ✅ New field
};

type TabDef = { key: string };
const TABS: TabDef[] = [
  { key: "askatul" }, { key: "askip" }, { key: "assets" }, { key: "forms" }, { key: "aboutus" },
  { key: "graphs" }, { key: "agents" }, { key: "documents" }, { key: "wiki" }, { key: "logs" },
  { key: "profile" }, { key: "retrival" }, { key: "retrival2" }, { key: "retrival3" }
];

const PATHS_REQUIRING_LOGIN_URL = [
  "/map", "/retrieval", "/retrieval2", "/retrieval3", "/access/iask"
];

const initialState: Record<string, TabAccess> = Object.fromEntries(
  TABS.map((tab) => [
    tab.key,
    {
      public: false,
      admin: false,
      customHeading: "",
      ipAddress: "",
      order: 0,
      loginUrl: ""
    },
  ])
);

const AdminTabSettings: React.FC = () => {
  const [tabState, setTabState] = useState(initialState);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, 'admin_feature_tabs', 'access_config');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const savedData = docSnap.data();
          const mergedState: Record<string, TabAccess> = TABS.reduce((acc, tab, index) => {
            acc[tab.key] = {
              public: savedData[tab.key]?.public || false,
              admin: savedData[tab.key]?.admin || false,
              customHeading: savedData[tab.key]?.customHeading || '',
              ipAddress: savedData[tab.key]?.ipAddress || '',
              loginUrl: savedData[tab.key]?.loginUrl || '',
              order: index
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
    (tabKey: string, field: keyof Omit<TabAccess, "customHeading" | "ipAddress" | "loginUrl">) =>
      (e: React.ChangeEvent<HTMLInputElement>) => {
        setTabState((prev) => ({
          ...prev,
          [tabKey]: { ...prev[tabKey], [field]: e.target.checked },
        }));
      };

  const handleText =
    (tabKey: string, field: "customHeading" | "ipAddress" | "loginUrl") =>
      (e: React.ChangeEvent<HTMLInputElement>) => {
        setTabState((prev) => ({
          ...prev,
          [tabKey]: { ...prev[tabKey], [field]: e.target.value },
        }));
      };

  const handleSave = async () => {
    // ✅ Validate all selected paths that require loginUrl
    for (const tabKey of Object.keys(tabState)) {
      const config = tabState[tabKey];
      if (
        PATHS_REQUIRING_LOGIN_URL.includes(config.ipAddress) &&
        (!config.loginUrl || config.loginUrl.trim() === "")
      ) {
        toast.error(`URL is required for tab: ${tabKey}`);
        return;
      }
    }

    setIsSaving(true);
    try {
      await setDoc(doc(db, 'admin_feature_tabs', 'access_config'), tabState);
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
                  <th className="px-4 py-3">Tabs</th>
                  <th className="px-4 py-3 text-center">Public</th>
                  <th className="px-4 py-3 text-center">IP-Admin</th>
                </tr>
              </thead>
              <tbody>
                {TABS.map((tab, index) => {
                  const selectedPath = tabState[tab.key]?.ipAddress;
                  const showLoginField = PATHS_REQUIRING_LOGIN_URL.includes(selectedPath);

                  return (
                    <tr key={tab.key} style={{ borderTop: "1px solid #e5e7eb" }}>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        <div className="font-semibold text-gray-700">{index + 1}.</div>
                        <div style={{ display: "flex", gap: "0.5rem", flexDirection: "row", flexWrap: "wrap" }}>
                          <input
                            type="text"
                            className="heading"
                            value={tabState[tab.key].customHeading}
                            onChange={handleText(tab.key, "customHeading")}
                            style={{
                              border: "1px solid #d1d5db", borderRadius: ".375rem",
                              padding: ".4rem", fontSize: ".875rem", marginTop: ".3rem", width: "13rem"
                            }}
                          />
                          <select
                            value={tabState[tab.key].ipAddress}
                            onChange={(e) => handleText(tab.key, "ipAddress")({ target: { value: e.target.value } } as any)}
                            style={{
                              border: "1px solid #d1d5db", borderRadius: ".375rem",
                              padding: ".4rem", fontSize: ".875rem", marginTop: ".3rem", width: "13rem",
                              backgroundColor: "white", cursor: "pointer",
                              minHeight: "2.5rem"
                            }}
                          >
                            <option value="">Select a path...</option>
                            <option value="/retrieval">/retrieval</option>
                            <option value="/retrieval2">/retrieval2</option>
                            <option value="/retrieval3">/retrieval3</option>
                            <option value="/map">/map</option>
                            <option value="/appeals">/appeals</option>
                            <option value="/agents">/agents</option>
                            <option value="/access">/access</option>
                            <option value="/forms">/forms</option>
                            <option value="/graphs">/graphs</option>
                            <option value="/documents">/documents</option>
                            <option value="/wiki">/wiki</option>
                            <option value="/logs">/logs</option>
                            <option value="/profile">/profile</option>
                            <option value="/access/idoc">/access/idoc</option>
                            <option value="/access/iask">/access/iask</option>
                            <option value="/access/igraph">/access/igraph</option>
                            <option value="/access/ilog">/access/ilog</option>
                          </select>

                          {showLoginField && (
                            <input
                              type="text"
                              placeholder="URL"
                              value={tabState[tab.key].loginUrl || ''}
                              onChange={handleText(tab.key, "loginUrl")}
                              required
                              style={{
                                border: "1px solid #d1d5db", borderRadius: ".375rem",
                                padding: ".4rem", fontSize: ".875rem", marginTop: ".3rem", width: "14rem",
                                backgroundColor: "#fff"
                              }}
                            />
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <input type="checkbox" checked={tabState[tab.key].public} onChange={handleCheck(tab.key, "public")} />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <input type="checkbox" checked={tabState[tab.key].admin} onChange={handleCheck(tab.key, "admin")} />
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
