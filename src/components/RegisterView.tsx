/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Landmark, Mail, Lock, User, Wallet, Sparkles, ArrowRight, AlertCircle } from 'lucide-react';
import { Role } from '../types';

interface RegisterViewProps {
  darkMode: boolean;
  onRegisterSuccess: (user: any, token: string) => void;
  setActiveTab: (tab: string) => void;
}

export default function RegisterView({ darkMode, onRegisterSuccess, setActiveTab }: RegisterViewProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('student');
  const [institutionName, setInstitutionName] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateWallet = () => {
    // Generates a mock Ethereum public address for quick sandbox evaluation
    const hex = Array.from({ length: 40 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
    setWalletAddress('0x' + hex);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !role) return;
    if (role === 'institution' && !institutionName) {
      setError('Please provide your official university or institution name.');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password,
          role,
          institutionName: role === 'institution' ? institutionName : undefined,
          walletAddress: role === 'institution' ? (walletAddress || '0x321658Fdf9D479B3e9086f6d50ffDe4B31479169') : walletAddress
        })
      });
      const data = await res.json();
      if (res.ok) {
        onRegisterSuccess(data.user, data.token);
        setActiveTab('dashboard');
      } else {
        setError(data.error || 'Registration failed.');
      }
    } catch (err) {
      setError('Connection to registrar server timed out.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-8 px-4 text-left">
      <div className={`p-8 rounded-3xl border shadow-2xl space-y-5 ${
        darkMode ? 'glass border-slate-800/40 text-white' : 'glass-light border-slate-200/40 text-slate-900'
      }`}>
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-indigo-500/10 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-2">
            <Landmark className="w-6 h-6" />
          </div>
          <h2 className="font-display font-bold text-xl">Register Security Node</h2>
          <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Register on the decentralized identity credential network.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Role selection */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-mono font-bold text-slate-400">Node Clearance Level (Role)</label>
            <div className="grid grid-cols-3 gap-2">
              {(['student', 'institution', 'verifier'] as Role[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => {
                    setRole(r);
                    setError(null);
                  }}
                  className={`py-2 text-[10px] uppercase font-mono font-bold rounded-lg border text-center transition-all ${
                    role === r
                      ? 'bg-indigo-500/10 border-indigo-500/40 text-indigo-400'
                      : (darkMode ? 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-white' : 'bg-slate-50/40 border-slate-200 text-slate-600')
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase font-mono font-bold text-slate-400">Full Name / Operator</label>
            <div className="relative">
              <input
                type="text"
                required
                placeholder="e.g., Alex Johnson"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`w-full px-3 py-2 pl-10 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  darkMode ? 'bg-slate-950/40 border-slate-800/80 text-white placeholder-slate-500' : 'bg-slate-50/40 border-slate-200 text-slate-900 placeholder-slate-400'
                }`}
              />
              <User className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase font-mono font-bold text-slate-400">Email Address</label>
            <div className="relative">
              <input
                type="email"
                required
                placeholder="e.g., student@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full px-3 py-2 pl-10 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  darkMode ? 'bg-slate-950/40 border-slate-800/80 text-white placeholder-slate-500' : 'bg-slate-50/40 border-slate-200 text-slate-900 placeholder-slate-400'
                }`}
              />
              <Mail className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
            </div>
          </div>

          {/* Conditional Fields: Institution */}
          {role === 'institution' && (
            <div className="space-y-4 p-4 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 animate-fadeIn">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono font-bold text-slate-400">University / Institution Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Stanford University"
                  value={institutionName}
                  onChange={(e) => setInstitutionName(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    darkMode ? 'bg-slate-950/40 border-slate-800/80 text-white placeholder-slate-500' : 'bg-slate-50/40 border-slate-200 text-slate-900 placeholder-slate-400'
                  }`}
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] uppercase font-mono font-bold text-slate-400">Metamask Node Wallet</label>
                  <button
                    type="button"
                    onClick={handleGenerateWallet}
                    className="text-[9px] font-mono uppercase bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded"
                  >
                    Generate Wallet
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="e.g., 0x321658Fdf9D479B3e..."
                    value={walletAddress}
                    onChange={(e) => setWalletAddress(e.target.value)}
                    className={`w-full px-3 py-2 pl-10 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono ${
                      darkMode ? 'bg-slate-950/40 border-slate-800/80 text-white placeholder-slate-500' : 'bg-slate-50/40 border-slate-200 text-slate-900 placeholder-slate-400'
                    }`}
                  />
                  <Wallet className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
                </div>
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[10px] uppercase font-mono font-bold text-slate-400">Security Password</label>
            <div className="relative">
              <input
                type="password"
                required
                placeholder="Choose secret password..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full px-3 py-2 pl-10 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  darkMode ? 'bg-slate-950/40 border-slate-800/80 text-white placeholder-slate-500' : 'bg-slate-50/40 border-slate-200 text-slate-900 placeholder-slate-400'
                }`}
              />
              <Lock className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-3 rounded-xl transition-all shadow-lg shadow-indigo-600/10 flex items-center justify-center space-x-1.5"
          >
            <span>Deploy Authorized Profile</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center">
          <button
            onClick={() => setActiveTab('login')}
            className="text-xs text-indigo-400 font-semibold hover:underline"
          >
            Sign In with existing credentials
          </button>
        </div>
      </div>
    </div>
  );
}
