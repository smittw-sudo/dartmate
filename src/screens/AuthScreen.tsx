import { useState } from 'react';
import { motion } from 'framer-motion';
import { Target, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { signIn, signUp } from '../lib/supabase';
import { Button } from '../components/ui/Button';

export function AuthScreen() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async () => {
    if (!email || !password) return;
    setLoading(true);
    setError('');
    setSuccess('');

    if (mode === 'login') {
      const { error } = await signIn(email, password);
      if (error) setError('Inloggen mislukt: ' + error.message);
    } else {
      const { error } = await signUp(email, password);
      if (error) {
        setError('Registreren mislukt: ' + error.message);
      } else {
        setSuccess('Account aangemaakt! Controleer je e-mail om te bevestigen, log dan in.');
        setMode('login');
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <motion.div
        className="w-full max-w-sm"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="bg-accent/10 rounded-3xl p-5 mb-4">
            <Target size={48} className="text-accent" />
          </div>
          <h1 className="text-4xl font-black text-text-primary">DartMate</h1>
          <p className="text-text-secondary mt-1 text-sm">Darts scorekeeping voor thuis</p>
        </div>

        {/* Tab toggle */}
        <div className="flex bg-surface2 rounded-2xl p-1 mb-6">
          {(['login', 'register'] as const).map(m => (
            <button
              key={m}
              onPointerDown={() => { setMode(m); setError(''); setSuccess(''); }}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors touch-manipulation ${mode === m ? 'bg-accent text-black' : 'text-text-secondary'}`}
            >
              {m === 'login' ? 'Inloggen' : 'Registreren'}
            </button>
          ))}
        </div>

        {/* Form */}
        <div className="space-y-3">
          <div className="bg-surface rounded-2xl flex items-center gap-3 px-4">
            <Mail size={18} className="text-text-secondary shrink-0" />
            <input
              type="email"
              placeholder="E-mailadres"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              className="flex-1 bg-transparent py-4 text-text-primary outline-none text-base"
              autoComplete="email"
            />
          </div>

          <div className="bg-surface rounded-2xl flex items-center gap-3 px-4">
            <Lock size={18} className="text-text-secondary shrink-0" />
            <input
              type={showPass ? 'text' : 'password'}
              placeholder="Wachtwoord"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              className="flex-1 bg-transparent py-4 text-text-primary outline-none text-base"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
            <button onPointerDown={() => setShowPass(!showPass)} className="touch-manipulation">
              {showPass ? <EyeOff size={18} className="text-text-secondary" /> : <Eye size={18} className="text-text-secondary" />}
            </button>
          </div>

          {error && (
            <p className="text-danger text-sm px-1">{error}</p>
          )}
          {success && (
            <p className="text-accent text-sm px-1">{success}</p>
          )}

          <Button
            variant="primary"
            size="xl"
            fullWidth
            onPointerDown={handleSubmit}
            disabled={loading || !email || !password}
          >
            {loading ? 'Even wachten...' : mode === 'login' ? 'Inloggen' : 'Account aanmaken'}
          </Button>
        </div>

        {mode === 'register' && (
          <p className="text-text-secondary text-xs text-center mt-4">
            Na registratie ontvang je een bevestigingsmail.
          </p>
        )}
      </motion.div>
    </div>
  );
}
