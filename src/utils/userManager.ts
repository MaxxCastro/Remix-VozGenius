import { UserProfile } from '../types/tts.ts';

const STORAGE_USERS_KEY = 'vozgenius_user_accounts';
const STORAGE_ACTIVE_USER_KEY = 'vozgenius_active_user_id';

const DEFAULT_DAILY_VOICE_QUOTA = 25;
const DEFAULT_DAILY_AI_QUOTA = 50;

function getTodayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function getAllUsers(): UserProfile[] {
  try {
    const raw = localStorage.getItem(STORAGE_USERS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.warn('Error reading users from storage:', e);
    return [];
  }
}

export function saveUsers(users: UserProfile[]) {
  try {
    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
  } catch (e) {
    console.warn('Error saving users to storage:', e);
  }
}

export function getActiveUser(): UserProfile | null {
  const users = getAllUsers();
  const activeId = localStorage.getItem(STORAGE_ACTIVE_USER_KEY);
  
  let user: UserProfile | undefined;
  if (activeId) {
    user = users.find((u) => u.id === activeId);
  }

  // If no user found, initialize with default user (using the authenticated user email from environment)
  if (!user) {
    const initialUser: UserProfile = {
      id: 'usr_maikisson',
      name: 'Maikisson',
      email: 'maikisson12@gmail.com',
      avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=Maikisson',
      provider: 'google',
      dailyVoiceQuota: DEFAULT_DAILY_VOICE_QUOTA,
      usedVoiceQuota: 0,
      dailyAiQuota: DEFAULT_DAILY_AI_QUOTA,
      usedAiQuota: 0,
      lastActiveDate: getTodayString()
    };
    saveUsers([initialUser]);
    localStorage.setItem(STORAGE_ACTIVE_USER_KEY, initialUser.id);
    return initialUser;
  }

  // Check if daily quota needs reset (new day)
  const today = getTodayString();
  if (user.lastActiveDate !== today) {
    user.usedVoiceQuota = 0;
    user.usedAiQuota = 0;
    user.lastActiveDate = today;
    updateUser(user);
  }

  return user;
}

export function updateUser(updated: UserProfile): void {
  const users = getAllUsers();
  const index = users.findIndex((u) => u.id === updated.id);
  if (index >= 0) {
    users[index] = updated;
  } else {
    users.push(updated);
  }
  saveUsers(users);
}

export function setActiveUserId(id: string): void {
  localStorage.setItem(STORAGE_ACTIVE_USER_KEY, id);
}

export function loginWithGoogleAccount(email: string, name?: string): UserProfile {
  const users = getAllUsers();
  let user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());

  const today = getTodayString();

  if (!user) {
    const displayName = name || email.split('@')[0];
    user = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: displayName,
      email: email.toLowerCase(),
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${displayName}`,
      provider: 'google',
      dailyVoiceQuota: DEFAULT_DAILY_VOICE_QUOTA,
      usedVoiceQuota: 0,
      dailyAiQuota: DEFAULT_DAILY_AI_QUOTA,
      usedAiQuota: 0,
      lastActiveDate: today
    };
    users.push(user);
  } else if (user.lastActiveDate !== today) {
    user.usedVoiceQuota = 0;
    user.usedAiQuota = 0;
    user.lastActiveDate = today;
  }

  saveUsers(users);
  setActiveUserId(user.id);
  return user;
}

export function loginWithEmailAccount(email: string, name?: string): UserProfile {
  return loginWithGoogleAccount(email, name);
}

export function logoutUser(): void {
  localStorage.removeItem(STORAGE_ACTIVE_USER_KEY);
}

export function consumeUserVoiceQuota(amount = 1): { success: boolean; remaining: number } {
  const user = getActiveUser();
  if (!user) return { success: false, remaining: 0 };

  const remaining = Math.max(0, user.dailyVoiceQuota - user.usedVoiceQuota);
  if (remaining < amount) {
    return { success: false, remaining };
  }

  user.usedVoiceQuota += amount;
  updateUser(user);
  return { success: true, remaining: user.dailyVoiceQuota - user.usedVoiceQuota };
}

export function consumeUserAiQuota(amount = 1): { success: boolean; remaining: number } {
  const user = getActiveUser();
  if (!user) return { success: false, remaining: 0 };

  const remaining = Math.max(0, user.dailyAiQuota - user.usedAiQuota);
  if (remaining < amount) {
    return { success: false, remaining };
  }

  user.usedAiQuota += amount;
  updateUser(user);
  return { success: true, remaining: user.dailyAiQuota - user.usedAiQuota };
}
