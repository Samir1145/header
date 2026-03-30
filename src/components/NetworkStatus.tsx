import { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { Wifi, WifiOff } from 'lucide-react';
export default function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOfflineAlert, setShowOfflineAlert] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineAlert(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineAlert(true);
    };

    setIsOnline(navigator.onLine);
    setShowOfflineAlert(!navigator.onLine);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showOfflineAlert) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <Alert variant="destructive">
        <WifiOff className="h-4 w-4" />
        <AlertDescription>
          <div className="font-medium">No Internet Connection</div>
          <div className="text-sm mt-1">
            Some features may be unavailable. Please check your connection and refresh the page.
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
} 