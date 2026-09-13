import React, { useState } from 'react';
import { MessageCircleHeart, Send, Heart, Sparkles, Check, CheckCheck, Moon, Sun } from 'lucide-react';
import confetti from 'canvas-confetti';
import { LoveNote, CoupleMember } from '../types';

interface LoveNotesTabProps {
  loveNotes: LoveNote[];
  currentUserId: string;
  members: CoupleMember[];
  onSendNote: (mood: string, message: string) => Promise<void>;
  onMarkAsRead: (noteId: string) => Promise<void>;
  isDark?: boolean;
  onToggleTheme?: () => void;
}

export const LoveNotesTab: React.FC<LoveNotesTabProps> = ({
  loveNotes,
  currentUserId,
  members,
  onSendNote,
  onMarkAsRead,
  isDark = false,
  onToggleTheme,
}) => {
  const [message, setMessage] = useState('');
  const [selectedMood, setSelectedMood] = useState('❤️');
  const [isSending, setIsSending] = useState(false);

  const moods = [
    { emoji: '❤️', label: 'Amour' },
    { emoji: '🥺', label: 'Manque' },
    { emoji: '😘', label: 'Bisou' },
    { emoji: '🫂', label: 'Câlin' },
    { emoji: '🥰', label: 'Tendresse' },
    { emoji: '✨', label: 'Magique' },
    { emoji: '💌', label: 'Secret' },
  ];

  const partner = members.find((m) => m.user_id !== currentUserId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isSending) return;

    setIsSending(true);
    try {
      if (navigator.vibrate) navigator.vibrate([15, 40]);
      confetti({
        particleCount: 30,
        spread: 70,
        origin: { y: 0.8 },
        colors: ['#f43f5e', '#fb7185', '#fda4af'],
      });

      await onSendNote(selectedMood, message.trim());
      setMessage('');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div id="love-notes-tab-view" className="space-y-4 pb-8">
      {/* Header with Nocturnal Mode Switch */}
      <div className="bg-white dark:bg-[#1a121c] rounded-3xl p-5 shadow-xs border border-rose-100/70 dark:border-white/10 transition-colors">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <MessageCircleHeart className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">Boîte aux Mots Doux</h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Petites pensées secrètes, messages d'amour et humeurs
              </p>
            </div>
          </div>

          {/* Direct Nocturnal Atmosphere Toggle */}
          {onToggleTheme && (
            <button
              type="button"
              id="love-notes-night-mode-toggle-btn"
              onClick={onToggleTheme}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950/70 border border-rose-200/80 dark:border-rose-800/50 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition active:scale-95 shrink-0"
              title={isDark ? 'Passer en mode clair' : 'Activer le mode nuit pour les mots doux nocturnes'}
            >
              {isDark ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-300" />
                  <span className="hidden sm:inline">Jour</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-rose-500" />
                  <span className="hidden sm:inline">Nuit</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Composer Card */}
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-[#1a121c] rounded-3xl p-5 shadow-xs border border-rose-100/70 dark:border-white/10 space-y-3 transition-colors"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-stone-700 dark:text-stone-300">Choisir une humeur</span>
          <span className="text-xs text-rose-500 dark:text-rose-400 font-medium">{selectedMood}</span>
        </div>

        {/* Mood chips */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {moods.map((m) => (
            <button
              key={m.emoji}
              type="button"
              id={`note-mood-${m.emoji}`}
              onClick={() => setSelectedMood(m.emoji)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 transition ${
                selectedMood === m.emoji
                  ? 'bg-rose-500 text-white shadow-xs scale-105 dark:shadow-[0_0_12px_rgba(244,63,94,0.4)]'
                  : 'bg-rose-50 dark:bg-white/5 text-stone-700 dark:text-stone-300 hover:bg-rose-100 dark:hover:bg-white/10'
              }`}
            >
              <span>{m.emoji}</span>
              <span>{m.label}</span>
            </button>
          ))}
        </div>

        {/* Note input */}
        <div className="relative">
          <textarea
            id="love-note-input"
            required
            rows={3}
            placeholder={`Écrivez un mot doux à ${partner?.profile?.display_name || 'votre partenaire'}...`}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl border border-stone-200 dark:border-white/10 bg-white dark:bg-[#140e16] text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-600 text-sm focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 dark:focus:ring-rose-500/30 focus:border-rose-500 dark:focus:border-rose-400 resize-none font-serif placeholder:font-sans transition-colors"
          />
        </div>

        <button
          type="submit"
          id="send-love-note-btn"
          disabled={!message.trim() || isSending}
          className="w-full py-2.5 rounded-xl bg-rose-600 dark:bg-rose-600 text-white text-xs font-bold shadow-sm shadow-rose-200 dark:shadow-none hover:bg-rose-700 active:scale-98 transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Glisser ce mot doux dans la boîte</span>
        </button>
      </form>

      {/* Notes List */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-stone-600 dark:text-stone-400 uppercase tracking-wider px-2">
          Historique des Mots Doux ({loveNotes.length})
        </h3>

        {loveNotes.length === 0 ? (
          <div className="bg-white dark:bg-[#1a121c] rounded-3xl p-8 text-center border border-dashed border-rose-200 dark:border-rose-900/40 transition-colors">
            <Heart className="w-8 h-8 text-rose-300 dark:text-rose-500/60 mx-auto mb-2" />
            <p className="text-xs font-bold text-stone-700 dark:text-stone-300">La boîte est vide pour l'instant</p>
            <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-0.5">
              Soyez le premier à glisser un mot tendre !
            </p>
          </div>
        ) : (
          loveNotes.map((note) => {
            const isMe = note.user_id === currentUserId;
            return (
              <div
                key={note.id}
                className={`p-4 rounded-3xl border transition-colors ${
                  isMe
                    ? 'bg-white dark:bg-[#19111b] border-rose-100 dark:border-white/10 shadow-2xs ml-4'
                    : 'bg-rose-50/60 dark:bg-linear-to-br dark:from-[#241524] dark:to-[#1a101b] border-rose-200 dark:border-rose-900/50 shadow-2xs mr-4'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-white dark:bg-[#221624] shadow-xs border border-rose-100 dark:border-white/10 flex items-center justify-center text-2xl shrink-0 select-none">
                    {note.mood || '💌'}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 text-[11px] text-stone-500 dark:text-stone-400 mb-1">
                      <span className="font-bold text-stone-800 dark:text-stone-200">
                        {isMe ? 'Vous' : partner?.profile?.display_name || 'Partenaire'}
                      </span>
                      <span className="text-[10px]">
                        {new Date(note.created_at).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <p className="text-sm text-stone-800 dark:text-rose-100/90 font-serif italic leading-relaxed whitespace-pre-wrap">
                      "{note.message}"
                    </p>

                    <div className="flex items-center justify-end gap-1 mt-2 text-[10px] text-stone-400 dark:text-stone-500">
                      {!isMe && !note.is_read ? (
                        <button
                          onClick={() => onMarkAsRead(note.id)}
                          className="px-2 py-0.5 rounded-full bg-rose-200 dark:bg-rose-900/70 text-rose-800 dark:text-rose-200 font-semibold hover:bg-rose-300 dark:hover:bg-rose-800 transition"
                        >
                          Marquer comme lu
                        </button>
                      ) : note.is_read ? (
                        <span className="inline-flex items-center gap-0.5 text-rose-500 dark:text-rose-400 font-medium">
                          <CheckCheck className="w-3 h-3" />
                          <span>Lu avec amour</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-0.5">
                          <Check className="w-3 h-3" />
                          <span>Envoyé</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
