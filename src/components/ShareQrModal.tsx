import React, { useState, useMemo } from 'react';
import {
  QrCode,
  Share2,
  Copy,
  Check,
  X,
  ExternalLink,
  MessageSquare,
  Sparkles,
  Download,
  Users,
  Sun,
  Moon,
  ArrowRight,
  Globe,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { SessionInfo, EmotionResponse } from '../types';
import { QRCodeDisplay } from './QRCodeDisplay';
import {
  getPublicShareUrl,
  getStoredCustomShareUrl,
  saveStoredCustomShareUrl,
} from '../utils/shareUtils';

interface ShareQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeSession: SessionInfo;
  responses: EmotionResponse[];
  onGoToStudentHome?: () => void;
}

export const ShareQrModal: React.FC<ShareQrModalProps> = ({
  isOpen,
  onClose,
  activeSession,
  responses,
  onGoToStudentHome,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [activeTab, setActiveTab] = useState<'QR' | 'LINK'>('QR');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isLargeSize, setIsLargeSize] = useState(false);
  const [showUrlSetting, setShowUrlSetting] = useState(false);
  const [customUrlInput, setCustomUrlInput] = useState(getStoredCustomShareUrl);

  const currentUrl = useMemo(() => {
    return getPublicShareUrl(activeSession, { customBaseUrl: customUrlInput });
  }, [activeSession, customUrlInput]);

  if (!isOpen) return null;

  // Calculate live stats
  const sessionResponses = responses.filter((r) => r.sessionId === activeSession.id);
  const beforeCount = sessionResponses.filter((r) => r.type === 'BEFORE').length;
  const afterCount = sessionResponses.filter((r) => r.type === 'AFTER').length;
  const totalRoster = (activeSession.roster || []).length;

  // Pre-formatted friendly share message for KakaoTalk / SMS / Slack
  const shareMessageText = `[마음 출석부 - ${activeSession.title}]
오늘 연수/수업의 마음 출석부에 참여해주세요!
수업 시작 전 설레는 마음과 종료 후 소감을 남겨주시면 감사하겠습니다.

🔗 접속 링크: ${currentUrl}
📅 일시: ${activeSession.date}${activeSession.instructor ? `\n👤 강사: ${activeSession.instructor}` : ''}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(shareMessageText);
    setCopiedMessage(true);
    setTimeout(() => setCopiedMessage(false), 2000);
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

  // Web Share API fallback
  const handleWebShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `마음 출석부 - ${activeSession.title}`,
          text: `오늘 연수 마음 출석부에 참여해주세요! (${activeSession.title})`,
          url: currentUrl,
        });
      } catch (err) {
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  // Download QR Code Image
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
          isLargeSize ? 'max-w-2xl' : 'max-w-xl'
        } max-h-[94vh] rounded-3xl border border-[#EBE7E1] shadow-2xl flex flex-col overflow-hidden text-[#3D3A35] my-auto`}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 sm:py-5 border-b border-[#EBE7E1] bg-[#FAF9F7] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FFF1ED] text-[#E87A5D] border border-[#E87A5D]/20 flex items-center justify-center shadow-xs">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-serif font-bold text-[#2D2A26]">
                  연수생·학생 접속 안내
                </h2>
                <span className="text-[10px] font-sans font-bold px-2 py-0.5 rounded-full bg-[#E87A5D] text-white">
                  공유 & QR
                </span>
              </div>
              <p className="text-xs font-sans text-[#8C867E]">
                스마트폰 카메라로 바로 스캔하거나 단체 채팅방에 링크를 공유하세요.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsLargeSize(!isLargeSize)}
              className="p-2 text-[#8C867E] hover:text-[#2D2A26] hover:bg-[#F5EFE6] rounded-full transition-colors cursor-pointer"
              title={isLargeSize ? '기본 크기로 축소' : '대형 QR 화면'}
            >
              {isLargeSize ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-[#8C867E] hover:text-[#2D2A26] hover:bg-[#F5EFE6] rounded-full transition-colors cursor-pointer"
              title="닫기"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Toggle: QR View vs Link/Text Share */}
        <div className="px-6 pt-3 border-b border-[#EBE7E1] bg-white flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('QR')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl font-sans text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'QR'
                ? 'border-[#E87A5D] text-[#E87A5D] bg-[#FFF1ED]/40'
                : 'border-transparent text-[#8C867E] hover:text-[#3D3A35]'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>고선명 QR 코드 스캔</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('LINK')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl font-sans text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'LINK'
                ? 'border-[#E87A5D] text-[#E87A5D] bg-[#FFF1ED]/40'
                : 'border-transparent text-[#8C867E] hover:text-[#3D3A35]'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>접속 링크 & 안내문 복사</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* TAB 1: QR CODE */}
          {activeTab === 'QR' && (
            <div className="space-y-4 text-center">
              {/* Session Info Pill */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F5EFE6] text-[#3D3A35] border border-[#EBE7E1] text-xs font-sans">
                <Sparkles className="w-3.5 h-3.5 text-[#E87A5D]" />
                <span className="font-bold">{activeSession.title}</span>
                <span className="text-[#8C867E]">({activeSession.date})</span>
              </div>

              {/* High Contrast QR Code Display */}
              <div className="flex flex-col items-center justify-center py-1">
                <div className="p-3.5 bg-white rounded-3xl border-4 border-[#2D2A26] shadow-xl relative group flex flex-col items-center">
                  <QRCodeDisplay
                    text={currentUrl}
                    size={isLargeSize ? 330 : 250}
                    onGenerated={(url) => setQrDataUrl(url)}
                  />
                  <div className="mt-1.5 text-center">
                    <span className="text-[11px] font-sans font-bold px-3 py-0.5 rounded-full bg-[#2D2A26] text-white inline-block shadow-xs">
                      기본 카메라 앱으로 비추세요
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2 mt-3 flex-wrap">
                  <button
                    type="button"
                    onClick={handleDownloadQr}
                    className="px-3.5 py-1.5 bg-[#FAF9F7] hover:bg-[#F5EFE6] text-[#3D3A35] border border-[#EBE7E1] text-xs font-sans font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
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
                    <span>새 탭에서 열기</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => setShowUrlSetting(!showUrlSetting)}
                    className="px-2.5 py-1.5 bg-[#FAF9F7] hover:bg-[#F5EFE6] text-[#8C867E] hover:text-[#3D3A35] border border-[#EBE7E1] text-xs font-sans rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                    title="연결 주소 직접 설정"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>주소 설정</span>
                  </button>
                </div>
              </div>

              {/* Custom URL Setting Drawer */}
              {showUrlSetting && (
                <div className="bg-[#FAF9F7] p-3.5 rounded-2xl border border-[#EBE7E1] text-left space-y-2 text-xs">
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

              {/* Realtime Submission Count Status */}
              <div className="grid grid-cols-2 gap-3 bg-[#FAF9F7] rounded-2xl p-3.5 border border-[#EBE7E1] text-left">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#FFF1ED] text-[#E87A5D] border border-[#E87A5D]/20 flex items-center justify-center font-bold">
                    <Sun className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-sans font-bold text-[#8C867E] block uppercase tracking-wider">
                      연수 전 제출
                    </span>
                    <p className="text-base font-serif font-bold text-[#2D2A26]">
                      {beforeCount}{' '}
                      <span className="text-xs font-sans font-normal text-[#8C867E]">
                        / {totalRoster > 0 ? `${totalRoster}명` : '명'}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#F5EFE6] text-[#3D3A35] border border-[#EBE7E1] flex items-center justify-center font-bold">
                    <Moon className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-sans font-bold text-[#8C867E] block uppercase tracking-wider">
                      연수 후 제출
                    </span>
                    <p className="text-base font-serif font-bold text-[#2D2A26]">
                      {afterCount}{' '}
                      <span className="text-xs font-sans font-normal text-[#8C867E]">
                        / {totalRoster > 0 ? `${totalRoster}명` : '명'}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LINK & MESSAGING SHARE */}
          {activeTab === 'LINK' && (
            <div className="space-y-4">
              {/* Direct URL Box */}
              <div className="space-y-1.5">
                <label className="block text-xs font-sans font-bold text-[#3D3A35]">
                  연수생·학생 접속 URL 주소
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={currentUrl}
                    className="flex-1 px-3.5 py-2.5 text-xs sm:text-sm font-sans bg-[#FAF9F7] border border-[#EBE7E1] rounded-xl text-[#3D3A35] font-mono select-all focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="px-4 py-2.5 bg-[#E87A5D] hover:bg-[#d3694c] text-white font-sans font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>복사됨!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>링크 복사</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Ready-made KakaoTalk / SMS Announcement Text Box */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-sans font-bold text-[#3D3A35] flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-[#E87A5D]" />
                    <span>단체 대화방·문자 발송용 안내문 복사</span>
                  </label>
                  <span className="text-[11px] font-sans text-[#8C867E]">
                    카카오톡 / 쿨메신저 / 문자용
                  </span>
                </div>
                <textarea
                  readOnly
                  rows={6}
                  value={shareMessageText}
                  className="w-full p-3.5 text-xs sm:text-sm font-sans bg-[#FAF9F7] border border-[#EBE7E1] rounded-xl leading-relaxed select-all text-[#3D3A35] focus:outline-none"
                />
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={handleCopyMessage}
                    className="px-4 py-2 bg-[#3D3A35] hover:bg-[#2D2A26] text-white font-sans font-bold text-xs rounded-xl shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedMessage ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>안내문 전체 복사 완료!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>안내문 텍스트 전체 복사</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Actions */}
        <div className="px-6 py-4 bg-[#FAF9F7] border-t border-[#EBE7E1] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleWebShare}
              className="px-3.5 py-2 bg-white hover:bg-[#F5EFE6] text-[#3D3A35] border border-[#EBE7E1] font-sans font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Share2 className="w-3.5 h-3.5 text-[#E87A5D]" />
              <span>스마트폰 공유하기</span>
            </button>

            <button
              type="button"
              onClick={handleCopyLink}
              className="px-3.5 py-2 bg-white hover:bg-[#F5EFE6] text-[#3D3A35] border border-[#EBE7E1] font-sans font-medium text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#E87A5D]" />
                  <span>링크 복사됨</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-[#8C867E]" />
                  <span>링크 복사</span>
                </>
              )}
            </button>
          </div>

          <div className="flex items-center gap-2">
            {onGoToStudentHome && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onGoToStudentHome();
                }}
                className="px-4 py-2 bg-[#E87A5D] hover:bg-[#d3694c] text-white font-sans font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>출석부 바로가기</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
