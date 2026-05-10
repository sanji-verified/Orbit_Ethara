import { useState } from 'react';
import { useAuth } from '../hooks/useAuth.js';
import { CheckSquare, Loader2, Eye, EyeOff } from 'lucide-react';

export default function LoginScreen() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'Member' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [msg, setMsg] = useState('');
  const { login, register } = useAuth();

  const validate = () => {
    const e = {};
    if (mode === 'signup' && !form.name.trim()) e.name = 'Name required';
    if (!form.email.includes('@')) e.email = 'Valid email required';
    if (form.password.length < 6) e.password = 'Min 6 characters';
    return e;
  };

  const submit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);
    setErrors({});

    try {
      let res;
      if (mode === 'login') {
        res = await login(form.email, form.password);
      } else {
        res = await register(form.name, form.email, form.password, form.role);
      }

      if (!res.success) {
        setErrors({ password: res.message || 'Something went wrong' });
      }
    } catch (err) {
      setErrors({ password: err.response?.data?.message || 'Network error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center relative overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: 'linear-gradient(#1a302422 1px, transparent 1px), linear-gradient(90deg, #1a302422 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}
      />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-orbit-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 px-4">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2.5 bg-dark-surface border border-dark-border rounded-xl px-5 py-3 mb-6">
            <div className="w-7 h-7 bg-orbit-500 rounded-md flex items-center justify-center">
              <CheckSquare className="w-4 h-4 text-white" />
            </div>
            <span className="font-extrabold text-lg text-dark-text tracking-tight">Orbit</span>
          </div>
          <h1 className="text-3xl font-extrabold text-dark-text tracking-tight mb-2">
            {mode === 'login' ? 'Welcome back' : 'Create account'}
          </h1>
          <p className="text-dark-muted text-sm">
            {mode === 'login' ? 'Sign in to your workspace' : 'Start managing projects today'}
          </p>
        </div>

        {msg && (
          <div className="bg-orbit-500/10 border border-orbit-500/20 rounded-lg px-4 py-3 mb-4 text-orbit-400 text-sm">
            {msg}
          </div>
        )}

        <div className="card space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-semibold text-dark-accent uppercase tracking-wider mb-1.5">Full Name</label>
              <input
                type="text"
                placeholder="Arjun Sharma"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="input w-full"
              />
              {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-dark-accent uppercase tracking-wider mb-1.5">Email</label>
            <input
              type="email"
              placeholder="you@company.com"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              className="input w-full"
            />
            {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-dark-accent uppercase tracking-wider mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                className="input w-full pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-muted hover:text-dark-accent"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
          </div>

          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-semibold text-dark-accent uppercase tracking-wider mb-1.5">Role</label>
              <select
                value={form.role}
                onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                className="input w-full"
              >
                <option value="Member">Member</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
          )}

          <button
            onClick={submit}
            disabled={loading}
            className="btn-primary w-full mt-2"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Please wait...</>
            ) : mode === 'login' ? (
              'Sign In'
            ) : (
              'Create Account'
            )}
          </button>
        </div>

        <p className="text-center mt-5 text-dark-muted text-sm">
          {mode === 'login' ? "No account? " : "Already have one? "}
          <button
            onClick={() => { setMode(m => m === 'login' ? 'signup' : 'login'); setErrors({}); setMsg(''); }}
            className="text-orbit-500 font-semibold hover:underline"
          >
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </button>
        </p>

        <p className="text-center text-[#264535] text-xs mt-3">
          Demo: admin@demo.com / demo123
        </p>
      </div>
    </div>
  );
}
