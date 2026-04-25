import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Moon,
  Activity as ActivityIcon,
  ChevronDown,
  Share2,
  Check,
  Dumbbell,
  Frown,
  Utensils,
  Trophy,
  LogOut,
  LayoutDashboard,
  Activity,
  Stethoscope,
  Smile,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  Menu,
  X
} from 'lucide-react';
import { useEffect } from 'react';
import { supabase } from './lib/supabase';
import { PelacakAktifitas } from './components/PelacakAktifitas';
import { Konsultasi } from './components/Konsultasi';
import AchievementShare from './components/AchievementShare';
import LOGO_SRC from './assets/BigLogo.webp';
import AdBanner from './components/AdBanner';
import type { User } from '@supabase/supabase-js';

import type { PredictionResult } from './types';

interface DashboardProps {
  user: User;
  userProfile: { name: string; kota: string; role?: string } | null;
  userPrediction: PredictionResult | null;
  handleLogout: () => Promise<void>;
  onBackToHome: () => void;
  initialTab?: string;
}

const Dashboard: React.FC<DashboardProps> = ({
  user,
  userProfile,
  userPrediction,
  handleLogout,
  onBackToHome,
  initialTab = 'Dashboard'
}) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const userName = userProfile?.name || user.email?.split('@')[0] || 'User';

  const sidebarItems = [
    { icon: LayoutDashboard, label: 'Dashboard' },
    { icon: Activity, label: 'Pelacak Aktifitas' },
    { icon: Stethoscope, label: 'Konsultasi' },
    { icon: Trophy, label: 'Peringkat & Title' },
  ];

  const [totalPoints, setTotalPoints] = useState(0);
  const [cityLeaderboard, setCityLeaderboard] = useState<any[]>([]);
  const [userRank, setUserRank] = useState<number | string>('-');

  const [dailyLogins, setDailyLogins] = useState<string[]>([]); // Array of dates 'YYYY-MM-DD'
  const [monthlyStats, setMonthlyStats] = useState({
    sleep: 0,
    light: 0,
    heavy: 0,
    stress: 0,
    nutrition: 0,
    count: 0
  });

  useEffect(() => {
    fetchLeaderboardData();
    handleDailyLogin();
    fetchMonthlyStats();
  }, [user.id, userProfile?.kota, activeTab]);

  const fetchMonthlyStats = async () => {
    try {
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toLocaleDateString('en-CA');
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toLocaleDateString('en-CA');

      const { data, error } = await supabase
        .from('daily_activities')
        .select('sleep_hours, light_activity_duration, heavy_activity_duration, stress_level, has_protein, has_karbo, has_serat, has_cairan')
        .eq('user_id', user.id)
        .gte('date', firstDay)
        .lte('date', lastDay);

      if (error) throw error;

      if (data) {
        const totals = data.reduce((acc, curr) => ({
          sleep: acc.sleep + (curr.sleep_hours || 0),
          light: acc.light + (curr.light_activity_duration || 0),
          heavy: acc.heavy + (curr.heavy_activity_duration || 0),
          stress: acc.stress + (curr.stress_level || 0),
          nutrition: acc.nutrition + (
            (curr.has_protein ? 1 : 0) +
            (curr.has_karbo ? 1 : 0) +
            (curr.has_serat ? 1 : 0) +
            (curr.has_cairan ? 1 : 0)
          )
        }), { sleep: 0, light: 0, heavy: 0, stress: 0, nutrition: 0 });

        const count = data.length || 1;
        setMonthlyStats({
          sleep: totals.sleep,
          light: totals.light,
          heavy: totals.heavy,
          stress: totals.stress / count,
          nutrition: (totals.nutrition / (count * 4)) * 10,
          count: data.length
        });
      }
    } catch (err) {
      console.error('Error fetching monthly stats:', err);
    }
  };

  const handleDailyLogin = async () => {
    try {
      const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD

      // 1. Cek apakah sudah login hari ini
      const { data: existing } = await supabase
        .from('daily_logins')
        .select('*')
        .eq('user_id', user.id)
        .eq('login_date', today)
        .maybeSingle();

      if (!existing) {
        // 2. Jika belum, tambah record login harian
        const { error: loginError } = await supabase
          .from('daily_logins')
          .insert({
            user_id: user.id,
            login_date: today,
            points_awarded: 50
          });

        if (!loginError) {
          // 3. Update total poin user (+50)
          const { data: currentPoints } = await supabase
            .from('user_points')
            .select('total_points')
            .eq('user_id', user.id)
            .maybeSingle();

          const newTotal = (currentPoints?.total_points || 0) + 50;

          await supabase
            .from('user_points')
            .upsert({
              user_id: user.id,
              total_points: newTotal,
              last_updated: new Date().toISOString()
            }, { onConflict: 'user_id' });

          // Refresh data poin di UI
          fetchLeaderboardData();
        }
      }

      // 4. Ambil data login seminggu ini untuk UI
      fetchWeeklyLogins();
    } catch (err) {
      console.error('Error in daily login system:', err);
    }
  };

  const fetchWeeklyLogins = async () => {
    // Ambil awal minggu ini (Senin)
    const now = new Date();
    const day = now.getDay(); // 0 (Minggu) - 6 (Sabtu)
    const diff = now.getDate() - (day === 0 ? 6 : day - 1);
    const monday = new Date(now);
    monday.setDate(diff);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    const { data } = await supabase
      .from('daily_logins')
      .select('login_date')
      .eq('user_id', user.id)
      .gte('login_date', monday.toLocaleDateString('en-CA'))
      .lte('login_date', sunday.toLocaleDateString('en-CA'));

    if (data) {
      setDailyLogins(data.map(d => d.login_date));
    }
  };

  const getDayStatus = (dayIndex: number) => {
    // dayIndex 0 = Senin, ..., 6 = Minggu
    const now = new Date();
    const currentDay = now.getDay();
    const adjustedCurrentDay = currentDay === 0 ? 6 : currentDay - 1; // 0=Senin, ..., 6=Minggu

    // Hitung tanggal untuk dayIndex tersebut
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - (day === 0 ? 6 : day - 1) + dayIndex;
    const targetDate = new Date(d.setDate(diff)).toLocaleDateString('en-CA');

    if (dailyLogins.includes(targetDate)) return 'completed';
    if (dayIndex === adjustedCurrentDay) return 'active';
    return 'upcoming';
  };

  const dayNames = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

  const fetchLeaderboardData = async () => {
    try {
      // 1. Ambil poin user sendiri
      const { data: pointsData } = await supabase
        .from('user_points')
        .select('total_points')
        .eq('user_id', user.id)
        .maybeSingle();

      const userPts = pointsData?.total_points || 0;
      setTotalPoints(userPts);

      // 2. Ambil leaderboard kota (Query dari tabel Users)
      if (userProfile?.kota) {
        const { data: lData } = await supabase
          .from('users')
          .select(`
            name,
            kota,
            user_points (total_points)
          `)
          .eq('kota', userProfile.kota)
          .not('user_points', 'is', null) // Hanya yang punya poin
          .limit(10);

        if (lData) {
          // Sort manual di JS karena sort join table di Supabase sering error 400
          const formatted = lData
            .map((item: any) => ({
              name: item.name,
              points: item.user_points?.total_points || 0,
              avatar: `https://i.pravatar.cc/150?u=${item.name}`
            }))
            .sort((a, b) => b.points - a.points)
            .map((item, idx) => ({ ...item, rank: idx + 1 }));

          setCityLeaderboard(formatted);

          // 3. Hitung peringkat user
          const myRank = formatted.findIndex(u => u.name === userProfile?.name);
          setUserRank(myRank !== -1 ? myRank + 1 : '-');
        }
      }
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
    }
  };

  const weeklyData = [
    { day: 'Senin', sleep: 7.5, activity: 2 },
    { day: 'Selasa', sleep: 8, activity: 1.5 },
    { day: 'Rabu', sleep: 6.5, activity: 0.5 },
    { day: 'Kamis', sleep: 7, activity: 2.5 },
    { day: 'Jumat', sleep: 7.2, activity: 1.8 },
    { day: 'Sabtu', sleep: 8.5, activity: 3 },
    { day: 'Minggu', sleep: 8.2, activity: 2.2 },
  ];


  return (
    <div className="flex flex-col min-h-screen bg-[#f8faf7] text-[#1c2b13] font-jakarta">
      {/* New Sticky Header Bar - Spans across Sidebar and Main */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#e8e5d8] flex items-center h-[72px]">
        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="lg:hidden ml-4 p-2 text-[#1c2b13] hover:bg-[#f0f4ec] rounded-xl transition-all"
        >
          <Menu className="w-6 h-6" />
        </button>

        <div
          onClick={onBackToHome}
          className="w-auto lg:w-64 lg:border-r border-[#e8e5d8] px-4 lg:px-8 py-4 flex items-center gap-2 lg:gap-3 cursor-pointer hover:bg-[#f8faf7] transition-colors h-full"
        >
          <img src={LOGO_SRC} alt="GulaWise" className="h-8 w-auto" />
          <span className="text-xl font-bold text-[#1c2b13] tracking-tight hidden sm:inline">
            GulaWise<span className="text-[#1A3C02]">.</span>
          </span>
        </div>

        <div className="flex-1 px-4 lg:px-8 py-4 flex justify-between items-center h-full">
          <div className="flex flex-col text-left">
            <p className="text-[12px] font-dm-sans text-[#a0a0a0] tracking-wider hidden md:block">Selamat datang kembali,</p>
            <p className="text-sm lg:text-lg font-bold font-dm-sans text-[#1c2b13]">{userName}</p>
          </div>
          <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-[#f0f4ec] flex items-center justify-center overflow-hidden border-2 border-white shadow-sm">
            <img src="https://i.pravatar.cc/150?u=thealaa" alt="Profile" className="w-full h-full object-cover" />
          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] lg:hidden"
            />
            
            {/* Drawer */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-[80%] max-w-[300px] bg-white z-[70] shadow-2xl lg:hidden flex flex-col"
            >
              <div className="p-6 flex items-center justify-between border-b border-[#e8e5d8]">
                <div className="flex items-center gap-2">
                  <img src={LOGO_SRC} alt="GulaWise" className="h-7 w-auto" />
                  <span className="font-bold text-lg">GulaWise.</span>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 hover:bg-[#f0f4ec] rounded-xl transition-colors"
                >
                  <X className="w-5 h-5 text-[#a0a0a0]" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                <p className="text-[10px] font-bold text-[#a0a0a0] uppercase tracking-wider mb-4 px-3">Menu</p>
                {sidebarItems.map((item) => (
                  <button
                    key={item.label}
                    onClick={() => {
                      setActiveTab(item.label);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${activeTab === item.label
                      ? 'bg-[#689449] text-white shadow-lg shadow-[#689449]/20'
                      : 'text-[#5c5c5c] hover:bg-[#f0f4ec]'
                      }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="text-sm font-semibold">{item.label}</span>
                  </button>
                ))}

                <div className="pt-8 border-t border-[#f0f0f0] mt-4">
                  <p className="text-[10px] font-bold text-[#a0a0a0] uppercase tracking-wider mb-4 px-3">Statistik Poin</p>
                  <div className="px-3 py-3 rounded-xl bg-[#f8faf7] border border-[#e8e5d8] flex items-center gap-3">
                    <Trophy className="w-5 h-5 text-[#689449]" />
                    <div className="flex flex-col items-start">
                      <span className="text-[10px] font-bold text-[#a0a0a0]">Poin Kamu</span>
                      <span className="text-sm font-bold text-[#1c2b13]">{totalPoints} Pts</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-[#e8e5d8]">
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 border border-red-100 rounded-xl text-red-500 hover:bg-red-50 transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm font-bold">Keluar Akun</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-[#e8e5d8] flex flex-col sticky top-[65px] h-[calc(100vh-65px)] hidden lg:flex">
          <div className="p-6 flex flex-col h-full">


            <nav className="flex-1 space-y-1">
              <p className="text-[10px] font-bold text-[#a0a0a0] uppercase tracking-wider mb-4 px-3">Menu</p>
              {sidebarItems.map((item) => (
                <button
                  key={item.label}
                  onClick={() => setActiveTab(item.label)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${activeTab === item.label
                    ? 'bg-[#689449] text-white shadow-lg shadow-[#689449]/20'
                    : 'text-[#5c5c5c] hover:bg-[#f0f4ec]'
                    }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="text-sm font-semibold">{item.label}</span>
                </button>
              ))}

              <div className="pt-8">
                <p className="text-[10px] font-bold text-[#a0a0a0] uppercase tracking-wider mb-4 px-3">Update Your Data</p>
                <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[#5c5c5c] hover:bg-[#f0f4ec] transition-all">
                  <Trophy className="w-5 h-5 text-[#689449]" />
                  <div className="flex flex-col items-start">
                    <span className="text-[10px] font-bold text-[#a0a0a0]">Poin Kamu</span>
                    <span className="text-sm font-bold text-[#1c2b13]">{totalPoints} Pts</span>
                  </div>
                </button>
              </div>
            </nav>

            <button
              onClick={handleLogout}
              className="mt-auto flex items-center gap-3 px-4 py-3 border border-[#d4dcc8] rounded-full text-[#5c5c5c] hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all group"
            >
              <LogOut className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              <span className="text-sm font-bold">Keluar Akun</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-8">




          <section className={`${activeTab === 'Konsultasi' ? 'block' : 'grid grid-cols-1 xl:grid-cols-3 gap-6'}`}>
            {/* Left Column: Stat Cards & Chart / Other Views */}
            <div className={`${activeTab === 'Konsultasi' ? 'w-full' : 'xl:col-span-2 space-y-6'}`}>
              {activeTab === 'Dashboard' ? (
                <>
                  <h2 className="text-xl font-bold mb-4">
                    {new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Waktu Tidur Card */}
                    <div className="bg-white p-7 rounded-[2.5rem] border border-[#e8e5d8] shadow-sm flex flex-col gap-5">
                      <div className="flex justify-between items-center">
                        <h3 className="text-xl font-bold text-[#1c2b13]">Waktu Tidur</h3>
                        <Moon className="w-6 h-6 text-[#1c2b13] fill-[#1c2b13]" />
                      </div>
                      <div className="h-[1px] w-full bg-[#f0f0f0]" />
                      <div className="bg-[#f0f4ec] px-4 py-2 rounded-xl flex items-center gap-2 w-fit">
                        <ThumbsUp className="w-4 h-4 text-[#689449]" />
                        <span className="text-[11px] font-medium text-[#689449]">Pola tidurmu makin baik dari bulan lalu</span>
                      </div>
                      <div className="bg-white p-6 rounded-[2rem] border border-[#f0f0f0] shadow-sm flex items-center justify-between">
                        <div className="flex items-baseline gap-1">
                          <span className="text-5xl font-bold tracking-tighter text-[#1c2b13]">{Math.round(monthlyStats.sleep)}j</span>
                        </div>
                        <p className="text-[11px] text-[#808080] font-medium leading-tight max-w-[100px]">
                          Total waktu tidur kamu bulan ini
                        </p>
                      </div>
                    </div>

                    {/* Aktifitas Fisik Card */}
                    <div className="bg-white p-7 rounded-[2.5rem] border border-[#e8e5d8] shadow-sm flex flex-col gap-5">
                      <div className="flex justify-between items-center">
                        <h3 className="text-xl font-bold text-[#1c2b13]">Aktifitas Fisik</h3>
                        <Dumbbell className="w-6 h-6 text-[#1c2b13]" />
                      </div>
                      <div className="h-[1px] w-full bg-[#f0f0f0]" />
                      <div className="bg-[#fcf2f2] px-4 py-2 rounded-xl flex items-center gap-2 w-fit">
                        <ThumbsDown className="w-4 h-4 text-[#e05e5e]" />
                        <span className="text-[11px] font-medium text-[#e05e5e]">Aktivitas fisikmu menurun dari bulan lalu</span>
                      </div>
                      <div className="bg-white p-6 rounded-[2rem] border border-[#f0f0f0] shadow-sm flex items-center justify-between">
                        <div className="flex items-baseline gap-1">
                          <span className="text-5xl font-bold tracking-tighter text-[#1c2b13]">{Math.round(monthlyStats.light + monthlyStats.heavy)}m</span>
                        </div>
                        <p className="text-[11px] text-[#808080] font-medium leading-tight max-w-[100px]">
                          Total waktu aktifitas fisik kamu bulan ini
                        </p>
                      </div>
                    </div>

                    {/* Tingkat Stress Card */}
                    <div className="bg-white p-7 rounded-[2.5rem] border border-[#e8e5d8] shadow-sm flex flex-col gap-5">
                      <div className="flex justify-between items-center">
                        <h3 className="text-xl font-bold text-[#1c2b13]">Tingkat Stress</h3>
                        <Frown className="w-6 h-6 text-[#1c2b13]" />
                      </div>
                      <div className="h-[1px] w-full bg-[#f0f0f0]" />
                      <div className="bg-[#f0f4f8] px-4 py-2 rounded-xl flex items-center gap-2 w-fit">
                        <Smile className="w-4 h-4 text-[#407bb6]" />
                        <span className="text-[11px] font-medium text-[#407bb6]">Tingkat stresmu tetap stabil dari bulan lalu</span>
                      </div>
                      <div className="bg-white p-6 rounded-[2rem] border border-[#f0f0f0] shadow-sm flex items-center justify-between">
                        <div className="flex items-baseline gap-1">
                          <span className="text-5xl font-bold tracking-tighter text-[#1c2b13]">{monthlyStats.stress.toFixed(1)}/10</span>
                        </div>
                        <p className="text-[11px] text-[#808080] font-medium leading-tight max-w-[100px]">
                          Rata-rata tingkat stres kamu bulan ini
                        </p>
                      </div>
                    </div>

                    {/* Gizi Makanan Card */}
                    <div className="bg-white p-7 rounded-[2.5rem] border border-[#e8e5d8] shadow-sm flex flex-col gap-5">
                      <div className="flex justify-between items-center">
                        <h3 className="text-xl font-bold text-[#1c2b13]">Gizi Makanan</h3>
                        <Utensils className="w-6 h-6 text-[#1c2b13]" />
                      </div>
                      <div className="h-[1px] w-full bg-[#f0f0f0]" />
                      <div className="bg-[#fcf2f2] px-4 py-2 rounded-xl flex items-center gap-2 w-fit">
                        <AlertCircle className="w-4 h-4 text-[#e05e5e]" />
                        <span className="text-[11px] font-medium text-[#e05e5e]">Gizi kamu kurang seimbang dari bulan lalu</span>
                      </div>
                      <div className="bg-white p-6 rounded-[2rem] border border-[#f0f0f0] shadow-sm flex items-center justify-between">
                        <div className="flex items-baseline gap-1">
                          <span className="text-5xl font-bold tracking-tighter text-[#1c2b13]">{monthlyStats.nutrition.toFixed(1)}/10</span>
                        </div>
                        <p className="text-[11px] text-[#808080] font-medium leading-tight max-w-[100px]">
                          Keseimbangan asupan gizi harian kamu
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Weekly Recap Chart */}
                  <div className="bg-white p-6 rounded-[2rem] border border-[#e8e5d8] shadow-sm">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
                      <div>
                        <h3 className="font-bold text-lg">Aktivitas Mingguan Recap</h3>
                        <p className="text-xs text-[#808080]">Pantau pola tidur dan aktivitasmu setiap hari</p>
                      </div>
                      <button className="flex items-center gap-2 px-4 py-2 bg-[#f8faf7] border border-[#e8e5d8] rounded-full text-xs font-bold">
                        Minggu Pertama <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center gap-6 mb-8 text-[10px] font-bold uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-[#689449]" />
                        <span>Tidur</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-[#9c5c5c]" />
                        <span>Aktifitas Fisik</span>
                      </div>
                    </div>

                    <div className="relative h-64 w-full flex items-end justify-between gap-2 px-2">
                      {/* Horizontal grid lines */}
                      {[0, 2, 4, 6, 8].reverse().map((val) => (
                        <div key={val} className="absolute left-0 right-0 border-t border-dashed border-[#e8e5d8]" style={{ bottom: `${(val / 8) * 100}%` }}>
                          <span className="absolute -left-6 -top-2 text-[10px] font-bold text-[#a0a0a0]">{val}j</span>
                        </div>
                      ))}

                      {weeklyData.map((d) => (
                        <div key={d.day} className="flex-1 flex flex-col items-center group relative">
                          <div className="flex items-end gap-1.5 w-full justify-center">
                            <motion.div
                              initial={{ height: 0 }}
                              animate={{ height: `${(d.sleep / 8) * 100}%` }}
                              className="w-1/3 max-w-[20px] bg-[#689449] rounded-t-sm"
                            />
                            <motion.div
                              initial={{ height: 0 }}
                              animate={{ height: `${(d.activity / 8) * 100}%` }}
                              className="w-1/3 max-w-[20px] bg-[#9c5c5c] rounded-t-sm"
                            />
                          </div>
                          <span className="mt-4 text-[10px] font-bold text-[#808080]">{d.day}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Journey Section */}
                  <div className="service-journey pt-4">
                    <h3 className="font-bold text-lg mb-2">GulaWise Journey</h3>
                    <p className="text-xs text-[#808080] mb-6">Bagikan cerita hidup sehat kamu selama satu bulan terakhir</p>

                    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="min-w-[280px] h-[360px] bg-[#2d4a1e] rounded-[2rem] p-6 text-white relative flex flex-col justify-between overflow-hidden">
                          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16" />
                          <div className="relative z-10 flex flex-col h-full border border-white/20 rounded-[1.5rem] p-5 bg-black/10 backdrop-blur-sm">
                            <p className="text-[10px] font-bold text-white/60 tracking-widest uppercase mb-4 text-center">GulaWise Wrapped</p>
                            <h4 className="text-4xl font-bold text-center tracking-tighter mb-4">
                              {new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }).toUpperCase()}
                            </h4>

                            <div className="mt-auto space-y-4">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/10 rounded-lg"><Moon className="w-4 h-4" /></div>
                                <div>
                                  <p className="text-xl font-bold">210jam</p>
                                  <p className="text-[10px] text-white/50">Total waktu beraktifitas fisik bulan ini</p>
                                </div>
                              </div>
                              <div className="w-full h-[1px] bg-white/10" />
                              <p className="text-[10px] text-center italic text-white/60">"Maju terus pantang menyerah, hidup ini apa ya?"</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : activeTab === 'Pelacak Aktifitas' ? (
                <PelacakAktifitas user={user} onPointsUpdate={fetchLeaderboardData} />
              ) : activeTab === 'Peringkat & Title' ? (
                <div className="space-y-8 animate-in fade-in duration-500">
                  <div className="bg-[#2d4a1e] p-8 rounded-[2.5rem] text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-32 -mt-32" />
                    <div className="relative z-10">
                      <p className="text-xs font-bold text-white/60 uppercase tracking-widest mb-2">Total Akumulasi Poin</p>
                      <div className="flex items-baseline gap-4">
                        <h2 className="text-6xl font-bold tracking-tighter">{totalPoints}</h2>
                        <span className="text-2xl font-bold text-white/40">Pts</span>
                      </div>
                      <div className="mt-6 flex items-center gap-3 bg-white/10 w-fit px-4 py-2 rounded-full border border-white/10">
                        <Trophy className="w-4 h-4 text-[#eab308]" />
                        <span className="text-sm font-bold">Peringkat #{userRank || '-'} di {userProfile?.kota || 'Kota Kamu'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-8 rounded-[2.5rem] border border-[#e8e5d8] shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <h3 className="text-xl font-bold">Leaderboard {userProfile?.kota || 'Kota Kamu'}</h3>
                        <p className="text-xs text-[#808080]">Top 10 pejuang sehat di sekitarmu</p>
                      </div>
                      <div className="p-3 bg-[#f8faf7] rounded-2xl border border-[#e8e5d8]">
                        <Trophy className="w-5 h-5 text-[#689449]" />
                      </div>
                    </div>

                    <div className="space-y-4">
                      {cityLeaderboard.map((u) => (
                        <div
                          key={u.rank}
                          className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${u.name === userName ? 'bg-[#f0f4ec] border-[#689449] shadow-sm' : 'border-[#e8e5d8] hover:bg-[#f8faf7]'
                            }`}
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${u.rank === 1 ? 'bg-[#eab308] text-white' :
                              u.rank === 2 ? 'bg-[#94a3b8] text-white' :
                                u.rank === 3 ? 'bg-[#b45309] text-white' : 'bg-[#f0f4ec] text-[#689449]'
                              }`}>
                              {u.rank}
                            </div>
                            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-sm">
                              <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" />
                            </div>
                            <div>
                              <span className="block text-sm font-bold text-[#1c2b13]">{u.name}</span>
                              {u.name === userName && <span className="text-[10px] font-bold text-[#689449] uppercase">Kamu</span>}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="block text-sm font-bold text-[#1c2b13]">{u.points}</span>
                            <span className="text-[10px] font-bold text-[#808080] uppercase">Points</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Strava-style Achievement Share */}
                  <AchievementShare
                    rank={Number(userRank) || 0}
                    points={totalPoints}
                    city={userProfile?.kota || 'Kota Kamu'}
                    userName={userName}
                  />
                </div>
              ) : activeTab === 'Konsultasi' ? (
                <Konsultasi user={user} userProfile={userProfile} />
              ) : (
                <div className="flex flex-col items-center justify-center h-full py-20 text-[#a0a0a0]">
                  <ActivityIcon className="w-16 h-16 mb-4 opacity-20" />
                  <p className="text-lg font-medium">Halaman {activeTab} sedang dalam pengembangan</p>
                </div>
              )}
            </div>

            {/* Right Column: Risk & Ranking */}
            {activeTab !== 'Konsultasi' && (
              <div className="space-y-6">
                {/* Login Harian Moved Here */}
                <div className="bg-white p-4 rounded-[1.8rem] border border-[#e8e5d8] shadow-sm">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm font-bold text-[#1c2b13]">Login Harian</h3>
                  </div>
                  <div className="h-[1px] w-full bg-[#f0f0f0] mb-5" />
                  <div className="flex justify-between gap-2">
                    {dayNames.map((name, index) => {
                      const status = getDayStatus(index);
                      return (
                        <div
                          key={name}
                          className={`flex-1 flex flex-col rounded-xl border overflow-hidden transition-all duration-500 ${status === 'active' ? 'border-[#689449] ring-2 ring-[#689449]/20 scale-105 z-10 shadow-md' : 'border-[#e8e5d8]'
                            }`}
                        >
                          <div className={`py-1.5 text-center text-[7px] md:text-[8px] font-bold uppercase tracking-tighter ${status === 'active' ? 'bg-[#689449] text-white' :
                            status === 'completed' ? 'bg-[#e4eed9] text-[#3d5c2a]' :
                              'bg-[#f5f5f5] text-[#a0a0a0]'
                            }`}>
                            {name}
                          </div>
                          <div className="flex-1 flex flex-col items-center justify-center py-2.5 px-1 bg-white relative">
                            {status === 'completed' ? (
                              <div className="absolute inset-0 bg-[#689449]/5 flex items-center justify-center">
                                <div className="bg-[#689449] rounded-full p-0.5">
                                  <Check className="w-3 h-3 text-white" />
                                </div>
                              </div>
                            ) : (
                              <>
                                <span className={`text-[9px] md:text-[10px] font-black ${status === 'upcoming' ? 'text-[#d0d0d0]' : 'text-[#1c2b13]'
                                  }`}>
                                  +50
                                </span>
                                <span className="text-[6px] md:text-[7px] text-[#a0a0a0] font-bold uppercase">Poin</span>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Risk Card */}
                <div className="bg-white p-6 rounded-[2rem] border border-[#e8e5d8] shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-sm">Tingkat Risiko Kamu</h3>
                    {!userPrediction && (
                      <button className="text-[10px] font-bold text-[#689449] underline decoration-[#689449]/30 underline-offset-4" onClick={onBackToHome}>
                        Cek Risiko Sekarang
                      </button>
                    )}
                  </div>

                  <div className="flex items-center justify-center py-10 mb-8 border border-dashed border-[#e8e5d8] rounded-[1.5rem] bg-[#f8faf7]/50">
                    {userPrediction ? (
                      <div className="text-center">
                        <span className="text-6xl font-bold tracking-tighter text-[#1c2b13]">
                          {userPrediction.probability_percent}%
                        </span>
                        <p className="text-xs text-[#808080] font-medium mt-1">
                          Risiko kamu diabetes ({userPrediction.risk_level})
                        </p>
                      </div>
                    ) : (
                      <div className="text-center px-4">
                        <p className="text-sm text-[#808080] font-medium">Belum ada data prediksi</p>
                        <button onClick={onBackToHome} className="text-xs font-bold text-[#689449] mt-2">Isi Form Sekarang →</button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    {[
                      { color: 'bg-[#689449]', label: 'Risiko Rendah', keys: ['Low', 'Rendah', 'Normal'] },
                      { color: 'bg-[#407bb6]', label: 'Perlu Perhatian', keys: ['Moderate', 'Sedang'] },
                      { color: 'bg-[#9c5c5c]', label: 'Risiko Tinggi', keys: ['High', 'Tinggi'] },
                    ].map((item) => {
                      const isActive = userPrediction?.risk_level && item.keys.some(k =>
                        userPrediction.risk_level.toLowerCase().includes(k.toLowerCase())
                      );
                      return (
                        <div key={item.label} className={`flex items-center justify-between px-4 py-3 border rounded-xl transition-all ${isActive ? 'bg-[#f0f4ec] border-[#689449] translate-x-1' : 'border-[#e8e5d8]'}`}>
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${item.color}`} />
                            <span className={`text-xs font-bold ${isActive ? 'text-[#1c2b13]' : 'text-[#5c5c5c]'}`}>{item.label}</span>
                          </div>
                          {isActive && <div className="text-[10px] font-bold text-[#689449]">Status Kamu</div>}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Ranking Card */}
                <div className="bg-white p-6 rounded-[2rem] border border-[#e8e5d8] shadow-sm overflow-hidden relative">
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="font-bold">Peringkat di {userProfile?.kota || 'Kota Kamu'}</h3>
                    <button className="text-[10px] font-bold text-[#689449] underline decoration-[#689449]/30 underline-offset-4">Lihat Lebih Detail</button>
                  </div>

                  <p className="text-[10px] font-medium text-[#808080] mb-4 pl-1">
                    Kamu saat ini berada di peringkat {userRank || '-'}
                  </p>

                  <div className="bg-[#f8faf7] border border-[#e8e5d8] rounded-2xl p-4 flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#689449] text-white flex items-center justify-center text-xs font-bold">{userRank || '-'}</div>
                      <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-white shadow-sm">
                        <img src="https://i.pravatar.cc/150?u=thealaa" alt="Me" className="w-full h-full object-cover" />
                      </div>
                      <span className="text-xs font-bold">{userName}</span>
                    </div>
                    <div className="bg-white px-2 py-1 rounded-full border border-[#e8e5d8] flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-[#689449]" />
                      <span className="text-[10px] font-bold">{totalPoints} Points</span>
                    </div>
                  </div>

                  <button className="w-full py-3.5 bg-[#689449] text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-2 mb-8 shadow-lg shadow-[#689449]/20 hover:bg-[#5a853e] transition-all">
                    Bagikan Pencapaianmu <Share2 className="w-3.5 h-3.5" />
                  </button>

                  <div className="h-[1px] w-full bg-[#e8e5d8] mb-6" />

                  <div className="space-y-4">
                    {cityLeaderboard.slice(0, 3).map((user) => (
                      <div key={user.rank} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-[#808080] w-4">{user.rank}</span>
                          <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-white shadow-sm">
                            <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                          </div>
                          <span className="text-xs font-bold">{user.name}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#689449]" />
                          <span className="text-[10px] font-bold text-[#808080]">{user.points} Points</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Decorative gradient overlay at bottom if needed */}
                </div>
              </div>
            )}
          </section>
        </main>
      </div>
      <AdBanner />
    </div>
  );
};

export default Dashboard;
