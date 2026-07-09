// Cloud backup for chat sessions — write-behind persistence to Postgres via
// /api/storeChat, keyed to a stable anonymous browser id. No login required:
// the promise is just "nothing gets lost," not "synced across devices" (that
// needs real auth, which this deliberately doesn't try to be).

const ANON_USER_KEY = "cash-tropic:anon-user-id";
const CLOUD_CHAT_IDS_KEY = "cash-tropic:cloud-chat-ids";
const SAVED_COUNTS_KEY = "cash-tropic:cloud-saved-counts";

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage full/unavailable — backup is best-effort, never block the chat
  }
}

export function getAnonUserId(): string {
  let id = localStorage.getItem(ANON_USER_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(ANON_USER_KEY, id);
  }
  return id;
}

function getOrCreateCloudChatId(sessionId: string): string {
  const map = readJSON<Record<string, string>>(CLOUD_CHAT_IDS_KEY, {});
  if (!map[sessionId]) {
    map[sessionId] = crypto.randomUUID();
    writeJSON(CLOUD_CHAT_IDS_KEY, map);
  }
  return map[sessionId];
}

function getSavedCount(sessionId: string): number {
  const map = readJSON<Record<string, number>>(SAVED_COUNTS_KEY, {});
  return map[sessionId] ?? 0;
}

function setSavedCount(sessionId: string, count: number) {
  const map = readJSON<Record<string, number>>(SAVED_COUNTS_KEY, {});
  map[sessionId] = count;
  writeJSON(SAVED_COUNTS_KEY, map);
}

// Fire-and-forget: back up whatever messages haven't been saved yet. Safe to
// call after every exchange — only sends the delta, never blocks or throws
// into the caller.
export function backupSessionToCloud(session: {
  id: string;
  topic?: string;
  messages: Array<{ role: string; content: unknown; date?: string }>;
}) {
  if (typeof window === "undefined") return;
  try {
    const savedCount = getSavedCount(session.id);
    const newMessages = session.messages.slice(savedCount);
    if (newMessages.length === 0) return;

    const cloudChatId = getOrCreateCloudChatId(session.id);
    const userId = getAnonUserId();

    fetch("/api/storeChat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: cloudChatId,
        userId,
        title: session.topic || "Untitled",
        messages: newMessages,
      }),
    })
      .then((r) => r.json())
      .then((r) => {
        if (r?.success) setSavedCount(session.id, session.messages.length);
      })
      .catch((e) => console.warn("[cloud backup] failed:", e));
  } catch (e) {
    console.warn("[cloud backup] failed:", e);
  }
}
