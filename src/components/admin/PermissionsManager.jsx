import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Shield } from "lucide-react";
import { motion } from "framer-motion";

export default function PermissionsManager({ 
  allUsers, 
  permissions, 
  onTogglePermission,
  userSearchQuery,
  setUserSearchQuery,
  selectedUserForPerms,
  setSelectedUserForPerms
}) {
  const permissionFields = [
    { key: 'can_add_title', label: 'Add' },
    { key: 'can_schedule', label: 'Schedule' },
    { key: 'can_watch', label: 'Watch' },
    { key: 'can_edit', label: 'Edit' },
    { key: 'can_delete', label: 'Delete' },
    { key: 'can_add_history', label: 'Add History' },
    { key: 'can_mark_complete', label: 'Complete' }
  ];

  const regularUsers = allUsers.filter(u => u.role === 'user');

  const getUserPermissions = (email) => {
    return permissions.find(p => p.user_email === email) || {};
  };

  return (
    <Card className="bg-zinc-900/50 border-zinc-800">
      <CardHeader className="pb-2">
        <div>
          <CardTitle className="text-white flex items-center gap-2 text-base sm:text-lg font-semibold">
            <Shield className="w-5 h-5 text-red-400" />
            User Permissions
          </CardTitle>
          <p className="text-xs text-zinc-400 mt-2">
            📌 Control individual user permissions beyond plan limits. Override default plan settings for specific users.
          </p>
        </div>
      </CardHeader>
      <CardContent>
        {regularUsers.length === 0 ? (
          <div className="text-center py-8">
            <Shield className="w-12 h-12 mx-auto text-zinc-600 mb-3" />
            <p className="text-zinc-400">No regular users yet</p>
          </div>
        ) : (
          <>
            {/* User Search */}
            <div className="mb-3 sm:mb-4">
              <Input
                placeholder="Search users..."
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                className="bg-zinc-900/50 border-purple-500/30 text-white placeholder:text-zinc-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 hover:border-purple-500/50 transition-all text-sm"
              />
            </div>

            {/* User List */}
            <div className="space-y-2 max-h-48 sm:max-h-64 overflow-y-auto mb-3 sm:mb-4 scrollbar-thin scrollbar-thumb-zinc-700">
              {regularUsers
                .filter(u => 
                  u.full_name?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                  u.email?.toLowerCase().includes(userSearchQuery.toLowerCase())
                )
                .map((regUser, idx) => (
                  <motion.button
                    key={regUser.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => setSelectedUserForPerms(regUser)}
                    className={`w-full p-2 sm:p-3 rounded-lg border text-left transition-all ${
                      selectedUserForPerms?.id === regUser.id
                        ? 'bg-purple-500/20 border-purple-500/50'
                        : 'bg-zinc-800/50 border-zinc-700 hover:border-emerald-500/50'
                    }`}
                  >
                    <p className="text-white font-medium text-xs sm:text-sm truncate">{regUser.full_name}</p>
                    <p className="text-[10px] sm:text-xs text-zinc-400 truncate">{regUser.email}</p>
                  </motion.button>
                ))}
            </div>

            {/* Permissions Editor */}
            {selectedUserForPerms && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 sm:p-4 bg-zinc-800/50 rounded-lg border border-purple-500/50"
              >
                <h4 className="text-sm text-white font-semibold mb-3 truncate">
                  Permissions for {selectedUserForPerms.full_name}
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
                  {permissionFields.map((field) => {
                    const userPerms = getUserPermissions(selectedUserForPerms.email);
                    return (
                      <div 
                        key={field.key} 
                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-2 sm:p-3 bg-zinc-900/50 rounded border border-zinc-700 hover:border-purple-500/50 transition-all gap-1 sm:gap-2"
                      >
                        <span className="text-[10px] sm:text-xs text-white font-medium">{field.label}</span>
                        <Switch
                          checked={!!userPerms[field.key]}
                          onCheckedChange={() => onTogglePermission(selectedUserForPerms.email, field.key, userPerms[field.key])}
                          className="scale-75 sm:scale-100"
                        />
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}