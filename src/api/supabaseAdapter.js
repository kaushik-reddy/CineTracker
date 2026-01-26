import { supabase } from './supabaseClient';

// Helper to generate IDs if missing
const generateId = () => `supa_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Helper for client-side filtering (reuse logic to match local mock behavior)
const matchesFilter = (item, filters) => {
    if (!filters || Object.keys(filters).length === 0) return true;

    return Object.entries(filters).every(([key, value]) => {
        // Handle special $in operator
        if (value && typeof value === 'object' && value.$in) {
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

const createEntityOperations = (entityName) => {
    // Supabase tables are lowercase
    const tableName = entityName.toLowerCase();

    // Some table names might be reserved like 'user'. Supabase usually handles specific names via schemas, 
    // but assuming standard public schema and 'user' table exists. 
    // If 'user' fails, we might need 'users' mapping.
    // However, existing code expects 'user' entity.

    return {
        list: async (sortBy) => {
            const { data, error } = await supabase.from(tableName).select('data');
            if (error) {
                console.error(`Supabase List Error [${tableName}]:`, error);
                return [];
            }
            let items = data.map(d => d.data);

            // Client side sort
            if (sortBy) {
                const isDesc = sortBy.startsWith('-');
                const field = isDesc ? sortBy.slice(1) : sortBy;
                items.sort((a, b) => {
                    if (a[field] < b[field]) return isDesc ? 1 : -1;
                    if (a[field] > b[field]) return isDesc ? -1 : 1;
                    return 0;
                });
            }
            return items;
        },

        filter: async (filters, sortBy) => {
            // For robustness, fetching all and filtering client side
            // This ensures exact match with Base44 SDK behavior on the JSONB structure
            const { data, error } = await supabase.from(tableName).select('data');
            if (error) {
                console.error(`Supabase Filter Error [${tableName}]:`, error);
                return [];
            }
            let items = data.map(d => d.data);

            items = items.filter(item => matchesFilter(item, filters));

            if (sortBy) {
                const isDesc = sortBy.startsWith('-');
                const field = isDesc ? sortBy.slice(1) : sortBy;
                items.sort((a, b) => {
                    if (a[field] < b[field]) return isDesc ? 1 : -1;
                    if (a[field] > b[field]) return isDesc ? -1 : 1;
                    return 0;
                });
            }
            return items;
        },

        create: async (record) => {
            const id = record.id || generateId();
            const timestamp = new Date().toISOString();
            const fullRecord = {
                ...record,
                id,
                created_date: record.created_date || timestamp,
                updated_date: timestamp
            };

            const { error } = await supabase.from(tableName).insert({
                id: id,
                data: fullRecord,
                created_at: timestamp
            });

            if (error) throw error;
            return fullRecord;
        },

        update: async (id, updates) => {
            // Fetch current to merge
            const { data: current, error: fetchError } = await supabase
                .from(tableName)
                .select('data')
                .eq('id', id)
                .single();

            if (fetchError || !current) throw new Error(`${entityName} ${id} not found`);

            const updatedRecord = {
                ...current.data,
                ...updates,
                updated_date: new Date().toISOString()
            };

            const { error } = await supabase
                .from(tableName)
                .update({
                    data: updatedRecord,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id);

            if (error) throw error;
            return updatedRecord;
        },

        delete: async (id) => {
            const { error } = await supabase.from(tableName).delete().eq('id', id);
            if (error) throw error;
            return { success: true };
        },

        get: async (id) => {
            const { data, error } = await supabase
                .from(tableName)
                .select('data')
                .eq('id', id)
                .single();

            if (error || !data) return null;
            return data.data;
        },

        subscribe: (callback, filter) => {
            // Create a unique channel for this subscription
            const channelId = `public:${tableName}:${Math.random().toString(36).substr(2, 9)}`;

            const channel = supabase
                .channel(channelId)
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: tableName,
                        filter: filter ? filter : undefined
                    },
                    (payload) => {
                        console.log(`[Supabase Realtime] Change received for ${tableName}:`, payload);
                        callback(payload);
                    }
                )
                .subscribe((status) => {
                    if (status === 'SUBSCRIBED') {
                        console.log(`[Supabase Realtime] Subscribed to ${tableName}`);
                    }
                });

            return () => {
                console.log(`[Supabase Realtime] Unsubscribing from ${tableName}`);
                supabase.removeChannel(channel);
            };
        }
    };
};

const entityNames = [
    'Media', 'WatchSchedule', 'User', 'UserPermissions', 'UserRequest',
    'Subscription', 'PlatformSubscription', 'Plan', 'Payment', 'PaymentRequest', 'Invoice',
    'ConfigurableOption', 'AppConfig', 'UPIConfig', 'Logo', 'Option', 'Universe',
    'AdminNotification', 'ScheduledNotification', 'Notification', 'EmailTemplate',
    'UsageAnalytics', 'Request', 'Cancellation', 'WeeklyRelease', 'NotificationHistory',
    'WatchParty', 'ChatMessage'
];

const entities = {};
entityNames.forEach(name => {
    entities[name] = createEntityOperations(name);
});

// Proxy for unknown entities
const entitiesProxy = new Proxy(entities, {
    get(target, prop) {
        if (typeof prop !== 'string') return target[prop];
        if (prop in target) return target[prop];
        // Create dynamic operations (assumes table exists!)
        console.warn(`[SupabaseAdapter] Creating operations for dynamic entity: ${prop}. Ensure table '${prop.toLowerCase()}' exists!`);
        target[prop] = createEntityOperations(prop);
        return target[prop];
    }
});

const auth = {
    me: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        // Fetch application user record
        let appUser = null;
        try {
            const users = await entitiesProxy.User.filter({ id: user.id });
            if (users && users.length > 0) appUser = users[0];
        } catch (e) {
            // Ignore fetch error, will create default
        }

        // Determine role logic
        let role = appUser?.role || 'user';

        // Fallback for bootstrap admin if valid and not yet set
        if (!appUser && user.email?.toLowerCase() === 'kaushik4432@gmail.com') {
            role = 'admin';
        }

        if (!appUser) {
            // Create user record on first login
            try {
                const newUser = {
                    id: user.id,
                    email: user.email,
                    role: role,
                    name: user.user_metadata?.full_name || user.email?.split('@')[0],
                    created_at: new Date().toISOString()
                };
                appUser = await entitiesProxy.User.create(newUser);
            } catch (e) { console.error('Failed to create user record', e); }
        }

        return {
            id: user.id,
            email: user.email,
            name: appUser?.name || user.user_metadata?.full_name || user.email?.split('@')[0],
            role: appUser?.role || role,
            ...appUser
        };
    },
    logout: async () => {
        localStorage.removeItem('cinetracker_role_preference');
        await supabase.auth.signOut();
        window.location.href = '/Login';
    },
    redirectToLogin: () => {
        window.location.href = '/Login';
    },
    updateMe: async (data) => {
        const { error } = await supabase.auth.updateUser({ data });
        if (error) throw error;
        return data;
    }
};

// Integrations - Email via Resend, File Upload via Supabase Storage
const integrations = {
    Core: {
        SendEmail: async ({ to, subject, body, scheduledAt }) => {
            try {
                const response = await fetch('/api/send-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ to, subject, body, scheduledAt })
                });
                const result = await response.json();
                if (!response.ok) {
                    console.error('Email send failed:', result.error);
                    throw new Error(result.error || 'Failed to send email');
                }
                return result;
            } catch (error) {
                console.error('SendEmail error:', error);
                throw error;
            }
        },
        UploadFile: async ({ file }) => {
            // Real Supabase Storage Upload
            // Assumes 'uploads' bucket exists
            const fileName = `${Date.now()}_${file.name}`;
            const { data, error } = await supabase.storage
                .from('Uploads')
                .upload(fileName, file);

            if (error) {
                console.error("Upload failed", error);
                throw error;
            }

            const { data: { publicUrl } } = supabase.storage.from('Uploads').getPublicUrl(fileName);
            return { file_url: publicUrl };
        }
    }
};

const appLogs = {
    logUserInApp: async (page) => {
        console.log('[Supabase] Log:', page);
        return { success: true };
    }
};

export const supabaseAdapter = {
    entities: entitiesProxy,
    auth,
    integrations,
    appLogs
};
