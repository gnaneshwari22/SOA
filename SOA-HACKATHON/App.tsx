import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navigation, TabType } from './components/Navigation';
import { DashboardView } from './components/DashboardView';
import { CertificatesView } from './components/CertificatesView';
import { OwnershipTransferView } from './components/OwnershipTransferView';
import { RetirementView } from './components/RetirementView';
import { RetiredRegistryView } from './components/RetiredRegistryView';
import { MicroservicesConsole } from './components/MicroservicesConsole';
import { ScenarioRunner } from './components/ScenarioRunner';
import { ArchitectureDocs } from './components/ArchitectureDocs';
import { AuthModal } from './components/AuthModal';
import { LoginPage } from './components/LoginPage';
import { IssueCertificateModal } from './components/IssueCertificateModal';
import { Certificate, OwnershipTransfer, RetirementRecord, AuditLogEntry } from './types';
import { certificateApi, retirementApi, systemApi } from './api';

function MainApp() {
  const { user, isLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);

  // Cross-view selection state
  const [preSelectedSerial, setPreSelectedSerial] = useState<string | undefined>(undefined);

  // Global entity states
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [transfers, setTransfers] = useState<OwnershipTransfer[]>([]);
  const [retirements, setRetirements] = useState<RetirementRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGlobalData = useCallback(async () => {
    try {
      const [certs, rets, audits] = await Promise.all([
        certificateApi.getAll(),
        retirementApi.getAll(),
        systemApi.getAuditLogs(),
      ]);
      setCertificates(certs);
      setRetirements(rets);
      setAuditLogs(audits);
    } catch (e) {
      console.error('Failed to load global data', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchGlobalData();
    }
  }, [user, fetchGlobalData]);

  const handleSelectForTransfer = (cert: Certificate) => {
    setPreSelectedSerial(cert.serialNumber);
    setActiveTab('ownership');
  };

  const handleSelectForRetirement = (cert: Certificate) => {
    setPreSelectedSerial(cert.serialNumber);
    setActiveTab('retirement');
  };

  // If loading initial auth state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-xs text-slate-500 font-mono">
        Verifying Security Session...
      </div>
    );
  }

  // REQUIRE LOGIN FIRST: If user is not authenticated, show the Login/Registration portal
  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500/20 selection:text-emerald-300">
      {/* 3-Zone Top Bar Navigation */}
      <Navigation
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setPreSelectedSerial(undefined);
        }}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
      />

      {/* Main Viewport Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="py-24 text-center text-xs text-slate-500 font-mono">
            Loading Renewable Energy Registry...
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <DashboardView
                certificates={certificates}
                transfers={transfers}
                retirements={retirements}
                auditLogs={auditLogs}
                setActiveTab={setActiveTab}
                onOpenIssueModal={() => setIsIssueModalOpen(true)}
              />
            )}

            {activeTab === 'certificates' && (
              <CertificatesView
                certificates={certificates}
                onRefresh={fetchGlobalData}
                onOpenIssueModal={() => setIsIssueModalOpen(true)}
                onSelectForTransfer={handleSelectForTransfer}
                onSelectForRetirement={handleSelectForRetirement}
              />
            )}

            {activeTab === 'ownership' && (
              <OwnershipTransferView
                certificates={certificates}
                transfers={transfers}
                onRefresh={fetchGlobalData}
                preSelectedSerial={preSelectedSerial}
              />
            )}

            {activeTab === 'retirement' && (
              <RetirementView
                certificates={certificates}
                onRefresh={fetchGlobalData}
                setActiveTab={setActiveTab}
                preSelectedSerial={preSelectedSerial}
              />
            )}

            {activeTab === 'registry' && (
              <RetiredRegistryView retirements={retirements} />
            )}

            {activeTab === 'microservices' && <MicroservicesConsole />}

            {activeTab === 'scenarios' && (
              <ScenarioRunner onRefreshAll={fetchGlobalData} />
            )}

            {activeTab === 'architecture' && <ArchitectureDocs />}
          </>
        )}
      </main>

      {/* Footer conforming to anti-slop guidelines */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 px-4 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-300">Renewable Certificate Retirement System</span>
            <span>·</span>
            <span>SOA Programming & Microservices — Team 17</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-500 font-mono">
            <span>Spring Boot 3.3.4</span>
            <span>·</span>
            <span>Apache Kafka 3.7</span>
            <span>·</span>
            <span>Netflix Eureka</span>
            <span>·</span>
            <span>PostgreSQL Isolated DBs</span>
          </div>
        </div>
      </footer>

      {/* Global Issue Certificate Modal */}
      <IssueCertificateModal
        isOpen={isIssueModalOpen}
        onClose={() => setIsIssueModalOpen(false)}
        onSuccess={fetchGlobalData}
      />

      {/* Auth & Identity Switcher Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
