import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CreditCard, Loader2, Save, QrCode } from "lucide-react";
import { toast } from "sonner";

export default function PaymentSettings() {
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState({
        upi_id: '',
        account_holder_name: '',
        qr_code_url: ''
    });

    // Fetch existing config
    const { data: config, isLoading } = useQuery({
        queryKey: ['admin-upi-config'],
        queryFn: async () => {
            const configs = await base44.entities.AppConfig.filter({
                config_key: 'upi_payment_config',
                category: 'payment'
            });
            return configs[0] || null;
        }
    });

    // Update form data when config loads
    useEffect(() => {
        if (config?.config_value) {
            setFormData({
                upi_id: config.config_value.upi_id || '',
                account_holder_name: config.config_value.account_holder_name || '',
                qr_code_url: config.config_value.qr_code_url || ''
            });
        }
    }, [config]);

    // Save mutation
    const saveMutation = useMutation({
        mutationFn: async (data) => {
            const user = await base44.auth.me();

            const configData = {
                config_key: 'upi_payment_config',
                category: 'payment',
                config_value: data,
                is_active: true,
                updated_by: user.email,
                updated_at: new Date().toISOString()
            };

            if (config?.id) {
                // Update existing
                await base44.entities.AppConfig.update(config.id, configData);
            } else {
                // Create new
                await base44.entities.AppConfig.create({
                    ...configData,
                    created_by: user.email
                });
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-upi-config'] });
            queryClient.invalidateQueries({ queryKey: ['upi-config'] }); // Invalidate user-side query too
            toast.success('Payment settings saved successfully');
        },
        onError: (error) => {
            toast.error('Failed to save settings: ' + error.message);
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.upi_id) {
            toast.error('UPI ID is required');
            return;
        }
        saveMutation.mutate(formData);
    };

    if (isLoading) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
            </div>
        );
    }

    return (
        <Card className="bg-zinc-900/80 border-zinc-800">
            <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-purple-400" />
                    UPI Payment Configuration
                </CardTitle>
                <CardDescription className="text-zinc-400">
                    Configure the UPI details displayed to users on the payment page.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
                    <div className="space-y-2">
                        <Label htmlFor="upi_id" className="text-zinc-300">UPI ID (VPA)</Label>
                        <Input
                            id="upi_id"
                            placeholder="e.g. business@okicici"
                            value={formData.upi_id}
                            onChange={(e) => setFormData({ ...formData, upi_id: e.target.value })}
                            className="bg-zinc-800 border-zinc-700 text-white"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="account_name" className="text-zinc-300">Account Holder Name</Label>
                        <Input
                            id="account_name"
                            placeholder="e.g. CineTracker Inc"
                            value={formData.account_holder_name}
                            onChange={(e) => setFormData({ ...formData, account_holder_name: e.target.value })}
                            className="bg-zinc-800 border-zinc-700 text-white"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="qr_code" className="text-zinc-300">QR Code Image URL</Label>
                        <div className="flex gap-2">
                            <Input
                                id="qr_code"
                                placeholder="https://..."
                                value={formData.qr_code_url}
                                onChange={(e) => setFormData({ ...formData, qr_code_url: e.target.value })}
                                className="bg-zinc-800 border-zinc-700 text-white"
                            />
                        </div>
                        <p className="text-xs text-zinc-500">
                            Upload your QR code to Supabase Storage and paste the public URL here.
                        </p>
                    </div>

                    {/* Preview */}
                    {formData.qr_code_url && (
                        <div className="bg-zinc-950 p-4 rounded border border-zinc-800 flex flex-col items-center">
                            <p className="text-zinc-400 text-sm mb-2">Preview</p>
                            <img
                                src={formData.qr_code_url}
                                alt="QR Code Preview"
                                className="w-32 h-32 object-contain bg-white rounded"
                                onError={(e) => e.target.style.display = 'none'}
                            />
                        </div>
                    )}

                    <Button
                        type="submit"
                        disabled={saveMutation.isPending}
                        className="w-full bg-gradient-to-r from-purple-500 to-emerald-500 hover:from-purple-600 hover:to-emerald-600 text-white"
                    >
                        {saveMutation.isPending ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4 mr-2" />
                                Save Configuration
                            </>
                        )}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
