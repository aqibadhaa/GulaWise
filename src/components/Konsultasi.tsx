import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star, Briefcase, Clock, ArrowLeft, Send, User as UserIcon, ShieldCheck
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

declare global {
  interface Window {
    snap: any;
  }
}

interface Doctor {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  experience: number;
  price: number;
  image: string;
  user_id: string;
  is_available: boolean;
}

interface Consultation {
  id: string;
  user_id: string;
  doctor_id: string;
  package_days: number;
  price: number;
  payment_status: 'pending' | 'paid';
  status: 'active' | 'expired' | 'pending';
  started_at?: string;
  expired_at?: string;
  doctor?: Doctor;
  user_profile?: { name: string };
}

interface Message {
  id: string;
  consultation_id: string;
  sender_id: string;
  message: string;
  created_at: string;
}

interface KonsultasiProps {
  user: User;
  userProfile: { name: string; kota: string; role?: string } | null;
}

const packages = [
  { id: '3days', label: '3 Hari', days: 3, price: 25000 },
  { id: '5days', label: '5 Hari', days: 5, price: 40000 },
  { id: '7days', label: '7 Hari', days: 7, price: 55000 },
];

export const Konsultasi: React.FC<KonsultasiProps> = ({ user, userProfile }) => {
  const [view, setView] = useState<'list' | 'booking' | 'chat'>('list');
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedPackage, setSelectedPackage] = useState(packages[0]);
  const [activeConsultations, setActiveConsultations] = useState<Consultation[]>([]);
  const [currentConsultation, setCurrentConsultation] = useState<Consultation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const isDoctor = userProfile?.role === 'doctor';

  useEffect(() => {
    fetchInitialData();
  }, [user.id, userProfile?.role]);

  useEffect(() => {
    if (view === 'chat' && currentConsultation) {
      fetchMessages(currentConsultation.id);
      const subscription = supabase
        .channel(`consultation_${currentConsultation.id}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'consultation_messages',
          filter: `consultation_id=eq.${currentConsultation.id}`
        }, (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        })
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [view, currentConsultation]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      if (isDoctor) {
        // Fetch consultations where doctor_id matches doctor's doctor profile id
        const { data: doctorProfile } = await supabase
          .from('doctors')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (doctorProfile) {
          const { data: cons } = await supabase
            .from('consultation_packages')
            .select('*, user_profile:users(name)')
            .eq('doctor_id', doctorProfile.id)
            .eq('payment_status', 'paid')
            .eq('status', 'active');
          setActiveConsultations(cons || []);
        }
      } else {
        // Check for active consultation for user
        const { data: cons } = await supabase
          .from('consultation_packages')
          .select('*, doctor:doctors(*)')
          .eq('user_id', user.id)
          .eq('payment_status', 'paid')
          .eq('status', 'active')
          .limit(1)
          .maybeSingle();

        if (cons) {
          setCurrentConsultation(cons);
          setView('chat');
        } else {
          // 1. Ambil ID semua dokter yang sedang melayani pasien (status active)
          const { data: busyPackages } = await supabase
            .from('consultation_packages')
            .select('doctor_id')
            .eq('status', 'active');

          const busyDoctorIds = (busyPackages || []).map(p => p.doctor_id);

          // 2. Ambil data semua dokter yang is_available = true
          const { data: docs, error } = await supabase
            .from('doctors')
            .select('*')
            .eq('is_available', true);

          if (error) {
            console.error('Error fetching doctors:', error);
            setDoctors([]);
            return;
          }

          // 3. Filter: Hanya tampilkan dokter yang is_available=true DAN tidak sedang sibuk
          const availableDocs = (docs || []).filter(dr => !busyDoctorIds.includes(dr.id));

          setDoctors(availableDocs);
        }
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (consId: string) => {
    const { data } = await supabase
      .from('consultation_messages')
      .select('*')
      .eq('consultation_id', consId)
      .order('created_at', { ascending: true });
    setMessages(data || []);
  };

  const handleSelectDoctor = (dr: Doctor) => {
    setSelectedDoctor(dr);
    setView('booking');
  };

  const handlePayment = async () => {
    if (!selectedDoctor || !user) return;

    try {
      setLoading(true);
      const orderId = `GULA-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      // 1. Create consultation record in DB
      const { data: consultation, error: consError } = await supabase
        .from('consultation_packages')
        .insert({
          user_id: user.id,
          doctor_id: selectedDoctor.id,
          package_days: selectedPackage.days,
          price: selectedPackage.price,
          payment_status: 'pending',
          status: 'pending',
          midtrans_order_id: orderId
        })
        .select()
        .single();

      if (consError) throw consError;

      // 2. Panggil secara manual (Bypass library Supabase yang lagi error JWT)
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/midtrans-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          order_id: orderId,
          amount: selectedPackage.price,
          customer_name: userProfile?.name || 'User',
          customer_email: user.email,
          doctor_name: selectedDoctor.name,
          booking_date: new Date().toLocaleDateString(),
          booking_time: new Date().toLocaleTimeString()
        })
      });

      const result = await response.json();

      if (!response.ok || !result.token) {
        console.error('Midtrans error detail:', result);
        // Ambil pesan paling lengkap dari Midtrans
        const errorMsg = result.error || result.status_message || JSON.stringify(result);
        throw new Error(errorMsg);
      }


      const token = result.token;

      // Update token in DB
      await supabase
        .from('consultation_packages')
        .update({ midtrans_token: token })
        .eq('id', consultation.id);

      if (window.snap) {
        window.snap.pay(token, {
          onSuccess: async function (result: any) {
            console.log('Payment success:', result);

            // Update status di database jadi 'paid' dan 'active'
            const { error: updateError } = await supabase
              .from('consultation_packages')
              .update({
                payment_status: 'paid',
                status: 'active',
                started_at: new Date().toISOString(),
                expired_at: new Date(Date.now() + selectedPackage.days * 24 * 60 * 60 * 1000).toISOString()
              })
              .eq('midtrans_order_id', orderId); // Pakai orderId yang kita buat tadi
            if (updateError) {
              console.error('Error updating status:', updateError);
            }

            // Update status dokter jadi tidak tersedia
            await supabase
              .from('doctors')
              .update({ is_available: false })
              .eq('id', selectedDoctor.id);

            // Refresh data biar UI berubah jadi tampilan Chat
            fetchInitialData();
          },
          onPending: () => alert('Pembayaran tertunda'),
          onError: () => alert('Pembayaran gagal'),
          onClose: () => alert('Anda menutup popup sebelum menyelesaikan pembayaran')
        });
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      alert(`Terjadi kesalahan saat memproses pembayaran: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentConsultation) return;

    const msg = newMessage;
    setNewMessage('');

    const { error } = await supabase
      .from('consultation_messages')
      .insert({
        consultation_id: currentConsultation.id,
        sender_id: user.id,
        message: msg
      });

    if (error) {
      console.error('Error sending message:', error);
      alert('Gagal mengirim pesan');
    } else {
      fetchMessages(currentConsultation.id);
    }
  };

  if (loading && view === 'list') {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-[#689449]">
        <Clock className="w-10 h-10 animate-spin mb-4" />
        <p className="font-bold">Memuat data konsultasi...</p>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500">
      <AnimatePresence mode="wait">
        {view === 'list' && (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {isDoctor ? (
              <div className="space-y-8">
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-[#1c2b13] font-dm-sans">Pasien Aktif</h2>
                  <p className="text-sm text-[#808080]">Daftar pasien yang sedang berkonsultasi dengan Anda</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {activeConsultations.map((cons) => (
                    <div
                      key={cons.id}
                      onClick={() => { setCurrentConsultation(cons); setView('chat'); }}
                      className="bg-white p-6 rounded-[2rem] border border-[#e8e5d8] shadow-sm hover:shadow-md cursor-pointer transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-[#f0f4ec] rounded-full flex items-center justify-center">
                          <UserIcon className="w-6 h-6 text-[#689449]" />
                        </div>
                        <div>
                          <h4 className="font-bold text-[#1c2b13]">{cons.user_profile?.name || 'Pasien'}</h4>
                          <p className="text-[10px] text-[#689449] font-bold uppercase">Paket {cons.package_days} Hari</p>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-[#f0f0f0]">
                        <p className="text-[10px] text-[#a0a0a0] uppercase font-bold">Berakhir pada:</p>
                        <p className="text-xs font-bold">{new Date(cons.expired_at!).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                      </div>
                    </div>
                  ))}
                  {activeConsultations.length === 0 && (
                    <div className="col-span-full py-20 text-center bg-white rounded-[2rem] border border-dashed border-[#e8e5d8]">
                      <p className="text-[#a0a0a0] font-medium">Belum ada pasien aktif saat ini.</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="xl:col-span-12 bg-white rounded-[2.5rem] border border-[#e8e5d8] p-8 shadow-sm">
                <div className="mb-10">
                  <h2 className="text-2xl font-bold text-[#1c2b13] mb-2 font-dm-sans">Semua Dokter Yang Bisa Membantu Kamu</h2>
                  <p className="text-sm text-[#808080] font-medium">Temukan spesialis yang tepat untuk membimbing perjalanan kesehatan kamu</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {doctors.map((dr) => (
                    <div key={dr.id} className="bg-white p-6 rounded-[2rem] border border-[#f0f0f0] shadow-sm hover:shadow-xl transition-all group flex flex-col h-full relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-[#689449]/5 rounded-full blur-3xl -mr-16 -mt-16" />
                      <div className="flex items-center gap-4 mb-6 relative z-10">
                        <img src={dr.image} alt={dr.name} className="w-14 h-14 rounded-2xl object-cover shadow-md" />
                        <div>
                          <p className="text-[10px] font-bold text-[#689449] uppercase tracking-wider">{dr.specialty}</p>
                          <h4 className="text-lg font-bold text-[#1c2b13]">{dr.name}</h4>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 mb-8 relative z-10">
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-[#fefce8] rounded-lg border border-[#fef08a]">
                          <Star className="w-3 h-3 text-[#eab308] fill-[#eab308]" />
                          <span className="text-[10px] font-black text-[#854d0e]">{dr.rating}</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-[#f0f9ff] rounded-lg border border-[#e0f2fe]">
                          <Briefcase className="w-3 h-3 text-[#0369a1]" />
                          <span className="text-[10px] font-black text-[#0369a1]">{dr.experience} Thn</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleSelectDoctor(dr)}
                        className="mt-auto w-full py-3.5 bg-[#689449] text-white rounded-2xl text-[13px] font-bold shadow-lg shadow-[#689449]/20 hover:bg-[#5a853e] transition-all"
                      >
                        Pilih
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {view === 'booking' && (
          <motion.div key="booking" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-4xl mx-auto">
            <div className="bg-white rounded-[2.5rem] border border-[#e8e5d8] p-8 shadow-xl">
              <button onClick={() => setView('list')} className="flex items-center gap-2 text-[#1c2b13] hover:text-[#689449] transition-colors mb-8 group">
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                <span className="text-lg font-bold">Kembali</span>
              </button>

              <div className="flex flex-col md:flex-row gap-8 mb-10">
                <img src={selectedDoctor?.image} alt={selectedDoctor?.name} className="w-32 h-32 rounded-3xl object-cover shadow-lg" />
                <div className="flex-1">
                  <h3 className="text-2xl font-black text-[#1c2b13] mb-1">{selectedDoctor?.name}</h3>
                  <p className="text-[#689449] font-bold uppercase text-xs tracking-widest mb-4">{selectedDoctor?.specialty}</p>
                  <p className="text-sm text-[#808080] font-medium leading-relaxed">Pilih paket konsultasi yang sesuai dengan kebutuhan Anda untuk memulai perjalanan hidup sehat bersama ahlinya.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
                {packages.map((pkg) => (
                  <div
                    key={pkg.id}
                    onClick={() => setSelectedPackage(pkg)}
                    className={`p-6 rounded-3xl border-2 transition-all cursor-pointer ${selectedPackage.id === pkg.id
                      ? 'border-[#689449] bg-[#f0f4ec]'
                      : 'border-[#f0f0f0] hover:border-[#e8e5d8]'
                      }`}
                  >
                    <p className={`text-xs font-bold uppercase tracking-widest mb-2 ${selectedPackage.id === pkg.id ? 'text-[#689449]' : 'text-[#a0a0a0]'}`}>Paket</p>
                    <h4 className="text-lg font-black text-[#1c2b13] mb-4">{pkg.label}</h4>
                    <p className="text-xl font-black text-[#1c2b13]">Rp{pkg.price.toLocaleString('id-ID')}</p>
                  </div>
                ))}
              </div>

              <div className="bg-[#f8faf7] p-8 rounded-[2rem] border border-[#e8e5d8]">
                <h4 className="font-bold text-[#1c2b13] mb-6">Ringkasan Pembayaran</h4>
                <div className="space-y-4 mb-8">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-[#5c5c5c]">Layanan Konsultasi ({selectedPackage.label})</span>
                    <span className="font-bold">Rp{selectedPackage.price.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-[#5c5c5c]">Biaya Administrasi</span>
                    <span className="font-bold">Gratis</span>
                  </div>
                  <div className="pt-4 border-t border-dashed border-[#e8e5d8] flex justify-between items-center">
                    <span className="text-lg font-black">Total Bayar</span>
                    <span className="text-2xl font-black text-[#1c2b13]">Rp{selectedPackage.price.toLocaleString('id-ID')}</span>
                  </div>
                </div>
                <button
                  onClick={handlePayment}
                  className="w-full py-4 bg-[#689449] text-white rounded-2xl text-base font-black shadow-lg shadow-[#689449]/20 hover:bg-[#5a853e] transition-all"
                >
                  Bayar Sekarang
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {view === 'chat' && currentConsultation && (
          <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-5xl mx-auto h-[calc(100vh-180px)] flex flex-col bg-white rounded-[2.5rem] border border-[#e8e5d8] overflow-hidden shadow-xl">
            {/* Chat Header */}
            <div className="p-6 border-b border-[#f0f0f0] flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => { setView('list'); isDoctor ? fetchInitialData() : null; }}
                  className="p-2 hover:bg-[#f0f4ec] rounded-xl transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-[#1c2b13]" />
                </button>
                <div className="flex items-center gap-3">
                  {isDoctor ? (
                    <div className="w-10 h-10 bg-[#f0f4ec] rounded-full flex items-center justify-center">
                      <UserIcon className="w-5 h-5 text-[#689449]" />
                    </div>
                  ) : (
                    <img src={currentConsultation.doctor?.image} alt="Doctor" className="w-10 h-10 rounded-full object-cover" />
                  )}
                  <div>
                    <h4 className="font-bold text-[#1c2b13] leading-tight">
                      {isDoctor ? currentConsultation.user_profile?.name : currentConsultation.doctor?.name}
                    </h4>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-[10px] font-bold text-[#689449] uppercase">Aktif Sekarang</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-[#f0f4ec] px-4 py-2 rounded-full border border-[#689449]/10">
                <p className="text-[10px] font-bold text-[#689449] flex items-center gap-2">
                  <ShieldCheck className="w-3 h-3" /> TERENKRIPSI END-TO-END
                </p>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#f8faf7]/30">
              <div className="text-center mb-8">
                <div className="inline-block px-4 py-1.5 bg-white rounded-full border border-[#e8e5d8] text-[10px] font-bold text-[#a0a0a0] uppercase tracking-widest">
                  Konsultasi Dimulai
                </div>
              </div>

              {messages.map((msg) => {
                const isMine = msg.sender_id === user.id;
                return (
                  <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] p-4 rounded-2xl shadow-sm ${isMine
                      ? 'bg-[#689449] text-white rounded-tr-none'
                      : 'bg-white text-[#1c2b13] border border-[#f0f0f0] rounded-tl-none'
                      }`}>
                      <p className="text-sm leading-relaxed">{msg.message}</p>
                      <p className={`text-[9px] mt-1.5 font-medium ${isMine ? 'text-white/60 text-right' : 'text-[#a0a0a0]'}`}>
                        {new Date(msg.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input */}
            <form onSubmit={sendMessage} className="p-6 bg-white border-t border-[#f0f0f0]">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Ketik pesan Anda di sini..."
                  className="flex-1 bg-[#f8faf7] border border-[#e8e5d8] rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-[#689449] transition-colors"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="p-4 bg-[#689449] text-white rounded-2xl shadow-lg shadow-[#689449]/20 hover:bg-[#5a853e] transition-all disabled:opacity-50 disabled:shadow-none"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};


