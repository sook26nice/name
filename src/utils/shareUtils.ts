import { SessionInfo, AppView, SupabaseConfig } from '../types';

const STORAGE_CUSTOM_SHARE_URL_KEY = 'mind_checkin_custom_share_url_v1';

export function getStoredCustomShareUrl(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(STORAGE_CUSTOM_SHARE_URL_KEY) || '';
}

export function saveStoredCustomShareUrl(url: string): void {
  if (typeof window === 'undefined') return;
  if (!url.trim()) {
    localStorage.removeItem(STORAGE_CUSTOM_SHARE_URL_KEY);
  } else {
    localStorage.setItem(STORAGE_CUSTOM_SHARE_URL_KEY, url.trim());
  }
}

/**
 * Generates an ultra-clean, compact public URL for QR codes that any smartphone
 * camera can scan instantaneously (even from a far distance or on low-res screens).
 */
export function getPublicShareUrl(
  session?: SessionInfo,
  options?: {
    customBaseUrl?: string;
  }
): string {
  let baseUrl = '';

  // 1. Check custom override if provided
  const savedCustom = getStoredCustomShareUrl();
  if (options?.customBaseUrl && options.customBaseUrl.trim()) {
    baseUrl = options.customBaseUrl.trim();
  } else if (savedCustom && savedCustom.trim()) {
    baseUrl = savedCustom.trim();
  } else if (typeof window !== 'undefined') {
    const origin = window.location.origin;
    const hostname = window.location.hostname;

    // AI Studio Dev URL -> Public Pre-Release URL
    if (hostname.includes('ais-dev-')) {
      baseUrl = origin.replace('ais-dev-', 'ais-pre-');
    } else {
      baseUrl = origin;
    }
  } else {
    baseUrl = 'https://ais-pre-fzxdoy253hngjrmwg3ol3p-555173167609.asia-northeast1.run.app';
  }

  // Clean trailing slash
  baseUrl = baseUrl.replace(/\/+$/, '');

  // Keep QR Code URL extremely short (<90 characters) so QR matrix has large, crisp modules
  try {
    const url = new URL(baseUrl);
    if (session?.id) {
      url.searchParams.set('session', session.id);
    }
    url.searchParams.set('v', 's'); // Short for view=student
    return url.toString();
  } catch {
    if (session?.id) {
      return `${baseUrl}/?session=${session.id}&v=s`;
    }
    return baseUrl;
  }
}

export interface ParsedUrlData {
  hasParams: boolean;
  sessionId?: string;
  sessionTitle?: string;
  sessionDate?: string;
  sessionInstructor?: string;
  roster?: string[];
  supabaseConfig?: SupabaseConfig;
  targetView?: AppView;
}

/**
 * Safely parses URL query parameters when a smartphone opens the QR code
 */
export function parseUrlSessionData(): ParsedUrlData {
  if (typeof window === 'undefined') {
    return { hasParams: false };
  }

  try {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session');
    const view = params.get('view') || params.get('v');
    const title = params.get('title');
    const date = params.get('date');
    const instructor = params.get('instructor');
    const sbUrl = params.get('sb_url');
    const sbKey = params.get('sb_key');

    if (!sessionId && !view && !title) {
      return { hasParams: false };
    }

    let supabaseConfig: SupabaseConfig | undefined = undefined;
    if (sbUrl && sbKey) {
      supabaseConfig = {
        url: decodeURIComponent(sbUrl).trim(),
        anonKey: decodeURIComponent(sbKey).trim(),
        autoSync: true,
      };
    }

    return {
      hasParams: true,
      sessionId: sessionId || undefined,
      sessionTitle: title ? decodeURIComponent(title) : undefined,
      sessionDate: date ? decodeURIComponent(date) : undefined,
      sessionInstructor: instructor ? decodeURIComponent(instructor) : undefined,
      supabaseConfig,
      targetView: view === 'student' || view === 's' ? 'STUDENT_HOME' : undefined,
    };
  } catch (err) {
    console.error('Error parsing URL parameters on load:', err);
    return { hasParams: false };
  }
}
