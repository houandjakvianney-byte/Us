import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Bell, Heart, Camera, CheckCheck, Sparkles, BellRing, ChevronRight } from 'lucide-react';
import { CoupleNotification } from '../types';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: CoupleNotification[];
  onNotificationClick: (notification: CoupleNotification) => void;
  onMarkAllAsRead: () => void;
  onOpenPushSettings: () => void;
  isPushSubscribed: boolean;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onNotificationClick,
  onMarkAllAsRead,
  onOpenPushSettings,
  isPushSubscribed,
}) => {
  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const formatRelativeTime = (isoString: string) => {
    try {
      const diff = Date.now() - new Date(isoString).getTime();
      const minutes = Math.floor(diff / 60000);
      if (minutes < 1) return "À l'instant";
      if (minutes < 60) return `Il y a ${minutes} min`;
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `Il y a ${hours} h`;
      const days = Math.floor(hours / 24);
      return `Il y a ${days} j`;
    } catch {
      return '';
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-stone-950/70 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ type: 'spring', damping: 25, stiffness: 280 }}
          className="bg-white dark:bg-[#1a121c] w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl border border-rose-100 dark:border-white/10 flex flex-col max-h-[85vh] overflow-hidden transition-colors"
        >
          {/* Header */}
          <div className="p-4 border-b border-rose-100/80 dark:border-white/10 flex items-center justify-between bg-rose-50/50 dark:bg-white/5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center text-rose-600 dark:text-rose-400">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                  <span>Centre de notifications</span>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-600 text-white">
                      {unreadCount}
                    </span>
                  )}
                </h3>
                <p className="text-[11px] text-stone-500 dark:text-stone-400">Alertes de votre moitié</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={onMarkAllAsRead}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-rose-700 dark:text-rose-300 hover:bg-rose-100/60 dark:hover:bg-rose-950/50 transition cursor-pointer"
                  title="Tout marquer comme lu"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Tout lire</span>
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1.5 rounded-full text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Push status alert banner if not subscribed */}
          {!isPushSubscribed && (
            <div
              onClick={() => {
                onClose();
                onOpenPushSettings();
              }}
              className="p-3 bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200/80 dark:border-amber-900/40 flex items-center justify-between gap-2 cursor-pointer hover:bg-amber-100/60 dark:hover:bg-amber-900/30 transition"
            >
              <div className="flex items-center gap-2">
                <BellRing className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0" />
                <div className="text-xs">
                  <p className="font-bold text-amber-900 dark:text-amber-200">Notifications push désactivées</p>
                  <p className="text-[11px] text-amber-700 dark:text-amber-400">
                    Activez les alertes pour recevoir les mots doux en temps réel
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0" />
            </div>
          )}

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto divide-y divide-rose-50/80 dark:divide-white/5 p-2">
            {notifications.length === 0 ? (
              <div className="py-12 text-center space-y-3 px-6">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/40 mx-auto flex items-center justify-center text-rose-400">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-stone-800 dark:text-stone-200">Aucune notification pour l'instant</h4>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                    Dès que votre partenaire écrira une note d'amour ou immortalisera un souvenir, vous serez alerté(e) ici !
                  </p>
                </div>
              </div>
            ) : (
              notifications.map((notif) => {
                const isNote = notif.type === 'love_note';
                const isMemory = notif.type === 'memory';

                return (
                  <div
                    key={notif.id}
                    onClick={() => {
                      onNotificationClick(notif);
                      onClose();
                    }}
                    className={`p-3 rounded-2xl flex items-start gap-3 cursor-pointer transition ${
                      notif.isRead
                        ? 'hover:bg-stone-50 dark:hover:bg-white/5 text-stone-600 dark:text-stone-300'
                        : 'bg-rose-50/50 dark:bg-rose-950/30 hover:bg-rose-50 dark:hover:bg-rose-900/30 text-stone-900 dark:text-stone-100'
                    }`}
                  >
                    {/* Icon */}
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        isNote
                          ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
                          : isMemory
                          ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400'
                          : 'bg-rose-600 text-white'
                      }`}
                    >
                      {isNote ? (
                        <Heart className="w-4 h-4 fill-current" />
                      ) : isMemory ? (
                        <Camera className="w-4 h-4" />
                      ) : (
                        <Bell className="w-4 h-4" />
                      )}
                    </div>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold truncate">
                          {notif.title}
                        </span>
                        <span className="text-[10px] text-stone-400 dark:text-stone-500 shrink-0">
                          {formatRelativeTime(notif.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-2 mt-0.5">
                        {notif.body}
                      </p>
                    </div>

                    {/* Unread indicator */}
                    {!notif.isRead && (
                      <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0 mt-2" />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
