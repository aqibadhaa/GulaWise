import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { AboutUs } from './components/AboutUs';
import { Persuasive } from './components/Persuasive';
import { PredictionForm } from './components/PredictionForm';
import { PredictionResultView } from './components/PredictionResultView';
import { Footer } from './components/Footer';
import Login from './Login';
import Dashboard from './Dashboard.tsx';
import { supabase } from './lib/supabase';
import type { User } from '@supabase/supabase-js';
import type { PredictionResult } from './types';

const API_URL = 'https://tsaqibadha-gulawise-model.hf.space';

function App() {
  const [currentPage, setCurrentPage] = useState<'home' | 'login' | 'dashboard'>('home');
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<{ name: string; kota: string; role?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [dashboardTab, setDashboardTab] = useState('Dashboard');

  const [formData, setFormData] = useState({
    age: '', gender: '', ethnicity: '', education: '', income: '',
    employment: '', weight: '', height: '', whr: '',
    sleep: '', screenTime: '', alcohol: '', exercise: '', diet: '',
    smoking: '', familyHistory: '', bloodPressure: '', cardiovascular: '',
  });

  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [userPrediction, setUserPrediction] = useState<PredictionResult | null>(() => {
    const saved = localStorage.getItem('gulawise_prediction');
    return saved ? JSON.parse(saved) : null;
  });

  const updatePrediction = (res: PredictionResult | null) => {
    setUserPrediction(res);
    if (res) {
      localStorage.setItem('gulawise_prediction', JSON.stringify(res));
    } else {
      localStorage.removeItem('gulawise_prediction');
    }
  };

  const fetchUserProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('name, kota, role')
      .eq('id', userId)
      .single();

    if (!error && data) {
      setUserProfile(data);
    }
  };

  const fetchUserPrediction = async (userId: string) => {
    const { data, error } = await supabase
      .from('prediction_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      updatePrediction(data);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserProfile(session.user.id);
        fetchUserPrediction(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserProfile(session.user.id);
        fetchUserPrediction(session.user.id);
      } else {
        setUserProfile(null);
        updatePrediction(null);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setPrediction(null);
    updatePrediction(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setApiError(null);
  };

  const buildPayload = () => {
    const weight = parseFloat(formData.weight);
    const heightCm = parseFloat(formData.height);
    const heightM = heightCm / 100;
    const bmi = weight / (heightM * heightM);
    const waistToHipRatio = parseFloat(formData.whr);
    const g = formData.gender; const eth = formData.ethnicity;
    const edu = formData.education; const inc = formData.income;
    const emp = formData.employment; const smk = formData.smoking;

    return {
      Age: parseFloat(formData.age),
      alcohol_consumption_per_week: parseFloat(formData.alcohol),
      physical_activity_minutes_per_week: parseFloat(formData.exercise),
      diet_score: parseFloat(formData.diet),
      sleep_hours_per_day: parseFloat(formData.sleep),
      screen_time_hours_per_day: parseFloat(formData.screenTime),
      bmi: parseFloat(bmi.toFixed(2)),
      waist_to_hip_ratio: parseFloat(waistToHipRatio.toFixed(3)),
      family_history_diabetes: formData.familyHistory === 'yes' ? 1 : 0,
      hypertension_history: formData.bloodPressure === 'yes' ? 1 : 0,
      cardiovascular_history: formData.cardiovascular === 'yes' ? 1 : 0,
      gender_Male: g === 'Male' ? 1 : 0,
      gender_Other: g === 'Other' ? 1 : 0,
      ethnicity_Black: eth === 'Black' ? 1 : 0,
      ethnicity_Hispanic: eth === 'Hispanic' ? 1 : 0,
      ethnicity_Other: eth === 'Other' ? 1 : 0,
      ethnicity_White: eth === 'White' ? 1 : 0,
      education_level_Highschool: edu === 'Highschool' ? 1 : 0,
      'education_level_No formal': edu === 'No formal' ? 1 : 0,
      education_level_Postgraduate: edu === 'Postgraduate' ? 1 : 0,
      income_level_Low: inc === 'Low' ? 1 : 0,
      'income_level_Lower-Middle': inc === 'Lower-Middle' ? 1 : 0,
      income_level_Middle: inc === 'Middle' ? 1 : 0,
      'income_level_Upper-Middle': inc === 'Upper-Middle' ? 1 : 0,
      employment_status_Retired: emp === 'Retired' ? 1 : 0,
      employment_status_Student: emp === 'Student' ? 1 : 0,
      employment_status_Unemployed: emp === 'Unemployed' ? 1 : 0,
      smoking_status_Former: smk === 'Former' ? 1 : 0,
      smoking_status_Never: smk === 'Never' ? 1 : 0,
    };
  };

  const calculateRisk = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) { setCurrentPage('login'); return; }
    setIsLoading(true); setApiError(null); setPrediction(null);
    try {
      const payload = buildPayload();
      const response = await fetch(`${API_URL}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || `Server error: ${response.status}`);
      }
      const result: PredictionResult = await response.json();
      setPrediction(result);

      // Simpan ke database
      if (user) {
        const { error: saveError } = await supabase
          .from('prediction_history')
          .insert({
            user_id: user.id,
            prediction: result.prediction,
            probability: result.probability,
            probability_percent: result.probability_percent,
            risk_level: result.risk_level,
            risk_color: result.risk_color,
            advice: result.advice
          });

        if (saveError) {
          console.error('Error saving prediction history:', saveError);
        }

        // Tetap set userPrediction agar dashboard terupdate di session ini
        // meskipun ada kendala di database (misal schema mismatch atau RLS)
        updatePrediction(result);

        const pointsAwarded = Math.max(0, 100 - Math.round(result.probability_percent));
        
        // Ambil poin lama
        const { data: currentPoints } = await supabase
          .from('user_points')
          .select('total_points')
          .eq('user_id', user.id)
          .maybeSingle();

        const newTotal = (currentPoints?.total_points || 0) + pointsAwarded;

        const { error: upsertError } = await supabase
          .from('user_points')
          .upsert({
            user_id: user.id,
            total_points: newTotal,
            last_updated: new Date().toISOString()
          }, { onConflict: 'user_id' });

        if (upsertError) {
          console.error('Error updating points:', upsertError);
        }
      }

      setTimeout(() => document.getElementById('result')?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (err: unknown) {
      if (err instanceof TypeError && err.message.includes('fetch')) {
        setApiError('Tidak bisa terhubung ke server. Pastikan FastAPI berjalan di http://localhost:8001');
      } else {
        setApiError(err instanceof Error ? err.message : 'Terjadi kesalahan tidak diketahui.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePredictClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!user) { e.preventDefault(); setCurrentPage('login'); }
  };

  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  const handleCekRisikoClick = () => {
    document.getElementById('predict')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleTrackerClick = () => {
    setDashboardTab('Pelacak Aktifitas');
    if (user) {
      setCurrentPage('dashboard');
    } else {
      setCurrentPage('login');
    }
  };

  if (currentPage === 'login') {
    return (
      <Login
        onBack={() => setCurrentPage('home')}
        onLoginSuccess={() => {
          if (dashboardTab === 'Pelacak Aktifitas') {
            setCurrentPage('dashboard');
          } else {
            setCurrentPage('home');
          }
        }}
      />
    );
  }

  const inputCls = 'w-full bg-white border border-[#d4dcc8] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#4a7c3f]/40 transition text-[#1c2b13]';

  return (
    <div className="min-h-screen bg-[#fff] font-sans text-[#1c2b13] overflow-x-hidden">
      {currentPage !== 'dashboard' && (
        <Navbar
          user={user}
          handleLogout={handleLogout}
          onLoginClick={() => setCurrentPage('login')}
          onPredictClick={handlePredictClick}
          onDashboardClick={(e) => {
            e.preventDefault();
            if (user) {
              setDashboardTab('Dashboard');
              setCurrentPage('dashboard');
            } else {
              setDashboardTab('Dashboard');
              setCurrentPage('login');
            }
          }}
          onHomeClick={(sectionId) => {
            setCurrentPage('home');
            setTimeout(() => {
              if (sectionId) {
                document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
              } else {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }, 100);
          }}
          currentPage={currentPage}
        />
      )}

      {currentPage === 'home' && (
        <>
          <Hero onPredictClick={handlePredictClick} fadeInUp={fadeInUp} />
          <AboutUs
            fadeInUp={fadeInUp}
            onCekRisikoClick={handleCekRisikoClick}
            onTrackerClick={handleTrackerClick}
          />
          <Persuasive onPredictClick={handlePredictClick} fadeInUp={fadeInUp} />
          <PredictionForm
            user={user}
            formData={formData}
            handleInputChange={handleInputChange}
            calculateRisk={calculateRisk}
            isLoading={isLoading}
            apiError={apiError}
            onLoginClick={() => setCurrentPage('login')}
            onDashboardClick={() => setCurrentPage('dashboard')}
            userPrediction={userPrediction}
            fadeInUp={fadeInUp}
            inputCls={inputCls}
          />

          {prediction && user && (
            <div className="max-w-4xl mx-auto px-6 md:px-12 lg:px-24 pb-24">
              <PredictionResultView prediction={prediction} user={user} />
            </div>
          )}
        </>
      )}

      {currentPage === 'dashboard' && user && (
        <Dashboard
          user={user}
          userProfile={userProfile}
          userPrediction={userPrediction}
          handleLogout={handleLogout}
          onBackToHome={() => setCurrentPage('home')}
          initialTab={dashboardTab}
        />
      )}

      <Footer />
    </div>
  );
}

export default App;
