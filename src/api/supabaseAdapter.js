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
        }
    };
};

const entityNames = [
    'Media', 'WatchSchedule', 'WatchParty', 'User', 'UserPermissions', 'UserRequest',
    'Subscription', 'PlatformSubscription', 'Plan', 'Payment', 'PaymentRequest', 'Invoice',
    'ConfigurableOption', 'AppConfig', 'UPIConfig', 'Logo', 'Option', 'Universe',
    'AdminNotification', 'ScheduledNotification', 'Notification', 'EmailTemplate',
    'UsageAnalytics', 'Request', 'Cancellation', 'WeeklyRelease'
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

        // Map Supabase user to App user structure
        return {
            id: user.id,
            email: user.email,
            name: user.user_metadata?.full_name || user.email?.split('@')[0],
            role: user.email?.toLowerCase() === 'kaushik4432@gmail.com' ? 'admin' : 'user'
        };
    },
    logout: async () => {
        await supabase.auth.signOut();
        window.location.reload();
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

// Integrations Mock (Supabase doesn't natively do LLM/Email out of box without Edge Functions)
// We will keep mocks for heavy logic, or implement basic File Upload via Storage
const integrations = {
    Core: {
        InvokeLLM: async () => "Supabase backend doesn't support LLM yet.",
        GenerateImage: async () => ({ url: "https://via.placeholder.com/400?text=No+Gen+AI" }),
        SendEmail: async () => ({ success: true }),
        UploadFile: async ({ file }) => {
            // Real Supabase Storage Upload
            // Assumes 'uploads' bucket exists
            const fileName = `${Date.now()}_${file.name}`;
            const { data, error } = await supabase.storage
                .from('uploads')
                .upload(fileName, file);

            if (error) {
                console.error("Upload failed", error);
                return { file_url: "https://via.placeholder.com/150?text=Upload+Fail" };
            }

            const { data: { publicUrl } } = supabase.storage.from('uploads').getPublicUrl(fileName);
            return { file_url: publicUrl };
        },
        SendSMS: async () => ({ success: true }),
        ExtractDataFromUploadedFile: async () => ({ data: {} })
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
