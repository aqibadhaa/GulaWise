import { motion } from 'framer-motion';
import type { User } from '@supabase/supabase-js';
import type { PredictionResult } from '../types';

interface PredictionResultViewProps {
  prediction: PredictionResult;
  user: User | null;
}

export const PredictionResultView = ({ prediction, user }: PredictionResultViewProps) => {
  if (!prediction || !user) return null;

  return (
    <motion.div
      id="result"
      className="mt-16 p-10 bg-gradient-to-br from-[#e4eed9] to-white rounded-3xl shadow-2xl border border-[#c9ddb8] text-center relative overflow-hidden"
      initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
    >
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#4a7c3f] opacity-10 rounded-full blur-2xl" />
      <h3 className="text-3xl font-bold mb-8 text-[#1c2b13]">Hasil Asesmen Kamu</h3>
      <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#e8e5d8] flex flex-col items-center justify-center">
          <span className="text-[#4e5a44] font-medium uppercase tracking-wider text-xs mb-2">Probabilitas</span>
          <span className="text-5xl font-extrabold" style={{ color: prediction.risk_color }}>
            {prediction.probability_percent}%
          </span>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#e8e5d8] flex flex-col items-center justify-center">
          <span className="text-[#4e5a44] font-medium uppercase tracking-wider text-xs mb-2">Tingkat Risiko</span>
          <span className="text-3xl font-extrabold" style={{ color: prediction.risk_color }}>
            {prediction.risk_level}
          </span>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#e8e5d8] flex flex-col items-center justify-center">
          <span className="text-[#4e5a44] font-medium uppercase tracking-wider text-xs mb-2">Prediksi</span>
          <span className="text-2xl font-extrabold" style={{ color: prediction.risk_color }}>
            {prediction.prediction === 1 ? '⚠️ Berisiko' : '✅ Risiko Rendah'}
          </span>
        </div>
      </div>
      <div className="mt-8 bg-white rounded-2xl px-6 py-4 max-w-xl mx-auto border border-[#e8e5d8]">
        <p className="text-[#1c2b13] font-medium">💡 {prediction.advice}</p>
      </div>
      <p className="mt-6 text-[#4e5a44] max-w-xl mx-auto text-xs">
        *Ini adalah estimasi model prediktif, bukan diagnosis medis. Konsultasikan dengan tenaga kesehatan untuk saran medis yang akurat.
      </p>
    </motion.div>
  );
};
