import React, { useState, useEffect } from 'react';
import { votingStore } from './services/storage';
import { Navbar } from './components/Navbar';
import { LiveCountChart } from './components/LiveCountChart';
import { CandidateCard } from './components/CandidateCard';
import { VoterBoothModal } from './components/VoterBoothModal';
import { CommitteeDashboard, CommitteeTab } from './components/CommitteeDashboard';
import { AdminSchoolSettings, AdminTab } from './components/AdminSchoolSettings';
import { LoginModal } from './components/LoginModal';
import { SupabaseGuideModal } from './components/SupabaseGuideModal';
import type { AuthStaffUser } from './types/index.ts';
import { Vote, Sparkles, LogIn } from 'lucide-react';

export default function App() {
  // Authentication & Roles
  const [currentUser, setCurrentUser] = useState<AuthStaffUser | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);

  // View state: 'home' (public quick count & paslon), 'committee', or 'admin'
  const [currentView, setCurrentView] = useState<'home' | 'committee' | 'admin'>('home');
  const [panitiaTab, setPanitiaTab] = useState<CommitteeTab>('dpt');
  const [adminTab, setAdminTab] = useState<AdminTab>('school');

  // Student Bilik Suara state
  const [isBoothOpen, setIsBoothOpen] = useState(false);
  const [preselectedCandidateId, setPreselectedCandidateId] = useState<string | null>(null);

  // Reactive state ticker for storage events
  const [, setTick] = useState(0);
  const isFreshDevice = typeof window !== 'undefined' && !localStorage.getItem('evoting_school_config');
  const [isReady, setIsReady] = useState(!isFreshDevice || votingStore.hasInitialSync());

  useEffect(() => {
    const unsubscribe = votingStore.subscribe(() => {
      setTick((prev) => prev + 1);
      setIsReady(true);
    });
    return unsubscribe;
  }, []);

  const activePeriod = votingStore.getActivePeriod();
  const schoolConfig = votingStore.getSchoolConfig();
  const candidates = votingStore.getCandidates(activePeriod.id);
  const stats = votingStore.getElectionStats(activePeriod.id);

  if (!isReady) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center select-none font-sans">
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center mb-4 animate-pulse">
          <Vote className="w-8 h-8 text-indigo-400" />
        </div>
        <h2 className="text-lg font-bold text-white mb-1.5">Menghubungkan ke Database E-Voting</h2>
        <p className="text-xs text-slate-400 max-w-sm mb-5">
          Memuat konfigurasi profil sekolah, daftar paslon, dan status bilik suara resmi...
        </p>
        <div className="w-44 h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div className="w-1/2 h-full bg-indigo-500 rounded-full animate-pulse mx-auto" />
        </div>
      </div>
    );
  }

  const handleOpenBooth = (candidateId?: string) => {
    if (candidateId) {
      setPreselectedCandidateId(candidateId);
    } else {
      setPreselectedCandidateId(null);
    }
    setIsBoothOpen(true);
  };

  const handleLoginSuccess = (user: AuthStaffUser) => {
    setCurrentUser(user);
    if (user.role === 'panitia') {
      setCurrentView('committee');
      setPanitiaTab('dpt');
    } else {
      setCurrentView('admin');
      setAdminTab('school');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsGuideModalOpen(false);
    setCurrentView('home');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      
      {/* 1. Global Navigation Bar */}
      <Navbar
        currentUser={currentUser}
        currentView={currentView}
        panitiaTab={panitiaTab}
        adminTab={adminTab}
        onNavigateHome={() => setCurrentView('home')}
        onSelectPanitiaTab={(tab) => {
          setCurrentView('committee');
          setPanitiaTab(tab);
        }}
        onSelectAdminTab={(tab) => {
          setCurrentView('admin');
          setAdminTab(tab);
        }}
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
        onLogout={handleLogout}
        activePeriod={activePeriod}
        schoolConfig={schoolConfig}
        onOpenBooth={() => handleOpenBooth()}
        onOpenGuideModal={currentUser?.role === 'admin' ? () => setIsGuideModalOpen(true) : undefined}
      />

      {/* 2. Main Body Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 print:p-0 print:m-0 print:max-w-none">
        
        {/* ================= VIEW: HOME (PUBLIC QUICK COUNT & PASLON) ================= */}
        {currentView === 'home' && (
          <div className="space-y-12">
            
            {/* Live Count and Realtime Metrics with Vertical Bar Chart */}
            <LiveCountChart
              activePeriod={activePeriod}
              schoolConfig={schoolConfig}
              onOpenBooth={() => handleOpenBooth()}
            />

            {/* Candidates Section */}
            <section className="space-y-6 pt-4">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-slate-200 pb-4">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>Pilihan Calon Pemimpin Siswa</span>
                  </div>
                  <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                    Daftar Calon Ketua {schoolConfig.organization_type}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Pelajari visi, misi, dan program kerja masing-masing calon ketua sebelum menentukan pilihan di bilik suara.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {!currentUser && (
                    <button
                      onClick={() => setIsLoginModalOpen(true)}
                      className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors flex items-center gap-1.5"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      <span>Login Petugas</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleOpenBooth()}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2"
                  >
                    <Vote className="w-4 h-4 text-emerald-400" />
                    <span>Buka Bilik Suara Siswa</span>
                  </button>
                </div>
              </div>

              {/* Grid of Candidate Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {candidates.map((cand) => {
                  const candStat = stats.candidateResults.find((c) => c.id === cand.id);
                  return (
                    <CandidateCard
                      key={cand.id}
                      candidate={cand}
                      onSelectInBooth={(candId) => handleOpenBooth(candId)}
                      votePercentage={candStat?.vote_percentage}
                      voteCount={candStat?.vote_count}
                      showVoteMetrics={true}
                    />
                  );
                })}
              </div>
            </section>

          </div>
        )}

        {/* ================= VIEW: COMMITTEE DASHBOARD (LOGGED IN) ================= */}
        {currentView === 'committee' && currentUser?.role === 'panitia' && (
          <CommitteeDashboard
            activePeriod={activePeriod}
            schoolConfig={schoolConfig}
            selectedTab={panitiaTab}
            onTabChange={(tab) => setPanitiaTab(tab)}
            onLogout={handleLogout}
          />
        )}

        {/* ================= VIEW: ADMIN SCHOOL DASHBOARD (LOGGED IN) ================= */}
        {currentView === 'admin' && currentUser?.role === 'admin' && (
          <AdminSchoolSettings
            activePeriod={activePeriod}
            schoolConfig={schoolConfig}
            selectedTab={adminTab}
            onTabChange={(tab) => setAdminTab(tab)}
            onLogout={handleLogout}
          />
        )}

      </main>

      {/* 3. Global Footer */}
      <footer className="bg-white border-t border-slate-200 mt-12 py-8 transition-colors no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-xs overflow-hidden p-1 border border-slate-700/60 shrink-0">
                {schoolConfig.logo_url ? (
                  <img
                    src={schoolConfig.logo_url}
                    alt={`Logo E-Voting ${schoolConfig.organization_type}`}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <Vote className="w-5 h-5 text-emerald-400" />
                )}
              </div>
              <div>
                <p className="font-bold text-slate-800 text-sm">
                  {schoolConfig.school_name}
                </p>
                <p className="text-[11px] text-slate-400">
                  Logo E-Voting {schoolConfig.organization_type} · Sistem Pemilihan Ketua Multi-Periode Berbasis Web
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 text-xs">
              <span className="text-slate-600 font-medium">Asas LUBER JURDIL</span>
              <span>·</span>
              <span className="text-slate-600">Bilik Suara Rahasia & Terenkripsi</span>
              <span>·</span>
              <span className="text-slate-600">Anti Double-Voting</span>
              {currentUser?.role === 'admin' && (
                <>
                  <span>·</span>
                  <button
                    onClick={() => setIsGuideModalOpen(true)}
                    className="text-indigo-600 hover:text-indigo-800 font-semibold underline cursor-pointer"
                  >
                    Panduan Database & Deploy
                  </button>
                </>
              )}
              {!currentUser && (
                <>
                  <span>·</span>
                  <button
                    onClick={() => setIsLoginModalOpen(true)}
                    className="text-slate-700 hover:text-slate-900 font-semibold underline cursor-pointer"
                  >
                    Portal Login Petugas
                  </button>
                </>
              )}
            </div>

            <div className="text-[11px] text-slate-400 font-mono">
              Masa Bakti {activePeriod.year_label}
            </div>

          </div>
        </div>
      </footer>

      {/* 4. Staff Login Modal (Admin & Panitia) */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* 5. Digital Voting Booth Modal (Student) */}
      <VoterBoothModal
        isOpen={isBoothOpen}
        onClose={() => setIsBoothOpen(false)}
        activePeriod={activePeriod}
        schoolConfig={schoolConfig}
        preselectedCandidateId={preselectedCandidateId}
      />

      {/* 6. Supabase Database & Deployment Guide Modal (Admin Only) */}
      {currentUser?.role === 'admin' && (
        <SupabaseGuideModal
          isOpen={isGuideModalOpen}
          onClose={() => setIsGuideModalOpen(false)}
        />
      )}

    </div>
  );
}
