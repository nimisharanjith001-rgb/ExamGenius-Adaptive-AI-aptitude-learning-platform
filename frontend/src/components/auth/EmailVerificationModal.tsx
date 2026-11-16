import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, Mail, AlertCircle, ArrowRight, RotateCw, CheckCircle2, KeyRound } from 'lucide-react';
import api from '../../api/client';

interface EmailVerificationModalProps {
  email: string;
  initialCode?: string;
  onVerified: (accessToken: string, user: any) => void;
  onCancel?: () => void;
}

export const EmailVerificationModal: React.FC<EmailVerificationModalProps> = ({
  email,
  initialCode,
  onVerified,
  onCancel,
}) => {
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [displayedCode, setDisplayedCode] = useState<string>(initialCode || '');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(30);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // Cooldown countdown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newDigits = [...digits];
    newDigits[index] = value.slice(-1);
    setDigits(newDigits);
    setError(null);

    // Auto-advance
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pasted)) {
      const newDigits = pasted.split('');
      setDigits(newDigits);
      inputRefs.current[5]?.focus();
    }
  };

  const autoFillCode = () => {
    if (displayedCode && displayedCode.length === 6) {
      setDigits(displayedCode.split(''));
      inputRefs.current[5]?.focus();
    }
  };

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const code = digits.join('');
    if (code.length !== 6) {
      setError('Please enter all 6 digits of your verification code.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await api.post('/auth/verify-code', {
        email: email.trim().toLowerCase(),
        code: code,
      });

      onVerified(res.data.access_token, res.data.user);
    } catch (err: any) {
      console.error('Verification error:', err);
      setError(err.response?.data?.detail || err.message || 'Invalid or expired verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || resendLoading) return;
    setResendLoading(true);
    setError(null);
    setResendSuccess(false);

    try {
      const res = await api.post('/auth/resend-code', {
        email: email.trim().toLowerCase(),
      });
      if (res.data?.verification_code) {
        setDisplayedCode(res.data.verification_code);
      }
      setResendSuccess(true);
      setResendCooldown(45);
      setTimeout(() => setResendSuccess(false), 5000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to resend code. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-900/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-gradient-to-br from-[#101B2D] to-navy-900 text-white text-center relative">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-electric-500 to-emerald-400 p-0.5 mx-auto mb-3 shadow-lg shadow-electric-500/20">
            <div className="w-full h-full bg-navy-900 rounded-[14px] flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
            </div>
          </div>
          <h3 className="text-xl font-bold tracking-tight text-white">
            Security Email Verification
          </h3>
          <p className="text-xs text-slate-300 mt-1 flex items-center justify-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-blue-400" />
            <span>Code dispatched to: <strong>{email}</strong></span>
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-600 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {resendSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
              <span>New 6-digit security code generated and sent!</span>
            </div>
          )}

          {/* Demonstration / Local Inbox Delivery Banner */}
          {displayedCode && (
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-blue-50 to-emerald-50 border border-blue-200/80 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-electric-600 shrink-0" />
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block leading-tight">
                    Security Passcode
                  </span>
                  <span className="text-sm font-mono font-bold text-navy-900 tracking-wider">
                    {displayedCode}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={autoFillCode}
                className="px-2.5 py-1 text-xs font-semibold bg-electric-600 hover:bg-electric-500 text-white rounded-lg shadow-sm transition-colors"
              >
                Auto-Fill
              </button>
            </div>
          )}

          {/* 6 Digit Inputs */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 text-center mb-3">
              Enter the 6-digit one-time verification code:
            </label>
            <div className="flex justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
              {digits.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className={`w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-bold font-mono rounded-xl border transition-all outline-none ${
                    digit
                      ? 'border-electric-500 bg-blue-50/50 text-navy-900 ring-2 ring-blue-500/20'
                      : 'border-slate-200 bg-white text-slate-800 focus:border-electric-500 focus:ring-2 focus:ring-blue-500/20'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="button"
            onClick={() => handleVerify()}
            disabled={loading || digits.join('').length !== 6}
            className="w-full py-3 px-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-electric-600 to-blue-600 hover:from-electric-500 hover:to-blue-500 shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{loading ? 'Verifying Security Code...' : 'Verify & Launch Dashboard'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* Resend & Cancel */}
          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
            <button
              type="button"
              onClick={handleResend}
              disabled={resendCooldown > 0 || resendLoading}
              className={`flex items-center gap-1 font-semibold ${
                resendCooldown > 0
                  ? 'text-slate-400 cursor-not-allowed'
                  : 'text-electric-600 hover:text-electric-700'
              }`}
            >
              <RotateCw className={`w-3.5 h-3.5 ${resendLoading ? 'animate-spin' : ''}`} />
              <span>
                {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend Code'}
              </span>
            </button>

            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="text-slate-500 hover:text-slate-700 font-medium"
              >
                Back to Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
