import React, { useState } from 'react';
import { Heart, Sparkles, Plus, Image, MessageCircleHeart, Send, CheckCircle2, ChevronRight } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Couple, CoupleMember, Memory, LoveNote, BucketItem } from '../types';
import { RelationshipCounter } from './RelationshipCounter';
import { PWAInstallButton } from './PWAInstallButton';

interface DashboardTabProps {
  couple: Couple;
  currentUserId: string;
  members: CoupleMember[];
  memories: Memory[];
  loveNotes: LoveNote[];
  bucketList: BucketItem[];
  onNavigate: (tab: 'memories' | 'notes' | 'bucket' | 'couple') => void;
  onSendQuickNote: (mood: string, message: string) => Promise<void>;
  onOpenAddMemory: () => void;
  onOpenAddBucket: () => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  couple,
  currentUserId,
  members,
  memories,
  loveNotes,
  bucketList,
  onNavigate,
  onSendQuickNote,
  onOpenAddMemory,
  onOpenAddBucket,
}) => {
  const [sendingMood, setSendingMood] = useState<string | null>(null);
  const partner = members.find((m) => m.user_id !== currentUserId);

  const quickVibes = [
    { mood: '❤️', label: 'Je t’aime', message: 'Je t’aime de tout mon cœur ! ❤️' },
    { mood: '🥺', label: 'Tu me manques', message: 'Tu me manques tellement... 🥺' },
    { mood: '🫂', label: 'Câlin', message: 'Un énorme câlin rien que pour toi ! 🫂' },
    { mood: '😘', label: 'Doux bisous', message: 'Plein de doux bisous volants ! 😘' },
    { mood: '✨', label: 'Fière de toi', message: 'Je suis tellement fier/fière de toi ! ✨' },
  ];

  const handleSendVibe = async (vibe: (typeof quickVibes)[0]) => {
    if (sendingMood) return;
    setSendingMood(vibe.mood);

    // Haptic feedback & confetti
    if (navigator.vibrate) navigator.vibrate([15, 30, 15]);
    confetti({
      particleCount: 25,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#f43f5e', '#fb7185', '#fda4af', '#e11d48'],
    });

    try {
      await onSendQuickNote(vibe.mood, vibe.message);
    } finally {
      setTimeout(() => setSendingMood(null), 1000);
    }
  };

  const latestNote = loveNotes[0];
  const recentMemories = memories.slice(0, 3);
  const nextBucket = bucketList.find((b) => !b.is_completed);

  return (
    <div id="dashboard-tab-view" className="space-y-6 pb-6">
      {/* PWA Install Banner */}
      <PWAInstallButton variant="banner" />

      {/* Main Relationship Counter */}
      <RelationshipCounter startedAt={couple.started_at} coupleName={couple.name} />

      {/* Quick Love Ping / Mood Action */}
      <div className="bg-white dark:bg-[#1a121c] rounded-3xl p-5 shadow-sm border border-rose-100/70 dark:border-white/10 transition-colors">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <Heart className="w-4 h-4 fill-current" />
            </div>
            <h3 className="text-sm font-bold text-stone-800 dark:text-stone-100">
              Envoyer une pensée à {partner?.profile?.display_name || 'mon amour'}
            </h3>
          </div>
          <span className="text-[11px] text-rose-500 dark:text-rose-400 font-medium">1 clic</span>
        </div>

        <div className="grid grid-cols-5 gap-2">
          {quickVibes.map((v) => (
            <button
              key={v.mood}
              id={`quick-vibe-${v.mood}`}
              onClick={() => handleSendVibe(v)}
              disabled={sendingMood !== null}
              className={`flex flex-col items-center justify-center py-2.5 px-1 rounded-2xl border transition-all ${
                sendingMood === v.mood
                  ? 'bg-rose-500 border-rose-500 text-white scale-110 shadow-md'
                  : 'bg-rose-50/40 dark:bg-white/5 border-rose-100 dark:border-white/10 text-stone-700 dark:text-stone-300 hover:bg-rose-100 dark:hover:bg-white/10 active:scale-95'
              }`}
            >
              <span className="text-2xl mb-1 select-none animate-in fade-in">{v.mood}</span>
              <span className="text-[10px] font-medium leading-tight text-center truncate w-full">
                {v.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Latest Love Note widget */}
      <div className="bg-white dark:bg-[#1a121c] rounded-3xl p-5 shadow-sm border border-rose-100/70 dark:border-white/10 transition-colors">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-amber-700 dark:text-amber-300">
              <MessageCircleHeart className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-stone-800 dark:text-stone-100">Dernier mot doux</h3>
          </div>
          <button
            onClick={() => onNavigate('notes')}
            className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 flex items-center gap-0.5 cursor-pointer"
          >
            <span>Voir tout</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {latestNote ? (
          <div className="p-4 rounded-2xl bg-rose-50/50 dark:bg-[#231522] border border-rose-100/60 dark:border-rose-900/40 flex items-start gap-3.5">
            <span className="text-3xl shrink-0 select-none">{latestNote.mood || '💌'}</span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 mb-1">
                <span className="font-semibold text-rose-700 dark:text-rose-300">
                  {latestNote.user_id === currentUserId
                    ? 'Envoyé par vous'
                    : `De la part de ${partner?.profile?.display_name || 'votre partenaire'}`}
                </span>
                <span className="text-[10px]">
                  {new Date(latestNote.created_at).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <p className="text-sm text-stone-700 dark:text-rose-100/90 italic font-serif leading-relaxed">
                "{latestNote.message}"
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 px-4 rounded-2xl bg-stone-50 dark:bg-white/5 border border-dashed border-stone-200 dark:border-white/10">
            <p className="text-xs text-stone-500 dark:text-stone-400 mb-2">Aucun mot doux pour le moment</p>
            <button
              onClick={() => onNavigate('notes')}
              className="px-4 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-semibold shadow-xs hover:bg-rose-700 active:scale-95 cursor-pointer"
            >
              Écrire un mot doux ❤️
            </button>
          </div>
        )}
      </div>

      {/* Recent Memories Carousel / Grid */}
      <div className="bg-white dark:bg-[#1a121c] rounded-3xl p-5 shadow-sm border border-rose-100/70 dark:border-white/10 transition-colors">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <Image className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-stone-800 dark:text-stone-100">Derniers souvenirs</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              id="dashboard-add-memory-btn"
              onClick={onOpenAddMemory}
              className="w-7 h-7 rounded-full bg-rose-50 dark:bg-white/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-white/10 flex items-center justify-center hover:bg-rose-100 dark:hover:bg-white/15 transition active:scale-95 cursor-pointer"
              title="Ajouter un souvenir"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigate('memories')}
              className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 flex items-center gap-0.5 cursor-pointer"
            >
              <span>Galerie</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {recentMemories.length > 0 ? (
          <div className="grid grid-cols-3 gap-2.5">
            {recentMemories.map((m) => (
              <div
                key={m.id}
                onClick={() => onNavigate('memories')}
                className="group relative aspect-square rounded-2xl overflow-hidden bg-stone-100 dark:bg-stone-800 border border-rose-100 dark:border-white/10 shadow-2xs cursor-pointer"
              >
                <img
                  src={m.thumbnail_url || m.media_url}
                  alt={m.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  referrerPolicy="no-referrer"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent flex flex-col justify-end p-1.5 text-white">
                  <p className="text-[11px] font-semibold truncate leading-tight">{m.title}</p>
                  <p className="text-[9px] text-stone-300">
                    {new Date(m.date + 'T00:00:00').toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 px-4 rounded-2xl bg-stone-50 dark:bg-white/5 border border-dashed border-stone-200 dark:border-white/10">
            <p className="text-xs text-stone-500 dark:text-stone-400 mb-2">Immortalisez votre premier souvenir à deux</p>
            <button
              onClick={onOpenAddMemory}
              className="px-4 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-semibold shadow-xs hover:bg-rose-700 active:scale-95 inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Ajouter une photo</span>
            </button>
          </div>
        )}
      </div>

      {/* Next Bucket List item */}
      {nextBucket && (
        <div
          onClick={() => onNavigate('bucket')}
          className="bg-linear-to-r from-amber-500/10 via-rose-50 to-rose-100/50 dark:from-amber-950/40 dark:via-[#21141e] dark:to-[#1a101b] rounded-3xl p-4 border border-amber-200/60 dark:border-amber-900/40 flex items-center justify-between gap-3 shadow-2xs cursor-pointer hover:border-rose-300 dark:hover:border-rose-700/50 transition"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider">
                Prochain rêve à réaliser
              </span>
              <p className="text-xs font-bold text-stone-800 dark:text-stone-100 line-clamp-1">{nextBucket.title}</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-stone-400 shrink-0" />
        </div>
      )}
    </div>
  );
};
