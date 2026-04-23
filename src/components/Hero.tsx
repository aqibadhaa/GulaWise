import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import DASHBOARD_MOCKUP from '../assets/mockUpHero.webp';

interface HeroProps {
  onPredictClick: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  fadeInUp: any;
}

export const Hero = ({ onPredictClick, fadeInUp }: HeroProps) => {
  return (
    <section id="hero" className="relative min-h-screen flex items-center pt-16 overflow-hidden">
      {/* Background decorative blobs */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -right-32 w-[520px] h-[520px] rounded-full bg-[#c9ddb8] opacity-30 blur-[120px]" />
        <div className="absolute bottom-0 -left-24 w-[420px] h-[420px] rounded-full bg-[#d9e8c8] opacity-25 blur-[100px]" />
        {/* Watermark leaves */}
        <svg viewBox="0 0 900 600" className="absolute top-0 right-0 w-[55%] h-auto opacity-[0.045] text-[#2d5016]" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="700" cy="120" rx="180" ry="60" transform="rotate(-30 700 120)" />
          <ellipse cx="760" cy="200" rx="160" ry="50" transform="rotate(-15 760 200)" />
          <ellipse cx="650" cy="260" rx="200" ry="55" transform="rotate(-45 650 260)" />
        </svg>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-3 md:px-12 w-full flex flex-col md:flex-row items-center gap-20 -py-10">
        {/* Left: Text */}
        <motion.div className="flex-1 flex flex-col gap-6 md:-ml-10 xl:-ml-2 2xl:-ml-20 max-w-2xl font-satoshi" initial="hidden" animate="visible" variants={fadeInUp}>
          <motion.h1 variants={fadeInUp} className="text-5xl md:text-6xl font-bold leading-[1.1] tracking-tight text-[#1c2b13] font-jakarta">
            Kenali Risiko Diabetes<br />&amp; Mulai Perubahan
          </motion.h1>
          <motion.p variants={fadeInUp} className="text-base md:text-lg text-[#4e5a44] leading-relaxed md:mb-12 font-jakarta">
            Dapatkan estimasi risiko diabetes berdasarkan gaya hidup, pola aktivitas, dan kualitas tidur kamu.
          </motion.p>
          <motion.div variants={fadeInUp}>
            <a
              href="#predict"
              onClick={onPredictClick}
              className="inline-flex items-center gap-3 bg-[#689449] hover:bg-[#2d4a1e] text-white text-base font-semibold px-7 py-3.5 rounded-full transition-colors shadow-lg"
            >
              Cek Risiko Kamu
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-white/20">
                <ChevronDown className="w-4 h-4" />
              </span>
            </a>
          </motion.div>
        </motion.div>

        {/* Right: iPad mockup */}
        <motion.div
          className="flex-1 justify-end hidden md:flex md:-mr-32 md:mt-14"
          initial={{ opacity: 0, x: 48 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="relative w-full max-w-[720px]">
            {/* Tablet frame */}
            <div
              className="relative rounded-[2rem] overflow-hidden bg-transparent"
              style={{ aspectRatio: '10/10', scale: '1.14' }}
            >
              <img
                src={DASHBOARD_MOCKUP}
                alt="GulaWise dashboard preview"
                className="w-full h-full object-cover object-top "
              />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
