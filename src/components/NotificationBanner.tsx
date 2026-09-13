import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Camera, Bell, X, ArrowRight } from 'lucide-react';
import { CoupleNotification } from '../types';

interface NotificationBannerProps {
  notification: CoupleNotification | null;
  onClose: () => void;
  onNavigate: (url: string) => void;
}

export const NotificationBanner: React.FC<NotificationBannerProps> = ({
  notification,
  onClose,
  onNavigate,
}) => {
  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => {
      onClose();
    }, 6000);
    return () => clearTimeout(timer);
  }, [notification, onClose]);

  if (!notification) return null;

  const isNote = notification.type === 'love_note';
  const isMemory = notification.type === 'memory';

  return (
    <AnimatePresence>
      <div className="fixed top-3 inset-x-3 z-50 max-w-md mx-auto pointer-events-auto">
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="bg-stone-900/95 backdrop-blur-md text-white rounded-2xl p-3.5 shadow-xl border border-white/10 flex items-center gap-3"
          role="alert"
        >
          {/* Icon */}
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              isNote
                ? 'bg-rose-500 text-white'
                : isMemory
                ? 'bg-amber-500 text-white'
                : 'bg-rose-600 text-white'
            }`}
          >
            {isNote ? (
              <Heart className="w-5 h-5 fill-current animate-pulse" />
            ) : isMemory ? (
              <Camera className="w-5 h-5" />
            ) : (
              <Bell className="w-5 h-5" />
            )}
          </div>

          {/* Content */}
          <div
            className="flex-1 min-w-0 cursor-pointer"
            onClick={() => {
              onNavigate(notification.url || (isNote ? '/?tab=notes' : '/?tab=timeline'));
              onClose();
            }}
          >
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-rose-200">
                {isNote ? "Note d'amour" : isMemory ? 'Nouveau souvenir' : 'Deux'}
              </span>
              <span className="text-[10px] text-white/50">• à l'instant</span>
            </div>
            <p className="text-xs font-semibold text-white truncate">{notification.title}</p>
            <p className="text-[11px] text-stone-300 truncate">{notification.body}</p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => {
                onNavigate(notification.url || (isNote ? '/?tab=notes' : '/?tab=timeline'));
                onClose();
              }}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition"
              title="Voir"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-stone-400 hover:text-white transition"
              title="Fermer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
