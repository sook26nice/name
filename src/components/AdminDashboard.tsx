import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  Users,
  BookOpen,
  FileText,
  FileSpreadsheet,
  Plus,
  Trash2,
  Edit2,
  Copy,
  Check,
  Download,
  Upload,
  RefreshCw,
  Sparkles,
  TrendingUp,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  ExternalLink,
  Save,
  Smile,
  BatteryLow,
  Sun,
  Moon,
  ChevronRight,
  ArrowRight,
  ShieldCheck,
  Sliders,
  Send,
} from 'lucide-react';
import {
  SessionInfo,
  EmotionDictionary,
  EmotionResponse,
  GoogleSheetsConfig,
  EmotionCategoryKey,
  MatchedStudentRecord,
} from '../types';
import { EMOTION_CATEGORIES, DEFAULT_EMOTIONS } from '../data/defaultData';
import {
  calculateSessionStats,
  generateAutoReport,
  matchStudentRecords,
  exportResponsesToCsv,
  downloadFile,
} from '../utils/storage';
import { GOOGLE_APPS_SCRIPT_CODE } from '../utils/gasTemplate';
import { Settings } from 'lucide-react';

interface AdminDashboardProps {
  sessions: SessionInfo[];
  activeSession: SessionInfo;
  onSelectSession: (id: string) => void;
  onUpdateSessions: (sessions: SessionInfo[]) => void;
  emotionsDict: EmotionDictionary;
  onUpdateEmotions: (dict: EmotionDictionary) => void;
  responses: EmotionResponse[];
  onUpdateResponses: (responses: EmotionResponse[]) => void;
  sheetsConfig: GoogleSheetsConfig;
  onUpdateSheetsConfig: (config: GoogleSheetsConfig) => void;
  onBackToHome: () => void;
  onOpenQr: () => void;
  onOpenSettings?: () => void;
}

type AdminTab = 'OVERVIEW' | 'MATRIX' | 'ROSTER' | 'EMOTIONS' | 'SHEETS';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  sessions,
  activeSession,
  onSelectSession,
  onUpdateSessions,
  emotionsDict,
  onUpdateEmotions,
  responses,
  onUpdateResponses,
  sheetsConfig,
  onUpdateSheetsConfig,
  onBackToHome,
  onOpenQr,
  onOpenSettings,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('OVERVIEW');
  const [copiedReport, setCopiedReport] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);

  // Search & Filter state for Matrix Tab
  const [matrixSearch, setMatrixSearch] = useState('');
  const [matrixStatusFilter, setMatrixStatusFilter] = useState<'ALL' | 'COMPLETED' | 'BEFORE_ONLY' | 'NOT_STARTED'>('ALL');

  // Session Editor State
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [newSessionTitle, setNewSessionTitle] = useState('');
  const [newSessionInstructor, setNewSessionInstructor] = useState('');
  const [newSessionDate, setNewSessionDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [newSessionRosterText, setNewSessionRosterText] = useState('');

  // Editing existing session roster
  const [editingRosterText, setEditingRosterText] = useState('');
  const [isEditingRoster, setIsEditingRoster] = useState(false);

  // Emotion Dictionary inline edit state
  const [activeDictCategory, setActiveDictCategory] = useState<EmotionCategoryKey>('A');
  const [newWordInput, setNewWordInput] = useState('');
  const [editingWordIndex, setEditingWordIndex] = useState<number | null>(null);
  const [editingWordValue, setEditingWordValue] = useState('');

  // Sheets Config Form
  const [webhookUrlInput, setWebhookUrlInput] = useState(sheetsConfig.webhookUrl || '');
  const [webhookSaveNotice, setWebhookSaveNotice] = useState(false);

  // Stats calculation
  const stats = useMemo(
    () => calculateSessionStats(activeSession, responses),
    [activeSession, responses]
  );

  // Matched records
  const matchedRecords = useMemo(
    () => matchStudentRecords(activeSession, responses),
    [activeSession, responses]
  );

  // Filtered matched records for Matrix Tab
  const filteredRecords = useMemo(() => {
    return matchedRecords.filter((record) => {
      const matchesSearch = record.studentName
        .toLowerCase()
        .includes(matrixSearch.trim().toLowerCase());
      if (!matchesSearch) return false;
      if (matrixStatusFilter === 'ALL') return true;
      return record.status === matrixStatusFilter;
    });
  }, [matchedRecords, matrixSearch, matrixStatusFilter]);

  // Handle Create Session
  const handleCreateSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSessionTitle.trim()) return;

    // Parse roster text by newline, comma, tab
    const roster = newSessionRosterText
      .split(/[\n,\t]+/)
      .map((n) => n.trim())
      .filter((n) => n.length > 0);

    const newSession: SessionInfo = {
      id: `session-${Date.now()}`,
      title: newSessionTitle.trim(),
      instructor: newSessionInstructor.trim() || undefined,
      date: newSessionDate,
      roster: roster.length > 0 ? roster : ['참여자1', '참여자2', '참여자3'],
      createdAt: new Date().toISOString(),
      isActive: true,
    };

    const updated = [newSession, ...sessions];
    onUpdateSessions(updated);
    onSelectSession(newSession.id);
    setIsCreatingSession(false);
    setNewSessionTitle('');
    setNewSessionInstructor('');
    setNewSessionRosterText('');
  };

  // Handle Save Edited Roster
  const handleSaveEditedRoster = () => {
    const updatedRoster = editingRosterText
      .split(/[\n,\t]+/)
      .map((n) => n.trim())
      .filter((n) => n.length > 0);

    const updated = sessions.map((s) =>
      s.id === activeSession.id ? { ...s, roster: updatedRoster } : s
    );
    onUpdateSessions(updated);
    setIsEditingRoster(false);
  };

  // Handle Delete Session
  const handleDeleteSession = (sessionId: string) => {
    if (sessions.length <= 1) {
      alert('최소 1개의 수업이 유지되어야 합니다.');
      return;
    }
    if (confirm('정말로 이 수업을 삭제하시겠습니까? (응답 데이터는 보존됩니다)')) {
      const updated = sessions.filter((s) => s.id !== sessionId);
      onUpdateSessions(updated);
      if (activeSession.id === sessionId) {
        onSelectSession(updated[0].id);
      }
    }
  };

  // Emotion Dictionary Operations
  const handleAddWord = (category: EmotionCategoryKey) => {
    if (!newWordInput.trim()) return;
    const currentList = emotionsDict[category] || [];
    if (currentList.includes(newWordInput.trim())) {
      alert('이미 존재하는 감정 단어입니다.');
      return;
    }
    const updatedDict = {
      ...emotionsDict,
      [category]: [...currentList, newWordInput.trim()],
    };
    onUpdateEmotions(updatedDict);
    setNewWordInput('');
  };

  const handleSaveEditedWord = (category: EmotionCategoryKey, index: number) => {
    if (!editingWordValue.trim()) return;
    const currentList = [...emotionsDict[category]];
    currentList[index] = editingWordValue.trim();
    onUpdateEmotions({
      ...emotionsDict,
      [category]: currentList,
    });
    setEditingWordIndex(null);
    setEditingWordValue('');
  };

  const handleDeleteWord = (category: EmotionCategoryKey, index: number) => {
    const currentList = emotionsDict[category].filter((_, i) => i !== index);
    onUpdateEmotions({
      ...emotionsDict,
      [category]: currentList,
    });
  };

  const handleResetEmotions = () => {
    if (confirm('기본 45개 감정 사전으로 초기화하시겠습니까?')) {
      onUpdateEmotions(DEFAULT_EMOTIONS);
    }
  };

  // Auto Report Generation & Copy
  const handleCopyReport = () => {
    const report = generateAutoReport(activeSession, responses);
    navigator.clipboard.writeText(report);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2000);
  };

  // Copy GAS script
  const handleCopyScript = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  // Export CSV
  const handleExportCsv = () => {
    const csv = exportResponsesToCsv(activeSession, responses);
    const fileName = `마음출석부_${activeSession.title}_${activeSession.date}.csv`;
    downloadFile(csv, fileName, 'text/csv');
  };

  // Save Webhook URL
  const handleSaveWebhook = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSheetsConfig({
      ...sheetsConfig,
      webhookUrl: webhookUrlInput.trim(),
      autoSync: !!webhookUrlInput.trim(),
      lastSyncedAt: new Date().toISOString(),
    });
    setWebhookSaveNotice(true);
    setTimeout(() => setWebhookSaveNotice(false), 2500);
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-4 sm:py-6 space-y-6">
      {/* Top Admin Header Bar */}
      <div className="bg-white rounded-2xl p-6 border border-[#EBE7E1] shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-sans font-bold px-3 py-1 rounded-full bg-[#F5EFE6] text-[#3D3A35] border border-[#EBE7E1] flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#E87A5D]" />
              선생님 관리자 모드
            </span>
            <span className="text-xs font-sans text-[#8C867E]">
              {activeSession.date}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-[#2D2A26]">
            {activeSession.title}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          {/* Settings Modal Button */}
          {onOpenSettings && (
            <button
              id="admin-btn-open-settings"
              type="button"
              onClick={onOpenSettings}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#FFF1ED] hover:bg-[#FFE5DE] text-[#E87A5D] border border-[#E87A5D]/30 font-sans font-bold text-xs sm:text-sm rounded-xl shadow-2xs transition-all"
            >
              <Settings className="w-4 h-4 text-[#E87A5D]" />
              <span>연수 설정 및 명단 수정</span>
            </button>
          )}

          {/* Presenter QR Button */}
          <button
            id="admin-btn-open-qr"
            type="button"
            onClick={onOpenQr}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#E87A5D] hover:bg-[#d3694c] text-white font-sans font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-[#E87A5D]/20 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>수업 QR 띄우기</span>
          </button>

          {/* Export CSV */}
          <button
            id="admin-btn-export-csv"
            type="button"
            onClick={handleExportCsv}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#F5EFE6] hover:bg-[#EBE7E1] text-[#3D3A35] font-sans font-bold text-xs sm:text-sm rounded-xl border border-[#EBE7E1] transition-all"
          >
            <Download className="w-4 h-4 text-[#8C867E]" />
            <span>CSV 저장</span>
          </button>
        </div>
      </div>

      {/* Admin Tab Navigation */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-[#EBE7E1] scrollbar-none">
        <button
          id="tab-btn-overview"
          onClick={() => setActiveTab('OVERVIEW')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-sans font-bold text-xs sm:text-sm whitespace-nowrap transition-all ${
            activeTab === 'OVERVIEW'
              ? 'bg-[#E87A5D] text-white shadow-sm'
              : 'text-[#8C867E] hover:text-[#3D3A35] hover:bg-[#F5EFE6]'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>현황 & 통계 분석</span>
        </button>

        <button
          id="tab-btn-matrix"
          onClick={() => setActiveTab('MATRIX')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-sans font-bold text-xs sm:text-sm whitespace-nowrap transition-all ${
            activeTab === 'MATRIX'
              ? 'bg-[#E87A5D] text-white shadow-sm'
              : 'text-[#8C867E] hover:text-[#3D3A35] hover:bg-[#F5EFE6]'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>전/후 매칭 추적 ({stats.completedPairsCount}명)</span>
        </button>

        <button
          id="tab-btn-roster"
          onClick={() => setActiveTab('ROSTER')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-sans font-bold text-xs sm:text-sm whitespace-nowrap transition-all ${
            activeTab === 'ROSTER'
              ? 'bg-[#E87A5D] text-white shadow-sm'
              : 'text-[#8C867E] hover:text-[#3D3A35] hover:bg-[#F5EFE6]'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>수업 및 명단 관리 ({activeSession.roster.length}명)</span>
        </button>

        <button
          id="tab-btn-emotions"
          onClick={() => setActiveTab('EMOTIONS')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-sans font-bold text-xs sm:text-sm whitespace-nowrap transition-all ${
            activeTab === 'EMOTIONS'
              ? 'bg-[#E87A5D] text-white shadow-sm'
              : 'text-[#8C867E] hover:text-[#3D3A35] hover:bg-[#F5EFE6]'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>감정 사전 커스텀</span>
        </button>

        <button
          id="tab-btn-sheets"
          onClick={() => setActiveTab('SHEETS')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-sans font-bold text-xs sm:text-sm whitespace-nowrap transition-all ${
            activeTab === 'SHEETS'
              ? 'bg-[#E87A5D] text-white shadow-sm'
              : 'text-[#8C867E] hover:text-[#3D3A35] hover:bg-[#F5EFE6]'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>구글 시트 연동 (GAS)</span>
        </button>
      </div>

      {/* TAB 1: OVERVIEW & 1-SECOND REPORT */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-6">
          {/* Key Metrics 4-Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white rounded-2xl p-5 border border-[#EBE7E1] shadow-sm space-y-1.5">
              <span className="text-xs font-sans font-bold text-[#8C867E] flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#8C867E]" />
                전체 명단 인원
              </span>
              <p className="text-2xl sm:text-3xl font-serif font-bold text-[#2D2A26]">
                {stats.rosterCount}
                <span className="text-sm font-sans font-normal text-[#8C867E] ml-1">명</span>
              </p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-[#EBE7E1] shadow-sm space-y-1.5">
              <span className="text-xs font-sans font-bold text-[#E87A5D] flex items-center gap-1.5">
                <Sun className="w-3.5 h-3.5 text-[#E87A5D]" />
                수업 전 (Before)
              </span>
              <p className="text-2xl sm:text-3xl font-serif font-bold text-[#2D2A26]">
                {stats.beforeTotal}
                <span className="text-sm font-sans font-normal text-[#8C867E] ml-1">명 완료</span>
              </p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-[#EBE7E1] shadow-sm space-y-1.5">
              <span className="text-xs font-sans font-bold text-[#3D3A35] flex items-center gap-1.5">
                <Moon className="w-3.5 h-3.5 text-[#3D3A35]" />
                수업 후 (After)
              </span>
              <p className="text-2xl sm:text-3xl font-serif font-bold text-[#2D2A26]">
                {stats.afterTotal}
                <span className="text-sm font-sans font-normal text-[#8C867E] ml-1">명 완료</span>
              </p>
            </div>

            <div className="bg-[#FFF1ED] rounded-2xl p-5 border border-[#E87A5D]/30 shadow-sm space-y-1.5">
              <span className="text-xs font-sans font-bold text-[#E87A5D] flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-[#E87A5D]" />
                긍정 전환 및 상승률
              </span>
              <p className="text-2xl sm:text-3xl font-serif font-bold text-[#E87A5D]">
                {stats.energyIncreaseRate}%
                <span className="text-xs font-sans font-normal text-[#8C867E] ml-1">({stats.completedPairsCount}명 기준)</span>
              </p>
            </div>
          </div>

          {/* Emotion Shift Comparison: Before vs After Category Bars */}
          <div className="bg-white rounded-2xl p-6 border border-[#EBE7E1] shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-serif font-bold text-[#2D2A26] flex items-center gap-2">
                  <span>감정 카테고리 분포 변화 (Before ➡️ After)</span>
                </h3>
                <p className="text-xs font-sans text-[#8C867E] pt-0.5">
                  수업 진행에 따른 3대 감정 카테고리의 구성비 변화입니다.
                </p>
              </div>
            </div>

            {/* Comparison Side by Side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Before Chart */}
              <div className="bg-[#FAF9F7] rounded-2xl p-5 border border-[#EBE7E1] space-y-4">
                <div className="flex items-center justify-between text-xs font-serif font-bold">
                  <span className="text-[#3D3A35] flex items-center gap-1.5">
                    <Sun className="w-4 h-4 text-[#E87A5D]" />
                    수업 시작 전 기분 ({stats.beforeTotal}명)
                  </span>
                </div>

                {/* Progress breakdown */}
                <div className="space-y-3 pt-1">
                  <div>
                    <div className="flex justify-between text-xs font-sans mb-1">
                      <span className="text-[#3D3A35] font-bold">A. 긍정과 에너지</span>
                      <span className="font-bold text-[#E87A5D]">{stats.beforeCatStats.pctA}% ({stats.beforeCatStats.A}명)</span>
                    </div>
                    <div className="w-full h-2.5 bg-[#EBE7E1] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#E87A5D] rounded-full transition-all duration-500"
                        style={{ width: `${stats.beforeCatStats.pctA}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-sans mb-1">
                      <span className="text-[#3D3A35] font-bold">B. 차분과 평온</span>
                      <span className="font-bold text-[#3D3A35]">{stats.beforeCatStats.pctB}% ({stats.beforeCatStats.B}명)</span>
                    </div>
                    <div className="w-full h-2.5 bg-[#EBE7E1] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#8C867E] rounded-full transition-all duration-500"
                        style={{ width: `${stats.beforeCatStats.pctB}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-sans mb-1">
                      <span className="text-[#8C867E] font-bold">C. 피로와 긴장</span>
                      <span className="font-bold text-[#8C867E]">{stats.beforeCatStats.pctC}% ({stats.beforeCatStats.C}명)</span>
                    </div>
                    <div className="w-full h-2.5 bg-[#EBE7E1] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#D5CEC5] rounded-full transition-all duration-500"
                        style={{ width: `${stats.beforeCatStats.pctC}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Top keywords */}
                <div className="pt-3 border-t border-[#EBE7E1]">
                  <span className="text-[11px] font-sans font-bold text-[#8C867E] block mb-1.5">
                    수업 전 주요 감정 단어:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {stats.topBeforeEmotions.map((e) => (
                      <span
                        key={e.emotion}
                        className="text-xs font-sans bg-[#F5EFE6] text-[#3D3A35] px-2.5 py-1 rounded-lg border border-[#EBE7E1]"
                      >
                        {e.emotion} ({e.count})
                      </span>
                    ))}
                    {stats.topBeforeEmotions.length === 0 && (
                      <span className="text-xs font-sans text-[#8C867E]">아직 제출된 응답이 없습니다.</span>
                    )}
                  </div>
                </div>
              </div>

              {/* After Chart */}
              <div className="bg-[#FFF1ED] rounded-2xl p-5 border border-[#E87A5D]/30 space-y-4">
                <div className="flex items-center justify-between text-xs font-serif font-bold">
                  <span className="text-[#E87A5D] flex items-center gap-1.5">
                    <Moon className="w-4 h-4 text-[#E87A5D]" />
                    수업 종료 후 기분 ({stats.afterTotal}명)
                  </span>
                </div>

                {/* Progress breakdown */}
                <div className="space-y-3 pt-1">
                  <div>
                    <div className="flex justify-between text-xs font-sans mb-1">
                      <span className="text-[#3D3A35] font-bold">A. 긍정과 에너지</span>
                      <span className="font-bold text-[#E87A5D]">
                        {stats.afterCatStats.pctA}% ({stats.afterCatStats.A}명)
                        <span className="text-xs text-[#E87A5D] ml-1">
                          ({stats.afterCatStats.pctA >= stats.beforeCatStats.pctA ? '+' : ''}
                          {stats.afterCatStats.pctA - stats.beforeCatStats.pctA}%p)
                        </span>
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-[#EBE7E1] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#E87A5D] rounded-full transition-all duration-500"
                        style={{ width: `${stats.afterCatStats.pctA}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-sans mb-1">
                      <span className="text-[#3D3A35] font-bold">B. 차분과 평온</span>
                      <span className="font-bold text-[#3D3A35]">{stats.afterCatStats.pctB}% ({stats.afterCatStats.B}명)</span>
                    </div>
                    <div className="w-full h-2.5 bg-[#EBE7E1] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#8C867E] rounded-full transition-all duration-500"
                        style={{ width: `${stats.afterCatStats.pctB}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-sans mb-1">
                      <span className="text-[#8C867E] font-bold">C. 피로와 긴장</span>
                      <span className="font-bold text-[#8C867E]">
                        {stats.afterCatStats.pctC}% ({stats.afterCatStats.C}명)
                        <span className="text-xs text-[#8C867E] ml-1">
                          ({stats.afterCatStats.pctC - stats.beforeCatStats.pctC}%p)
                        </span>
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-[#EBE7E1] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#D5CEC5] rounded-full transition-all duration-500"
                        style={{ width: `${stats.afterCatStats.pctC}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Top keywords */}
                <div className="pt-3 border-t border-[#E87A5D]/20">
                  <span className="text-[11px] font-sans font-bold text-[#8C867E] block mb-1.5">
                    수업 후 주요 감정 단어:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {stats.topAfterEmotions.map((e) => (
                      <span
                        key={e.emotion}
                        className="text-xs font-sans bg-white text-[#E87A5D] px-2.5 py-1 rounded-lg border border-[#E87A5D]/30 font-bold"
                      >
                        {e.emotion} ({e.count})
                      </span>
                    ))}
                    {stats.topAfterEmotions.length === 0 && (
                      <span className="text-xs font-sans text-[#8C867E]">아직 제출된 응답이 없습니다.</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 1-Second Auto Report Generator (PRD 활용 시나리오: 사후 보고서 1초 생성) */}
          <div className="bg-[#2D2A26] text-[#F8F5F2] rounded-2xl p-6 sm:p-7 shadow-md border border-[#3D3A35] space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <span className="text-xs font-sans font-bold text-[#E87A5D] uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  1초 사후 결과 보고서 자동 생성기
                </span>
                <h3 className="text-lg sm:text-xl font-serif font-bold text-white">
                  교육 효과 및 감정 분석 종합 보고서
                </h3>
              </div>

              <button
                id="btn-copy-report"
                type="button"
                onClick={handleCopyReport}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-[#E87A5D] hover:bg-[#d3694c] text-white font-sans font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md shadow-[#E87A5D]/20"
              >
                {copiedReport ? (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>복사 완료!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>보고서 전체 복사</span>
                  </>
                )}
              </button>
            </div>

            <div className="bg-[#1E1C1A] rounded-xl p-4 sm:p-5 border border-[#3D3A35] text-xs font-mono text-[#EBE7E1] leading-relaxed max-h-64 overflow-y-auto whitespace-pre-wrap select-all">
              {generateAutoReport(activeSession, responses)}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: BEFORE & AFTER MATCHING MATRIX */}
      {activeTab === 'MATRIX' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-[#EBE7E1] shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base sm:text-lg font-serif font-bold text-[#2D2A26] flex items-center gap-2">
                  <span>참여자별 비포 & 애프터 감정 추적표</span>
                </h3>
                <p className="text-xs font-sans text-[#8C867E]">
                  수업 전 기대 멘트와 수업 후 소감을 참여자별로 나란히 비교합니다.
                </p>
              </div>

              {/* Status Filter Buttons */}
              <div className="flex items-center gap-1 bg-[#F5EFE6] p-1 rounded-xl text-xs font-sans font-medium border border-[#EBE7E1]">
                <button
                  type="button"
                  onClick={() => setMatrixStatusFilter('ALL')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    matrixStatusFilter === 'ALL'
                      ? 'bg-white text-[#3D3A35] shadow-xs font-bold'
                      : 'text-[#8C867E] hover:text-[#3D3A35]'
                  }`}
                >
                  전체 ({matchedRecords.length})
                </button>
                <button
                  type="button"
                  onClick={() => setMatrixStatusFilter('COMPLETED')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    matrixStatusFilter === 'COMPLETED'
                      ? 'bg-white text-[#E87A5D] shadow-xs font-bold'
                      : 'text-[#8C867E] hover:text-[#3D3A35]'
                  }`}
                >
                  전·후 완료 ({matchedRecords.filter((r) => r.status === 'COMPLETED').length})
                </button>
                <button
                  type="button"
                  onClick={() => setMatrixStatusFilter('BEFORE_ONLY')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    matrixStatusFilter === 'BEFORE_ONLY'
                      ? 'bg-white text-[#3D3A35] shadow-xs font-bold'
                      : 'text-[#8C867E] hover:text-[#3D3A35]'
                  }`}
                >
                  수업전만 ({matchedRecords.filter((r) => r.status === 'BEFORE_ONLY').length})
                </button>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative pt-1">
              <Search className="w-4 h-4 text-[#8C867E] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="참여자 이름 검색..."
                value={matrixSearch}
                onChange={(e) => setMatrixSearch(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2 text-xs sm:text-sm font-sans bg-[#FAF9F7] border border-[#EBE7E1] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E87A5D]"
              />
            </div>
          </div>

          {/* Records List */}
          <div className="space-y-3">
            {filteredRecords.map((record) => {
              const { studentName, beforeResponse, afterResponse, status, emotionShift } = record;

              return (
                <div
                  key={studentName}
                  className="bg-white rounded-2xl p-5 border border-[#EBE7E1] shadow-sm space-y-3"
                >
                  {/* Student Title Bar */}
                  <div className="flex items-center justify-between border-b border-[#EBE7E1] pb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="font-serif font-bold text-base sm:text-lg text-[#2D2A26]">
                        {studentName}
                      </span>
                      {status === 'COMPLETED' ? (
                        <span className="text-[11px] font-sans font-bold bg-[#FFF1ED] text-[#E87A5D] border border-[#E87A5D]/20 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          전·후 기록 완료
                        </span>
                      ) : status === 'BEFORE_ONLY' ? (
                        <span className="text-[11px] font-sans font-bold bg-[#F5EFE6] text-[#3D3A35] border border-[#EBE7E1] px-2.5 py-0.5 rounded-full">
                          수업 전만 작성
                        </span>
                      ) : (
                        <span className="text-[11px] font-sans font-normal bg-[#FAF9F7] text-[#8C867E] border border-[#EBE7E1] px-2.5 py-0.5 rounded-full">
                          미참여
                        </span>
                      )}
                    </div>

                    {emotionShift && (
                      <span className="text-xs font-sans font-bold px-3 py-1 rounded-xl bg-[#FAF9F7] border border-[#EBE7E1] text-[#3D3A35] flex items-center gap-2">
                        <span>{emotionShift.fromEmotion}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-[#8C867E]" />
                        <span className="text-[#E87A5D] font-bold">{emotionShift.toEmotion}</span>
                      </span>
                    )}
                  </div>

                  {/* 2-Column Comparison */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Before Column */}
                    <div className="bg-[#FAF9F7] border border-[#EBE7E1] rounded-xl p-3.5 space-y-2">
                      <div className="flex items-center justify-between text-xs font-serif font-bold text-[#3D3A35]">
                        <span className="flex items-center gap-1.5">
                          <Sun className="w-3.5 h-3.5 text-[#E87A5D]" />
                          수업 전 (Before)
                        </span>
                        {beforeResponse && (
                          <span className="text-[11px] font-sans text-[#8C867E] font-normal">
                            {beforeResponse.displayTime}
                          </span>
                        )}
                      </div>

                      {beforeResponse ? (
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-sans font-bold bg-[#F5EFE6] text-[#3D3A35] px-2.5 py-0.5 rounded-lg border border-[#EBE7E1]">
                              {beforeResponse.emotion}
                            </span>
                            <span className="text-[11px] font-sans text-[#8C867E]">
                              ({beforeResponse.categoryName})
                            </span>
                          </div>
                          <p className="text-xs font-sans text-[#3D3A35] italic leading-relaxed pt-0.5">
                            "{beforeResponse.comment || '기대 멘트 미작성'}"
                          </p>
                        </div>
                      ) : (
                        <p className="text-xs font-sans text-[#8C867E] py-1">수업 전 기록이 없습니다.</p>
                      )}
                    </div>

                    {/* After Column */}
                    <div className="bg-[#FFF1ED] border border-[#E87A5D]/20 rounded-xl p-3.5 space-y-2">
                      <div className="flex items-center justify-between text-xs font-serif font-bold text-[#E87A5D]">
                        <span className="flex items-center gap-1.5">
                          <Moon className="w-3.5 h-3.5 text-[#E87A5D]" />
                          수업 후 (After)
                        </span>
                        {afterResponse && (
                          <span className="text-[11px] font-sans text-[#8C867E] font-normal">
                            {afterResponse.displayTime}
                          </span>
                        )}
                      </div>

                      {afterResponse ? (
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-sans font-bold bg-white text-[#E87A5D] px-2.5 py-0.5 rounded-lg border border-[#E87A5D]/30">
                              {afterResponse.emotion}
                            </span>
                            <span className="text-[11px] font-sans text-[#8C867E]">
                              ({afterResponse.categoryName})
                            </span>
                          </div>
                          <p className="text-xs font-sans text-[#3D3A35] italic leading-relaxed pt-0.5">
                            "{afterResponse.comment || '소감 멘트 미작성'}"
                          </p>
                        </div>
                      ) : (
                        <p className="text-xs font-sans text-[#8C867E] py-1">수업 후 소감이 아직 기록되지 않았습니다.</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredRecords.length === 0 && (
              <div className="bg-white rounded-2xl p-8 text-center text-[#8C867E] font-sans border border-[#EBE7E1]">
                검색 조건에 해당하는 참여자가 없습니다.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: SESSIONS & ROSTER MANAGEMENT */}
      {activeTab === 'ROSTER' && (
        <div className="space-y-6">
          {/* Active Session Info & Roster Editor */}
          <div className="bg-white rounded-2xl p-6 border border-[#EBE7E1] shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-serif font-bold text-[#2D2A26]">
                  현재 수업 명단 관리 ({activeSession.roster.length}명)
                </h3>
                <p className="text-xs font-sans text-[#8C867E]">
                  학생/연수생 명단을 일괄 붙여넣기하거나 직접 수정할 수 있습니다.
                </p>
              </div>

              {!isEditingRoster ? (
                <button
                  type="button"
                  onClick={() => {
                    setEditingRosterText(activeSession.roster.join(', '));
                    setIsEditingRoster(true);
                  }}
                  className="flex items-center gap-1.5 text-xs font-sans font-bold px-3.5 py-2 bg-[#F5EFE6] hover:bg-[#EBE7E1] text-[#3D3A35] border border-[#EBE7E1] rounded-xl transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>명단 일괄 수정</span>
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSaveEditedRoster}
                    className="flex items-center gap-1.5 text-xs font-sans font-bold px-3.5 py-2 bg-[#E87A5D] hover:bg-[#d3694c] text-white rounded-xl shadow-sm"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>저장</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingRoster(false)}
                    className="text-xs font-sans text-[#8C867E] hover:text-[#3D3A35] px-2.5 py-2"
                  >
                    취소
                  </button>
                </div>
              )}
            </div>

            {isEditingRoster ? (
              <div className="space-y-2">
                <textarea
                  rows={5}
                  value={editingRosterText}
                  onChange={(e) => setEditingRosterText(e.target.value)}
                  placeholder="홍길동, 김철수, 이영희 (쉼표나 줄바꿈으로 구분)"
                  className="w-full p-3.5 text-xs sm:text-sm font-sans bg-[#FAF9F7] border border-[#EBE7E1] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E87A5D] font-mono"
                />
                <p className="text-[11px] font-sans text-[#8C867E]">
                  엑셀이나 한글 문서에서 복사한 이름을 쉼표나 엔터(줄바꿈)로 붙여넣으세요.
                </p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2 p-4 bg-[#FAF9F7] rounded-xl border border-[#EBE7E1] max-h-48 overflow-y-auto">
                {activeSession.roster.map((name) => (
                  <span
                    key={name}
                    className="text-xs font-sans bg-white text-[#3D3A35] font-bold px-3 py-1.5 rounded-lg border border-[#EBE7E1] shadow-2xs"
                  >
                    {name}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* New Session Creation Form */}
          <div className="bg-white rounded-2xl p-6 border border-[#EBE7E1] shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-serif font-bold text-[#2D2A26] flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#E87A5D]" />
                <span>새로운 수업/연수 개설하기</span>
              </h3>
              {!isCreatingSession && (
                <button
                  type="button"
                  onClick={() => setIsCreatingSession(true)}
                  className="px-3.5 py-2 text-xs font-sans font-bold bg-[#E87A5D] hover:bg-[#d3694c] text-white rounded-xl shadow-sm transition-all"
                >
                  + 새 수업 추가
                </button>
              )}
            </div>

            {isCreatingSession && (
              <form onSubmit={handleCreateSession} className="space-y-3.5 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-sans font-bold text-[#3D3A35] mb-1">
                      수업/연수명 *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="예: 2학기 디지털 리터러시 역량강화 연수"
                      value={newSessionTitle}
                      onChange={(e) => setNewSessionTitle(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-sans bg-[#FAF9F7] border border-[#EBE7E1] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E87A5D]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-sans font-bold text-[#3D3A35] mb-1">
                      강사 / 담당자
                    </label>
                    <input
                      type="text"
                      placeholder="예: 김민수 선생님"
                      value={newSessionInstructor}
                      onChange={(e) => setNewSessionInstructor(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-sans bg-[#FAF9F7] border border-[#EBE7E1] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E87A5D]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-sans font-bold text-[#3D3A35] mb-1">
                    연수 일자
                  </label>
                  <input
                    type="date"
                    value={newSessionDate}
                    onChange={(e) => setNewSessionDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-sans bg-[#FAF9F7] border border-[#EBE7E1] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E87A5D]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-sans font-bold text-[#3D3A35] mb-1">
                    참여자 명단 일괄 붙여넣기
                  </label>
                  <textarea
                    rows={4}
                    placeholder="참여자 이름을 쉼표나 줄바꿈으로 붙여넣으세요 (예: 강동원, 김태리, 박보검...)"
                    value={newSessionRosterText}
                    onChange={(e) => setNewSessionRosterText(e.target.value)}
                    className="w-full p-3.5 text-xs font-sans bg-[#FAF9F7] border border-[#EBE7E1] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E87A5D] font-mono"
                  />
                </div>

                <div className="flex gap-2.5 pt-1">
                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-[#3D3A35] hover:bg-[#2D2A26] text-white font-sans font-bold text-xs sm:text-sm rounded-xl transition-all"
                  >
                    수업 생성 및 활성화
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCreatingSession(false)}
                    className="px-3.5 py-2.5 text-xs font-sans text-[#8C867E] hover:bg-[#F5EFE6] rounded-xl"
                  >
                    취소
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Session List Table */}
          <div className="bg-white rounded-2xl p-6 border border-[#EBE7E1] shadow-sm space-y-3.5">
            <h3 className="text-base sm:text-lg font-serif font-bold text-[#2D2A26]">
              전체 개설 수업 목록 ({sessions.length}개)
            </h3>

            <div className="space-y-2.5">
              {sessions.map((session) => {
                const isCurrent = session.id === activeSession.id;
                return (
                  <div
                    key={session.id}
                    className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                      isCurrent
                        ? 'bg-[#FFF1ED] border-[#E87A5D]/40 ring-1 ring-[#E87A5D]'
                        : 'bg-[#FAF9F7] border-[#EBE7E1] hover:bg-[#F5EFE6]'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-serif font-bold text-sm sm:text-base text-[#2D2A26]">
                          {session.title}
                        </span>
                        {isCurrent && (
                          <span className="text-[10px] font-sans font-bold bg-[#E87A5D] text-white px-2 py-0.5 rounded-md">
                            현재 활성
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-sans text-[#8C867E]">
                        {session.date} · {session.instructor || '강사 미지정'} · 명단 {session.roster.length}명
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {!isCurrent && (
                        <button
                          type="button"
                          onClick={() => onSelectSession(session.id)}
                          className="text-xs font-sans font-bold text-[#E87A5D] hover:text-[#d3694c] px-3 py-1.5 bg-white border border-[#EBE7E1] rounded-lg hover:bg-[#FAF9F7]"
                        >
                          전환하기
                        </button>
                      )}
                      {sessions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleDeleteSession(session.id)}
                          className="text-[#8C867E] hover:text-rose-700 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: EMOTION DICTIONARY CUSTOMIZER */}
      {activeTab === 'EMOTIONS' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-[#EBE7E1] shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base sm:text-lg font-serif font-bold text-[#2D2A26] flex items-center gap-2">
                  <span>실시간 감정 단어 사전 커스텀 (PRD 5.2)</span>
                </h3>
                <p className="text-xs font-sans text-[#8C867E]">
                  선생님이 원하는 감정 단어를 클릭하여 수정하거나 추가/삭제할 수 있습니다.
                </p>
              </div>

              <button
                type="button"
                onClick={handleResetEmotions}
                className="text-xs font-sans font-bold text-[#8C867E] hover:text-[#3D3A35] flex items-center gap-1 px-3 py-2 bg-[#F5EFE6] hover:bg-[#EBE7E1] rounded-xl border border-[#EBE7E1] transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>기본 45개로 초기화</span>
              </button>
            </div>

            {/* Category Selector Tabs */}
            <div className="grid grid-cols-3 gap-2.5 pt-1">
              {EMOTION_CATEGORIES.map((cat) => (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setActiveDictCategory(cat.key)}
                  className={`p-3.5 rounded-xl border text-center transition-all ${
                    activeDictCategory === cat.key
                      ? `bg-[#FFF1ED] border-[#E87A5D] ring-2 ring-[#E87A5D]/20 font-bold text-[#E87A5D]`
                      : 'bg-[#FAF9F7] border-[#EBE7E1] text-[#8C867E] hover:bg-[#F5EFE6]'
                  }`}
                >
                  <span className="text-xs sm:text-sm font-serif font-bold block">{cat.name}</span>
                  <span className="text-[11px] font-sans opacity-80">
                    ({emotionsDict[cat.key]?.length || 0}개 단어)
                  </span>
                </button>
              ))}
            </div>

            {/* Word List for Active Category */}
            <div className="bg-[#FAF9F7] rounded-2xl p-5 border border-[#EBE7E1] space-y-3.5">
              <span className="text-xs font-sans font-bold text-[#3D3A35] block">
                {EMOTION_CATEGORIES.find((c) => c.key === activeDictCategory)?.name} 단어 목록 (클릭하여 수정)
              </span>

              <div className="flex flex-wrap gap-2">
                {(emotionsDict[activeDictCategory] || []).map((word, index) => {
                  const isEditing = editingWordIndex === index;

                  if (isEditing) {
                    return (
                      <div
                        key={index}
                        className="flex items-center gap-1 bg-white p-1 rounded-xl border-2 border-[#E87A5D] shadow-xs"
                      >
                        <input
                          type="text"
                          value={editingWordValue}
                          onChange={(e) => setEditingWordValue(e.target.value)}
                          className="px-2 py-1 text-xs font-bold w-24 focus:outline-none"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEditedWord(activeDictCategory, index);
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveEditedWord(activeDictCategory, index)}
                          className="p-1 bg-[#E87A5D] text-white rounded-lg text-xs"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingWordIndex(null)}
                          className="p-1 text-[#8C867E] hover:text-[#3D3A35] text-xs"
                        >
                          ✕
                        </button>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={word}
                      className="group flex items-center gap-1.5 px-3 py-2 bg-white rounded-xl border border-[#EBE7E1] text-xs font-sans font-bold text-[#3D3A35] hover:border-[#E87A5D] transition-all shadow-2xs"
                    >
                      <span
                        onClick={() => {
                          setEditingWordIndex(index);
                          setEditingWordValue(word);
                        }}
                        className="cursor-pointer hover:text-[#E87A5D]"
                        title="클릭하여 단어 수정"
                      >
                        {word}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteWord(activeDictCategory, index)}
                        className="text-[#8C867E] group-hover:text-rose-600 hover:bg-rose-50 p-0.5 rounded transition-colors"
                        title="단어 삭제"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Add New Word Form */}
              <div className="flex gap-2.5 pt-3 border-t border-[#EBE7E1]">
                <input
                  type="text"
                  placeholder="새 감정 단어 입력 (예: 보람찬, 이해된, 멍한...)"
                  value={newWordInput}
                  onChange={(e) => setNewWordInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddWord(activeDictCategory);
                  }}
                  className="flex-1 px-3.5 py-2 text-xs sm:text-sm font-sans bg-white border border-[#EBE7E1] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E87A5D]"
                />
                <button
                  type="button"
                  onClick={() => handleAddWord(activeDictCategory)}
                  className="px-4 py-2 bg-[#3D3A35] text-white font-sans font-bold text-xs sm:text-sm rounded-xl hover:bg-[#2D2A26] transition-all flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>단어 추가</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: GOOGLE SHEETS & GAS INTEGRATION */}
      {activeTab === 'SHEETS' && (
        <div className="space-y-6">
          {/* Webhook Configuration */}
          <div className="bg-white rounded-2xl p-6 border border-[#EBE7E1] shadow-sm space-y-4">
            <div className="space-y-1">
              <h3 className="text-base sm:text-lg font-serif font-bold text-[#2D2A26] flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-[#E87A5D]" />
                <span>구글 스프레드시트 실시간 동기화 설정</span>
              </h3>
              <p className="text-xs font-sans text-[#8C867E]">
                참여자들의 전/후 응답이 제출될 때마다 구글 시트로 자동 전송되도록 Webhook URL을 연결합니다.
              </p>
            </div>

            <form onSubmit={handleSaveWebhook} className="space-y-3.5">
              <div>
                <label className="block text-xs font-sans font-bold text-[#3D3A35] mb-1">
                  Google Apps Script Web App URL (웹 앱 배포 주소)
                </label>
                <input
                  type="url"
                  placeholder="https://script.google.com/macros/s/.../exec"
                  value={webhookUrlInput}
                  onChange={(e) => setWebhookUrlInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-mono bg-[#FAF9F7] border border-[#EBE7E1] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E87A5D]"
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-[#E87A5D] hover:bg-[#d3694c] text-white font-sans font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-[#E87A5D]/20 transition-all flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>연동 URL 저장</span>
                </button>

                {webhookSaveNotice && (
                  <span className="text-xs font-sans font-bold text-[#E87A5D] flex items-center gap-1">
                    <Check className="w-4 h-4" />
                    저장되었습니다!
                  </span>
                )}
              </div>
            </form>
          </div>

          {/* Apps Script Code Template & Setup Instructions */}
          <div className="bg-[#2D2A26] text-[#F8F5F2] rounded-2xl p-6 sm:p-7 shadow-md border border-[#3D3A35] space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <span className="text-xs font-sans font-bold text-[#E87A5D]">
                  Google Apps Script 백엔드 코드
                </span>
                <h4 className="text-base sm:text-lg font-serif font-bold text-white">
                  3개 시트 자동 생성 및 실시간 데이터 수신 스크립트
                </h4>
              </div>

              <button
                type="button"
                onClick={handleCopyScript}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-[#E87A5D] hover:bg-[#d3694c] text-white font-sans font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md shadow-[#E87A5D]/20"
              >
                {copiedScript ? (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>코드 복사 완료!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>GAS 코드 복사</span>
                  </>
                )}
              </button>
            </div>

            {/* Quick 3-Step Setup Guide */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-[#EBE7E1]">
              <div className="bg-[#3D3A35]/80 p-3.5 rounded-xl border border-[#4D4A45]">
                <span className="font-sans font-bold text-[#E87A5D] block mb-1">1. 시트 생성</span>
                구글 스프레드시트에서 [확장 프로그램] ➔ [Apps Script]를 클릭합니다.
              </div>
              <div className="bg-[#3D3A35]/80 p-3.5 rounded-xl border border-[#4D4A45]">
                <span className="font-sans font-bold text-[#E87A5D] block mb-1">2. 코드 붙여넣기</span>
                위 복사 버튼을 눌러 스크립트 에디터에 붙여넣고 저장합니다.
              </div>
              <div className="bg-[#3D3A35]/80 p-3.5 rounded-xl border border-[#4D4A45]">
                <span className="font-sans font-bold text-[#E87A5D] block mb-1">3. 웹앱 배포</span>
                [배포] ➔ [새 배포] ➔ 유형: 웹 앱, 액세스 권한: 모든 사용자로 배포 후 URL을 복사해 위에 입력합니다.
              </div>
            </div>

            <div className="bg-[#1E1C1A] rounded-xl p-4 border border-[#3D3A35] text-[11px] font-mono text-[#EBE7E1] max-h-56 overflow-y-auto leading-relaxed select-all">
              {GOOGLE_APPS_SCRIPT_CODE}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
