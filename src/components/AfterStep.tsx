import React, { useState } from 'react';
import {
  ArrowLeft,
  Moon,
  Sparkles,
  Check,
  Send,
  ArrowRight,
  TrendingUp,
  Heart,
  Smile,
  BatteryLow,
  Share2,
  Award,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  SessionInfo,
  EmotionDictionary,
  EmotionCategoryKey,
  EmotionResponse,
} from '../types';
import { EMOTION_CATEGORIES } from '../data/defaultData';

interface AfterStepProps {
  activeSession: SessionInfo;
  studentName: string;
  emotionsDict: EmotionDictionary;
  beforeResponse?: EmotionResponse;
  existingResponse?: EmotionResponse;
  onSubmit: (data: {
    categoryKey: EmotionCategoryKey;
    categoryName: string;
    emotion: string;
    comment: string;
  }) => void;
  onBack: () => void;
}

export const AfterStep: React.FC<AfterStepProps> = ({
  activeSession,
  studentName,
  emotionsDict,
  beforeResponse,
  existingResponse,
  onSubmit,
  onBack,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<EmotionCategoryKey>(
    existingResponse?.categoryKey || 'A'
  );
  const [selectedEmotion, setSelectedEmotion] = useState<string>(
    existingResponse?.emotion || ''
  );
  const [comment, setComment] = useState<string>(
    existingResponse?.comment || ''
  );
  const [isSubmitted, setIsSubmitted] = useState(false);

  const currentCategoryDef = EMOTION_CATEGORIES.find(
    (c) => c.key === selectedCategory
  )!;

  // Suggestion prompts for after comment
  const suggestionPrompts = [
    '실습 위주로 배울 수 있어서 정말 유익했습니다!',
    '내일 당장 수업 현장에 바로 적용해보고 싶어요.',
    '동료들과 소통하며 큰 위로와 에너지를 얻었습니다.',
    '알찬 강의 준비해주셔서 진심으로 감사드립니다.',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmotion) return;

    // Trigger hearty celebration confetti
    try {
      confetti({
        particleCount: 80,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#0284C7', '#10B981', '#F59E0B', '#8B5CF6'],
      });
    } catch {
      // ignore
    }

    onSubmit({
      categoryKey: selectedCategory,
      categoryName: currentCategoryDef.name,
      emotion: selectedEmotion,
      comment: comment.trim(),
    });

    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <div className="w-full max-w-lg mx-auto px-4 py-8 space-y-6 text-center">
        {/* Celebration Badge */}
        <div className="w-20 h-20 mx-auto rounded-full bg-[#E87A5D] text-white flex items-center justify-center shadow-lg font-serif font-bold text-2xl animate-bounce">
          心
        </div>

        <div className="space-y-2">
          <span className="text-xs font-sans font-bold text-[#E87A5D] bg-[#F5EFE6] px-3.5 py-1 rounded-full uppercase tracking-wider">
            STEP 2 완료 · 수업 수료
          </span>
          <h2 className="text-2xl font-serif font-bold text-[#2D2A26]">
            {studentName}님의 마음 출석이 완료되었습니다!
          </h2>
          <p className="text-sm font-sans text-[#8C867E]">
            오늘 하루도 정말 수고 많으셨습니다.
          </p>
        </div>

        {/* Before ➡️ After Transformation Summary Card */}
        <div className="bg-white border border-[#EBE7E1] rounded-2xl p-6 shadow-sm text-left space-y-4">
          <div className="flex items-center justify-between border-b border-[#EBE7E1] pb-3">
            <span className="text-xs font-serif font-bold text-[#2D2A26]">나의 마음 변화 리포트</span>
            <span className="text-xs font-sans font-bold text-[#E87A5D] bg-[#F5EFE6] px-3 py-0.5 rounded-full">
              {activeSession.title}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 items-center">
            {/* Before Box */}
            <div className="bg-[#FAF9F7] border border-[#EBE7E1] rounded-xl p-4 space-y-1">
              <span className="text-[10px] font-sans font-bold text-[#8C867E] uppercase tracking-wider">
                수업 전 (Before)
              </span>
              <p className="text-base font-serif font-bold text-[#2D2A26]">
                {beforeResponse ? `"${beforeResponse.emotion}"` : '미기록'}
              </p>
              {beforeResponse?.comment && (
                <p className="text-xs font-sans text-[#8C867E] line-clamp-2 italic">
                  "{beforeResponse.comment}"
                </p>
              )}
            </div>

            {/* After Box */}
            <div className="bg-[#FFF1ED] border border-[#E87A5D]/30 rounded-xl p-4 space-y-1">
              <span className="text-[10px] font-sans font-bold text-[#E87A5D] uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#E87A5D]" />
                수업 후 (After)
              </span>
              <p className="text-base font-serif font-bold text-[#E87A5D]">
                "{selectedEmotion}"
              </p>
              {comment && (
                <p className="text-xs font-sans text-[#3D3A35] line-clamp-2 italic">
                  "{comment}"
                </p>
              )}
            </div>
          </div>

          {/* Transformation Insight */}
          {beforeResponse && (
            <div className="bg-[#F5EFE6] rounded-xl p-3.5 border border-[#EBE7E1] flex items-center gap-3">
              <TrendingUp className="w-4 h-4 text-[#E87A5D] shrink-0" />
              <p className="text-xs font-sans text-[#3D3A35] leading-relaxed">
                <strong className="text-[#2D2A26]">{beforeResponse.emotion}</strong> 상태에서 <strong className="text-[#E87A5D]">{selectedEmotion}</strong>(으)로 긍정적인 배움과 감정의 성장을 이루셨습니다!
              </p>
            </div>
          )}
        </div>

        <div className="pt-2">
          <button
            id="btn-return-home-after"
            type="button"
            onClick={onBack}
            className="w-full py-4 bg-[#3D3A35] text-white font-sans font-bold text-sm rounded-xl hover:bg-[#2D2A26] transition-all shadow-md active:scale-95"
          >
            메인 화면으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-xl mx-auto px-4 py-4 sm:py-6 space-y-6">
      {/* Top Bar with Back Button and Student Badge */}
      <div className="flex items-center justify-between gap-3">
        <button
          id="btn-back-after"
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-sans font-semibold text-[#8C867E] hover:text-[#3D3A35] px-3 py-1.5 rounded-xl hover:bg-[#F5EFE6] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>뒤로가기</span>
        </button>

        <div className="flex items-center gap-1.5 text-xs font-sans font-bold bg-[#F5EFE6] text-[#3D3A35] px-3.5 py-1.5 rounded-full border border-[#EBE7E1]">
          <span className="w-2 h-2 rounded-full bg-[#E87A5D]" />
          <span>수업 후 소감 남기기 · {studentName}</span>
        </div>
      </div>

      {/* Anchor Card: Before Emotion Reminder */}
      {beforeResponse ? (
        <div className="bg-white border border-[#EBE7E1] rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-3 shadow-sm">
          <div className="space-y-0.5">
            <span className="text-[10px] font-sans font-bold text-[#8C867E] uppercase tracking-wider">
              수업 전 내가 기록했던 기분
            </span>
            <p className="text-sm sm:text-base font-serif font-bold text-[#2D2A26]">
              "{beforeResponse.emotion}" ({beforeResponse.categoryName})
            </p>
          </div>
          <span className="text-xs font-sans font-bold text-[#E87A5D] bg-[#F5EFE6] border border-[#EBE7E1] px-3 py-1 rounded-full">
            수업 후 마음의 변화 💭
          </span>
        </div>
      ) : (
        <div className="bg-[#FAF9F7] border border-[#EBE7E1] rounded-2xl p-3.5 text-xs font-sans text-[#8C867E]">
          수업 전 기분을 아직 기록하지 않았어도, 지금 수업 후의 기분과 소감을 자유롭게 남기실 수 있습니다.
        </div>
      )}

      {/* Title Card */}
      <div className="bg-white rounded-2xl p-6 border border-[#EBE7E1] shadow-sm space-y-2">
        <div className="border-l-2 border-[#E87A5D] pl-4 py-0.5">
          <p className="text-[10px] font-sans font-bold uppercase tracking-widest text-[#8C867E]">
            After Class Reflection
          </p>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-[#2D2A26]">
            수업을 마친 지금, 어떤 마음이 드시나요?
          </h1>
        </div>
        <p className="text-xs font-sans text-[#8C867E] pt-1">
          오늘 수업을 통해 변화된 나의 기분을 가장 잘 표현하는 단어를 선택해 주세요.
        </p>
      </div>

      {/* Category Tabs (A, B, C) */}
      <div className="grid grid-cols-3 gap-2.5">
        {EMOTION_CATEGORIES.map((cat) => {
          const isCatSelected = selectedCategory === cat.key;
          return (
            <button
              key={cat.key}
              id={`cat-after-btn-${cat.key}`}
              type="button"
              onClick={() => setSelectedCategory(cat.key)}
              className={`p-3.5 rounded-xl border text-center transition-all flex flex-col items-center gap-2 touch-manipulation select-none ${
                isCatSelected
                  ? 'bg-[#FFF1ED] border-[#E87A5D] shadow-sm ring-2 ring-[#E87A5D]/30'
                  : 'bg-white border-[#EBE7E1] hover:bg-[#FAF9F7] text-[#8C867E]'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  isCatSelected ? 'bg-[#E87A5D] text-white' : 'bg-[#F5EFE6] text-[#8C867E]'
                }`}
              >
                {cat.key === 'A' ? (
                  <Sparkles className="w-4 h-4" />
                ) : cat.key === 'B' ? (
                  <Smile className="w-4 h-4" />
                ) : (
                  <BatteryLow className="w-4 h-4" />
                )}
              </div>
              <span className={`text-xs font-sans font-bold ${isCatSelected ? 'text-[#E87A5D]' : 'text-[#3D3A35]'}`}>
                {cat.name}
              </span>
            </button>
          );
        })}
      </div>

      {/* Category Emotion Chips */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#EBE7E1] shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-sans font-bold text-[#3D3A35] uppercase tracking-wider">
            {currentCategoryDef.name} ({emotionsDict[selectedCategory]?.length || 0}개)
          </span>
          <span className="text-[11px] font-sans text-[#8C867E]">터치하여 선택</span>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          {(emotionsDict[selectedCategory] || []).map((word) => {
            const isWordSelected = selectedEmotion === word;
            return (
              <button
                key={word}
                id={`emotion-after-chip-${word}`}
                type="button"
                onClick={() => setSelectedEmotion(word)}
                className={`px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-sans transition-all min-h-[44px] flex items-center gap-1.5 touch-manipulation select-none active:scale-95 ${
                  isWordSelected
                    ? 'bg-[#FFF1ED] text-[#E87A5D] border-2 border-[#E87A5D] font-bold shadow-xs scale-[1.03]'
                    : 'bg-[#F5F5F5] text-[#3D3A35] hover:bg-[#EBE7E1] border border-transparent'
                }`}
              >
                <span>{word}</span>
                {isWordSelected && <Check className="w-3.5 h-3.5 stroke-[3] text-[#E87A5D]" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Class Impressions / Takeaway Form (주관식 한 줄) */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-white rounded-2xl p-6 border border-[#EBE7E1] shadow-sm space-y-3">
          <label
            htmlFor="input-after-comment"
            className="block text-sm font-serif font-bold text-[#2D2A26]"
          >
            "오늘 수업을 통해 느낀 점이나 나에게 가장 남는 한 마디를 적어주세요."
            <span className="text-xs font-sans font-normal text-[#8C867E] block mt-1">
              (선생님께 드릴 감사 인사나 배운 점을 주관식 한 줄로 남겨주세요)
            </span>
          </label>

          <textarea
            id="input-after-comment"
            rows={3}
            placeholder="예: 막막했던 부분이 싹 해결되었고, 실제로 적용해볼 용기를 얻었습니다!"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full p-3.5 text-sm font-sans bg-[#FAF9F7] border border-[#EBE7E1] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E87A5D] focus:bg-white transition-all resize-none placeholder:text-[#8C867E]"
          />

          {/* Quick inspiration chips */}
          <div className="space-y-2 pt-1">
            <span className="text-[11px] font-sans font-bold text-[#8C867E]">빠른 소감 추천 (클릭시 자동입력):</span>
            <div className="flex flex-wrap gap-1.5">
              {suggestionPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => setComment(prompt)}
                  className="text-[11px] font-sans bg-[#F5EFE6] hover:bg-[#EBE7E1] text-[#3D3A35] px-3 py-1 rounded-lg transition-colors text-left"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          id="btn-submit-after"
          type="submit"
          disabled={!selectedEmotion}
          className={`w-full py-4 rounded-xl font-sans font-bold text-base flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98] ${
            selectedEmotion
              ? 'bg-[#E87A5D] text-white hover:bg-[#d3694c] shadow-[#E87A5D]/20 cursor-pointer'
              : 'bg-[#EBE7E1] text-[#8C867E] cursor-not-allowed'
          }`}
        >
          <Send className="w-5 h-5" />
          <span>
            {selectedEmotion ? `[${selectedEmotion}] 소감 제출하기` : '감정 단어를 선택해주세요'}
          </span>
        </button>
      </form>
    </div>
  );
};
