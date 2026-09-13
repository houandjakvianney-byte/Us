import React from 'react';
import { Heart, Image, MessageCircleHeart, Sparkles, Settings } from 'lucide-react';

export type NavTab = 'home' | 'memories' | 'notes' | 'bucket' | 'couple';

interface BottomNavProps {
  activeTab: NavTab;
  onChangeTab: (tab: NavTab) => void;
  unreadNotesCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onChangeTab,
  unreadNotesCount = 0,
}) => {
  const tabs = [
    { id: 'home' as NavTab, label: 'Accueil', icon: Heart },
    { id: 'memories' as NavTab, label: 'Souvenirs', icon: Image },
    { id: 'notes' as NavTab, label: 'Mots Doux', icon: MessageCircleHeart, badge: unreadNotesCount },
    { id: 'bucket' as NavTab, label: 'Projets', icon: Sparkles },
    { id: 'couple' as NavTab, label: 'Nous', icon: Settings },
  ];

  return (
    <nav
      id="mobile-bottom-nav"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-[#160f18]/95 backdrop-blur-lg border-t border-rose-100 dark:border-white/10 pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-2 shadow-[0_-4px_20px_rgba(244,63,94,0.06)] dark:shadow-[0_-4px_25px_rgba(0,0,0,0.5)] transition-colors"
    >
      <div className="max-w-md mx-auto px-4 flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              id={`nav-tab-${tab.id}`}
              onClick={() => {
                if (navigator.vibrate) navigator.vibrate(10);
                onChangeTab(tab.id);
              }}
              className={`relative flex flex-col items-center justify-center min-w-[56px] py-1 px-2 rounded-2xl transition-all ${
                isActive
                  ? 'text-rose-600 dark:text-rose-400 font-semibold scale-105'
                  : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 active:scale-95'
              }`}
            >
              {/* Active pill background */}
              {isActive && (
                <span className="absolute inset-0 bg-rose-50 dark:bg-rose-950/60 rounded-2xl -z-10 transition border border-transparent dark:border-rose-800/30" />
              )}

              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform ${
                    isActive
                      ? 'stroke-[2.3] fill-rose-100 dark:fill-rose-900/40 text-rose-600 dark:text-rose-400'
                      : 'stroke-[1.8]'
                  }`}
                />
                {tab.badge && tab.badge > 0 ? (
                  <span className="absolute -top-1 -right-2 w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center animate-bounce">
                    {tab.badge}
                  </span>
                ) : null}
              </div>

              <span className="text-[11px] mt-1 tracking-tight">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
