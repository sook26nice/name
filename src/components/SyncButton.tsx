import React from 'react';
import { RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

export type SyncStatus = 'IDLE' | 'SYNCING' | 'SUCCESS' | 'ERROR';

interface SyncButtonProps {
  syncStatus: SyncStatus;
  onSync: () => void | Promise<void>;
  lastSyncedTime?: Date | null;
  variant?: 'header' | 'compact' | 'full';
  className?: string;
}

export const SyncButton: React.FC<SyncButtonProps> = ({
  syncStatus,
  onSync,
  lastSyncedTime,
  variant = 'header',
  className = '',
}) => {
  const isSyncing = syncStatus === 'SYNCING';
  const isSuccess = syncStatus === 'SUCCESS';
  const isError = syncStatus === 'ERROR';

  const formatTime = (d?: Date | null) => {
    if (!d) return '';
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
  };

  const tooltip = isSyncing
    ? '데이터를 실시간 동기화하는 중입니다...'
    : isSuccess
    ? `동기화 완료 (${formatTime(lastSyncedTime)})`
    : isError
    ? '동기화 중 오류가 발생했습니다. 다시 시도해주세요.'
    : `수동 동기화 실행 ${lastSyncedTime ? `(마지막: ${formatTime(lastSyncedTime)})` : ''}`;

  if (variant === 'full') {
    return (
      <button
        id="btn-sync-full"
        type="button"
        onClick={() => {
          if (!isSyncing) onSync();
        }}
        disabled={isSyncing}
        title={tooltip}
        className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-sans font-bold text-xs sm:text-sm border transition-all cursor-pointer shadow-2xs group ${
          isSyncing
            ? 'bg-[#FFF1ED] text-[#E87A5D] border-[#E87A5D]/40 cursor-wait'
            : isSuccess
            ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
            : isError
            ? 'bg-rose-50 text-rose-700 border-rose-300'
            : 'bg-white hover:bg-[#F5EFE6] text-[#3D3A35] border-[#EBE7E1]'
        } ${className}`}
      >
        {isSyncing ? (
          <>
            <RefreshCw className="w-4 h-4 text-[#E87A5D] animate-spin shrink-0" />
            <span className="font-bold">동기화 중</span>
          </>
        ) : isSuccess ? (
          <>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-bold text-emerald-700">동기화 완료</span>
          </>
        ) : isError ? (
          <>
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="font-bold text-rose-700">동기화 재시도</span>
          </>
        ) : (
          <>
            <RefreshCw className="w-4 h-4 text-[#8C867E] group-hover:text-[#2D2A26] group-hover:rotate-180 transition-transform duration-500 shrink-0" />
            <span>수동 동기화</span>
            {lastSyncedTime && (
              <span className="text-[10px] text-[#8C867E] font-normal hidden lg:inline">
                ({formatTime(lastSyncedTime)})
              </span>
            )}
          </>
        )}
      </button>
    );
  }

  return (
    <button
      id="btn-sync-header"
      type="button"
      onClick={() => {
        if (!isSyncing) onSync();
      }}
      disabled={isSyncing}
      title={tooltip}
      className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs sm:text-sm font-sans font-bold border transition-all cursor-pointer shadow-2xs group ${
        isSyncing
          ? 'bg-[#FFF1ED] text-[#E87A5D] border-[#E87A5D]/40 ring-2 ring-[#E87A5D]/20 cursor-wait'
          : isSuccess
          ? 'bg-emerald-50 text-emerald-700 border-emerald-300 ring-2 ring-emerald-500/20'
          : isError
          ? 'bg-rose-50 text-rose-700 border-rose-300'
          : 'bg-[#FAF9F7] hover:bg-[#F5EFE6] text-[#3D3A35] border-[#EBE7E1]'
      } ${className}`}
    >
      {isSyncing ? (
        <>
          <RefreshCw className="w-3.5 h-3.5 text-[#E87A5D] animate-spin shrink-0" />
          <span className="whitespace-nowrap">동기화 중</span>
        </>
      ) : isSuccess ? (
        <>
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span className="whitespace-nowrap text-emerald-700">동기화 완료</span>
        </>
      ) : isError ? (
        <>
          <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
          <span className="whitespace-nowrap text-rose-700">재시도</span>
        </>
      ) : (
        <>
          <RefreshCw className="w-3.5 h-3.5 text-[#8C867E] group-hover:text-[#2D2A26] group-hover:rotate-180 transition-transform duration-500 shrink-0" />
          <span className="hidden xs:inline whitespace-nowrap">동기화</span>
        </>
      )}
    </button>
  );
};
