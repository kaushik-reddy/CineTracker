import React from 'react';
import PWAConfig from './components/pwa/PWAConfig';
import { OfflineProvider, OfflineIndicator } from './components/pwa/OfflineManager';
import UpdateManager from './components/pwa/UpdateManager';
import NotificationManager from './components/pwa/NotificationManager';
import MobileOptimizations from './components/pwa/MobileOptimizations';
import InstallPrompt from './components/pwa/InstallPrompt';
import { ActionFeedbackProvider } from './components/feedback/ActionFeedbackContext';
import ActionFeedbackModal from './components/feedback/ActionFeedbackModal';

export default function Layout({ children }) {
  return (
    <ActionFeedbackProvider>
      <OfflineProvider>
        <PWAConfig />
        <MobileOptimizations />
        <OfflineIndicator />
        <UpdateManager />
        <NotificationManager />
        <InstallPrompt />
        <ActionFeedbackModal />
        {children}
      </OfflineProvider>
    </ActionFeedbackProvider>
  );
}