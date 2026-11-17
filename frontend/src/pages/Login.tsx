import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, Lock, Mail, ArrowRight, AlertCircle, Eye, EyeOff, ShieldCheck, CheckCircle2, XCircle } from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { EmailVerificationModal } from '../components/auth/EmailVerificationModal';

const GoogleIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </svg>
);

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('demo@powerpulse.ai');
  const [password, setPassword] = useState('DemoPassword123!');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Email verification modal state
  const [verificationModal, setVerificationModal] = useState<{
    isOpen: boolean;
    email: string;
    code?: string;
  }>({
    isOpen: false,
    email: '',
  });

  // Google / Email detection
  const isGoogleAccount = email.trim().toLowerCase().endsWith('@gmail.com') || email.trim().toLowerCase().endsWith('@googlemail.com');

  // Strict Password Strength Requirements: Words (letters), Numbers, Symbols, 8+ characters
  const hasMinLength = password.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?/~`]/.test(password);
  const isPasswordStrong = hasMinLength && hasLetter && hasNumber && hasSpecialChar;
  const strengthScore = [hasMinLength, hasLetter, hasNumber, hasSpecialChar].filter(Boolean).length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Reject weak passwords immediately
    if (!isPasswordStrong) {
      setError('Weak password rejected: Password must contain at least 8 characters, including words (letters), numbers, and special symbols (!@#$%^&*).');
      return;
    }

    setLoading(true);

    try {
      const res = await api.post('/auth/login', {
        email: email.trim().toLowerCase(),
        password: password,
      });

      // If account requires OTP email verification
      if (res.data.requires_verification) {
        setVerificationModal({
          isOpen: true,
          email: email.trim().toLowerCase(),
          code: res.data.verification_code,
        });
        return;
      }

      login(res.data.access_token, res.data.user);
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Login error:', err);
      const detail = err.response?.data?.detail;
      if (typeof detail === 'string') {
        setError(detail);
      } else if (Array.isArray(detail) && detail.length > 0 && detail[0].msg) {
        setError(detail[0].msg);
      } else if (err.message && err.message !== 'Network Error') {
        setError(err.message);
      } else {
        setError('Incorrect email or password. Please verify your credentials or register a new account.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fillQuickDemo = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/auth/login', {
        email: 'demo@powerpulse.ai',
        password: 'DemoPassword123!',
      });
      login(res.data.access_token, res.data.user);
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Demo login error:', err);
      setError(err.response?.data?.detail || err.message || 'Demo login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignInClick = () => {
    setError(null);
    setEmail('user@gmail.com');
    setPassword('');
  };

  const handleVerified = (token: string, user: any) => {
    login(token, user);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#F5F7FB] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* 6-Digit Email Verification Modal if unverified account */}
      {verificationModal.isOpen && (
        <EmailVerificationModal
          email={verificationModal.email}
          initialCode={verificationModal.code}
          onVerified={handleVerified}
          onCancel={() => setVerificationModal({ isOpen: false, email: '' })}
        />
      )}

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-emerald-500 flex items-center justify-center mx-auto shadow-lg shadow-blue-500/25">
          <Zap className="w-6 h-6 text-white fill-white" />
        </div>
        <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
          Sign In to PowerPulse AI
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Smart Electricity Consumption & Anomaly Detector
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 rounded-2xl sm:px-10">
          {/* Continue with Google Button */}
          <button
            type="button"
            onClick={handleGoogleSignInClick}
            className="w-full flex items-center justify-center gap-3 py-2.5 px-4 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <GoogleIcon className="w-4 h-4" />
            <span>Continue with Google / Gmail</span>
          </button>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-slate-400 font-medium">Or sign in with email</span>
            </div>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-semibold text-slate-700">Email Address</label>
                {isGoogleAccount && (
                  <span className="text-[11px] font-medium text-blue-600 flex items-center gap-1">
                    <GoogleIcon className="w-3 h-3" />
                    Google Account
                  </span>
                )}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@gmail.com"
                  className="block w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-semibold text-slate-700">Password</label>
                {password.length > 0 && (
                  <span className={`text-[11px] font-semibold flex items-center gap-1 ${isPasswordStrong ? 'text-emerald-600' : 'text-rose-500'}`}>
                    {isPasswordStrong ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        Strong Password
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3 h-3 text-rose-500" />
                        Weak Password
                      </>
                    )}
                  </span>
                )}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Must include words, numbers & symbols"
                  className={`block w-full pl-9 pr-10 py-2 border rounded-xl text-sm outline-none transition-colors ${
                    password.length > 0
                      ? isPasswordStrong
                        ? 'border-emerald-300 focus:ring-2 focus:ring-emerald-500'
                        : 'border-rose-300 focus:ring-2 focus:ring-rose-500'
                      : 'border-slate-200 focus:ring-2 focus:ring-blue-500'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password Requirements Checklist & Strength Bar */}
              {password.length > 0 && (
                <div className="mt-2 space-y-2">
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden flex gap-1">
                    <div className={`h-full flex-1 rounded-full transition-colors ${strengthScore >= 1 ? (strengthScore === 4 ? 'bg-emerald-500' : strengthScore >= 2 ? 'bg-amber-400' : 'bg-rose-400') : 'bg-slate-200'}`} />
                    <div className={`h-full flex-1 rounded-full transition-colors ${strengthScore >= 2 ? (strengthScore === 4 ? 'bg-emerald-500' : 'bg-amber-400') : 'bg-slate-200'}`} />
                    <div className={`h-full flex-1 rounded-full transition-colors ${strengthScore >= 3 ? (strengthScore === 4 ? 'bg-emerald-500' : 'bg-amber-400') : 'bg-slate-200'}`} />
                    <div className={`h-full flex-1 rounded-full transition-colors ${strengthScore === 4 ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                  </div>

                  <div className="grid grid-cols-2 gap-1 text-[11px] pt-0.5">
                    <div className={`flex items-center gap-1 ${hasMinLength ? 'text-emerald-600 font-medium' : 'text-rose-500'}`}>
                      {hasMinLength ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <XCircle className="w-3 h-3 text-rose-400" />}
                      <span>8+ Characters</span>
                    </div>

                    <div className={`flex items-center gap-1 ${hasLetter ? 'text-emerald-600 font-medium' : 'text-rose-500'}`}>
                      {hasLetter ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <XCircle className="w-3 h-3 text-rose-400" />}
                      <span>Words / Letters (a-z)</span>
                    </div>

                    <div className={`flex items-center gap-1 ${hasNumber ? 'text-emerald-600 font-medium' : 'text-rose-500'}`}>
                      {hasNumber ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <XCircle className="w-3 h-3 text-rose-400" />}
                      <span>Numbers (0-9)</span>
                    </div>

                    <div className={`flex items-center gap-1 ${hasSpecialChar ? 'text-emerald-600 font-medium' : 'text-rose-500'}`}>
                      {hasSpecialChar ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <XCircle className="w-3 h-3 text-rose-400" />}
                      <span>Symbols (!@#$%)</span>
                    </div>
                  </div>

                  {!isPasswordStrong && (
                    <p className="text-[11px] text-rose-500 font-medium mt-1">
                      ⚠️ Weak password not allowed. Password must use words, numbers, and symbols.
                    </p>
                  )}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !isPasswordStrong}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-transparent rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Access Button */}
          <div className="mt-4 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={fillQuickDemo}
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors flex items-center justify-center gap-2"
            >
              <Zap className="w-3.5 h-3.5 text-emerald-600" />
              <span>Instant 1-Click Examiner / Demo Access</span>
            </button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-slate-500">
              Don't have an account?{' '}
              <Link to="/register" className="font-semibold text-blue-600 hover:text-blue-500">
                Register here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
