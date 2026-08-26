import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { StudentHome } from './components/StudentHome';
import { BeforeStep } from './components/BeforeStep';
import { AfterStep } from './components/AfterStep';
import { AdminDashboard } from './components/AdminDashboard';
import { QrModal } from './components/QrModal';
import { TrainingSettingsModal } from './components/TrainingSettingsModal';
import {
  AppView,
  SessionInfo,
  EmotionDictionary,
  EmotionResponse,
  GoogleSheetsConfig,
  EmotionCategoryKey,
} from './types';
import {
  getStoredSessions,
  saveStoredSessions,
  getActiveSessionId,
  setActiveSessionId,
  getStoredEmotions,
  saveStoredEmotions,
  getStoredResponses,
  saveStoredResponses,
  getStoredSheetsConfig,
  saveStoredSheetsConfig,
  getStoredCurrentStudent,
  setStoredCurrentStudent,
  syncResponseToGoogleSheets,
} from './utils/storage';

export default function App() {
  const [sessions, setSessions] = useState<SessionInfo[]>(getStoredSessions);
  const [activeSessionId, setActiveId] = useState<string>(getActiveSessionId);
  const [emotionsDict, setEmotionsDict] = useState<EmotionDictionary>(getStoredEmotions);
  const [responses, setResponses] = useState<EmotionResponse[]>(getStoredResponses);
  const [sheetsConfig, setSheetsConfig] = useState<GoogleSheetsConfig>(getStoredSheetsConfig);
  const [selectedStudent, setSelectedStudent] = useState<string>(getStoredCurrentStudent);
  const [currentView, setCurrentView] = useState<AppView>('STUDENT_HOME');
  const [showQrModal, setShowQrModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Active Session Object
  const activeSession = useMemo(() => {
    const found = sessions.find((s) => s.id === activeSessionId);
    return found || sessions[0] || {
      id: 'session-default',
      title: '마음 출석부 수업',
      date: new Date().toISOString().split('T')[0],
      roster: [],
      createdAt: new Date().toISOString(),
    };
  }, [sessions, activeSessionId]);

  // Persist handlers
  const handleUpdateSessions = (newSessions: SessionInfo[]) => {
    setSessions(newSessions);
    saveStoredSessions(newSessions);
  };

  const handleSelectSession = (id: string) => {
    setActiveId(id);
    setActiveSessionId(id);
  };

  const handleUpdateEmotions = (newDict: EmotionDictionary) => {
    setEmotionsDict(newDict);
    saveStoredEmotions(newDict);
  };

  const handleUpdateResponses = (newResponses: EmotionResponse[]) => {
    setResponses(newResponses);
    saveStoredResponses(newResponses);
  };

  const handleUpdateSheetsConfig = (newConfig: GoogleSheetsConfig) => {
    setSheetsConfig(newConfig);
    saveStoredSheetsConfig(newConfig);
  };

  const handleSelectStudent = (name: string) => {
    setSelectedStudent(name);
    setStoredCurrentStudent(name);
  };

  // Submit Step 1 (Before)
  const handleSubmitBefore = async (data: {
    categoryKey: EmotionCategoryKey;
    categoryName: string;
    emotion: string;
    comment: string;
  }) => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const dateStr = activeSession.date || now.toISOString().split('T')[0];

    const newResponse: EmotionResponse = {
      id: `resp-${Date.now()}`,
      sessionId: activeSession.id,
      sessionTitle: activeSession.title,
      date: dateStr,
      timestamp: now.toISOString(),
      displayTime: timeStr,
      studentName: selectedStudent,
      type: 'BEFORE',
      categoryKey: data.categoryKey,
      categoryName: data.categoryName,
      emotion: data.emotion,
      comment: data.comment,
    };

    // Filter out previous BEFORE response for same student & session if updating
    const otherResponses = responses.filter(
      (r) =>
        !(
          r.sessionId === activeSession.id &&
          r.studentName === selectedStudent &&
          r.type === 'BEFORE'
        )
    );

    const updated = [newResponse, ...otherResponses];
    handleUpdateResponses(updated);

    // Sync to Google Sheets if configured
    if (sheetsConfig.autoSync && sheetsConfig.webhookUrl) {
      syncResponseToGoogleSheets(newResponse, sheetsConfig);
    }
  };

  // Submit Step 2 (After)
  const handleSubmitAfter = async (data: {
    categoryKey: EmotionCategoryKey;
    categoryName: string;
    emotion: string;
    comment: string;
  }) => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const dateStr = activeSession.date || now.toISOString().split('T')[0];

    const newResponse: EmotionResponse = {
      id: `resp-${Date.now()}`,
      sessionId: activeSession.id,
      sessionTitle: activeSession.title,
      date: dateStr,
      timestamp: now.toISOString(),
      displayTime: timeStr,
      studentName: selectedStudent,
      type: 'AFTER',
      categoryKey: data.categoryKey,
      categoryName: data.categoryName,
      emotion: data.emotion,
      comment: data.comment,
    };

    // Filter out previous AFTER response for same student & session if updating
    const otherResponses = responses.filter(
      (r) =>
        !(
          r.sessionId === activeSession.id &&
          r.studentName === selectedStudent &&
          r.type === 'AFTER'
        )
    );

    const updated = [newResponse, ...otherResponses];
    handleUpdateResponses(updated);

    // Sync to Google Sheets if configured
    if (sheetsConfig.autoSync && sheetsConfig.webhookUrl) {
      syncResponseToGoogleSheets(newResponse, sheetsConfig);
    }
  };

  // Find existing responses for currently selected student
  const studentBeforeResp = responses.find(
    (r) =>
      r.sessionId === activeSession.id &&
      r.studentName === selectedStudent &&
      r.type === 'BEFORE'
  );

  const studentAfterResp = responses.find(
    (r) =>
      r.sessionId === activeSession.id &&
      r.studentName === selectedStudent &&
      r.type === 'AFTER'
  );

  return (
    <div className="min-h-screen bg-[#F8F5F2] text-[#3D3A35] flex flex-col selection:bg-[#F5EFE6] selection:text-[#E87A5D]">
      {/* Global Responsive Navigation Header */}
      <Header
        currentView={currentView}
        onNavigate={(view) => {
          if (view === 'PRESENT_QR') {
            setShowQrModal(true);
          } else {
            setCurrentView(view);
          }
        }}
        sessions={sessions}
        activeSession={activeSession}
        onSelectSession={handleSelectSession}
        totalResponsesCount={responses.length}
        onOpenSettings={() => setShowSettingsModal(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {currentView === 'STUDENT_HOME' && (
          <StudentHome
            sessions={sessions}
            activeSession={activeSession}
            onSelectSession={handleSelectSession}
            selectedStudent={selectedStudent}
            onSelectStudent={handleSelectStudent}
            onStartStep={(step) => {
              if (step === 'BEFORE') setCurrentView('STEP_BEFORE');
              if (step === 'AFTER') setCurrentView('STEP_AFTER');
            }}
            responses={responses}
            onOpenSettings={() => setShowSettingsModal(true)}
          />
        )}

        {currentView === 'STEP_BEFORE' && (
          <BeforeStep
            activeSession={activeSession}
            studentName={selectedStudent}
            emotionsDict={emotionsDict}
            existingResponse={studentBeforeResp}
            onSubmit={handleSubmitBefore}
            onBack={() => setCurrentView('STUDENT_HOME')}
          />
        )}

        {currentView === 'STEP_AFTER' && (
          <AfterStep
            activeSession={activeSession}
            studentName={selectedStudent}
            emotionsDict={emotionsDict}
            beforeResponse={studentBeforeResp}
            existingResponse={studentAfterResp}
            onSubmit={handleSubmitAfter}
            onBack={() => setCurrentView('STUDENT_HOME')}
          />
        )}

        {currentView === 'ADMIN' && (
          <AdminDashboard
            sessions={sessions}
            activeSession={activeSession}
            onSelectSession={handleSelectSession}
            onUpdateSessions={handleUpdateSessions}
            emotionsDict={emotionsDict}
            onUpdateEmotions={handleUpdateEmotions}
            responses={responses}
            onUpdateResponses={handleUpdateResponses}
            sheetsConfig={sheetsConfig}
            onUpdateSheetsConfig={handleUpdateSheetsConfig}
            onBackToHome={() => setCurrentView('STUDENT_HOME')}
            onOpenQr={() => setShowQrModal(true)}
            onOpenSettings={() => setShowSettingsModal(true)}
          />
        )}
      </main>

      {/* Training Organizer Settings Modal */}
      <TrainingSettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        sessions={sessions}
        activeSession={activeSession}
        onSelectSession={handleSelectSession}
        onUpdateSessions={handleUpdateSessions}
      />

      {/* Presenter Mode QR Modal */}
      {showQrModal && (
        <QrModal
          activeSession={activeSession}
          responses={responses}
          onClose={() => setShowQrModal(false)}
          onGoToStudentHome={() => {
            setShowQrModal(false);
            setCurrentView('STUDENT_HOME');
          }}
        />
      )}
    </div>
  );
}
