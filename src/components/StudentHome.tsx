import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Sun,
  Moon,
  Search,
  CheckCircle2,
  UserCheck,
  Calendar,
  MapPin,
  ChevronRight,
  User,
  ArrowRight,
  Info,
  Layers,
  Settings,
  Users,
  Share2,
  QrCode,
  Copy,
  Check,
} from 'lucide-react';
import { SessionInfo, EmotionResponse, AppView } from '../types';
import { SyncButton, SyncStatus } from './SyncButton';

interface StudentHomeProps {
  sessions: SessionInfo[];
  activeSession: SessionInfo;
  onSelectSession: (sessionId: string) => void;
  selectedStudent: string;
  onSelectStudent: (name: string) => void;
  onStartStep: (step: 'BEFORE' | 'AFTER') => void;
  responses: EmotionResponse[];
  onOpenSettings?: () => void;
  onOpenShareQr?: () => void;
  syncStatus?: SyncStatus;
  onManualSync?: () => void | Promise<void>;
  lastSyncedTime?: Date | null;
}

export const StudentHome: React.FC<StudentHomeProps> = ({
  sessions,
  activeSession,
  onSelectSession,
  selectedStudent,
  onSelectStudent,
  onStartStep,
  responses,
  onOpenSettings,
  onOpenShareQr,
  syncStatus = 'IDLE',
  onManualSync,
  lastSyncedTime,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [customNameInput, setCustomNameInput] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  // Filtered student roster (including registered roster + any students who submitted BEFORE or AFTER responses)
  const filteredRoster = useMemo(() => {
    const roster = activeSession.roster || [];
    // Collect all participant names who submitted a response for this session (BEFORE or AFTER)
    const sessionResponders = responses
      .filter((r) => r.sessionId === activeSession.id)
      .map((r) => r.studentName);
    
    // Union of official roster and all responders
    const allNames = Array.from(new Set([...roster, ...sessionResponders]));

    if (!searchQuery.trim()) return allNames;
    return allNames.filter((name) =>
      name.toLowerCase().includes(searchQuery.trim().toLowerCase())
    );
  }, [activeSession.roster, activeSession.id, responses, searchQuery]);

  // Check responses for currently selected student in active session
  const studentBeforeResponse = useMemo(() => {
    if (!selectedStudent) return null;
    return responses.find(
      (r) =>
        r.sessionId === activeSession.id &&
        r.studentName === selectedStudent &&
        r.type === 'BEFORE'
    );
  }, [selectedStudent, activeSession.id, responses]);

  const studentAfterResponse = useMemo(() => {
    if (!selectedStudent) return null;
    return responses.find(
      (r) =>
        r.sessionId === activeSession.id &&
        r.studentName === selectedStudent &&
        r.type === 'AFTER'
    );
  }, [selectedStudent, activeSession.id, responses]);

  const handleCustomNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customNameInput.trim()) {
      onSelectStudent(customNameInput.trim());
      setShowCustomInput(false);
      setCustomNameInput('');
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto px-4 py-4 sm:py-6 space-y-6">
      {/* Organizer Quick Banner */}
      {onOpenSettings && (
        <div className="bg-[#FAF9F7] rounded-2xl p-3 sm:px-4 sm:py-3 border border-[#EBE7E1] flex items-center justify-between gap-3 text-xs font-sans">
          <div className="flex items-center gap-2 text-[#3D3A35]">
            <span className="w-2 h-2 rounded-full bg-[#E87A5D] animate-pulse" />
            <span className="font-bold text-[#2D2A26]">연수 주관자 안내</span>
            <span className="text-[#8C867E] hidden sm:inline">| 연수생 명단 및 연수 내용 변경</span>
          </div>
          <button
            type="button"
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-[#F5EFE6] text-[#E87A5D] border border-[#E87A5D]/30 font-bold rounded-xl shadow-2xs transition-all cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>연수 설정 / 명단 수정</span>
          </button>
        </div>
      )}

      {/* Welcome & Session Artistic Card */}
      <div className="bg-white rounded-2xl p-6 border border-[#EBE7E1] shadow-sm relative overflow-hidden">
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-widest text-[#E87A5D] uppercase bg-[#F5EFE6] px-3 py-1 rounded-full font-sans">
              <Sparkles className="w-3 h-3 text-[#E87A5D]" />
              Mind Attendance System
            </span>
            <div className="flex items-center gap-1.5 text-xs text-[#8C867E] font-medium font-sans">
              <Calendar className="w-3.5 h-3.5 text-[#8C867E]" />
              <span>{activeSession.date}</span>
            </div>
          </div>

          {/* Session Title with Artistic Left Border Bar */}
          <div className="border-l-2 border-[#E87A5D] pl-4 py-1">
            <p className="text-[#8C867E] uppercase tracking-widest text-[10px] font-sans font-bold mb-1">
              Current Session
            </p>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#2D2A26] leading-snug">
              {activeSession.title}
            </h2>
            {activeSession.subtitle && (
              <p className="text-xs sm:text-sm font-sans text-[#E87A5D] font-medium mt-1">
                {activeSession.subtitle}
              </p>
            )}
          </div>

          {/* Session Notice / Description if present */}
          {activeSession.description && (
            <div className="bg-[#FAF9F7] rounded-xl p-3 text-xs font-sans text-[#5C564E] border border-[#EBE7E1] leading-relaxed">
              {activeSession.description}
            </div>
          )}

          {/* Session Switcher if multiple */}
          {sessions.length > 1 && (
            <div className="relative pt-1">
              <select
                id="select-session-main"
                value={activeSession.id}
                onChange={(e) => onSelectSession(e.target.value)}
                className="w-full text-sm font-sans font-medium text-[#3D3A35] bg-[#FAF9F7] border border-[#EBE7E1] rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#E87A5D] transition-all appearance-none cursor-pointer"
              >
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title} ({s.date})
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[#8C867E] pt-1">
                <ChevronRight className="w-4 h-4 rotate-90" />
              </div>
            </div>
          )}

          {/* Session Meta Info */}
          {(activeSession.instructor || activeSession.location || activeSession.targetAudience) && (
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 pt-1 text-xs text-[#8C867E] font-sans">
              {activeSession.instructor && (
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#E87A5D]" />
                  <span>강사: <strong className="text-[#3D3A35]">{activeSession.instructor}</strong></span>
                </div>
              )}
              {activeSession.location && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#E87A5D]" />
                  <span>{activeSession.location}</span>
                </div>
              )}
              {activeSession.targetAudience && (
                <div className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-[#E87A5D]" />
                  <span>{activeSession.targetAudience}</span>
                </div>
              )}
            </div>
          )}

          {/* Quick Share / QR Code Action Buttons */}
          <div className="pt-2 border-t border-[#EBE7E1] flex flex-wrap items-center gap-2">
            {onManualSync && (
              <SyncButton
                syncStatus={syncStatus}
                onSync={onManualSync}
                lastSyncedTime={lastSyncedTime}
                variant="full"
                className="w-full sm:w-auto"
              />
            )}

            {onOpenShareQr && (
              <button
                type="button"
                id="btn-quick-share-qr"
                onClick={onOpenShareQr}
                className="flex-1 py-2 px-3 bg-[#FAF9F7] hover:bg-[#F5EFE6] text-[#3D3A35] border border-[#EBE7E1] text-xs font-sans font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Share2 className="w-3.5 h-3.5 text-[#E87A5D]" />
                <span>접속 링크 공유</span>
              </button>
            )}

            {onOpenShareQr && (
              <button
                type="button"
                id="btn-quick-create-qr"
                onClick={onOpenShareQr}
                className="flex-1 py-2 px-3 bg-[#FAF9F7] hover:bg-[#F5EFE6] text-[#3D3A35] border border-[#EBE7E1] text-xs font-sans font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <QrCode className="w-3.5 h-3.5 text-[#3D3A35]" />
                <span>QR코드 생성·표시</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Step 1: Select Name Card */}
      <div className="bg-white rounded-2xl p-6 border border-[#EBE7E1] shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-base font-serif font-bold text-[#2D2A26] flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[#F5EFE6] text-[#E87A5D] flex items-center justify-center font-bold text-xs">
              ✓
            </div>
            <span>참여자 이름 선택</span>
          </label>
          {selectedStudent && (
            <span className="text-xs font-sans font-bold px-3 py-1 rounded-full bg-[#F5EFE6] text-[#3D3A35] border border-[#EBE7E1]">
              선택됨: <strong className="text-[#E87A5D]">{selectedStudent}</strong>
            </span>
          )}
        </div>

        {/* Quick Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-[#8C867E] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="input-search-student"
            type="text"
            placeholder="이름 검색 또는 빠른 찾기..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2.5 text-sm font-sans bg-[#FAF9F7] border border-[#EBE7E1] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E87A5D] focus:bg-white transition-all placeholder:text-[#8C867E]"
          />
        </div>

        {/* Name Chips Grid */}
        <div className="max-h-44 overflow-y-auto pr-1 py-1 flex flex-wrap gap-2 scrollbar-thin">
          {filteredRoster.map((name) => {
            const isSelected = selectedStudent === name;
            const hasBefore = responses.some(
              (r) =>
                r.sessionId === activeSession.id &&
                r.studentName === name &&
                r.type === 'BEFORE'
            );
            const hasAfter = responses.some(
              (r) =>
                r.sessionId === activeSession.id &&
                r.studentName === name &&
                r.type === 'AFTER'
            );

            return (
              <button
                key={name}
                id={`student-chip-${name}`}
                type="button"
                onClick={() => onSelectStudent(name)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-sans transition-all min-h-[40px] touch-manipulation select-none ${
                  isSelected
                    ? 'bg-[#FFF1ED] text-[#E87A5D] border-2 border-[#E87A5D] font-bold shadow-xs scale-[1.02]'
                    : 'bg-[#F5F5F5] text-[#3D3A35] hover:bg-[#EBE7E1] border border-transparent'
                }`}
              >
                <span>{name}</span>
                {hasBefore && hasAfter ? (
                  <span
                    title="전·후 기록 모두 완료"
                    className="w-2 h-2 rounded-full bg-[#22C55E]"
                  />
                ) : hasBefore ? (
                  <span
                    title="수업 전 기록 완료"
                    className="w-2 h-2 rounded-full bg-[#E87A5D]"
                  />
                ) : hasAfter ? (
                  <span
                    title="수업 후 소감 완료"
                    className="w-2 h-2 rounded-full bg-[#3D3A35]"
                  />
                ) : null}
              </button>
            );
          })}

          {filteredRoster.length === 0 && (
            <div className="py-6 text-center w-full font-sans space-y-2">
              <p className="text-xs text-[#8C867E]">
                {activeSession.roster?.length === 0
                  ? '아직 등록된 연수생 명단이 없습니다.'
                  : '검색 조건과 일치하는 이름이 없습니다.'}
              </p>
              {onOpenSettings && activeSession.roster?.length === 0 && (
                <button
                  type="button"
                  onClick={onOpenSettings}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#FFF1ED] text-[#E87A5D] hover:bg-[#FFE5DE] border border-[#E87A5D]/30 font-bold text-xs rounded-xl transition-all"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>연수생 명단 입력하기</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Option to direct input name if not on roster */}
        {!showCustomInput ? (
          <button
            type="button"
            onClick={() => setShowCustomInput(true)}
            className="text-xs text-[#8C867E] hover:text-[#E87A5D] font-sans font-medium underline flex items-center gap-1 pt-1"
          >
            + 명단에 내 이름이 없나요? 직접 입력하기
          </button>
        ) : (
          <form onSubmit={handleCustomNameSubmit} className="flex gap-2 pt-2">
            <input
              type="text"
              placeholder="본인 이름 입력"
              value={customNameInput}
              onChange={(e) => setCustomNameInput(e.target.value)}
              className="flex-1 px-3 py-2 text-xs font-sans bg-[#FAF9F7] border border-[#EBE7E1] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E87A5D]"
              autoFocus
            />
            <button
              type="submit"
              className="px-4 py-2 bg-[#3D3A35] text-white text-xs font-sans font-bold rounded-xl hover:bg-[#2D2A26] transition-colors"
            >
              선택
            </button>
            <button
              type="button"
              onClick={() => setShowCustomInput(false)}
              className="px-3 py-2 text-[#8C867E] text-xs font-sans hover:bg-[#F5EFE6] rounded-xl"
            >
              취소
            </button>
          </form>
        )}
      </div>

      {/* Step 2 & 3: Major Action Cards (Artistic Flair Archetype) */}
      <div className="space-y-4 pt-1">
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-[#8C867E]">
            Step By Step · 기록 단계
          </span>
          {!selectedStudent && (
            <span className="text-xs text-[#E87A5D] font-sans font-bold">
              * 위에서 이름을 먼저 선택해 주세요
            </span>
          )}
        </div>

        {/* Card 1: [Step 1] 수업 시작 전 기분 기록하기 */}
        <button
          id="btn-step-before"
          type="button"
          disabled={!selectedStudent}
          onClick={() => onStartStep('BEFORE')}
          className={`w-full text-left p-6 rounded-2xl border transition-all relative group overflow-hidden ${
            !selectedStudent
              ? 'bg-white/60 border-[#EBE7E1] opacity-60 cursor-not-allowed'
              : studentBeforeResponse
              ? 'bg-white border-[#E87A5D]/40 shadow-sm hover:border-[#E87A5D]'
              : 'bg-white border-[#EBE7E1] hover:border-[#E87A5D] shadow-sm hover:shadow-md active:scale-[0.99]'
          }`}
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-5">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 font-sans font-bold text-lg transition-transform group-hover:scale-105 ${
                  studentBeforeResponse
                    ? 'bg-[#F5EFE6] text-[#E87A5D]'
                    : 'bg-[#F5EFE6] text-[#E87A5D]'
                }`}
              >
                01
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-sans font-bold text-xs text-[#E87A5D] uppercase tracking-wider">
                    STEP 1
                  </span>
                  {studentBeforeResponse && (
                    <span className="text-[10px] font-sans font-bold text-[#22C55E] flex items-center gap-1 bg-[#22C55E]/10 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3" />
                      기록 완료
                    </span>
                  )}
                </div>
                <h3 className="text-lg sm:text-xl font-serif font-bold text-[#2D2A26]">
                  수업 시작 전 기분 기록하기
                </h3>
                <p className="text-xs font-sans text-[#8C867E] leading-relaxed">
                  오늘 나의 기분(감정 45선)과 기대하는 점을 남겨주세요.
                </p>
                {studentBeforeResponse && (
                  <p className="text-xs font-sans text-[#E87A5D] font-medium pt-0.5">
                    선택한 감정: <strong className="underline">{studentBeforeResponse.emotion}</strong> (수정 가능)
                  </p>
                )}
              </div>
            </div>
            <div className="shrink-0 text-[#8C867E] group-hover:text-[#E87A5D] group-hover:translate-x-1 transition-all">
              <ArrowRight className="w-5 h-5" />
            </div>
          </div>
        </button>

        {/* Card 2: [Step 2] 수업 마치고 소감 남기기 (Dark Contrast Feature Card in Artistic Flair Theme) */}
        <button
          id="btn-step-after"
          type="button"
          disabled={!selectedStudent}
          onClick={() => onStartStep('AFTER')}
          className={`w-full text-left p-6 rounded-2xl border transition-all relative group overflow-hidden ${
            !selectedStudent
              ? 'bg-[#3D3A35]/50 text-white/50 border-[#3D3A35] opacity-60 cursor-not-allowed'
              : 'bg-[#3D3A35] text-white border-[#3D3A35] shadow-lg hover:shadow-xl active:scale-[0.99]'
          }`}
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-5">
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center shrink-0 font-sans font-bold text-white text-lg transition-transform group-hover:scale-105">
                02
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-sans font-bold text-xs text-[#E87A5D] uppercase tracking-wider">
                    STEP 2
                  </span>
                  {studentAfterResponse && (
                    <span className="text-[10px] font-sans font-bold text-[#22C55E] flex items-center gap-1 bg-[#22C55E]/20 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3" />
                      작성 완료
                    </span>
                  )}
                </div>
                <h3 className="text-lg sm:text-xl font-serif font-bold text-white">
                  수업 마치고 소감 남기기
                </h3>
                <p className="text-xs font-sans text-white/70 leading-relaxed">
                  수업 후 변화된 마음과 나에게 가장 남는 한 마디를 기록해 주세요.
                </p>
                {studentAfterResponse && (
                  <p className="text-xs font-sans text-[#E87A5D] font-medium pt-0.5">
                    기록한 감정: <strong className="underline text-white">{studentAfterResponse.emotion}</strong> (수정 가능)
                  </p>
                )}
              </div>
            </div>
            <div className="shrink-0 text-white/60 group-hover:text-white group-hover:translate-x-1 transition-all">
              <ArrowRight className="w-5 h-5" />
            </div>
          </div>
        </button>
      </div>

      {/* Live Session Counter Banner */}
      <div className="flex justify-between items-center bg-white rounded-2xl p-5 border border-[#EBE7E1] font-sans">
        <div>
          <p className="text-[10px] uppercase tracking-widest font-bold text-[#8C867E] mb-1">
            Active Participants
          </p>
          <p className="text-xl sm:text-2xl font-serif font-bold text-[#2D2A26]">
            {new Set(responses.filter(r => r.sessionId === activeSession.id).map(r => r.studentName)).size} / {Math.max(activeSession.roster?.length || 0, new Set(responses.filter(r => r.sessionId === activeSession.id).map(r => r.studentName)).size)} 명 참여
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-widest font-bold text-[#8C867E] mb-1">
            Status
          </p>
          <p className="text-sm font-bold text-[#22C55E] flex items-center gap-1.5 justify-end">
            <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-ping" />
            Live Tracking
          </p>
        </div>
      </div>

      {/* Helpful tips footer for participants */}
      <div className="bg-[#FAF9F7] rounded-xl p-4 border border-[#EBE7E1] flex items-start gap-3 text-xs text-[#8C867E] font-sans">
        <Info className="w-4 h-4 text-[#E87A5D] shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <span className="font-bold text-[#3D3A35]">마음 출석부 가이드:</span> 수업 시작 전과 종료 후에 각각 솔직한 감정을 남겨주시면, 변화된 마음을 함께 나누고 수업 효과를 성찰하는 소중한 자료가 됩니다.
        </p>
      </div>
    </div>
  );
};
