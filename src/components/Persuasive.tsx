import { motion } from 'framer-motion';

interface PersuasiveProps {
  onPredictClick: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  fadeInUp: any;
}

export const Persuasive = ({ onPredictClick, fadeInUp }: PersuasiveProps) => {
  return (
    <section className="py-[4.8%] px-6 md:px-12 lg:px-24 bg-[#3d5c2a] text-white text-center relative overflow-hidden">
      <motion.div className="max-w-3xl mx-auto relative z-10" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}>
        <h2 className="text-3xl md:text-5xl font-bold mb-12 font-jakarta">Pencegahan dimulai dari kesadaran.</h2>
        <p className="text-xl opacity-90 mb-14 leading-relaxed font-playfair  ">
          "Jutaan orang hidup dengan prediabetes tanpa menyadarinya. Perubahan kecil pada rutinitas harianmu hari ini bisa mengubah arah kesehatanmu secara drastis."
        </p>
        <a
          href="#predict"
          onClick={onPredictClick}
          className="bg-white text-[#3d5c2a] hover:bg-[#f9f8f3] text-lg px-10 py-4 rounded-full font-bold transition shadow-xl inline-block"
        >
          Cek Risiko Sekarang
        </a>
      </motion.div>
    </section>
  );
};
