import type { User } from '@supabase/supabase-js';
import { LogOut, UserCircle } from 'lucide-react';
import LOGO_SRC from '../assets/BigLogo.webp';

interface NavbarProps {
  user: User | null;
  handleLogout: () => Promise<void>;
  onLoginClick: () => void;
  onPredictClick: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  onDashboardClick: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  onHomeClick: (sectionId?: string) => void;
  currentPage: 'home' | 'login' | 'dashboard';
}

export const Navbar = ({
  user,
  handleLogout,
  onLoginClick,
  onPredictClick,
  onDashboardClick,
  onHomeClick,
  currentPage
}: NavbarProps) => {
  return (
    <nav className="fixed top-0 w-full z-50 bg-[#fff]/90 backdrop-blur-md border-b border-[#e8e5d8] py-4 px-6 md:px-12 flex justify-between items-center">
      {/* Logo */}
      <div className="flex items-center gap-2 md:ml-10">
        <img
          src={LOGO_SRC}
          alt="GulaWise"
          className="h-8 w-auto"
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
        {/* Fallback text logo jika PNG belum ada */}
        <span className="text-xl font-bold text-[#1c2b13] tracking-tight cursor-pointer" onClick={() => onHomeClick()}>
          GulaWise<span className="text-[#1A3C02]">.</span>
        </span>
      </div>

      <div className="hidden md:flex gap-8 text-sm font-medium text-[#3d3d3d]">
        <a
          href="#hero"
          onClick={(e) => { e.preventDefault(); onHomeClick('hero'); }}
          className={`hover:text-[#4a7c3f] transition-colors ${currentPage === 'home' ? 'text-[#4a7c3f] font-bold' : ''}`}
        >
          Home
        </a>
        <a
          href="#about"
          onClick={(e) => { e.preventDefault(); onHomeClick('about'); }}
          className="hover:text-[#4a7c3f] transition-colors"
        >
          About Us
        </a>
        <a href="#predict" onClick={onPredictClick} className="hover:text-[#4a7c3f] transition-colors">Cek Diabetes</a>
        <a href="#dashboard" onClick={onDashboardClick} className={`hover:text-[#4a7c3f] transition-colors ${currentPage === 'dashboard' ? 'text-[#4a7c3f] font-bold' : ''}`}>Dashboard</a>
      </div>

      {/* Auth area */}
      <div className="flex items-center gap-4">
        {user ? (
          <div className="flex items-center gap-3">
            <span className="text-sm text-[#4e5a44] hidden md:block">{user.email}</span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-sm text-[#4e5a44] hover:text-red-500 font-medium transition"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        ) : (
          <button
            onClick={onLoginClick}
            className="hidden md:inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#4a7c3f] text-[#4a7c3f] text-sm font-semibold hover:bg-[#4a7c3f]/5 transition-colors"
          >
            <UserCircle className="w-4 h-4" /> Daftar Akun
          </button>
        )}
      </div>
    </nav>
  );
};
