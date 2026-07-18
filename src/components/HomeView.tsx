/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ShieldCheck, Cpu, Search, CheckCircle, AlertTriangle, ArrowRight, Award, Zap, Camera, Eye } from 'lucide-react';

interface HomeViewProps {
  darkMode: boolean;
  setActiveTab: (tab: string) => void;
  onQuickVerify: (idOrHash: string) => Promise<any>;
}

export default function HomeView({ darkMode, setActiveTab, onQuickVerify }: HomeViewProps) {
  const [searchVal, setSearchVal] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchVal.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const data = await onQuickVerify(searchVal.trim());
      if (data && data.verified) {
        setResult(data);
      } else {
        setError('Certificate record not found, tampered, or revoked on blockchain.');
      }
    } catch (err: any) {
      setError(err.message || 'Verification process failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-16 py-8">
      {/* Hero Section */}
      <div className="text-center max-w-4xl mx-auto space-y-6 px-4">
        <div className="inline-flex items-center space-x-2 bg-indigo-500/10 text-indigo-400 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider">
          <Cpu className="w-4 h-4 animate-spin text-indigo-400" />
          <span>Ethereum Solidity + AI Audit Shield Active</span>
        </div>
        
        <h1 className="font-display text-4xl sm:text-6xl font-extrabold tracking-tight">
          Immutable Skill Verification{' '}
          <span className="bg-gradient-to-r from-indigo-500 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
            Secured on Blockchain
          </span>
        </h1>
        
        <p className={`text-base sm:text-lg max-w-2xl mx-auto leading-relaxed ${
          darkMode ? 'text-slate-400' : 'text-slate-600'
        }`}>
          A state-of-the-art government-grade portal to issue, store, and verify academic achievements and skills. Eliminating credential fraud with real-time QR scanning and forensic AI-based tampering diagnostics.
        </p>

        {/* Quick Verify Bar */}
        <div className="max-w-xl mx-auto pt-4">
          <form onSubmit={handleSearch} className="relative flex items-center">
            <input
              type="text"
              placeholder="Enter Certificate ID or Blockchain Tx Hash (e.g., cert_001)..."
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              className={`w-full px-5 py-4 pl-12 rounded-2xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono transition-all ${
                darkMode 
                  ? 'glass border-slate-800/60 text-white placeholder-slate-500' 
                  : 'glass-light border-slate-200/60 text-slate-900 placeholder-slate-400'
              }`}
            />
            <Search className="absolute left-4 w-5 h-5 text-slate-400" />
            <button
              type="submit"
              disabled={loading}
              className="absolute right-3 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center space-x-1.5"
            >
              {loading ? 'Mining...' : 'Verify'}
            </button>
          </form>

          {/* Instant Verification Outcomes */}
          {result && (
            <div className={`mt-4 p-5 rounded-2xl border text-left animate-fadeIn ${
              darkMode ? 'glass border-emerald-500/30 text-emerald-300' : 'glass-light border-emerald-200 text-slate-900'
            }`}>
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-semibold text-sm text-emerald-400">Blockchain Certified Authentic</div>
                  <div className={`text-xs font-mono ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    <strong>Student:</strong> {result.certificate.studentName} <br />
                    <strong>Course:</strong> {result.certificate.course} <br />
                    <strong>Issuer:</strong> {result.blockchain.institution || result.certificate.institution} <br />
                    <strong>IPFS:</strong> <span className="text-cyan-400">{result.blockchain.ipfsHash}</span> <br />
                    <strong>Block Number:</strong> #{result.blockchain.blockNumber}
                  </div>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className={`mt-4 p-5 rounded-2xl border text-left animate-fadeIn ${
              darkMode ? 'glass border-red-500/30 text-red-300' : 'glass-light border-red-200 text-slate-900'
            }`}>
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-6 h-6 text-red-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-semibold text-sm text-red-400">Validation Rejected</div>
                  <p className={`text-xs ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>{error}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Network Live Telemetry Stats */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { label: 'Blockchain Certificates', value: '184,204', icon: Award },
            { label: 'Approved Institutions', value: '142', icon: ShieldCheck },
            { label: 'Avg Block Mine Time', value: '1.2s', icon: Zap },
            { label: 'Tampering Alert Score', value: '0.00%', icon: AlertTriangle },
          ].map((stat, i) => (
            <div key={i} className={`p-6 rounded-2xl border transition-all ${
              darkMode ? 'glass border-slate-800/40' : 'glass-light border-slate-200/40'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  {stat.label}
                </span>
                <stat.icon className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="text-2xl font-bold font-display tracking-tight text-indigo-400">
                {stat.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Portal Roles Grid */}
      <div className="max-w-7xl mx-auto px-4 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="font-display text-2xl sm:text-3xl font-bold">Portal Entry Pathways</h2>
          <p className={`text-xs sm:text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Connect to the chain based on your authorized security clearance.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            {
              role: 'Administrator',
              desc: 'Oversee nodes, approve credential-issuing institutions, audits logs, and trace tampering attempts.',
              action: 'Admin Panel',
              tab: 'login'
            },
            {
              role: 'Institution / College',
              desc: 'Issue digital certificates, generate cryptographically signed hashes, and record claims on ledger.',
              action: 'Registrar Panel',
              tab: 'login'
            },
            {
              role: 'Student',
              desc: 'Claim secure accomplishments, connect MetaMask wallet, download certified PDFs, and share signatures.',
              action: 'Student Wallet',
              tab: 'login'
            },
            {
              role: 'Employer / Verifier',
              desc: 'Instant real-time verification using device cameras, QR codes, or forensic document uploading.',
              action: 'Verifier Panel',
              tab: 'verify-ocr'
            },
          ].map((card, idx) => (
            <div
              key={idx}
              className={`p-6 rounded-2xl border flex flex-col justify-between space-y-4 hover:shadow-lg transition-all ${
                darkMode ? 'glass border-slate-800/40' : 'glass-light border-slate-200/40'
              }`}
            >
              <div className="space-y-2">
                <div className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-widest">
                  0{idx + 1}. {card.role}
                </div>
                <p className={`text-xs leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  {card.desc}
                </p>
              </div>
              <button
                onClick={() => setActiveTab(card.tab)}
                className="w-full flex items-center justify-between px-4 py-2.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 font-semibold text-xs rounded-xl transition-all"
              >
                <span>{card.action}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Advanced Capabilities Feature List */}
      <div className={`max-w-7xl mx-auto px-6 py-12 rounded-3xl border shadow-xl ${
        darkMode ? 'glass border-slate-800/30' : 'glass-light border-slate-100/40'
      }`}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="space-y-4 pr-0 lg:pr-8 lg:border-r lg:border-slate-800/40">
            <h3 className="font-display text-xl sm:text-2xl font-bold">Cutting-Edge Credentialing</h3>
            <p className={`text-xs leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Using Ethereum-based smart contracts, we assure that no college degree or industry certification can ever be counterfeited, modified, or backdated.
            </p>
          </div>

          <div className="flex items-start space-x-4">
            <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-400">
              <Camera className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-sm">Real-time WebRTC QR Scanning</h4>
              <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Audit certificates instantly in the field using any standard smartphone camera. The system fetches the exact blockchain blocks for direct validation.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-4">
            <div className="p-3 bg-purple-500/10 rounded-2xl text-purple-400">
              <Eye className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-sm">Forensic Gemini-Powered OCR</h4>
              <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Upload document snapshots directly. Gemini extracts details, scans character geometry, detects mismatched font templates, and measures authenticity scores.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
