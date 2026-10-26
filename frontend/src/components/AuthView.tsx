import React, { useState } from 'react';
import { supabase } from '../supabase';
import { Sparkles, ArrowRight, ShieldCheck, Mail, Lock, AlertCircle, CheckCircle2, UserCheck } from 'lucide-react';

interface AuthViewProps {
  onAuthSuccess: () => void;
  onDemoLogin?: () => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onAuthSuccess, onDemoLogin }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: password,
        });

        if (error) {
          if (error.message.includes('already registered')) {
            setErrorMsg('An account with this email already exists. Please log in.');
          } else {
            setErrorMsg(error.message);
          }
          return;
        }

        if (data.session) {
          onAuthSuccess();
        } else {
          setSuccessMsg('Account created successfully! Check your inbox to confirm your email, or continue below.');
          setIsSignUp(false);
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password,
        });

        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            setErrorMsg('Invalid email or password. Please verify your details.');
          } else if (error.message.includes('Email not confirmed')) {
            setErrorMsg('Email address not yet confirmed. Please check your inbox or continue as a Demo User below.');
          } else {
            setErrorMsg(error.message);
          }
          return;
        }

        if (data.session) {
          onAuthSuccess();
        }
      }
    } catch {
      setErrorMsg('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F6FC] flex flex-col justify-between p-6 sm:p-10 selection:bg-[#EDE8F5]">
      {/* Top Brand Bar */}
      <div className="max-w-6xl w-full mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#EDE8F5] border border-purple-200/60 flex items-center justify-center text-[#7C3AED] shadow-xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="font-['Syne',sans-serif] text-2xl font-extrabold tracking-tight text-[#0F0E17]">
              MEMORA
            </span>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#6E6879] bg-[#EDE8F5]/80 px-3.5 py-1.5 rounded-full border border-purple-200/50">
          <ShieldCheck className="w-3.5 h-3.5 text-[#7C3AED]" />
          <span>Supabase Auth Connected</span>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-md w-full mx-auto my-auto py-8">
        <div className="bg-white rounded-[32px] p-8 sm:p-10 border border-purple-100 shadow-[0_20px_60px_-15px_rgba(124,58,237,0.07)] relative overflow-hidden">
          {/* Subtle Top Accent Pill */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EDE8F5] text-[#7C3AED] text-xs font-semibold tracking-wide uppercase mb-3">
              <span>{isSignUp ? 'Get Started' : 'Welcome Back'}</span>
            </div>
            <h1 className="font-['Syne',sans-serif] text-3xl font-extrabold tracking-tight text-[#0F0E17] mb-2">
              {isSignUp ? 'Create your Memora' : 'Access your Memora'}
            </h1>
            <p className="text-sm text-[#6E6879] leading-relaxed">
              {isSignUp
                ? 'Your private AI companion for personal memory, tasks, and document reasoning.'
                : 'Sign in to access your synchronized memories, active tasks, and knowledge base.'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div className="p-3.5 rounded-2xl bg-red-50 border border-red-100 text-red-700 text-xs flex items-start gap-2.5 leading-relaxed">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs flex items-start gap-2.5 leading-relaxed">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
                <span>{successMsg}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#0F0E17] mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#8C849B] absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  className="w-full pl-11 pr-4 py-3 bg-[#F8F6FC] border border-purple-100/90 rounded-2xl text-sm text-[#0F0E17] placeholder-[#A49EAE] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30 focus:border-[#7C3AED] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#0F0E17] mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#8C849B] absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-11 pr-4 py-3 bg-[#F8F6FC] border border-purple-100/90 rounded-2xl text-sm text-[#0F0E17] placeholder-[#A49EAE] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30 focus:border-[#7C3AED] transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 px-6 rounded-2xl bg-[#0F0E17] hover:bg-[#252233] text-white text-sm font-semibold tracking-wide flex items-center justify-center gap-2 transition-all shadow-xs active:scale-[0.99] disabled:opacity-60 cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>{isSignUp ? 'Create Free Account' : 'Sign In to Memora'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Access Option */}
          {onDemoLogin && (
            <div className="mt-3">
              <button
                type="button"
                onClick={onDemoLogin}
                className="w-full py-3 px-4 rounded-2xl bg-[#EDE8F5]/70 hover:bg-[#EDE8F5] border border-purple-200/60 text-[#7C3AED] text-xs font-bold tracking-wide flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <UserCheck className="w-4 h-4" />
                <span>Explore Memora Instant Access (Demo)</span>
              </button>
            </div>
          )}

          {/* Switch Mode */}
          <div className="mt-5 pt-5 border-t border-purple-100/60 text-center">
            <p className="text-xs text-[#6E6879]">
              {isSignUp ? 'Already have an account?' : "Don't have an account yet?"}{' '}
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className="text-[#7C3AED] font-bold hover:underline ml-1 cursor-pointer"
              >
                {isSignUp ? 'Sign In' : 'Create an account'}
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* Footer minimal info */}
      <div className="max-w-6xl w-full mx-auto text-center text-xs text-[#8C849B]">
        <span>Memora AI • Personal Memory, RAG Knowledge & Action Assistant</span>
      </div>
    </div>
  );
};
