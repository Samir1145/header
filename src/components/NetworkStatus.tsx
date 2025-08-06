import { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { Wifi, WifiOff } from 'lucide-react';
import { isFirebaseOnline } from '@/lib/firebase';

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

    // Check initial status
    setIsOnline(navigator.onLine && isFirebaseOnline());
    setShowOfflineAlert(!navigator.onLine);

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check Firebase connectivity periodically
    const interval = setInterval(() => {
      const firebaseOnline = isFirebaseOnline();
      const browserOnline = navigator.onLine;
      const shouldBeOnline = browserOnline && firebaseOnline;
      
      if (isOnline !== shouldBeOnline) {
        setIsOnline(shouldBeOnline);
        setShowOfflineAlert(!shouldBeOnline);
      }
    }, 5000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [isOnline]);

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