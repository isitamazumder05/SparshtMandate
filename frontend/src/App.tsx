import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Navbar } from './components/Navbar';
import { ParallaxHero } from './components/ParallaxHero';
import { AuthView } from './components/AuthView';
import { AnalyzerView } from './components/AnalyzerView';
import { ResultsDashboard } from './components/ResultsDashboard';
import { Footer } from './components/Footer';
import { RegulatoryExplorerModal } from './components/RegulatoryExplorerModal';
import { HistoryDrawer } from './components/HistoryDrawer';
import { User, AnalysisResponse, MandateRecordInput } from './types';
import { getStoredUser, fetchCurrentUser, logoutUser } from './services/api';
import { compareMandateSimulation } from './services/simulation';

type AppStage = 'LANDING' | 'AUTH' | 'WORKSPACE';

export const App: React.FC = () => {
  const [stage, setStage] = useState<AppStage>('LANDING');
  const [user, setUser] = useState<User | null>(getStoredUser());
  const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [isRegulatoryOpen, setIsRegulatoryOpen] = useState<boolean>(false);

  // Validate existing stored token on app load
  useEffect(() => {
    fetchCurrentUser().then((u) => {
      if (u) {
        setUser(u);
        setStage('WORKSPACE');
      } else {
        setUser(null);
      }
    });
  }, []);

  const handleAuthSuccess = (authenticatedUser: User) => {
    setUser(authenticatedUser);
    setStage('WORKSPACE');
  };

  const handleSignOut = async () => {
    await logoutUser();
    setUser(null);
    setCurrentAnalysis(null);
    setStage('LANDING');
  };

  const handleAnalysisComplete = (result: AnalysisResponse) => {
    setCurrentAnalysis(result);
    // Fire celebratory metallic confetti on completion
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#C28B3D', '#E8C78E', '#85543A']
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSimulateMandate = (mandate: MandateRecordInput) => {
    if (!currentAnalysis) return;
    const updated = compareMandateSimulation(currentAnalysis, mandate);
    setCurrentAnalysis(updated);
  };

  return (
    <div className="min-h-screen bg-[#211611] text-[#F5EBDD] font-sans selection:bg-[#C28B3D] selection:text-[#211611]">
      {/* Dynamic Header Navbar */}
      {stage !== 'AUTH' && (
        <Navbar
          user={user}
          onOpenHistory={() => setIsHistoryOpen(true)}
          onOpenRegulatoryDocs={() => setIsRegulatoryOpen(true)}
          onNewAudit={() => {
            setCurrentAnalysis(null);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onSignInClick={() => setStage('AUTH')}
          onSignOut={handleSignOut}
        />
      )}

      {/* Main View Router */}
      {stage === 'AUTH' ? (
        /* STAGE 2: Secure Authentication View */
        <main>
          <AuthView
            onAuthSuccess={handleAuthSuccess}
            onBackToHome={() => setStage('LANDING')}
          />
        </main>
      ) : stage === 'WORKSPACE' && user ? (
        /* STAGE 3: Authenticated Analysis Workspace */
        <main className="pt-24 pb-16">
          {currentAnalysis ? (
            /* Analysis Results Dashboard with Timeline, Findings, Terms */
            <ResultsDashboard
              analysis={currentAnalysis}
              onReset={() => setCurrentAnalysis(null)}
              onSimulateMandate={handleSimulateMandate}
              onOpenRegulatoryDocs={() => setIsRegulatoryOpen(true)}
              onUpdateAnalysis={(updated) => setCurrentAnalysis(updated)}
            />
          ) : (
            /* Primary URL Input & Analysis Workspace */
            <div className="max-w-6xl mx-auto px-4">
              <AnalyzerView
                onAnalysisComplete={handleAnalysisComplete}
                isLoading={isLoading}
                setIsLoading={setIsLoading}
              />
            </div>
          )}
        </main>
      ) : (
        /* STAGE 1: Cinematic Minimal Landing Page (ONLY Name, Taglines, CTA & 5-Layer Parallax) */
        <main>
          <ParallaxHero
            onGetStarted={() => setStage('AUTH')}
          />
        </main>
      )}

      {/* Footer (Rendered on Landing & Workspace) */}
      {stage !== 'AUTH' && (
        <Footer
          onAnalyzeClick={() => {
            if (user) {
              setCurrentAnalysis(null);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
              setStage('AUTH');
            }
          }}
          onOpenRegulatoryDocs={() => setIsRegulatoryOpen(true)}
        />
      )}

      {/* Modals & History Drawers */}
      <RegulatoryExplorerModal
        isOpen={isRegulatoryOpen}
        onClose={() => setIsRegulatoryOpen(false)}
      />

      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onSelectAnalysis={(selected) => {
          setCurrentAnalysis(selected);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
    </div>
  );
};

export default App;
