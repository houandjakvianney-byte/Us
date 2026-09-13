import React, { useState } from 'react';
import { Settings, Heart, Copy, Check, Share2, Calendar, User, Camera, LogOut, Sparkles, Smartphone, BellRing, Moon, Sun, Laptop } from 'lucide-react';
import { Couple, CoupleMember, UserProfile } from '../types';
import { supabase } from '../lib/supabase';
import { PWAInstallButton } from './PWAInstallButton';
import { PushNotificationCard } from './PushNotificationCard';
import { ThemePreference } from '../hooks/useTheme';

interface CoupleSettingsTabProps {
  couple: Couple;
  currentUserId: string;
  members: CoupleMember[];
  profile: UserProfile | null;
  onUpdateCoupleDate: (newDate: string) => Promise<void>;
  onUpdateProfile: (name: string, avatarUrl?: string) => Promise<void>;
  onSignOut: () => Promise<void>;
  theme?: ThemePreference;
  onSetTheme?: (theme: ThemePreference) => void;
}

const themeOptions: { id: ThemePreference; label: string; desc: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'light', label: 'Clair', desc: 'Lumineux & doux', icon: Sun },
  { id: 'dark', label: 'Sombre', desc: 'Idéal la nuit', icon: Moon },
  { id: 'system', label: 'Auto', desc: 'Suit l’appareil', icon: Laptop },
];

export const CoupleSettingsTab: React.FC<CoupleSettingsTabProps> = ({
  couple,
  currentUserId,
  members,
  profile,
  onUpdateCoupleDate,
  onUpdateProfile,
  onSignOut,
  theme = 'system',
  onSetTheme,
}) => {
  const [copied, setCopied] = useState(false);
  const [editingDate, setEditingDate] = useState(couple.started_at);
  const [isUpdatingDate, setIsUpdatingDate] = useState(false);
  const [dateUpdatedMsg, setDateUpdatedMsg] = useState(false);

  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileUpdatedMsg, setProfileUpdatedMsg] = useState(false);

  const partner = members.find((m) => m.user_id !== currentUserId);

  const handleCopyCode = () => {
    if (!couple.invite_code) return;
    navigator.clipboard.writeText(couple.invite_code);
    setCopied(true);
    if (navigator.vibrate) navigator.vibrate(10);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareInvite = async () => {
    if (!couple.invite_code) return;
    const shareData = {
      title: 'Rejoins-moi sur Deux',
      text: `Mon amour, rejoins notre espace couple privé sur l'application Deux ! Voici notre code d'invitation : ${couple.invite_code}`,
      url: window.location.origin + '?invite=' + couple.invite_code,
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch {
        handleCopyCode();
      }
    } else {
      handleCopyCode();
    }
  };

  const handleSaveDate = async () => {
    if (!editingDate) return;
    setIsUpdatingDate(true);
    try {
      await onUpdateCoupleDate(editingDate);
      setDateUpdatedMsg(true);
      setTimeout(() => setDateUpdatedMsg(false), 3000);
    } finally {
      setIsUpdatingDate(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;
    setIsUpdatingProfile(true);
    try {
      await onUpdateProfile(displayName.trim());
      setProfileUpdatedMsg(true);
      setTimeout(() => setProfileUpdatedMsg(false), 3000);
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  return (
    <div id="couple-settings-tab-view" className="space-y-4 pb-8">
      {/* Space Info */}
      <div className="bg-white dark:bg-[#1a121c] rounded-3xl p-5 shadow-xs border border-rose-100/70 dark:border-white/10 space-y-4 transition-colors">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center text-rose-600 dark:text-rose-400">
            <Heart className="w-5 h-5 fill-current" />
          </div>
          <div>
            <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">{couple.name}</h2>
            <p className="text-xs text-stone-500 dark:text-stone-400">Espace intime & chiffré pour 2 personnes</p>
          </div>
        </div>

        {/* Date of relationship */}
        <div className="p-4 rounded-2xl bg-rose-50/50 dark:bg-white/5 border border-rose-100/70 dark:border-white/10 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" />
              Date de début de notre histoire
            </span>
            {dateUpdatedMsg && (
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold animate-in fade-in">
                ✓ Enregistré !
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <input
              type="date"
              id="couple-started-at-input"
              value={editingDate}
              onChange={(e) => setEditingDate(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-stone-200 dark:border-white/10 text-xs bg-white dark:bg-[#140e16] text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-rose-500/20"
            />
            <button
              onClick={handleSaveDate}
              disabled={isUpdatingDate || editingDate === couple.started_at}
              className="px-3 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-semibold shadow-2xs hover:bg-rose-700 disabled:opacity-40 transition cursor-pointer"
            >
              Modifier
            </button>
          </div>
        </div>

        {/* Partner status & Invite code */}
        <div className="p-4 rounded-2xl bg-stone-50 dark:bg-white/5 border border-stone-200/80 dark:border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-800 dark:text-stone-200">Statut du partenaire</span>
            <span
              className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                partner
                  ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                  : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 animate-pulse'
              }`}
            >
              {partner ? 'Partenaire connecté' : 'En attente'}
            </span>
          </div>

          {partner ? (
            <div className="flex items-center gap-3 pt-1">
              <div className="w-10 h-10 rounded-full bg-rose-200 dark:bg-rose-900/60 flex items-center justify-center text-sm font-bold text-rose-800 dark:text-rose-200 overflow-hidden">
                {partner.profile?.avatar_url ? (
                  <img
                    src={partner.profile.avatar_url}
                    alt={partner.profile.display_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{partner.profile?.display_name?.slice(0, 2).toUpperCase() || 'P'}</span>
                )}
              </div>
              <div>
                <p className="text-xs font-bold text-stone-900 dark:text-stone-100">{partner.profile?.display_name}</p>
                <p className="text-[11px] text-stone-500 dark:text-stone-400">
                  A rejoint le{' '}
                  {new Date(partner.joined_at).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-stone-600 dark:text-stone-400">
                Partagez ce code d'invitation à votre moitié pour qu'elle rejoigne cet espace :
              </p>
              <div className="flex items-center gap-2">
                <div className="px-4 py-2 rounded-xl bg-white dark:bg-[#150e18] border border-rose-200 dark:border-rose-900/50 font-mono text-base font-bold text-rose-700 dark:text-rose-400 tracking-widest shadow-2xs">
                  {couple.invite_code || 'DEUX26'}
                </div>
                <button
                  id="copy-invite-code-btn"
                  onClick={handleCopyCode}
                  className="flex items-center gap-1 px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-xs font-semibold hover:bg-rose-100 dark:hover:bg-rose-900/60 transition active:scale-95 cursor-pointer"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Copié !' : 'Copier'}</span>
                </button>
                <button
                  id="share-invite-btn"
                  onClick={handleShareInvite}
                  className="flex items-center gap-1 px-3 py-2 rounded-xl bg-rose-600 text-white text-xs font-semibold shadow-xs hover:bg-rose-700 transition active:scale-95 cursor-pointer"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Partager</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Dark Mode / Night & Atmosphere Settings Card */}
      {onSetTheme && (
        <div id="theme-settings-card" className="bg-white dark:bg-[#1a121c] rounded-3xl p-5 shadow-xs border border-rose-100/70 dark:border-white/10 space-y-3.5 transition-colors">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <Moon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">Ambiance & Mode Nuit</h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Confort visuel pour lire et écrire vos mots doux nocturnes
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-1">
            {themeOptions.map((opt) => {
              const Icon = opt.icon;
              const isSelected = theme === opt.id;
              return (
                <button
                  key={opt.id}
                  id={`theme-opt-${opt.id}`}
                  type="button"
                  onClick={() => onSetTheme(opt.id)}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition cursor-pointer ${
                    isSelected
                      ? 'bg-rose-500 text-white border-rose-500 shadow-sm shadow-rose-200 dark:shadow-none font-semibold scale-102'
                      : 'bg-stone-50 dark:bg-white/5 text-stone-700 dark:text-stone-300 border-stone-200/80 dark:border-white/10 hover:border-rose-300 dark:hover:border-rose-800'
                  }`}
                >
                  <Icon className={`w-5 h-5 mb-1.5 ${isSelected ? 'text-white' : 'text-rose-500 dark:text-rose-400'}`} />
                  <span className="text-xs font-bold leading-tight mb-0.5">{opt.label}</span>
                  <span className={`text-[10px] leading-tight ${isSelected ? 'text-white/85' : 'text-stone-400 dark:text-stone-500'}`}>
                    {opt.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* User Profile Card */}
      <div className="bg-white dark:bg-[#1a121c] rounded-3xl p-5 shadow-xs border border-rose-100/70 dark:border-white/10 space-y-4 transition-colors">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-amber-700 dark:text-amber-300">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">Mon Profil</h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">Prénom ou surnom affiché à votre partenaire</p>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
              Prénom ou Surnom amoureux
            </label>
            <input
              type="text"
              id="profile-display-name-input"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-white/10 bg-white dark:bg-[#140e16] text-stone-900 dark:text-stone-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
            />
          </div>

          <div className="flex items-center justify-between">
            <button
              type="submit"
              disabled={isUpdatingProfile || displayName === profile?.display_name}
              className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold shadow-2xs hover:bg-rose-700 disabled:opacity-40 transition cursor-pointer"
            >
              Enregistrer mon profil
            </button>
            {profileUpdatedMsg && (
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">Profil mis à jour !</span>
            )}
          </div>
        </form>
      </div>

      {/* Push Notifications Card */}
      <PushNotificationCard userId={currentUserId} coupleId={couple.id} />

      {/* PWA & Installation Status */}
      <div className="bg-white dark:bg-[#1a121c] rounded-3xl p-5 shadow-xs border border-rose-100/70 dark:border-white/10 space-y-3 transition-colors">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-blue-100 dark:bg-blue-950/60 flex items-center justify-center text-blue-700 dark:text-blue-300">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">Application PWA</h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">Accès ultra-rapide sur votre écran d'accueil</p>
          </div>
        </div>

        <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
          Deux fonctionne comme une véritable application native : profitez d'un lancement instantané, du fonctionnement hors-ligne et d'une sécurité totale.
        </p>

        <PWAInstallButton variant="banner" />
      </div>

      {/* Sign Out button */}
      <div className="pt-2 text-center">
        <button
          id="logout-btn"
          onClick={onSignOut}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-white/5 transition active:scale-95 cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Se déconnecter</span>
        </button>
      </div>
    </div>
  );
};
