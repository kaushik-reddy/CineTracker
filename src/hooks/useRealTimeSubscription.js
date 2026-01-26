import { useEffect, useRef } from 'react';
import { base44 } from '../api/base44Client';

/**
 * Hook to subscribe to real-time changes for a specific entity.
 * 
 * @param {string} entityName The name of the entity to subscribe to (e.g., 'WatchSchedule')
 * @param {Object} options Configuration options
 * @param {string} [options.filter] Supabase realtime filter string (e.g., 'user_id=eq.123')
 * @param {boolean} [options.enabled=true] Whether subscription is active
 * @param {Function} callback Function called when a change occurs. Receives the payload.
 */
export function useRealTimeSubscription(entityName, { filter, enabled = true } = {}, callback) {
    const unsubscribeRef = useRef(null);
    const callbackRef = useRef(callback);

    // Update callback ref whenever it changes
    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);

    useEffect(() => {
        // Validation
        if (!enabled || !entityName || !base44.entities[entityName]?.subscribe) {
            return;
        }

        const setupSubscription = () => {
            // Cleanup previous if exists
            if (unsubscribeRef.current) {
                unsubscribeRef.current();
            }

            console.log(`[useRealTimeSubscription] Setting up subscription for ${entityName}`);

            try {
                unsubscribeRef.current = base44.entities[entityName].subscribe((payload) => {
                    if (callbackRef.current) {
                        callbackRef.current(payload);
                    }
                }, filter);
            } catch (err) {
                console.error(`[useRealTimeSubscription] Failed to subscribe to ${entityName}:`, err);
            }
        };

        setupSubscription();

        return () => {
            if (unsubscribeRef.current) {
                unsubscribeRef.current();
                unsubscribeRef.current = null;
            }
        };
    }, [entityName, filter, enabled]); // removed callback from dependencies
}
