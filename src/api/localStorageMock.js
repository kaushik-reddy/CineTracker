// Local Storage Mock for Base44 SDK
// This provides offline functionality when the Base44 backend is unavailable

const STORAGE_PREFIX = 'cinetracker_local_';

// Generate unique ID
const generateId = () => `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Get stored data for an entity
const getStoredData = (entityName) => {
    const key = STORAGE_PREFIX + entityName.toLowerCase();
    const data = localStorage.getItem(key);

    // Auto-seed data for specific entities if empty
    if (!data) {
        if (entityName === 'Plan') {
            const defaultPlans = [
                {
                    id: 'plan_trial',
                    name: 'Trial',
                    description: 'Try all features for free',
                    price: 0,
                    billing_cycle: 'trial',
                    trial_days: 7,
                    max_library_items: 50,
                    max_schedules_per_month: 10,
                    enable_stats: false,
                    enable_achievements: false,
                    is_active: true,
                    created_date: new Date().toISOString()
                },
                {
                    id: 'plan_monthly',
                    name: 'Pro Monthly',
                    description: 'Perfect for casual catalogers',
                    price: 29900, // ₹299
                    billing_cycle: 'monthly',
                    max_library_items: -1,
                    max_schedules_per_month: -1,
                    enable_stats: true,
                    enable_achievements: true,
                    is_active: true,
                    created_date: new Date().toISOString()
                },
                {
                    id: 'plan_yearly',
                    name: 'Pro Yearly',
                    description: 'Best value for power users',
                    price: 299900, // ₹2999
                    billing_cycle: 'yearly',
                    max_library_items: -1,
                    max_schedules_per_month: -1,
                    enable_stats: true,
                    enable_achievements: true,
                    is_active: true,
                    created_date: new Date().toISOString()
                }
            ];
            localStorage.setItem(key, JSON.stringify(defaultPlans));
            return defaultPlans;
        }

        if (entityName === 'AppConfig') {
            const defaultConfig = [
                {
                    id: 'config_upi',
                    config_key: 'upi_payment_config',
                    category: 'payment',
                    config_value: {
                        upi_id: 'mock-upi@bank',
                        account_holder_name: 'Cinemate Mock Business',
                        qr_code_url: 'https://via.placeholder.com/200?text=Mock+QR'
                    },
                    is_active: true,
                    created_date: new Date().toISOString()
                }
            ];
            localStorage.setItem(key, JSON.stringify(defaultConfig));
            return defaultConfig;
        }

        return [];
    }

    return JSON.parse(data);
};

// Save data for an entity
const saveData = (entityName, data) => {
    const key = STORAGE_PREFIX + entityName.toLowerCase();
    localStorage.setItem(key, JSON.stringify(data));
};

// Sort function helper
const createSortFn = (sortBy) => {
    if (!sortBy) return () => 0;
    const isDesc = sortBy.startsWith('-');
    const field = isDesc ? sortBy.slice(1) : sortBy;
    return (a, b) => {
        const valA = a[field];
        const valB = b[field];
        if (valA === valB) return 0;
        if (valA === undefined || valA === null) return 1;
        if (valB === undefined || valB === null) return -1;
        const comparison = valA < valB ? -1 : 1;
        return isDesc ? -comparison : comparison;
    };
};

// Filter function helper
const matchesFilter = (item, filters) => {
    if (!filters || Object.keys(filters).length === 0) return true;

    return Object.entries(filters).every(([key, value]) => {
        // Handle special $in operator
        if (typeof value === 'object' && value.$in) {
            return value.$in.includes(item[key]);
        }
        // Handle array filter (e.g., status: ['active', 'pending'])
        if (Array.isArray(value)) {
            return value.includes(item[key]);
        }
        // Handle simple equality
        return item[key] === value;
    });
};

// Create entity operations
const createEntityOperations = (entityName) => ({
    // List all records
    list: async (sortBy) => {
        const data = getStoredData(entityName);
        if (sortBy) {
            data.sort(createSortFn(sortBy));
        }
        return data;
    },

    // Filter records
    filter: async (filters, sortBy) => {
        let data = getStoredData(entityName);
        data = data.filter(item => matchesFilter(item, filters));
        if (sortBy) {
            data.sort(createSortFn(sortBy));
        }
        return data;
    },

    // Create a new record
    create: async (record) => {
        const data = getStoredData(entityName);
        const newRecord = {
            ...record,
            id: generateId(),
            created_date: new Date().toISOString(),
            updated_date: new Date().toISOString()
        };
        data.push(newRecord);
        saveData(entityName, data);
        return newRecord;
    },

    // Update a record
    update: async (id, updates) => {
        const data = getStoredData(entityName);
        const index = data.findIndex(item => item.id === id);
        if (index === -1) {
            throw new Error(`${entityName} with id ${id} not found`);
        }
        data[index] = {
            ...data[index],
            ...updates,
            updated_date: new Date().toISOString()
        };
        saveData(entityName, data);
        return data[index];
    },

    // Delete a record
    delete: async (id) => {
        const data = getStoredData(entityName);
        const filtered = data.filter(item => item.id !== id);
        saveData(entityName, filtered);
        return { success: true };
    },

    // Get by ID
    get: async (id) => {
        const data = getStoredData(entityName);
        return data.find(item => item.id === id) || null;
    }
});

// Entity names used in the app (comprehensive list)
const entityNames = [
    // Core media entities
    'Media',
    'WatchSchedule',
    'WatchSchedule',

    // User management
    'User',
    'UserPermissions',
    'UserRequest',

    // Subscription & billing
    'Subscription',
    'PlatformSubscription',
    'Plan',
    'Payment',
    'PaymentRequest',
    'Invoice',

    // Configuration - IMPORTANT: ConfigurableOption is used by ConfigLoader
    'ConfigurableOption',
    'AppConfig',
    'UPIConfig',

    // Content
    'Logo',
    'Option',
    'Universe',

    // Notifications
    'AdminNotification',
    'ScheduledNotification',
    'Notification',
    'EmailTemplate',

    // Analytics & misc
    'UsageAnalytics',
    'Request',
    'Cancellation',
    'WeeklyRelease'
];

// Create entities object with known entities
const entities = {};
entityNames.forEach(name => {
    entities[name] = createEntityOperations(name);
});

// Use Proxy to dynamically create entity operations for any unknown entities
const entitiesProxy = new Proxy(entities, {
    get(target, prop) {
        if (typeof prop !== 'string') return target[prop];
        if (prop in target) return target[prop];
        // Create operations for unknown entities on the fly
        console.log('[LocalMock] Creating dynamic entity operations for:', prop);
        target[prop] = createEntityOperations(prop);
        return target[prop];
    }
});

// Mock auth object
const auth = {
    me: async () => {
        const role = localStorage.getItem('cinemate_local_auth_role') || 'admin';
        console.log(`[LocalMock] Authenticating as ${role}`);

        if (role === 'user') {
            return {
                id: 'local-normal-user-id',
                email: 'user@dev.local',
                name: 'Normal User',
                full_name: 'Normal User',
                role: 'user'
            };
        }

        return {
            id: 'local-user-id',
            email: 'local@dev.local',
            name: 'Local Admin',
            full_name: 'Local Admin',
            role: 'admin'
        };
    },
    logout: (redirectUrl) => {
        console.log('[LocalMock] Logout called, would redirect to:', redirectUrl);
    },
    redirectToLogin: (returnUrl) => {
        console.log('[LocalMock] Login redirect called, would return to:', returnUrl);
    },
    updateMe: async (data) => {
        console.log('[LocalMock] Update user called with:', data);
        return { ...data, id: 'local-user-id', email: 'local@dev.local' };
    }
};

import { localFileStorage } from './localFileStorage';

// ... (keep existing code)

// Mock integrations
const integrations = {
    Core: {
        SendEmail: async (params) => {
            console.log('[LocalMock] Email sending simulated:', params);
            return { success: true };
        },
        UploadFile: async ({ file }) => {
            console.log('[LocalMock] File upload starting (IndexedDB):', file.name);
            try {
                const fileId = await localFileStorage.saveFile(file);
                const localUrl = `local-file://${fileId}`;
                console.log('[LocalMock] File saved to IndexedDB:', localUrl);
                return { file_url: localUrl };
            } catch (error) {
                console.error('[LocalMock] Failed to save file:', error);
                throw new Error("Failed to save file locally. Storage might be full.");
            }
        }
    }
};

// Mock appLogs for NavigationTracker
const appLogs = {
    logUserInApp: async (pageName) => {
        console.log('[LocalMock] User navigation logged:', pageName);
        return { success: true };
    }
};

// Export the local mock client
export const localBase44 = {
    entities: entitiesProxy,
    auth,
    integrations,
    appLogs
};

console.log('[LocalMock] Base44 local mock initialized - data stored in localStorage');
