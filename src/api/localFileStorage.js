export const DB_NAME = 'CineTrackerDB';
export const STORE_NAME = 'files';
export const DB_VERSION = 1;

const openDB = () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
        };

        request.onsuccess = (event) => {
            resolve(event.target.result);
        };

        request.onerror = (event) => {
            reject(event.target.error);
        };
    });
};

export const localFileStorage = {
    saveFile: async (file) => {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);

            // Generate a simpler ID for local usage
            const id = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            const record = {
                id,
                name: file.name,
                type: file.type,
                blob: file,
                created_at: new Date().toISOString()
            };

            const request = store.add(record);

            request.onsuccess = () => {
                resolve(id);
            };

            request.onerror = (event) => {
                reject(event.target.error);
            };
        });
    },

    getFile: async (id) => {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.get(id);

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = (event) => {
                reject(event.target.error);
            };
        });
    }
};
