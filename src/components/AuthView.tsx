import React, { useState } from 'react';
import { Heart, Lock, Mail, User, Sparkles, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AuthViewProps {
  onSuccess: () => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onSuccess }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      if (isSignUp) {
        // Register via server endpoint to ensure auto-confirmed status
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            password,
            displayName: displayName.trim() || undefined,
          }),
        });

        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.error || "Erreur lors de l'inscription");
        }

        // Now sign in automatically
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });

        if (signInError) throw signInError;
        onSuccess();
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });

        if (error) {
          throw new Error('Email ou mot de passe incorrect.');
        }
        onSuccess();
      }
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : 'Une erreur est survenue';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center px-4 py-8 bg-linear-to-b from-rose-50/70 via-white to-rose-50/40 dark:from-[#140e16] dark:via-[#1a121c] dark:to-[#140e16] transition-colors">
      <div
        id="auth-form-card"
        className="w-full max-w-sm mx-auto bg-white dark:bg-[#1f1622] rounded-3xl p-6 sm:p-8 shadow-xl shadow-rose-500/5 dark:shadow-none border border-rose-100 dark:border-white/10 space-y-6 transition-colors"
      >
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="relative inline-block">
            <div className="w-16 h-16 rounded-3xl bg-rose-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-rose-500/30">
              <Heart className="w-8 h-8 fill-current animate-pulse" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-400 text-stone-900 flex items-center justify-center shadow-xs">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          </div>

          <h1 className="text-2xl font-black text-stone-900 dark:text-stone-100 tracking-tight font-display">
            Deux
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            L'espace intime et privé pour votre couple
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs font-medium">
            {errorMsg}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {isSignUp && (
            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                Votre prénom ou surnom
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  id="auth-name-input"
                  required
                  placeholder="Ex: Emma"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 dark:border-white/10 bg-white dark:bg-[#140e16] text-stone-900 dark:text-stone-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                id="auth-email-input"
                required
                placeholder="vous@exemple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 dark:border-white/10 bg-white dark:bg-[#140e16] text-stone-900 dark:text-stone-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">Mot de passe</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                id="auth-password-input"
                required
                minLength={6}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 dark:border-white/10 bg-white dark:bg-[#140e16] text-stone-900 dark:text-stone-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              />
            </div>
          </div>

          <button
            type="submit"
            id="auth-submit-btn"
            disabled={loading}
            className="w-full py-3 rounded-2xl bg-rose-600 text-white text-sm font-bold shadow-md shadow-rose-200 dark:shadow-none hover:bg-rose-700 active:scale-98 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isSignUp ? (
              <span>Créer mon compte</span>
            ) : (
              <span>Se connecter</span>
            )}
          </button>
        </form>

        {/* Switch Sign in / Sign up */}
        <div className="text-center pt-1">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setErrorMsg(null);
            }}
            className="text-xs font-medium text-stone-600 dark:text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 transition cursor-pointer"
          >
            {isSignUp ? (
              <span>Vous avez déjà un compte ? <strong>Se connecter</strong></span>
            ) : (
              <span>Pas encore de compte ? <strong>Créer un compte</strong></span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
