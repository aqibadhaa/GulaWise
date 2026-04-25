import { motion } from 'framer-motion';
import { ShieldCheck, Stethoscope, Activity } from 'lucide-react';

interface AboutUsProps {
  fadeInUp: any;
  onCekRisikoClick: () => void;
  onTrackerClick: () => void;
}

export const AboutUs = ({ fadeInUp, onCekRisikoClick, onTrackerClick }: AboutUsProps) => {
  const cards = [
    {
      icon: <Stethoscope className="w-6 h-6" />,
      title: 'Konsultasi dengan Dokter',
      desc: 'Dapatkan arahan awal dan edukasi kesehatan dari tenaga profesional untuk membantu kamu mengambil keputusan yang lebih tepat.',
      iconColor: 'bg-[#55828b]',
      iconText: 'text-white'
    },
    {
      icon: <Activity className="w-6 h-6" />,
      title: 'Cek Risiko Diabetes',
      desc: 'Dapatkan estimasi risiko diabetes berdasarkan data gaya hidup, aktivitas, dan pola tidur yang kamu input secara cepat dan mudah.',
      iconColor: 'bg-[#fff] border border-[#eee]',
      iconText: 'text-[#689449]'
    },
    {
      icon: <ShieldCheck className="w-6 h-6" />,
      title: 'Sleep & Health Tracker',
      desc: 'Pantau pola tidur dan kebiasaan harian untuk memahami faktor yang memengaruhi kondisi kesehatanmu dari waktu ke waktu.',
      iconColor: 'bg-[#8d4944]',
      iconText: 'text-white'
    },
  ];

  return (
    <section id="about" className="py-24 px-6 md:px-12 lg:px-24 bg-white relative font-jakarta">
      <motion.div
        className="max-w-4xl mx-auto text-center mb-20"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
        variants={fadeInUp}
      >
        <h2 className="text-4xl md:text-5xl font-bold mb-8 text-[#1c2b13] font-jakarta">
          Semua yang Kamu Butuhkan<br />untuk Kesehatanmu
        </h2>
        <p className="max-w-2xl mx-auto text-lg text-[#4e5a44] opacity-80 leading-relaxed font-jakarta">
          Dengan GulaWise, kamu bisa cek risiko diabetes, memantau pola hidup, dan memahami kondisi kesehatanmu.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-10 max-w-[1400px] mx-auto">
        {cards.map((item, i) => (
          <motion.div
            key={i}
            className="group relative bg-[#fff] p-10 rounded-[1.5rem] border border-[#e8e5d8] overflow-hidden transition-all duration-500 hover:bg-[#689449] hover:border-[#689449] hover:border-b-[6px] hover:border-r-[6px] hover:border-b-[#43612f] hover:border-r-[#43612f] hover:-translate-y-2 hover:shadow-2xl flex flex-col h-full"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.15 }}
          >
            {/* Diagonal Sheen Effect */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none bg-gradient-to-br from-white/20 via-transparent to-transparent rotate-12 -translate-y-full group-hover:translate-y-0 transition-transform duration-1000" />
            <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500 pointer-events-none bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.3)_50%,transparent_75%)] bg-[length:250%_250%] animate-[shimmer_2s_infinite]" />

            {/* Icon */}
            <div className={`relative z-10 w-14 h-14 rounded-full flex items-center justify-center mb-8 transition-colors duration-500 ${i === 1 ? 'bg-[#fff]' : item.iconColor} group-hover:bg-[#fff]`}>
              <div className={`transition-colors duration-500 ${i === 1 ? item.iconText : item.iconText} group-hover:text-[#689449]`}>
                {item.icon}
              </div>
            </div>

            {/* Content */}
            <div className="relative z-10 flex flex-col h-full">
              <h3 className="text-2xl font-bold mb-4 text-[#1c2b13] group-hover:text-white transition-colors duration-500 font-satoshi">
                {item.title}
              </h3>
              <p className="text-[#4e5a44] group-hover:text-white/90 transition-colors duration-500 leading-relaxed mb-10 font-jakarta">
                {item.desc}
              </p>

              {/* Action */}
              <div className="mt-auto">
                <button
                  onClick={() => {
                    if (i === 1) onCekRisikoClick();
                    if (i === 2) onTrackerClick();
                  }}
                  className="px-8 py-2.5 rounded-full border border-[#1c2b13]/40 text-[#1c2b13] font-semibold group-hover:border-white group-hover:text-white transition-all duration-500 hover:bg-white hover:text-[#689449]"
                >
                  Coba Sekarang
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};
