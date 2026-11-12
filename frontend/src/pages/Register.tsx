import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, Lock, Mail, User as UserIcon, ArrowRight, AlertCircle, Eye, EyeOff, CheckCircle2, ShieldCheck, XCircle } from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../contexts/AuthContext';

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Email format verification (must be valid domain format name@domain.tld)
  const isEmailValid = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z]{2,}$/.test(email.trim());

  // Password requirements checks
  const hasMinLength = password.length >= 8;
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?/~`]/.test(password);
  const hasLetter = /[a-zA-Z]/.test(password);

  const isPasswordStrong = hasMinLength && hasNumber && hasSpecialChar && hasLetter;

  // Password strength score calculation
  const strengthScore = [hasMinLength, hasNumber, hasSpecialChar, hasLetter].filter(Boolean).length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isEmailValid) {
      setError('Please provide a valid verified email address format (e.g., student@university.edu).');
      return;
    }

    if (!isPasswordStrong) {
      setError('Password must contain at least 8 characters, at least 1 number, and at least 1 special character.');
      return;
    }

    setLoading(true);

    try {
      const res = await api.post('/auth/register', {
        email: email.trim().toLowerCase(),
        full_name: fullName.trim(),
        password,
      });

      // Instantly authenticated with returned token
      login(res.data.access_token, res.data.user);
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.response?.data?.detail || err.message || 'Registration failed. Email may already be registered.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7FB] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-emerald-500 flex items-center justify-center mx-auto shadow-lg shadow-blue-500/25">
          <Zap className="w-6 h-6 text-white fill-white" />
        </div>
        <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
          Create Verified Account
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Secure, isolated electricity analytics workspace
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 rounded-2xl sm:px-10">
          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700">Full Name</label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Prem Kumar"
                  className="block w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            {/* Email Address with Live Verification Indicator */}
            <div>
              <div className="flex justify-between items-center">
                <label className="block text-xs font-semibold text-slate-700">Email Address</label>
                {email.length > 3 && (
                  <span className={`text-[11px] font-medium flex items-center gap-1 ${isEmailValid ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {isEmailValid ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        Verified Email Format
                      </>
                    ) : (
                      'Enter valid domain (@...)'
                    )}
                  </span>
                )}
              </div>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@university.edu"
                  className={`block w-full pl-9 pr-3 py-2 border rounded-xl text-sm outline-none transition-colors ${
                    email.length > 3
                      ? isEmailValid
                        ? 'border-emerald-400 focus:ring-2 focus:ring-emerald-500'
                        : 'border-amber-300 focus:ring-2 focus:ring-amber-500'
                      : 'border-slate-200 focus:ring-2 focus:ring-blue-500'
                  }`}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-700">Password</label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password with numbers & symbols"
                  className="block w-full pl-9 pr-10 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Real-time Password Strength Meter */}
              {password.length > 0 && (
                <div className="mt-2 space-y-2">
                  {/* Strength Bar */}
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden flex gap-1">
                    <div className={`h-full flex-1 rounded-full transition-colors ${strengthScore >= 1 ? (strengthScore === 4 ? 'bg-emerald-500' : strengthScore >= 2 ? 'bg-amber-400' : 'bg-rose-400') : 'bg-slate-200'}`} />
                    <div className={`h-full flex-1 rounded-full transition-colors ${strengthScore >= 2 ? (strengthScore === 4 ? 'bg-emerald-500' : 'bg-amber-400') : 'bg-slate-200'}`} />
                    <div className={`h-full flex-1 rounded-full transition-colors ${strengthScore >= 3 ? (strengthScore === 4 ? 'bg-emerald-500' : 'bg-amber-400') : 'bg-slate-200'}`} />
                    <div className={`h-full flex-1 rounded-full transition-colors ${strengthScore === 4 ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                  </div>

                  {/* Requirements Checklist */}
                  <div className="grid grid-cols-2 gap-1.5 text-[11px] pt-1">
                    <div className={`flex items-center gap-1 ${hasMinLength ? 'text-emerald-600 font-medium' : 'text-slate-400'}`}>
                      {hasMinLength ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <div className="w-2.5 h-2.5 rounded-full border border-slate-300" />}
                      <span>8+ Characters</span>
                    </div>

                    <div className={`flex items-center gap-1 ${hasNumber ? 'text-emerald-600 font-medium' : 'text-slate-400'}`}>
                      {hasNumber ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <div className="w-2.5 h-2.5 rounded-full border border-slate-300" />}
                      <span>1+ Number (0-9)</span>
                    </div>

                    <div className={`flex items-center gap-1 ${hasSpecialChar ? 'text-emerald-600 font-medium' : 'text-slate-400'}`}>
                      {hasSpecialChar ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <div className="w-2.5 h-2.5 rounded-full border border-slate-300" />}
                      <span>Special Symbol (!@#$)</span>
                    </div>

                    <div className={`flex items-center gap-1 ${hasLetter ? 'text-emerald-600 font-medium' : 'text-slate-400'}`}>
                      {hasLetter ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <div className="w-2.5 h-2.5 rounded-full border border-slate-300" />}
                      <span>Letters (a-z)</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !isEmailValid || !isPasswordStrong}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-transparent rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{loading ? 'Creating Verified Account...' : 'Register Secure Account'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-slate-500">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-500">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
