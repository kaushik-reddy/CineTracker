import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';
import { localBase44 } from './localStorageMock';

const { appId, serverUrl, token, functionsVersion } = appParams;

// Check if we're in local development mode (no backend available)
const isLocalDev = !serverUrl ||
  serverUrl === 'null' ||
  serverUrl === 'undefined' ||
  serverUrl?.includes('null') ||
  window.location.hostname === 'localhost';

let base44Instance;

if (isLocalDev) {
  // Use local storage mock for offline development
  console.log('[Base44Client] Using localStorage mock for local development');
  base44Instance = localBase44;
} else {
  // Use real Base44 SDK client
  console.log('[Base44Client] Using real Base44 backend at:', serverUrl);
  base44Instance = createClient({
    appId,
    serverUrl,
    token,
    functionsVersion,
    requiresAuth: false
  });
}

export const base44 = base44Instance;
