import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Mail, Lock, User, MapPin } from 'lucide-react';
import { supabase } from './lib/supabase';
import LogoHalamanLogin from './assets/BigLogo.webp';

interface LoginProps {
  onBack: () => void;
  onLoginSuccess: () => void;
}

const KOTA_INDONESIA = [
  'Aceh', 'Ambon', 'Balikpapan', 'Banda Aceh', 'Bandar Lampung', 'Bandung',
  'Banjarmasin', 'Batam', 'Bekasi', 'Bengkulu', 'Bogor', 'Cilegon',
  'Cimahi', 'Cirebon', 'Denpasar', 'Depok', 'Dumai', 'Gorontalo',
  'Jakarta', 'Jambi', 'Jayapura', 'Kediri', 'Kendari', 'Kupang',
  'Lubuklinggau', 'Madiun', 'Makassar', 'Malang', 'Manado', 'Mataram',
  'Medan', 'Mojokerto', 'Padang', 'Palangkaraya', 'Palembang', 'Palu',
  'Pangkalpinang', 'Pekanbaru', 'Pontianak', 'Probolinggo', 'Samarinda',
  'Semarang', 'Serang', 'Sibolga', 'Singkawang', 'Solok', 'Sorong',
  'Subulussalam', 'Sukabumi', 'Surabaya', 'Surakarta', 'Tangerang',
  'Tarakan', 'Tasikmalaya', 'Ternate', 'Tidore', 'Tual', 'Yogyakarta'
];

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }
};

export default function Login({ onBack, onLoginSuccess }: LoginProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [kota, setKota] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [pendingUserId, setPendingUserId] = useState('');
  const [pendingEmail, setPendingEmail] = useState('');

  // Step 1: Sign Up
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      setError(error.message);
    } else if (data.user && data.user.identities && data.user.identities.length === 0) {
      setError('Email ini sudah terdaftar. Silakan login atau gunakan email lain.');
    } else if (data.user) {
      setPendingUserId(data.user.id);
      setPendingEmail(data.user.email ?? email);
      setStep(2);
    }

    setLoading(false);
  };

  // Step 2: Simpan nama & kota ke tabel users
  const handleCompleteProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await supabase.from('users').insert({
      id: pendingUserId,
      email: pendingEmail,
      name,
      kota,
    });

    if (error) {
      const { error: updateError } = await supabase
        .from('users')
        .update({ name, kota })
        .eq('id', pendingUserId);

      if (updateError) {
        setError(updateError.message);
        setLoading(false);
        return;
      }
    }

    setMessage('Profil berhasil disimpan! Silakan cek email untuk verifikasi, lalu sign in.');
    setTimeout(() => {
      setStep(1);
      setIsSignUp(false);
      setMessage('');
    }, 3000);

    setLoading(false);
  };

  // Sign In
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
    } else {
      onLoginSuccess();
    }

    setLoading(false);
  };

  const switchMode = (toSignUp: boolean) => {
    setIsSignUp(toSignUp);
    setStep(1);
    setError('');
    setMessage('');
    setName('');
    setKota('');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden font-sans">
      <div className="absolute top-0 right-0 -z-10 w-[600px] h-[600px] bg-primary-light rounded-full blur-[100px] opacity-70 translate-x-1/3 -translate-y-1/3" />
      <div className="absolute bottom-0 left-0 -z-10 w-[500px] h-[500px] bg-[#dbeafe] rounded-full blur-[100px] opacity-70 -translate-x-1/4 translate-y-1/4" />

      <motion.div
        className="w-full max-w-md bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-8 md:p-12 shadow-2xl border border-white/50"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {step === 1 && (
          <button onClick={onBack} className="mb-8 flex items-center gap-2 text-text-light hover:text-primary-dark transition text-sm font-medium">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </button>
        )}

        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center">
            <img src={LogoHalamanLogin} alt="Logo" className="w-12 h-12" />
          </div>
        </div>

        <AnimatePresence mode="wait">

          {/* Sign In */}
          {!isSignUp && step === 1 && (
            <motion.div key="signin" variants={fadeInUp} initial="hidden" animate="visible" exit="exit">
              <h2 className="text-3xl font-bold text-center text-text mb-2">Welcome Back</h2>
              <p className="text-center text-text-light mb-8">Sign in to continue to GulaWise</p>

              {error && <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-600 rounded-2xl text-sm text-center">{error}</div>}

              <form className="space-y-5" onSubmit={handleSignIn}>
                <div>
                  <label className="block text-sm font-medium text-text-light mb-2 pl-1">Email Address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Mail className="h-5 w-5 text-gray-400" /></div>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-surface border border-[#689449]/60 rounded-2xl pl-11 pr-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-[#689449]/70 transition shadow-sm"
                      placeholder="you@example.com" required />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-light mb-2 pl-1">Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Lock className="h-5 w-5 text-gray-400" /></div>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-surface border border-[#689449]/60 rounded-2xl pl-11 pr-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-[#689449]/70 transition shadow-sm"
                      placeholder="••••••••" required minLength={6} />
                  </div>
                </div>
                <div className="flex justify-end px-1">
                  <a href="#" className="text-sm font-medium text-[#689449] hover:text-[#aec49f] transition">Forgot password?</a>
                </div>
                <button type="submit" disabled={loading}
                  className="w-full bg-[#689449] hover:bg-[#5a853e] text-white text-lg py-4 rounded-full font-bold transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 mt-6 disabled:opacity-60 disabled:cursor-not-allowed">
                  {loading ? 'Loading...' : 'Sign In'}
                </button>
              </form>

              <div className="mt-8 text-center text-sm text-text-light">
                Don't have an account?{' '}
                <button onClick={() => switchMode(true)} className="font-semibold text-[#689449] hover:text-primary transition">Sign up</button>
              </div>
            </motion.div>
          )}

          {/* Sign Up Step 1 */}
          {isSignUp && step === 1 && (
            <motion.div key="signup" variants={fadeInUp} initial="hidden" animate="visible" exit="exit">
              <h2 className="text-3xl font-bold text-center text-text mb-2">Create Account</h2>
              <p className="text-center text-text-light mb-8">Daftar untuk mulai menggunakan GulaWise</p>

              {error && <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-600 rounded-2xl text-sm text-center">{error}</div>}

              <form className="space-y-5" onSubmit={handleSignUp}>
                <div>
                  <label className="block text-sm font-medium text-text-light mb-2 pl-1">Email Address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Mail className="h-5 w-5 text-gray-400" /></div>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-surface border border-[#689449]/60 rounded-2xl pl-11 pr-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-[#689449]/70 transition shadow-sm"
                      placeholder="you@example.com" required />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-light mb-2 pl-1">Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Lock className="h-5 w-5 text-gray-400" /></div>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-surface border border-[#689449]/60 rounded-2xl pl-11 pr-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-[#689449]/70 transition shadow-sm"
                      placeholder="••••••••" required minLength={6} />
                  </div>
                </div>
                <button type="submit" disabled={loading}
                  className="w-full bg-[#689449] hover:bg-[#5a853e] text-white text-lg py-4 rounded-full font-bold transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 mt-6 disabled:opacity-60 disabled:cursor-not-allowed">
                  {loading ? 'Loading...' : 'Lanjut →'}
                </button>
              </form>

              <div className="mt-8 text-center text-sm text-text-light">
                Already have an account?{' '}
                <button onClick={() => switchMode(false)} className="font-semibold text-[#689449] hover:text-primary transition">Sign In</button>
              </div>
            </motion.div>
          )}

          {/* Sign Up Step 2: Nama & Kota */}
          {step === 2 && (
            <motion.div key="profile" variants={fadeInUp} initial="hidden" animate="visible" exit="exit">
              <h2 className="text-3xl font-bold text-center text-text mb-2">Satu Langkah Lagi!</h2>
              <p className="text-center text-text-light mb-8">Lengkapi profilmu untuk mulai menggunakan GulaWise</p>

              {error && <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-600 rounded-2xl text-sm text-center">{error}</div>}
              {message && <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 text-green-600 rounded-2xl text-sm text-center">{message}</div>}

              <form className="space-y-5" onSubmit={handleCompleteProfile}>
                <div>
                  <label className="block text-sm font-medium text-text-light mb-2 pl-1">Nama Lengkap</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><User className="h-5 w-5 text-gray-400" /></div>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                      className="w-full bg-surface border border-[#689449]/60 rounded-2xl pl-11 pr-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-[#689449]/70 transition shadow-sm"
                      placeholder="Nama kamu" required />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-light mb-2 pl-1">Kota Domisili</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><MapPin className="h-5 w-5 text-gray-400" /></div>
                    <select value={kota} onChange={(e) => setKota(e.target.value)}
                      className="w-full bg-surface border border-[#689449]/60 rounded-2xl pl-11 pr-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-[#689449]/70 transition shadow-sm appearance-none"
                      required>
                      <option value="">Pilih kota kamu</option>
                      {KOTA_INDONESIA.map((k) => (
                        <option key={k} value={k}>{k}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <button type="submit" disabled={loading}
                  className="w-full bg-[#689449] hover:bg-[#5a853e] text-white text-lg py-4 rounded-full font-bold transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 mt-6 disabled:opacity-60 disabled:cursor-not-allowed">
                  {loading ? 'Menyimpan...' : 'Selesai & Daftar'}
                </button>
              </form>
            </motion.div>
          )}

        </AnimatePresence>
      </motion.div>
    </div>
  );
}