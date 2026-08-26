import React, { useState } from 'react';
import {
  QrCode,
  Copy,
  Check,
  X,
  ExternalLink,
  Users,
  Sun,
  Moon,
  Sparkles,
  ArrowRight,
  Maximize2,
} from 'lucide-react';
import { SessionInfo, EmotionResponse } from '../types';

interface QrModalProps {
  activeSession: SessionInfo;
  responses: EmotionResponse[];
  onClose: () => void;
  onGoToStudentHome: () => void;
}

export const QrModal: React.FC<QrModalProps> = ({
  activeSession,
  responses,
  onClose,
  onGoToStudentHome,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  // Calculate live session stats
  const sessionResponses = responses.filter((r) => r.sessionId === activeSession.id);
  const beforeCount = sessionResponses.filter((r) => r.type === 'BEFORE').length;
  const afterCount = sessionResponses.filter((r) => r.type === 'AFTER').length;

  // Use QuickChart / Google Chart / simple reliable QR image generator API with svg fallback
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(
    currentUrl
  )}&margin=10&color=1c1917`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#2D2A26]/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-3xl p-6 sm:p-8 border border-[#EBE7E1] shadow-2xl relative space-y-6 text-center">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-[#8C867E] hover:text-[#3D3A35] hover:bg-[#F5EFE6] rounded-full transition-colors"
          title="닫기"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title & Badge */}
        <div className="space-y-2 pt-1">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#F5EFE6] text-[#E87A5D] border border-[#EBE7E1] text-xs font-sans font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-[#E87A5D]" />
            수업 / 연수 참여용 QR 코드
          </span>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#2D2A26]">
            스마트폰 카메라로 스캔하세요
          </h2>
          <p className="text-xs sm:text-sm font-sans text-[#8C867E]">
            {activeSession.title}
          </p>
        </div>

        {/* QR Code Frame */}
        <div className="flex justify-center items-center py-2">
          <div className="p-4 bg-white rounded-3xl border-4 border-[#3D3A35] shadow-lg relative group">
            <img
              src={qrCodeUrl}
              alt="수업 참여 QR 코드"
              className="w-56 h-56 sm:w-64 sm:h-64 object-contain rounded-xl"
            />
          </div>
        </div>

        {/* Live Submission Counter */}
        <div className="grid grid-cols-2 gap-3 bg-[#FAF9F7] rounded-2xl p-4 border border-[#EBE7E1] text-left">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FFF1ED] text-[#E87A5D] border border-[#E87A5D]/20 flex items-center justify-center font-bold">
              <Sun className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-sans font-bold text-[#8C867E] block uppercase tracking-wider">수업 전 제출</span>
              <p className="text-lg font-serif font-bold text-[#2D2A26]">
                {beforeCount} <span className="text-xs font-sans font-normal text-[#8C867E]">명</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F5EFE6] text-[#3D3A35] border border-[#EBE7E1] flex items-center justify-center font-bold">
              <Moon className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-sans font-bold text-[#8C867E] block uppercase tracking-wider">수업 후 제출</span>
              <p className="text-lg font-serif font-bold text-[#2D2A26]">
                {afterCount} <span className="text-xs font-sans font-normal text-[#8C867E]">명</span>
              </p>
            </div>
          </div>
        </div>

        {/* URL Link Copy & Direct Navigate */}
        <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
          <button
            type="button"
            onClick={handleCopyLink}
            className="flex-1 py-3.5 px-4 bg-[#F5EFE6] hover:bg-[#EBE7E1] text-[#3D3A35] font-sans font-bold text-xs sm:text-sm rounded-xl border border-[#EBE7E1] flex items-center justify-center gap-1.5 transition-all"
          >
            {copiedLink ? (
              <>
                <Check className="w-4 h-4 text-[#E87A5D]" />
                <span>접속 주소 복사됨!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-[#8C867E]" />
                <span>접속 링크 복사하기</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onGoToStudentHome();
            }}
            className="flex-1 py-3.5 px-4 bg-[#E87A5D] hover:bg-[#d3694c] text-white font-sans font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-[#E87A5D]/20 flex items-center justify-center gap-1.5 transition-all"
          >
            <span>출석부 화면으로 이동</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
