import React, { useState, useEffect, useRef } from 'react';
import {
  Moon,
  Activity,
  Frown,
  Utensils,
  Edit3,
  Plus,
  HelpCircle,
  Check,
  Loader2,
  Sparkles,
  Send,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

interface PelacakAktifitasProps {
  onBackToHome: () => void;
  user: User;
}

interface ChatMessage {
  role: 'assistant' | 'user';
  content: string;
}

export const PelacakAktifitas: React.FC<PelacakAktifitasProps> = ({ onBackToHome, user }) => {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loadingRec, setLoadingRec] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // System prompt untuk context chat
  const systemPromptRef = useRef('');

  // Form States
  const [sleepHours, setSleepHours] = useState('');
  const [lightActivity, setLightActivity] = useState('');
  const [heavyActivity, setHeavyActivity] = useState('');
  const [stressLevel, setStressLevel] = useState('');
  const [nutrition, setNutrition] = useState({
    protein: false,
    karbo: false,
    serat: false,
    cairan: false
  });

  const [todayData, setTodayData] = useState<any>(null);

  useEffect(() => {
    fetchTodayActivity();
  }, [user.id]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchTodayActivity = async () => {
    try {
      setFetching(true);
      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('daily_activities')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setTodayData(data);
        setIsSubmitted(true);
        setSleepHours(data.sleep_hours.toString());
        setLightActivity(data.light_activity_duration?.toString() || '0');
        setHeavyActivity(data.heavy_activity_duration?.toString() || '0');
        setStressLevel(data.stress_level.toString());
        setNutrition({
          protein: data.has_protein,
          karbo: data.has_karbo,
          serat: data.has_serat || false,
          cairan: data.has_cairan || false
        });

        if (data.recommendation) {
          setMessages([{ role: 'assistant', content: data.recommendation }]);

          // Tambah ini — ambil nama dulu sebelum build system prompt
          const { data: userData } = await supabase
            .from('users')
            .select('name')
            .eq('id', user.id)
            .single();

          const namaUser = userData?.name ?? user.email?.split('@')[0] ?? 'Kamu';
          buildSystemPrompt(data, namaUser);
        } else {
          await fetchRecommendation(data);
        }
      }
    } catch (err) {
      console.error('Error fetching today activity:', err);
    } finally {
      setFetching(false);
    }
  };

  const buildSystemPrompt = (data: any, nama: string = 'Kamu') => {
    const prompt = `Kamu adalah asisten kesehatan GulaWise yang ramah. Data kesehatan pengguna bernama ${nama} hari ini:
- Durasi tidur: ${data.sleep_hours} jam
- Aktivitas ringan: ${data.light_activity_duration} menit
- Aktivitas berat: ${data.heavy_activity_duration} menit
- Protein: ${data.has_protein ? 'terpenuhi' : 'tidak'}
- Karbohidrat: ${data.has_karbo ? 'terpenuhi' : 'tidak'}
- Serat: ${data.has_serat ? 'terpenuhi' : 'tidak'}
- Cairan: ${data.has_cairan ? 'terpenuhi' : 'tidak'}
- Tingkat stres: ${data.stress_level}/10

Jawab pertanyaan follow-up ${nama} secara singkat dan relevan dalam bahasa Indonesia yang hangat.`;
    systemPromptRef.current = prompt;
  };

  const fetchRecommendation = async (data: any) => {
    try {
      setLoadingRec(true);

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('name')
        .eq('id', user.id)
        .single();

      console.log('userData:', userData);
      console.log('userError:', userError);
      console.log('user.id:', user.id);

      const namaUser = userData?.name ?? user.email?.split('@')[0] ?? 'Kamu';

      buildSystemPrompt(data, namaUser);



      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/health-recommendation`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            nama: userData?.name ?? 'Kamu',
            durasi_tidur: data.sleep_hours,
            aktivitas_ringan: data.light_activity_duration,
            aktivitas_berat: data.heavy_activity_duration,
            gizi_protein: data.has_protein,
            gizi_karbo: data.has_karbo,
            gizi_serat: data.has_serat,
            gizi_cairan: data.has_cairan,
            stress: data.stress_level,
          }),
        }
      );

      const result = await res.json();

      if (result.recommendation) {
        setMessages([{ role: 'assistant', content: result.recommendation }]);
        buildSystemPrompt(data, namaUser);

        await supabase
          .from('daily_activities')
          .update({ recommendation: result.recommendation })
          .eq('id', data.id);
      }
    } catch (err) {
      console.error('Error fetching recommendation:', err);
    } finally {
      setLoadingRec(false);
    }
  };

  const handleSendChat = async () => {
    if (!chatInput.trim() || loadingChat) return;

    const userMessage: ChatMessage = { role: 'user', content: chatInput.trim() };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setChatInput('');
    setLoadingChat(true);

    const namaUser = user.email?.split('@')[0] ?? 'Kamu';
    const prompt = todayData
      ? `Kamu adalah asisten kesehatan GulaWise yang ramah. Data kesehatan pengguna bernama ${namaUser} hari ini:
- Durasi tidur: ${todayData.sleep_hours} jam
- Aktivitas ringan: ${todayData.light_activity_duration} menit
- Aktivitas berat: ${todayData.heavy_activity_duration} menit
- Protein: ${todayData.has_protein ? 'terpenuhi' : 'tidak'}
- Karbohidrat: ${todayData.has_karbo ? 'terpenuhi' : 'tidak'}
- Serat: ${todayData.has_serat ? 'terpenuhi' : 'tidak'}
- Cairan: ${todayData.has_cairan ? 'terpenuhi' : 'tidak'}
- Tingkat stres: ${todayData.stress_level}/10
Jawab pertanyaan follow-up secara singkat dan relevan dalam bahasa Indonesia yang hangat.`
      : 'Kamu adalah asisten kesehatan GulaWise yang ramah. Jawab dalam bahasa Indonesia.';

    console.log('prompt:', prompt);
    console.log('messages:', updatedMessages);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/health-recommendation`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            messages: [
              { role: 'system', content: prompt },
              ...updatedMessages.map(m => ({ role: m.role, content: m.content })),
            ],
          }),
        }
      );

      const result = await res.json();
      if (result.recommendation) {
        setMessages(prev => [...prev, { role: 'assistant', content: result.recommendation }]);
      }
    } catch (err) {
      console.error('Error sending chat:', err);
    } finally {
      setLoadingChat(false);
    }
  };

  const handleSave = async () => {
    if (isSubmitted) return;

    try {
      setLoading(true);
      const { data: inserted, error } = await supabase
        .from('daily_activities')
        .insert([{
          user_id: user.id,
          sleep_hours: parseFloat(sleepHours) || 0,
          light_activity_duration: parseFloat(lightActivity) || 0,
          heavy_activity_duration: parseFloat(heavyActivity) || 0,
          stress_level: parseInt(stressLevel) || 0,
          has_protein: nutrition.protein,
          has_karbo: nutrition.karbo,
          has_serat: nutrition.serat,
          has_cairan: nutrition.cairan
        }])
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          alert('Kamu sudah mengisi aktivitas hari ini!');
        } else {
          throw error;
        }
      } else {
        setIsSubmitted(true);
        setTodayData(inserted);
        await fetchRecommendation(inserted);
      }
    } catch (err) {
      console.error('Error saving activity:', err);
      alert('Gagal menyimpan aktivitas. Coba lagi nanti.');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-[#689449]">
        <Loader2 className="w-10 h-10 animate-spin mb-4" />
        <p className="font-bold">Memuat data aktivitas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-bold">Pelacak Aktifitas</h2>
      </div>

      {/* Main Form Card */}
      <div className={`bg-white p-8 rounded-[2.5rem] border border-[#e8e5d8] shadow-sm relative overflow-hidden transition-all ${isSubmitted ? 'opacity-75' : ''}`}>
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <h3 className="font-bold text-lg text-[#1c2b13]">Catat Aktifitas Hari Ini</h3>
            <Edit3 className="w-4 h-4 text-[#808080]" />
          </div>
          <div className={`text-[10px] font-bold px-3 py-1.5 rounded-full border shadow-sm transition-all ${isSubmitted ? 'bg-[#f0f4ec] text-[#689449] border-[#689449]/20' : 'bg-[#e4eed9] text-[#3d5c2a] border-[#c9ddb8]'}`}>
            {isSubmitted ? 'Selesai' : '+20 Poin'}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Sleep Input */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#1c2b13]">Waktu Tidur</label>
              <HelpCircle className="w-3.5 h-3.5 text-[#a0a0a0]" />
            </div>
            <input
              type="number"
              value={sleepHours}
              onChange={(e) => setSleepHours(e.target.value)}
              disabled={isSubmitted}
              placeholder="-- jam"
              className="w-full bg-[#f8faf7] border border-[#e8e5d8] rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#689449]/20 transition-all disabled:opacity-50"
            />
          </div>

          {/* Activity Input */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#1c2b13]">Aktifitas Fisik</label>
              <HelpCircle className="w-3.5 h-3.5 text-[#a0a0a0]" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-[#808080] ml-1">Ringan <span className="font-normal">(jalan, tangga)</span></span>
                <input
                  type="number"
                  value={lightActivity}
                  onChange={(e) => setLightActivity(e.target.value)}
                  disabled={isSubmitted}
                  placeholder="-- menit"
                  className="w-full bg-[#f8faf7] border border-[#e8e5d8] rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#689449]/20 transition-all disabled:opacity-50"
                />
              </div>
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-[#808080] ml-1">Berat <span className="font-normal">(futsal, gym)</span></span>
                <input
                  type="number"
                  value={heavyActivity}
                  onChange={(e) => setHeavyActivity(e.target.value)}
                  disabled={isSubmitted}
                  placeholder="-- menit"
                  className="w-full bg-[#f8faf7] border border-[#e8e5d8] rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#689449]/20 transition-all disabled:opacity-50"
                />
              </div>
            </div>
          </div>

          {/* Stress Input */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-[#1c2b13]">Tingkat Stress</label>
            <input
              type="number"
              min="1"
              max="10"
              value={stressLevel}
              onChange={(e) => setStressLevel(e.target.value)}
              disabled={isSubmitted}
              placeholder="-- /10 (isi dengan angka dari 1-10)"
              className="w-full bg-[#f8faf7] border border-[#e8e5d8] rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#689449]/20 transition-all disabled:opacity-50"
            />
          </div>

          {/* Nutrition Checkboxes */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#1c2b13]">Asupan Gizi</label>
              <HelpCircle className="w-3.5 h-3.5 text-[#a0a0a0]" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {(['protein', 'karbo', 'serat', 'cairan'] as const).map((key) => (
                <button
                  key={key}
                  disabled={isSubmitted}
                  onClick={() => setNutrition(p => ({ ...p, [key]: !p[key] }))}
                  className={`flex items-center justify-center gap-3 py-4 rounded-2xl border transition-all ${nutrition[key] ? 'bg-[#689449] border-[#689449] text-white' : 'bg-[#f8faf7] border-[#e8e5d8] text-[#5c5c5c]'}`}
                >
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center ${nutrition[key] ? 'bg-white/20' : 'bg-[#e8e5d8]'}`}>
                    {nutrition[key] && <Check className="w-3.5 h-3.5 text-white" />}
                  </div>
                  <span className="text-sm font-bold capitalize">
                    {key === 'karbo' ? 'Karbohidrat' : key === 'cairan' ? 'Cairan Tubuh' : key.charAt(0).toUpperCase() + key.slice(1)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="text-[10px] text-[#a0a0a0] font-medium mb-6">
          {isSubmitted ? 'Terima kasih telah mencatat aktivitasmu hari ini!' : 'Isi segera dan dapatkan poin hariannya'}
        </p>

        <button
          onClick={handleSave}
          disabled={isSubmitted || loading}
          className={`w-full py-5 font-bold rounded-2xl transition-all border flex items-center justify-center gap-2 ${isSubmitted
            ? 'bg-[#f0f4ec] text-[#689449] border-[#689449]/20 cursor-not-allowed'
            : 'bg-[#689449] text-white border-[#689449] hover:bg-[#5a813f] shadow-lg shadow-[#689449]/20'
            }`}
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {isSubmitted ? 'Aktivitas Hari Ini Sudah Tercatat' : 'Simpan Aktifitas'}
        </button>
      </div>

      {/* Rekomendasi AI + Chat */}
      {isSubmitted && (
        <div className="bg-white p-8 rounded-[2.5rem] border border-[#e8e5d8] shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-2xl bg-[#e4eed9] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-[#689449]" />
            </div>
            <div>
              <h3 className="font-bold text-[#1c2b13]">Rekomendasi Kesehatan Hari Ini by GulaWise AI Assistant</h3>
              <p className="text-[10px] text-[#808080]">Kamu bisa bertanya lebih lanjut di bawah</p>
            </div>
          </div>

          {/* Chat Messages */}
          {loadingRec ? (
            <div className="flex items-center gap-3 py-8 justify-center text-[#689449]">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="text-sm font-medium">Sedang menganalisis aktivitasmu...</span>
            </div>
          ) : (
            <div className="space-y-4 mb-6 max-h-[480px] overflow-y-auto pr-1">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-7 h-7 rounded-xl bg-[#e4eed9] flex items-center justify-center mr-2 mt-1 flex-shrink-0">
                      <Sparkles className="w-3.5 h-3.5 text-[#689449]" />
                    </div>
                  )}
                  <div className={`max-w-[85%] px-5 py-4 rounded-3xl text-sm leading-relaxed whitespace-pre-line ${msg.role === 'user'
                    ? 'bg-[#689449] text-white rounded-br-lg'
                    : 'bg-[#f8faf7] text-[#1c2b13] border border-[#e8e5d8] rounded-bl-lg'
                    }`}>
                    <span dangerouslySetInnerHTML={{
                      __html: msg.content
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        .replace(/\n/g, '<br/>')
                    }} />
                  </div>
                </div>
              ))}

              {loadingChat && (
                <div className="flex justify-start">
                  <div className="w-7 h-7 rounded-xl bg-[#e4eed9] flex items-center justify-center mr-2 mt-1 flex-shrink-0">
                    <Sparkles className="w-3.5 h-3.5 text-[#689449]" />
                  </div>
                  <div className="bg-[#f8faf7] border border-[#e8e5d8] rounded-3xl rounded-bl-lg px-5 py-4 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-[#689449]" />
                    <span className="text-sm text-[#808080]">Sedang mengetik...</span>
                  </div>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>
          )}

          {/* Chat Input */}
          {messages.length > 0 && (
            <div className="flex gap-3 items-end">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) handleSendChat(); }}
                placeholder="Tanya sesuatu tentang kesehatanmu..."
                className="flex-1 bg-[#f8faf7] border border-[#e8e5d8] rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#689449]/20 transition-all"
              />
              <button
                onClick={handleSendChat}
                disabled={!chatInput.trim() || loadingChat}
                className="w-12 h-12 bg-[#689449] hover:bg-[#5a813f] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl flex items-center justify-center transition-all flex-shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
        {/* Sleep Card */}
        <div className="bg-white p-8 rounded-[2rem] border border-[#e8e5d8] shadow-sm">
          <div className="w-full flex justify-between items-start mb-6">
            <h4 className="font-bold text-[#1c2b13]">Waktu Tidur</h4>
            <Moon className="w-5 h-5 text-[#1c2b13]" />
          </div>
          <div className="w-full h-24 bg-[#f8faf7] rounded-3xl border border-[#e8e5d8] flex items-center px-6 gap-6">
            <span className="text-4xl font-bold tracking-tighter">
              {todayData ? `${todayData.sleep_hours}j` : '---'}
            </span>
            <p className="text-[10px] text-[#808080] font-medium leading-relaxed">
              {todayData ? 'Kamu sudah mencatat waktu istirahat hari ini' : 'Kamu belum mencatat waktu tidur hari ini'}
            </p>
          </div>
        </div>

        {/* Activity Card */}
        <div className="bg-white p-8 rounded-[2rem] border border-[#e8e5d8] shadow-sm">
          <div className="w-full flex justify-between items-start mb-6">
            <h4 className="font-bold text-[#1c2b13]">Aktifitas Fisik</h4>
            <Activity className="w-5 h-5 text-[#1c2b13]" />
          </div>
          <div className="w-full min-h-24 bg-[#f8faf7] rounded-3xl border border-[#e8e5d8] flex items-center px-6 py-4 gap-6">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-4">
                <span className="text-3xl font-bold tracking-tighter w-16">
                  {todayData ? `${todayData.light_activity_duration}m` : '---'}
                </span>
                <span className="text-[10px] font-bold text-[#808080]">Aktifitas Ringan</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-3xl font-bold tracking-tighter w-16">
                  {todayData ? `${todayData.heavy_activity_duration}m` : '---'}
                </span>
                <span className="text-[10px] font-bold text-[#808080]">Aktifitas Berat</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stress Card */}
        <div className="bg-white p-8 rounded-[2rem] border border-[#e8e5d8] shadow-sm">
          <div className="w-full flex justify-between items-start mb-6">
            <h4 className="font-bold text-[#1c2b13]">Tingkat Stress</h4>
            <Frown className="w-5 h-5 text-[#1c2b13]" />
          </div>
          <div className="w-full h-24 bg-[#f8faf7] rounded-3xl border border-[#e8e5d8] flex items-center px-6 gap-6">
            <span className="text-4xl font-bold tracking-tighter text-[#9c5c5c]">
              {todayData ? `${todayData.stress_level}/10` : '---'}
            </span>
            <p className="text-[10px] text-[#808080] font-medium leading-relaxed">
              {todayData
                ? todayData.stress_level <= 4 ? 'Tingkat stress kamu rendah, bagus!' : 'Tingkat stress kamu perlu diperhatikan'
                : 'Belum ada data stress tercatat'}
            </p>
          </div>
        </div>

        {/* Nutrition Card */}
        <div className="bg-white p-8 rounded-[2rem] border border-[#e8e5d8] shadow-sm">
          <div className="w-full flex justify-between items-start mb-6">
            <h4 className="font-bold text-[#1c2b13]">Gizi Makanan</h4>
            <Utensils className="w-5 h-5 text-[#1c2b13]" />
          </div>
          <div className="w-full min-h-24 bg-[#f8faf7] rounded-3xl border border-[#e8e5d8] flex items-center px-6 py-4 gap-6">
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              {[
                { key: 'has_protein', label: 'Protein' },
                { key: 'has_karbo', label: 'Karbo' },
                { key: 'has_serat', label: 'Serat' },
                { key: 'has_cairan', label: 'Cairan' },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${todayData?.[key] ? 'bg-[#689449]' : 'bg-gray-300'}`} />
                  <span className="text-[10px] font-bold">{label}</span>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-[#808080] font-medium leading-relaxed flex-1">
              {todayData
                ? (todayData.has_protein && todayData.has_karbo && todayData.has_serat && todayData.has_cairan)
                  ? 'Nutrisi kamu hari ini sudah sangat lengkap!'
                  : 'Beberapa asupan nutrisi belum tercukupi'
                : 'Belum ada data gizi tercatat'}
            </p>
          </div>
        </div>
      </div>

      {/* Daily Habits Section */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-[#e8e5d8] shadow-sm mt-4">
        <h3 className="font-bold text-lg mb-2">Kebiasaan Aktifitas Harianmu</h3>
        <p className="text-xs text-[#808080] mb-8">Pola aktivitasmu sehari hari</p>

        {isSubmitted ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#f8faf7] p-6 rounded-3xl border border-[#e8e5d8]">
              <p className="text-[10px] font-bold text-[#808080] uppercase mb-2">Status Hari Ini</p>
              <div className="flex items-center gap-2 text-[#689449]">
                <Check className="w-5 h-5" />
                <span className="font-bold">Sudah Terisi</span>
              </div>
            </div>
            <div className="bg-[#f8faf7] p-6 rounded-3xl border border-[#e8e5d8]">
              <p className="text-[10px] font-bold text-[#808080] uppercase mb-2">Poin Didapat</p>
              <div className="flex items-center gap-2 text-[#1c2b13]">
                <div className="w-2 h-2 rounded-full bg-[#689449]" />
                <span className="font-bold">+20 Poin</span>
              </div>
            </div>
            <div className="bg-[#f8faf7] p-6 rounded-3xl border border-[#e8e5d8]">
              <p className="text-[10px] font-bold text-[#808080] uppercase mb-2">Target Berikutnya</p>
              <span className="font-bold text-[#808080]">Besok Pagi</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 border border-dashed border-[#e8e5d8] rounded-[2rem] bg-[#f8faf7]/50">
            <div className="w-16 h-16 rounded-2xl bg-white border border-[#e8e5d8] flex items-center justify-center mb-4 shadow-sm">
              <Plus className="w-6 h-6 text-[#689449]" />
            </div>
            <p className="text-xs font-bold text-[#a0a0a0]">Belum ada data aktifitas harian</p>
            <p className="text-[10px] text-[#808080] mt-1">Catat aktifitasmu hari ini untuk melihat progres!</p>
          </div>
        )}
      </div>
    </div>
  );
};