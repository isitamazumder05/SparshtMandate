import React, { useState } from 'react';
import { Lock, Mail, User, Eye, EyeOff, ArrowRight, ShieldCheck, Sparkles, ArrowLeft, AlertCircle } from 'lucide-react';
import { loginUser, signupUser } from '../services/api';
import { User as UserType } from '../types';

interface AuthViewProps {
  onAuthSuccess: (user: UserType) => void;
  onBackToHome: () => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onAuthSuccess, onBackToHome }) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const validateEmail = (val: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMessage('Please enter your email address.');
      return;
    }
    if (!validateEmail(cleanEmail)) {
      setErrorMessage('Please enter a valid email address (e.g. name@domain.com).');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }
    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }

    setIsLoading(true);
    try {
      if (mode === 'signup') {
        const res = await signupUser(cleanEmail, password, fullName.trim());
        onAuthSuccess(res.user);
      } else {
        const res = await loginUser(cleanEmail, password);
        onAuthSuccess(res.user);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUseDemoAccount = () => {
    setEmail('demo@spashtmandate.ai');
    setPassword('SpashtMandate@2026');
    setMode('login');
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center px-4 py-16 relative overflow-hidden bg-[#211611]">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-[#C28B3D]/10 blur-[130px] pointer-events-none" />
      <div className="absolute -bottom-20 right-10 w-[400px] h-[400px] rounded-full bg-[#85543A]/15 blur-[100px] pointer-events-none" />

      {/* Main Auth Container Card */}
      <div className="relative z-10 w-full max-w-md p-8 rounded-3xl bg-[#2B211D]/90 border border-[#C28B3D]/30 shadow-[0_25px_60px_rgba(0,0,0,0.5)] backdrop-blur-xl">
        {/* Back navigation */}
        <button
          onClick={onBackToHome}
          className="inline-flex items-center gap-2 text-xs font-mono text-[#A77E5C] hover:text-[#E8C78E] transition-colors mb-6 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </button>

        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#211611] border border-[#C28B3D]/30 text-[11px] font-mono text-[#E8C78E] mb-3">
            <Sparkles className="w-3 h-3" />
            <span>SpashtMandate AI Security</span>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-black tracking-tight text-[#F5EBDD]">
            {mode === 'login' ? 'Sign In to Workspace' : 'Create Auditor Account'}
          </h2>
          <p className="text-xs text-[#A77E5C] mt-2">
            {mode === 'login'
              ? 'Access real subscription audits, timelines, and mandate reports'
              : 'Join SpashtMandate to begin auditing recurring subscription disclosures'}
          </p>
        </div>

        {/* Mode Toggle Tabs */}
        <div className="flex p-1 rounded-xl bg-[#211611]/80 border border-[#C28B3D]/20 mb-6">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMessage(null);
            }}
            className={`flex-1 py-2.5 rounded-lg text-xs font-bold tracking-wider uppercase transition-all duration-200 cursor-pointer ${
              mode === 'login'
                ? 'bg-gradient-to-r from-[#85543A] to-[#C28B3D] text-[#211611] shadow-md'
                : 'text-[#F5EBDD]/70 hover:text-[#F5EBDD]'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setErrorMessage(null);
            }}
            className={`flex-1 py-2.5 rounded-lg text-xs font-bold tracking-wider uppercase transition-all duration-200 cursor-pointer ${
              mode === 'signup'
                ? 'bg-gradient-to-r from-[#85543A] to-[#C28B3D] text-[#211611] shadow-md'
                : 'text-[#F5EBDD]/70 hover:text-[#F5EBDD]'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs mb-6 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-semibold text-[#E8C78E] uppercase tracking-wider mb-1.5">
                Full Name <span className="text-[#A77E5C] font-normal">(Optional)</span>
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A77E5C]" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Fintech Auditor"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#211611] border border-[#C28B3D]/30 focus:border-[#E8C78E] text-[#F5EBDD] text-sm placeholder:text-[#A77E5C]/60 outline-none transition-all"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#E8C78E] uppercase tracking-wider mb-1.5">
              Email Address <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A77E5C]" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="auditor@spashtmandate.ai"
                required
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#211611] border border-[#C28B3D]/30 focus:border-[#E8C78E] text-[#F5EBDD] text-sm placeholder:text-[#A77E5C]/60 outline-none transition-all font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#E8C78E] uppercase tracking-wider mb-1.5">
              Password <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A77E5C]" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                required
                className="w-full pl-10 pr-11 py-3 rounded-xl bg-[#211611] border border-[#C28B3D]/30 focus:border-[#E8C78E] text-[#F5EBDD] text-sm placeholder:text-[#A77E5C]/60 outline-none transition-all font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#A77E5C] hover:text-[#E8C78E] transition-colors cursor-pointer"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[10px] text-[#A77E5C] mt-1 font-mono">
              Secured with PBKDF2-HMAC-SHA256 password hashing.
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3.5 rounded-xl bg-gradient-to-r from-[#85543A] via-[#C28B3D] to-[#E8C78E] text-[#211611] font-bold text-xs tracking-widest uppercase shadow-[0_10px_25px_rgba(194,139,61,0.35)] hover:shadow-[0_15px_35px_rgba(194,139,61,0.5)] transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-[#211611] border-t-transparent rounded-full animate-spin" />
                Authenticating...
              </span>
            ) : (
              <>
                <span>{mode === 'login' ? 'Enter Workspace' : 'Create Account'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Demo Account Helper for Instant Evaluation */}
        <div className="mt-6 pt-6 border-t border-[#C28B3D]/15 text-center">
          <p className="text-xs text-[#A77E5C] mb-2.5">Evaluating for hackathon judging?</p>
          <button
            type="button"
            onClick={handleUseDemoAccount}
            className="w-full py-2.5 px-4 rounded-xl bg-[#211611] hover:bg-[#211611]/80 border border-[#C28B3D]/30 hover:border-[#C28B3D] text-[#E8C78E] text-xs font-mono transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#C28B3D]" />
            <span>Use Pre-Verified Demo Account</span>
          </button>
        </div>
      </div>
    </div>
  );
};

