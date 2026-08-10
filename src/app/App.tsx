import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Eye, EyeOff, Mail, Lock, User, ArrowLeft,
  Check, RefreshCw, AlertCircle,
} from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────────────────────────

type Screen =
  | 'login' | 'signup'
  | 'forgot' | 'forgot-sent'
  | 'reset'  | 'reset-success'
  | 'verify'
  | 'login-success' | 'signup-success';

// ─── Design tokens ─────────────────────────────────────────────────────────────

const T = {
  dark:    '#0A0618',
  panel:   '#0F0B1E',
  purple:  '#7C3AED',
  violet:  '#6D28D9',
  pink:    '#EC4899',
  ink:     '#1E0A3C',
  slate:   '#5B4A7A',
  mist:    '#9B8FBF',
  surface: '#F5F3FF',
  border:  'rgba(124, 58, 237, 0.16)',
  error:   '#EF4444',
  success: '#10B981',
  white:   '#FFFFFF',
};

const SERIF = "'Playfair Display', Georgia, serif";
const SANS  = "'Inter', system-ui, -apple-system, sans-serif";

// ─── Password strength ──────────────────────────────────────────────────────────

function getStrength(pw: string) {
  if (!pw) return { level: 0, label: '', color: '' };
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  const n = Math.min(s, 4) as 0 | 1 | 2 | 3 | 4;
  const labels  = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const colors  = ['', '#EF4444', '#F97316', '#EAB308', '#10B981'];
  return { level: n, label: labels[n], color: colors[n] };
}

// ─── Base components ────────────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label style={{ fontFamily: SANS, fontSize: '13px', fontWeight: 500, color: T.slate, letterSpacing: '0.01em', display: 'block', marginBottom: '6px' }}>
      {children}
    </label>
  );
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <motion.p
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ fontFamily: SANS, fontSize: '12px', color: T.error, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '5px' }}
    >
      <AlertCircle size={12} />
      {msg}
    </motion.p>
  );
}

// Shared input styles factory
const baseInput = (focused: boolean, hasError: boolean): React.CSSProperties => ({
  width: '100%',
  height: '50px',
  background: hasError ? '#FFF5F5' : focused ? T.white : T.surface,
  border: `1.5px solid ${hasError ? T.error : focused ? T.purple : T.border}`,
  borderRadius: '12px',
  fontFamily: SANS,
  fontSize: '15px',
  color: T.ink,
  outline: 'none',
  transition: 'all 0.2s ease',
  boxSizing: 'border-box' as const,
  boxShadow: focused ? `0 0 0 4px rgba(124, 58, 237, 0.08)` : 'none',
});

interface FieldProps {
  label: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  icon?: React.ReactNode;
  right?: React.ReactNode;
  disabled?: boolean;
}

function Field({ label, type = 'text', placeholder, value, onChange, error, icon, right, disabled }: FieldProps) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <Label>{label}</Label>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        {icon && (
          <span style={{ position: 'absolute', left: '14px', display: 'flex', color: focused ? T.purple : T.mist, transition: 'color 0.2s', pointerEvents: 'none' }}>
            {icon}
          </span>
        )}
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          disabled={disabled}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{ ...baseInput(focused, !!error), paddingLeft: icon ? '42px' : '16px', paddingRight: right ? '44px' : '16px' }}
        />
        {right && (
          <span style={{ position: 'absolute', right: '14px', display: 'flex', alignItems: 'center' }}>
            {right}
          </span>
        )}
      </div>
      <FieldError msg={error} />
    </div>
  );
}

interface PwdProps {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  showStrength?: boolean;
  disabled?: boolean;
}

function PwdField({ label, placeholder, value, onChange, error, showStrength, disabled }: PwdProps) {
  const [visible, setVisible] = useState(false);
  const [focused, setFocused] = useState(false);
  const str = showStrength ? getStrength(value) : null;

  return (
    <div>
      <Label>{label}</Label>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <span style={{ position: 'absolute', left: '14px', display: 'flex', color: focused ? T.purple : T.mist, transition: 'color 0.2s', pointerEvents: 'none' }}>
          <Lock size={16} />
        </span>
        <input
          type={visible ? 'text' : 'password'}
          placeholder={placeholder || 'Enter your password'}
          value={value}
          disabled={disabled}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{ ...baseInput(focused, !!error), paddingLeft: '42px', paddingRight: '44px' }}
        />
        <button
          type="button"
          onClick={() => setVisible(v => !v)}
          style={{ position: 'absolute', right: '14px', display: 'flex', color: T.mist, background: 'none', border: 'none', cursor: 'pointer', padding: 0, transition: 'color 0.15s' }}
          onMouseEnter={e => (e.currentTarget.style.color = T.purple)}
          onMouseLeave={e => (e.currentTarget.style.color = T.mist)}
        >
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>

      {/* Strength bar */}
      {showStrength && value && str && str.level > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginTop: '8px' }}>
          <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} style={{ flex: 1, height: '3px', borderRadius: '2px', background: i <= str.level ? str.color : '#E8E3F0', transition: 'all 0.3s ease' }} />
            ))}
          </div>
          <p style={{ fontFamily: SANS, fontSize: '11px', color: str.color, fontWeight: 500 }}>{str.label}</p>
        </motion.div>
      )}

      <FieldError msg={error} />
    </div>
  );
}

interface BtnProps {
  children: React.ReactNode;
  onClick?: () => void;
  loading?: boolean;
  success?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'outline' | 'ghost';
}

function Btn({ children, onClick, loading, success, disabled, variant = 'primary' }: BtnProps) {
  const bg = success ? T.success : variant === 'primary' ? T.dark : variant === 'outline' ? T.white : 'transparent';
  const color = variant === 'primary' || success ? T.white : T.ink;
  const border = variant === 'outline' ? `1.5px solid ${T.border}` : '1.5px solid transparent';

  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={!!(loading || disabled)}
      style={{ width: '100%', height: '52px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: bg, color, border, borderRadius: '12px', fontFamily: SANS, fontWeight: 600, fontSize: '15px', cursor: (loading || disabled) ? 'default' : 'pointer', opacity: disabled && !loading ? 0.55 : 1, letterSpacing: '0.01em', transition: 'background 0.2s ease, opacity 0.2s ease' }}
      whileHover={!loading && !disabled ? { opacity: 0.88 } : undefined}
      whileTap={!loading && !disabled ? { scale: 0.98 } : undefined}
    >
      {loading ? (
        <>
          <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.7, ease: 'linear' }} style={{ display: 'flex' }}>
            <RefreshCw size={16} />
          </motion.span>
          Please wait…
        </>
      ) : success ? (
        <><Check size={17} strokeWidth={2.5} /> Done</>
      ) : children}
    </motion.button>
  );
}

function SocialBtn({ provider }: { provider: 'google' | 'github' }) {
  const cfg = {
    google: {
      label: 'Continue with Google',
      bg: T.white,
      color: T.ink,
      border: T.border,
      icon: (
        <svg width="18" height="18" viewBox="0 0 18 18">
          <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908C16.658 14.253 17.64 11.945 17.64 9.2z" fill="#4285F4"/>
          <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
          <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
          <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
        </svg>
      ),
    },
    github: {
      label: 'Continue with GitHub',
      bg: '#24292F',
      color: T.white,
      border: 'transparent',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
        </svg>
      ),
    },
  };
  const c = cfg[provider];
  return (
    <motion.button
      type="button"
      style={{ width: '100%', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', background: c.bg, color: c.color, border: `1.5px solid ${c.border}`, borderRadius: '12px', fontFamily: SANS, fontWeight: 500, fontSize: '14px', cursor: 'pointer', letterSpacing: '0.01em', boxShadow: provider === 'google' ? '0 1px 8px rgba(0,0,0,0.07)' : 'none' }}
      whileHover={{ opacity: 0.88 }}
      whileTap={{ scale: 0.98 }}
    >
      {c.icon}
      {c.label}
    </motion.button>
  );
}

function Checkbox({ label, checked, onChange }: { label: React.ReactNode; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', userSelect: 'none' }}>
      <div
        onClick={() => onChange(!checked)}
        style={{ width: '18px', height: '18px', borderRadius: '5px', border: `1.5px solid ${checked ? T.purple : T.border}`, background: checked ? T.purple : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px', transition: 'all 0.15s ease', cursor: 'pointer' }}
      >
        {checked && <Check size={11} color="white" strokeWidth={3} />}
      </div>
      <span style={{ fontFamily: SANS, fontSize: '13px', color: T.slate, lineHeight: 1.5 }}>{label}</span>
    </label>
  );
}

function Divider() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <div style={{ flex: 1, height: '1px', background: T.border }} />
      <span style={{ fontFamily: SANS, fontSize: '11px', color: T.mist, fontWeight: 500, letterSpacing: '0.08em' }}>OR</span>
      <div style={{ flex: 1, height: '1px', background: T.border }} />
    </div>
  );
}

function BackBtn({ onClick, label = 'Back to login' }: { onClick: () => void; label?: string }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontFamily: SANS, fontSize: '13px', color: T.mist, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
      whileHover={{ color: T.purple }}
      transition={{ duration: 0.15 }}
    >
      <ArrowLeft size={14} />
      {label}
    </motion.button>
  );
}

function LinkBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ color: T.purple, background: 'none', border: 'none', cursor: 'pointer', fontFamily: SANS, fontWeight: 600, fontSize: 'inherit', padding: 0 }}
    >
      {children}
    </button>
  );
}

function ScreenWrap({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}
    >
      {children}
    </motion.div>
  );
}

function Heading({ title, sub }: { title: string; sub: string }) {
  return (
    <div>
      <h1 style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 'clamp(1.7rem, 3.5vw, 2.1rem)', color: T.ink, marginBottom: '8px', lineHeight: 1.15, letterSpacing: '-0.01em' }}>
        {title}
      </h1>
      <p style={{ fontFamily: SANS, fontSize: '15px', color: T.slate, lineHeight: 1.6 }}>{sub}</p>
    </div>
  );
}

function IconCircle({ icon, color = T.purple, bg }: { icon: React.ReactNode; color?: string; bg?: string }) {
  return (
    <motion.div
      initial={{ scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 220, damping: 18 }}
      style={{ width: '72px', height: '72px', borderRadius: '50%', background: bg || `rgba(124, 58, 237, 0.1)`, border: `2px solid ${color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-start' }}
    >
      {icon}
    </motion.div>
  );
}

// ─── Screens ────────────────────────────────────────────────────────────────────

// LOGIN
function LoginScreen({ go }: { go: (s: Screen) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [err, setErr] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const submit = () => {
    const e = { email: '', password: '' };
    if (!email) e.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Enter a valid email address.';
    if (!password) e.password = 'Password is required.';
    else if (password.length < 6) e.password = 'Password must be at least 6 characters.';
    setErr(e);
    if (e.email || e.password) return;
    setLoading(true);
    setTimeout(() => { setLoading(false); go('login-success'); }, 1600);
  };

  return (
    <ScreenWrap>
      <Heading title="Welcome back" sub="Sign in to continue to your workspace." />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Field label="Email address" type="email" placeholder="you@example.com" value={email} onChange={v => { setEmail(v); setErr(e => ({ ...e, email: '' })); }} error={err.email} icon={<Mail size={16} />} />
        <PwdField label="Password" value={password} onChange={v => { setPassword(v); setErr(e => ({ ...e, password: '' })); }} error={err.password} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Checkbox label="Remember me" checked={remember} onChange={setRemember} />
          <button type="button" onClick={() => go('forgot')} style={{ fontFamily: SANS, fontSize: '13px', color: T.purple, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>
            Forgot password?
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <Btn onClick={submit} loading={loading}>Log In</Btn>
        <Divider />
        <SocialBtn provider="google" />
        <SocialBtn provider="github" />
      </div>

      <p style={{ textAlign: 'center', fontFamily: SANS, fontSize: '14px', color: T.mist }}>
        Don&apos;t have an account?{' '}<LinkBtn onClick={() => go('signup')}>Sign up</LinkBtn>
      </p>
    </ScreenWrap>
  );
}

// SIGN UP
function SignupScreen({ go }: { go: (s: Screen) => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pwd, setPwd] = useState('');
  const [confirm, setConfirm] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [err, setErr] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const submit = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Full name is required.';
    if (!email) e.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Enter a valid email address.';
    if (!pwd) e.pwd = 'Password is required.';
    else if (pwd.length < 8) e.pwd = 'Password must be at least 8 characters.';
    if (!confirm) e.confirm = 'Please confirm your password.';
    else if (confirm !== pwd) e.confirm = "Passwords don't match.";
    if (!agreed) e.agreed = 'You must agree to the terms to continue.';
    setErr(e);
    if (Object.keys(e).length) return;
    setLoading(true);
    setTimeout(() => { setLoading(false); go('signup-success'); }, 1800);
  };

  return (
    <ScreenWrap>
      <Heading title="Create your account" sub="Get started — it's free, no credit card required." />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <Field label="Full name" placeholder="Jane Smith" value={name} onChange={v => { setName(v); setErr(e => ({ ...e, name: '' })); }} error={err.name} icon={<User size={16} />} />
        <Field label="Email address" type="email" placeholder="you@example.com" value={email} onChange={v => { setEmail(v); setErr(e => ({ ...e, email: '' })); }} error={err.email} icon={<Mail size={16} />} />
        <PwdField label="Password" placeholder="Create a strong password" value={pwd} onChange={v => { setPwd(v); setErr(e => ({ ...e, pwd: '' })); }} error={err.pwd} showStrength />
        <PwdField label="Confirm password" placeholder="Re-enter your password" value={confirm} onChange={v => { setConfirm(v); setErr(e => ({ ...e, confirm: '' })); }} error={err.confirm} />
        <div>
          <Checkbox
            label={<span>I agree to the{' '}<LinkBtn onClick={() => {}}>Terms of Service</LinkBtn>{' '}and{' '}<LinkBtn onClick={() => {}}>Privacy Policy</LinkBtn></span>}
            checked={agreed}
            onChange={v => { setAgreed(v); setErr(e => ({ ...e, agreed: '' })); }}
          />
          {err.agreed && <p style={{ fontFamily: SANS, fontSize: '12px', color: T.error, marginTop: '5px' }}>{err.agreed}</p>}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <Btn onClick={submit} loading={loading}>Create Account</Btn>
        <Divider />
        <SocialBtn provider="google" />
      </div>

      <p style={{ textAlign: 'center', fontFamily: SANS, fontSize: '14px', color: T.mist }}>
        Already have an account?{' '}<LinkBtn onClick={() => go('login')}>Log in</LinkBtn>
      </p>
    </ScreenWrap>
  );
}

// FORGOT PASSWORD
function ForgotScreen({ go }: { go: (s: Screen) => void }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = () => {
    if (!email) { setError('Email is required.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Enter a valid email address.'); return; }
    setError('');
    setLoading(true);
    setTimeout(() => { setLoading(false); go('forgot-sent'); }, 1400);
  };

  return (
    <ScreenWrap>
      <BackBtn onClick={() => go('login')} />
      <Heading title="Forgot your password?" sub="Enter your email and we'll send you a reset link." />
      <Field label="Email address" type="email" placeholder="you@example.com" value={email} onChange={v => { setEmail(v); setError(''); }} error={error} icon={<Mail size={16} />} />
      <Btn onClick={submit} loading={loading}>Send Reset Link</Btn>
    </ScreenWrap>
  );
}

// FORGOT — EMAIL SENT
function ForgotSentScreen({ go }: { go: (s: Screen) => void }) {
  return (
    <ScreenWrap>
      <IconCircle icon={<Mail size={28} color={T.success} />} color={T.success} bg="rgba(16,185,129,0.1)" />
      <Heading title="Check your email" sub="We've sent password reset instructions to your email. Check your inbox and follow the link." />
      <div style={{ background: T.surface, borderRadius: '12px', padding: '16px 18px', border: `1px solid ${T.border}` }}>
        <p style={{ fontFamily: SANS, fontSize: '13px', color: T.slate }}>
          Didn&apos;t receive it? Check your spam folder, or{' '}<LinkBtn onClick={() => go('forgot')}>try a different email</LinkBtn>.
        </p>
      </div>
      <BackBtn onClick={() => go('login')} />
    </ScreenWrap>
  );
}

// RESET PASSWORD
function ResetScreen({ go }: { go: (s: Screen) => void }) {
  const [pwd, setPwd] = useState('');
  const [confirm, setConfirm] = useState('');
  const [err, setErr] = useState({ pwd: '', confirm: '' });
  const [loading, setLoading] = useState(false);

  const submit = () => {
    const e = { pwd: '', confirm: '' };
    if (!pwd) e.pwd = 'Password is required.';
    else if (pwd.length < 8) e.pwd = 'Password must be at least 8 characters.';
    if (!confirm) e.confirm = 'Please confirm your password.';
    else if (confirm !== pwd) e.confirm = "Passwords don't match.";
    setErr(e);
    if (e.pwd || e.confirm) return;
    setLoading(true);
    setTimeout(() => { setLoading(false); go('reset-success'); }, 1400);
  };

  return (
    <ScreenWrap>
      <Heading title="Set new password" sub="Choose a strong password to protect your account." />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <PwdField label="New password" placeholder="Create a strong password" value={pwd} onChange={v => { setPwd(v); setErr(e => ({ ...e, pwd: '' })); }} error={err.pwd} showStrength />
        <PwdField label="Confirm password" placeholder="Re-enter your new password" value={confirm} onChange={v => { setConfirm(v); setErr(e => ({ ...e, confirm: '' })); }} error={err.confirm} />
      </div>
      <Btn onClick={submit} loading={loading}>Reset Password</Btn>
    </ScreenWrap>
  );
}

// RESET — SUCCESS
function ResetSuccessScreen({ go }: { go: (s: Screen) => void }) {
  return (
    <ScreenWrap>
      <IconCircle icon={<Check size={30} color={T.success} strokeWidth={2.5} />} color={T.success} bg="rgba(16,185,129,0.1)" />
      <Heading title="Password updated" sub="Your password has been successfully changed. You can now log in with your new credentials." />
      <Btn onClick={() => go('login')}>Continue to Login</Btn>
    </ScreenWrap>
  );
}

// EMAIL VERIFICATION
function VerifyScreen({ go }: { go: (s: Screen) => void }) {
  const [cooldown, setCooldown] = useState(0);

  const resend = useCallback(() => {
    setCooldown(30);
    const t = setInterval(() => setCooldown(c => { if (c <= 1) { clearInterval(t); return 0; } return c - 1; }), 1000);
  }, []);

  return (
    <ScreenWrap>
      <motion.div
        initial={{ y: -8, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        style={{ width: '72px', height: '72px', borderRadius: '20px', background: `linear-gradient(135deg, rgba(124,58,237,0.12), rgba(236,72,153,0.12))`, border: `1.5px solid rgba(124,58,237,0.22)`, display: 'flex', alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-start' }}
      >
        <Mail size={30} color={T.purple} />
      </motion.div>

      <Heading title="Verify your email" sub="We've sent a verification link to your email address. Click the link to activate your account." />

      <Btn onClick={resend} disabled={cooldown > 0} variant="outline">
        {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend verification email'}
      </Btn>

      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        <button type="button" onClick={() => go('signup')} style={{ fontFamily: SANS, fontSize: '13px', color: T.slate, background: 'none', border: 'none', cursor: 'pointer' }}>Change email address</button>
        <button type="button" onClick={() => go('login')} style={{ fontFamily: SANS, fontSize: '13px', color: T.mist, background: 'none', border: 'none', cursor: 'pointer' }}>Back to login</button>
      </div>
    </ScreenWrap>
  );
}

// LOGIN — SUCCESS / REDIRECT
function LoginSuccessScreen({ go }: { go: (s: Screen) => void }) {
  useEffect(() => {
    const t = setTimeout(() => go('login'), 4500);
    return () => clearTimeout(t);
  }, [go]);

  return (
    <ScreenWrap>
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 220, damping: 18 }}
        style={{ width: '80px', height: '80px', borderRadius: '50%', background: `linear-gradient(135deg, ${T.purple}, ${T.pink})`, display: 'flex', alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-start', boxShadow: `0 8px 32px rgba(124,58,237,0.3)` }}
      >
        <Check size={36} color="white" strokeWidth={2.5} />
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <h1 style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 'clamp(1.7rem, 3.5vw, 2.1rem)', color: T.ink, marginBottom: '8px' }}>You&apos;re in!</h1>
        <p style={{ fontFamily: SANS, fontSize: '15px', color: T.slate }}>Welcome back. Redirecting you to your dashboard…</p>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ flex: 1, height: '3px', borderRadius: '2px', background: '#EDE9F6', overflow: 'hidden' }}>
          <motion.div
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: 4, ease: 'linear' }}
            style={{ height: '100%', background: `linear-gradient(90deg, ${T.purple}, ${T.pink})`, borderRadius: '2px' }}
          />
        </div>
        <span style={{ fontFamily: SANS, fontSize: '12px', color: T.mist, flexShrink: 0 }}>Redirecting…</span>
      </motion.div>
    </ScreenWrap>
  );
}

// SIGNUP — SUCCESS
function SignupSuccessScreen({ go }: { go: (s: Screen) => void }) {
  const steps = ['Verify your email address', 'Complete your profile', 'Explore your workspace'];
  return (
    <ScreenWrap>
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 220, damping: 18 }}
        style={{ width: '80px', height: '80px', borderRadius: '50%', background: `linear-gradient(135deg, ${T.purple}, ${T.pink})`, display: 'flex', alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-start', boxShadow: `0 8px 32px rgba(124,58,237,0.28)` }}
      >
        <Check size={36} color="white" strokeWidth={2.5} />
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <h1 style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 'clamp(1.7rem, 3.5vw, 2.1rem)', color: T.ink, marginBottom: '8px' }}>Account created!</h1>
        <p style={{ fontFamily: SANS, fontSize: '15px', color: T.slate, lineHeight: 1.6 }}>Welcome aboard! We&apos;ve sent a verification email — check your inbox to activate your account.</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} style={{ background: T.surface, borderRadius: '12px', padding: '18px 20px', border: `1px solid ${T.border}` }}>
        <p style={{ fontFamily: SANS, fontSize: '12px', fontWeight: 600, color: T.mist, letterSpacing: '0.09em', textTransform: 'uppercase', marginBottom: '12px' }}>What&apos;s next</p>
        {steps.map((s, i) => (
          <motion.div key={s} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.45 + i * 0.1 }} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 0' }}>
            <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(124,58,237,0.08)', border: `1.5px solid rgba(124,58,237,0.25)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontFamily: SANS, fontSize: '10px', fontWeight: 700, color: T.purple }}>{i + 1}</span>
            </div>
            <span style={{ fontFamily: SANS, fontSize: '13px', color: T.slate }}>{s}</span>
          </motion.div>
        ))}
      </motion.div>

      <Btn onClick={() => go('verify')}>Verify Email Now</Btn>
    </ScreenWrap>
  );
}

// ─── Left Panel ─────────────────────────────────────────────────────────────────

// Brand mark SVG (three overlapping rings – abstract, inspired by Sweet&Tasty's circular blob)
function BrandMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="11" cy="11" r="9" stroke={T.purple} strokeWidth="2" strokeOpacity="0.95" />
      <circle cx="21" cy="11" r="9" stroke={T.pink}   strokeWidth="2" strokeOpacity="0.8" />
      <circle cx="16" cy="21" r="9" stroke="white"    strokeWidth="2" strokeOpacity="0.4" />
      <circle cx="16" cy="14" r="3.5" fill="rgba(255,255,255,0.75)" />
    </svg>
  );
}

function LeftPanel() {
  return (
    <div style={{ position: 'relative', overflow: 'hidden', background: T.panel, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '44px 48px' }}>
      {/* Layered glow blobs — inspired by Sweet&Tasty's circular blob, abstracted */}
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse 75% 58% at 46% 58%, rgba(109,40,217,0.42) 0%, transparent 65%), radial-gradient(ellipse 48% 38% at 78% 22%, rgba(219,39,119,0.22) 0%, transparent 55%)`, pointerEvents: 'none' }} />

      {/* Dot grid — inspired by Nectar's subtle grid background */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.055) 1px, transparent 1px)', backgroundSize: '30px 30px', pointerEvents: 'none' }} />

      {/* Concentric decorative rings — the abstracted "circular blob" from Sweet&Tasty */}
      <div style={{ position: 'absolute', width: 440, height: 440, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.038)', top: '50%', left: '50%', transform: 'translate(-50%, -46%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', width: 310, height: 310, borderRadius: '50%', border: '1px solid rgba(109,40,217,0.16)', top: '50%', left: '50%', transform: 'translate(-50%, -46%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', width: 190, height: 190, borderRadius: '50%', border: '1.5px solid rgba(109,40,217,0.28)', top: '50%', left: '50%', transform: 'translate(-50%, -46%)', pointerEvents: 'none' }} />

      {/* Small corner accent circles */}
      <div style={{ position: 'absolute', width: 110, height: 110, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.055)', top: '6%', right: '10%', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', width: 55, height: 55, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.07)', bottom: '18%', left: '6%', pointerEvents: 'none' }} />

      {/* Scalloped horizontal accent — inspired by Nectar's scalloped borders (adapted as horizontal element) */}
      <svg style={{ position: 'absolute', bottom: '38%', left: 0, width: '100%', pointerEvents: 'none', opacity: 0.12 }} viewBox="0 0 400 18" preserveAspectRatio="none">
        <path d="M0,9 Q12.5,0 25,9 Q37.5,18 50,9 Q62.5,0 75,9 Q87.5,18 100,9 Q112.5,0 125,9 Q137.5,18 150,9 Q162.5,0 175,9 Q187.5,18 200,9 Q212.5,0 225,9 Q237.5,18 250,9 Q262.5,0 275,9 Q287.5,18 300,9 Q312.5,0 325,9 Q337.5,18 350,9 Q362.5,0 375,9 Q387.5,18 400,9" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" fill="none" />
      </svg>

      {/* Logo */}
      <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', gap: '10px' }}>
        <BrandMark size={28} />
        <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: '18px', color: T.white, letterSpacing: '-0.02em' }}>Nexus</span>
      </div>

      {/* Center content — big abstract mark + headline */}
      <div style={{ position: 'relative', zIndex: 2 }}>
        <BrandMark size={68} />
        <div style={{ marginTop: '28px' }}>
          <h2 style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 'clamp(1.9rem, 3.2vw, 2.8rem)', color: T.white, lineHeight: 1.1, letterSpacing: '-0.025em', marginBottom: '16px' }}>
            Everything you need,<br />in one place.
          </h2>
          <p style={{ fontFamily: SANS, fontSize: '15px', color: 'rgba(255,255,255,0.48)', lineHeight: 1.7, maxWidth: '300px' }}>
            The modern workspace for high-performance teams — secure, fast, and designed for how you actually work.
          </p>
        </div>
      </div>

      {/* Bottom: trust badges — inspired by references' clean bottom elements */}
      <div style={{ position: 'relative', zIndex: 2 }}>
        <div style={{ width: '40px', height: '1px', background: 'rgba(255,255,255,0.15)', marginBottom: '16px' }} />
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          {['🔐 Enterprise security', '⚡ 99.9% uptime', '🌍 Global CDN'].map(f => (
            <span key={f} style={{ fontFamily: SANS, fontSize: '12px', color: 'rgba(255,255,255,0.38)', letterSpacing: '0.01em' }}>{f}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Screen nav strip — demo shortcut (visible above form on desktop) ───────────

const NAV_SCREENS: { label: string; screen: Screen }[] = [
  { label: 'Login',    screen: 'login'    },
  { label: 'Sign up',  screen: 'signup'   },
  { label: 'Forgot',   screen: 'forgot'   },
  { label: 'Reset',    screen: 'reset'    },
  { label: 'Verify',   screen: 'verify'   },
  { label: 'Success ✓', screen: 'login-success' },
];

// ─── Root App ───────────────────────────────────────────────────────────────────

export default function App() {
  const [screen, setScreen] = useState<Screen>('login');

  const go = useCallback((s: Screen) => setScreen(s), []);

  const renderScreen = () => {
    switch (screen) {
      case 'login':          return <LoginScreen go={go} />;
      case 'signup':         return <SignupScreen go={go} />;
      case 'forgot':         return <ForgotScreen go={go} />;
      case 'forgot-sent':    return <ForgotSentScreen go={go} />;
      case 'reset':          return <ResetScreen go={go} />;
      case 'reset-success':  return <ResetSuccessScreen go={go} />;
      case 'verify':         return <VerifyScreen go={go} />;
      case 'login-success':  return <LoginSuccessScreen go={go} />;
      case 'signup-success': return <SignupSuccessScreen go={go} />;
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: T.panel, fontFamily: SANS }}>

      {/* ── LEFT PANEL: hidden on mobile ── */}
      <div className="hidden lg:block" style={{ flex: '0 0 42%', position: 'sticky', top: 0, height: '100vh', maxHeight: '100vh' }}>
        <LeftPanel />
      </div>

      {/* ── RIGHT PANEL ── */}
      <div style={{ flex: 1, background: T.white, display: 'flex', flexDirection: 'column', minHeight: '100vh', overflowY: 'auto' }}>

        {/* Mobile logo header */}
        <div className="flex lg:hidden" style={{ padding: '18px 24px', borderBottom: `1px solid rgba(124,58,237,0.08)`, alignItems: 'center', gap: '10px' }}>
          <BrandMark size={24} />
          <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: '16px', color: T.ink, letterSpacing: '-0.02em' }}>Nexus</span>
        </div>

        {/* Demo screen navigation */}
        <div style={{ padding: '14px 24px 0', display: 'flex', gap: '6px', flexWrap: 'wrap', borderBottom: `1px solid rgba(124,58,237,0.06)`, paddingBottom: '14px' }}>
          {NAV_SCREENS.map(n => (
            <button
              key={n.screen}
              onClick={() => go(n.screen)}
              style={{
                fontFamily: SANS, fontSize: '12px', fontWeight: 500,
                padding: '5px 12px', borderRadius: '100px', cursor: 'pointer',
                background: screen === n.screen ? T.surface : 'transparent',
                color: screen === n.screen ? T.purple : T.mist,
                border: `1px solid ${screen === n.screen ? T.border : 'transparent'}`,
                transition: 'all 0.15s ease',
              }}
            >
              {n.label}
            </button>
          ))}
        </div>

        {/* Form */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 24px' }}>
          <div style={{ width: '100%', maxWidth: '400px' }}>
            <AnimatePresence mode="wait">
              <motion.div key={screen}>
                {renderScreen()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: `1px solid rgba(124,58,237,0.06)`, textAlign: 'center' }}>
          <p style={{ fontFamily: SANS, fontSize: '12px', color: T.mist }}>
            © 2024 Nexus, Inc.
            {' · '}
            <span style={{ color: T.purple, cursor: 'pointer' }}>Privacy</span>
            {' · '}
            <span style={{ color: T.purple, cursor: 'pointer' }}>Terms</span>
          </p>
        </div>
      </div>
    </div>
  );
}
