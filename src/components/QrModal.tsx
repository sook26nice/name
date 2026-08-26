import React, { useState, useMemo } from 'react';
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
  Minimize2,
  Download,
  Settings,
  Globe,
} from 'lucide-react';
import { SessionInfo, EmotionResponse } from '../types';
import { QRCodeDisplay } from './QRCodeDisplay';
import {
  getPublicShareUrl,
  getStoredCustomShareUrl,
  saveStoredCustomShareUrl,
} from '../utils/shareUtils';

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
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isLargeSize, setIsLargeSize] = useState(false);
  const [showUrlSetting, setShowUrlSetting] = useState(false);
  const [customUrlInput, setCustomUrlInput] = useState(getStoredCustomShareUrl);

  const currentUrl = useMemo(() => {
    return getPublicShareUrl(activeSession, { customBaseUrl: customUrlInput });
  }, [activeSession, customUrlInput]);

  // Calculate live session stats
  const sessionResponses = responses.filter((r) => r.sessionId === activeSession.id);
  const beforeCount = sessionResponses.filter((r) => r.type === 'BEFORE').length;
  const afterCount = sessionResponses.filter((r) => r.type === 'AFTER').length;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleSaveCustomUrl = () => {
    saveStoredCustomShareUrl(customUrlInput);
    setShowUrlSetting(false);
  };

  const handleResetToAutoUrl = () => {
    setCustomUrlInput('');
    saveStoredCustomShareUrl('');
    setShowUrlSetting(false);
  };

  const handleDownloadQr = () => {
    if (qrDataUrl) {
      const a = document.createElement('a');
      a.href = qrDataUrl;
      a.download = `마음출석부_QR_${activeSession.title.replace(/\s+/g, '_')}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      window.open(
        `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(
          currentUrl
        )}&margin=12&color=000000`,
        '_blank'
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#2D2A26]/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200 overflow-y-auto">
      <div
        className={`bg-white w-full ${
          isLargeSize ? 'max-w-2xl' : 'max-w-lg'
        } rounded-3xl p-5 sm:p-7 border border-[#EBE7E1] shadow-2xl relative space-y-5 text-center transition-all my-auto`}
      >
        {/* Top Controls */}
        <div className="absolute top-4 right-4 flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setIsLargeSize(!isLargeSize)}
            className="p-2 text-[#8C867E] hover:text-[#3D3A35] hover:bg-[#F5EFE6] rounded-full transition-colors cursor-pointer"
            title={isLargeSize ? '기본 크기로 축소' : '빔프로젝터용 대형 화면'}
          >
            {isLargeSize ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-[#8C867E] hover:text-[#3D3A35] hover:bg-[#F5EFE6] rounded-full transition-colors cursor-pointer"
            title="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Title & Badge */}
        <div className="space-y-1.5 pt-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#F5EFE6] text-[#E87A5D] border border-[#EBE7E1] text-xs font-sans font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-[#E87A5D]" />
            스마트폰 카메라로 바로 스캔
          </div>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#2D2A26]">
            마음 출석부 참여 QR 코드
          </h2>
          <p className="text-xs sm:text-sm font-sans text-[#8C867E] truncate max-w-sm mx-auto">
            {activeSession.title}
          </p>
        </div>

        {/* QR Code Container - High Contrast & Large Quiet Zone */}
        <div className="flex flex-col justify-center items-center py-1">
          <div className="p-3 bg-white rounded-3xl border-4 border-[#2D2A26] shadow-xl relative group flex flex-col items-center">
            <QRCodeDisplay
              text={currentUrl}
              size={isLargeSize ? 340 : 250}
              onGenerated={(url) => setQrDataUrl(url)}
            />
            <div className="mt-1.5 text-center">
              <span className="text-[11px] font-sans font-bold px-3 py-0.5 rounded-full bg-[#2D2A26] text-white inline-block shadow-xs">
                기본 카메라 앱으로 비추세요
              </span>
            </div>
          </div>

          {/* Helper Tools below QR */}
          <div className="flex items-center justify-center gap-2 mt-3 flex-wrap">
            <button
              type="button"
              onClick={handleDownloadQr}
              className="px-3 py-1.5 bg-[#FAF9F7] hover:bg-[#F5EFE6] text-[#3D3A35] border border-[#EBE7E1] text-xs font-sans font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-[#8C867E]" />
              <span>QR 이미지 다운로드</span>
            </button>

            <a
              href={currentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-[#FAF9F7] hover:bg-[#F5EFE6] text-[#3D3A35] border border-[#EBE7E1] text-xs font-sans font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#8C867E]" />
              <span>새 탭에서 테스트</span>
            </a>

            <button
              type="button"
              onClick={() => setShowUrlSetting(!showUrlSetting)}
              className="px-2.5 py-1.5 bg-[#FAF9F7] hover:bg-[#F5EFE6] text-[#8C867E] hover:text-[#3D3A35] border border-[#EBE7E1] text-xs font-sans rounded-xl transition-all flex items-center gap-1 cursor-pointer"
              title="공유 주소(URL) 변경 및 확인"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>주소 설정</span>
            </button>
          </div>
        </div>

        {/* Custom URL Setting Accordion */}
        {showUrlSetting && (
          <div className="bg-[#FAF9F7] p-3.5 rounded-2xl border border-[#EBE7E1] text-left space-y-2 animate-in fade-in text-xs">
            <div className="font-bold text-[#2D2A26] flex items-center justify-between">
              <span>연결 도메인/주소 직접 지정</span>
              <button
                type="button"
                onClick={handleResetToAutoUrl}
                className="text-[11px] text-[#E87A5D] hover:underline font-normal cursor-pointer"
              >
                자동 주소로 초기화
              </button>
            </div>
            <p className="text-[#8C867E] text-[11px]">
              AI Studio [Share] 메뉴에서 생성된 별도의 공개 URL이 있다면 여기에 붙여넣어 QR을 생성할 수 있습니다.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={customUrlInput}
                onChange={(e) => setCustomUrlInput(e.target.value)}
                placeholder="예: https://ais-pre-...run.app"
                className="flex-1 px-3 py-1.5 bg-white border border-[#EBE7E1] rounded-xl text-xs font-mono text-[#2D2A26] focus:outline-none focus:border-[#E87A5D]"
              />
              <button
                type="button"
                onClick={handleSaveCustomUrl}
                className="px-3 py-1.5 bg-[#2D2A26] text-white font-bold rounded-xl text-xs cursor-pointer hover:bg-black transition-colors"
              >
                적용
              </button>
            </div>
          </div>
        )}

        {/* Live Submission Counter */}
        <div className="grid grid-cols-2 gap-3 bg-[#FAF9F7] rounded-2xl p-3.5 border border-[#EBE7E1] text-left">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#FFF1ED] text-[#E87A5D] border border-[#E87A5D]/20 flex items-center justify-center font-bold">
              <Sun className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-sans font-bold text-[#8C867E] block uppercase tracking-wider">
                수업 전 참여
              </span>
              <p className="text-base font-serif font-bold text-[#2D2A26]">
                {beforeCount} <span className="text-xs font-sans font-normal text-[#8C867E]">명</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#F5EFE6] text-[#3D3A35] border border-[#EBE7E1] flex items-center justify-center font-bold">
              <Moon className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-sans font-bold text-[#8C867E] block uppercase tracking-wider">
                수업 후 참여
              </span>
              <p className="text-base font-serif font-bold text-[#2D2A26]">
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
            className="flex-1 py-3 px-4 bg-[#F5EFE6] hover:bg-[#EBE7E1] text-[#3D3A35] font-sans font-bold text-xs sm:text-sm rounded-xl border border-[#EBE7E1] flex items-center justify-center gap-1.5 transition-all cursor-pointer"
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
            className="flex-1 py-3 px-4 bg-[#E87A5D] hover:bg-[#d3694c] text-white font-sans font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-[#E87A5D]/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <span>출석부 화면으로 이동</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
