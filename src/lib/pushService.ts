// Client-side Web Push Notification Manager for Deux PWA

function urlB64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function isPushSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

export function getPushPermission(): NotificationPermission | 'unsupported' {
  if (!isPushSupported()) return 'unsupported';
  return Notification.permission;
}

export async function getActiveServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!isPushSupported()) return null;
  try {
    // 1. First try navigator.serviceWorker.ready
    const registration = await Promise.race([
      navigator.serviceWorker.ready,
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 2500)),
    ]);
    if (registration) return registration;

    // 2. If not ready yet, try getting existing registrations
    const existing = await navigator.serviceWorker.getRegistrations();
    if (existing.length > 0) return existing[0];

    // 3. Register service worker fallback
    return await navigator.serviceWorker.register('/sw-push.js', { scope: '/' });
  } catch (err) {
    console.warn('Could not get or register ServiceWorker:', err);
    return null;
  }
}

export async function subscribeToPush(
  userId: string,
  coupleId: string
): Promise<{ success: boolean; error?: string }> {
  if (!isPushSupported()) {
    return { success: false, error: 'Les notifications push ne sont pas supportées sur ce navigateur.' };
  }

  try {
    // Request permission first
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return {
        success: false,
        error:
          permission === 'denied'
            ? 'Vous avez bloqué les notifications. Veuillez les autoriser dans les paramètres du navigateur.'
            : 'Autorisation non accordée.',
      };
    }

    // Fetch VAPID public key
    const vapidRes = await fetch('/api/push/vapid-public-key');
    if (!vapidRes.ok) throw new Error('Impossible de récupérer la clé VAPID');
    const { publicKey } = await vapidRes.json();
    if (!publicKey) throw new Error('Clé publique VAPID absente');

    const registration = await getActiveServiceWorker();
    if (!registration) {
      throw new Error('Service Worker indisponible. Réessayez dans quelques secondes.');
    }

    const applicationServerKey = urlB64ToUint8Array(publicKey);

    // Check if subscription already exists
    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey as any,
      });
    }

    // Register subscription on server
    const serverRes = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        coupleId,
        subscription: subscription.toJSON(),
        userAgent: navigator.userAgent,
      }),
    });

    if (!serverRes.ok) {
      const errJson = await serverRes.json().catch(() => ({}));
      throw new Error(errJson.error || 'Erreur d\'enregistrement serveur');
    }

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur activation notifications';
    console.error('Push subscribe error:', err);
    return { success: false, error: msg };
  }
}

export async function unsubscribeFromPush(userId: string): Promise<boolean> {
  if (!isPushSupported()) return false;
  try {
    const registration = await getActiveServiceWorker();
    if (registration) {
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await fetch('/api/push/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            endpoint: subscription.endpoint,
          }),
        });
        await subscription.unsubscribe();
      }
    }
    return true;
  } catch (err) {
    console.error('Error unsubscribing:', err);
    return false;
  }
}

export async function checkPushSubscriptionStatus(userId: string): Promise<boolean> {
  if (!isPushSupported()) return false;
  try {
    const registration = await getActiveServiceWorker();
    if (!registration) return false;
    const sub = await registration.pushManager.getSubscription();
    if (!sub) return false;

    const res = await fetch(`/api/push/status?userId=${encodeURIComponent(userId)}`);
    if (res.ok) {
      const data = await res.json();
      return !!data.isSubscribed;
    }
    return !!sub;
  } catch {
    return false;
  }
}

export async function triggerTestPush(
  userId: string,
  coupleId: string
): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch('/api/push/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, coupleId }),
    });
    const json = await res.json();
    return {
      success: !!json.success,
      message: json.message || (json.sentCount > 0 ? 'Notification envoyée !' : 'Notification enregistrée'),
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur envoi test';
    return { success: false, message: msg };
  }
}

// Gentle audio chime for in-app alerts
export function playNotificationChime() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  } catch {
    // Ignore audio autoplay restrictions
  }
}
