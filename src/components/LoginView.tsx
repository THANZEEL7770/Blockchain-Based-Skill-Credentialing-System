/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Mail, Lock, ShieldCheck, Cpu, ArrowRight, UserCheck, AlertCircle, Key } from 'lucide-react';

interface LoginViewProps {
  darkMode: boolean;
  onLoginSuccess: (user: any, token: string) => void;
  setActiveTab: (tab: string) => void;
}

export default function LoginView({ darkMode, onLoginSuccess, setActiveTab }: LoginViewProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 2FA OTP States
  const [showOtp, setShowOtp] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [tempToken, setTempToken] = useState('');
  const [tempUser, setTempUser] = useState<any | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok) {
        if (data.user.twoFactorEnabled) {
          // Trigger OTP overlay
          setTempToken(data.token);
          setTempUser(data.user);
          setShowOtp(true);
        } else {
          onLoginSuccess(data.user, data.token);
          setActiveTab('dashboard');
        }
      } else {
        setError(data.error || 'Invalid credentials.');
      }
    } catch (err: any) {
      setError('Connection to node authentication client failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: otpCode })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onLoginSuccess(tempUser, tempToken);
        setActiveTab('dashboard');
      } else {
        setError(data.error || 'Invalid OTP. Hint: Use standard sandbox bypass code 123456');
      }
    } catch (err) {
      setError('OTP Verification timeout.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      // Simulate OAuth response from Google
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'thanzeel2006@gmail.com',
          name: 'Thanzeel',
          googleToken: 'mock_oauth_tok_google'
        })
      });
      const data = await res.json();
      if (res.ok) {
        onLoginSuccess(data.user, data.token);
        setActiveTab('dashboard');
      } else {
        setError('Google Single Sign-On failed.');
      }
    } catch (err) {
      setError('Oauth proxy error.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      alert('Please enter your email address first.');
      return;
    }
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      alert(data.message || 'Password reset email dispatched.');
    } catch (e) {
      alert('Failed to contact auth server.');
    }
  };

  return (
    <div className="max-w-md mx-auto py-12 px-4 text-left">
      <div className={`p-8 rounded-3xl border shadow-2xl space-y-6 ${
        darkMode ? 'glass border-slate-800/40 text-white' : 'glass-light border-slate-200/40 text-slate-900'
      }`}>
        {/* Title */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-indigo-500/10 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-2">
            <ShieldCheck className="w-6 h-6 animate-pulse" />
          </div>
          <h2 className="font-display font-bold text-xl">Sign In to CertiChain</h2>
          <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Securely query and issue cryptographically binding credentials.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!showOtp ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-mono font-bold text-slate-400">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="e.g., admin@credential.gov"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full px-3 py-2.5 pl-10 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    darkMode ? 'bg-slate-950/40 border-slate-800/80 text-white placeholder-slate-500' : 'bg-slate-50/40 border-slate-200 text-slate-900 placeholder-slate-400'
                  }`}
                />
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-[10px] uppercase font-mono font-bold text-slate-400">Security Password</label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-[10px] font-semibold text-indigo-400 hover:underline"
                >
                  Forgot?
                </button>
              </div>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="Enter secret key..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full px-3 py-2.5 pl-10 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    darkMode ? 'bg-slate-950/40 border-slate-800/80 text-white placeholder-slate-500' : 'bg-slate-50/40 border-slate-200 text-slate-900 placeholder-slate-400'
                  }`}
                />
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-3 rounded-xl transition-all shadow-lg shadow-indigo-600/10 flex items-center justify-center space-x-1.5"
            >
              <span>Authenticate Node</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          /* Two-Factor verification OTP UI */
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-950/40 border border-indigo-500/20 text-xs text-slate-300 space-y-1.5">
              <div className="font-semibold flex items-center space-x-1.5 text-indigo-400">
                <Key className="w-4 h-4" />
                <span>Two-Factor Authentication Active</span>
              </div>
              <p className="text-[10px]">A security code has been emitted. Enter the verification sequence below.</p>
              <div className="font-bold text-[10px] text-emerald-400 font-mono">Sandbox bypass code: 123456</div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-mono font-bold text-slate-400">One-Time OTP Code</label>
              <input
                type="text"
                maxLength={6}
                required
                placeholder="e.g. 123456"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                className="w-full px-4 py-3 text-center text-lg tracking-widest font-mono rounded-xl border border-slate-800/40 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-950/40 text-white"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-3 rounded-xl transition-all"
            >
              Confirm Security Identity
            </button>
          </form>
        )}

        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-slate-700/20"></div>
          <span className="flex-shrink mx-4 text-slate-500 text-[10px] font-mono uppercase tracking-widest">or login with</span>
          <div className="flex-grow border-t border-slate-700/20"></div>
        </div>

        {/* Google SSO */}
        <button
          onClick={handleGoogleLogin}
          type="button"
          className={`w-full py-2.5 border text-xs font-semibold rounded-xl flex items-center justify-center space-x-2 transition-colors ${
            darkMode ? 'bg-slate-950/40 hover:bg-slate-800/60 border-slate-800/60 text-white' : 'bg-slate-50/40 hover:bg-slate-100/60 border-slate-200/60 text-slate-900'
          }`}
        >
          <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
          </svg>
          <span>Google Workspace Access</span>
        </button>

        <div className="text-center">
          <button
            onClick={() => setActiveTab('register')}
            className="text-xs text-indigo-400 font-semibold hover:underline"
          >
            Create an Authorized Account instead
          </button>
        </div>
      </div>
    </div>
  );
}
