import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  GraduationCap,
  Mail,
  Lock,
  User,
  School,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  RotateCw,
  Sparkles,
} from 'lucide-react';

export const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    college: '',
    course: '',
    year: '1',
  });

  // Step 1: Details, Step 2: OTP Verification
  const [step, setStep] = useState(1);
  const [otp, setOtp] = useState('');
  const [previewOtp, setPreviewOtp] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);

  const { register, verifyOtp, resendOtp } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim() || !formData.email.trim() || !formData.password) {
      setError('Please fill in all required fields.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setSubmitting(true);
    const result = await register({
      ...formData,
      year: parseInt(formData.year),
    });
    setSubmitting(false);

    if (result.success && result.needsVerification) {
      setPreviewOtp(result.previewOtp || '');
      setStep(2);
    } else if (!result.success) {
      setError(result.error || 'Registration failed.');
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
    const result = await verifyOtp(formData.email.trim(), otp.trim());
    setSubmitting(false);

    if (result.success) {
      navigate('/', { replace: true });
    } else {
      setError(result.error || 'Invalid or expired OTP code.');
    }
  };

  const handleResend = async () => {
    setResending(true);
    const res = await resendOtp(formData.email.trim());
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
        padding: '36px 16px',
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '520px',
          padding: '36px 32px',
          borderRadius: 'var(--radius-xl)',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        {step === 1 ? (
          <>
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
                Create Student Account
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Join your campus community to share notes, books, and thoughts
              </p>
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

            <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                  Full Name *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    required
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Alex Johnson"
                    style={{ width: '100%', paddingLeft: '40px' }}
                  />
                  <User
                    size={18}
                    color="var(--text-light)"
                    style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                  College Email *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="email"
                    required
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
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
                  Password (min 6 characters) *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="password"
                    required
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                    College / University
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      name="college"
                      value={formData.college}
                      onChange={handleChange}
                      placeholder="State University"
                      style={{ width: '100%', paddingLeft: '38px' }}
                    />
                    <School
                      size={16}
                      color="var(--text-light)"
                      style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                    Course / Major
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      name="course"
                      value={formData.course}
                      onChange={handleChange}
                      placeholder="Computer Science"
                      style={{ width: '100%', paddingLeft: '38px' }}
                    />
                    <BookOpen
                      size={16}
                      color="var(--text-light)"
                      style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                  Current Academic Year
                </label>
                <select
                  name="year"
                  value={formData.year}
                  onChange={handleChange}
                  style={{ width: '100%' }}
                >
                  <option value="1">1st Year (Freshman)</option>
                  <option value="2">2nd Year (Sophomore)</option>
                  <option value="3">3rd Year (Junior)</option>
                  <option value="4">4th Year (Senior)</option>
                  <option value="5">Graduate / Master's</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary"
                style={{ width: '100%', padding: '12px', marginTop: '10px' }}
              >
                {submitting ? 'Generating Verification Code...' : 'Continue to Email Verification'}
                <ArrowRight size={16} />
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
              Already have an account?{' '}
              <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 700 }}>
                Sign in
              </Link>
            </div>
          </>
        ) : (
          /* Step 2: OTP Verification Screen */
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
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '6px' }}>
                Verify College Email
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                We sent a 6-digit verification code to:
                <br />
                <strong>{formData.email}</strong>
              </p>
            </div>

            {/* Quick Demo OTP Preview Alert */}
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
                  <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>Your Email Verification Code:</div>
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
                <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 600, marginBottom: '8px', textAlign: 'center' }}>
                  Enter 6-Digit OTP
                </label>
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
                {submitting ? 'Verifying...' : 'Verify Email & Enter CampusHub'}
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
                onClick={() => setStep(1)}
                className="btn-ghost"
                style={{ color: 'var(--text-muted)' }}
              >
                Edit Email
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
