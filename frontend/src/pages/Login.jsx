import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  GraduationCap,
  Mail,
  Lock,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  RotateCw,
} from 'lucide-react';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // OTP Verification state if unverified user tries to log in
  const [needsVerification, setNeedsVerification] = useState(false);
  const [otp, setOtp] = useState('');
  const [previewOtp, setPreviewOtp] = useState('');
  const [resending, setResending] = useState(false);

  const { login, verifyOtp, resendOtp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Please fill in both email and password.');
      return;
    }

    setSubmitting(true);
    const result = await login(email.trim(), password, rememberMe);
    setSubmitting(false);

    if (result.success) {
      navigate(from, { replace: true });
    } else {
      if (result.needsVerification) {
        setNeedsVerification(true);
        setPreviewOtp(result.previewOtp || '');
      }
      setError(result.error || 'Invalid email or password.');
    }
  };

  const handleOtpVerify = async (e) => {
    e.preventDefault();
    setError('');

    if (!otp.trim() || otp.trim().length !== 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    setSubmitting(true);
    const result = await verifyOtp(email.trim(), otp.trim());
    setSubmitting(false);

    if (result.success) {
      navigate(from, { replace: true });
    } else {
      setError(result.error || 'Invalid or expired OTP code.');
    }
  };

  const handleResend = async () => {
    setResending(true);
    const res = await resendOtp(email.trim());
    setResending(false);
    if (res.success && res.previewOtp) {
      setPreviewOtp(res.previewOtp);
    }
  };

  return (
    <div
      style={{
        minHeight: 'calc(100vh - 68px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '30px 16px',
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '440px',
          padding: '36px 32px',
          borderRadius: 'var(--radius-xl)',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        {!needsVerification ? (
          <>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  margin: '0 auto 16px auto',
                  borderRadius: 'var(--radius-lg)',
                  background: 'linear-gradient(135deg, var(--primary) 0%, #8b5cf6 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  boxShadow: '0 8px 16px rgba(var(--primary-rgb), 0.3)',
                }}
              >
                <GraduationCap size={32} />
              </div>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '6px' }}>
                Welcome to CampusHub
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Sign in to connect with fellow students
              </p>
            </div>

            {/* Demo Credentials Alert */}
            <div
              style={{
                background: 'var(--primary-light)',
                border: '1px solid rgba(var(--primary-rgb), 0.2)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 14px',
                fontSize: '0.82rem',
                color: 'var(--primary)',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Sparkles size={16} flexShrink={0} />
              <div>
                <strong>Quick Demo Account:</strong>
                <br />
                <code>alex@university.edu</code> / <code>password123</code>
              </div>
            </div>

            {error && (
              <div
                style={{
                  background: 'rgba(244, 63, 94, 0.1)',
                  border: '1px solid rgba(244, 63, 94, 0.25)',
                  color: 'var(--accent-rose)',
                  borderRadius: 'var(--radius-md)',
                  padding: '10px 14px',
                  fontSize: '0.86rem',
                  fontWeight: 500,
                  marginBottom: '20px',
                }}
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                  College Email
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@university.edu"
                    style={{ width: '100%', paddingLeft: '40px' }}
                  />
                  <Mail
                    size={18}
                    color="var(--text-light)"
                    style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    style={{ width: '100%', paddingLeft: '40px' }}
                  />
                  <Lock
                    size={18}
                    color="var(--text-light)"
                    style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    style={{ accentColor: 'var(--primary)', cursor: 'pointer' }}
                  />
                  <span>Remember me</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary"
                style={{ width: '100%', padding: '12px' }}
              >
                {submitting ? 'Signing in...' : 'Sign In'}
                <ArrowRight size={16} />
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
              Don't have an account?{' '}
              <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 700 }}>
                Create one
              </Link>
            </div>
          </>
        ) : (
          /* OTP Screen inside Login */
          <div>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  margin: '0 auto 16px auto',
                  borderRadius: 'var(--radius-lg)',
                  background: 'linear-gradient(135deg, var(--accent) 0%, #059669 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  boxShadow: '0 8px 16px rgba(16, 185, 129, 0.3)',
                }}
              >
                <ShieldCheck size={32} />
              </div>
              <h2 style={{ fontSize: '1.45rem', fontWeight: 800, marginBottom: '6px' }}>
                Enter Verification Code
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                Your account requires email verification.
                <br />
                Sent to: <strong>{email}</strong>
              </p>
            </div>

            {previewOtp && (
              <div
                style={{
                  background: 'var(--primary-light)',
                  border: '1px solid rgba(var(--primary-rgb), 0.25)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 16px',
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  color: 'var(--primary)',
                }}
              >
                <Sparkles size={18} flexShrink={0} />
                <div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 600 }}>Verification Code:</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '4px', marginTop: '2px' }}>
                    {previewOtp}
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div
                style={{
                  background: 'rgba(244, 63, 94, 0.1)',
                  border: '1px solid rgba(244, 63, 94, 0.25)',
                  color: 'var(--accent-rose)',
                  borderRadius: 'var(--radius-md)',
                  padding: '10px 14px',
                  fontSize: '0.86rem',
                  fontWeight: 500,
                  marginBottom: '20px',
                }}
              >
                {error}
              </div>
            )}

            <form onSubmit={handleOtpVerify} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="• • • • • •"
                  style={{
                    width: '100%',
                    textAlign: 'center',
                    fontSize: '1.75rem',
                    fontWeight: 800,
                    letterSpacing: '8px',
                    padding: '12px',
                  }}
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={submitting || otp.length !== 6}
                className="btn btn-primary"
                style={{ width: '100%', padding: '12px' }}
              >
                {submitting ? 'Verifying...' : 'Verify & Log In'}
                <ShieldCheck size={18} />
              </button>
            </form>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px', fontSize: '0.85rem' }}>
              <button
                onClick={handleResend}
                disabled={resending}
                className="btn-ghost"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--primary)' }}
              >
                <RotateCw size={14} className={resending ? 'spin' : ''} />
                <span>{resending ? 'Sending...' : 'Resend Code'}</span>
              </button>

              <button
                onClick={() => setNeedsVerification(false)}
                className="btn-ghost"
                style={{ color: 'var(--text-muted)' }}
              >
                Back to Login
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
