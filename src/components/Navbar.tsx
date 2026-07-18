/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Shield, Wallet, LogOut, Sun, Moon, User, Activity, Globe } from 'lucide-react';
import { Role } from '../types';

interface NavbarProps {
  user: any | null;
  onLogout: () => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  walletAddress: string;
  connectWallet: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Navbar({
  user,
  onLogout,
  darkMode,
  setDarkMode,
  walletAddress,
  connectWallet,
  activeTab,
  setActiveTab,
}: NavbarProps) {
  return (
    <nav className={`sticky top-0 z-50 w-full transition-all duration-300 border-b ${
      darkMode ? 'glass border-slate-800/40 text-white' : 'glass-light border-slate-200/40 text-slate-900'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('home')}>
            <div className="p-2 bg-gradient-to-tr from-indigo-600 to-cyan-500 rounded-xl text-white neon-glow">
              <Shield className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <span className="font-display font-bold text-lg tracking-tight bg-gradient-to-r from-indigo-500 to-cyan-400 bg-clip-text text-transparent">
                CertiChain
              </span>
              <span className="hidden sm:block text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                Blockchain Credentialing
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            {[
              { id: 'home', label: 'Home' },
              { id: 'explorer', label: 'Blockchain Ledger' },
              { id: 'verify-ocr', label: 'AI Fraud Check' },
              { id: 'scan-qr', label: 'QR Scanner' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-indigo-500/10 text-indigo-500'
                    : 'hover:bg-slate-500/10'
                }`}
              >
                {tab.label}
              </button>
            ))}
            {user && (
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'dashboard'
                    ? 'bg-indigo-500/10 text-indigo-400 font-semibold'
                    : 'hover:bg-slate-500/10 font-medium text-indigo-500'
                }`}
              >
                Dashboard
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            {/* Dark Mode Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-lg transition-colors ${
                darkMode ? 'hover:bg-slate-800 text-yellow-400' : 'hover:bg-slate-100 text-slate-600'
              }`}
              title="Toggle theme"
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Wallet Integration */}
            <button
              onClick={connectWallet}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
                walletAddress
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20'
              }`}
            >
              <Wallet className="w-4 h-4" />
              <span className="hidden sm:inline">
                {walletAddress ? `${walletAddress.substring(0, 6)}...${walletAddress.substring(38)}` : 'Connect Wallet'}
              </span>
            </button>

            {/* User Profile / Access Control */}
            {user ? (
              <div className="flex items-center space-x-3 pl-2 border-l border-slate-700/30">
                <div className="hidden lg:block text-right">
                  <div className="text-xs font-semibold">{user.name}</div>
                  <div className="text-[10px] uppercase font-mono tracking-wider text-indigo-400 bg-indigo-950/40 px-1.5 py-0.5 rounded border border-indigo-800/40 mt-0.5">
                    {user.role}
                  </div>
                </div>
                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => setActiveTab('profile')}
                    className="p-1.5 rounded-lg hover:bg-slate-500/15"
                    title="User Settings"
                  >
                    <User className="w-5 h-5" />
                  </button>
                  <button
                    onClick={onLogout}
                    className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-400 transition-colors"
                    title="Logout"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setActiveTab('login')}
                  className="px-3 py-1.5 text-xs font-medium hover:bg-slate-500/10 rounded-lg transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={() => setActiveTab('register')}
                  className="px-3 py-1.5 text-xs font-medium bg-slate-800 text-white hover:bg-slate-700 dark:bg-slate-200 dark:text-slate-900 dark:hover:bg-white rounded-lg transition-colors"
                >
                  Register
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
