import LOGO_SRC from '../assets/LogoNew.webp';

export const Footer = () => {
  return (
    <footer className="bg-white border-t border-[#e8e5d8] py-6 px-6 text-center">
      <div className="flex justify-center items-center gap-2 mb-4">
        <img src={LOGO_SRC} alt="GulaWise" className="h-9 w-auto" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
        <span className="text-xl font-bold text-[#4a7c3f]">
          GulaWise<span className="text-[#4a7c3f]">.</span>
        </span>
      </div>
      <p className="text-[#1c2b13] text-sm">© {new Date().getFullYear()} GulaWise. Prediksi Risiko Diabetes Berbasis AI. Hak cipta dilindungi.</p>
    </footer>
  );
};
