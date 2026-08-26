import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { SessionInfo, EmotionResponse, SupabaseConfig } from '../types';

let supabaseInstance: SupabaseClient | null = null;
let currentConfigKey = '';

const STORAGE_KEYS = {
  SUPABASE_CONFIG: 'mind_checkin_supabase_config_v1',
};

// Check if valid credentials are present
export function isSupabaseConfigured(config?: SupabaseConfig): boolean {
  const c = config || getStoredSupabaseConfig();
  return !!(c.url && c.url.trim() && c.anonKey && c.anonKey.trim());
}

// Default or stored Supabase Config
export function getStoredSupabaseConfig(): SupabaseConfig {
  try {
    const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
    const envAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

    const data = localStorage.getItem(STORAGE_KEYS.SUPABASE_CONFIG);
    if (!data) {
      const initial: SupabaseConfig = {
        url: envUrl,
        anonKey: envAnonKey,
        autoSync: true,
      };
      return initial;
    }
    const parsed = JSON.parse(data);
    if (!parsed.url && envUrl) parsed.url = envUrl;
    if (!parsed.anonKey && envAnonKey) parsed.anonKey = envAnonKey;
    return parsed;
  } catch {
    return { url: '', anonKey: '', autoSync: true };
  }
}

export function saveStoredSupabaseConfig(config: SupabaseConfig): void {
  localStorage.setItem(STORAGE_KEYS.SUPABASE_CONFIG, JSON.stringify(config));
  // Invalidate instance so it rebuilds with new credentials
  supabaseInstance = null;
  currentConfigKey = '';
}

// Get or initialize Supabase Client
export function getSupabaseClient(customConfig?: SupabaseConfig): SupabaseClient | null {
  const config = customConfig || getStoredSupabaseConfig();
  const url = (config.url || '').trim();
  const anonKey = (config.anonKey || '').trim();

  if (!url || !anonKey) {
    return null;
  }

  const key = `${url}:::${anonKey}`;
  if (supabaseInstance && currentConfigKey === key) {
    return supabaseInstance;
  }

  try {
    supabaseInstance = createClient(url, anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    currentConfigKey = key;
    return supabaseInstance;
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error);
    return null;
  }
}

// SQL Schema for one-click setup in Supabase SQL Editor
export const SUPABASE_SQL_SCHEMA = `-- [마음 출석부 - 실시간 동기화 테이블 생성 SQL]
-- 아래 코드를 Supabase 대시보드 -> SQL Editor에 붙여넣고 [Run]을 누르세요.

-- 1. 연수 세션 테이블 생성
create table if not exists public.sessions (
  id text primary key,
  title text not null,
  subtitle text,
  instructor text,
  date text not null,
  location text,
  target_audience text,
  description text,
  roster jsonb default '[]'::jsonb,
  created_at text,
  is_active boolean default true,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. 출석부 응답 테이블 생성
create table if not exists public.responses (
  id text primary key,
  session_id text not null,
  session_title text,
  date text,
  timestamp text not null,
  display_time text,
  student_name text not null,
  type text not null,
  category_key text not null,
  category_name text not null,
  emotion text not null,
  comment text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. 모든 기기(익명/연수생)에서 접근 가능하도록 RLS 정책 허용
alter table public.sessions enable row level security;
alter table public.responses enable row level security;

drop policy if exists "모든 사용자 세션 조회" on public.sessions;
create policy "모든 사용자 세션 조회" on public.sessions for select using (true);

drop policy if exists "모든 사용자 세션 수정 및 생성" on public.sessions;
create policy "모든 사용자 세션 수정 및 생성" on public.sessions for all using (true);

drop policy if exists "모든 사용자 응답 조회" on public.responses;
create policy "모든 사용자 응답 조회" on public.responses for select using (true);

drop policy if exists "모든 사용자 응답 생성 및 수정" on public.responses;
create policy "모든 사용자 응답 생성 및 수정" on public.responses for all using (true);

-- 4. 실시간(Realtime) 변경 감지 활성화
alter publication supabase_realtime add table public.sessions;
alter publication supabase_realtime add table public.responses;
`;

// Test Supabase Connection
export async function testSupabaseConnection(config: SupabaseConfig): Promise<{ success: boolean; message: string }> {
  const client = getSupabaseClient(config);
  if (!client) {
    return { success: false, message: 'Project URL과 Anon Key를 모두 입력해주세요.' };
  }

  try {
    // Try querying responses table
    const { data, error } = await client.from('responses').select('id').limit(1);
    if (error) {
      if (error.code === '42P01' || error.message.includes('relation "public.responses" does not exist')) {
        return {
          success: false,
          message: 'Supabase에 연결되었으나 테이블이 없습니다. 아래의 SQL 쿼리를 SQL Editor에서 실행해주세요.',
        };
      }
      return { success: false, message: `연결 오류: ${error.message}` };
    }
    return { success: true, message: 'Supabase 클라우드 데이터베이스와 정상 연결되었습니다!' };
  } catch (err: any) {
    return { success: false, message: `네트워크 또는 URL 형식 오류: ${err.message || err}` };
  }
}

// Fetch all sessions from Supabase
export async function fetchSessionsFromSupabase(): Promise<SessionInfo[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client.from('sessions').select('*').order('created_at', { ascending: false });
    if (error || !data) return null;

    return data.map((row: any) => ({
      id: row.id,
      title: row.title,
      subtitle: row.subtitle || '',
      instructor: row.instructor || '',
      date: row.date,
      location: row.location || '',
      targetAudience: row.target_audience || '',
      description: row.description || '',
      roster: Array.isArray(row.roster) ? row.roster : [],
      createdAt: row.created_at || new Date().toISOString(),
      isActive: row.is_active ?? true,
    }));
  } catch (e) {
    console.error('Error fetching sessions from Supabase:', e);
    return null;
  }
}

export const fetchSupabaseSessions = fetchSessionsFromSupabase;

// Push / Upsert a single session to Supabase
export async function upsertSessionToSupabase(session: SessionInfo): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client.from('sessions').upsert({
      id: session.id,
      title: session.title,
      subtitle: session.subtitle,
      instructor: session.instructor,
      date: session.date,
      location: session.location,
      target_audience: session.targetAudience,
      description: session.description,
      roster: session.roster,
      created_at: session.createdAt,
      is_active: session.isActive ?? true,
      updated_at: new Date().toISOString(),
    });
    return !error;
  } catch (e) {
    console.error('Error upserting session to Supabase:', e);
    return false;
  }
}

// Fetch all responses from Supabase
export async function fetchResponsesFromSupabase(): Promise<EmotionResponse[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client.from('responses').select('*').order('timestamp', { ascending: false });
    if (error || !data) return null;

    return data.map((row: any) => ({
      id: row.id,
      sessionId: row.session_id,
      sessionTitle: row.session_title || '',
      date: row.date || '',
      timestamp: row.timestamp,
      displayTime: row.display_time || '',
      studentName: row.student_name,
      type: row.type,
      categoryKey: row.category_key,
      categoryName: row.category_name,
      emotion: row.emotion,
      comment: row.comment || '',
    }));
  } catch (e) {
    console.error('Error fetching responses from Supabase:', e);
    return null;
  }
}

export const fetchSupabaseResponses = fetchResponsesFromSupabase;

// Push a single emotion response to Supabase
export async function pushResponseToSupabase(response: EmotionResponse): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client.from('responses').upsert({
      id: response.id,
      session_id: response.sessionId,
      session_title: response.sessionTitle,
      date: response.date,
      timestamp: response.timestamp,
      display_time: response.displayTime,
      student_name: response.studentName,
      type: response.type,
      category_key: response.categoryKey,
      category_name: response.categoryName,
      emotion: response.emotion,
      comment: response.comment,
    });
    return !error;
  } catch (e) {
    console.error('Error pushing response to Supabase:', e);
    return false;
  }
}

// Batch Sync Local Responses to Supabase
export async function batchSyncResponsesToSupabase(responses: EmotionResponse[]): Promise<{ count: number; success: boolean }> {
  const client = getSupabaseClient();
  if (!client || responses.length === 0) return { count: 0, success: false };

  try {
    const records = responses.map((r) => ({
      id: r.id,
      session_id: r.sessionId,
      session_title: r.sessionTitle,
      date: r.date,
      timestamp: r.timestamp,
      display_time: r.displayTime,
      student_name: r.studentName,
      type: r.type,
      category_key: r.categoryKey,
      category_name: r.categoryName,
      emotion: r.emotion,
      comment: r.comment,
    }));

    const { error } = await client.from('responses').upsert(records, { onConflict: 'id' });
    if (error) {
      console.error('Batch sync error:', error);
      return { count: 0, success: false };
    }
    return { count: records.length, success: true };
  } catch (e) {
    console.error('Error during batch sync to Supabase:', e);
    return { count: 0, success: false };
  }
}

// Setup Realtime Subscription for incoming responses and session changes
export function subscribeToSupabaseRealtime(
  onResponseChange: (newResponse: EmotionResponse) => void,
  onSessionChange?: (session: SessionInfo) => void
): () => void {
  const client = getSupabaseClient();
  if (!client) return () => {};

  try {
    const channel = client
      .channel(`mind_checkin_rt_${Date.now()}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'responses' },
        (payload) => {
          if (payload.new && (payload.new as any).id) {
            const row = payload.new as any;
            const res: EmotionResponse = {
              id: row.id,
              sessionId: row.session_id,
              sessionTitle: row.session_title || '',
              date: row.date || '',
              timestamp: row.timestamp,
              displayTime: row.display_time || '',
              studentName: row.student_name,
              type: row.type,
              categoryKey: row.category_key,
              categoryName: row.category_name,
              emotion: row.emotion,
              comment: row.comment || '',
            };
            onResponseChange(res);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sessions' },
        (payload) => {
          if (payload.new && (payload.new as any).id && onSessionChange) {
            const row = payload.new as any;
            const session: SessionInfo = {
              id: row.id,
              title: row.title,
              subtitle: row.subtitle || '',
              instructor: row.instructor || '',
              date: row.date,
              location: row.location || '',
              targetAudience: row.target_audience || '',
              description: row.description || '',
              roster: Array.isArray(row.roster) ? row.roster : [],
              createdAt: row.created_at || new Date().toISOString(),
              isActive: row.is_active ?? true,
            };
            onSessionChange(session);
          }
        }
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  } catch (e) {
    console.error('Failed to subscribe to realtime:', e);
    return () => {};
  }
}
