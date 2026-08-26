import React, { useState, useEffect } from 'react';
import {
  X,
  Settings,
  Users,
  BookOpen,
  Calendar,
  User,
  MapPin,
  FileText,
  Plus,
  Trash2,
  Save,
  Check,
  Sparkles,
  ArrowUpDown,
  Copy,
  Layers,
  Database,
  ExternalLink,
  Code,
  Download,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Send,
  Cloud,
  Globe,
  Wifi,
  Key,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';
import { SessionInfo, GoogleSheetsConfig, EmotionResponse, SupabaseConfig } from '../types';
import { GOOGLE_APPS_SCRIPT_CODE } from '../utils/gasTemplate';
import { testGoogleSheetsWebhook, syncBatchToGoogleSheets, exportResponsesToCsv, downloadFile } from '../utils/storage';
import {
  SUPABASE_SQL_SCHEMA,
  testSupabaseConnection,
  batchSyncResponsesToSupabase,
} from '../utils/supabaseClient';

interface TrainingSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: SessionInfo[];
  activeSession: SessionInfo;
  onSelectSession: (sessionId: string) => void;
  onUpdateSessions: (sessions: SessionInfo[]) => void;
  sheetsConfig: GoogleSheetsConfig;
  onUpdateSheetsConfig: (config: GoogleSheetsConfig) => void;
  supabaseConfig: SupabaseConfig;
  onUpdateSupabaseConfig: (config: SupabaseConfig) => void;
  responses: EmotionResponse[];
  onTriggerSupabaseSync?: () => Promise<void>;
}

type SettingsTab = 'ROSTER' | 'INFO' | 'SUPABASE' | 'SHEETS' | 'SESSIONS';

export const TrainingSettingsModal: React.FC<TrainingSettingsModalProps> = ({
  isOpen,
  onClose,
  sessions,
  activeSession,
  onSelectSession,
  onUpdateSessions,
  sheetsConfig,
  onUpdateSheetsConfig,
  supabaseConfig,
  onUpdateSupabaseConfig,
  responses,
  onTriggerSupabaseSync,
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('ROSTER');

  // Form State for Active Session Info
  const [title, setTitle] = useState(activeSession.title);
  const [subtitle, setSubtitle] = useState(activeSession.subtitle || '');
  const [instructor, setInstructor] = useState(activeSession.instructor || '');
  const [date, setDate] = useState(activeSession.date);
  const [location, setLocation] = useState(activeSession.location || '');
  const [targetAudience, setTargetAudience] = useState(activeSession.targetAudience || '');
  const [description, setDescription] = useState(activeSession.description || '');

  // Roster Management State
  const [roster, setRoster] = useState<string[]>(activeSession.roster || []);
  const [bulkInputText, setBulkInputText] = useState('');
  const [singleNameInput, setSingleNameInput] = useState('');
  const [saveFeedback, setSaveFeedback] = useState(false);
  const [copiedFeedback, setCopiedFeedback] = useState(false);

  // Supabase Config State
  const [supabaseUrl, setSupabaseUrl] = useState(supabaseConfig.url || '');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(supabaseConfig.anonKey || '');
  const [supabaseAutoSync, setSupabaseAutoSync] = useState(supabaseConfig.autoSync ?? true);
  const [supabaseTestStatus, setSupabaseTestStatus] = useState<'IDLE' | 'TESTING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [supabaseTestMessage, setSupabaseTestMessage] = useState<string>('');
  const [supabaseBatchSyncStatus, setSupabaseBatchSyncStatus] = useState<'IDLE' | 'SYNCING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [copiedSupabaseSql, setCopiedSupabaseSql] = useState(false);

  // Google Sheets Config State
  const [webhookUrl, setWebhookUrl] = useState(sheetsConfig.webhookUrl || '');
  const [autoSync, setAutoSync] = useState(sheetsConfig.autoSync ?? true);
  const [testStatus, setTestStatus] = useState<'IDLE' | 'TESTING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [batchSyncStatus, setBatchSyncStatus] = useState<'IDLE' | 'SYNCING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [copiedGasCode, setCopiedGasCode] = useState(false);

  // New Session Creation Form State
  const [newSessionTitle, setNewSessionTitle] = useState('');
  const [newSessionInstructor, setNewSessionInstructor] = useState('');
  const [newSessionDate, setNewSessionDate] = useState(new Date().toISOString().split('T')[0]);
  const [newSessionLocation, setNewSessionLocation] = useState('');
  const [newSessionRosterText, setNewSessionRosterText] = useState('');

  // Sync state whenever activeSession changes or modal opens
  useEffect(() => {
    setTitle(activeSession.title);
    setSubtitle(activeSession.subtitle || '');
    setInstructor(activeSession.instructor || '');
    setDate(activeSession.date);
    setLocation(activeSession.location || '');
    setTargetAudience(activeSession.targetAudience || '');
    setDescription(activeSession.description || '');
    setRoster(activeSession.roster || []);
    setBulkInputText((activeSession.roster || []).join('\n'));

    setSupabaseUrl(supabaseConfig.url || '');
    setSupabaseAnonKey(supabaseConfig.anonKey || '');
    setSupabaseAutoSync(supabaseConfig.autoSync ?? true);

    setWebhookUrl(sheetsConfig.webhookUrl || '');
    setAutoSync(sheetsConfig.autoSync ?? true);
  }, [activeSession, sheetsConfig, supabaseConfig, isOpen]);

  if (!isOpen) return null;

  // Helper: Parse string of names by comma, newline, tab, slash, semicolon
  const parseNames = (text: string): string[] => {
    return text
      .split(/[\n,;\t/]+/)
      .map((n) => n.trim())
      .filter((n) => n.length > 0);
  };

  // Save Session Info & Roster to Parent State
  const handleSaveAll = () => {
    const updatedSession: SessionInfo = {
      ...activeSession,
      title: title.trim() || '직무연수 과정',
      subtitle: subtitle.trim(),
      instructor: instructor.trim(),
      date: date.trim() || new Date().toISOString().split('T')[0],
      location: location.trim(),
      targetAudience: targetAudience.trim(),
      description: description.trim(),
      roster: roster,
    };

    const updatedSessions = sessions.map((s) =>
      s.id === activeSession.id ? updatedSession : s
    );

    onUpdateSessions(updatedSessions);
    setSaveFeedback(true);
    setTimeout(() => setSaveFeedback(false), 2000);
  };

  // Bulk Apply from textarea
  const handleApplyBulkRoster = () => {
    const parsed = parseNames(bulkInputText);
    const unique = Array.from(new Set(parsed));
    setRoster(unique);

    const updatedSession: SessionInfo = {
      ...activeSession,
      roster: unique,
    };
    const updatedSessions = sessions.map((s) =>
      s.id === activeSession.id ? updatedSession : s
    );
    onUpdateSessions(updatedSessions);

    setSaveFeedback(true);
    setTimeout(() => setSaveFeedback(false), 2000);
  };

  // Add single name
  const handleAddSingleName = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = singleNameInput.trim();
    if (!clean) return;
    if (!roster.includes(clean)) {
      const nextRoster = [...roster, clean];
      setRoster(nextRoster);
      setBulkInputText(nextRoster.join('\n'));
      
      const updatedSession = { ...activeSession, roster: nextRoster };
      onUpdateSessions(sessions.map((s) => (s.id === activeSession.id ? updatedSession : s)));
    }
    setSingleNameInput('');
  };

  // Remove single name
  const handleRemoveName = (nameToRemove: string) => {
    const nextRoster = roster.filter((n) => n !== nameToRemove);
    setRoster(nextRoster);
    setBulkInputText(nextRoster.join('\n'));

    const updatedSession = { ...activeSession, roster: nextRoster };
    onUpdateSessions(sessions.map((s) => (s.id === activeSession.id ? updatedSession : s)));
  };

  // Sort alphabetically
  const handleSortAlphabetical = () => {
    const sorted = [...roster].sort((a, b) => a.localeCompare(b, 'ko'));
    setRoster(sorted);
    setBulkInputText(sorted.join('\n'));

    const updatedSession = { ...activeSession, roster: sorted };
    onUpdateSessions(sessions.map((s) => (s.id === activeSession.id ? updatedSession : s)));
  };

  // Clear all roster
  const handleClearRoster = () => {
    if (window.confirm('현재 연수의 등록된 연수생 명단을 모두 비우시겠습니까?')) {
      setRoster([]);
      setBulkInputText('');
      const updatedSession = { ...activeSession, roster: [] };
      onUpdateSessions(sessions.map((s) => (s.id === activeSession.id ? updatedSession : s)));
    }
  };

  // Quick Preset Handlers
  const handleLoadPreset = (presetType: 'TEACHERS' | 'PRIMARY' | 'SECONDARY' | 'MINI') => {
    let sampleNames: string[] = [];
    if (presetType === 'TEACHERS') {
      sampleNames = [
        '강동원', '고윤정', '김태리', '김혜수', '남주혁',
        '박보검', '박은빈', '손예진', '송중기', '신민아',
        '안효섭', '아이유', '이도현', '이병헌', '이정재',
        '전여빈', '정해인', '조인성', '한지민', '황정민'
      ];
    } else if (presetType === 'PRIMARY') {
      sampleNames = [
        '김민재', '이서연', '박도윤', '최하은', '정시우',
        '강지아', '조현우', '윤서아', '장민준', '임지유',
        '한건우', '오예린', '서주원', '신수아', '권예준',
        '황채원', '송시후', '안서현', '류하준', '홍다은'
      ];
    } else if (presetType === 'SECONDARY') {
      sampleNames = [
        '김하늘', '이진우', '박소영', '정민호', '최수아',
        '윤서준', '장미란', '오세훈', '배수지', '임시완',
        '강하늘', '문채원', '유연석', '서현진', '이준기'
      ];
    } else {
      sampleNames = ['김선생', '이선생', '박선생', '최선생', '정선생'];
    }

    setRoster(sampleNames);
    setBulkInputText(sampleNames.join('\n'));
    const updatedSession = { ...activeSession, roster: sampleNames };
    onUpdateSessions(sessions.map((s) => (s.id === activeSession.id ? updatedSession : s)));
    setSaveFeedback(true);
    setTimeout(() => setSaveFeedback(false), 2000);
  };

  // Copy roster to clipboard
  const handleCopyRoster = () => {
    navigator.clipboard.writeText(roster.join('\n'));
    setCopiedFeedback(true);
    setTimeout(() => setCopiedFeedback(false), 2000);
  };

  // Create new session
  const handleCreateNewSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSessionTitle.trim()) return;

    const parsedRoster = parseNames(newSessionRosterText);
    const newSession: SessionInfo = {
      id: `session-${Date.now()}`,
      title: newSessionTitle.trim(),
      instructor: newSessionInstructor.trim(),
      date: newSessionDate || new Date().toISOString().split('T')[0],
      location: newSessionLocation.trim(),
      roster: parsedRoster.length > 0 ? Array.from(new Set(parsedRoster)) : [],
      createdAt: new Date().toISOString(),
      isActive: true,
    };

    onUpdateSessions([...sessions, newSession]);
    onSelectSession(newSession.id);
    setNewSessionTitle('');
    setNewSessionInstructor('');
    setNewSessionLocation('');
    setNewSessionRosterText('');
    setActiveTab('ROSTER');
  };

  // Delete a session
  const handleDeleteSession = (sessionId: string) => {
    if (sessions.length <= 1) {
      alert('최소 1개의 연수 과정이 유지되어야 합니다.');
      return;
    }
    if (window.confirm('이 연수 과정을 삭제하시겠습니까? (관련 설정이 제거됩니다)')) {
      const remaining = sessions.filter((s) => s.id !== sessionId);
      onUpdateSessions(remaining);
      if (activeSession.id === sessionId) {
        onSelectSession(remaining[0].id);
      }
    }
  };

  // Save Supabase Config
  const handleSaveSupabaseConfig = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const newConfig: SupabaseConfig = {
      url: supabaseUrl.trim(),
      anonKey: supabaseAnonKey.trim(),
      autoSync: supabaseAutoSync,
      isConnected: !!(supabaseUrl.trim() && supabaseAnonKey.trim()),
      lastSyncedAt: new Date().toISOString(),
    };
    onUpdateSupabaseConfig(newConfig);
    setSaveFeedback(true);
    setTimeout(() => setSaveFeedback(false), 2000);
  };

  // Test Supabase Connection
  const handleTestSupabase = async () => {
    if (!supabaseUrl.trim() || !supabaseAnonKey.trim()) {
      alert('Supabase Project URL과 Anon Key를 모두 입력해주세요.');
      return;
    }
    setSupabaseTestStatus('TESTING');
    setSupabaseTestMessage('');

    const targetConfig: SupabaseConfig = {
      url: supabaseUrl.trim(),
      anonKey: supabaseAnonKey.trim(),
      autoSync: supabaseAutoSync,
    };

    const res = await testSupabaseConnection(targetConfig);
    if (res.success) {
      setSupabaseTestStatus('SUCCESS');
      setSupabaseTestMessage(res.message);
      handleSaveSupabaseConfig();
      if (onTriggerSupabaseSync) {
        await onTriggerSupabaseSync();
      }
      setTimeout(() => setSupabaseTestStatus('IDLE'), 4000);
    } else {
      setSupabaseTestStatus('ERROR');
      setSupabaseTestMessage(res.message);
    }
  };

  // Batch Sync Responses to Supabase
  const handleBatchSyncSupabase = async () => {
    if (!supabaseUrl.trim() || !supabaseAnonKey.trim()) {
      alert('Supabase Project URL과 Anon Key를 먼저 설정해주세요.');
      return;
    }
    if (responses.length === 0) {
      alert('현재 업로드할 출석부 응답 데이터가 없습니다.');
      return;
    }

    setSupabaseBatchSyncStatus('SYNCING');
    const result = await batchSyncResponsesToSupabase(responses);
    if (result.success) {
      setSupabaseBatchSyncStatus('SUCCESS');
      setTimeout(() => setSupabaseBatchSyncStatus('IDLE'), 3000);
    } else {
      setSupabaseBatchSyncStatus('ERROR');
      setTimeout(() => setSupabaseBatchSyncStatus('IDLE'), 4000);
    }
  };

  // Copy Supabase SQL Schema
  const handleCopySupabaseSql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopiedSupabaseSql(true);
    setTimeout(() => setCopiedSupabaseSql(false), 2000);
  };

  // Save Google Sheets Config
  const handleSaveSheetsConfig = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const newConfig: GoogleSheetsConfig = {
      webhookUrl: webhookUrl.trim(),
      autoSync: autoSync,
      lastSyncedAt: new Date().toISOString(),
    };
    onUpdateSheetsConfig(newConfig);
    setSaveFeedback(true);
    setTimeout(() => setSaveFeedback(false), 2000);
  };

  // Test Webhook Connection
  const handleTestConnection = async () => {
    if (!webhookUrl.trim()) {
      alert('구글 Apps Script 웹 앱 URL을 먼저 입력해주세요.');
      return;
    }
    setTestStatus('TESTING');
    const success = await testGoogleSheetsWebhook(webhookUrl.trim());
    if (success) {
      setTestStatus('SUCCESS');
      handleSaveSheetsConfig();
      setTimeout(() => setTestStatus('IDLE'), 3000);
    } else {
      setTestStatus('ERROR');
      setTimeout(() => setTestStatus('IDLE'), 4000);
    }
  };

  // Batch Sync All Responses to Google Sheets
  const handleBatchSync = async () => {
    if (!webhookUrl.trim()) {
      alert('구글 Apps Script 웹 앱 URL이 설정되지 않았습니다.');
      return;
    }
    if (responses.length === 0) {
      alert('현재 전송할 응답 데이터가 없습니다.');
      return;
    }

    setBatchSyncStatus('SYNCING');
    const success = await syncBatchToGoogleSheets(responses, {
      webhookUrl: webhookUrl.trim(),
      autoSync: true,
    });

    if (success) {
      setBatchSyncStatus('SUCCESS');
      setTimeout(() => setBatchSyncStatus('IDLE'), 3000);
    } else {
      setBatchSyncStatus('ERROR');
      setTimeout(() => setBatchSyncStatus('IDLE'), 4000);
    }
  };

  // Copy GAS Code
  const handleCopyGasCode = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
    setCopiedGasCode(true);
    setTimeout(() => setCopiedGasCode(false), 2000);
  };

  // Export CSV
  const handleExportCsv = () => {
    const csvContent = exportResponsesToCsv(activeSession, responses);
    const fileName = `마음출석부_${activeSession.title.replace(/\s+/g, '_')}_${activeSession.date}.csv`;
    downloadFile(csvContent, fileName, 'text/csv;charset=utf-8;');
  };

  const isSupabaseConnected = !!(supabaseConfig.url && supabaseConfig.anonKey);
  const isSheetsConnected = !!sheetsConfig.webhookUrl;

  return (
    <div className="fixed inset-0 z-50 bg-[#2D2A26]/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-3xl max-h-[92vh] rounded-3xl border border-[#EBE7E1] shadow-2xl flex flex-col overflow-hidden text-[#3D3A35]">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-[#EBE7E1] bg-[#FAF9F7] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FFF1ED] text-[#E87A5D] border border-[#E87A5D]/20 flex items-center justify-center shadow-xs">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-serif font-bold text-[#2D2A26]">
                  연수 주관자 설정창
                </h2>
                <span className="text-[10px] font-sans font-bold px-2.5 py-0.5 rounded-full bg-[#E87A5D] text-white">
                  주관자 전용
                </span>
                {isSupabaseConnected && (
                  <span className="text-[10px] font-sans font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-300 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                    클라우드 실시간 동기화 ON
                  </span>
                )}
              </div>
              <p className="text-xs font-sans text-[#8C867E]">
                연수생 명단 등록, 실시간 클라우드 동기화(Supabase) 및 구글 시트 연동을 설정합니다.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-[#8C867E] hover:text-[#2D2A26] hover:bg-[#F5EFE6] rounded-full transition-colors cursor-pointer"
            title="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 pt-3 border-b border-[#EBE7E1] bg-white flex items-center gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('ROSTER')}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-t-xl font-sans text-xs sm:text-sm font-bold border-b-2 transition-all shrink-0 cursor-pointer ${
              activeTab === 'ROSTER'
                ? 'border-[#E87A5D] text-[#E87A5D] bg-[#FFF1ED]/40'
                : 'border-transparent text-[#8C867E] hover:text-[#3D3A35] hover:bg-[#FAF9F7]'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>연수생 명단 ({roster.length}명)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('INFO')}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-t-xl font-sans text-xs sm:text-sm font-bold border-b-2 transition-all shrink-0 cursor-pointer ${
              activeTab === 'INFO'
                ? 'border-[#E87A5D] text-[#E87A5D] bg-[#FFF1ED]/40'
                : 'border-transparent text-[#8C867E] hover:text-[#3D3A35] hover:bg-[#FAF9F7]'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>직무연수 내용 수정</span>
          </button>

          {/* TAB: Realtime Cloud Sync (Supabase) */}
          <button
            type="button"
            onClick={() => setActiveTab('SUPABASE')}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-t-xl font-sans text-xs sm:text-sm font-bold border-b-2 transition-all shrink-0 cursor-pointer ${
              activeTab === 'SUPABASE'
                ? 'border-[#E87A5D] text-[#E87A5D] bg-[#FFF1ED]/40'
                : 'border-transparent text-[#8C867E] hover:text-[#3D3A35] hover:bg-[#FAF9F7]'
            }`}
          >
            <Cloud className="w-4 h-4" />
            <span className="flex items-center gap-1.5">
              <span>기기 간 실시간 동기화 (Supabase)</span>
              {isSupabaseConnected ? (
                <span className="w-2 h-2 rounded-full bg-blue-500" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-amber-400" />
              )}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('SHEETS')}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-t-xl font-sans text-xs sm:text-sm font-bold border-b-2 transition-all shrink-0 cursor-pointer ${
              activeTab === 'SHEETS'
                ? 'border-[#E87A5D] text-[#E87A5D] bg-[#FFF1ED]/40'
                : 'border-transparent text-[#8C867E] hover:text-[#3D3A35] hover:bg-[#FAF9F7]'
            }`}
          >
            <Database className="w-4 h-4" />
            <span className="flex items-center gap-1.5">
              구글 시트 자동 기록
              {isSheetsConnected ? (
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-gray-300" />
              )}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('SESSIONS')}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-t-xl font-sans text-xs sm:text-sm font-bold border-b-2 transition-all shrink-0 cursor-pointer ${
              activeTab === 'SESSIONS'
                ? 'border-[#E87A5D] text-[#E87A5D] bg-[#FFF1ED]/40'
                : 'border-transparent text-[#8C867E] hover:text-[#3D3A35] hover:bg-[#FAF9F7]'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>연수 과정 목록 ({sessions.length}개)</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: ROSTER MANAGEMENT */}
          {activeTab === 'ROSTER' && (
            <div className="space-y-6">
              {/* Top Banner Guide */}
              <div className="bg-[#FAF9F7] rounded-2xl p-4 border border-[#EBE7E1] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#FFF1ED] text-[#E87A5D] flex items-center justify-center font-bold">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-serif font-bold text-[#2D2A26] block">
                      현재 선택된 연수: {activeSession.title}
                    </span>
                    <span className="text-[11px] font-sans text-[#8C867E]">
                      엑셀이나 한글 문서의 이름 열을 복사하여 아래에 붙여넣으면 즉시 명단이 등록됩니다.
                    </span>
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap items-center gap-1.5 self-end sm:self-auto">
                  <span className="text-[10px] font-sans font-bold text-[#8C867E] mr-1">예시 명단:</span>
                  <button
                    type="button"
                    onClick={() => handleLoadPreset('TEACHERS')}
                    className="text-[11px] font-sans font-medium px-2.5 py-1 bg-white hover:bg-[#F5EFE6] text-[#3D3A35] rounded-lg border border-[#EBE7E1] transition-all cursor-pointer"
                  >
                    교원 연수 20인
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLoadPreset('PRIMARY')}
                    className="text-[11px] font-sans font-medium px-2.5 py-1 bg-white hover:bg-[#F5EFE6] text-[#3D3A35] rounded-lg border border-[#EBE7E1] transition-all cursor-pointer"
                  >
                    학급 20인
                  </button>
                </div>
              </div>

              {/* Bulk Textarea Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-sans font-bold text-[#3D3A35] flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-[#E87A5D]" />
                    <span>명단 일괄 붙여넣기 (줄바꿈, 쉼표, 탭 모두 지원)</span>
                  </label>
                  <span className="text-xs font-sans text-[#8C867E]">
                    실시간 인식: <strong className="text-[#E87A5D]">{parseNames(bulkInputText).length}명</strong>
                  </span>
                </div>

                <textarea
                  rows={5}
                  value={bulkInputText}
                  onChange={(e) => setBulkInputText(e.target.value)}
                  placeholder="예시:&#10;강동원&#10;고윤정&#10;김태리&#10;김혜수&#10;(엑셀에서 이름 열을 복사해 그대로 붙여넣으세요)"
                  className="w-full p-3.5 text-xs sm:text-sm font-sans bg-[#FAF9F7] border border-[#EBE7E1] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#E87A5D] leading-relaxed"
                />

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleApplyBulkRoster}
                      className="px-4 py-2 bg-[#E87A5D] hover:bg-[#d3694c] text-white font-sans font-bold text-xs sm:text-sm rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                      <span>붙여넣은 명단 일괄 적용하기</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSortAlphabetical}
                      disabled={roster.length === 0}
                      className="px-3 py-2 bg-[#F5EFE6] hover:bg-[#EBE7E1] text-[#3D3A35] font-sans font-bold text-xs rounded-xl border border-[#EBE7E1] transition-all flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                    >
                      <ArrowUpDown className="w-3.5 h-3.5 text-[#8C867E]" />
                      <span>가나다순 정렬</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopyRoster}
                      disabled={roster.length === 0}
                      className="px-3 py-2 bg-[#FAF9F7] hover:bg-[#F5EFE6] text-[#3D3A35] font-sans text-xs font-medium rounded-xl border border-[#EBE7E1] transition-all flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                    >
                      {copiedFeedback ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-[#E87A5D]" />
                          <span>복사됨!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-[#8C867E]" />
                          <span>명단 텍스트 복사</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleClearRoster}
                      disabled={roster.length === 0}
                      className="px-3 py-2 text-[#8C867E] hover:text-rose-600 hover:bg-rose-50 text-xs font-medium rounded-xl transition-all disabled:opacity-50 cursor-pointer"
                    >
                      전체 비우기
                    </button>
                  </div>
                </div>
              </div>

              {/* Single Add & Current Roster Tags */}
              <div className="space-y-3 pt-3 border-t border-[#EBE7E1]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h3 className="text-xs font-sans font-bold text-[#3D3A35] flex items-center gap-1.5">
                    <span>현재 등록된 연수생 명단 ({roster.length}명)</span>
                  </h3>

                  <form onSubmit={handleAddSingleName} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="개별 이름 추가..."
                      value={singleNameInput}
                      onChange={(e) => setSingleNameInput(e.target.value)}
                      className="px-3 py-1.5 text-xs font-sans bg-[#FAF9F7] border border-[#EBE7E1] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E87A5D]"
                    />
                    <button
                      type="submit"
                      disabled={!singleNameInput.trim()}
                      className="px-3 py-1.5 bg-[#3D3A35] hover:bg-[#2D2A26] text-white font-sans font-bold text-xs rounded-xl disabled:opacity-40 transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>추가</span>
                    </button>
                  </form>
                </div>

                <div className="p-4 bg-[#FAF9F7] rounded-2xl border border-[#EBE7E1] min-h-[120px] max-h-[220px] overflow-y-auto">
                  {roster.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-6 text-center text-[#8C867E]">
                      <Users className="w-8 h-8 opacity-30 mb-2" />
                      <p className="text-xs font-sans">등록된 연수생이 없습니다.</p>
                      <p className="text-[11px] mt-0.5">상단에 명단을 붙여넣거나 위의 예시 명단을 불러오세요.</p>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {roster.map((name, idx) => (
                        <span
                          key={`${name}-${idx}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-[#EBE7E1] rounded-xl text-xs font-sans text-[#2D2A26] shadow-2xs group hover:border-[#E87A5D]/40 transition-all"
                        >
                          <span className="font-bold text-[#E87A5D] text-[10px]">{idx + 1}</span>
                          <span>{name}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveName(name)}
                            className="text-[#8C867E] hover:text-rose-600 transition-colors cursor-pointer"
                            title="이름 삭제"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: EDIT SESSION INFO */}
          {activeTab === 'INFO' && (
            <div className="space-y-4">
              <div className="p-4 bg-[#FAF9F7] rounded-2xl border border-[#EBE7E1] flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-sans font-bold text-[#2D2A26]">
                    직무연수 기본 정보 수정
                  </h3>
                  <p className="text-[11px] font-sans text-[#8C867E]">
                    출석부 상단과 QR 화면에 표시되는 연수 제목 및 강사 정보를 변경합니다.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleSaveAll}
                  className="px-4 py-2 bg-[#E87A5D] hover:bg-[#d3694c] text-white font-sans font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>정보 저장하기</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-sans font-bold text-[#3D3A35] mb-1.5">
                    연수 과정명 *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-sans bg-[#FAF9F7] border border-[#EBE7E1] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E87A5D]"
                    placeholder="예: 2026 교원 디지털 리터러시 역량강화 직무연수"
                  />
                </div>

                <div>
                  <label className="block text-xs font-sans font-bold text-[#3D3A35] mb-1.5">
                    연수 부제 (선택)
                  </label>
                  <input
                    type="text"
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-sans bg-[#FAF9F7] border border-[#EBE7E1] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E87A5D]"
                    placeholder="예: 마음 챙김과 함께하는 수업 혁신"
                  />
                </div>

                <div>
                  <label className="block text-xs font-sans font-bold text-[#3D3A35] mb-1.5">
                    강사 성명 (선택)
                  </label>
                  <input
                    type="text"
                    value={instructor}
                    onChange={(e) => setInstructor(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-sans bg-[#FAF9F7] border border-[#EBE7E1] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E87A5D]"
                    placeholder="예: 김선생 (교육연구사)"
                  />
                </div>

                <div>
                  <label className="block text-xs font-sans font-bold text-[#3D3A35] mb-1.5">
                    연수 일자
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-sans bg-[#FAF9F7] border border-[#EBE7E1] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E87A5D]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-sans font-bold text-[#3D3A35] mb-1.5">
                    연수 장소 (선택)
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-sans bg-[#FAF9F7] border border-[#EBE7E1] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E87A5D]"
                    placeholder="예: 미래교육센터 302호 ICT실"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-sans font-bold text-[#3D3A35] mb-1.5">
                    연수 대상 / 대상자 안내
                  </label>
                  <input
                    type="text"
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-sans bg-[#FAF9F7] border border-[#EBE7E1] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E87A5D]"
                    placeholder="예: 관내 초·중등 교원 및 교육전문직 20명"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-sans font-bold text-[#3D3A35] mb-1.5">
                    연수 개요 및 안내사항
                  </label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full p-3.5 text-xs sm:text-sm font-sans bg-[#FAF9F7] border border-[#EBE7E1] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E87A5D]"
                    placeholder="연수에 대한 소개나 당부사항을 입력하세요."
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SUPABASE REALTIME CLOUD SYNC */}
          {activeTab === 'SUPABASE' && (
            <div className="space-y-6">
              {/* Header Box */}
              <div className="bg-[#FAF9F7] rounded-2xl p-4 sm:p-5 border border-[#EBE7E1] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center font-bold">
                    <Cloud className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-serif font-bold text-[#2D2A26]">
                        어느 기기에서든 실시간 동기화 (Supabase 연동)
                      </h3>
                      {isSupabaseConnected ? (
                        <span className="text-[10px] font-sans font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                          연동 설정됨
                        </span>
                      ) : (
                        <span className="text-[10px] font-sans font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                          설정 필요
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-sans text-[#8C867E] mt-0.5">
                      연수생 스마트폰과 강사 PC, 빔프로젝터 화면이 <strong>실시간으로 완벽 동기화</strong>됩니다.
                    </p>
                  </div>
                </div>

                <a
                  href="https://supabase.com"
                  target="_blank"
                  rel="noreferrer"
                  className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-[#F5EFE6] text-[#2D2A26] border border-[#EBE7E1] font-sans font-bold text-xs rounded-xl transition-all shrink-0"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
                  <span>Supabase 홈페이지</span>
                </a>
              </div>

              {/* 3 Step Quick Setup Guide */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-sans font-bold text-[#2D2A26] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    <span>Supabase 1분 무료 연동 방법</span>
                  </h4>
                  <button
                    type="button"
                    onClick={handleCopySupabaseSql}
                    className="inline-flex items-center gap-1 text-xs font-sans font-bold text-blue-600 hover:underline cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedSupabaseSql ? 'SQL 쿼리 복사 완료!' : 'SQL 테이블 생성 쿼리 복사'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-sans">
                  {/* Step 1 */}
                  <div className="p-3.5 bg-[#FAF9F7] rounded-2xl border border-[#EBE7E1] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[10px]">
                        1
                      </span>
                      <span className="text-[10px] text-blue-600 font-bold">무료 프로젝트</span>
                    </div>
                    <p className="font-bold text-[#2D2A26]">Supabase 프로젝트 생성</p>
                    <p className="text-[#8C867E] text-[11px] leading-relaxed">
                      <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-blue-600 underline">supabase.com</a> 가입 후 <strong>[New Project]</strong>를 생성합니다.
                    </p>
                  </div>

                  {/* Step 2 */}
                  <div className="p-3.5 bg-[#FAF9F7] rounded-2xl border border-[#EBE7E1] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[10px]">
                        2
                      </span>
                      <button
                        type="button"
                        onClick={handleCopySupabaseSql}
                        className="text-[10px] text-blue-600 hover:underline flex items-center gap-0.5 font-bold cursor-pointer"
                      >
                        <span>SQL 복사</span>
                        <Copy className="w-2.5 h-2.5" />
                      </button>
                    </div>
                    <p className="font-bold text-[#2D2A26]">SQL Editor에서 실행</p>
                    <p className="text-[#8C867E] text-[11px] leading-relaxed">
                      좌측 메뉴 <strong>[SQL Editor]</strong>에 복사한 SQL을 붙여넣고 <strong>[Run]</strong>을 누르면 테이블이 자동 생성됩니다.
                    </p>
                  </div>

                  {/* Step 3 */}
                  <div className="p-3.5 bg-[#FAF9F7] rounded-2xl border border-[#EBE7E1] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[10px]">
                        3
                      </span>
                      <span className="text-[10px] text-emerald-600 font-bold">API 키 복사</span>
                    </div>
                    <p className="font-bold text-[#2D2A26]">Project URL & Anon Key 입력</p>
                    <p className="text-[#8C867E] text-[11px] leading-relaxed">
                      <strong>[Project Settings] → [API]</strong>에서 URL과 anon public key를 복사해 아래 입력란에 넣습니다.
                    </p>
                  </div>
                </div>
              </div>

              {/* Supabase Configuration Form */}
              <form onSubmit={handleSaveSupabaseConfig} className="p-5 bg-[#FAF9F7] rounded-2xl border border-[#EBE7E1] space-y-4">
                {/* Project URL */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-sans font-bold text-[#2D2A26] flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-blue-600" />
                      <span>Project URL (프로젝트 URL) *</span>
                    </span>
                    <span className="text-[11px] font-normal text-[#8C867E]">
                      형식: https://xyzcompany.supabase.co
                    </span>
                  </label>
                  <input
                    type="url"
                    value={supabaseUrl}
                    onChange={(e) => setSupabaseUrl(e.target.value)}
                    placeholder="https://your-project-id.supabase.co"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-sans bg-white border border-[#EBE7E1] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>

                {/* Anon Public Key */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-sans font-bold text-[#2D2A26] flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-blue-600" />
                      <span>Anon Key (공개 anon public key) *</span>
                    </span>
                    <span className="text-[11px] font-normal text-[#8C867E]">
                      클라이언트용 공개 키 (eyJhbGci...)
                    </span>
                  </label>
                  <input
                    type="password"
                    value={supabaseAnonKey}
                    onChange={(e) => setSupabaseAnonKey(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-sans bg-white border border-[#EBE7E1] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>

                {/* Status Message from connection test */}
                {supabaseTestMessage && (
                  <div
                    className={`p-3 rounded-xl text-xs font-sans flex items-start gap-2 ${
                      supabaseTestStatus === 'SUCCESS'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-rose-50 text-rose-800 border border-rose-200'
                    }`}
                  >
                    {supabaseTestStatus === 'SUCCESS' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    )}
                    <div className="leading-relaxed">
                      <p className="font-bold">{supabaseTestMessage}</p>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <label className="flex items-center gap-2 text-xs font-sans text-[#3D3A35] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={supabaseAutoSync}
                      onChange={(e) => setSupabaseAutoSync(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-[#EBE7E1]"
                    />
                    <span className="font-bold">연수생 제출 및 출석부 변경사항 모든 기기에 실시간 자동 동기화</span>
                  </label>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleTestSupabase}
                      disabled={!supabaseUrl.trim() || !supabaseAnonKey.trim() || supabaseTestStatus === 'TESTING'}
                      className="px-3.5 py-2 bg-white hover:bg-[#F5EFE6] text-[#3D3A35] font-sans font-bold text-xs rounded-xl border border-[#EBE7E1] transition-all flex items-center gap-1.5 disabled:opacity-40 cursor-pointer"
                    >
                      {supabaseTestStatus === 'TESTING' ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
                          <span>연결 확인 중...</span>
                        </>
                      ) : (
                        <>
                          <Wifi className="w-3.5 h-3.5 text-blue-600" />
                          <span>연결 테스트 & 동기화</span>
                        </>
                      )}
                    </button>

                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-sans font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                      <span>키 저장하기</span>
                    </button>
                  </div>
                </div>
              </form>

              {/* Data Sync & Batch Upload Action Box */}
              <div className="p-4 bg-white rounded-2xl border border-[#EBE7E1] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-sans font-bold text-[#2D2A26]">
                    기존 로컬 데이터 클라우드로 일괄 업로드 (누적 응답 {responses.length}건)
                  </h4>
                  <p className="text-[11px] font-sans text-[#8C867E] mt-0.5">
                    현재 브라우저에 저장된 출석 데이터 전체를 Supabase 클라우드로 한 번에 동기화합니다.
                  </p>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={handleBatchSyncSupabase}
                    disabled={!supabaseUrl.trim() || !supabaseAnonKey.trim() || responses.length === 0 || supabaseBatchSyncStatus === 'SYNCING'}
                    className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-sans font-bold text-xs rounded-xl border border-blue-200 transition-all flex items-center gap-1.5 disabled:opacity-40 cursor-pointer"
                  >
                    {supabaseBatchSyncStatus === 'SYNCING' ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>클라우드로 업로드 중...</span>
                      </>
                    ) : supabaseBatchSyncStatus === 'SUCCESS' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">업로드 완료!</span>
                      </>
                    ) : (
                      <>
                        <Cloud className="w-3.5 h-3.5" />
                        <span>전체 응답 Supabase로 전송</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* View SQL Schema Box */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-sans font-bold text-[#3D3A35] flex items-center gap-1">
                    <Code className="w-3.5 h-3.5 text-blue-600" />
                    <span>Supabase SQL 테이블 생성 쿼리 미리보기</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleCopySupabaseSql}
                    className="text-xs font-sans font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedSupabaseSql ? '복사됨!' : '전체 SQL 복사'}</span>
                  </button>
                </div>

                <div className="relative">
                  <pre className="p-3.5 bg-[#2D2A26] text-[#FAF9F7] font-mono text-[11px] rounded-2xl overflow-x-auto max-h-48 leading-relaxed selection:bg-blue-600">
                    {SUPABASE_SQL_SCHEMA}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: GOOGLE SHEETS */}
          {activeTab === 'SHEETS' && (
            <div className="space-y-6">
              {/* Header Box */}
              <div className="bg-[#FAF9F7] rounded-2xl p-4 sm:p-5 border border-[#EBE7E1] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center font-bold">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-serif font-bold text-[#2D2A26]">
                        구글 스프레드시트 실시간 기록 연동
                      </h3>
                      {isSheetsConnected ? (
                        <span className="text-[10px] font-sans font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          연동 활성화됨
                        </span>
                      ) : (
                        <span className="text-[10px] font-sans font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                          미설정
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-sans text-[#8C867E] mt-0.5">
                      연수생들이 제출한 출석부 응답이 내 구글 스프레드시트에 행으로 자동 누적됩니다.
                    </p>
                  </div>
                </div>

                <a
                  href="https://sheets.new"
                  target="_blank"
                  rel="noreferrer"
                  className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-[#F5EFE6] text-[#2D2A26] border border-[#EBE7E1] font-sans font-bold text-xs rounded-xl transition-all shrink-0"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-[#E87A5D]" />
                  <span>새 구글시트 만들기</span>
                </a>
              </div>

              {/* Step by Step Guide Cards */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-sans font-bold text-[#2D2A26] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#E87A5D]" />
                    <span>3분 구글 스프레드시트 연동 가이드</span>
                  </h4>
                  <button
                    type="button"
                    onClick={handleCopyGasCode}
                    className="inline-flex items-center gap-1 text-xs font-sans font-bold text-[#E87A5D] hover:underline cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedGasCode ? '스크립트 코드 복사됨!' : '스크립트 코드 복사'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-sans">
                  {/* Step 1 */}
                  <div className="p-3.5 bg-[#FAF9F7] rounded-2xl border border-[#EBE7E1] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="w-5 h-5 rounded-full bg-[#E87A5D] text-white flex items-center justify-center font-bold text-[10px]">
                        1
                      </span>
                      <a
                        href="https://sheets.new"
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-[#E87A5D] hover:underline flex items-center gap-0.5 font-bold"
                      >
                        <span>sheets.new</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <p className="font-bold text-[#2D2A26]">새 스프레드시트 생성</p>
                    <p className="text-[#8C867E] text-[11px] leading-relaxed">
                      구글 스프레드시트를 열고 상단 메뉴 <strong>[확장 프로그램] → [Apps Script]</strong>를 클릭합니다.
                    </p>
                  </div>

                  {/* Step 2 */}
                  <div className="p-3.5 bg-[#FAF9F7] rounded-2xl border border-[#EBE7E1] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="w-5 h-5 rounded-full bg-[#E87A5D] text-white flex items-center justify-center font-bold text-[10px]">
                        2
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyGasCode}
                        className="text-[11px] text-[#E87A5D] hover:underline flex items-center gap-0.5 font-bold cursor-pointer"
                      >
                        <span>코드 복사</span>
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="font-bold text-[#2D2A26]">코드 붙여넣기 및 저장</p>
                    <p className="text-[#8C867E] text-[11px] leading-relaxed">
                      기존 코드를 지우고 <strong>[스크립트 코드 복사]</strong> 버튼을 눌러 복사한 코드를 그대로 붙여넣습니다.
                    </p>
                  </div>

                  {/* Step 3 */}
                  <div className="p-3.5 bg-[#FAF9F7] rounded-2xl border border-[#EBE7E1] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="w-5 h-5 rounded-full bg-[#E87A5D] text-white flex items-center justify-center font-bold text-[10px]">
                        3
                      </span>
                      <span className="text-[10px] text-[#E87A5D] font-bold">Anyone 필수</span>
                    </div>
                    <p className="font-bold text-[#2D2A26]">웹 앱 배포 및 URL 입력</p>
                    <p className="text-[#8C867E] text-[11px] leading-relaxed">
                      우측 상단 <strong>[배포] → [새 배포]</strong> 클릭 후 액세스 권한을 <strong>[모든 사용자(Anyone)]</strong>로 설정하여 생성된 웹 앱 URL을 아래에 넣습니다.
                    </p>
                  </div>
                </div>
              </div>

              {/* Webhook Configuration Form */}
              <form onSubmit={handleSaveSheetsConfig} className="p-5 bg-[#FAF9F7] rounded-2xl border border-[#EBE7E1] space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-sans font-bold text-[#2D2A26] flex items-center justify-between">
                    <span>Google Apps Script 웹 앱 URL (Webhook URL)</span>
                    <span className="text-[11px] font-normal text-[#8C867E]">
                      형식: https://script.google.com/macros/s/.../exec
                    </span>
                  </label>
                  <input
                    type="url"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-sans bg-white border border-[#EBE7E1] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E87A5D]"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <label className="flex items-center gap-2 text-xs font-sans text-[#3D3A35] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoSync}
                      onChange={(e) => setAutoSync(e.target.checked)}
                      className="w-4 h-4 rounded text-[#E87A5D] focus:ring-[#E87A5D] border-[#EBE7E1]"
                    />
                    <span className="font-bold">연수생 제출 시 실시간으로 구글 시트에 자동 기록하기</span>
                  </label>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleTestConnection}
                      disabled={!webhookUrl.trim() || testStatus === 'TESTING'}
                      className="px-3.5 py-2 bg-white hover:bg-[#F5EFE6] text-[#3D3A35] font-sans font-bold text-xs rounded-xl border border-[#EBE7E1] transition-all flex items-center gap-1.5 disabled:opacity-40 cursor-pointer"
                    >
                      {testStatus === 'TESTING' ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#E87A5D]" />
                          <span>연결 테스트 중...</span>
                        </>
                      ) : testStatus === 'SUCCESS' ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700">테스트 성공!</span>
                        </>
                      ) : testStatus === 'ERROR' ? (
                        <>
                          <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                          <span className="text-rose-700">연결 실패 (URL 확인)</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5 text-[#E87A5D]" />
                          <span>연동 테스트</span>
                        </>
                      )}
                    </button>

                    <button
                      type="submit"
                      className="px-4 py-2 bg-[#E87A5D] hover:bg-[#d3694c] text-white font-sans font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                      <span>URL 저장하기</span>
                    </button>
                  </div>
                </div>
              </form>

              {/* Bulk Sync & CSV Export Backup Controls */}
              <div className="p-4 bg-white rounded-2xl border border-[#EBE7E1] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-sans font-bold text-[#2D2A26]">
                    데이터 동기화 및 백업 (현재 누적 응답 {responses.length}건)
                  </h4>
                  <p className="text-[11px] font-sans text-[#8C867E] mt-0.5">
                    기존에 브라우저에 저장된 응답 전체를 구글 시트로 한 번에 내보내거나 CSV 파일로 다운로드합니다.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={handleBatchSync}
                    disabled={!webhookUrl.trim() || responses.length === 0 || batchSyncStatus === 'SYNCING'}
                    className="px-3.5 py-2 bg-[#FFF1ED] hover:bg-[#FFE5DE] text-[#E87A5D] font-sans font-bold text-xs rounded-xl border border-[#E87A5D]/30 transition-all flex items-center gap-1.5 disabled:opacity-40 cursor-pointer"
                  >
                    {batchSyncStatus === 'SYNCING' ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>시트로 전송 중...</span>
                      </>
                    ) : batchSyncStatus === 'SUCCESS' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">전체 전송 완료!</span>
                      </>
                    ) : (
                      <>
                        <Database className="w-3.5 h-3.5" />
                        <span>전체 응답 시트로 일괄 전송</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleExportCsv}
                    disabled={responses.length === 0}
                    className="px-3 py-2 bg-white hover:bg-[#F5EFE6] text-[#3D3A35] font-sans font-medium text-xs rounded-xl border border-[#EBE7E1] transition-all flex items-center gap-1.5 disabled:opacity-40 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-[#8C867E]" />
                    <span>CSV 다운로드</span>
                  </button>
                </div>
              </div>

              {/* View Script Code */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-sans font-bold text-[#3D3A35] flex items-center gap-1">
                    <Code className="w-3.5 h-3.5 text-[#E87A5D]" />
                    <span>Google Apps Script 연동 소스코드 미리보기</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyGasCode}
                    className="text-xs font-sans font-bold text-[#E87A5D] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedGasCode ? '복사됨!' : '전체 코드 복사'}</span>
                  </button>
                </div>

                <div className="relative">
                  <pre className="p-3.5 bg-[#2D2A26] text-[#FAF9F7] font-mono text-[11px] rounded-2xl overflow-x-auto max-h-48 leading-relaxed selection:bg-[#E87A5D]">
                    {GOOGLE_APPS_SCRIPT_CODE}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: ALL SESSIONS */}
          {activeTab === 'SESSIONS' && (
            <div className="space-y-6">
              {/* Existing Sessions List */}
              <div className="space-y-3">
                <h3 className="text-xs font-sans font-bold text-[#3D3A35]">
                  개설된 연수 과정 목록 ({sessions.length}개)
                </h3>

                <div className="space-y-2.5">
                  {sessions.map((s) => {
                    const isSelected = s.id === activeSession.id;
                    return (
                      <div
                        key={s.id}
                        className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-[#FFF1ED] border-[#E87A5D]/40 ring-1 ring-[#E87A5D]'
                            : 'bg-[#FAF9F7] border-[#EBE7E1] hover:bg-[#F5EFE6]'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-serif font-bold text-sm sm:text-base text-[#2D2A26]">
                              {s.title}
                            </span>
                            {isSelected && (
                              <span className="text-[10px] font-sans font-bold px-2 py-0.5 rounded-md bg-[#E87A5D] text-white">
                                현재 선택됨
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-sans text-[#8C867E]">
                            {s.date} · {s.instructor || '강사 미지정'} · 명단 {s.roster.length}명
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          {!isSelected && (
                            <button
                              type="button"
                              onClick={() => {
                                onSelectSession(s.id);
                                setActiveTab('ROSTER');
                              }}
                              className="px-3 py-1.5 text-xs font-sans font-bold text-[#E87A5D] bg-white border border-[#EBE7E1] rounded-xl hover:bg-[#FAF9F7] cursor-pointer"
                            >
                              이 연수 선택
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteSession(s.id)}
                            className="p-2 text-[#8C867E] hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                            title="연수 삭제"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Create New Session Form */}
              <div className="p-5 bg-[#FAF9F7] rounded-2xl border border-[#EBE7E1] space-y-4">
                <h3 className="text-sm font-serif font-bold text-[#2D2A26] flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-[#E87A5D]" />
                  <span>새로운 직무연수 과정 개설하기</span>
                </h3>

                <form onSubmit={handleCreateNewSession} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-sans font-bold text-[#3D3A35] mb-1">
                        새 연수 과정명 *
                      </label>
                      <input
                        type="text"
                        placeholder="예: 2학기 디지털 리터러시 역량강화 직무연수"
                        value={newSessionTitle}
                        onChange={(e) => setNewSessionTitle(e.target.value)}
                        className="w-full px-3.5 py-2 text-xs sm:text-sm font-sans bg-white border border-[#EBE7E1] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E87A5D]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-sans font-bold text-[#3D3A35] mb-1">
                        강사 성명
                      </label>
                      <input
                        type="text"
                        placeholder="예: 이지연 수석교사"
                        value={newSessionInstructor}
                        onChange={(e) => setNewSessionInstructor(e.target.value)}
                        className="w-full px-3.5 py-2 text-xs sm:text-sm font-sans bg-white border border-[#EBE7E1] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E87A5D]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-sans font-bold text-[#3D3A35] mb-1">
                        연수 일자
                      </label>
                      <input
                        type="date"
                        value={newSessionDate}
                        onChange={(e) => setNewSessionDate(e.target.value)}
                        className="w-full px-3.5 py-2 text-xs sm:text-sm font-sans bg-white border border-[#EBE7E1] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E87A5D]"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-sans font-bold text-[#3D3A35] mb-1">
                        연수생 명단 일괄 붙여넣기 (줄바꿈/쉼표)
                      </label>
                      <textarea
                        rows={3}
                        placeholder="연수생 이름을 붙여넣으세요 (예: 강동원, 김태리, 박보검...)"
                        value={newSessionRosterText}
                        onChange={(e) => setNewSessionRosterText(e.target.value)}
                        className="w-full p-3 text-xs font-sans bg-white border border-[#EBE7E1] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E87A5D]"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={!newSessionTitle.trim()}
                      className="px-4 py-2.5 bg-[#3D3A35] hover:bg-[#2D2A26] text-white font-sans font-bold text-xs sm:text-sm rounded-xl disabled:opacity-40 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>새 연수 개설 및 바로 선택</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-[#EBE7E1] bg-[#FAF9F7] flex items-center justify-between">
          <div className="flex items-center gap-2">
            {saveFeedback && (
              <span className="text-xs font-sans font-bold text-[#E87A5D] flex items-center gap-1 animate-in fade-in">
                <Check className="w-4 h-4 stroke-[3]" />
                성공적으로 저장 및 반영되었습니다!
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-[#3D3A35] hover:bg-[#2D2A26] text-white font-sans font-bold text-xs sm:text-sm rounded-xl transition-all cursor-pointer"
            >
              완료 및 닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
