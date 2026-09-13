import React, { useState, useEffect } from 'react';
import { Bell, BellOff, BellRing, Check, Send, AlertCircle, Sparkles } from 'lucide-react';
import {
  isPushSupported,
  getPushPermission,
  subscribeToPush,
  unsubscribeFromPush,
  checkPushSubscriptionStatus,
  triggerTestPush,
  playNotificationChime,
} from '../lib/pushService';

interface PushNotificationCardProps {
  userId: string;
  coupleId: string;
  onNotificationSent?: () => void;
}

export const PushNotificationCard: React.FC<PushNotificationCardProps> = ({
  userId,
  coupleId,
  onNotificationSent,
}) => {
  const [supported, setSupported] = useState(true);
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const checkStatus = async () => {
    const isSupp = isPushSupported();
    setSupported(isSupp);
    if (!isSupp) {
      setPermission('unsupported');
      return;
    }

    const perm = getPushPermission();
    setPermission(perm);

    if (perm === 'granted') {
      const sub = await checkPushSubscriptionStatus(userId);
      setIsSubscribed(sub);
    } else {
      setIsSubscribed(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, [userId, coupleId]);

  const handleTogglePush = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setStatusMessage(null);

    try {
      if (isSubscribed) {
        await unsubscribeFromPush(userId);
        setIsSubscribed(false);
        setStatusMessage({ type: 'info', text: 'Notifications push désactivées sur cet appareil.' });
      } else {
        const res = await subscribeToPush(userId, coupleId);
        if (res.success) {
          setIsSubscribed(true);
          setPermission('granted');
          playNotificationChime();
          setStatusMessage({
            type: 'success',
            text: 'Notifications activées ! Vous recevrez une alerte pour chaque mot doux et souvenir.',
          });
        } else {
          setStatusMessage({
            type: 'error',
            text: res.error || 'Impossible d\'activer les notifications.',
          });
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur inattendue';
      setStatusMessage({ type: 'error', text: msg });
    } finally {
      setIsLoading(false);
      checkStatus();
    }
  };

  const handleSendTest = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setStatusMessage(null);

    try {
      playNotificationChime();
      const res = await triggerTestPush(userId, coupleId);
      if (res.success) {
        setStatusMessage({
          type: 'success',
          text: res.message || 'Notification test envoyée avec succès !',
        });
        if (onNotificationSent) onNotificationSent();
      } else {
        setStatusMessage({
          type: 'error',
          text: res.message || 'Échec de l\'envoi du test.',
        });
      }
    } catch {
      setStatusMessage({ type: 'error', text: 'Erreur lors du test de notification.' });
    } finally {
      setIsLoading(false);
    }
  };

  if (!supported) {
    return (
      <div className="p-4 rounded-2xl bg-stone-50 dark:bg-white/5 border border-stone-200 dark:border-white/10 text-stone-600 dark:text-stone-400 text-xs space-y-1">
        <div className="flex items-center gap-2 font-bold text-stone-800 dark:text-stone-200">
          <BellOff className="w-4 h-4 text-stone-400" />
          <span>Notifications push non supportées</span>
        </div>
        <p className="text-[11px]">
          Votre navigateur actuel ne prend pas en charge l'API Push. Installez l'application en PWA pour profiter des alertes.
        </p>
      </div>
    );
  }

  return (
    <div id="push-notification-settings-card" className="bg-white dark:bg-[#1a121c] rounded-3xl p-5 shadow-xs border border-rose-100/70 dark:border-white/10 space-y-4 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className={`w-9 h-9 rounded-2xl flex items-center justify-center ${
            isSubscribed
              ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
              : 'bg-stone-100 dark:bg-white/10 text-stone-500 dark:text-stone-400'
          }`}>
            {isSubscribed ? <BellRing className="w-5 h-5 animate-pulse" /> : <Bell className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
              <span>Notifications Push</span>
              {isSubscribed && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                  Actif
                </span>
              )}
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Alertes instantanées en cas de mot doux ou de souvenir partagé
            </p>
          </div>
        </div>

        {/* Toggle Switch */}
        <button
          id="toggle-push-subscription-btn"
          type="button"
          disabled={isLoading || permission === 'denied'}
          onClick={handleTogglePush}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden disabled:opacity-40 ${
            isSubscribed ? 'bg-rose-600' : 'bg-stone-200 dark:bg-stone-700'
          }`}
          role="switch"
          aria-checked={isSubscribed}
          title={isSubscribed ? 'Désactiver les alertes' : 'Activer les alertes'}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
              isSubscribed ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Description text */}
      <div className="text-xs text-stone-600 dark:text-stone-400 space-y-1.5 leading-relaxed bg-rose-50/40 dark:bg-white/5 p-3 rounded-2xl border border-rose-100/50 dark:border-white/10">
        <div className="flex items-center gap-1.5 font-medium text-rose-950 dark:text-rose-200">
          <Sparkles className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400 shrink-0" />
          <span>Restez connectés à chaque instant :</span>
        </div>
        <ul className="list-disc list-inside space-y-0.5 text-[11px] text-stone-600 dark:text-stone-400 pl-1">
          <li>Notification dès que votre moitié vous dépose une note d'amour</li>
          <li>Alerte lorsqu'un nouveau souvenir photo est immortalisé</li>
          <li>Fonctionne même lorsque l'application est fermée sur mobile</li>
        </ul>
      </div>

      {/* Permission Denied Notice */}
      {permission === 'denied' && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 text-amber-900 dark:text-amber-200 text-xs">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            Les notifications sont bloquées dans les paramètres de votre navigateur. Veuillez réinitialiser les permissions du site pour les activer.
          </span>
        </div>
      )}

      {/* Status feedback message */}
      {statusMessage && (
        <div
          className={`p-2.5 rounded-xl text-xs font-medium flex items-center gap-1.5 animate-in fade-in duration-200 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800/40'
              : statusMessage.type === 'error'
              ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-800/40'
              : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700'
          }`}
        >
          {statusMessage.type === 'success' && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
          {statusMessage.type === 'error' && <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-2 pt-1">
        {!isSubscribed ? (
          <button
            id="enable-push-primary-btn"
            onClick={handleTogglePush}
            disabled={isLoading || permission === 'denied'}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-bold shadow-xs hover:bg-rose-700 active:scale-98 transition disabled:opacity-40 cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            <span>{isLoading ? 'Activation...' : 'Activer les notifications'}</span>
          </button>
        ) : (
          <button
            id="send-test-push-btn"
            onClick={handleSendTest}
            disabled={isLoading}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-xs font-bold border border-rose-200 dark:border-rose-800/50 active:scale-98 transition disabled:opacity-40 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isLoading ? 'Envoi...' : 'Tester une notification'}</span>
          </button>
        )}
      </div>
    </div>
  );
};
