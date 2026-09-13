export interface UserProfile {
  id: string;
  display_name: string;
  avatar_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Couple {
  id: string;
  name: string;
  started_at: string; // YYYY-MM-DD
  invite_code?: string;
  created_at: string;
  updated_at?: string;
}

export interface CoupleMember {
  couple_id: string;
  user_id: string;
  role: 'owner' | 'member';
  joined_at: string;
  profile?: UserProfile;
}

export interface Memory {
  id: string;
  couple_id: string;
  user_id: string;
  title: string;
  description?: string;
  date: string;
  media_url: string;
  thumbnail_url?: string;
  category: string;
  location?: string;
  is_favorite: boolean;
  created_at: string;
  author_name?: string;
}

export interface LoveNote {
  id: string;
  couple_id: string;
  user_id: string;
  message: string;
  mood: string;
  is_read: boolean;
  created_at: string;
  author_name?: string;
}

export interface BucketItem {
  id: string;
  couple_id: string;
  user_id: string;
  title: string;
  category: string;
  is_completed: boolean;
  target_date?: string | null;
  notes?: string | null;
  created_at: string;
}

export interface CoupleNotification {
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
