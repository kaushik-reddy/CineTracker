import { useState, useEffect, createContext, useContext } from 'react';

// Offline Context
const OfflineContext = createContext({
  isOnline: true,
  offlineQueue: [],
  addToQueue: () => {},
  processQueue: () => {}
});

export function useOffline() {
  return useContext(OfflineContext);
}

export function OfflineProvider({ children }) {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [offlineQueue, setOfflineQueue] = useState([]);

  useEffect(() => {
    // Load offline queue from localStorage
    const savedQueue = localStorage.getItem('offline_queue');
    if (savedQueue) {
      try {
        setOfflineQueue(JSON.parse(savedQueue));
      } catch (e) {
        console.error('Failed to load offline queue:', e);
      }
    }

    // Online/Offline event listeners
    const handleOnline = () => {
      setIsOnline(true);
      processQueue();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial online check
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const addToQueue = (action) => {
    const newQueue = [...offlineQueue, { ...action, timestamp: Date.now() }];
    setOfflineQueue(newQueue);
    localStorage.setItem('offline_queue', JSON.stringify(newQueue));
  };

  const processQueue = async () => {
    if (offlineQueue.length === 0) return;

    const successfulActions = [];
    
    for (const action of offlineQueue) {
      try {
        // Execute queued action
        if (action.type === 'update_progress') {
          await action.execute();
        }
        successfulActions.push(action);
      } catch (error) {
        console.error('Failed to process queued action:', error);
      }
    }

    // Remove successful actions from queue
    const remainingQueue = offlineQueue.filter(
      action => !successfulActions.includes(action)
    );
    setOfflineQueue(remainingQueue);
    localStorage.setItem('offline_queue', JSON.stringify(remainingQueue));
  };

  return (
    <OfflineContext.Provider value={{ isOnline, offlineQueue, addToQueue, processQueue }}>
      {children}
    </OfflineContext.Provider>
  );
}

// Offline Indicator Component
export function OfflineIndicator() {
  const { isOnline } = useOffline();

  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-black py-2 px-4 text-center text-sm font-medium">
      <span className="inline-flex items-center gap-2">
        <span className="w-2 h-2 bg-black rounded-full animate-pulse" />
        Offline Mode - Your progress is being saved locally
      </span>
    </div>
  );
}