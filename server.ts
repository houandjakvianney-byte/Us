import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://alayuxixflbzkuejosdd.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFsYXl1eGl4Zmxiemt1ZWpvc2RkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTI0ODcxMCwiZXhwIjoyMTA0ODI0NzEwfQ.8zOvoEMILY7HUo1V8uHPc_iHmN_yydowddY_sQDb8Gc';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFsYXl1eGl4Zmxiemt1ZWpvc2RkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkyNDg3MTAsImV4cCI6MjEwNDgyNDcxMH0.qIFzpNvT4HHl_sOR8LAL8D4cWoPTlH2ItltW7G1bx5A';

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Web Push / VAPID Configuration
const VAPID_PUBLIC_KEY =
  process.env.VAPID_PUBLIC_KEY ||
  'BDJytoa7u9ogwG9QMLbv4wIm9PzFrtD0cQ3U-BvIwLO8-V3HQnFkPWN-eGUhLvNWr_s0LqdS4uUVBTma1z9Vxg8';
const VAPID_PRIVATE_KEY =
  process.env.VAPID_PRIVATE_KEY || 'vWhanXFF5qFPIELdgiJtIbWUhREnJ9EINgPV7QgEOHc';

function formatVapidSubject(rawSubject?: string): string {
  if (!rawSubject || typeof rawSubject !== 'string' || !rawSubject.trim()) {
    return 'mailto:notifications@deux.love';
  }
  const trimmed = rawSubject.trim();
  if (trimmed.startsWith('mailto:') || trimmed.startsWith('https://') || trimmed.startsWith('http://')) {
    return trimmed;
  }
  if (trimmed.includes('@')) {
    return `mailto:${trimmed}`;
  }
  return `https://${trimmed}`;
}

const VAPID_SUBJECT = formatVapidSubject(process.env.VAPID_SUBJECT);

try {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  console.log(`[VAPID] Web Push configured with subject: ${VAPID_SUBJECT}`);
} catch (vapidErr) {
  console.warn('[VAPID] Error configuring VAPID with custom subject, trying default fallback:', vapidErr);
  try {
    webpush.setVapidDetails('mailto:notifications@deux.love', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  } catch (fallbackErr) {
    console.error('[VAPID] Fallback VAPID configuration also failed:', fallbackErr);
  }
}

// Persistent file storage for push subscriptions and notification log
const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
const SUBSCRIPTIONS_FILE = path.join(DATA_DIR, 'push_subscriptions.json');
const NOTIFICATIONS_FILE = path.join(DATA_DIR, 'notifications.json');

interface PushSubRecord {
  id: string;
  userId: string;
  coupleId: string;
  subscription: webpush.PushSubscription;
  userAgent?: string;
  createdAt: string;
  updatedAt: string;
}

interface CoupleNotification {
  id: string;
  coupleId: string;
  senderUserId: string;
  senderName: string;
  type: 'love_note' | 'memory' | 'bucket_item' | 'test';
  title: string;
  body: string;
  icon?: string;
  url: string;
  metadata?: Record<string, any>;
  isRead: boolean;
  createdAt: string;
}

function getSubscriptions(): PushSubRecord[] {
  try {
    if (fs.existsSync(SUBSCRIPTIONS_FILE)) {
      const content = fs.readFileSync(SUBSCRIPTIONS_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('Error reading push subscriptions:', err);
  }
  return [];
}

function saveSubscriptions(subs: PushSubRecord[]) {
  try {
    fs.writeFileSync(SUBSCRIPTIONS_FILE, JSON.stringify(subs, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving push subscriptions:', err);
  }
}

function getNotificationsList(): CoupleNotification[] {
  try {
    if (fs.existsSync(NOTIFICATIONS_FILE)) {
      const content = fs.readFileSync(NOTIFICATIONS_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('Error reading notifications list:', err);
  }
  return [];
}

function saveNotificationsList(notifs: CoupleNotification[]) {
  try {
    fs.writeFileSync(NOTIFICATIONS_FILE, JSON.stringify(notifs.slice(0, 150), null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving notifications list:', err);
  }
}

async function notifyCoupleMembers({
  coupleId,
  senderUserId,
  type,
  title,
  body,
  icon,
  url,
  metadata,
}: {
  coupleId: string;
  senderUserId: string;
  type: 'love_note' | 'memory' | 'bucket_item' | 'test';
  title?: string;
  body?: string;
  icon?: string;
  url?: string;
  metadata?: Record<string, any>;
}) {
  let senderName = 'Votre partenaire';
  try {
    const { data: senderProfile } = await supabaseAdmin
      .from('profiles')
      .select('display_name')
      .eq('id', senderUserId)
      .single();
    if (senderProfile?.display_name) {
      senderName = senderProfile.display_name;
    }
  } catch (e) {
    console.warn('Could not fetch sender profile:', e);
  }

  let finalTitle = title;
  let finalBody = body;
  if (!finalTitle) {
    if (type === 'love_note') finalTitle = `${senderName} vous a envoyé une note d'amour ❤️`;
    else if (type === 'memory') finalTitle = `Nouveau souvenir partagé par ${senderName} ✨`;
    else finalTitle = 'Deux - Espace Couple';
  }
  if (!finalBody) {
    if (type === 'love_note') finalBody = 'Un tendre mot doux vient de vous être envoyé.';
    else if (type === 'memory') finalBody = 'Un nouveau souvenir a été immortalisé dans votre album.';
    else finalBody = 'Une nouvelle activité a été partagée dans votre couple.';
  }

  const finalIcon = icon || '/pwa-192x192.png';
  const finalUrl =
    url ||
    (type === 'love_note' ? '/?tab=notes' : type === 'memory' ? '/?tab=timeline' : '/');

  // Save to notification history
  const newNotif: CoupleNotification = {
    id: 'notif_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now(),
    coupleId,
    senderUserId,
    senderName,
    type,
    title: finalTitle,
    body: finalBody,
    icon: finalIcon,
    url: finalUrl,
    metadata,
    isRead: false,
    createdAt: new Date().toISOString(),
  };

  const currentNotifs = getNotificationsList();
  saveNotificationsList([newNotif, ...currentNotifs]);

  // Find partner's push subscriptions
  const allSubs = getSubscriptions();
  const targetSubs = allSubs.filter(
    (sub) => sub.coupleId === coupleId && sub.userId !== senderUserId
  );

  if (targetSubs.length === 0) {
    return { sentCount: 0, notification: newNotif };
  }

  const payload = JSON.stringify({
    title: finalTitle,
    body: finalBody,
    icon: finalIcon,
    badge: '/pwa-192x192.png',
    url: finalUrl,
    type,
    notificationId: newNotif.id,
    senderName,
    timestamp: Date.now(),
  });

  const expiredEndpoints = new Set<string>();
  let sentCount = 0;

  await Promise.allSettled(
    targetSubs.map(async (subRecord) => {
      try {
        await webpush.sendNotification(subRecord.subscription, payload);
        sentCount++;
      } catch (err: any) {
        console.warn('Push delivery failed for endpoint:', err?.statusCode, err?.message);
        if (err?.statusCode === 404 || err?.statusCode === 410) {
          expiredEndpoints.add(subRecord.subscription.endpoint);
        }
      }
    })
  );

  if (expiredEndpoints.size > 0) {
    const activeSubs = allSubs.filter((s) => !expiredEndpoints.has(s.subscription.endpoint));
    saveSubscriptions(activeSubs);
  }

  return { sentCount, notification: newNotif };
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', pwa: true, timestamp: new Date().toISOString() });
});

// Safe public config endpoint
app.get('/api/config', (req, res) => {
  res.json({
    supabaseUrl: SUPABASE_URL,
    supabaseAnonKey: SUPABASE_ANON_KEY,
  });
});

// Fast auto-confirmed signup endpoint so users are never blocked by email confirmation
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, displayName } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe requis.' });
    }

    // Use admin client to create user with email auto-confirmed
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        display_name: displayName || email.split('@')[0],
      },
    });

    if (error) {
      // If user already exists, inform client
      return res.status(400).json({ error: error.message });
    }

    // Ensure profile row exists
    if (data.user) {
      await supabaseAdmin.from('profiles').upsert({
        id: data.user.id,
        display_name: displayName || email.split('@')[0],
      });
    }

    res.json({
      success: true,
      user: {
        id: data.user?.id,
        email: data.user?.email,
        displayName: displayName || email.split('@')[0],
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur interne du serveur';
    res.status(500).json({ error: message });
  }
});

// Check invite code
app.get('/api/couple/invite-info/:code', async (req, res) => {
  try {
    const code = req.params.code?.toUpperCase().trim();
    if (!code) return res.status(400).json({ error: 'Code invalide' });

    const { data, error } = await supabaseAdmin
      .from('couples')
      .select('id, name, started_at, invite_code')
      .ilike('invite_code', code)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Code invitation introuvable' });
    }

    // Check member count
    const { count } = await supabaseAdmin
      .from('couple_members')
      .select('*', { count: 'exact', head: true })
      .eq('couple_id', data.id);

    if ((count || 0) >= 2) {
      return res.status(400).json({ error: 'Ce couple a déjà ses 2 partenaires' });
    }

    res.json({
      couple: {
        id: data.id,
        name: data.name,
        startedAt: data.started_at,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur serveur';
    res.status(500).json({ error: message });
  }
});

// Fetch all couple data for a user (profile, couple, members, memories, notes, bucket items)
app.get('/api/couple/data', async (req, res) => {
  try {
    const userId = req.query.userId as string;
    if (!userId) {
      return res.status(400).json({ error: 'userId requis' });
    }

    // 1. Get profile
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    // 2. Check couple membership
    const { data: memberRows, error: memberErr } = await supabaseAdmin
      .from('couple_members')
      .select('couple_id, role, joined_at')
      .eq('user_id', userId);

    if (memberErr || !memberRows || memberRows.length === 0) {
      return res.json({ profile, couple: null, members: [], memories: [], loveNotes: [], bucketList: [] });
    }

    const coupleId = memberRows[0].couple_id;

    // 3. Fetch couple details
    const { data: couple } = await supabaseAdmin
      .from('couples')
      .select('*')
      .eq('id', coupleId)
      .single();

    if (!couple) {
      return res.json({ profile, couple: null, members: [], memories: [], loveNotes: [], bucketList: [] });
    }

    // 4. Fetch all couple members with their profiles
    const { data: membersRaw } = await supabaseAdmin
      .from('couple_members')
      .select('couple_id, user_id, role, joined_at')
      .eq('couple_id', coupleId);

    let members: any[] = [];
    if (membersRaw && membersRaw.length > 0) {
      const userIds = membersRaw.map((m) => m.user_id);
      const { data: memberProfiles } = await supabaseAdmin
        .from('profiles')
        .select('id, display_name, avatar_url')
        .in('id', userIds);

      const profileMap = new Map((memberProfiles || []).map((p) => [p.id, p]));
      members = membersRaw.map((m) => ({
        ...m,
        profile: profileMap.get(m.user_id) || { id: m.user_id, display_name: 'Partenaire' },
      }));
    }

    // 5. Fetch memories, notes, bucket list in parallel
    const [memoriesRes, notesRes, bucketRes] = await Promise.all([
      supabaseAdmin
        .from('memories')
        .select('*')
        .eq('couple_id', coupleId)
        .order('date', { ascending: false }),
      supabaseAdmin
        .from('love_notes')
        .select('*')
        .eq('couple_id', coupleId)
        .order('created_at', { ascending: false }),
      supabaseAdmin
        .from('bucket_list')
        .select('*')
        .eq('couple_id', coupleId)
        .order('created_at', { ascending: false }),
    ]);

    res.json({
      profile,
      couple,
      members,
      memories: memoriesRes.data || [],
      loveNotes: notesRes.data || [],
      bucketList: bucketRes.data || [],
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur serveur';
    res.status(500).json({ error: message });
  }
});

// Create new couple
app.post('/api/couple/create', async (req, res) => {
  try {
    const { userId, name, startedAt } = req.body;
    if (!userId || !name) {
      return res.status(400).json({ error: 'userId et nom requis' });
    }

    // Generate unique 6-character alphanumeric code
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    // Insert couple
    const { data: newCouple, error: coupleErr } = await supabaseAdmin
      .from('couples')
      .insert({
        name: name.trim(),
        started_at: startedAt || new Date().toISOString().split('T')[0],
        invite_code: inviteCode,
      })
      .select()
      .single();

    if (coupleErr || !newCouple) {
      throw new Error(coupleErr?.message || 'Erreur création couple');
    }

    // Insert member as owner
    const { error: memberErr } = await supabaseAdmin
      .from('couple_members')
      .insert({
        couple_id: newCouple.id,
        user_id: userId,
        role: 'owner',
      });

    if (memberErr) {
      throw new Error(memberErr.message);
    }

    res.json({ success: true, couple: newCouple });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur création couple';
    res.status(500).json({ error: message });
  }
});

// Join couple with invite code
app.post('/api/couple/join', async (req, res) => {
  try {
    const { userId, inviteCode } = req.body;
    if (!userId || !inviteCode) {
      return res.status(400).json({ error: 'userId et code d\'invitation requis' });
    }

    const cleanCode = inviteCode.trim().toUpperCase();

    // Find couple by code
    const { data: targetCouple, error: findErr } = await supabaseAdmin
      .from('couples')
      .select('*')
      .ilike('invite_code', cleanCode)
      .single();

    if (findErr || !targetCouple) {
      return res.status(404).json({ error: "Code d'invitation introuvable ou expiré" });
    }

    // Check existing members
    const { data: existingMembers } = await supabaseAdmin
      .from('couple_members')
      .select('*')
      .eq('couple_id', targetCouple.id);

    if (existingMembers && existingMembers.length >= 2) {
      return res.status(400).json({ error: 'Cet espace couple compte déjà 2 partenaires.' });
    }

    const isAlreadyMember = (existingMembers || []).some((m) => m.user_id === userId);
    if (!isAlreadyMember) {
      const { error: joinErr } = await supabaseAdmin
        .from('couple_members')
        .insert({
          couple_id: targetCouple.id,
          user_id: userId,
          role: 'partner',
        });

      if (joinErr) throw joinErr;
    }

    res.json({ success: true, couple: targetCouple });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur pour rejoindre le couple';
    res.status(500).json({ error: message });
  }
});

// Update couple start date
app.put('/api/couple/:id/date', async (req, res) => {
  try {
    const { id } = req.params;
    const { startedAt } = req.body;
    const { data, error } = await supabaseAdmin
      .from('couples')
      .update({ started_at: startedAt, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, couple: data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur mise à jour';
    res.status(500).json({ error: message });
  }
});

// Update user profile
app.put('/api/profiles/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { displayName, avatarUrl } = req.body;
    const updatePayload: any = {};
    if (displayName) updatePayload.display_name = displayName;
    if (avatarUrl) updatePayload.avatar_url = avatarUrl;

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, profile: data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur mise à jour profil';
    res.status(500).json({ error: message });
  }
});

// Create memory
app.post('/api/memories/create', async (req, res) => {
  try {
    const { coupleId, userId, title, description, date, mediaUrl, thumbnailUrl, category, location } = req.body;
    const { data, error } = await supabaseAdmin
      .from('memories')
      .insert({
        couple_id: coupleId,
        user_id: userId,
        title,
        description: description || null,
        date: date || new Date().toISOString().split('T')[0],
        media_url: mediaUrl || '',
        thumbnail_url: thumbnailUrl || mediaUrl || '',
        category: category || 'Date',
        location: location || null,
        is_favorite: false,
      })
      .select()
      .single();

    if (error) throw error;

    // Trigger push notification to partner in background
    notifyCoupleMembers({
      coupleId,
      senderUserId: userId,
      type: 'memory',
      title: undefined, // uses dynamic sender name
      body: title ? `"${title}" a été ajouté à votre journal de couple.` : 'Un nouveau souvenir a été immortalisé !',
      icon: thumbnailUrl || mediaUrl || '/pwa-192x192.png',
      url: '/?tab=timeline',
      metadata: { memoryId: data.id, title },
    }).catch((err) => console.error('Error triggering memory push notification:', err));

    res.json({ success: true, memory: data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur ajout souvenir';
    res.status(500).json({ error: message });
  }
});

// Toggle memory favorite
app.put('/api/memories/:id/favorite', async (req, res) => {
  try {
    const { id } = req.params;
    const { isFavorite } = req.body;
    const { data, error } = await supabaseAdmin
      .from('memories')
      .update({ is_favorite: isFavorite })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, memory: data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur';
    res.status(500).json({ error: message });
  }
});

// Delete memory
app.delete('/api/memories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabaseAdmin.from('memories').delete().eq('id', id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur suppression';
    res.status(500).json({ error: message });
  }
});

// Create love note
app.post('/api/notes/create', async (req, res) => {
  try {
    const { coupleId, userId, mood, message } = req.body;
    const { data, error } = await supabaseAdmin
      .from('love_notes')
      .insert({
        couple_id: coupleId,
        user_id: userId,
        mood: mood || '❤️',
        message: message || '',
        is_read: false,
      })
      .select()
      .single();

    if (error) throw error;

    // Trigger push notification to partner in background
    notifyCoupleMembers({
      coupleId,
      senderUserId: userId,
      type: 'love_note',
      title: undefined, // uses dynamic sender name
      body: message
        ? message.length > 90
          ? message.slice(0, 87) + '...'
          : message
        : 'Un doux mot d\'amour vient d\'arriver ❤️',
      icon: '/pwa-192x192.png',
      url: '/?tab=notes',
      metadata: { noteId: data.id, mood: mood || '❤️' },
    }).catch((err) => console.error('Error triggering note push notification:', err));

    res.json({ success: true, note: data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur envoi note';
    res.status(500).json({ error: message });
  }
});

// ==========================================
// PUSH NOTIFICATIONS & IN-APP ALERTS ROUTES
// ==========================================

// Get VAPID public key
app.get('/api/push/vapid-public-key', (req, res) => {
  res.json({ publicKey: VAPID_PUBLIC_KEY });
});

// Subscribe to push notifications
app.post('/api/push/subscribe', (req, res) => {
  try {
    const { userId, coupleId, subscription, userAgent } = req.body;
    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return res.status(400).json({ error: 'Souscription Push invalide' });
    }
    if (!userId || !coupleId) {
      return res.status(400).json({ error: 'userId et coupleId requis' });
    }

    const currentSubs = getSubscriptions();
    // Remove any existing subscription with this exact endpoint
    const filtered = currentSubs.filter((s) => s.subscription.endpoint !== subscription.endpoint);

    const newSubRecord: PushSubRecord = {
      id: 'sub_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now(),
      userId,
      coupleId,
      subscription,
      userAgent: userAgent || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    filtered.push(newSubRecord);
    saveSubscriptions(filtered);

    res.json({ success: true, id: newSubRecord.id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur enregistrement souscription';
    res.status(500).json({ error: message });
  }
});

// Unsubscribe from push notifications
app.post('/api/push/unsubscribe', (req, res) => {
  try {
    const { userId, endpoint } = req.body;
    const currentSubs = getSubscriptions();
    let updated: PushSubRecord[];

    if (endpoint) {
      updated = currentSubs.filter((s) => s.subscription.endpoint !== endpoint);
    } else if (userId) {
      updated = currentSubs.filter((s) => s.userId !== userId);
    } else {
      return res.status(400).json({ error: 'Paramètre endpoint ou userId manquant' });
    }

    saveSubscriptions(updated);
    res.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur désabonnement';
    res.status(500).json({ error: message });
  }
});

// Check push subscription status for a user
app.get('/api/push/status', (req, res) => {
  try {
    const userId = req.query.userId as string;
    if (!userId) return res.status(400).json({ error: 'userId manquant' });

    const currentSubs = getSubscriptions();
    const userSubs = currentSubs.filter((s) => s.userId === userId);

    res.json({
      isSubscribed: userSubs.length > 0,
      activeDevicesCount: userSubs.length,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur statut push';
    res.status(500).json({ error: message });
  }
});

// Send a test push notification to user's devices
app.post('/api/push/test', async (req, res) => {
  try {
    const { userId, coupleId } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId manquant' });

    const allSubs = getSubscriptions();
    const targetSubs = allSubs.filter((s) => s.userId === userId);

    const testPayload = JSON.stringify({
      title: 'Deux ❤️ - Test de notification',
      body: 'Félicitations ! Les notifications push sont prêtes. Vous recevrez une alerte pour chaque mot doux et souvenir partagé.',
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      url: '/',
      type: 'test',
      timestamp: Date.now(),
    });

    // Record in in-app notification center as well
    if (coupleId) {
      const currentNotifs = getNotificationsList();
      currentNotifs.unshift({
        id: 'notif_test_' + Date.now(),
        coupleId,
        senderUserId: userId,
        senderName: 'Système Deux',
        type: 'test',
        title: 'Test de notification réussi ✨',
        body: 'Vos notifications push et alertes en direct sont opérationnelles sur cet appareil.',
        icon: '/pwa-192x192.png',
        url: '/',
        isRead: false,
        createdAt: new Date().toISOString(),
      });
      saveNotificationsList(currentNotifs);
    }

    if (targetSubs.length === 0) {
      return res.json({
        success: true,
        sentCount: 0,
        message: 'Aucune souscription active trouvée pour cet utilisateur. Veuillez d\'abord autoriser les notifications.',
      });
    }

    let sentCount = 0;
    const expiredEndpoints = new Set<string>();

    await Promise.allSettled(
      targetSubs.map(async (sub) => {
        try {
          await webpush.sendNotification(sub.subscription, testPayload);
          sentCount++;
        } catch (err: any) {
          console.warn('Test push delivery failed:', err?.statusCode, err?.message);
          if (err?.statusCode === 404 || err?.statusCode === 410) {
            expiredEndpoints.add(sub.subscription.endpoint);
          }
        }
      })
    );

    if (expiredEndpoints.size > 0) {
      const activeSubs = allSubs.filter((s) => !expiredEndpoints.has(s.subscription.endpoint));
      saveSubscriptions(activeSubs);
    }

    res.json({
      success: true,
      sentCount,
      targetCount: targetSubs.length,
      message: `Notification envoyée à ${sentCount} appareil(s)`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur test push';
    res.status(500).json({ error: message });
  }
});

// Get couple notifications list
app.get('/api/couple/:id/notifications', (req, res) => {
  try {
    const coupleId = req.params.id;
    const allNotifs = getNotificationsList();
    const coupleNotifs = allNotifs.filter((n) => n.coupleId === coupleId);

    res.json({ notifications: coupleNotifs.slice(0, 50) });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur récupération notifications';
    res.status(500).json({ error: message });
  }
});

// Mark notification as read
app.put('/api/notifications/:id/read', (req, res) => {
  try {
    const notifId = req.params.id;
    const allNotifs = getNotificationsList();
    const notif = allNotifs.find((n) => n.id === notifId);
    if (notif) {
      notif.isRead = true;
      saveNotificationsList(allNotifs);
    }
    res.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur';
    res.status(500).json({ error: message });
  }
});

// Mark all couple notifications as read
app.put('/api/couple/:id/notifications/read-all', (req, res) => {
  try {
    const coupleId = req.params.id;
    const allNotifs = getNotificationsList();
    allNotifs.forEach((n) => {
      if (n.coupleId === coupleId) {
        n.isRead = true;
      }
    });
    saveNotificationsList(allNotifs);
    res.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur';
    res.status(500).json({ error: message });
  }
});

// Mark love note as read
app.put('/api/notes/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabaseAdmin
      .from('love_notes')
      .update({ is_read: true })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, note: data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur';
    res.status(500).json({ error: message });
  }
});

// Create bucket item
app.post('/api/bucket/create', async (req, res) => {
  try {
    const { coupleId, userId, title, category, targetDate, notes } = req.body;
    const { data, error } = await supabaseAdmin
      .from('bucket_list')
      .insert({
        couple_id: coupleId,
        user_id: userId,
        title,
        category: category || 'Voyage',
        is_completed: false,
        target_date: targetDate || null,
        notes: notes || null,
      })
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, item: data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur ajout bucket';
    res.status(500).json({ error: message });
  }
});

// Toggle bucket item completed
app.put('/api/bucket/:id/toggle', async (req, res) => {
  try {
    const { id } = req.params;
    const { isCompleted } = req.body;
    const { data, error } = await supabaseAdmin
      .from('bucket_list')
      .update({ is_completed: isCompleted })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, item: data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur';
    res.status(500).json({ error: message });
  }
});

// Delete bucket item
app.delete('/api/bucket/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabaseAdmin.from('bucket_list').delete().eq('id', id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur suppression bucket';
    res.status(500).json({ error: message });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
