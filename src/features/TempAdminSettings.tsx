import React, { useState, useEffect } from "react";
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { toast } from 'sonner';

type TabAccess = {
  public: boolean;
  stakeholders: boolean;
  team: boolean;
  admin: boolean;
  customHeading: string;
  ipAddress: string;
};

type TabDef = { key: string; label: string };
const TABS: TabDef[] = [
  { key: "askatul", label: "1. AskAtul" },
  { key: "askip", label: "2. AskIP" },
  { key: "assets", label: "3. Assets" },
  { key: "forms", label: "4. Forms" },
  { key: "aboutus", label: "5. About Us" },
  { key: "login", label: "6. Login" },
  { key: "graphs", label: "7. Graphs" },
  { key: "agents", label: "8. Agents" },
  { key: "documents", label: "9. Documents" },
  { key: "wiki", label: "10. Wiki" },
  { key: "logs", label: "11. Logs" },
  { key: "profile", label: "12. Profile" },
];

const initialState: Record<string, TabAccess> = Object.fromEntries(
  TABS.map((tab) => [
    tab.key,
    {
      public: false,
      stakeholders: false,
      team: false,
      admin: false,
      customHeading: "",
      ipAddress: "",
    },
  ])
);

const TempAdminSettings: React.FC = () => {
  const [tabState, setTabState] = useState(initialState);
  const [isSaving, setIsSaving] = useState(false);

  // Load settings from Firebase on component mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, 'admin_feature_tabs', 'access_config');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const savedData = docSnap.data();
          console.log('Loaded data from Firebase:', savedData);
          const mergedState: Record<string, TabAccess> = TABS.reduce((acc, tab) => {
            acc[tab.key] = {
              public: savedData[tab.key]?.public || false,
              stakeholders: savedData[tab.key]?.stakeholders || false,
              team: savedData[tab.key]?.team || false,
              admin: savedData[tab.key]?.admin || false,
              customHeading: savedData[tab.key]?.customHeading || '',
              ipAddress: savedData[tab.key]?.ipAddress || '',
            };
            return acc;
          }, {} as Record<string, TabAccess>);
          setTabState(mergedState);
        } else {
          console.log('No existing data found in Firebase');
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
        toast.error('Failed to load settings from database.');
      }
    };

    fetchSettings();
  }, []);

  const handleCheck =
    (tabKey: string, field: keyof Omit<TabAccess, "customHeading" | "ipAddress">) =>
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

  const handleSave = async () => {
    setIsSaving(true);
    try {
      console.log('Saving tabState to Firebase:', tabState);
      await setDoc(doc(db, 'admin_feature_tabs', 'access_config'), tabState);
      console.log('Successfully saved to Firebase');
      toast.success('Access settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestPublic = () => {
    // Set all tabs to public for testing
    const testState = { ...tabState };
    Object.keys(testState).forEach(key => {
      testState[key].public = true;
    });
    setTabState(testState);
    toast.info('All tabs set to public for testing');
  };

  return (
    <div className="w-full h-full flex justify-center items-center p-4">
      <div className="card flex flex-col h-full w-full max-w-5xl min-h-0" style={{
        borderRadius: 0, overflow: "hidden", background: "#fff", maxWidth: "80vw", margin: "2rem auto",
        boxShadow: "0 2px 6px #e5e7eb"
      }}>
        <div className="card-header py-2 px-6">
          <h1 className="text-2xl font-bold" style={{ color: "#dc2626" }}>TEMP Admin Tab Settings</h1>
          <p className="text-sm" style={{ color: "#6b7280" }}>
            Define which tabs are visible to Public, Stakeholders, Team-Mbrs or IP-Admin users and map custom labels/IPs.
          </p>
          <div className="mt-2">
            <button 
              onClick={handleTestPublic}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 mr-2"
            >
              Set All Public (Test)
            </button>
            <a href="/" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              Go to Home
            </a>
          </div>
        </div>
        <div className="card-content flex-1 flex flex-col min-h-0 overflow-auto">
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
                {TABS.map((tab) => (
                  <tr key={tab.key} style={{ borderTop: "1px solid #e5e7eb" }}>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      <div>{tab.label}</div>
                      <div style={{ display: "flex", gap: "0.5rem", flexDirection: "row" }}>
                        <input
                          type="text"
                          className="heading"
                          placeholder={`Custom heading for ${tab.label.replace(/^\d+\.\s*/, "")}`}
                          value={tabState[tab.key].customHeading}
                          onChange={handleText(tab.key, "customHeading")}
                          style={{
                            border: "1px solid #d1d5db", borderRadius: ".375rem",
                            padding: ".4rem", fontSize: ".875rem", marginTop: ".3rem", width: "13rem"
                          }}
                        />
                        <input
                          type="text"
                          className="ip"
                          placeholder={`IP Address for ${tab.label.replace(/^\d+\.\s*/, "")}`}
                          value={tabState[tab.key].ipAddress}
                          onChange={handleText(tab.key, "ipAddress")}
                          style={{
                            border: "1px solid #d1d5db", borderRadius: ".375rem",
                            padding: ".4rem", fontSize: ".875rem", marginTop: ".3rem", width: "13rem"
                          }}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <input type="checkbox" checked={tabState[tab.key].public} onChange={handleCheck(tab.key, "public")} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <input type="checkbox" checked={tabState[tab.key].stakeholders} onChange={handleCheck(tab.key, "stakeholders")} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <input type="checkbox" checked={tabState[tab.key].team} onChange={handleCheck(tab.key, "team")} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <input type="checkbox" checked={tabState[tab.key].admin} onChange={handleCheck(tab.key, "admin")} />
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

export default TempAdminSettings; 