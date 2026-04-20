import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Activity,
  Stethoscope,
  Trophy,
  LogOut,
  Moon,
  Activity as ActivityIcon,
  ChevronDown,
  Share2,
} from 'lucide-react';
import { useEffect } from 'react';
import { supabase } from './lib/supabase';
import { PelacakAktifitas } from './components/PelacakAktifitas';
import { LOGO_SRC } from './constants/assets';
import type { User } from '@supabase/supabase-js';

import type { PredictionResult } from './types';

interface DashboardProps {
  user: User;
  userProfile: { name: string; kota: string } | null;
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

  useEffect(() => {
    fetchLeaderboardData();
  }, [user.id, userProfile?.kota]);

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
    <div className="flex min-h-screen bg-[#f8faf7] text-[#1c2b13] font-jakarta pt-20">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-[#e8e5d8] flex flex-col fixed h-[calc(100vh-80px)] top-20 left-0 hidden lg:flex">
        <div className="p-6 flex flex-col h-full">
          <div className="flex items-center gap-2 mb-10">
            <img src={LOGO_SRC} alt="GulaWise" className="h-6 w-auto" />
            <span className="text-lg font-bold">GulaWise.</span>
          </div>

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
      <main className="flex-1 lg:ml-64 p-4 md:p-8">
        <header className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6 items-center">
          <div className="xl:col-span-2 flex justify-between items-center">
            <div>
              <p className="text-xs text-[#a0a0a0] font-medium">Selamat datang kembali,</p>
              <h1 className="text-2xl font-bold">{userName}</h1>
            </div>

            {/* Profile shifted towards center */}
            <div className="hidden md:flex items-center gap-4 mr-12">
              <div className="w-10 h-10 rounded-full bg-[#f0f4ec] flex items-center justify-center overflow-hidden border-2 border-white shadow-sm">
                <img src="https://i.pravatar.cc/150?u=thealaa" alt="Profile" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>

          {/* Login Harian Container in the header space above Risk Card */}
          <div className="xl:col-span-1">
            <div className="bg-white p-4 rounded-[1.8rem] border border-[#e8e5d8] shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-bold text-[#1c2b13]">Login Harian</h3>
              </div>
              <div className="h-[1px] w-full bg-[#f0f0f0] mb-5" />
              <div className="flex justify-between gap-2">
                {[
                  { day: 1, pts: 50, status: 'completed' },
                  { day: 2, pts: 50, status: 'active' },
                  { day: 3, pts: 300, status: 'upcoming' },
                  { day: 4, pts: 50, status: 'upcoming' },
                  { day: 5, pts: 50, status: 'upcoming' },
                  { day: 6, pts: 300, status: 'upcoming' },
                ].map((item) => (
                  <div
                    key={item.day}
                    className={`flex-1 flex flex-col rounded-xl border overflow-hidden ${item.status === 'active' ? 'border-[#689449] ring-1 ring-[#689449]/20' : 'border-[#e8e5d8]'
                      }`}
                  >
                    <div className={`py-1.5 text-center text-[8px] font-bold ${item.status === 'active' ? 'bg-[#689449] text-white' :
                      item.status === 'completed' ? 'bg-[#f0f4ec] text-[#689449]' :
                        'bg-[#f0f0f0] text-[#a0a0a0]'
                      }`}>
                      Hari {item.day}
                    </div>
                    <div className="flex-1 flex flex-col items-center justify-center py-2 px-1 bg-white">
                      <span className={`text-[10px] font-bold ${item.status === 'upcoming' ? 'text-[#a0a0a0]' : 'text-[#1c2b13]'
                        }`}>
                        +{item.pts}
                      </span>
                      <span className="text-[7px] text-[#a0a0a0] font-medium">Poin</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </header>

        <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left Column: Stat Cards & Chart / Other Views */}
          <div className="xl:col-span-2 space-y-6">
            {activeTab === 'Dashboard' ? (
              <>
                <h2 className="text-xl font-bold mb-4">Mei 2040</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Sleep Card */}
                  <div className="bg-white p-6 rounded-[2rem] border border-[#e8e5d8] shadow-sm relative overflow-hidden group">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="font-bold text-[#1c2b13]">Waktu Tidur</h3>
                      <div className="p-2 bg-[#f0f4ec] rounded-lg">
                        <Moon className="w-4 h-4 text-[#689449]" />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="bg-[#e4f0d5] text-[#4a7c3f] text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
                        <motion.span animate={{ rotate: -45 }} className="inline-block">↑</motion.span>
                        Pola tidurmu makin baik dari bulan lalu
                      </div>
                    </div>
                    <div className="flex items-baseline gap-2 mt-4">
                      <span className="text-5xl font-bold tracking-tighter">122j</span>
                      <span className="text-xs text-[#808080] leading-none mb-1">Total waktu tidur kamu<br />bulan ini</span>
                    </div>
                  </div>

                  {/* Physical Activity Card */}
                  <div className="bg-white p-6 rounded-[2rem] border border-[#e8e5d8] shadow-sm relative overflow-hidden group">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="font-bold text-[#1c2b13]">Aktifitas Fisik</h3>
                      <div className="p-2 bg-[#fcf2f2] rounded-lg">
                        <ActivityIcon className="w-4 h-4 text-[#e05e5e]" />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="bg-[#fcf2f2] text-[#e05e5e] text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
                        <motion.span animate={{ rotate: 45 }} className="inline-block">↓</motion.span>
                        Kamu kurang aktif dibandingkan bulan lalu
                      </div>
                    </div>
                    <div className="flex items-baseline gap-2 mt-4">
                      <span className="text-5xl font-bold tracking-tighter">43j</span>
                      <span className="text-xs text-[#808080] leading-none mb-1">Total waktu beraktifitas<br />fisik bulan ini</span>
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
                          <h4 className="text-4xl font-bold text-center tracking-tighter mb-4">MEI 2040</h4>

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
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-20 text-[#a0a0a0]">
                <ActivityIcon className="w-16 h-16 mb-4 opacity-20" />
                <p className="text-lg font-medium">Halaman {activeTab} sedang dalam pengembangan</p>
              </div>
            )}
          </div>

          {/* Right Column: Risk & Ranking */}
          <div className="space-y-6">
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
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
