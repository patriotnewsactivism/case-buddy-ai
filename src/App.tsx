import React, { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, Link, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FileText, Users, BrainCircuit, Gavel, Settings as SettingsIcon, Menu, X, Mic, FileAudio, Calculator, FileSearch, BookOpen, Target, BarChart2, Handshake, Scale, FolderOpen, ChevronDown, ChevronRight, LogOut, Shield } from 'lucide-react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { KnowledgeProvider } from './contexts/KnowledgeContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const LoginPage = lazy(() => import('./components/auth/LoginPage'));
const SignupPage = lazy(() => import('./components/auth/SignupPage'));
const ForgotPasswordPage = lazy(() => import('./components/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./components/auth/ResetPasswordPage'));
const Dashboard = lazy(() => import('./components/Dashboard'));
const CaseManager = lazy(() => import('./components/CaseManager'));
const WitnessLab = lazy(() => import('./components/WitnessLab'));
const StrategyRoom = lazy(() => import('./components/StrategyRoom'));
const ArgumentPractice = lazy(() => import('./components/ArgumentPractice'));
const LandingPage = lazy(() => import('./components/LandingPage'));
const PrivacyPolicy = lazy(() => import('./components/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./components/TermsOfService'));
const Transcriber = lazy(() => import('./components/Transcriber'));
const DraftingAssistant = lazy(() => import('./components/DraftingAssistant'));
const SettingsPage = lazy(() => import('./components/Settings'));
const SettlementCalculator = lazy(() => import('./components/SettlementCalculator'));
const DiscoveryManager = lazy(() => import('./components/DiscoveryManager'));
const CaseLawResearch = lazy(() => import('./components/CaseLawResearch'));
const EvidenceAdmissibility = lazy(() => import('./components/EvidenceAdmissibility'));
const PerformanceAnalytics = lazy(() => import('./components/PerformanceAnalytics'));
const DepositionOutlineGenerator = lazy(() => import('./components/DepositionOutlineGenerator'));
const NegotiationSimulator = lazy(() => import('./components/NegotiationSimulator'));
const EvidenceTimeline = lazy(() => import('./components/EvidenceTimeline'));
const MockJury = lazy(() => import('./components/MockJury'));
const PublicRecordsManager = lazy(() => import('./components/PublicRecordsManager'));
const OfficerDatabase = lazy(() => import('./components/OfficerDatabase'));

import { MOCK_CASES } from './constants';
import { Case, EvidenceItem } from './types';
import { loadActiveCaseId, loadPreferences, saveActiveCaseId, saveCases, savePreferences } from './utils/storage';
import { appendEvidence, fetchCases, removeCase, supabaseReady, upsertCase } from './services/dataService';
import ErrorBoundary from './components/ErrorBoundary';

const queryClient = new QueryClient();

const Sidebar = ({ isOpen, setIsOpen }: { isOpen: boolean, setIsOpen: (v: boolean) => void }) => {
  const location = useLocation();
  const [showTools, setShowTools] = useState(true);
  const [showPrep, setShowPrep] = useState(true);

  const isActive = (path: string) => location.pathname === path ? 'bg-slate-800 text-yellow-500 border-r-4 border-yellow-500' : 'text-slate-400 hover:bg-slate-800/50 hover:text-white';

  const NavItem = ({ path, icon: Icon, label }: { path: string, icon: any, label: string }) => (
    <Link
      to={path}
      onClick={() => setIsOpen(false)}
      className={`flex items-center gap-3 px-6 py-3 transition-all duration-200 ${isActive(path)}`}
    >
      <Icon size={18} />
      <span className="font-medium text-sm">{label}</span>
    </Link>
  );

  const NavGroup = ({ title, icon: Icon, isOpen: open, toggle, children }: { title: string; icon: any; isOpen: boolean; toggle: () => void; children: React.ReactNode }) => (
    <div className="border-b border-slate-800/50">
      <button
        onClick={toggle}
        className="flex items-center justify-between w-full px-6 py-3 text-slate-300 hover:text-white transition-colors"
      >
        <div className="flex items-center gap-2">
          <Icon size={16} />
          <span className="text-xs font-semibold uppercase tracking-wider">{title}</span>
        </div>
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
      </button>
      {open && <div className="pb-2">{children}</div>}
    </div>
  );

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={`
        fixed top-0 left-0 z-50 h-full w-64 bg-slate-950 border-r border-slate-800
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
      `}>
        <div className="h-16 flex items-center px-4 border-b border-slate-800">
          <Link to="/app" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Gavel size={24} className="text-yellow-500" />
            <span className="text-lg font-serif font-bold text-white">CaseBuddy</span>
          </Link>
          <button className="ml-auto md:hidden text-slate-400" onClick={() => setIsOpen(false)}>
            <X size={24} />
          </button>
        </div>

        <nav className="mt-2 flex flex-col overflow-y-auto h-[calc(100vh-4rem)]">
          <NavItem path="/app" icon={LayoutDashboard} label="Dashboard" />
          <NavItem path="/app/cases" icon={Gavel} label="Case Files" />

          <NavGroup title="Preparation" icon={FolderOpen} isOpen={showPrep} toggle={() => setShowPrep(!showPrep)}>
            <NavItem path="/app/practice" icon={Mic} label="Trial Simulator" />
            <NavItem path="/app/witness-lab" icon={Users} label="Witness Lab" />
            <NavItem path="/app/mock-jury" icon={Scale} label="Mock Jury" />
            <NavItem path="/app/deposition" icon={FileText} label="Deposition Outlines" />
            <NavItem path="/app/performance" icon={BarChart2} label="Performance" />
          </NavGroup>

          <NavGroup title="Tools" icon={BrainCircuit} isOpen={showTools} toggle={() => setShowTools(!showTools)}>
            <NavItem path="/app/strategy" icon={BrainCircuit} label="Strategy & AI" />
            <NavItem path="/app/settlement" icon={Calculator} label="Settlement Calculator" />
            <NavItem path="/app/discovery" icon={FileSearch} label="Discovery Manager" />
            <NavItem path="/app/case-law" icon={BookOpen} label="Case Law Research" />
            <NavItem path="/app/admissibility" icon={Target} label="Evidence Analyzer" />
            <NavItem path="/app/timeline" icon={Scale} label="Evidence Timeline" />
            <NavItem path="/app/foia" icon={FileText} label="Public Records / FOIA" />
            <NavItem path="/app/officers" icon={Shield} label="Officer Database" />
          </NavGroup>

          <NavItem path="/app/transcriber" icon={FileAudio} label="Transcriber" />
          <NavItem path="/app/docs" icon={FileText} label="Drafting Assistant" />
          <NavItem path="/app/negotiation" icon={Handshake} label="Negotiation Sim" />

          <div className="mt-auto border-t border-slate-800 pt-2 mb-4">
            <NavItem path="/app/settings" icon={SettingsIcon} label="Settings" />
          </div>
        </nav>
      </aside>
    </>
  );
};

const Layout = ({ children }: { children?: React.ReactNode }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth/login');
  };

  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <div className="md:ml-64 min-h-screen flex flex-col">
        <header className="h-14 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-30 px-4 flex items-center justify-between">
          <button className="md:hidden text-slate-400" onClick={() => setIsSidebarOpen(true)}>
            <Menu size={24} />
          </button>
          <div className="flex items-center gap-4 ml-auto">
             <div className="hidden sm:flex flex-col items-end">
               <span className="text-sm font-semibold text-white">{user.fullName}</span>
               <span className="text-xs text-slate-400">{user.email}</span>
             </div>
             <div className="h-9 w-9 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center">
                <span className="text-sm font-semibold text-white">{user.fullName.charAt(0).toUpperCase()}</span>
             </div>
             <button
               onClick={handleSignOut}
               className="flex items-center gap-2 px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
               title="Sign out"
             >
               <LogOut size={18} />
               <span className="hidden sm:inline">Sign Out</span>
             </button>
          </div>
        </header>

        <main className="flex-1 p-3 sm:p-4 md:p-6 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
};

const AuthenticatedLayout = ({ children }: { children?: React.ReactNode }) => (
  <ProtectedRoute>
    <Layout>{children}</Layout>
  </ProtectedRoute>
);

export const AppContext = React.createContext<{
    cases: Case[];
    activeCase: Case | null;
    setActiveCase: (c: Case | null) => void;
    addCase: (c: Case) => Promise<void>;
    updateCase: (caseId: string, data: Partial<Case>) => Promise<void>;
    deleteCase: (caseId: string) => Promise<void>;
    addEvidence: (caseId: string, evidence: EvidenceItem) => Promise<void>;
    theme: 'dark' | 'light';
    setTheme: (t: 'dark' | 'light') => void;
    user: { id: string; email: string; fullName: string; firmName?: string } | null;
  }>({
    cases: [],
    activeCase: null,
    setActiveCase: () => {},
    addCase: async () => {},
    updateCase: async () => {},
    deleteCase: async () => {},
    addEvidence: async () => {},
    theme: 'dark',
    setTheme: () => {},
    user: null,
  });

const AppInner = () => {
  const [cases, setCases] = useState<Case[]>([]);
  const [activeCaseId, setActiveCaseId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [theme, setThemeState] = useState<'dark' | 'light'>('dark');
  const { user } = useAuth();

  useEffect(() => {
    let cancelled = false;

    const hydrate = async () => {
      if (!user) {
        setHydrated(false);
        return;
      }

      try {
        const loaded = await fetchCases();
        const usingSupabase = supabaseReady();
        const fallback = loaded.length > 0 ? loaded : (usingSupabase ? [] : MOCK_CASES);
        const savedActiveId = loadActiveCaseId();
        const fallbackActive = fallback.find(c => c.id === savedActiveId) || fallback[0] || null;

        if (cancelled) return;

        setCases(fallback);
        setActiveCaseId(fallbackActive ? fallbackActive.id : null);
      } catch (error) {
        console.error('Failed to hydrate cases', error);
        if (!cancelled) {
          setCases(MOCK_CASES);
          setActiveCaseId(MOCK_CASES[0]?.id || null);
        }
      } finally {
        if (!cancelled) {
          setHydrated(true);
        }
      }
    };

    hydrate();

    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    const prefs = loadPreferences();
    setThemeState(prefs.theme || 'dark');
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    if (!hydrated || !user) return;
    saveCases(cases);
  }, [cases, hydrated, user]);

  useEffect(() => {
    if (!hydrated || !user) return;
    saveActiveCaseId(activeCaseId);
  }, [activeCaseId, hydrated, user]);

  const activeCase = useMemo(
    () => cases.find(c => c.id === activeCaseId) || null,
    [cases, activeCaseId]
  );

  const setActiveCase = (selected: Case | null) => {
    setActiveCaseId(selected?.id || null);
  };

  const setTheme = (nextTheme: 'dark' | 'light') => {
    setThemeState(nextTheme);
    savePreferences({ theme: nextTheme });
  };

  const addCase = async (newCase: Case) => {
    const enrichedCase = {
      ...newCase,
      user_id: user?.id,
      evidence: newCase.evidence || [],
      tasks: newCase.tasks || [],
      tags: newCase.tags || [],
    };
    setCases(prev => {
      const next = [...prev, enrichedCase];
      saveCases(next);
      return next;
    });
    setActiveCaseId(enrichedCase.id);

    try {
      await upsertCase(enrichedCase);
    } catch (error) {
      console.error('Failed to sync case to Supabase', error);
    }
  };

  const updateCase = async (caseId: string, data: Partial<Case>) => {
    const target = cases.find(c => c.id === caseId);
    if (!target) return;
    const updatedCase = { ...target, ...data };

    setCases(prev => {
      const next = prev.map(c => c.id === caseId ? updatedCase : c);
      saveCases(next);
      return next;
    });

    try {
      await upsertCase(updatedCase);
    } catch (error) {
      console.error('Failed to update case in Supabase', error);
    }
  };

  const deleteCase = async (caseId: string) => {
    setCases(prev => {
      const filtered = prev.filter(c => c.id !== caseId);
      saveCases(filtered);
      if (activeCaseId === caseId) {
        setActiveCaseId(filtered[0]?.id || null);
      }
      return filtered;
    });

    try {
      await removeCase(caseId);
    } catch (error) {
      console.error('Failed to delete case in Supabase', error);
    }
  };

  const addEvidence = async (caseId: string, evidence: EvidenceItem) => {
    const target = cases.find(c => c.id === caseId);
    if (!target) return;
    const updatedCase = { ...target, evidence: [...(target.evidence || []), evidence] };

    setCases(prev => {
      const next = prev.map(c => c.id === caseId ? updatedCase : c);
      saveCases(next);
      return next;
    });

    try {
      await appendEvidence(caseId, evidence);
    } catch (error) {
      console.error('Failed to append evidence in Supabase', error);
    }
  };

  return (
    <AppContext.Provider value={{ cases, activeCase, setActiveCase, addCase, updateCase, deleteCase, addEvidence, theme, setTheme, user }}>
      <ErrorBoundary>
        <Suspense fallback={<div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400">Loading...</div>}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/tos" element={<TermsOfService />} />

            <Route path="/auth/login" element={<LoginPage />} />
            <Route path="/auth/signup" element={<SignupPage />} />
            <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/auth/reset-password" element={<ResetPasswordPage />} />

            <Route path="/app" element={<AuthenticatedLayout><Dashboard /></AuthenticatedLayout>} />
            <Route path="/app/cases" element={<AuthenticatedLayout><CaseManager /></AuthenticatedLayout>} />
            <Route path="/app/witness-lab" element={<AuthenticatedLayout><WitnessLab /></AuthenticatedLayout>} />
            <Route path="/app/practice" element={<AuthenticatedLayout><ArgumentPractice /></AuthenticatedLayout>} />
            <Route path="/app/strategy" element={<AuthenticatedLayout><StrategyRoom /></AuthenticatedLayout>} />
            <Route path="/app/transcriber" element={<AuthenticatedLayout><Transcriber /></AuthenticatedLayout>} />
            <Route path="/app/docs" element={<AuthenticatedLayout><DraftingAssistant /></AuthenticatedLayout>} />
            <Route path="/app/settings" element={<AuthenticatedLayout><SettingsPage /></AuthenticatedLayout>} />
            <Route path="/app/settlement" element={<AuthenticatedLayout><SettlementCalculator /></AuthenticatedLayout>} />
            <Route path="/app/discovery" element={<AuthenticatedLayout><DiscoveryManager /></AuthenticatedLayout>} />
            <Route path="/app/case-law" element={<AuthenticatedLayout><CaseLawResearch /></AuthenticatedLayout>} />
            <Route path="/app/admissibility" element={<AuthenticatedLayout><EvidenceAdmissibility /></AuthenticatedLayout>} />
            <Route path="/app/performance" element={<AuthenticatedLayout><PerformanceAnalytics /></AuthenticatedLayout>} />
            <Route path="/app/deposition" element={<AuthenticatedLayout><DepositionOutlineGenerator /></AuthenticatedLayout>} />
            <Route path="/app/negotiation" element={<AuthenticatedLayout><NegotiationSimulator /></AuthenticatedLayout>} />
            <Route path="/app/timeline" element={<AuthenticatedLayout><EvidenceTimeline /></AuthenticatedLayout>} />
            <Route path="/app/mock-jury" element={<AuthenticatedLayout><MockJury /></AuthenticatedLayout>} />
            <Route path="/app/foia" element={<AuthenticatedLayout><PublicRecordsManager /></AuthenticatedLayout>} />
            <Route path="/app/officers" element={<AuthenticatedLayout><OfficerDatabase /></AuthenticatedLayout>} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
      <ToastContainer aria-label="Notifications" theme="dark" />
    </AppContext.Provider>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <KnowledgeProvider>
            <AppInner />
          </KnowledgeProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
