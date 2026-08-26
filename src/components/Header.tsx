import React from 'react';
import {
  HeartHandshake,
  LayoutDashboard,
  QrCode,
  Users,
  ChevronDown,
  Sparkles,
  Settings,
  Share2,
} from 'lucide-react';
import { AppView, SessionInfo } from '../types';
import { SyncButton, SyncStatus } from './SyncButton';

interface HeaderProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  sessions: SessionInfo[];
  activeSession: SessionInfo;
  onSelectSession: (sessionId: string) => void;
  totalResponsesCount: number;
  onOpenSettings?: () => void;
  onOpenShareQr?: () => void;
  syncStatus?: SyncStatus;
  onManualSync?: () => void | Promise<void>;
  lastSyncedTime?: Date | null;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onNavigate,
  sessions,
  activeSession,
  onSelectSession,
  onOpenSettings,
  onOpenShareQr,
  syncStatus = 'IDLE',
  onManualSync,
  lastSyncedTime,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-[#F8F5F2]/95 backdrop-blur-md border-b border-[#EBE7E1] shadow-[0_1px_3px_rgba(61,58,53,0.05)]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        {/* Brand Logo & Title */}
        <div
          id="brand-header"
          onClick={() => onNavigate('STUDENT_HOME')}
          className="flex items-center gap-2.5 cursor-pointer select-none group"
        >
          <div className="w-10 h-10 rounded-full bg-[#E87A5D] text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform font-serif font-bold text-lg">
            心
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif font-bold text-[#2D2A26] text-lg sm:text-xl tracking-tight">
                마음 출석부
              </span>
              <span className="text-[10px] font-sans font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#F5EFE6] text-[#E87A5D] border border-[#EBE7E1] hidden sm:inline-block">
                Before & After
              </span>
            </div>
            <p className="text-[11px] font-sans text-[#8C867E] hidden sm:block truncate max-w-[200px] md:max-w-xs">
              {activeSession.title}
            </p>
          </div>
        </div>

        {/* Middle: Session Quick Switcher (when multiple exist) */}
        {sessions.length > 1 && (
          <div className="relative hidden md:block">
            <div className="flex items-center gap-1.5 text-xs text-[#3D3A35] bg-[#F5EFE6] hover:bg-[#EBE7E1] px-3 py-1.5 rounded-xl border border-[#EBE7E1] transition-colors font-sans">
              <span className="font-medium truncate max-w-[140px]">{activeSession.title}</span>
              <ChevronDown className="w-3.5 h-3.5 text-[#8C867E]" />
            </div>
            <select
              aria-label="수업 선택"
              value={activeSession.id}
              onChange={(e) => onSelectSession(e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            >
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title} ({s.date})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Right Navigation Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 font-sans">
          {/* Realtime Manual Sync Button */}
          {onManualSync && (
            <SyncButton
              syncStatus={syncStatus}
              onSync={onManualSync}
              lastSyncedTime={lastSyncedTime}
              variant="header"
            />
          )}

          {/* Settings Modal Button (주관자 설정) */}
          {onOpenSettings && (
            <button
              id="nav-btn-settings"
              type="button"
              onClick={onOpenSettings}
              title="연수 정보 및 명단 설정창"
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold text-[#E87A5D] bg-[#FFF1ED] hover:bg-[#FFE5DE] border border-[#E87A5D]/30 transition-all shadow-2xs cursor-pointer"
            >
              <Settings className="w-4 h-4 text-[#E87A5D]" />
              <span className="hidden xs:inline">연수 설정</span>
            </button>
          )}

          {/* Share Link & QR Generator Button */}
          {onOpenShareQr && (
            <button
              id="nav-btn-share-link"
              type="button"
              onClick={onOpenShareQr}
              title="연수생·학생 접속 링크 및 QR코드 공유"
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold text-[#3D3A35] bg-[#F5EFE6] hover:bg-[#EBE7E1] border border-[#EBE7E1] transition-all shadow-2xs cursor-pointer"
            >
              <Share2 className="w-4 h-4 text-[#E87A5D]" />
              <span className="hidden sm:inline">접속 공유·QR</span>
            </button>
          )}

          {/* Student View Button */}
          <button
            id="nav-btn-student"
            onClick={() => onNavigate('STUDENT_HOME')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${
              currentView === 'STUDENT_HOME' || currentView === 'STEP_BEFORE' || currentView === 'STEP_AFTER'
                ? 'bg-[#F5EFE6] text-[#2D2A26] border border-[#EBE7E1] font-bold'
                : 'text-[#3D3A35] hover:bg-[#F5EFE6]'
            }`}
          >
            <Users className="w-4 h-4" />
            <span className="hidden xs:inline">출석하기</span>
          </button>

          {/* QR Screen Mode */}
          <button
            id="nav-btn-qr"
            onClick={() => onNavigate('PRESENT_QR')}
            title="수업용 대형 QR 화면"
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${
              currentView === 'PRESENT_QR'
                ? 'bg-[#3D3A35] text-white'
                : 'text-[#3D3A35] bg-white hover:bg-[#F5EFE6] border border-[#EBE7E1]'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span className="hidden sm:inline">QR 띄우기</span>
          </button>

          {/* Teacher Admin Mode */}
          <button
            id="nav-btn-admin"
            onClick={() => onNavigate('ADMIN')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              currentView === 'ADMIN'
                ? 'bg-[#E87A5D] text-white shadow-sm ring-2 ring-[#E87A5D]/20'
                : 'bg-[#3D3A35] text-white hover:bg-[#2D2A26]'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span className="hidden sm:inline">선생님</span> 관리자
          </button>
        </div>
      </div>
    </header>
  );
};
