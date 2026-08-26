import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { INITIAL_SESSIONS, INITIAL_RESPONSES, DEFAULT_EMOTIONS } from './src/data/defaultData';
import { SessionInfo, EmotionResponse, EmotionDictionary } from './src/types';

const PORT = 3000;
const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'store.json');

// In-memory data store with file persistence
interface DataStore {
  sessions: SessionInfo[];
  responses: EmotionResponse[];
  emotions: EmotionDictionary;
  activeSessionId: string;
  updatedAt: string;
}

// Initialize store from disk or defaults
function loadStore(): DataStore {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      return {
        sessions: parsed.sessions || INITIAL_SESSIONS,
        responses: parsed.responses || INITIAL_RESPONSES,
        emotions: parsed.emotions || DEFAULT_EMOTIONS,
        activeSessionId: parsed.activeSessionId || INITIAL_SESSIONS[0]?.id || 'session-default',
        updatedAt: parsed.updatedAt || new Date().toISOString(),
      };
    }
  } catch (err) {
    console.error('[Server Store] Error loading persistent store:', err);
  }

  return {
    sessions: INITIAL_SESSIONS,
    responses: INITIAL_RESPONSES,
    emotions: DEFAULT_EMOTIONS,
    activeSessionId: INITIAL_SESSIONS[0]?.id || 'session-default',
    updatedAt: new Date().toISOString(),
  };
}

let store: DataStore = loadStore();

function saveStore(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    store.updatedAt = new Date().toISOString();
    fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Server Store] Error saving store to disk:', err);
  }
}

// Connected SSE clients for instantaneous real-time updates
const sseClients = new Set<express.Response>();

function broadcastSSE(event: { type: string; payload: any }): void {
  const data = `data: ${JSON.stringify(event)}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(data);
    } catch {
      sseClients.delete(client);
    }
  }
}

async function startServer() {
  const app = express();

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString(), clientsCount: sseClients.size });
  });

  // Realtime SSE stream
  app.get('/api/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.flushHeaders();

    sseClients.add(res);

    // Initial greeting packet
    res.write(`data: ${JSON.stringify({ type: 'CONNECTED', data: { updatedAt: store.updatedAt } })}\n\n`);

    req.on('close', () => {
      sseClients.delete(res);
    });
  });

  // Keep-alive heartbeat ping every 15s
  setInterval(() => {
    for (const client of sseClients) {
      try {
        client.write(': ping\n\n');
      } catch {
        sseClients.delete(client);
      }
    }
  }, 15000);

  // Get full state
  app.get('/api/data', (req, res) => {
    res.json({
      sessions: store.sessions,
      responses: store.responses,
      emotions: store.emotions,
      activeSessionId: store.activeSessionId,
      updatedAt: store.updatedAt,
    });
  });

  // Full synchronization endpoint
  app.post('/api/sync', (req, res) => {
    const { sessions: clientSessions, responses: clientResponses, activeSessionId } = req.body || {};

    let sessionsChanged = false;
    let responsesChanged = false;

    // Merge sessions
    if (Array.isArray(clientSessions) && clientSessions.length > 0) {
      const sessionMap = new Map<string, SessionInfo>();
      store.sessions.forEach((s) => sessionMap.set(s.id, s));

      clientSessions.forEach((clientS: SessionInfo) => {
        if (!clientS.id) return;
        const existing = sessionMap.get(clientS.id);
        if (!existing) {
          sessionMap.set(clientS.id, clientS);
          sessionsChanged = true;
        } else {
          // Merge roster: preserve all unique names
          const mergedRoster = Array.from(new Set([...(existing.roster || []), ...(clientS.roster || [])]));
          const isRosterDifferent = mergedRoster.length !== (existing.roster || []).length;
          
          if (isRosterDifferent || clientS.title !== existing.title || clientS.instructor !== existing.instructor) {
            sessionMap.set(clientS.id, {
              ...existing,
              ...clientS,
              roster: mergedRoster,
            });
            sessionsChanged = true;
          }
        }
      });

      if (sessionsChanged) {
        store.sessions = Array.from(sessionMap.values());
      }
    }

    // Merge responses
    if (Array.isArray(clientResponses) && clientResponses.length > 0) {
      const respMap = new Map<string, EmotionResponse>();
      store.responses.forEach((r) => respMap.set(r.id, r));

      clientResponses.forEach((clientR: EmotionResponse) => {
        if (!clientR.id) return;
        const existing = respMap.get(clientR.id);
        if (!existing) {
          respMap.set(clientR.id, clientR);
          responsesChanged = true;
        } else if (new Date(clientR.timestamp).getTime() > new Date(existing.timestamp).getTime()) {
          respMap.set(clientR.id, clientR);
          responsesChanged = true;
        }
      });

      if (responsesChanged) {
        store.responses = Array.from(respMap.values());
      }
    }

    if (activeSessionId && typeof activeSessionId === 'string') {
      store.activeSessionId = activeSessionId;
    }

    if (sessionsChanged || responsesChanged) {
      saveStore();
      broadcastSSE({
        type: 'FULL_SYNC',
        payload: {
          sessions: store.sessions,
          responses: store.responses,
          activeSessionId: store.activeSessionId,
          updatedAt: store.updatedAt,
        },
      });
    }

    res.json({
      success: true,
      sessions: store.sessions,
      responses: store.responses,
      emotions: store.emotions,
      activeSessionId: store.activeSessionId,
      updatedAt: store.updatedAt,
    });
  });

  // Upsert session
  app.post('/api/sessions', (req, res) => {
    const sessionData: SessionInfo = req.body;
    if (!sessionData || !sessionData.id) {
      res.status(400).json({ error: 'Session ID is required' });
      return;
    }

    const index = store.sessions.findIndex((s) => s.id === sessionData.id);
    if (index >= 0) {
      store.sessions[index] = { ...store.sessions[index], ...sessionData };
    } else {
      store.sessions.push(sessionData);
    }

    saveStore();
    broadcastSSE({
      type: 'SESSION_UPSERTED',
      payload: { session: sessionData, sessions: store.sessions },
    });

    res.json({ success: true, session: sessionData, sessions: store.sessions });
  });

  // Delete session
  app.delete('/api/sessions/:id', (req, res) => {
    const id = req.params.id;
    store.sessions = store.sessions.filter((s) => s.id !== id);
    store.responses = store.responses.filter((r) => r.sessionId !== id);

    saveStore();
    broadcastSSE({
      type: 'SESSION_DELETED',
      payload: { sessionId: id, sessions: store.sessions },
    });

    res.json({ success: true, sessions: store.sessions });
  });

  // Submit/Upsert emotion response
  app.post('/api/responses', (req, res) => {
    const responseData: EmotionResponse = req.body;
    if (!responseData || !responseData.id || !responseData.sessionId || !responseData.studentName) {
      res.status(400).json({ error: 'Invalid response payload' });
      return;
    }

    const index = store.responses.findIndex((r) => r.id === responseData.id);
    if (index >= 0) {
      store.responses[index] = responseData;
    } else {
      store.responses.push(responseData);
    }

    // If the student's name isn't already in the session roster, append it to the session roster as well
    const session = store.sessions.find((s) => s.id === responseData.sessionId);
    if (session) {
      if (!session.roster) session.roster = [];
      if (!session.roster.includes(responseData.studentName)) {
        session.roster.push(responseData.studentName);
      }
    }

    saveStore();
    broadcastSSE({
      type: 'RESPONSE_SUBMITTED',
      payload: { response: responseData, responses: store.responses, sessions: store.sessions },
    });

    res.json({ success: true, response: responseData, responses: store.responses });
  });

  // Delete response
  app.delete('/api/responses/:id', (req, res) => {
    const id = req.params.id;
    store.responses = store.responses.filter((r) => r.id !== id);

    saveStore();
    broadcastSSE({
      type: 'RESPONSE_DELETED',
      payload: { responseId: id, responses: store.responses },
    });

    res.json({ success: true, responses: store.responses });
  });

  // Vite middleware in dev, static files in prod
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
    console.log(`[Mind Checkin Server] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
