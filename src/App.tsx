import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Header } from './components/Header';
import { StudentHome } from './components/StudentHome';
import { BeforeStep } from './components/BeforeStep';
import { AfterStep } from './components/AfterStep';
import { AdminDashboard } from './components/AdminDashboard';
import { QrModal } from './components/QrModal';
import { ShareQrModal } from './components/ShareQrModal';
import { TrainingSettingsModal } from './components/TrainingSettingsModal';
import {
  AppView,
  SessionInfo,
  EmotionDictionary,
  EmotionResponse,
  GoogleSheetsConfig,
  SupabaseConfig,
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
  syncBatchToGoogleSheets,
} from './utils/storage';
import {
  getStoredSupabaseConfig,
  saveStoredSupabaseConfig,
  fetchSupabaseSessions,
  fetchSupabaseResponses,
  subscribeToSupabaseRealtime,
  pushResponseToSupabase,
  upsertSessionToSupabase,
  batchSyncResponsesToSupabase,
  isSupabaseConfigured,
} from './utils/supabaseClient';
import { SyncStatus } from './components/SyncButton';
import { parseUrlSessionData } from './utils/shareUtils';

export default function App() {
  const [sessions, setSessions] = useState<SessionInfo[]>(getStoredSessions);
  const [activeSessionId, setActiveId] = useState<string>(getActiveSessionId);
  const [emotionsDict, setEmotionsDict] = useState<EmotionDictionary>(getStoredEmotions);
  const [responses, setResponses] = useState<EmotionResponse[]>(getStoredResponses);
  const [sheetsConfig, setSheetsConfig] = useState<GoogleSheetsConfig>(getStoredSheetsConfig);
  const [supabaseConfig, setSupabaseConfig] = useState<SupabaseConfig>(getStoredSupabaseConfig);
  const [selectedStudent, setSelectedStudent] = useState<string>(getStoredCurrentStudent);
  const [currentView, setCurrentView] = useState<AppView>('STUDENT_HOME');
  const [showQrModal, setShowQrModal] = useState(false);
  const [showShareQrModal, setShowShareQrModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Sync State for Visual Status Feedback
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('IDLE');
  const [lastSyncedTime, setLastSyncedTime] = useState<Date | null>(null);

  // Active Session Object
  const activeSession = useMemo(() => {
    const found = sessions.find((s) => s.id === activeSessionId);
    return (
      found ||
      sessions[0] || {
        id: 'session-default',
        title: '마음 출석부 수업',
        date: new Date().toISOString().split('T')[0],
        roster: [],
        createdAt: new Date().toISOString(),
      }
    );
  }, [sessions, activeSessionId]);

  // Helper for triggering sync visual feedback
  const markSyncSuccess = useCallback(() => {
    setSyncStatus('SUCCESS');
    setLastSyncedTime(new Date());
    setTimeout(() => {
      setSyncStatus((prev) => (prev === 'SUCCESS' ? 'IDLE' : prev));
    }, 2500);
  }, []);

  const markSyncError = useCallback(() => {
    setSyncStatus('ERROR');
    setTimeout(() => {
      setSyncStatus((prev) => (prev === 'ERROR' ? 'IDLE' : prev));
    }, 3000);
  }, []);

  // Persist handlers with Fast Automatic Sync
  const handleUpdateSessions = async (newSessions: SessionInfo[]) => {
    setSessions(newSessions);
    saveStoredSessions(newSessions);

    // Fast sync to Supabase if configured
    if (isSupabaseConfigured(supabaseConfig)) {
      setSyncStatus('SYNCING');
      try {
        await Promise.all(newSessions.map((s) => upsertSessionToSupabase(s)));
        markSyncSuccess();
      } catch (err) {
        console.warn('[Supabase] Failed to fast-sync sessions:', err);
        markSyncError();
      }
    }
  };

  const handleSelectSession = (id: string) => {
    setActiveId(id);
    setActiveSessionId(id);
  };

  const handleUpdateEmotions = (newDict: EmotionDictionary) => {
    setEmotionsDict(newDict);
    saveStoredEmotions(newDict);
  };

  const handleUpdateResponses = async (newResponses: EmotionResponse[]) => {
    setResponses(newResponses);
    saveStoredResponses(newResponses);

    // Fast sync to Supabase if configured
    if (isSupabaseConfigured(supabaseConfig)) {
      setSyncStatus('SYNCING');
      try {
        if (newResponses.length > 0) {
          await batchSyncResponsesToSupabase(newResponses);
        }
        markSyncSuccess();
      } catch (err) {
        console.warn('[Supabase] Failed to fast-sync responses:', err);
        markSyncError();
      }
    }
  };

  const handleUpdateSheetsConfig = (newConfig: GoogleSheetsConfig) => {
    setSheetsConfig(newConfig);
    saveStoredSheetsConfig(newConfig);
  };

  const handleUpdateSupabaseConfig = (newConfig: SupabaseConfig) => {
    setSupabaseConfig(newConfig);
    saveStoredSupabaseConfig(newConfig);
  };

  const handleSelectStudent = (name: string) => {
    setSelectedStudent(name);
    setStoredCurrentStudent(name);
  };

  // Full Cloud Sync Trigger / Manual Sync
  const handleManualSync = useCallback(async () => {
    setSyncStatus('SYNCING');

    try {
      let remoteLoaded = false;

      // 1. Supabase Cloud Sync
      if (isSupabaseConfigured(supabaseConfig)) {
        // Push local sessions first so remote has the latest
        for (const s of sessions) {
          await upsertSessionToSupabase(s);
        }

        // Push local responses
        if (responses.length > 0) {
          await batchSyncResponsesToSupabase(responses);
        }

        // Fetch remote sessions
        const remoteSessions = await fetchSupabaseSessions();
        if (remoteSessions && remoteSessions.length > 0) {
          setSessions((prev) => {
            const map = new Map<string, SessionInfo>();
            prev.forEach((s) => map.set(s.id, s));
            remoteSessions.forEach((s) => map.set(s.id, s));
            const merged = Array.from(map.values());
            saveStoredSessions(merged);
            return merged;
          });
        }

        // Fetch remote responses
        const remoteResponses = await fetchSupabaseResponses();
        if (remoteResponses && remoteResponses.length > 0) {
          setResponses((prev) => {
            const map = new Map<string, EmotionResponse>();
            prev.forEach((r) => map.set(r.id, r));
            remoteResponses.forEach((r) => map.set(r.id, r));
            const merged = Array.from(map.values()).sort(
              (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            );
            saveStoredResponses(merged);
            return merged;
          });
        }

        remoteLoaded = true;
      }

      // 2. Google Sheets Webhook Sync if configured
      if (sheetsConfig.webhookUrl && responses.length > 0) {
        await syncBatchToGoogleSheets(responses, sheetsConfig);
      }

      // Save latest state locally
      saveStoredSessions(sessions);
      saveStoredResponses(responses);

      // Visual success indication
      markSyncSuccess();
    } catch (err) {
      console.warn('[Sync Error]:', err);
      markSyncError();
    }
  }, [supabaseConfig, sheetsConfig, sessions, responses, markSyncSuccess, markSyncError]);

  const handleTriggerSupabaseSync = handleManualSync;

  // On App Mount: Check if opened via QR Code / Shared Link URL parameters
  useEffect(() => {
    const urlData = parseUrlSessionData();
    if (!urlData.hasParams) return;

    // 1. Configure Supabase if credentials are provided in QR URL
    if (urlData.supabaseConfig) {
      setSupabaseConfig(urlData.supabaseConfig);
      saveStoredSupabaseConfig(urlData.supabaseConfig);
    }

    // 2. Load or register active session from URL params
    if (urlData.sessionId) {
      setSessions((prev) => {
        const found = prev.find((s) => s.id === urlData.sessionId);
        if (found) {
          // If URL has updated title or roster, update it
          if (urlData.sessionTitle || urlData.roster) {
            const updated = prev.map((s) =>
              s.id === urlData.sessionId
                ? {
                    ...s,
                    title: urlData.sessionTitle || s.title,
                    date: urlData.sessionDate || s.date,
                    instructor: urlData.sessionInstructor ?? s.instructor,
                    roster: urlData.roster && urlData.roster.length > 0 ? urlData.roster : s.roster,
                  }
                : s
            );
            saveStoredSessions(updated);
            return updated;
          }
          return prev;
        } else {
          // New session created from shared QR Link
          const newSession: SessionInfo = {
            id: urlData.sessionId!,
            title: urlData.sessionTitle || '마음 출석부 연수',
            date: urlData.sessionDate || new Date().toISOString().split('T')[0],
            instructor: urlData.sessionInstructor,
            roster: urlData.roster || [],
            createdAt: new Date().toISOString(),
          };
          const next = [newSession, ...prev];
          saveStoredSessions(next);
          return next;
        }
      });

      setActiveId(urlData.sessionId);
      setActiveSessionId(urlData.sessionId);
    }

    // 3. Set view to Student Home
    if (urlData.targetView) {
      setCurrentView(urlData.targetView);
    }
  }, []);

  // Realtime subscription and initial load from Supabase
  useEffect(() => {
    if (!isSupabaseConfigured(supabaseConfig)) return;

    // Initial fetch from cloud
    handleTriggerSupabaseSync();

    // Setup realtime subscription
    const unsubscribe = subscribeToSupabaseRealtime(
      (incomingResponse) => {
        setResponses((prev) => {
          // Replace or prepend
          const exists = prev.some((r) => r.id === incomingResponse.id);
          const next = exists
            ? prev.map((r) => (r.id === incomingResponse.id ? incomingResponse : r))
            : [incomingResponse, ...prev];
          saveStoredResponses(next);
          return next;
        });
        markSyncSuccess();
      },
      (incomingSession) => {
        setSessions((prev) => {
          const exists = prev.some((s) => s.id === incomingSession.id);
          const next = exists
            ? prev.map((s) => (s.id === incomingSession.id ? incomingSession : s))
            : [...prev, incomingSession];
          saveStoredSessions(next);
          return next;
        });
        markSyncSuccess();
      }
    );

    return () => {
      unsubscribe();
    };
  }, [supabaseConfig.url, supabaseConfig.anonKey]);

  // Submit Step 1 (Before)
  const handleSubmitBefore = async (data: {
    categoryKey: EmotionCategoryKey;
    categoryName: string;
    emotion: string;
    comment: string;
  }) => {
    setSyncStatus('SYNCING');
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const dateStr = activeSession.date || now.toISOString().split('T')[0];

    const newResponse: EmotionResponse = {
      id: `resp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
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
    setResponses(updated);
    saveStoredResponses(updated);

    try {
      // Push to Supabase Cloud if configured
      if (isSupabaseConfigured(supabaseConfig) && supabaseConfig.autoSync) {
        upsertSessionToSupabase(activeSession).catch(() => {});
        await pushResponseToSupabase(newResponse);
      }

      // Sync to Google Sheets if configured
      if (sheetsConfig.autoSync && sheetsConfig.webhookUrl) {
        syncResponseToGoogleSheets(newResponse, sheetsConfig);
      }

      markSyncSuccess();
    } catch (e) {
      console.warn('Submit before sync error:', e);
      markSyncSuccess(); // Local save succeeded
    }
  };

  // Submit Step 2 (After)
  const handleSubmitAfter = async (data: {
    categoryKey: EmotionCategoryKey;
    categoryName: string;
    emotion: string;
    comment: string;
  }) => {
    setSyncStatus('SYNCING');
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const dateStr = activeSession.date || now.toISOString().split('T')[0];

    const newResponse: EmotionResponse = {
      id: `resp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
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
    setResponses(updated);
    saveStoredResponses(updated);

    try {
      // Push to Supabase Cloud if configured
      if (isSupabaseConfigured(supabaseConfig) && supabaseConfig.autoSync) {
        upsertSessionToSupabase(activeSession).catch(() => {});
        await pushResponseToSupabase(newResponse);
      }

      // Sync to Google Sheets if configured
      if (sheetsConfig.autoSync && sheetsConfig.webhookUrl) {
        syncResponseToGoogleSheets(newResponse, sheetsConfig);
      }

      markSyncSuccess();
    } catch (e) {
      console.warn('Submit after sync error:', e);
      markSyncSuccess(); // Local save succeeded
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
        onOpenShareQr={() => setShowShareQrModal(true)}
        syncStatus={syncStatus}
        onManualSync={handleManualSync}
        lastSyncedTime={lastSyncedTime}
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
            onOpenShareQr={() => setShowShareQrModal(true)}
            syncStatus={syncStatus}
            onManualSync={handleManualSync}
            lastSyncedTime={lastSyncedTime}
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
            onOpenShareQr={() => setShowShareQrModal(true)}
            syncStatus={syncStatus}
            onManualSync={handleManualSync}
            lastSyncedTime={lastSyncedTime}
          />
        )}
      </main>

      {/* Training Organizer Settings Modal with Supabase & Google Sheets */}
      <TrainingSettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        sessions={sessions}
        activeSession={activeSession}
        onSelectSession={handleSelectSession}
        onUpdateSessions={handleUpdateSessions}
        sheetsConfig={sheetsConfig}
        onUpdateSheetsConfig={handleUpdateSheetsConfig}
        supabaseConfig={supabaseConfig}
        onUpdateSupabaseConfig={handleUpdateSupabaseConfig}
        responses={responses}
        onTriggerSupabaseSync={handleTriggerSupabaseSync}
      />

      {/* Quick Share & QR Code Modal */}
      <ShareQrModal
        isOpen={showShareQrModal}
        onClose={() => setShowShareQrModal(false)}
        activeSession={activeSession}
        responses={responses}
        onGoToStudentHome={() => {
          setShowShareQrModal(false);
          setCurrentView('STUDENT_HOME');
        }}
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
