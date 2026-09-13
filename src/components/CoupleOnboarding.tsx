import React, { useState, useEffect } from 'react';
import { Heart, Plus, Users, ArrowRight, Sparkles, Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { supabase } from '../lib/supabase';

interface CoupleOnboardingProps {
  userId: string;
  onCoupleReady: () => void;
}

export const CoupleOnboarding: React.FC<CoupleOnboardingProps> = ({
  userId,
  onCoupleReady,
}) => {
  const [mode, setMode] = useState<'choose' | 'create' | 'join'>('choose');
  const [coupleName, setCoupleName] = useState('');
  const [startedAt, setStartedAt] = useState(
    new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [inviteCode, setInviteCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Check if URL has ?invite=CODE parameter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('invite');
    if (code) {
      setInviteCode(code.toUpperCase());
      setMode('join');
    }
  }, []);

  const handleCreateCouple = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = coupleName.trim();
    const finalDate = startedAt;

    if (!finalName) {
      setErrorMsg('Veuillez donner un nom à votre espace couple.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      // 1. Try server API first to safely bypass PostgreSQL RLS recursion
      const res = await fetch('/api/couple/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          name: finalName,
          startedAt: finalDate,
        }),
      });

      if (res.ok) {
        confetti({
          particleCount: 50,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#f43f5e', '#fb7185', '#fda4af', '#f59e0b'],
        });
        onCoupleReady();
        return;
      }

      // 2. Fallback to Supabase RPC function create_new_couple
      const { error: rpcErr } = await supabase.rpc('create_new_couple', {
        p_name: finalName,
        p_started_at: finalDate,
      });

      if (rpcErr) {
        throw new Error(rpcErr.message);
      }

      confetti({
        particleCount: 50,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#f43f5e', '#fb7185', '#fda4af', '#f59e0b'],
      });

      onCoupleReady();
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : 'Erreur lors de la création';
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinCouple = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = inviteCode.trim().toUpperCase();
    if (!cleanCode) {
      setErrorMsg("Veuillez saisir le code d'invitation.");
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      // 1. Try server API first to bypass PostgreSQL RLS recursion
      const res = await fetch('/api/couple/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          inviteCode: cleanCode,
        }),
      });

      if (res.ok) {
        confetti({
          particleCount: 60,
          spread: 100,
          origin: { y: 0.6 },
          colors: ['#f43f5e', '#10b981', '#fb7185', '#6366f1'],
        });
        onCoupleReady();
        return;
      }

      // 2. Fallback to Supabase RPC function join_couple_by_code
      const { error: rpcErr } = await supabase.rpc('join_couple_by_code', {
        p_code: cleanCode,
      });

      if (rpcErr) {
        throw new Error(rpcErr.message);
      }

      confetti({
        particleCount: 60,
        spread: 100,
        origin: { y: 0.6 },
        colors: ['#f43f5e', '#10b981', '#fb7185', '#6366f1'],
      });

      onCoupleReady();
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "Code d'invitation introuvable ou expiré";
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div
        id="couple-onboarding-container"
        className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl border border-rose-100 space-y-6"
      >
        {/* Top visual */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-3xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
            <Heart className="w-7 h-7 fill-current animate-pulse" />
          </div>
          <h2 className="text-xl font-extrabold text-stone-900 font-display">Bienvenue sur Deux</h2>
          <p className="text-xs text-stone-500 leading-relaxed">
            Votre cocon numérique privé à deux pour célébrer votre amour et garder tous vos souvenirs.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
            {errorMsg}
          </div>
        )}

        {mode === 'choose' && (
          <div className="space-y-3 pt-2">
            <button
              id="choose-create-couple-btn"
              onClick={() => setMode('create')}
              className="w-full p-4 rounded-2xl border-2 border-rose-100 hover:border-rose-400 bg-rose-50/40 hover:bg-rose-50 flex items-center justify-between text-left transition group active:scale-98"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center shadow-xs">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-stone-900">Créer notre espace</h4>
                  <p className="text-[11px] text-stone-500">
                    J'initialise l'espace et invite ma moitié
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-rose-500 group-hover:translate-x-0.5 transition" />
            </button>

            <button
              id="choose-join-couple-btn"
              onClick={() => setMode('join')}
              className="w-full p-4 rounded-2xl border-2 border-stone-100 hover:border-stone-300 bg-stone-50/50 hover:bg-stone-50 flex items-center justify-between text-left transition group active:scale-98"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-stone-800 text-white flex items-center justify-center shadow-xs">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-stone-900">Rejoindre mon partenaire</h4>
                  <p className="text-[11px] text-stone-500">J'ai reçu un code d'invitation</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-stone-500 group-hover:translate-x-0.5 transition" />
            </button>
          </div>
        )}

        {mode === 'create' && (
          <form onSubmit={handleCreateCouple} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Nom de votre espace couple <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                id="couple-name-input"
                required
                placeholder="Ex: Emma & Thomas, Les Amoureux..."
                value={coupleName}
                onChange={(e) => setCoupleName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Date de début de votre histoire <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                id="couple-start-date-input"
                required
                value={startedAt}
                onChange={(e) => setStartedAt(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              />
              <p className="text-[10px] text-stone-400 mt-1">
                Utilisée pour le compteur de jours et l'anniversaire de couple.
              </p>
            </div>

            <div className="pt-2 space-y-2">
              <button
                type="submit"
                id="submit-create-couple-btn"
                disabled={isLoading}
                className="w-full py-3 rounded-2xl bg-rose-600 text-white text-sm font-bold shadow-md shadow-rose-200 hover:bg-rose-700 active:scale-98 transition flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Créer notre cocon</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setMode('choose')}
                className="w-full py-2 text-xs font-semibold text-stone-500 hover:text-stone-700"
              >
                Retour au choix
              </button>
            </div>
          </form>
        )}

        {mode === 'join' && (
          <form onSubmit={handleJoinCouple} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Code d'invitation (6 caractères) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                id="invite-code-input"
                required
                maxLength={8}
                placeholder="Ex: AB12CD"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                className="w-full px-4 py-3 rounded-xl border border-stone-200 font-mono text-center tracking-widest text-lg font-bold uppercase focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              />
              <p className="text-[10px] text-stone-400 mt-1 text-center">
                Ce code a été généré sur le téléphone de votre partenaire.
              </p>
            </div>

            <div className="pt-2 space-y-2">
              <button
                type="submit"
                id="submit-join-couple-btn"
                disabled={isLoading}
                className="w-full py-3 rounded-2xl bg-rose-600 text-white text-sm font-bold shadow-md shadow-rose-200 hover:bg-rose-700 active:scale-98 transition flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Heart className="w-4 h-4 fill-current" />
                    <span>Rejoindre mon partenaire</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setMode('choose')}
                className="w-full py-2 text-xs font-semibold text-stone-500 hover:text-stone-700"
              >
                Retour au choix
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
