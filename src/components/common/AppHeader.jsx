import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Home, Library, Calendar, History, BarChart3, Trophy, User, Shield, Menu, X, DollarSign, Settings, HelpCircle, Users, LogOut } from 'lucide-react';

export default function AppHeader({ scheduleCount = 0, historyCount = 0, userRole, currentView, onViewChange, completedSchedules = [], mediaMap = {} }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const navItems = [
    { name: 'Home', icon: Home, view: 'home' },
    { name: 'Library', icon: Library, view: 'library' },
    { name: 'Schedule', icon: Calendar, view: 'schedule', badge: scheduleCount, badgeColor: 'bg-orange-500' },
    { name: 'Timeline', icon: Calendar, view: 'timeline' },
    { name: 'History', icon: History, view: 'history', badge: historyCount, badgeColor: 'bg-emerald-500' },
    { name: 'Stats', icon: BarChart3, view: 'stats' },
    { name: 'Achievements', icon: Trophy, view: 'achievements' },
    { name: 'Spending', icon: DollarSign, view: 'spending' },
    ...(userRole !== 'admin' ? [
      { name: 'Support', icon: HelpCircle, page: 'Support' },
      { name: 'Settings', icon: Settings, page: 'Settings' }
    ] : []),
    { name: 'Profile', icon: User, view: 'profile' },
    ...(userRole === 'admin' ? [{ name: 'Admin', icon: Shield, page: 'AdminSpace', adminOnly: true }] : []),
    { name: 'Logout', icon: LogOut, action: 'logout', className: 'text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-red-500/20' }
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-zinc-950/98 via-zinc-900/98 to-zinc-950/98 backdrop-blur-xl border-b border-zinc-700/50 shadow-xl" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <div className="w-full px-3 sm:px-4 max-w-[1920px] mx-auto">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo */}
          <div className="flex items-center gap-2 sm:gap-3 cursor-pointer flex-shrink-0" onClick={() => {
            navigate(createPageUrl('Home'));
            onViewChange?.('home');
            setMobileMenuOpen(false);
          }}>
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693d661aca82e178be7bb96f/ab2cb46cf_IMG_0700.png"
              alt="CineTracker Logo"
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover border-2 border-emerald-500/50"
            />
            <div className="flex flex-col">
              <h1 className="text-sm sm:text-base font-bold bg-gradient-to-r from-amber-400 to-purple-400 bg-clip-text text-transparent leading-tight">
                CineTracker
              </h1>
              <span className="text-[9px] sm:text-[10px] text-zinc-400 hidden sm:block">By Kaushik</span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-2 ml-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = item.view ? currentView === item.view : (item.page?.toLowerCase() === currentView?.toLowerCase());

              return (
                <button
                  key={item.name}
                  onClick={() => {
                    if (item.action === 'logout') {
                      base44.auth.logout();
                      return;
                    }
                    if (item.page) {
                      navigate(createPageUrl(item.page));
                    } else {
                      onViewChange?.(item.view);
                    }
                  }}
                  className={`
                    flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap relative group flex-shrink-0
                    ${active
                      ? 'bg-gradient-to-r from-purple-500 to-emerald-500 text-white shadow-lg shadow-purple-500/50'
                      : item.adminOnly
                        ? 'text-purple-400 hover:text-purple-300 hover:bg-zinc-800/80 hover:shadow-xl border border-purple-500/30'
                        : item.view === 'profile'
                          ? 'text-green-400 hover:text-green-300 hover:bg-zinc-800/80 hover:shadow-xl'
                          : 'text-zinc-400 hover:text-white hover:bg-zinc-800/80 hover:shadow-xl'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                  {item.badge > 0 && (
                    <span
                      className={`ml-1 ${item.badgeColor} text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] flex items-center justify-center`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-2 lg:hidden ml-auto">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-white hover:bg-zinc-800 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <nav className="lg:hidden border-t border-zinc-700/50 py-2 max-h-[calc(100vh-3.5rem)] overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = item.view ? currentView === item.view : (item.page?.toLowerCase() === currentView?.toLowerCase());

              return (
                <button
                  key={item.name}
                  onClick={() => {
                    if (item.action === 'logout') {
                      base44.auth.logout();
                      return;
                    }
                    if (item.page) {
                      navigate(createPageUrl(item.page));
                    } else {
                      onViewChange?.(item.view);
                    }
                    setMobileMenuOpen(false);
                  }}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold transition-all
                    ${active
                      ? 'bg-gradient-to-r from-purple-500 to-emerald-500 text-white'
                      : item.adminOnly
                        ? 'text-purple-400 hover:bg-zinc-800/80 border-l-2 border-purple-500/50'
                        : item.view === 'profile'
                          ? 'text-green-400 hover:bg-zinc-800/80'
                          : 'text-zinc-400 hover:text-white hover:bg-zinc-800/80'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span className="flex-1 text-left">{item.name}</span>
                  {item.badge > 0 && (
                    <span
                      className={`${item.badgeColor} text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[24px] flex items-center justify-center`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        )}
      </div>
    </header >
  );
}