import {
  SessionInfo,
  EmotionDictionary,
  EmotionResponse,
  GoogleSheetsConfig,
  MatchedStudentRecord,
  EmotionCategoryKey,
} from '../types';
import {
  DEFAULT_EMOTIONS,
  INITIAL_SESSIONS,
  INITIAL_RESPONSES,
  EMOTION_CATEGORIES,
} from '../data/defaultData';

const STORAGE_KEYS = {
  SESSIONS: 'mind_checkin_sessions_v1',
  ACTIVE_SESSION_ID: 'mind_checkin_active_session_v1',
  EMOTIONS: 'mind_checkin_emotions_v1',
  RESPONSES: 'mind_checkin_responses_v1',
  SHEETS_CONFIG: 'mind_checkin_sheets_config_v1',
  CURRENT_STUDENT: 'mind_checkin_current_student_v1',
};

// Sessions
export function getStoredSessions(): SessionInfo[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SESSIONS);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(INITIAL_SESSIONS));
      return INITIAL_SESSIONS;
    }
    return JSON.parse(data);
  } catch {
    return INITIAL_SESSIONS;
  }
}

export function saveStoredSessions(sessions: SessionInfo[]): void {
  localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
}

// Active Session ID
export function getActiveSessionId(): string {
  try {
    const id = localStorage.getItem(STORAGE_KEYS.ACTIVE_SESSION_ID);
    if (id) return id;
    const sessions = getStoredSessions();
    return sessions[0]?.id || 'session-default';
  } catch {
    return 'session-default';
  }
}

export function setActiveSessionId(id: string): void {
  localStorage.setItem(STORAGE_KEYS.ACTIVE_SESSION_ID, id);
}

// Emotions Dictionary
export function getStoredEmotions(): EmotionDictionary {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.EMOTIONS);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.EMOTIONS, JSON.stringify(DEFAULT_EMOTIONS));
      return DEFAULT_EMOTIONS;
    }
    return JSON.parse(data);
  } catch {
    return DEFAULT_EMOTIONS;
  }
}

export function saveStoredEmotions(emotions: EmotionDictionary): void {
  localStorage.setItem(STORAGE_KEYS.EMOTIONS, JSON.stringify(emotions));
}

// Responses
export function getStoredResponses(): EmotionResponse[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.RESPONSES);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.RESPONSES, JSON.stringify(INITIAL_RESPONSES));
      return INITIAL_RESPONSES;
    }
    return JSON.parse(data);
  } catch {
    return INITIAL_RESPONSES;
  }
}

export function saveStoredResponses(responses: EmotionResponse[]): void {
  localStorage.setItem(STORAGE_KEYS.RESPONSES, JSON.stringify(responses));
}

// Sheets Config
export const DEFAULT_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbwhYP-tffctWkvCwO9cMBIdDWP045_lehOJ1iu9pMrfovbF_FBIYJcRCn33zK9IpsWLNw/exec';

export function getStoredSheetsConfig(): GoogleSheetsConfig {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SHEETS_CONFIG);
    if (!data) {
      const initial: GoogleSheetsConfig = {
        webhookUrl: DEFAULT_WEBHOOK_URL,
        autoSync: true,
        lastSyncedAt: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEYS.SHEETS_CONFIG, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(data);
    // If webhookUrl is empty, default to the user's deployed URL
    if (!parsed.webhookUrl) {
      parsed.webhookUrl = DEFAULT_WEBHOOK_URL;
      parsed.autoSync = true;
      localStorage.setItem(STORAGE_KEYS.SHEETS_CONFIG, JSON.stringify(parsed));
    }
    return parsed;
  } catch {
    return { webhookUrl: DEFAULT_WEBHOOK_URL, autoSync: true, lastSyncedAt: new Date().toISOString() };
  }
}

export function saveStoredSheetsConfig(config: GoogleSheetsConfig): void {
  localStorage.setItem(STORAGE_KEYS.SHEETS_CONFIG, JSON.stringify(config));
}

// Current Student Cache
export function getStoredCurrentStudent(): string {
  return localStorage.getItem(STORAGE_KEYS.CURRENT_STUDENT) || '';
}

export function setStoredCurrentStudent(name: string): void {
  localStorage.setItem(STORAGE_KEYS.CURRENT_STUDENT, name);
}

// Post response to Google Sheets Webhook if configured
export async function syncResponseToGoogleSheets(
  response: EmotionResponse,
  config: GoogleSheetsConfig
): Promise<boolean> {
  if (!config.webhookUrl) return false;
  try {
    const payload = {
      action: 'SUBMIT_RESPONSE',
      timestamp: response.timestamp,
      date: response.date,
      sessionTitle: response.sessionTitle,
      studentName: response.studentName,
      type: response.type,
      categoryKey: response.categoryKey,
      categoryName: response.categoryName,
      emotion: response.emotion,
      comment: response.comment,
    };

    await fetch(config.webhookUrl, {
      method: 'POST',
      mode: 'no-cors', // Google Apps Script requires no-cors for direct browser fetches
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    return true;
  } catch (err) {
    console.warn('Failed to sync to Google Sheets:', err);
    return false;
  }
}

// Test Google Sheets Webhook
export async function testGoogleSheetsWebhook(webhookUrl: string): Promise<boolean> {
  if (!webhookUrl || !webhookUrl.startsWith('https://script.google.com/macros/s/')) {
    return false;
  }
  try {
    const payload = {
      action: 'TEST_CONNECTION',
      timestamp: new Date().toISOString(),
    };

    await fetch(webhookUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    return true;
  } catch (err) {
    console.warn('Test connection failed:', err);
    return false;
  }
}

// Batch sync all responses to Google Sheets Webhook
export async function syncBatchToGoogleSheets(
  responses: EmotionResponse[],
  config: GoogleSheetsConfig
): Promise<boolean> {
  if (!config.webhookUrl || responses.length === 0) return false;
  try {
    const payload = {
      action: 'BATCH_SYNC',
      responses: responses.map((r) => ({
        timestamp: r.timestamp,
        date: r.date,
        sessionTitle: r.sessionTitle,
        studentName: r.studentName,
        type: r.type,
        categoryKey: r.categoryKey,
        categoryName: r.categoryName,
        emotion: r.emotion,
        comment: r.comment,
      })),
    };

    await fetch(config.webhookUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    return true;
  } catch (err) {
    console.warn('Batch sync failed:', err);
    return false;
  }
}

// Match Before and After responses per student in a session
export function matchStudentRecords(
  session: SessionInfo,
  responses: EmotionResponse[]
): MatchedStudentRecord[] {
  const sessionResponses = responses.filter((r) => r.sessionId === session.id);
  const roster = session.roster || [];

  // Also include any students who submitted but might not be in the initial roster
  const submittedStudentNames = Array.from(
    new Set(sessionResponses.map((r) => r.studentName))
  );
  const allNames = Array.from(new Set([...roster, ...submittedStudentNames]));

  return allNames.map((name) => {
    // Find latest Before & latest After for this student
    const beforeList = sessionResponses
      .filter((r) => r.studentName === name && r.type === 'BEFORE')
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const afterList = sessionResponses
      .filter((r) => r.studentName === name && r.type === 'AFTER')
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const beforeResp = beforeList[0];
    const afterResp = afterList[0];

    let status: MatchedStudentRecord['status'] = 'NOT_STARTED';
    if (beforeResp && afterResp) {
      status = 'COMPLETED';
    } else if (beforeResp) {
      status = 'BEFORE_ONLY';
    } else if (afterResp) {
      status = 'AFTER_ONLY';
    }

    let emotionShift: MatchedStudentRecord['emotionShift'] = undefined;
    if (beforeResp && afterResp) {
      // Is it a positive shift? (e.g. C -> A or C -> B or B -> A)
      const rank = { A: 3, B: 2, C: 1 };
      const fromVal = rank[beforeResp.categoryKey] || 1;
      const toVal = rank[afterResp.categoryKey] || 1;
      const isPositive = toVal >= fromVal;

      emotionShift = {
        fromCategory: beforeResp.categoryKey,
        toCategory: afterResp.categoryKey,
        fromEmotion: beforeResp.emotion,
        toEmotion: afterResp.emotion,
        isPositiveShift: isPositive,
      };
    }

    return {
      studentName: name,
      sessionId: session.id,
      date: session.date,
      beforeResponse: beforeResp,
      afterResponse: afterResp,
      status,
      emotionShift,
    };
  });
}

// Compute statistics for a session
export function calculateSessionStats(
  session: SessionInfo,
  responses: EmotionResponse[]
) {
  const sessionResponses = responses.filter((r) => r.sessionId === session.id);
  const beforeResponses = sessionResponses.filter((r) => r.type === 'BEFORE');
  const afterResponses = sessionResponses.filter((r) => r.type === 'AFTER');

  const rosterCount = Math.max(
    session.roster.length,
    new Set(sessionResponses.map((r) => r.studentName)).size
  );

  const beforeTotal = beforeResponses.length;
  const afterTotal = afterResponses.length;

  const countByCategory = (list: EmotionResponse[]) => {
    const counts: Record<EmotionCategoryKey, number> = { A: 0, B: 0, C: 0 };
    list.forEach((item) => {
      if (counts[item.categoryKey] !== undefined) {
        counts[item.categoryKey]++;
      }
    });
    const total = list.length || 1;
    return {
      A: counts.A,
      B: counts.B,
      C: counts.C,
      pctA: Math.round((counts.A / total) * 100),
      pctB: Math.round((counts.B / total) * 100),
      pctC: Math.round((counts.C / total) * 100),
    };
  };

  const beforeCatStats = countByCategory(beforeResponses);
  const afterCatStats = countByCategory(afterResponses);

  // Top emotions before & after
  const getTopEmotions = (list: EmotionResponse[]) => {
    const freq: Record<string, number> = {};
    list.forEach((r) => {
      freq[r.emotion] = (freq[r.emotion] || 0) + 1;
    });
    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([emotion, count]) => ({
        emotion,
        count,
        pct: Math.round((count / (list.length || 1)) * 100),
      }));
  };

  // Matched positive shifts count
  const matched = matchStudentRecords(session, responses);
  const completedPairs = matched.filter((m) => m.status === 'COMPLETED');
  const positiveShiftCount = completedPairs.filter(
    (m) => m.emotionShift?.isPositiveShift
  ).length;

  const energyIncreaseRate =
    completedPairs.length > 0
      ? Math.round((positiveShiftCount / completedPairs.length) * 100)
      : afterCatStats.pctA;

  return {
    rosterCount,
    beforeTotal,
    afterTotal,
    completedPairsCount: completedPairs.length,
    beforeCatStats,
    afterCatStats,
    topBeforeEmotions: getTopEmotions(beforeResponses),
    topAfterEmotions: getTopEmotions(afterResponses),
    energyIncreaseRate,
  };
}

// Generate 1-Second Education Report
export function generateAutoReport(
  session: SessionInfo,
  responses: EmotionResponse[]
): string {
  const stats = calculateSessionStats(session, responses);
  const matched = matchStudentRecords(session, responses);
  const completedPairs = matched.filter((m) => m.status === 'COMPLETED');

  const topBefore = stats.topBeforeEmotions.map((e) => `"${e.emotion}"(${e.count}명)`).join(', ') || '없음';
  const topAfter = stats.topAfterEmotions.map((e) => `"${e.emotion}"(${e.count}명)`).join(', ') || '없음';

  return `[교육/연수 마음 출석부 결과 분석 보고서]

1. 연수 개요
- 연수명: ${session.title}
- 일시: ${session.date}
- 강사/담당: ${session.instructor || '지정되지 않음'}
- 전체 참여 명단: ${stats.rosterCount}명 (수업 전 작성: ${stats.beforeTotal}명 / 수업 후 작성: ${stats.afterTotal}명 / 전·후 완료: ${stats.completedPairsCount}명)

2. 감정 상태 변화 종합 분석 (Before & After)
■ 수업 전 (Pre-session)
- 긍정과 에너지: ${stats.beforeCatStats.pctA}% (${stats.beforeCatStats.A}명)
- 차분과 평온: ${stats.beforeCatStats.pctB}% (${stats.beforeCatStats.B}명)
- 피로와 긴장: ${stats.beforeCatStats.pctC}% (${stats.beforeCatStats.C}명)
* 주요 사전 감정: ${topBefore}

■ 수업 후 (Post-session)
- 긍정과 에너지: ${stats.afterCatStats.pctA}% (${stats.afterCatStats.A}명) [변화: ${stats.afterCatStats.pctA >= stats.beforeCatStats.pctA ? '+' : ''}${stats.afterCatStats.pctA - stats.beforeCatStats.pctA}%p]
- 차분과 평온: ${stats.afterCatStats.pctB}% (${stats.afterCatStats.B}명)
- 피로와 긴장: ${stats.afterCatStats.pctC}% (${stats.afterCatStats.C}명) [변화: ${stats.afterCatStats.pctC - stats.beforeCatStats.pctC}%p]
* 주요 사후 감정: ${topAfter}

3. 교육 효과 및 시사점
- 본 연수 참여자들은 시작 전 [${topBefore}] 등의 감정으로 출발하였으나, 수업 진행 후 긍정 에너지 비율이 ${stats.beforeCatStats.pctA}%에서 ${stats.afterCatStats.pctA}%로 ${stats.afterCatStats.pctA - stats.beforeCatStats.pctA > 0 ? '상승' : '유지'}되었습니다.
- 전·후 응답을 모두 완료한 ${completedPairs.length}명의 참여자 중 약 ${stats.energyIncreaseRate}%가 긍정적 감정 상승 및 안정감으로 전환되어 수업에 대한 만족도와 몰입도가 매우 높은 것으로 분석됩니다.

4. 참여자 주요 기대 및 수업 소감 하이라이트
${
  completedPairs.slice(0, 3).map((item, idx) => {
    return `[참여자 ${idx + 1}] (${item.studentName})
  - 수업 전 (${item.beforeResponse?.emotion}): "${item.beforeResponse?.comment || '기대감 작성 완료'}"
  - 수업 후 (${item.afterResponse?.emotion}): "${item.afterResponse?.comment || '소감 작성 완료'}"`;
  }).join('\n') || '- 수집된 소감이 순차적으로 기록되고 있습니다.'
}

※ 본 보고서는 마음 출석부(Before & After) 실시간 데이터 분석 시스템에 의해 생성되었습니다.`;
}

// Export Responses to CSV format matching Google Sheets structure
export function exportResponsesToCsv(
  session: SessionInfo,
  responses: EmotionResponse[]
): string {
  const sessionResponses = responses.filter((r) => r.sessionId === session.id);
  const headers = [
    '타임스탬프',
    '날짜',
    '수업명',
    '이름',
    '구분(전/후)',
    '감정 카테고리',
    '상세 감정',
    '주관식 멘트(기대/소감)',
  ];

  const rows = sessionResponses.map((r) => [
    `"${r.timestamp}"`,
    `"${r.date}"`,
    `"${r.sessionTitle.replace(/"/g, '""')}"`,
    `"${r.studentName.replace(/"/g, '""')}"`,
    `"${r.type === 'BEFORE' ? '수업 전' : '수업 후'}"`,
    `"${r.categoryName.replace(/"/g, '""')}"`,
    `"${r.emotion.replace(/"/g, '""')}"`,
    `"${(r.comment || '').replace(/"/g, '""')}"`,
  ]);

  return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
}

// Download helper
export function downloadFile(content: string, fileName: string, contentType: string) {
  const blob = new Blob(['\uFEFF' + content], { type: `${contentType};charset=utf-8;` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
