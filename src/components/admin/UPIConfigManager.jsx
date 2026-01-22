import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QrCode, Upload, Loader2, CheckCircle2, Plus, Trash2, Star, Edit2 } from "lucide-react";
import { toast } from "sonner";

export default function UPIConfigManager() {
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [formData, setFormData] = useState({
    upi_id: '',
    account_holder_name: '',
    qr_code_url: '',
    label: '',
    is_primary: false
  });

  // Fetch UPI accounts from AppConfig
  const { data: configData, refetch } = useQuery({
    queryKey: ['upi-accounts-config'],
    queryFn: async () => {
      const configs = await base44.entities.AppConfig.filter({
        config_key: 'upi_accounts_list'
      });
      return configs[0] || { config_value: [] };
    }
  });

  const upiAccounts = configData?.config_value || [];
  const configId = configData?.id;

  // Helper to save entire list
  const saveList = async (newList) => {
    const user = await base44.auth.me();
    const payload = {
      config_key: 'upi_accounts_list',
      category: 'payment',
      config_value: newList,
      is_active: true,
      updated_by: user.email,
      updated_at: new Date().toISOString()
    };

    if (configId) {
      await base44.entities.AppConfig.update(configId, payload);
    } else {
      await base44.entities.AppConfig.create({
        ...payload,
        created_by: user.email,
        created_at: new Date().toISOString()
      });
    }
  };

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      let newList = [...upiAccounts];
      if (editingAccount) {
        newList = newList.map(acc => acc.id === editingAccount.id ? { ...data, id: acc.id } : acc);
      } else {
        newList.push({ ...data, id: Date.now().toString(), created_date: new Date().toISOString() });
      }
      await saveList(newList);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['upi-accounts-config'] });
      toast.success(editingAccount ? 'UPI account updated!' : 'UPI account added!');
      handleCloseDialog();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const newList = upiAccounts.filter(acc => acc.id !== id);
      await saveList(newList);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['upi-accounts-config'] });
      toast.success('UPI account deleted');
      setDeleteConfirm(null);
    }
  });

  const setPrimaryMutation = useMutation({
    mutationFn: async (accountId) => {
      const newList = upiAccounts.map(acc => ({
        ...acc,
        is_primary: acc.id === accountId
      }));
      await saveList(newList);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['upi-accounts-config'] });
      toast.success('Primary account updated');
    }
  });

  const handleQRUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData({ ...formData, qr_code_url: file_url });
      toast.success('QR code uploaded!');
    } catch (error) {
      toast.error('Failed to upload QR code');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = () => {
    if (!formData.upi_id || !formData.qr_code_url || !formData.account_holder_name) {
      toast.error('Please provide all required fields');
      return;
    }
    saveMutation.mutate(formData);
  };

  const handleEdit = (account) => {
    setEditingAccount(account);
    setFormData({
      upi_id: account.upi_id,
      account_holder_name: account.account_holder_name,
      qr_code_url: account.qr_code_url,
      label: account.label || '',
      is_primary: account.is_primary
    });
    setShowAddDialog(true);
  };

  const handleCloseDialog = () => {
    setShowAddDialog(false);
    setEditingAccount(null);
    setFormData({
      upi_id: '',
      account_holder_name: '',
      qr_code_url: '',
      label: '',
      is_primary: false
    });
  };

  return (
    <Card className="bg-zinc-900/80 border-zinc-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white flex items-center gap-2 text-sm sm:text-base lg:text-lg">
              <QrCode className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
              UPI Payment Configuration
            </CardTitle>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">Manage multiple UPI accounts for payment verification</p>
          </div>
          <Button
            onClick={() => setShowAddDialog(true)}
            className="bg-gradient-to-r from-purple-500 to-emerald-500 hover:from-purple-600 hover:to-emerald-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add UPI
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Instructions */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 text-xs text-zinc-300">
          <p className="font-semibold text-white mb-2">📌 Instructions:</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>Add multiple UPI accounts for different payment options</li>
            <li>Set one account as primary (default for new payments)</li>
            <li>Users can choose which UPI to pay during subscription</li>
            <li>Upload QR code image generated from any UPI app</li>
            <li>Mark accounts inactive to hide without deleting</li>
          </ul>
        </div>

        {/* UPI Accounts List */}
        {upiAccounts.length === 0 ? (
          <div className="text-center py-8 text-zinc-400">
            <QrCode className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No UPI accounts configured</p>
            <p className="text-xs mt-1">Add your first UPI account to enable payments</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {upiAccounts.map((account) => (
              <div key={account.id} className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700">
                <div className="flex gap-4">
                  {/* QR Code Preview */}
                  <div className="w-20 h-20 bg-white rounded flex items-center justify-center flex-shrink-0">
                    <img
                      src={account.qr_code_url}
                      alt="UPI QR"
                      className="w-full h-full object-contain"
                    />
                  </div>

                  {/* Account Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-white font-semibold text-sm">{account.account_holder_name}</h4>
                        {account.is_primary && (
                          <span className="bg-amber-500/20 text-amber-400 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Star className="w-3 h-3 fill-current" />
                            Primary
                          </span>
                        )}
                        {account.label && (
                          <span className="bg-purple-500/20 text-purple-400 text-xs px-2 py-0.5 rounded-full">
                            {account.label}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(account)}
                          className="h-7 w-7 p-0"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-blue-400" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setDeleteConfirm(account)}
                          className="h-7 w-7 p-0"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-zinc-400 mb-2">{account.upi_id}</p>
                    {!account.is_primary && (
                      <Button
                        size="sm"
                        onClick={() => setPrimaryMutation.mutate(account.id)}
                        className="text-xs bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/50 h-7"
                      >
                        <Star className="w-3 h-3 mr-1" />
                        Set as Primary
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Add/Edit Dialog */}
      <Dialog open={showAddDialog} onOpenChange={handleCloseDialog}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>{editingAccount ? 'Edit UPI Account' : 'Add UPI Account'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div>
              <Label className="text-white mb-2">UPI ID *</Label>
              <Input
                value={formData.upi_id}
                onChange={(e) => setFormData({ ...formData, upi_id: e.target.value })}
                placeholder="yourname@upi"
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>

            <div>
              <Label className="text-white mb-2">Account Holder Name *</Label>
              <Input
                value={formData.account_holder_name}
                onChange={(e) => setFormData({ ...formData, account_holder_name: e.target.value })}
                placeholder="Your Name"
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>

            <div>
              <Label className="text-white mb-2">Label (Optional)</Label>
              <Input
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                placeholder="e.g., Personal, Business"
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>

            <div>
              <Label className="text-white mb-2">UPI QR Code *</Label>
              {formData.qr_code_url && (
                <div className="bg-zinc-950 p-4 rounded border border-zinc-800 flex justify-center mb-2">
                  <img
                    src={formData.qr_code_url}
                    alt="UPI QR Code"
                    className="w-40 h-40 object-contain"
                  />
                </div>
              )}

              <div className="flex gap-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleQRUpload}
                  disabled={uploading}
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
                {uploading && <Loader2 className="w-5 h-5 animate-spin text-purple-400" />}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleCloseDialog}
                className="flex-1 bg-zinc-700 hover:bg-zinc-600"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saveMutation.isPending}
                className="flex-1 bg-gradient-to-r from-purple-500 to-emerald-500 hover:from-purple-600 hover:to-emerald-600"
              >
                {saveMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    {editingAccount ? 'Update' : 'Add'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
          <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-md">
            <DialogHeader>
              <DialogTitle>Delete UPI Account?</DialogTitle>
            </DialogHeader>
            <p className="text-zinc-400 text-sm">
              Are you sure you want to delete "{deleteConfirm.account_holder_name}" ({deleteConfirm.upi_id})?
            </p>
            <div className="flex gap-3 mt-4">
              <Button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 bg-zinc-700 hover:bg-zinc-600"
              >
                Cancel
              </Button>
              <Button
                onClick={() => deleteMutation.mutate(deleteConfirm.id)}
                className="flex-1 bg-red-500 hover:bg-red-600"
              >
                Delete
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
}