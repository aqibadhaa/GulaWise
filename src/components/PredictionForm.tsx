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
          <form onSubmit={calculateRisk} className="space-y-12">

            {/* ── 1. Personal Information ───────────────────────────────── */}
            <motion.div className="bg-white p-8 md:p-10 rounded-3xl shadow-sm border border-[#e8e5d8]" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}>
              <h3 className="text-2xl font-bold mb-6 flex items-center gap-3 border-b border-[#e8e5d8] pb-4 text-[#1c2b13]">
                <div className="w-8 h-8 rounded-full bg-[#e4eed9] text-[#3d5c2a] flex items-center justify-center text-sm font-bold">1</div>
                Informasi Pribadi
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-[#4e5a44] mb-2">Usia</label>
                  <input type="number" name="age" min="1" max="120" required className={inputCls} onChange={handleInputChange} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#4e5a44] mb-2">Jenis Kelamin</label>
                  <select name="gender" required className={inputCls} onChange={handleInputChange}>
                    <option value="">Pilih Jenis Kelamin</option>
                    <option value="Female">Perempuan</option>
                    <option value="Male">Laki-laki</option>
                    <option value="Other">Lainnya</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#4e5a44] mb-2">Latar Belakang Etnis</label>
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
                  <label className="block text-sm font-medium text-[#4e5a44] mb-2">Pendidikan Tertinggi</label>
                  <select name="education" required className={inputCls} onChange={handleInputChange}>
                    <option value="">Pilih Pendidikan</option>
                    <option value="Bachelor">Sarjana (S1)</option>
                    <option value="Highschool">SMA / Sederajat</option>
                    <option value="No formal">Tidak Sekolah</option>
                    <option value="Postgraduate">Pascasarjana</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#4e5a44] mb-2">Tingkat Penghasilan</label>
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
                  <label className="block text-sm font-medium text-[#4e5a44] mb-2">Status Pekerjaan</label>
                  <select name="employment" required className={inputCls} onChange={handleInputChange}>
                    <option value="">Pilih Status</option>
                    <option value="Employed">Bekerja</option>
                    <option value="Unemployed">Tidak Bekerja</option>
                    <option value="Student">Pelajar / Mahasiswa</option>
                    <option value="Retired">Pensiunan</option>
                  </select>
                </div>
              </div>
            </motion.div>

            {/* ── 2. Health Measurements ────────────────────────────────── */}
            <motion.div className="bg-white p-8 md:p-10 rounded-3xl shadow-sm border border-[#e8e5d8]" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}>
              <h3 className="text-2xl font-bold mb-6 flex items-center gap-3 border-b border-[#e8e5d8] pb-4 text-[#1c2b13]">
                <div className="w-8 h-8 rounded-full bg-[#e4eed9] text-[#3d5c2a] flex items-center justify-center text-sm font-bold">2</div>
                Pengukuran Kesehatan
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-[#4e5a44] mb-2">Berat Badan (kg)</label>
                  <input type="number" name="weight" step="0.1" min="1" required className={inputCls} onChange={handleInputChange} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#4e5a44] mb-2">Tinggi Badan (cm)</label>
                  <input type="number" name="height" step="0.1" min="1" required className={inputCls} onChange={handleInputChange} />
                </div>

                {bmiPreview && (
                  <div className="md:col-span-2">
                    <div className="bg-[#e4eed9] border border-[#c9ddb8] rounded-xl px-4 py-3 text-sm text-[#3d5c2a] font-medium">
                      📊 BMI terhitung: <strong>{bmiPreview}</strong>
                      {parseFloat(bmiPreview) < 18.5 ? ' — Kekurangan Berat Badan' :
                        parseFloat(bmiPreview) < 25 ? ' — Normal' :
                          parseFloat(bmiPreview) < 30 ? ' — Kelebihan Berat Badan' : ' — Obesitas'}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-[#4e5a44] mb-2">Lingkar Pinggang (cm)</label>
                  <input type="number" name="waist" step="0.1" min="1" required className={inputCls} onChange={handleInputChange} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#4e5a44] mb-2">Lingkar Pinggul (cm)</label>
                  <input type="number" name="hip" step="0.1" min="1" required className={inputCls} onChange={handleInputChange} />
                </div>

                {whrPreview && (
                  <div className="md:col-span-2">
                    <div className="bg-[#e4eed9] border border-[#c9ddb8] rounded-xl px-4 py-3 text-sm text-[#3d5c2a] font-medium">
                      📏 Rasio Pinggang-Pinggul: <strong>{whrPreview}</strong>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-[#4e5a44] mb-2">Rata-rata Jam Tidur / Hari</label>
                  <input type="number" name="sleep" step="0.5" min="0" max="24" required className={inputCls} onChange={handleInputChange} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#4e5a44] mb-2">Rata-rata Screen Time / Hari (jam)</label>
                  <input type="number" name="screenTime" step="0.5" min="0" max="24" className={inputCls} onChange={handleInputChange} />
                </div>
              </div>
            </motion.div>

            {/* ── 3. Lifestyle ─────────────────────────────────────────── */}
            <motion.div className="bg-white p-8 md:p-10 rounded-3xl shadow-sm border border-[#e8e5d8]" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}>
              <h3 className="text-2xl font-bold mb-6 flex items-center gap-3 border-b border-[#e8e5d8] pb-4 text-[#1c2b13]">
                <div className="w-8 h-8 rounded-full bg-[#e4eed9] text-[#3d5c2a] flex items-center justify-center text-sm font-bold">3</div>
                Gaya Hidup
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-[#4e5a44] mb-2">Minuman Alkohol per Minggu</label>
                  <input type="number" name="alcohol" min="0" required className={inputCls} onChange={handleInputChange} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#4e5a44] mb-2">Aktivitas Fisik (menit / minggu)</label>
                  <input type="number" name="exercise" min="0" required className={inputCls} onChange={handleInputChange} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#4e5a44] mb-2">Skor Kualitas Diet (1 – 10)</label>
                  <input type="number" name="diet" min="1" max="10" step="0.1" required className={inputCls} onChange={handleInputChange} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#4e5a44] mb-2">Status Merokok</label>
                  <select name="smoking" required className={inputCls} onChange={handleInputChange}>
                    <option value="">Pilih Status</option>
                    <option value="Never">Tidak Pernah</option>
                    <option value="Former">Mantan Perokok</option>
                    <option value="Current">Perokok Aktif</option>
                  </select>
                </div>
              </div>
            </motion.div>

            {/* ── 4. Medical History ────────────────────────────────────── */}
            <motion.div className="bg-white p-8 md:p-10 rounded-3xl shadow-sm border border-[#e8e5d8]" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}>
              <h3 className="text-2xl font-bold mb-6 flex items-center gap-3 border-b border-[#e8e5d8] pb-4 text-[#1c2b13]">
                <div className="w-8 h-8 rounded-full bg-[#e4eed9] text-[#3d5c2a] flex items-center justify-center text-sm font-bold">4</div>
                Riwayat Medis
              </h3>
              <div className="space-y-6">
                {[
                  { label: 'Apakah ada anggota keluarga yang menderita diabetes?', name: 'familyHistory' },
                  { label: 'Pernahkah kamu didiagnosis tekanan darah tinggi?', name: 'bloodPressure' },
                  { label: 'Apakah kamu memiliki riwayat penyakit kardiovaskular?', name: 'cardiovascular' },
                ].map(q => (
                  <div key={q.name}>
                    <label className="block text-sm font-medium text-[#4e5a44] mb-2">{q.label}</label>
                    <div className="flex gap-6">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name={q.name} value="yes" required className="w-4 h-4 accent-[#3d5c2a]" onChange={handleInputChange} />
                        <span className="text-[#1c2b13]">Ya</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name={q.name} value="no" required className="w-4 h-4 accent-[#3d5c2a]" onChange={handleInputChange} />
                        <span className="text-[#1c2b13]">Tidak</span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* ── Error Banner ─────────────────────────────────────────── */}
            {apiError && (
              <motion.div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-2xl px-6 py-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
                <p className="text-sm">{apiError}</p>
              </motion.div>
            )}

            {/* ── Submit ───────────────────────────────────────────────── */}
            <motion.div className="text-center" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}>
              <button
                type="submit"
                disabled={isLoading}
                className="bg-[#3d5c2a] hover:bg-[#2d4a1e] disabled:opacity-60 disabled:cursor-not-allowed text-white text-xl px-12 py-4 rounded-full font-bold transition shadow-xl w-full md:w-auto flex items-center justify-center gap-3 mx-auto"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Menganalisis...
                  </>
                ) : 'Prediksi Risikonya'}
              </button>
            </motion.div>
          </form>
        )}
      </div>
    </section>
  );
};
