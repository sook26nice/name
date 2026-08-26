import { SessionInfo, EmotionResponse, EmotionDictionary } from '../types';

export interface ServerSyncData {
  sessions: SessionInfo[];
  responses: EmotionResponse[];
  emotions: EmotionDictionary;
  activeSessionId: string;
  updatedAt: string;
}

/**
 * Fetches the master authoritative data from the server
 */
export async function fetchServerData(): Promise<ServerSyncData | null> {
  try {
    const res = await fetch('/api/data', { cache: 'no-cache' });
    if (!res.ok) {
      throw new Error(`Failed to fetch server data: ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.warn('[apiSync] Error fetching server data:', err);
    return null;
  }
}

/**
 * Pushes full synchronization payload to server
 */
export async function syncWithServer(payload: {
  sessions: SessionInfo[];
  responses: EmotionResponse[];
  activeSessionId?: string;
}): Promise<ServerSyncData | null> {
  try {
    const res = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      throw new Error(`Sync failed: ${res.status}`);
    }
    const data = await res.json();
    return data;
  } catch (err) {
    console.warn('[apiSync] Error syncing with server:', err);
    return null;
  }
}

/**
 * Posts an upserted session (including roster changes, title updates) to the server
 */
export async function apiUpsertSession(session: SessionInfo): Promise<boolean> {
  try {
    const res = await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(session),
    });
    return res.ok;
  } catch (err) {
    console.warn('[apiSync] Error upserting session to server:', err);
    return false;
  }
}

/**
 * Deletes a session from the server
 */
export async function apiDeleteSession(sessionId: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/sessions/${encodeURIComponent(sessionId)}`, {
      method: 'DELETE',
    });
    return res.ok;
  } catch (err) {
    console.warn('[apiSync] Error deleting session from server:', err);
    return false;
  }
}

/**
 * Submits or updates an emotion response (Before / After) on the server
 */
export async function apiSubmitResponse(response: EmotionResponse): Promise<boolean> {
  try {
    const res = await fetch('/api/responses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(response),
    });
    return res.ok;
  } catch (err) {
    console.warn('[apiSync] Error submitting response to server:', err);
    return false;
  }
}

/**
 * Deletes an emotion response from the server
 */
export async function apiDeleteResponse(responseId: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/responses/${encodeURIComponent(responseId)}`, {
      method: 'DELETE',
    });
    return res.ok;
  } catch (err) {
    console.warn('[apiSync] Error deleting response from server:', err);
    return false;
  }
}

/**
 * Subscribes to real-time Server-Sent Events (SSE) + fallback polling
 * Ensures PC, mobile browsers, and projectors stay in 100% sync instantly.
 */
export function subscribeToRealtimeServer(
  onData: (data: {
    sessions?: SessionInfo[];
    responses?: EmotionResponse[];
    activeSessionId?: string;
  }) => void
): () => void {
  let eventSource: EventSource | null = null;
  let pollInterval: any = null;
  let isUnmounted = false;

  const connectSSE = () => {
    if (isUnmounted) return;
    try {
      eventSource = new EventSource('/api/events');

      eventSource.onmessage = (e) => {
        try {
          const parsed = JSON.parse(e.data);
          if (parsed.type === 'FULL_SYNC') {
            onData({
              sessions: parsed.payload.sessions,
              responses: parsed.payload.responses,
              activeSessionId: parsed.payload.activeSessionId,
            });
          } else if (parsed.type === 'SESSION_UPSERTED' || parsed.type === 'SESSION_DELETED') {
            onData({ sessions: parsed.payload.sessions });
          } else if (parsed.type === 'RESPONSE_SUBMITTED' || parsed.type === 'RESPONSE_DELETED') {
            onData({
              responses: parsed.payload.responses,
              sessions: parsed.payload.sessions,
            });
          }
        } catch {
          // Heartbeat or malformed frame
        }
      };

      eventSource.onerror = () => {
        if (eventSource) {
          eventSource.close();
          eventSource = null;
        }
        // Retry connection in 3 seconds
        if (!isUnmounted) {
          setTimeout(connectSSE, 3000);
        }
      };
    } catch (err) {
      console.warn('[apiSync] EventSource not available, relying on polling:', err);
    }
  };

  connectSSE();

  // Smart polling check every 3.5 seconds to guarantee synchronization across all devices
  pollInterval = setInterval(async () => {
    if (isUnmounted) return;
    const serverData = await fetchServerData();
    if (serverData && !isUnmounted) {
      onData({
        sessions: serverData.sessions,
        responses: serverData.responses,
        activeSessionId: serverData.activeSessionId,
      });
    }
  }, 3500);

  return () => {
    isUnmounted = true;
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
    if (pollInterval) {
      clearInterval(pollInterval);
      pollInterval = null;
    }
  };
}
