import { randomUUID, scryptSync, timingSafeEqual } from 'crypto';
import { getDb } from './mongodb';
import type { HistoryItem, Settings } from './config';
import type { Session, User } from './auth';

const USERS_COLLECTION = 'users';
const SETTINGS_COLLECTION = 'settings';
const HISTORY_COLLECTION = 'history';

const DEFAULT_SETTINGS: Settings = { theme: 'light', notifications: true };

type StoredUser = User;

function hashPassword(password: string) {
  return scryptSync(password, 'ai-or-not-salt', 64).toString('hex');
}

function verifyPassword(password: string, passwordHash: string) {
  const source = Buffer.from(hashPassword(password), 'hex');
  const target = Buffer.from(passwordHash, 'hex');
  if (source.length !== target.length) return false;
  return timingSafeEqual(source, target);
}

export function createSession(user: Pick<User, 'id' | 'name' | 'email'>, sessionDays: number): Session {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + sessionDays);
  return {
    userId: user.id,
    name: user.name,
    email: user.email,
    expiresAt: expiresAt.toISOString(),
  };
}

export async function registerUser(name: string, email: string, password: string): Promise<StoredUser> {
  const trimmedName = name.trim();
  const trimmedEmail = email.trim().toLowerCase();

  if (!trimmedName || trimmedName.length < 2) {
    throw new Error('Name must be at least 2 characters.');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    throw new Error('Please enter a valid email address.');
  }
  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters.');
  }

  const db = await getDb();
  const users = db.collection<StoredUser>(USERS_COLLECTION);

  const existing = await users.findOne({ email: trimmedEmail });
  if (existing) {
    throw new Error('An account with this email already exists.');
  }

  const user: StoredUser = {
    id: randomUUID(),
    name: trimmedName,
    email: trimmedEmail,
    passwordHash: hashPassword(password),
    createdAt: new Date().toISOString(),
  };

  await users.insertOne(user);
  await db.collection(SETTINGS_COLLECTION).updateOne(
    { userId: user.id },
    { $setOnInsert: { userId: user.id, ...DEFAULT_SETTINGS } },
    { upsert: true }
  );

  return user;
}

export async function loginUser(email: string, password: string): Promise<StoredUser> {
  const trimmedEmail = email.trim().toLowerCase();
  const db = await getDb();
  const user = await db.collection<StoredUser>(USERS_COLLECTION).findOne({ email: trimmedEmail });

  if (!user) {
    throw new Error('No account found with this email.');
  }
  if (!verifyPassword(password, user.passwordHash)) {
    throw new Error('Incorrect password.');
  }

  return user;
}

export async function getSettingsForUser(userId: string): Promise<Settings> {
  const db = await getDb();
  const stored = await db.collection(SETTINGS_COLLECTION).findOne<{ userId: string } & Settings>({ userId });
  return stored
    ? { theme: stored.theme, notifications: stored.notifications }
    : DEFAULT_SETTINGS;
}

export async function saveSettingsForUser(userId: string, settings: Partial<Settings>): Promise<Settings> {
  const merged = { ...(await getSettingsForUser(userId)), ...settings };
  const db = await getDb();
  await db.collection(SETTINGS_COLLECTION).updateOne(
    { userId },
    { $set: { userId, ...merged } },
    { upsert: true }
  );
  return merged;
}

export async function getHistoryForUser(userId: string): Promise<HistoryItem[]> {
  const db = await getDb();
  return db
    .collection<HistoryItem & { userId: string }>(HISTORY_COLLECTION)
    .find({ userId }, { projection: { _id: 0, userId: 0 } })
    .sort({ date: -1 })
    .toArray();
}

export async function addHistoryForUser(
  userId: string,
  item: Omit<HistoryItem, 'id' | 'date'>
): Promise<HistoryItem> {
  const entry: HistoryItem = {
    ...item,
    id: randomUUID(),
    date: new Date().toISOString(),
  };

  const db = await getDb();
  const history = db.collection<HistoryItem & { userId: string }>(HISTORY_COLLECTION);
  await history.insertOne({ userId, ...entry });

  const overflow = await history
    .find({ userId }, { projection: { id: 1, _id: 0 } })
    .sort({ date: -1 })
    .skip(100)
    .toArray();

  if (overflow.length) {
    await history.deleteMany({ userId, id: { $in: overflow.map((item) => item.id) } });
  }

  return entry;
}

export async function deleteHistoryForUser(userId: string, id: string) {
  const db = await getDb();
  await db.collection(HISTORY_COLLECTION).deleteOne({ userId, id });
}

export async function clearHistoryForUser(userId: string) {
  const db = await getDb();
  await db.collection(HISTORY_COLLECTION).deleteMany({ userId });
}
