import React, { useState } from 'react';
import {
  ArrowLeft,
  Sun,
  Sparkles,
  Check,
  Send,
  HelpCircle,
  Clock,
  Heart,
  Smile,
  BatteryLow,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  SessionInfo,
  EmotionDictionary,
  EmotionCategoryKey,
  EmotionResponse,
} from '../types';
import { EMOTION_CATEGORIES } from '../data/defaultData';

interface BeforeStepProps {
  activeSession: SessionInfo;
  studentName: string;
  emotionsDict: EmotionDictionary;
  existingResponse?: EmotionResponse;
  onSubmit: (data: {
    categoryKey: EmotionCategoryKey;
    categoryName: string;
    emotion: string;
    comment: string;
  }) => void;
  onBack: () => void;
}

export const BeforeStep: React.FC<BeforeStepProps> = ({
  activeSession,
  studentName,
  emotionsDict,
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

  // Suggestion prompts for expectation comment
  const suggestionPrompts = [
    '새로운 수업 아이디어를 얻어가고 싶어요.',
    '실제 적용할 수 있는 팁이 궁금해요.',
    '동료 선생님들과 함께 이야기 나누고 싶어요.',
    '기초부터 차근차근 배워보고 싶어요.',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmotion) return;

    // Trigger celebratory confetti
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#F59E0B', '#10B981', '#0284C7', '#F43F5E'],
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
      <div className="w-full max-w-lg mx-auto px-4 py-8 text-center space-y-6">
        <div className="w-20 h-20 mx-auto rounded-full bg-[#E87A5D] text-white flex items-center justify-center shadow-lg font-serif font-bold text-2xl animate-bounce">
          心
        </div>

        <div className="space-y-2">
          <span className="text-xs font-sans font-bold text-[#E87A5D] bg-[#F5EFE6] px-3 py-1 rounded-full uppercase tracking-wider">
            STEP 1 완료
          </span>
          <h2 className="text-2xl font-serif font-bold text-[#2D2A26]">
            {studentName}님의 수업 전 기분이 기록되었습니다!
          </h2>
          <p className="text-sm font-sans text-[#8C867E]">
            선택한 감정: <strong className="text-[#E87A5D]">"{selectedEmotion}"</strong>
          </p>
        </div>

        <div className="bg-white border border-[#EBE7E1] rounded-2xl p-5 text-left space-y-3 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-sans font-bold text-[#3D3A35]">
            <Clock className="w-4 h-4 text-[#E87A5D]" />
            <span>수업 종료 후 알림</span>
          </div>
          <p className="text-xs font-sans text-[#8C867E] leading-relaxed">
            수업이 끝난 후, 메인 화면에서 <strong className="text-[#3D3A35]">[Step 2. 수업 마치고 소감 남기기]</strong>를 통해 어떻게 마음이 변화했는지 기록해 주세요!
          </p>
        </div>

        <div className="pt-2">
          <button
            id="btn-return-home"
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
          id="btn-back-before"
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-sans font-semibold text-[#8C867E] hover:text-[#3D3A35] px-3 py-1.5 rounded-xl hover:bg-[#F5EFE6] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>뒤로가기</span>
        </button>

        <div className="flex items-center gap-1.5 text-xs font-sans font-bold bg-[#F5EFE6] text-[#3D3A35] px-3.5 py-1.5 rounded-full border border-[#EBE7E1]">
          <span className="w-2 h-2 rounded-full bg-[#E87A5D]" />
          <span>수업 전 기분 기록 · {studentName}</span>
        </div>
      </div>

      {/* Title Card */}
      <div className="bg-white rounded-2xl p-6 border border-[#EBE7E1] shadow-sm space-y-2">
        <div className="border-l-2 border-[#E87A5D] pl-4 py-0.5">
          <p className="text-[10px] font-sans font-bold uppercase tracking-widest text-[#8C867E]">
            Before Class Feeling
          </p>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-[#2D2A26]">
            수업 시작 전, 지금 어떤 기분이신가요?
          </h1>
        </div>
        <p className="text-xs font-sans text-[#8C867E] pt-1">
          카테고리를 누르고 지금 나의 마음에 가장 가까운 단어 하나를 선택해 주세요.
        </p>
      </div>

      {/* Category Tabs (A, B, C) */}
      <div className="grid grid-cols-3 gap-2.5">
        {EMOTION_CATEGORIES.map((cat) => {
          const isCatSelected = selectedCategory === cat.key;
          return (
            <button
              key={cat.key}
              id={`cat-btn-${cat.key}`}
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

      {/* Category Emotion Chips (15+ items) */}
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
                id={`emotion-chip-${word}`}
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

      {/* Expectation Comment Form (주관식 한 줄) */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-white rounded-2xl p-6 border border-[#EBE7E1] shadow-sm space-y-3">
          <label
            htmlFor="input-before-comment"
            className="block text-sm font-serif font-bold text-[#2D2A26]"
          >
            "오늘 연수에서 기대하는 점이나 궁금한 점을 적어주세요."
            <span className="text-xs font-sans font-normal text-[#8C867E] block mt-1">
              (자유롭게 주관식 한 줄로 남겨주세요)
            </span>
          </label>

          <textarea
            id="input-before-comment"
            rows={3}
            placeholder="예: 실무에 바로 활용할 수 있는 꿀팁을 배워가고 싶습니다!"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full p-3.5 text-sm font-sans bg-[#FAF9F7] border border-[#EBE7E1] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E87A5D] focus:bg-white transition-all resize-none placeholder:text-[#8C867E]"
          />

          {/* Quick inspiration chips */}
          <div className="space-y-2 pt-1">
            <span className="text-[11px] font-sans font-bold text-[#8C867E]">빠른 문구 추천 (클릭시 자동입력):</span>
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
          id="btn-submit-before"
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
            {selectedEmotion ? `[${selectedEmotion}] 기분으로 출석하기` : '감정 단어를 선택해주세요'}
          </span>
        </button>
      </form>
    </div>
  );
};
