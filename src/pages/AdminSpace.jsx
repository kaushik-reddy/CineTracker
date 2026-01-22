import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, Image, Settings, AlertCircle, Globe, CreditCard, Crown, BarChart3, Sparkles, Users, Package, DollarSign, FileText, QrCode, Mail, Bell, XCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import LogoManager from "../components/admin/LogoManager";
import OptionManager from "../components/admin/OptionManager";
import UniverseManager from "../components/admin/UniverseManager";
import PermissionsManager from "../components/admin/PermissionsManager";
import AppConfigManager from "../components/admin/AppConfigManager";
import StripeConfigManager from "../components/admin/StripeConfigManager";
import PlanManager from "../components/admin/PlanManager";
import StripeSetupGuide from "../components/admin/StripeSetupGuide";
import AutoInvoiceConfig from "../components/billing/AutoInvoiceConfig.jsx";
import UniverseExplorer from "../components/universe/UniverseExplorer";
import UserAnalytics from "../components/admin/UserAnalytics";
import WeeklyReleasesManager from "../components/admin/WeeklyReleasesManager";
import InvoiceDebugger from "../components/admin/InvoiceDebugger.jsx";
import RequestManagement from "../components/admin/RequestManagement.jsx";
import SubscriptionManager from "../components/admin/SubscriptionManager.jsx";
import PaymentVerification from "../components/admin/PaymentVerification.jsx";
import PaymentSettings from "../components/admin/PaymentSettings.jsx";
import UPIConfigManager from "../components/admin/UPIConfigManager.jsx";
import InvoiceManager from "../components/admin/InvoiceManager.jsx";
import EmailTemplateManager from "../components/admin/EmailTemplateManager.jsx";
import NotificationManager from "../components/admin/NotificationManager.jsx";
import CancellationManager from "../components/admin/CancellationManager.jsx";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AdminNotificationCenter from '../components/admin/AdminNotificationCenter';

export default function AdminSpace() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [selectedUserForPerms, setSelectedUserForPerms] = useState(null);
  const [activeTab, setActiveTab] = useState('analytics');
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');

  // Fetch payment requests for notifications
  const { data: paymentRequests = [] } = useQuery({
    queryKey: ['admin-payment-requests-count'],
    queryFn: () => base44.entities.Payment.list('-created_date'),
    enabled: user?.role === 'admin',
    refetchInterval: 30000
  });

  const pendingPayments = paymentRequests.filter(p => p.status === 'processing').length;

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        console.error('Failed to load user:', error);

        // Local development mode - allow admin access
        if (error.message?.includes('Network') ||
          error.message?.includes('Failed to fetch') ||
          error.message?.includes('null') ||
          window.location.hostname === 'localhost') {
          console.log('[AdminSpace] Local development mode - granting admin access');
          setUser({
            name: 'Local Admin',
            full_name: 'Local Admin',
            email: 'admin@local.dev',
            role: 'admin',
            id: 'local-admin-id'
          });
        }
      } finally {
        setLoading(false);
      }
    };

    checkAdmin();
  }, []);

  const { data: allUsers = [] } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => base44.entities.User.list(),
    enabled: user?.role === 'admin'
  });

  const { data: permissions = [] } = useQuery({
    queryKey: ['permissions'],
    queryFn: () => base44.entities.UserPermissions.list(),
    enabled: user?.role === 'admin'
  });

  const createPermissionMutation = useMutation({
    mutationFn: (data) => base44.entities.UserPermissions.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['permissions'] })
  });

  const updatePermissionMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.UserPermissions.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['permissions'] })
  });

  const togglePermission = async (userEmail, field, currentValue) => {
    const existing = permissions.find(p => p.user_email === userEmail);
    if (existing) {
      await updatePermissionMutation.mutateAsync({
        id: existing.id,
        data: { ...existing, [field]: !currentValue }
      });
    } else {
      await createPermissionMutation.mutateAsync({
        user_email: userEmail,
        [field]: true
      });
    }

    // Broadcast permission change event
    window.dispatchEvent(new CustomEvent('user-permissions-updated', {
      detail: { userEmail, field, newValue: !currentValue }
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <p className="text-zinc-400">Loading...</p>
      </div>
    );
  }

  if (!user) {
    // Not logged in -> Redirect
    window.location.href = '/Login';
    return null;
  }

  if (user.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black p-4">
        <Card className="bg-red-500/10 border-red-500/50 max-w-md">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
            <p className="text-zinc-300">This section is only accessible to administrators.</p>
            <div className="mt-6">
              <a href="/" className="text-purple-400 hover:text-purple-300 underline">Return Home</a>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-3 sm:p-4 md:p-6 pb-20">
      <div className="w-full max-w-[100vw] overflow-x-hidden">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 sm:mb-6"
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
              <h1 className="text-base sm:text-lg md:text-xl font-semibold text-white">Admin Space</h1>
            </div>
            <AdminNotificationCenter />
          </div>
          <p className="text-[10px] sm:text-xs md:text-sm text-zinc-400">Centralized configuration and asset management for CineTracker</p>
        </motion.div>

        {/* Global Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-4"
        >
          <div className="relative">
            <input
              type="text"
              value={globalSearchQuery}
              onChange={(e) => setGlobalSearchQuery(e.target.value)}
              placeholder="Search users, transactions, invoices..."
              className="w-full bg-zinc-900/80 border border-zinc-800 text-white rounded-lg px-4 py-3 pl-10 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2">
              <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </motion.div>

        {/* Stats Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4 sm:mb-6"
        >
          <Card className="bg-gradient-to-br from-purple-500/10 to-zinc-900 border-purple-500/30">
            <CardContent className="p-2 sm:p-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm sm:text-base font-bold text-white">Users</p>
                  <p className="text-[10px] text-zinc-400">{allUsers.length} total</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-500/10 to-zinc-900 border-emerald-500/30">
            <CardContent className="p-2 sm:p-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <Package className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm sm:text-base font-bold text-white">Assets</p>
                  <p className="text-[10px] text-zinc-400">Library</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500/10 to-zinc-900 border-amber-500/30">
            <CardContent className="p-2 sm:p-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm sm:text-base font-bold text-white">Billing</p>
                  <p className="text-[10px] text-zinc-400">Payments</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500/10 to-zinc-900 border-blue-500/30">
            <CardContent className="p-2 sm:p-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm sm:text-base font-bold text-white truncate">Admin</p>
                  <p className="text-[10px] text-zinc-400 truncate">{user.full_name}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            {/* Mobile Dropdown - Organized Categories */}
            <div className="lg:hidden mb-4">
              <Select value={activeTab} onValueChange={setActiveTab}>
                <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800 max-h-[70vh]">
                  {/* Analytics & Reports */}
                  <div className="px-2 py-1.5 text-[10px] font-semibold text-zinc-500 uppercase">Analytics</div>
                  <SelectItem value="analytics" className="text-white hover:bg-zinc-800">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4" />
                      User Analytics
                    </div>
                  </SelectItem>

                  {/* User Management */}
                  <div className="px-2 py-1.5 text-[10px] font-semibold text-zinc-500 uppercase mt-2">User Management</div>
                  <SelectItem value="subscriptions" className="text-white hover:bg-zinc-800">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Subscriptions
                    </div>
                  </SelectItem>
                  <SelectItem value="cancellations" className="text-white hover:bg-zinc-800">
                    <div className="flex items-center gap-2">
                      <XCircle className="w-4 h-4" />
                      Cancellations
                    </div>
                  </SelectItem>
                  <SelectItem value="permissions" className="text-white hover:bg-zinc-800">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      Permissions
                    </div>
                  </SelectItem>

                  {/* Billing & Plans */}
                  <div className="px-2 py-1.5 text-[10px] font-semibold text-zinc-500 uppercase mt-2">Billing</div>
                  <SelectItem value="plans" className="text-white hover:bg-zinc-800">
                    <div className="flex items-center gap-2">
                      <Crown className="w-4 h-4" />
                      Plans
                    </div>
                  </SelectItem>
                  <SelectItem value="payments" className="text-white hover:bg-zinc-800">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      Payment Verification
                      {pendingPayments > 0 && (
                        <span className="ml-auto bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                          {pendingPayments}
                        </span>
                      )}
                    </div>
                  </SelectItem>
                  <SelectItem value="invoices" className="text-white hover:bg-zinc-800">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Invoices
                    </div>
                  </SelectItem>
                  <SelectItem value="upi-config" className="text-white hover:bg-zinc-800">
                    <div className="flex items-center gap-2">
                      <QrCode className="w-4 h-4" />
                      UPI Config
                    </div>
                  </SelectItem>

                  {/* Content */}
                  <div className="px-2 py-1.5 text-[10px] font-semibold text-zinc-500 uppercase mt-2">Content</div>
                  <SelectItem value="logos" className="text-white hover:bg-zinc-800">
                    <div className="flex items-center gap-2">
                      <Image className="w-4 h-4" />
                      Logos
                    </div>
                  </SelectItem>
                  <SelectItem value="universes" className="text-white hover:bg-zinc-800">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      Universes
                    </div>
                  </SelectItem>
                  <SelectItem value="explorer" className="text-white hover:bg-zinc-800">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      Explorer
                    </div>
                  </SelectItem>
                  <SelectItem value="releases" className="text-white hover:bg-zinc-800">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      Releases
                    </div>
                  </SelectItem>

                  {/* Configuration */}
                  <div className="px-2 py-1.5 text-[10px] font-semibold text-zinc-500 uppercase mt-2">Configuration</div>
                  <SelectItem value="options" className="text-white hover:bg-zinc-800">
                    <div className="flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      Options
                    </div>
                  </SelectItem>
                  <SelectItem value="config" className="text-white hover:bg-zinc-800">
                    <div className="flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      App Config
                    </div>
                  </SelectItem>

                  {/* Communication */}
                  <div className="px-2 py-1.5 text-[10px] font-semibold text-zinc-500 uppercase mt-2">Communication</div>
                  <SelectItem value="templates" className="text-white hover:bg-zinc-800">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email Templates
                    </div>
                  </SelectItem>
                  <SelectItem value="notifications" className="text-white hover:bg-zinc-800">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4" />
                      Notifications
                    </div>
                  </SelectItem>
                  <SelectItem value="requests" className="text-white hover:bg-zinc-800">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      User Requests
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Desktop Tabs - Organized Grid Layout */}
            <div className="hidden lg:block mb-6">
              {/* Category Headers with Tabs in Grid */}
              <div className="grid grid-cols-2 gap-4">
                {/* Analytics & Reports */}
                <div>
                  <h3 className="text-xs font-semibold text-zinc-500 uppercase mb-2 px-1">Analytics & Reports</h3>
                  <TabsList className="bg-zinc-900/80 border border-zinc-800 p-1">
                    <TabsTrigger value="analytics" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white text-xs">
                      <BarChart3 className="w-3 h-3 mr-1" />
                      User Analytics
                    </TabsTrigger>
                  </TabsList>
                </div>

                {/* User Management */}
                <div>
                  <h3 className="text-xs font-semibold text-zinc-500 uppercase mb-2 px-1">User Management</h3>
                  <TabsList className="bg-zinc-900/80 border border-zinc-800 p-1">
                    <TabsTrigger value="subscriptions" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white text-xs">
                      <Users className="w-3 h-3 mr-1" />
                      Subscriptions
                    </TabsTrigger>
                    <TabsTrigger value="cancellations" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-orange-600 data-[state=active]:text-white text-xs">
                      <XCircle className="w-3 h-3 mr-1" />
                      Cancellations
                    </TabsTrigger>
                    <TabsTrigger value="permissions" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-red-600 data-[state=active]:text-white text-xs">
                      <Shield className="w-3 h-3 mr-1" />
                      Permissions
                    </TabsTrigger>
                  </TabsList>
                </div>

                {/* Billing & Plans */}
                <div>
                  <h3 className="text-xs font-semibold text-zinc-500 uppercase mb-2 px-1">Billing & Plans</h3>
                  <TabsList className="bg-zinc-900/80 border border-zinc-800 p-1">
                    <TabsTrigger value="plans" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-amber-600 data-[state=active]:text-white text-xs">
                      <Crown className="w-3 h-3 mr-1" />
                      Plans
                    </TabsTrigger>
                    <TabsTrigger value="payments" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white text-xs relative">
                      <CreditCard className="w-3 h-3 mr-1" />
                      Payment Verification
                      {pendingPayments > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">
                          {pendingPayments}
                        </span>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="invoices" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-teal-600 data-[state=active]:text-white text-xs">
                      <FileText className="w-3 h-3 mr-1" />
                      Invoices
                    </TabsTrigger>
                    <TabsTrigger value="upi-config" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white text-xs">
                      <QrCode className="w-3 h-3 mr-1" />
                      UPI Config
                    </TabsTrigger>
                  </TabsList>
                </div>

                {/* Content Management */}
                <div>
                  <h3 className="text-xs font-semibold text-zinc-500 uppercase mb-2 px-1">Content Management</h3>
                  <TabsList className="bg-zinc-900/80 border border-zinc-800 p-1 flex-wrap">
                    <TabsTrigger value="logos" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white text-xs">
                      <Image className="w-3 h-3 mr-1" />
                      Logos
                    </TabsTrigger>
                    <TabsTrigger value="universes" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-amber-600 data-[state=active]:text-white text-xs">
                      <Globe className="w-3 h-3 mr-1" />
                      Universes
                    </TabsTrigger>
                    <TabsTrigger value="explorer" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-pink-600 data-[state=active]:text-white text-xs">
                      <Globe className="w-3 h-3 mr-1" />
                      Explorer
                    </TabsTrigger>
                    <TabsTrigger value="releases" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-pink-600 data-[state=active]:text-white text-xs">
                      <Sparkles className="w-3 h-3 mr-1" />
                      Releases
                    </TabsTrigger>
                  </TabsList>
                </div>

                {/* Configuration */}
                <div>
                  <h3 className="text-xs font-semibold text-zinc-500 uppercase mb-2 px-1">Configuration</h3>
                  <TabsList className="bg-zinc-900/80 border border-zinc-800 p-1">
                    <TabsTrigger value="options" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white text-xs">
                      <Settings className="w-3 h-3 mr-1" />
                      Options
                    </TabsTrigger>
                    <TabsTrigger value="config" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white text-xs">
                      <Settings className="w-3 h-3 mr-1" />
                      App Config
                    </TabsTrigger>
                  </TabsList>
                </div>

                {/* Communication */}
                <div>
                  <h3 className="text-xs font-semibold text-zinc-500 uppercase mb-2 px-1">Communication</h3>
                  <TabsList className="bg-zinc-900/80 border border-zinc-800 p-1 flex-wrap">
                    <TabsTrigger value="templates" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white text-xs">
                      <Mail className="w-3 h-3 mr-1" />
                      Email Templates
                    </TabsTrigger>
                    <TabsTrigger value="notifications" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white text-xs">
                      <Bell className="w-3 h-3 mr-1" />
                      Notifications
                    </TabsTrigger>
                    <TabsTrigger value="requests" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-red-600 data-[state=active]:text-white text-xs">
                      <FileText className="w-3 h-3 mr-1" />
                      User Requests
                    </TabsTrigger>
                  </TabsList>
                </div>
              </div>
            </div>

            <TabsContent value="analytics">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                <UserAnalytics />
              </motion.div>
            </TabsContent>

            <TabsContent value="logos">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                <LogoManager />
              </motion.div>
            </TabsContent>

            <TabsContent value="options">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                <OptionManager />
              </motion.div>
            </TabsContent>

            <TabsContent value="universes">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                <UniverseManager />
              </motion.div>
            </TabsContent>

            <TabsContent value="explorer">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                <UniverseExplorer
                  onNavigateToMedia={(mediaId) => {
                    window.dispatchEvent(new CustomEvent('navigate-to-media', { detail: { mediaId, view: 'library' } }));
                  }}
                />
              </motion.div>
            </TabsContent>

            <TabsContent value="subscriptions">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                <SubscriptionManager />
              </motion.div>
            </TabsContent>

            <TabsContent value="cancellations">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                <CancellationManager />
              </motion.div>
            </TabsContent>

            <TabsContent value="permissions">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                <PermissionsManager
                  allUsers={allUsers}
                  permissions={permissions}
                  onTogglePermission={togglePermission}
                  userSearchQuery={userSearchQuery}
                  setUserSearchQuery={setUserSearchQuery}
                  selectedUserForPerms={selectedUserForPerms}
                  setSelectedUserForPerms={setSelectedUserForPerms}
                />
              </motion.div>
            </TabsContent>

            <TabsContent value="config">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                <AppConfigManager />
              </motion.div>
            </TabsContent>

            <TabsContent value="payments">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                <PaymentVerification />
              </motion.div>
            </TabsContent>

            <TabsContent value="upi-config">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                <UPIConfigManager />
              </motion.div>
            </TabsContent>

            <TabsContent value="plans">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                <PlanManager />
              </motion.div>
            </TabsContent>

            <TabsContent value="releases">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                <WeeklyReleasesManager />
              </motion.div>
            </TabsContent>

            <TabsContent value="templates">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                <EmailTemplateManager />
              </motion.div>
            </TabsContent>

            <TabsContent value="notifications">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                <NotificationManager />
              </motion.div>
            </TabsContent>

            <TabsContent value="requests">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                <RequestManagement />
              </motion.div>
            </TabsContent>

            <TabsContent value="invoices">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                <InvoiceManager />
              </motion.div>
            </TabsContent>
          </Tabs>
        </motion.div>


      </div>
    </div>
  );
}