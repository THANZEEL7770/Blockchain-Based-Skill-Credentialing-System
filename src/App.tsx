/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import HomeView from './components/HomeView';
import ExplorerView from './components/ExplorerView';
import QRScannerView from './components/QRScannerView';
import OcrVerifyView from './components/OcrVerifyView';
import DashboardView from './components/DashboardView';
import LoginView from './components/LoginView';
import RegisterView from './components/RegisterView';
import { ShieldAlert, CheckCircle, RefreshCw, Layers, ShieldCheck, Mail, Info, Key, Settings } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<any | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState<boolean>(true);
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('home');

  // Load state on startup
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('token');
    const savedWallet = localStorage.getItem('walletAddress');
    const savedTheme = localStorage.getItem('darkMode');

    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser));
      setToken(savedToken);
    }
    if (savedWallet) {
      setWalletAddress(savedWallet);
    }
    if (savedTheme !== null) {
      setDarkMode(savedTheme === 'true');
    }
  }, []);

  // Save theme selections
  useEffect(() => {
    localStorage.setItem('darkMode', String(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const handleLoginSuccess = (usr: any, tok: string) => {
    setUser(usr);
    setToken(tok);
    localStorage.setItem('user', JSON.stringify(usr));
    localStorage.setItem('token', tok);
    if (usr.walletAddress) {
      setWalletAddress(usr.walletAddress);
      localStorage.setItem('walletAddress', usr.walletAddress);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    setWalletAddress('');
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('walletAddress');
    setActiveTab('home');
  };

  const connectWallet = () => {
    if (walletAddress) {
      // Disconnect
      setWalletAddress('');
      localStorage.removeItem('walletAddress');
      return;
    }
    // Simulate Metamask prompt and assign a consistent test wallet address
    const mockAddress = user?.walletAddress || '0x9E99fBDeEF7B76f790c0F7fA3e89dA2BCFDeE2B3';
    setWalletAddress(mockAddress);
    localStorage.setItem('walletAddress', mockAddress);
  };

  // Quick verify from search box on home page
  const handleQuickVerify = async (idOrHash: string) => {
    const isId = idOrHash.startsWith('cert_');
    const body = isId ? { id: idOrHash } : { hash: idOrHash };

    const res = await fetch('/api/certificates/verify-id', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      throw new Error('Verification network communication failure.');
    }
    return res.json();
  };

  return (
    <div className={`min-h-screen flex flex-col transition-all duration-500 font-sans ${
      darkMode ? 'mesh-bg-dark text-white' : 'mesh-bg-light text-slate-900'
    }`}>
      {/* Header */}
      <Navbar
        user={user}
        onLogout={handleLogout}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        walletAddress={walletAddress}
        connectWallet={connectWallet}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Container */}
      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-16">
        {activeTab === 'home' && (
          <HomeView
            darkMode={darkMode}
            setActiveTab={setActiveTab}
            onQuickVerify={handleQuickVerify}
          />
        )}

        {activeTab === 'explorer' && (
          <ExplorerView darkMode={darkMode} />
        )}

        {activeTab === 'verify-ocr' && (
          <OcrVerifyView darkMode={darkMode} />
        )}

        {activeTab === 'scan-qr' && (
          <QRScannerView darkMode={darkMode} />
        )}

        {activeTab === 'dashboard' && user && (
          <DashboardView
            user={user}
            darkMode={darkMode}
            walletAddress={walletAddress}
            connectWallet={connectWallet}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'login' && (
          <LoginView
            darkMode={darkMode}
            onLoginSuccess={handleLoginSuccess}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'register' && (
          <RegisterView
            darkMode={darkMode}
            onRegisterSuccess={handleLoginSuccess}
            setActiveTab={setActiveTab}
          />
        )}

        {/* Profile / Settings tab */}
        {activeTab === 'profile' && user && (
          <div className="max-w-2xl mx-auto py-12 px-4 text-left space-y-6">
            <div className={`p-8 rounded-3xl shadow-2xl space-y-6 ${
              darkMode ? 'glass text-white' : 'glass-light text-slate-900'
            }`}>
              <div className="flex items-center space-x-2 pb-4 border-b border-slate-800/30">
                <Settings className="w-6 h-6 text-indigo-400" />
                <h2 className="font-display font-bold text-xl">Security Profile Configuration</h2>
              </div>

              <div className="space-y-4 text-xs font-mono">
                <div className="grid grid-cols-3 py-2 border-b border-slate-800/20">
                  <span className="text-slate-400">Node ID</span>
                  <span className="col-span-2 font-bold">{user.id}</span>
                </div>
                <div className="grid grid-cols-3 py-2 border-b border-slate-800/20">
                  <span className="text-slate-400">Operator Name</span>
                  <span className="col-span-2 font-semibold">{user.name}</span>
                </div>
                <div className="grid grid-cols-3 py-2 border-b border-slate-800/20">
                  <span className="text-slate-400">Authorized Email</span>
                  <span className="col-span-2">{user.email}</span>
                </div>
                <div className="grid grid-cols-3 py-2 border-b border-slate-800/20">
                  <span className="text-slate-400">Security Clearance</span>
                  <span className="col-span-2 uppercase text-indigo-400 font-bold">{user.role}</span>
                </div>
                {user.role === 'institution' && (
                  <div className="grid grid-cols-3 py-2 border-b border-slate-800/20">
                    <span className="text-slate-400">Registrar Name</span>
                    <span className="col-span-2 font-semibold text-cyan-400">{user.institutionName}</span>
                  </div>
                )}
                <div className="grid grid-cols-3 py-2">
                  <span className="text-slate-400">Metamask Anchor</span>
                  <span className="col-span-2 truncate text-slate-300">{walletAddress || 'Disconnected'}</span>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5 space-y-1 text-xs">
                <div className="font-semibold text-indigo-400 flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Two-Factor Authentication (OTP) Simulator</span>
                </div>
                <p className={`text-[11px] leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  Two-factor authentication is configured automatically for institutional nodes to assure valid signature emission. When logging in, enter standard sandbox verification code <strong>123456</strong>.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer / Telemetry status */}
      <footer className={`border-t py-8 text-xs font-mono transition-colors duration-300 ${
        darkMode ? 'bg-slate-950 border-slate-900 text-slate-500' : 'bg-slate-100 border-slate-200 text-slate-500'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <span>© 2026 CertiChain Security Network • Decentralized Credential Authority</span>
          </div>
          <div className="flex items-center space-x-3 text-[10px]">
            <span className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Ledger Node: Online</span>
            </span>
            <span>•</span>
            <span>Blocks: Mined Height #4829107</span>
            <span>•</span>
            <span>Secured via SHA-256</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
