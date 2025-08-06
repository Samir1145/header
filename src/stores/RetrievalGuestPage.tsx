import { useEffect, useState, useCallback } from 'react'
import ThemeProvider from '@/components/ThemeProvider'
import TabVisibilityProvider from '@/contexts/TabVisibilityProvider'
import StatusIndicator from '@/components/status/StatusIndicator'
import ApiKeyAlert from '@/components/ApiKeyAlert'
import SiteHeader from '@/features/SiteHeader'
import { Tabs, TabsContent } from '@/components/ui/Tabs'
import { useSettingsStore } from '@/stores/settings'
import RetrievalTestingFree from '@/features/RetrievalTestingFree'
import DocumentManager from '@/features/DocumentManager'

export default function RetrievalGuestPage() {
  const currentTab = useSettingsStore.use.currentTab()
  const [apiKeyAlertOpen, setApiKeyAlertOpen] = useState(false)

  const handleApiKeyAlertOpenChange = useCallback((open: boolean) => {
    setApiKeyAlertOpen(open)
  }, [])

  const handleTabChange = useCallback(
    (tab: string) => useSettingsStore.getState().setCurrentTab(tab),
    []
  )

  useEffect(() => {
    if (!currentTab) {
      useSettingsStore.getState().setCurrentTab('retrieval')
    }
  }, [currentTab])

  return (
    <ThemeProvider>
      <TabVisibilityProvider>
        <main className="flex h-screen w-screen overflow-hidden">
          <Tabs
            value={currentTab || undefined}
            onValueChange={handleTabChange}
            className="!m-0 flex grow flex-col !p-0 overflow-hidden"
          >
            {/* ✅ SiteHeader must be inside <Tabs> to avoid TabsList error */}
            <SiteHeader guestMode />

            <div className="relative grow">
              <TabsContent
                value="retrieval"
                className="absolute top-0 right-0 bottom-0 left-0 overflow-auto"
              >
                <RetrievalTestingFree />
              </TabsContent>

              <TabsContent
                value="documents"
                className="absolute top-0 right-0 bottom-0 left-0 overflow-auto"
              >
                <DocumentManager />
              </TabsContent>
            </div>
          </Tabs>

          <StatusIndicator />
          <ApiKeyAlert open={apiKeyAlertOpen} onOpenChange={handleApiKeyAlertOpenChange} />
        </main>
      </TabVisibilityProvider>
    </ThemeProvider>
  )
}
