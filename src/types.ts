export type EmotionCategoryKey = 'A' | 'B' | 'C';

export interface EmotionCategory {
  key: EmotionCategoryKey;
  code: string;
  name: string;
  subtitle: string;
  color: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  badgeBg: string;
  iconName: string;
}

export interface EmotionDictionary {
  A: string[]; // 긍정과 에너지 (15+)
  B: string[]; // 차분과 평온 (15+)
  C: string[]; // 피로와 긴장 (15+)
}

export interface SessionInfo {
  id: string;
  title: string;
  subtitle?: string;
  instructor?: string;
  date: string; // YYYY-MM-DD
  location?: string;
  targetAudience?: string;
  description?: string;
  roster: string[]; // Array of student names
  createdAt: string;
  isActive?: boolean;
}

export type ResponseType = 'BEFORE' | 'AFTER';

export interface EmotionResponse {
  id: string;
  sessionId: string;
  sessionTitle: string;
  date: string; // YYYY-MM-DD
  timestamp: string; // ISO string
  displayTime: string; // e.g. "14:30"
  studentName: string;
  type: ResponseType;
  categoryKey: EmotionCategoryKey;
  categoryName: string;
  emotion: string;
  comment: string; // 기대 멘트 (Before) or 수업 소감 (After)
}

export interface MatchedStudentRecord {
  studentName: string;
  sessionId: string;
  date: string;
  beforeResponse?: EmotionResponse;
  afterResponse?: EmotionResponse;
  status: 'COMPLETED' | 'BEFORE_ONLY' | 'AFTER_ONLY' | 'NOT_STARTED';
  emotionShift?: {
    fromCategory: EmotionCategoryKey;
    toCategory: EmotionCategoryKey;
    fromEmotion: string;
    toEmotion: string;
    isPositiveShift: boolean;
  };
}

export interface GoogleSheetsConfig {
  webhookUrl: string;
  autoSync: boolean;
  lastSyncedAt?: string;
  sheetId?: string;
}

export type AppView = 'STUDENT_HOME' | 'STEP_BEFORE' | 'STEP_AFTER' | 'ADMIN' | 'PRESENT_QR';
