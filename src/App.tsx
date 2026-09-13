import React, { useState, useEffect, useCallback } from 'react';
import { supabase, localCache } from './lib/supabase';
import { UserProfile, Couple, CoupleMember, Memory, LoveNote, BucketItem, CoupleNotification } from './types';
import { Header } from './components/Header';
import { BottomNav, NavTab } from './components/BottomNav';
import { DashboardTab } from './components/DashboardTab';
import { MemoriesTab } from './components/MemoriesTab';
import { LoveNotesTab } from './components/LoveNotesTab';
import { BucketListTab } from './components/BucketListTab';
import { CoupleSettingsTab } from './components/CoupleSettingsTab';
import { CreateMemoryModal } from './components/CreateMemoryModal';
import { NotificationBanner } from './components/NotificationBanner';
import { NotificationsModal } from './components/NotificationsModal';
import { AuthView } from './components/AuthView';
import { CoupleOnboarding } from './components/CoupleOnboarding';
import { OfflineIndicator } from './components/OfflineIndicator';
import { checkPushSubscriptionStatus, playNotificationChime } from './lib/pushService';
import { useTheme } from './hooks/useTheme';
import { Loader2 } from 'lucide-react';

export default function App() {
  const { theme, isDark, setTheme, toggleTheme } = useTheme();
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(() => localCache.get('PROFILE'));
  const [couple, setCouple] = useState<Couple | null>(() => localCache.get('COUPLE'));
  const [members, setMembers] = useState<CoupleMember[]>(() => localCache.get('MEMBERS') || []);
  const [memories, setMemories] = useState<Memory[]>(() => localCache.get('MEMORIES') || []);
  const [loveNotes, setLoveNotes] = useState<LoveNote[]>(() => localCache.get('LOVE_NOTES') || []);
  const [bucketList, setBucketList] = useState<BucketItem[]>(() => localCache.get('BUCKET_LIST') || []);

  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [isAddMemoryOpen, setIsAddMemoryOpen] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Push Notifications & In-App Alerts State
  const [notifications, setNotifications] = useState<CoupleNotification[]>([]);
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);
  const [activeBannerNotification, setActiveBannerNotification] = useState<CoupleNotification | null>(null);
  const [isPushSubscribed, setIsPushSubscribed] = useState(false);

  // 1. Listen for Supabase auth state changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoadingAuth(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setIsLoadingAuth(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 2. Fetch full couple data when user is authenticated
  const loadCoupleData = useCallback(async (userId: string) => {
    setIsLoadingData(true);
    try {
      // Fetch via server endpoint to bypass PostgreSQL RLS recursion
      const res = await fetch(`/api/couple/data?userId=${userId}`);
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        if (data.profile) {
          setProfile(data.profile as UserProfile);
          localCache.set('PROFILE', data.profile);
        }

        if (data.couple) {
          setCouple(data.couple as Couple);
          localCache.set('COUPLE', data.couple);
          setMembers(data.members || []);
          localCache.set('MEMBERS', data.members || []);

          // Utiliser uniquement les données réellement créées par le couple.
          // Aucun contenu de démonstration n'est injecté si les listes sont vides.
          const mems = (data.memories || []) as Memory[];
          setMemories(mems);
          localCache.set('MEMORIES', mems);

          const notes = (data.loveNotes || []) as LoveNote[];
          setLoveNotes(notes);
          localCache.set('LOVE_NOTES', notes);

          const buckets = (data.bucketList || []) as BucketItem[];
          setBucketList(buckets);
          localCache.set('BUCKET_LIST', buckets);

          // Fetch notifications history for this couple
          fetch(`/api/couple/${data.couple.id}/notifications`)
            .then(async (r) => {
              if (r.ok && (r.headers.get('content-type') || '').includes('application/json')) {
                return r.json();
              }
              return null;
            })
            .then((d) => {
              if (d?.notifications) setNotifications(d.notifications);
            })
            .catch(() => {});

          // Check push subscription
          checkPushSubscriptionStatus(userId)
            .then((sub) => setIsPushSubscribed(sub))
            .catch(() => {});
        } else {
          setCouple(null);
        }
      } else {
        // Fallback to local cache if offline or server responding with non-JSON
        const cachedCouple = localCache.get<Couple>('COUPLE');
        if (cachedCouple) setCouple(cachedCouple);
        const cachedProfile = localCache.get<UserProfile>('PROFILE');
        if (cachedProfile) setProfile(cachedProfile);
        const cachedMembers = localCache.get<CoupleMember[]>('MEMBERS');
        if (cachedMembers) setMembers(cachedMembers);
        const cachedMemories = localCache.get<Memory[]>('MEMORIES');
        if (cachedMemories) setMemories(cachedMemories);
        const cachedNotes = localCache.get<LoveNote[]>('LOVE_NOTES');
        if (cachedNotes) setLoveNotes(cachedNotes);
        const cachedBuckets = localCache.get<BucketItem[]>('BUCKET_LIST');
        if (cachedBuckets) setBucketList(cachedBuckets);
      }
    } catch (err) {
      console.error('Error loading couple data:', err);
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  useEffect(() => {
    if (session?.user?.id) {
      loadCoupleData(session.user.id);
    }
  }, [session, loadCoupleData]);

  // Listen for Service Worker push events and navigation commands
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    const handleServiceWorkerMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data) return;

      if (data.type === 'PUSH_NOTIFICATION_RECEIVED' && data.notification) {
        playNotificationChime();
        const incoming = data.notification as CoupleNotification;
        setActiveBannerNotification(incoming);

        // Prepend to notifications list
        setNotifications((prev) => [
          {
            id: 'push_' + Date.now(),
            coupleId: couple?.id || '',
            senderUserId: '',
            senderName: incoming.title || 'Partenaire',
            type: incoming.type || 'love_note',
            title: incoming.title,
            body: incoming.body,
            icon: incoming.icon,
            url: incoming.url || '/',
            isRead: false,
            createdAt: incoming.createdAt || new Date().toISOString(),
          },
          ...prev,
        ]);

        // Refresh couple data automatically
        if (session?.user?.id) {
          loadCoupleData(session.user.id);
        }
      } else if (data.type === 'NOTIFICATION_NAVIGATE') {
        const url = data.url || '';
        if (url.includes('notes')) {
          setActiveTab('notes');
        } else if (url.includes('timeline') || url.includes('memories')) {
          setActiveTab('memories');
        } else if (url.includes('bucket')) {
          setActiveTab('bucket');
        }
      }
    };

    navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
    return () => {
      navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
    };
  }, [couple?.id, session?.user?.id, loadCoupleData]);

  // Notification helper handlers
  const handleMarkAllNotificationsRead = async () => {
    if (!couple) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    try {
      await fetch(`/api/couple/${couple.id}/notifications/read-all`, { method: 'PUT' });
    } catch (e) {
      console.warn('Error marking notifications as read:', e);
    }
  };

  const handleNotificationItemClick = (notif: CoupleNotification) => {
    // Mark this one as read
    setNotifications((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
    );
    fetch(`/api/notifications/${notif.id}/read`, { method: 'PUT' }).catch(() => {});

    // Navigate to target tab
    if (notif.type === 'love_note' || notif.url?.includes('notes')) {
      setActiveTab('notes');
    } else if (notif.type === 'memory' || notif.url?.includes('timeline')) {
      setActiveTab('memories');
    } else if (notif.type === 'bucket_item' || notif.url?.includes('bucket')) {
      setActiveTab('bucket');
    }
  };

  // Real-time subscription for couple changes
  useEffect(() => {
    if (!couple?.id) return;

    const channel = supabase
      .channel(`couple_${couple.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', filter: `couple_id=eq.${couple.id}` },
        () => {
          if (session?.user?.id) {
            loadCoupleData(session.user.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [couple?.id, session?.user?.id, loadCoupleData]);

  // Actions
  const handleSendQuickNote = async (mood: string, message: string) => {
    if (!couple || !session?.user) return;

    const newNote: LoveNote = {
      id: 'temp_' + Date.now(),
      couple_id: couple.id,
      user_id: session.user.id,
      message,
      mood,
      is_read: false,
      created_at: new Date().toISOString(),
    };

    setLoveNotes((prev) => [newNote, ...prev]);

    try {
      const res = await fetch('/api/notes/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coupleId: couple.id,
          userId: session.user.id,
          mood,
          message,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.note) {
          setLoveNotes((prev) => prev.map((n) => (n.id === newNote.id ? (json.note as LoveNote) : n)));
          return;
        }
      }
    } catch (e) {
      console.warn('Server note creation failed, falling back:', e);
    }

    const { data } = await supabase
      .from('love_notes')
      .insert({
        couple_id: couple.id,
        user_id: session.user.id,
        mood,
        message,
      })
      .select()
      .single();

    if (data) {
      setLoveNotes((prev) => prev.map((n) => (n.id === newNote.id ? (data as LoveNote) : n)));
      localCache.set('LOVE_NOTES', [data as LoveNote, ...loveNotes.filter((n) => n.id !== newNote.id)]);
    }
  };

  const handleToggleFavoriteMemory = async (memoryId: string, currentVal: boolean) => {
    setMemories((prev) =>
      prev.map((m) => (m.id === memoryId ? { ...m, is_favorite: !currentVal } : m))
    );

    try {
      await fetch(`/api/memories/${memoryId}/favorite`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFavorite: !currentVal }),
      });
    } catch {
      await supabase
        .from('memories')
        .update({ is_favorite: !currentVal })
        .eq('id', memoryId);
    }
  };

  const handleDeleteMemory = async (memoryId: string) => {
    setMemories((prev) => prev.filter((m) => m.id !== memoryId));
    try {
      await fetch(`/api/memories/${memoryId}`, { method: 'DELETE' });
    } catch {
      await supabase.from('memories').delete().eq('id', memoryId);
    }
  };

  const handleAddBucketItem = async (
    title: string,
    category: string,
    targetDate?: string,
    notes?: string
  ) => {
    if (!couple || !session?.user) return;

    const tempItem: BucketItem = {
      id: 'temp_' + Date.now(),
      couple_id: couple.id,
      user_id: session.user.id,
      title,
      category,
      is_completed: false,
      target_date: targetDate || null,
      notes: notes || null,
      created_at: new Date().toISOString(),
    };

    setBucketList((prev) => [tempItem, ...prev]);

    try {
      const res = await fetch('/api/bucket/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coupleId: couple.id,
          userId: session.user.id,
          title,
          category,
          targetDate,
          notes,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.item) {
          setBucketList((prev) => prev.map((b) => (b.id === tempItem.id ? (json.item as BucketItem) : b)));
          return;
        }
      }
    } catch (e) {
      console.warn('Server bucket creation failed, trying fallback:', e);
    }

    const { data } = await supabase
      .from('bucket_list')
      .insert({
        couple_id: couple.id,
        user_id: session.user.id,
        title,
        category,
        is_completed: false,
        target_date: targetDate || null,
        notes: notes || null,
      })
      .select()
      .single();

    if (data) {
      setBucketList((prev) => prev.map((b) => (b.id === tempItem.id ? (data as BucketItem) : b)));
    }
  };

  const handleToggleBucketComplete = async (itemId: string, currentState: boolean) => {
    setBucketList((prev) =>
      prev.map((b) => (b.id === itemId ? { ...b, is_completed: !currentState } : b))
    );

    try {
      await fetch(`/api/bucket/${itemId}/toggle`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isCompleted: !currentState }),
      });
    } catch {
      await supabase
        .from('bucket_list')
        .update({ is_completed: !currentState })
        .eq('id', itemId);
    }
  };

  const handleDeleteBucketItem = async (itemId: string) => {
    setBucketList((prev) => prev.filter((b) => b.id !== itemId));
    try {
      await fetch(`/api/bucket/${itemId}`, { method: 'DELETE' });
    } catch {
      await supabase.from('bucket_list').delete().eq('id', itemId);
    }
  };

  const handleUpdateCoupleDate = async (newDate: string) => {
    if (!couple) return;
    setCouple({ ...couple, started_at: newDate });

    try {
      await fetch(`/api/couple/${couple.id}/date`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startedAt: newDate }),
      });
    } catch {
      await supabase
        .from('couples')
        .update({ started_at: newDate, updated_at: new Date().toISOString() })
        .eq('id', couple.id);
    }
  };

  const handleUpdateProfile = async (name: string, avatarUrl?: string) => {
    if (!session?.user) return;
    const updated = {
      display_name: name,
      ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
    };

    setProfile((prev) => (prev ? { ...prev, ...updated } : null));

    try {
      await fetch(`/api/profiles/${session.user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName: name, avatarUrl }),
      });
    } catch {
      await supabase
        .from('profiles')
        .update(updated)
        .eq('id', session.user.id);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
    setCouple(null);
    setMembers([]);
    setMemories([]);
    setLoveNotes([]);
    setBucketList([]);
    localCache.clear();
  };

  // If initial auth is loading
  if (isLoadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-rose-50/50">
        <div className="flex flex-col items-center gap-3 text-rose-600">
          <Loader2 className="w-8 h-8 animate-spin" />
          <p className="text-xs font-semibold">Chargement de votre espace couple...</p>
        </div>
      </div>
    );
  }

  // If not logged in -> Show Authentication View
  if (!session) {
    return <AuthView onSuccess={() => {}} />;
  }

  // If logged in but no couple assigned -> Show Couple Onboarding View
  if (!couple) {
    return (
      <div className="min-h-screen bg-linear-to-b from-rose-50 via-white to-rose-50/30">
        <OfflineIndicator />
        <CoupleOnboarding
          userId={session.user.id}
          onCoupleReady={() => loadCoupleData(session.user.id)}
        />
      </div>
    );
  }

  const unreadNotesCount = loveNotes.filter(
    (n) => n.user_id !== session.user.id && !n.is_read
  ).length;

  const unreadNotificationCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="min-h-screen bg-[#fff9f9] text-stone-800 font-sans flex flex-col selection:bg-rose-100 selection:text-rose-900 pb-24">
      {/* Offline Indicator */}
      <OfflineIndicator />

      {/* Floating In-App Push Notification Banner */}
      <NotificationBanner
        notification={activeBannerNotification}
        onClose={() => setActiveBannerNotification(null)}
        onNavigate={(url) => {
          if (url.includes('notes')) {
            setActiveTab('notes');
          } else if (url.includes('timeline') || url.includes('memories')) {
            setActiveTab('memories');
          } else if (url.includes('bucket')) {
            setActiveTab('bucket');
          }
        }}
      />

      {/* Top Header with Notification Bell */}
      <Header
        coupleName={couple.name}
        currentUserId={session.user.id}
        members={members}
        onOpenProfile={() => setActiveTab('couple')}
        unreadNotificationCount={unreadNotificationCount}
        onOpenNotifications={() => setIsNotificationsModalOpen(true)}
        isDark={isDark}
        onToggleTheme={toggleTheme}
      />

      {/* Main Container */}
      <main className="flex-1 w-full max-w-md mx-auto px-4 pt-4">
        {activeTab === 'home' && (
          <DashboardTab
            couple={couple}
            currentUserId={session.user.id}
            members={members}
            memories={memories}
            loveNotes={loveNotes}
            bucketList={bucketList}
            onNavigate={(tab) => setActiveTab(tab)}
            onSendQuickNote={handleSendQuickNote}
            onOpenAddMemory={() => setIsAddMemoryOpen(true)}
            onOpenAddBucket={() => setActiveTab('bucket')}
          />
        )}

        {activeTab === 'memories' && (
          <MemoriesTab
            memories={memories}
            onOpenAddModal={() => setIsAddMemoryOpen(true)}
            onToggleFavorite={handleToggleFavoriteMemory}
            onDeleteMemory={handleDeleteMemory}
          />
        )}

        {activeTab === 'notes' && (
          <LoveNotesTab
            loveNotes={loveNotes}
            currentUserId={session.user.id}
            members={members}
            onSendNote={handleSendQuickNote}
            onMarkAsRead={async (noteId) => {
              setLoveNotes((prev) =>
                prev.map((n) => (n.id === noteId ? { ...n, is_read: true } : n))
              );
              try {
                await fetch(`/api/notes/${noteId}/read`, { method: 'PUT' });
              } catch {
                await supabase
                  .from('love_notes')
                  .update({ is_read: true })
                  .eq('id', noteId);
              }
            }}
          />
        )}

        {activeTab === 'bucket' && (
          <BucketListTab
            bucketList={bucketList}
            onAddBucketItem={handleAddBucketItem}
            onToggleComplete={handleToggleBucketComplete}
            onDeleteBucketItem={handleDeleteBucketItem}
          />
        )}

        {activeTab === 'couple' && (
          <CoupleSettingsTab
            couple={couple}
            currentUserId={session.user.id}
            members={members}
            profile={profile}
            onUpdateCoupleDate={handleUpdateCoupleDate}
            onUpdateProfile={handleUpdateProfile}
            onSignOut={handleSignOut}
            theme={theme}
            onSetTheme={setTheme}
          />
        )}
      </main>

      {/* Create Memory Modal */}
      <CreateMemoryModal
        coupleId={couple.id}
        userId={session.user.id}
        isOpen={isAddMemoryOpen}
        onClose={() => setIsAddMemoryOpen(false)}
        onMemoryCreated={(newMemory) => {
          setMemories((prev) => [newMemory, ...prev]);
        }}
      />

      {/* Mobile Bottom Navigation Bar */}
      <BottomNav
        activeTab={activeTab}
        onChangeTab={(t) => setActiveTab(t)}
        unreadNotesCount={unreadNotesCount}
      />

      {/* Notifications Drawer Modal */}
      <NotificationsModal
        isOpen={isNotificationsModalOpen}
        onClose={() => setIsNotificationsModalOpen(false)}
        notifications={notifications}
        onNotificationClick={handleNotificationItemClick}
        onMarkAllAsRead={handleMarkAllNotificationsRead}
        onOpenPushSettings={() => setActiveTab('couple')}
        isPushSubscribed={isPushSubscribed}
      />
    </div>
  );
}
