import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Moon,
  Activity,
  Frown,
  Utensils,
  Edit3,
  ChevronRight,
  Plus,
  HelpCircle,
  Check
} from 'lucide-react';

interface PelacakAktifitasProps {
  onBackToHome: () => void;
}

export const PelacakAktifitas: React.FC<PelacakAktifitasProps> = ({ onBackToHome }) => {
  const [nutrition, setNutrition] = useState({ protein: false, karbo: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-bold">Title</h2>
      </div>

      {/* Main Form Card */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-[#e8e5d8] shadow-sm relative overflow-hidden">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <h3 className="font-bold text-lg text-[#1c2b13]">Catat Aktifitas Hari Ini</h3>
            <Edit3 className="w-4 h-4 text-[#808080]" />
          </div>
          <div className="bg-[#e4eed9] text-[#3d5c2a] text-[10px] font-bold px-3 py-1.5 rounded-full border border-[#c9ddb8] shadow-sm">
            +20 Poin
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Sleep Input */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#1c2b13]">Waktu Tidur</label>
              <HelpCircle className="w-3.5 h-3.5 text-[#a0a0a0]" />
            </div>
            <div className="relative">
              <input
                type="text"
                placeholder="-- jam"
                className="w-full bg-[#f8faf7] border border-[#e8e5d8] rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#689449]/20 transition-all"
              />
            </div>
          </div>

          {/* Activity Input */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#1c2b13]">Aktifitas Fisik</label>
              <HelpCircle className="w-3.5 h-3.5 text-[#a0a0a0]" />
            </div>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <select className="w-full appearance-none bg-[#f8faf7] border border-[#e8e5d8] rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#689449]/20 transition-all">
                  <option>Ringan</option>
                  <option>Berat</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#a0a0a0]">
                  <ChevronRight className="w-4 h-4 rotate-90" />
                </div>
              </div>
              <input
                type="text"
                placeholder="--- menit"
                className="w-1/3 bg-[#f8faf7] border border-[#e8e5d8] rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#689449]/20 transition-all text-center"
              />
            </div>
          </div>

          {/* Stress Input */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#1c2b13]">Tingkat Stress</label>
            </div>
            <input
              type="text"
              placeholder="-- /10 (isi dengan angka dari 1-10)"
              className="w-full bg-[#f8faf7] border border-[#e8e5d8] rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#689449]/20 transition-all"
            />
          </div>

          {/* Nutrition Checkboxes */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#1c2b13]">Aktifitas Fisik</label>
              <HelpCircle className="w-3.5 h-3.5 text-[#a0a0a0]" />
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setNutrition(p => ({ ...p, protein: !p.protein }))}
                className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl border transition-all ${nutrition.protein ? 'bg-[#689449] border-[#689449] text-white' : 'bg-[#f8faf7] border-[#e8e5d8] text-[#5c5c5c]'}`}
              >
                <div className={`w-5 h-5 rounded-md flex items-center justify-center ${nutrition.protein ? 'bg-white/20' : 'bg-[#e8e5d8]'}`}>
                  {nutrition.protein && <Check className="w-3.5 h-3.5 text-white" />}
                </div>
                <span className="text-sm font-bold">Protein</span>
              </button>
              <button
                onClick={() => setNutrition(p => ({ ...p, karbo: !p.karbo }))}
                className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl border transition-all ${nutrition.karbo ? 'bg-[#689449] border-[#689449] text-white' : 'bg-[#f8faf7] border-[#e8e5d8] text-[#5c5c5c]'}`}
              >
                <div className={`w-5 h-5 rounded-md flex items-center justify-center ${nutrition.karbo ? 'bg-white/20' : 'bg-[#e8e5d8]'}`}>
                  {nutrition.karbo && <Check className="w-3.5 h-3.5 text-white" />}
                </div>
                <span className="text-sm font-bold">Karbo</span>
              </button>
            </div>
          </div>
        </div>

        <p className="text-[10px] text-[#a0a0a0] font-medium mb-6">Isi segera dan dapatkan poin hariannya</p>

        <button className="w-full py-5 bg-[#e4eed9] text-[#3d5c2a]/40 font-bold rounded-2xl transition-all border border-[#d4dcc8]/50">
          Simpan Aktifitas
        </button>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
        {/* Sleep Card */}
        <div className="bg-white p-8 rounded-[2rem] border border-[#e8e5d8] shadow-sm flex flex-col items-center group">
          <div className="w-full flex justify-between items-start mb-6">
            <h4 className="font-bold text-[#1c2b13]">Waktu Tidur</h4>
            <Moon className="w-5 h-5 text-[#1c2b13]" />
          </div>
          <div className="w-full h-24 bg-[#f8faf7] rounded-3xl border border-[#e8e5d8] flex items-center px-6 gap-6 mb-2">
            <span className="text-4xl font-bold tracking-tighter">---</span>
            <p className="text-[10px] text-[#808080] font-medium leading-relaxed">Kamu tertidur untuk hari<br />ini</p>
          </div>
        </div>

        {/* Activity Card */}
        <div className="bg-white p-8 rounded-[2rem] border border-[#e8e5d8] shadow-sm flex flex-col items-center group">
          <div className="w-full flex justify-between items-start mb-6">
            <h4 className="font-bold text-[#1c2b13]">Aktifitas Fisik</h4>
            <Activity className="w-5 h-5 text-[#1c2b13]" />
          </div>
          <div className="w-full h-24 bg-[#f8faf7] rounded-3xl border border-[#e8e5d8] flex items-center px-6 gap-6 mb-2">
            <span className="text-4xl font-bold tracking-tighter">---</span>
            <p className="text-[10px] text-[#808080] font-medium leading-relaxed">Beraktifitas fisik untuk hari<br />ini</p>
          </div>
        </div>

        {/* Stress Card */}
        <div className="bg-white p-8 rounded-[2rem] border border-[#e8e5d8] shadow-sm flex flex-col items-center group">
          <div className="w-full flex justify-between items-start mb-6">
            <h4 className="font-bold text-[#1c2b13]">Tingkat Stress</h4>
            <Frown className="w-5 h-5 text-[#1c2b13]" />
          </div>
          <div className="w-full h-24 bg-[#f8faf7] rounded-3xl border border-[#e8e5d8] flex items-center px-6 gap-6 mb-2">
            <span className="text-4xl font-bold tracking-tighter">---</span>
            <p className="text-[10px] text-[#808080] font-medium leading-relaxed">Tingkat stress kamu<br />hari ini</p>
          </div>
        </div>

        {/* Nutrition Card */}
        <div className="bg-white p-8 rounded-[2rem] border border-[#e8e5d8] shadow-sm flex flex-col items-center group">
          <div className="w-full flex justify-between items-start mb-6">
            <h4 className="font-bold text-[#1c2b13]">Gizi Makanan</h4>
            <Utensils className="w-5 h-5 text-[#1c2b13]" />
          </div>
          <div className="w-full h-24 bg-[#f8faf7] rounded-3xl border border-[#e8e5d8] flex items-center px-6 gap-6 mb-2">
            <span className="text-4xl font-bold tracking-tighter">---</span>
            <p className="text-[10px] text-[#808080] font-medium leading-relaxed">Keseimbangan gizi kamu<br />hari ini</p>
          </div>
        </div>
      </div>

      {/* Daily Habits Section */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-[#e8e5d8] shadow-sm mt-4">
        <h3 className="font-bold text-lg mb-2">Kebiasaan Aktifitas Harianmu</h3>
        <p className="text-xs text-[#808080] mb-8">Pola aktivitasmu sehari hari</p>

        <div className="flex flex-col items-center justify-center py-20 border border-dashed border-[#e8e5d8] rounded-[2rem] bg-[#f8faf7]/50 group">
          <div className="w-16 h-16 rounded-2xl bg-white border border-[#e8e5d8] flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform">
            <Plus className="w-6 h-6 text-[#689449]" />
          </div>
          <p className="text-xs font-bold text-[#a0a0a0]">Belum ada data aktifitas harian</p>
          <p className="text-[10px] text-[#808080] mt-1">Catat aktifitasmu hari ini untuk melihat progres!</p>
        </div>
      </div>
    </div>
  );
};

// Removed default export in favor of named export

