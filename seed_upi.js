
// Script to seed default UPI config
// Copy and run this in browser console if needed, or I will execute via run_command with a helper file

import { base44 } from './src/api/base44Client';

async function seedUpiConfig() {
    console.log('Seeding UPI Config...');

    try {
        const user = await base44.auth.me();
        const adminEmail = user?.email || 'kaushik4432@gmail.com';

        // Check if exists
        const existing = await base44.entities.AppConfig.filter({
            config_key: 'upi_payment_config'
        });

        if (existing.length > 0) {
            console.log('Config already exists:', existing[0]);
            return;
        }

        const newConfig = await base44.entities.AppConfig.create({
            config_key: 'upi_payment_config',
            category: 'payment',
            config_value: {
                upi_id: 'example@upi',
                account_holder_name: 'CineTracker Admin',
                qr_code_url: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=example@upi'
            },
            is_active: true,
            created_by: adminEmail,
            created_at: new Date().toISOString()
        });

        console.log('Seeded successfully:', newConfig);
    } catch (err) {
        console.error('Seeding failed:', err);
    }
}
