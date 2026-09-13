import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      id="offline-indicator-banner"
      className="fixed top-3 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full bg-amber-600/95 px-4 py-1.5 text-xs font-medium text-white shadow-lg backdrop-blur-sm animate-pulse"
    >
      <WifiOff className="w-3.5 h-3.5" />
      <span>Mode hors-ligne — Données locales synchronisées</span>
    </div>
  );
};
