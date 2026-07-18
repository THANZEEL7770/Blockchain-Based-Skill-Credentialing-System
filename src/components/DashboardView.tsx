/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Award, ShieldAlert, CheckCircle, RefreshCw, PlusCircle, Trash, ExternalLink, ShieldCheck, History, Landmark, Users, Layers, Sparkles, Ban } from 'lucide-react';
import { Certificate, AuditLog } from '../types';

interface DashboardViewProps {
  user: any;
  darkMode: boolean;
  walletAddress: string;
  connectWallet: () => void;
  setActiveTab: (tab: string) => void;
}

export default function DashboardView({ user, darkMode, walletAddress, connectWallet, setActiveTab }: DashboardViewProps) {
  // Statistics
  const [stats, setStats] = useState<any>(null);
  
  // Admin States
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [newInstName, setNewInstName] = useState('');
  const [newInstWallet, setNewInstWallet] = useState('');
  const [adminLogs, setAdminLogs] = useState<AuditLog[]>([]);

  // Institution States
  const [issuedCerts, setIssuedCerts] = useState<Certificate[]>([]);
  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [courseName, setCourseName] = useState('Blockchain Technology & Smart Contracts');
  const [grade, setGrade] = useState('A+');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedFileUrl, setSelectedFileUrl] = useState('');

  // Loading indicator States
  const [loadingAction, setLoadingAction] = useState(false);
  const [loadingPage, setLoadingPage] = useState(true);

  // Load contextual data based on login role
  const loadDashboardData = async () => {
    try {
      setLoadingPage(true);
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      // Get high level statistics
      const statsRes = await fetch('/api/admin/stats', { headers });
      const statsJson = await statsRes.json();
      setStats(statsJson);

      // Get audit logs for Admin/Audit
      const logsRes = await fetch('/api/audit-logs', { headers });
      const logsJson = await logsRes.json();
      setAdminLogs(logsJson);

      // Get certificates list (filtered server side by user role!)
      const certsRes = await fetch('/api/certificates', { headers });
      const certsJson = await certsRes.json();
      setIssuedCerts(certsJson);

      // Get institutions list
      const instsRes = await fetch('/api/admin/institutions', { headers });
      const instsJson = await instsRes.json();
      setInstitutions(instsJson);

    } catch (e) {
      console.error('Failed to retrieve dashboard state', e);
    } finally {
      setLoadingPage(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  // Admin: Approve new College
  const handleApproveInstitution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInstName || !newInstWallet) return;
    setLoadingAction(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/institutions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: newInstName, walletAddress: newInstWallet })
      });
      if (res.ok) {
        setNewInstName('');
        setNewInstWallet('');
        await loadDashboardData();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to register institution');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAction(false);
    }
  };

  // Institution: Issue New Certificate
  const handleIssueCertificate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName || !studentEmail || !courseName) return;
    setLoadingAction(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/certificates/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          studentName,
          studentEmail,
          course: courseName,
          grade,
          issueDate,
          fileUrl: selectedFileUrl
        })
      });
      if (res.ok) {
        setStudentName('');
        setStudentEmail('');
        await loadDashboardData();
      } else {
        const err = await res.json();
        alert(err.error || 'Certificate registration failed');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAction(false);
    }
  };

  // Institution: Revoke Certificate
  const handleRevokeCertificate = async (id: string) => {
    if (!window.confirm('Are you absolutely sure you want to revoke this certificate? This action will write a permanent revocation transaction into the blockchain ledger.')) return;
    setLoadingAction(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/certificates/revoke', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        await loadDashboardData();
      } else {
        const err = await res.json();
        alert(err.error || 'Revocation failed');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAction(false);
    }
  };

  if (loadingPage) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-3">
        <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
        <p className="text-sm font-mono text-slate-500">Decrypting dashboard portal...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 py-6 px-4 max-w-7xl mx-auto text-left">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-800/20">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight">
            Dashboard Control Center
          </h1>
          <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Security clearance: <strong className="text-indigo-400 font-mono uppercase">{user?.role}</strong> • {user?.institutionName || user?.email}
          </p>
        </div>
        <button
          onClick={loadDashboardData}
          className="bg-slate-800 text-white hover:bg-slate-700 font-semibold text-xs px-4 py-2 rounded-xl transition-all flex items-center space-x-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Sync Nodes</span>
        </button>
      </div>

      {/* platform Statistics Blocks */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className={`p-5 rounded-2xl border ${darkMode ? 'glass border-slate-800/40' : 'glass-light border-slate-200/40'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-medium">Registered Credentials</span>
            <Award className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold font-display">{stats?.totalCertificates || 0}</div>
        </div>

        <div className={`p-5 rounded-2xl border ${darkMode ? 'glass border-slate-800/40' : 'glass-light border-slate-200/40'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-medium">Approved Registrars</span>
            <Landmark className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-display">{stats?.activeInstitutions || 0}</div>
        </div>

        <div className={`p-5 rounded-2xl border ${darkMode ? 'glass border-slate-800/40' : 'glass-light border-slate-200/40'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-medium">Student Wallets Connected</span>
            <Users className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold font-display">{stats?.totalStudents || 0}</div>
        </div>

        <div className={`p-5 rounded-2xl border ${darkMode ? 'glass border-slate-800/40' : 'glass-light border-slate-200/40'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-medium">Security Fraud Score Alerts</span>
            <ShieldAlert className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-bold font-display text-red-400">{stats?.fraudAlerts || 0}</div>
        </div>
      </div>

      {/* ==========================================
          ROLE: ADMINISTRATOR VIEW
          ========================================== */}
      {user?.role === 'admin' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Approved Institutions Management */}
          <div className="lg:col-span-5 space-y-6">
            <div className={`p-6 rounded-3xl border space-y-4 ${
              darkMode ? 'glass border-slate-800/40' : 'glass-light border-slate-200/40'
            }`}>
              <div className="flex items-center space-x-2">
                <Landmark className="w-5 h-5 text-indigo-400" />
                <h2 className="font-display font-bold text-base">Approve Certificate Issuer</h2>
              </div>
              <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Add colleges to the approved Solidity mapping registry. This allows them to execute signed hashes.
              </p>

              <form onSubmit={handleApproveInstitution} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono font-bold text-slate-400">Institution Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Massachusetts Institute of Technology"
                    value={newInstName}
                    onChange={(e) => setNewInstName(e.target.value)}
                    className={`w-full px-3 py-2.5 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      darkMode ? 'bg-slate-950/40 border-slate-800 text-white placeholder-slate-500' : 'bg-slate-50/40 border-slate-200 text-slate-900 placeholder-slate-400'
                    }`}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono font-bold text-slate-400">Solidity Node Wallet Address</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., 0x771658Fdf9D479B3e9086f6d50ffDe4B31479169"
                    value={newInstWallet}
                    onChange={(e) => setNewInstWallet(e.target.value)}
                    className={`w-full px-3 py-2.5 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono ${
                      darkMode ? 'bg-slate-950/40 border-slate-800 text-white placeholder-slate-500' : 'bg-slate-50/40 border-slate-200 text-slate-900 placeholder-slate-400'
                    }`}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loadingAction}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-2.5 rounded-xl transition-colors"
                >
                  {loadingAction ? 'Mining register transaction...' : 'Approve & Mint on Ledger'}
                </button>
              </form>
            </div>

            {/* Approved Colleges List */}
            <div className={`p-6 rounded-3xl border space-y-3 ${
              darkMode ? 'glass border-slate-800/40' : 'glass-light border-slate-200/40'
            }`}>
              <h3 className="font-bold text-sm">Active Approved Issuers</h3>
              <div className="divide-y divide-slate-800/40 text-xs">
                {institutions.map((inst, i) => (
                  <div key={i} className="py-2.5 flex justify-between items-center">
                    <div>
                      <div className="font-semibold">{inst.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono truncate max-w-[200px]">{inst.walletAddress}</div>
                    </div>
                    <span className="bg-emerald-500/10 text-emerald-400 font-mono text-[9px] px-2 py-0.5 rounded border border-emerald-500/20 uppercase">
                      ACTIVE
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Audit Logs Trail */}
          <div className="lg:col-span-7">
            <div className={`p-6 rounded-3xl border space-y-4 ${
              darkMode ? 'glass border-slate-800/40' : 'glass-light border-slate-200/40'
            }`}>
              <div className="flex items-center space-x-2">
                <History className="w-5 h-5 text-indigo-400" />
                <h2 className="font-display font-bold text-base">Network System Audit Trail</h2>
              </div>
              <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Non-repudiation audit registers: tracking administrative registrations, certificate blocks, and consensus approvals.
              </p>

              <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                {adminLogs.map((log) => (
                  <div key={log.id} className={`p-3.5 rounded-2xl border text-xs space-y-1.5 ${
                    darkMode ? 'bg-slate-950/20 border-slate-800/40' : 'bg-slate-50/40 border-slate-200/40'
                  }`}>
                    <div className="flex justify-between items-center font-mono">
                      <span className="font-bold uppercase text-indigo-400 text-[10px]">{log.action}</span>
                      <span className="text-slate-500 text-[9px]">{new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                    <p className={`text-xs ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                      {log.details}
                    </p>
                    <div className="text-[9px] text-slate-500 font-mono flex justify-between">
                      <span>Operator: {log.userName}</span>
                      <span>Clearance: {log.role.toUpperCase()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          ROLE: INSTITUTION / COLLEGE REGISTERED VIEW
          ========================================== */}
      {user?.role === 'institution' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Issue Certificate Form */}
          <div className="lg:col-span-5">
            <div className={`p-6 rounded-3xl border space-y-4 ${
              darkMode ? 'glass border-slate-800/40' : 'glass-light border-slate-200/40'
            }`}>
              <div className="flex items-center space-x-2 pb-2 border-b border-slate-800/30">
                <PlusCircle className="w-5 h-5 text-indigo-400" />
                <h2 className="font-display font-bold text-base">Issue Secure Certificate</h2>
              </div>
              <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Fill in student academic credentials. The system calculates a secure SHA-256 hash, signs it with your private key representation, and uploads data schemas to IPFS.
              </p>

              <form onSubmit={handleIssueCertificate} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-mono font-bold text-slate-400">Student Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., Alex Johnson"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                        darkMode ? 'bg-slate-950/40 border-slate-800/80 text-white placeholder-slate-500' : 'bg-slate-50/40 border-slate-200 text-slate-900 placeholder-slate-400'
                      }`}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-mono font-bold text-slate-400">Student Email</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g., alex@student.com"
                      value={studentEmail}
                      onChange={(e) => setStudentEmail(e.target.value)}
                      className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                        darkMode ? 'bg-slate-950/40 border-slate-800/80 text-white placeholder-slate-500' : 'bg-slate-50/40 border-slate-200 text-slate-900 placeholder-slate-400'
                      }`}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-mono font-bold text-slate-400">Awarded Course Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Advanced Blockchain Engineering"
                    value={courseName}
                    onChange={(e) => setCourseName(e.target.value)}
                    className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      darkMode ? 'bg-slate-950/40 border-slate-800/80 text-white placeholder-slate-500' : 'bg-slate-50/40 border-slate-200 text-slate-900 placeholder-slate-400'
                    }`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-mono font-bold text-slate-400">Performance Grade</label>
                    <select
                      value={grade}
                      onChange={(e) => setGrade(e.target.value)}
                      className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                        darkMode ? 'bg-slate-950/40 border-slate-800/80 text-white' : 'bg-slate-50 border-slate-200 text-slate-950'
                      }`}
                    >
                      {['A+', 'A', 'B+', 'B', 'C', 'Pass'].map((g) => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-mono font-bold text-slate-400">Issue Date</label>
                    <input
                      type="date"
                      required
                      value={issueDate}
                      onChange={(e) => setIssueDate(e.target.value)}
                      className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                        darkMode ? 'bg-slate-950/40 border-slate-800/80 text-white placeholder-slate-500' : 'bg-slate-50/40 border-slate-200 text-slate-900 placeholder-slate-400'
                      }`}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-mono font-bold text-slate-400">Mock Certificate Template Preview (Data URI)</label>
                  <input
                    type="text"
                    placeholder="Optional image/PDF data URI for mock attachment"
                    value={selectedFileUrl}
                    onChange={(e) => setSelectedFileUrl(e.target.value)}
                    className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono ${
                      darkMode ? 'bg-slate-950/40 border-slate-800/80 text-white placeholder-slate-500' : 'bg-slate-50/40 border-slate-200 text-slate-900 placeholder-slate-400'
                    }`}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loadingAction}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-3 rounded-xl transition-all shadow-lg shadow-indigo-600/10"
                >
                  {loadingAction ? 'Minting Blockchain Certificate block...' : 'Publish Certificate & Mine Hash'}
                </button>
              </form>
            </div>
          </div>

          {/* Issued Certificates List */}
          <div className="lg:col-span-7 space-y-6">
            <div className={`p-6 rounded-3xl border space-y-4 ${
              darkMode ? 'glass border-slate-800/40' : 'glass-light border-slate-200/40'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <History className="w-5 h-5 text-indigo-400" />
                  <h2 className="font-display font-bold text-base">Issued Credentials Audit Logs</h2>
                </div>
                <span className="text-xs font-mono bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded">
                  {issuedCerts.length} active
                </span>
              </div>

              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                {issuedCerts.length === 0 ? (
                  <div className="text-center py-10 text-slate-500 text-xs">
                    No credentials have been registered by this registrar node yet. Use the issuance panel on the left to mint.
                  </div>
                ) : (
                  issuedCerts.map((cert) => (
                    <div key={cert.id} className={`p-4 rounded-2xl border text-xs space-y-3.5 transition-all ${
                      darkMode ? 'bg-slate-950/20 border-slate-800/40' : 'bg-slate-50/40 border-slate-200/40'
                    }`}>
                      {/* Name & status row */}
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-bold text-sm">{cert.studentName}</div>
                          <div className="text-[10px] text-slate-400">{cert.studentEmail}</div>
                        </div>

                        <div className="flex items-center space-x-1.5">
                          <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border ${
                            cert.status === 'active'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : 'bg-red-500/10 text-red-400 border-red-500/20'
                          }`}>
                            {cert.status.toUpperCase()}
                          </span>

                          {cert.status === 'active' && (
                            <button
                              onClick={() => handleRevokeCertificate(cert.id)}
                              className="p-1 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                              title="Revoke Certificate"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Course details */}
                      <div className="grid grid-cols-2 gap-2 font-mono text-[10px] text-slate-400">
                        <div>Course: <strong className="text-slate-300">{cert.course}</strong></div>
                        <div>Date: <strong className="text-slate-300">{cert.issueDate}</strong></div>
                        <div className="truncate">Hash: <strong className="text-indigo-400 select-all">{cert.certificateHash}</strong></div>
                        <div className="truncate">IPFS CID: <strong className="text-cyan-400 select-all">{cert.ipfsHash}</strong></div>
                      </div>

                      {/* QR preview */}
                      {cert.qrCode && (
                        <div className="flex items-center space-x-4 pt-2 border-t border-slate-800/30">
                          <img src={cert.qrCode} alt="Security QR" className="w-16 h-16 bg-white rounded-lg p-0.5 border border-slate-800/20" />
                          <div className="space-y-0.5">
                            <div className="text-[10px] font-mono font-bold text-slate-400">MINTED CRYPTOGRAPHIC SIGNATURE</div>
                            <div className="text-[10px] text-slate-500 font-mono break-all">{cert.signature}</div>
                            <a
                              href={cert.qrCode}
                              download={`${cert.studentName}_cert_qr.png`}
                              className="inline-block text-[10px] font-semibold text-indigo-400 hover:underline pt-1"
                            >
                              Download Security QR Image
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          ROLE: STUDENT VIEW
          ========================================== */}
      {user?.role === 'student' && (
        <div className="space-y-6">
          {/* Student Wallet Config */}
          <div className={`p-6 rounded-3xl border flex flex-col md:flex-row justify-between items-start md:items-center gap-6 ${
            darkMode ? 'glass border-slate-800/40' : 'glass-light border-slate-200/40'
          }`}>
            <div className="space-y-2 max-w-xl">
              <div className="flex items-center space-x-2">
                <Layers className="w-5 h-5 text-indigo-400" />
                <h2 className="font-display font-bold text-base">MetaMask Web3 Credentials Pocket</h2>
              </div>
              <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                To claim secure ERC-721 smart badges, bind your decentralised wallet address. Certified achievements are anchored securely onto this public address.
              </p>
            </div>

            <button
              onClick={connectWallet}
              className={`font-semibold text-xs px-5 py-3 rounded-xl transition-all ${
                walletAddress
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/10'
              }`}
            >
              {walletAddress ? `Wallet Anchor: ${walletAddress}` : 'Simulate MetaMask Connection'}
            </button>
          </div>

          {/* Student Certificates list */}
          <div className="space-y-4">
            <h3 className="font-display font-bold text-lg">My Certified Accomplishments</h3>

            {issuedCerts.length === 0 ? (
              <div className={`p-10 rounded-3xl border text-center text-slate-400 text-xs space-y-4 ${
                darkMode ? 'glass border-slate-800/40' : 'glass-light border-slate-200/40'
              }`}>
                <Landmark className="w-8 h-8 mx-auto text-slate-500 animate-pulse" />
                <div>You do not have any registered achievements issued to email <strong>{user?.email}</strong>.</div>
                <p className="max-w-xs mx-auto text-[11px] text-slate-500 leading-relaxed">
                  Sign in as an Institution to issue a test certificate to your email address, or ask the Admin to register your node.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {issuedCerts.map((cert) => (
                  <div key={cert.id} className={`p-6 rounded-3xl border relative overflow-hidden transition-all hover:shadow-lg ${
                    darkMode ? 'glass border-slate-800/40' : 'glass-light border-slate-200/40'
                  }`}>
                    {/* Watermark brand */}
                    <div className="absolute right-4 bottom-4 text-slate-800/10 dark:text-slate-200/5 select-none pointer-events-none">
                      <ShieldCheck className="w-40 h-40" />
                    </div>

                    <div className="space-y-4 relative z-10">
                      {/* Header */}
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest block mb-0.5">
                            {cert.institution}
                          </span>
                          <h4 className="font-display font-bold text-base">{cert.course}</h4>
                        </div>
                        <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded border uppercase tracking-wider ${
                          cert.status === 'active'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-red-500/10 text-red-400 border-red-500/20'
                        }`}>
                          {cert.status}
                        </span>
                      </div>

                      {/* Student performance */}
                      <div className="grid grid-cols-3 gap-2 text-xs border-y border-slate-700/20 py-3 font-mono">
                        <div>
                          <div className="text-slate-400 text-[10px]">RECIPIENT</div>
                          <div className="font-bold text-slate-300 truncate">{cert.studentName}</div>
                        </div>
                        <div>
                          <div className="text-slate-400 text-[10px]">PERFORMANCE</div>
                          <div className="font-bold text-slate-300">{cert.grade}</div>
                        </div>
                        <div>
                          <div className="text-slate-400 text-[10px]">ISSUE DATE</div>
                          <div className="font-bold text-slate-300">{cert.issueDate}</div>
                        </div>
                      </div>

                      {/* Cryptographic properties */}
                      <div className="space-y-2 text-[10px] font-mono text-slate-400 leading-relaxed">
                        <div className="truncate">SHA-256 Hash: <strong className="text-slate-300 select-all">{cert.certificateHash}</strong></div>
                        <div className="truncate">IPFS Link: <a href={cert.fileUrl || `https://ipfs.io/ipfs/${cert.ipfsHash}`} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline select-all">{cert.ipfsHash}</a></div>
                        <div className="truncate">Consensus Tx: <strong className="text-indigo-400 select-all">{cert.txHash}</strong></div>
                      </div>

                      {/* Footer Actions */}
                      <div className="flex items-center justify-between pt-3 border-t border-slate-700/10">
                        {cert.qrCode && (
                          <div className="flex items-center space-x-2">
                            <img src={cert.qrCode} alt="Security QR" className="w-10 h-10 bg-white rounded p-0.5 border" />
                            <span className="text-[9px] font-mono text-slate-400 max-w-[120px] leading-snug">
                              Scan to verify cryptographically
                            </span>
                          </div>
                        )}
                        <a
                          href={cert.qrCode}
                          download={`${cert.studentName}_verification_qr.png`}
                          className="bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-[11px] font-semibold px-4 py-2 rounded-xl transition-all"
                        >
                          Download QR
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==========================================
          ROLE: VERIFIER VIEW
          ========================================== */}
      {user?.role === 'verifier' && (
        <div className={`p-8 rounded-3xl border text-center space-y-4 max-w-xl mx-auto ${
          darkMode ? 'glass border-slate-800/40' : 'glass-light border-slate-200/40'
        }`}>
          <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-full w-14 h-14 flex items-center justify-center mx-auto animate-bounce">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h2 className="font-display font-bold text-lg">Secure Verification Gate</h2>
          <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
            Employers can verify accomplishments instantly using AI text forensic scanners or real-time mobile QR scanners.
          </p>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <button
              onClick={() => setActiveTab('verify-ocr')}
              className="p-4 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 hover:bg-indigo-500/10 text-indigo-400 text-xs font-semibold flex flex-col items-center space-y-2 transition-all"
            >
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <span>AI Forensic Check</span>
            </button>
            <button
              onClick={() => setActiveTab('scan-qr')}
              className="p-4 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 hover:bg-indigo-500/10 text-indigo-400 text-xs font-semibold flex flex-col items-center space-y-2 transition-all"
            >
              <Layers className="w-5 h-5 text-indigo-400" />
              <span>QR Code Scanner</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
