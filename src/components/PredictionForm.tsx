import { motion } from 'framer-motion';
import { Leaf, AlertCircle, CheckCircle } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import type { FormEvent } from 'react';
import type { PredictionResult } from '../types';

interface PredictionFormProps {
  user: User | null;
  formData: any;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  calculateRisk: (e: FormEvent) => Promise<void>;
  isLoading: boolean;
  apiError: string | null;
  onLoginClick: () => void;
  onDashboardClick: () => void;
  userPrediction: PredictionResult | null;
  fadeInUp: any;
  inputCls: string;
}

export const PredictionForm = ({
  user,
  formData,
  handleInputChange,
  calculateRisk,
  isLoading,
  apiError,
  onLoginClick,
  onDashboardClick,
  userPrediction,
  fadeInUp,
  inputCls
}: PredictionFormProps) => {
  const bmiPreview = formData.weight && formData.height
    ? (parseFloat(formData.weight) / Math.pow(parseFloat(formData.height) / 100, 2)).toFixed(1)
    : null;
  const whrPreview = formData.waist && formData.hip
    ? (parseFloat(formData.waist) / parseFloat(formData.hip)).toFixed(3)
    : null;

  return (
    <section id="predict" className="py-24 px-6 md:px-12 lg:px-24 bg-[#f9f8f3] relative">
      <div className="max-w-4xl mx-auto">
        <motion.div className="text-center mb-16" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}>
          <h2 className="text-3xl md:text-5xl font-bold mb-4 text-[#1c2b13]">Prediksi Risiko Diabetes Kamu</h2>
          <p className="text-[#4e5a44] text-lg">Isi formulir berikut dengan cermat untuk hasil prediksi yang paling akurat.</p>
        </motion.div>

        {/* Gate: belum login */}
        {!user ? (
          <motion.div className="text-center py-20 bg-white rounded-3xl border border-[#e8e5d8] shadow-sm" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}>
            <Leaf className="w-16 h-16 text-[#4a7c3f] mx-auto mb-6 opacity-60" />
            <h3 className="text-2xl font-bold mb-3 text-[#1c2b13]">Login Diperlukan</h3>
            <p className="text-[#4e5a44] mb-8 max-w-sm mx-auto">Kamu perlu sign in terlebih dahulu untuk mengakses fitur prediksi.</p>
            <button
              onClick={onLoginClick}
              className="bg-[#3d5c2a] hover:bg-[#2d4a1e] text-white px-8 py-3 rounded-full font-semibold transition shadow-lg"
            >
              Sign In / Daftar
            </button>
          </motion.div>
        ) : userPrediction ? (
          /* Gate: sudah pernah isi */
          <motion.div className="text-center py-20 bg-white rounded-[2.5rem] border border-[#e8e5d8] shadow-sm px-6" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}>
            <div className="w-20 h-20 bg-[#f0f9eb] rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
              <CheckCircle className="w-10 h-10 text-[#689449]" />
            </div>
            <h3 className="text-3xl font-bold mb-4 text-[#1c2b13]">Formulir Sudah Terisi</h3>
            <p className="text-[#4e5a44] mb-10 max-w-lg mx-auto leading-relaxed text-lg">
              Terima kasih sudah mengisi form prediksi sebelumnya. Untuk memantau hasil dan perkembangan kesehatanmu, silakan lanjut ke Dashboard.
            </p>
            <button
              onClick={onDashboardClick}
              className="bg-[#689449] hover:bg-[#2d4a1e] text-white px-10 py-4 rounded-full font-bold transition shadow-xl hover:-translate-y-1"
            >
              Lanjutkan ke Dashboard
            </button>
          </motion.div>
        ) : (
          <form onSubmit={calculateRisk} className="animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="bg-white rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.05)] border border-[#e8e5d8] overflow-hidden">
              {/* Header Utama Kontainer */}
              <div className="p-10 md:p-12 border-b border-[#f3f3f1] bg-[#fafafa]/50">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-3xl font-extrabold text-[#1c2b13] tracking-tight">Mulai Cek Risiko Kamu</h3>
                    <p className="text-[#8a9282] text-lg mt-1">Isi data di bawah untuk melihat estimasi risiko diabetesmu</p>
                  </div>
                  <div className="hidden md:flex w-14 h-14 rounded-2xl bg-[#e4eed9] items-center justify-center text-[#3d5c2a] shadow-inner">
                    <Leaf className="w-8 h-8" />
                  </div>
                </div>
              </div>

              <div className="p-10 md:p-12 space-y-14">
                {/* ── 1. Personal Information ───────────────────────────────── */}
                <section>
                  <h4 className="text-xl font-bold mb-8 text-[#1c2b13] flex items-center gap-3">
                    <div className="w-2 h-6 bg-[#689449] rounded-full" />
                    Informasi Pribadi
                  </h4>
                  <div className="grid md:grid-cols-2 gap-x-10 gap-y-7">
                    <div>
                      <label className="block text-sm font-bold text-[#4e5a44] mb-2.5 ml-1">Usia (tahun)</label>
                      <input type="number" name="age" min="1" max="120" required className={inputCls} onChange={handleInputChange} placeholder="18 / Tahun" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-[#4e5a44] mb-2.5 ml-1">Jenis Kelamin</label>
                      <select name="gender" required className={inputCls} onChange={handleInputChange}>
                        <option value="">Pilih Jenis Kelamin</option>
                        <option value="Female">Perempuan</option>
                        <option value="Male">Laki-laki</option>
                        <option value="Other">Lainnya</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-[#4e5a44] mb-2.5 ml-1">Latar Belakang Etnis</label>
                      <select name="ethnicity" required className={inputCls} onChange={handleInputChange}>
                        <option value="">Pilih Etnis</option>
                        <option value="Asian">Asia</option>
                        <option value="Black">Black</option>
                        <option value="Hispanic">Hispanic</option>
                        <option value="White">White</option>
                        <option value="Other">Lainnya</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-[#4e5a44] mb-2.5 ml-1">Pendidikan Terakhir</label>
                      <select name="education" required className={inputCls} onChange={handleInputChange}>
                        <option value="">Pilih Pendidikan</option>
                        <option value="Bachelor">Sarjana (S1)</option>
                        <option value="Highschool">SMA / Sederajat</option>
                        <option value="No formal">Tidak Sekolah</option>
                        <option value="Postgraduate">Pascasarjana</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-[#4e5a44] mb-2.5 ml-1">Perkiraan Pendapatan</label>
                      <select name="income" required className={inputCls} onChange={handleInputChange}>
                        <option value="">Pilih Penghasilan</option>
                        <option value="High">Tinggi</option>
                        <option value="Upper-Middle">Menengah Atas</option>
                        <option value="Middle">Menengah</option>
                        <option value="Lower-Middle">Menengah Bawah</option>
                        <option value="Low">Rendah</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-[#4e5a44] mb-2.5 ml-1">Status Pekerjaan</label>
                      <select name="employment" required className={inputCls} onChange={handleInputChange}>
                        <option value="">Pilih Status</option>
                        <option value="Employed">Bekerja</option>
                        <option value="Unemployed">Tidak Bekerja</option>
                        <option value="Student">Pelajar / Mahasiswa</option>
                        <option value="Retired">Pensiunan</option>
                      </select>
                    </div>
                  </div>
                </section>

                {/* ── 2. Health Measurements ────────────────────────────────── */}
                <section>
                  <h4 className="text-xl font-bold mb-8 text-[#1c2b13] flex items-center gap-3">
                    <div className="w-2 h-6 bg-[#689449] rounded-full" />
                    Data Kesehatan
                  </h4>
                  <div className="grid md:grid-cols-2 gap-x-10 gap-y-7">
                    <div>
                      <label className="block text-sm font-bold text-[#4e5a44] mb-2.5 ml-1">Berat Badan (kg)</label>
                      <input type="number" name="weight" step="0.1" min="1" required className={inputCls} onChange={handleInputChange} />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-[#4e5a44] mb-2.5 ml-1">Tinggi Badan (cm)</label>
                      <input type="number" name="height" step="0.1" min="1" required className={inputCls} onChange={handleInputChange} />
                    </div>

                    {bmiPreview && (
                      <div className="md:col-span-2">
                        <div className="bg-[#f0f9eb] border border-[#e1f0d7] rounded-2xl px-6 py-5 text-sm text-[#3d5c2a] flex items-center gap-4 shadow-sm">
                          <span className="text-2xl">📊</span>
                          <div>
                            <p className="font-bold text-base">BMI Terhitung: {bmiPreview}</p>
                            <p className="opacity-80">Kategori: {parseFloat(bmiPreview) < 18.5 ? 'Kekurangan Berat Badan' : parseFloat(bmiPreview) < 25 ? 'Normal' : parseFloat(bmiPreview) < 30 ? 'Kelebihan Berat Badan' : 'Obesitas'}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-bold text-[#4e5a44] mb-2.5 ml-1">Lingkar Pinggang (cm)</label>
                      <input type="number" name="waist" step="0.1" min="1" required className={inputCls} onChange={handleInputChange} />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-[#4e5a44] mb-2.5 ml-1">Lingkar Pinggul (cm)</label>
                      <input type="number" name="hip" step="0.1" min="1" required className={inputCls} onChange={handleInputChange} />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-[#4e5a44] mb-2.5 ml-1">Jam Tidur / Hari</label>
                      <input type="number" name="sleep" step="0.5" min="0" max="24" required className={inputCls} onChange={handleInputChange} />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-[#4e5a44] mb-2.5 ml-1">Screen Time / Hari (jam)</label>
                      <input type="number" name="screenTime" step="0.5" min="0" max="24" className={inputCls} onChange={handleInputChange} />
                    </div>
                  </div>
                </section>

                {/* ── 3. Lifestyle ─────────────────────────────────────────── */}
                <section>
                  <h4 className="text-xl font-bold mb-8 text-[#1c2b13] flex items-center gap-3">
                    <div className="w-2 h-6 bg-[#689449] rounded-full" />
                    Gaya Hidup
                  </h4>
                  <div className="grid md:grid-cols-2 gap-x-10 gap-y-7">
                    <div>
                      <label className="block text-sm font-bold text-[#4e5a44] mb-2.5 ml-1">Minuman Alkohol / Minggu</label>
                      <input type="number" name="alcohol" min="0" required className={inputCls} onChange={handleInputChange} />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-[#4e5a44] mb-2.5 ml-1">Aktivitas Fisik (menit/minggu)</label>
                      <input type="number" name="exercise" min="0" required className={inputCls} onChange={handleInputChange} />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-[#4e5a44] mb-2.5 ml-1">Skor Kualitas Diet (1–10)</label>
                      <input type="number" name="diet" min="1" max="10" step="0.1" required className={inputCls} onChange={handleInputChange} />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-[#4e5a44] mb-2.5 ml-1">Status Merokok</label>
                      <select name="smoking" required className={inputCls} onChange={handleInputChange}>
                        <option value="">Pilih Status</option>
                        <option value="Never">Tidak Pernah</option>
                        <option value="Former">Mantan Perokok</option>
                        <option value="Current">Perokok Aktif</option>
                      </select>
                    </div>
                  </div>
                </section>

                {/* ── 4. Medical History ────────────────────────────────────── */}
                <section>
                  <h4 className="text-xl font-bold mb-8 text-[#1c2b13] flex items-center gap-3">
                    <div className="w-2 h-6 bg-[#689449] rounded-full" />
                    Riwayat Medis
                  </h4>
                  <div className="grid md:grid-cols-1 gap-6">
                    {[
                      { label: 'Apakah ada anggota keluarga yang menderita diabetes?', name: 'familyHistory' },
                      { label: 'Pernahkah kamu didiagnosis tekanan darah tinggi?', name: 'bloodPressure' },
                      { label: 'Apakah kamu memiliki riwayat penyakit kardiovaskular?', name: 'cardiovascular' },
                    ].map(q => (
                      <div key={q.name} className="flex flex-col md:flex-row md:items-center justify-between p-8 bg-[#fafafa]/50 rounded-[2rem] border border-[#f0f0f0] hover:bg-[#fafafa] transition-colors">
                        <label className="text-base font-bold text-[#4e5a44] mb-5 md:mb-0 md:max-w-md leading-relaxed">{q.label}</label>
                        <div className="flex gap-4">
                          <label className="flex-1 md:flex-none flex items-center justify-center gap-2 cursor-pointer bg-white border border-[#e8e5d8] px-8 py-3 rounded-2xl hover:border-[#3d5c2a] transition-all has-[:checked]:bg-[#3d5c2a] has-[:checked]:text-white has-[:checked]:shadow-lg shadow-sm">
                            <input type="radio" name={q.name} value="yes" required className="hidden" onChange={handleInputChange} />
                            <span className="font-bold">Ya</span>
                          </label>
                          <label className="flex-1 md:flex-none flex items-center justify-center gap-2 cursor-pointer bg-white border border-[#e8e5d8] px-8 py-3 rounded-2xl hover:border-[#3d5c2a] transition-all has-[:checked]:bg-[#3d5c2a] has-[:checked]:text-white has-[:checked]:shadow-lg shadow-sm">
                            <input type="radio" name={q.name} value="no" required className="hidden" onChange={handleInputChange} />
                            <span className="font-bold">Tidak</span>
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* ── Error Banner ─────────────────────────────────────────── */}
                {apiError && (
                  <div className="flex items-start gap-4 bg-red-50 border border-red-100 text-red-700 rounded-[2rem] px-8 py-5 animate-shake shadow-sm">
                    <AlertCircle className="w-6 h-6 mt-0.5 shrink-0" />
                    <p className="font-medium">{apiError}</p>
                  </div>
                )}

                {/* ── Submit ───────────────────────────────────────────────── */}
                <div className="pt-8">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-[#3d5c2a] hover:bg-[#2d4a1e] disabled:opacity-60 disabled:cursor-not-allowed text-white text-xl py-6 rounded-[2rem] font-black transition-all shadow-[0_20px_40px_rgba(61,92,42,0.2)] hover:shadow-[0_25px_50px_rgba(61,92,42,0.3)] hover:-translate-y-1.5 flex items-center justify-center gap-4 group"
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin w-7 h-7" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                        Menganalisis Data...
                      </>
                    ) : (
                      <>
                        <span>Prediksi Risikonya</span>
                        <Leaf className="w-7 h-7 group-hover:rotate-12 transition-transform" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </form>
        )}
      </div>
    </section>
  );
};
