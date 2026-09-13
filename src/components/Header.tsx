import React from 'react';
import { Heart, Sparkles, WifiOff, Bell, Moon, Sun } from 'lucide-react';
import { UserProfile, CoupleMember } from '../types';
import { PWAInstallButton } from './PWAInstallButton';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

interface HeaderProps {
  coupleName: string;
  currentUserId: string;
  members: CoupleMember[];
  onOpenProfile: () => void;
  unreadNotificationCount?: number;
  onOpenNotifications?: () => void;
  isDark?: boolean;
  onToggleTheme?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  coupleName,
  currentUserId,
  members,
  onOpenProfile,
  unreadNotificationCount = 0,
  onOpenNotifications,
  isDark = false,
  onToggleTheme,
}) => {
  const isOnline = useOnlineStatus();
  const partnerMember = members.find((m) => m.user_id !== currentUserId);
  const currentMember = members.find((m) => m.user_id === currentUserId);

  const getInitials = (name?: string) => {
    if (!name) return '?';
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <header
      id="app-top-header"
      className="sticky top-0 z-30 bg-rose-50/85 dark:bg-[#160f18]/90 backdrop-blur-md border-b border-rose-100/60 dark:border-white/10 px-4 py-3 transition-colors"
    >
      <div className="max-w-md mx-auto flex items-center justify-between gap-2">
        {/* Couple Branding & Names */}
        <div className="flex items-center gap-2.5">
          <div className="relative flex items-center -space-x-2">
            {/* Current user avatar */}
            <div
              onClick={onOpenProfile}
              className="relative w-8 h-8 rounded-full border-2 border-white dark:border-[#221626] shadow-xs overflow-hidden bg-rose-200 dark:bg-rose-900/50 flex items-center justify-center text-xs font-bold text-rose-800 dark:text-rose-200 cursor-pointer"
              title="Votre profil"
            >
              {currentMember?.profile?.avatar_url ? (
                <img
                  src={currentMember.profile.avatar_url}
                  alt="Moi"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span>{getInitials(currentMember?.profile?.display_name)}</span>
              )}
            </div>

            {/* Partner avatar */}
            <div
              onClick={onOpenProfile}
              className={`relative w-8 h-8 rounded-full border-2 border-white dark:border-[#221626] shadow-xs overflow-hidden flex items-center justify-center text-xs font-bold cursor-pointer ${
                partnerMember
                  ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-400 dark:text-stone-500 border-dashed'
              }`}
              title={partnerMember ? partnerMember.profile?.display_name : 'Inviter un partenaire'}
            >
              {partnerMember?.profile?.avatar_url ? (
                <img
                  src={partnerMember.profile.avatar_url}
                  alt="Partenaire"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span>{partnerMember ? getInitials(partnerMember.profile?.display_name) : '+'}</span>
              )}
            </div>

            {/* Small entwined heart */}
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-xs">
              <Heart className="w-2.5 h-2.5 fill-current" />
            </div>
          </div>

          <div className="min-w-0">
            <h1 className="text-sm font-bold text-stone-900 dark:text-stone-100 truncate flex items-center gap-1.5">
              <span>{coupleName || 'Notre Espace'}</span>
              {!isOnline && (
                <span title="Hors-ligne" className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
              )}
            </h1>
            <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate">
              {partnerMember
                ? `${currentMember?.profile?.display_name || 'Moi'} & ${partnerMember.profile?.display_name || 'Partenaire'}`
                : 'En attente de votre partenaire'}
            </p>
          </div>
        </div>

        {/* Action buttons: Theme toggle, Notifications & PWA install */}
        <div className="flex items-center gap-1">
          {/* Dark / Light Mode Quick Toggle */}
          {onToggleTheme && (
            <button
              id="header-theme-toggle-btn"
              onClick={onToggleTheme}
              className="p-2 rounded-xl text-stone-600 dark:text-stone-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-100/60 dark:hover:bg-white/10 active:scale-95 transition"
              title={isDark ? 'Passer en mode clair' : 'Mode nuit pour mots doux'}
              aria-label="Changer le mode d'affichage"
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-amber-300 animate-in spin-in-180 duration-300" />
              ) : (
                <Moon className="w-4 h-4 text-rose-500 hover:rotate-12 transition-transform duration-300" />
              )}
            </button>
          )}

          {onOpenNotifications && (
            <button
              id="header-notification-bell-btn"
              onClick={onOpenNotifications}
              className="relative p-2 rounded-xl text-stone-600 dark:text-stone-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-100/60 dark:hover:bg-white/10 active:scale-95 transition"
              title="Centre de notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadNotificationCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-600 px-1 text-[9px] font-bold text-white ring-2 ring-white dark:ring-stone-900 animate-pulse">
                  {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                </span>
              )}
            </button>
          )}
          <PWAInstallButton variant="compact" />
        </div>
      </div>
    </header>
  );
};

