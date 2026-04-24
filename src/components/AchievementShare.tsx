import React, { useRef, useState } from 'react';
import { Camera, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import LOGO_SRC from '../assets/LogoNew.webp';

interface AchievementShareProps {
  rank: number;
  points: number;
  city: string;
  userName: string;
}

const AchievementShare: React.FC<AchievementShareProps> = ({ rank, points, city, userName }) => {
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        processImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const processImage = (imageSrc: string) => {
    setIsProcessing(true);
    const img = new Image();
    img.src = imageSrc;

    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Set canvas size (Standard Square for Social Media)
      const canvasSize = 1080;
      canvas.width = canvasSize;
      canvas.height = canvasSize;

      // Draw original image with cover effect
      const scale = Math.max(canvasSize / img.width, canvasSize / img.height);
      const x = (canvasSize / 2) - (img.width / 2) * scale;
      const y = (canvasSize / 2) - (img.height / 2) * scale;
      ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

      // Add Overlay Gradient at bottom
      const gradient = ctx.createLinearGradient(0, canvasSize * 0.6, 0, canvasSize);
      gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0.85)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, canvasSize * 0.5, canvasSize, canvasSize * 0.5);

      // --- Draw Branding (Top Left) ---
      const logoImg = new Image();
      logoImg.src = LOGO_SRC;
      logoImg.onload = () => {
        ctx.drawImage(logoImg, 60, 60, 60, 60);
        ctx.textAlign = 'left';
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 32px Inter, sans-serif';
        ctx.fillText('Dibuat oleh GulaWise', 135, 100);

        // --- Helper: Wrap Text Function ---
        const wrapText = (context: CanvasRenderingContext2D, text: string, maxWidth: number) => {
          const words = text.split(' ');
          const lines = [];
          let currentLine = words[0];

          for (let i = 1; i < words.length; i++) {
            const word = words[i];
            const width = context.measureText(currentLine + " " + word).width;
            if (width < maxWidth) {
              currentLine += " " + word;
            } else {
              lines.push(currentLine);
              currentLine = word;
            }
          }
          lines.push(currentLine);
          return lines;
        };

        // --- Susun Elemen dari Bawah ke Atas (Mepet Kiri Bawah) ---
        const marginLeft = 60;
        const marginBottom = 80;

        // 1. Paling Bawah: Rank Badge (Peringkat)
        const rankY = canvasSize - marginBottom;
        const rankText = `Top ${rank} Di ${city}`;

        // Draw Trophy Icon
        ctx.save();
        ctx.translate(marginLeft, rankY - 32);
        ctx.fillStyle = '#ffffff';
        const p = new Path2D("M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55.45 1 1 1h2c.55 0 1-.45 1-1v-2.34M12 2v11a5 5 0 0 1-5-5V4c0-1.1.9-2 2-2h6c1.1 0 2 .9 2 2v4a5 5 0 0 1-5 5");
        ctx.scale(1.5, 1.5);
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke(p);
        ctx.restore();

        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'left';
        ctx.font = 'bold 36px Inter, sans-serif';
        ctx.fillText(rankText, marginLeft + 55, rankY);

        // 2. Di Atas Rank: Nama User (Multi-line)
        const nameMaxWidth = 650; // Supaya ngga tabrakan sama poin di kanan
        let nameFontSize = 90;
        ctx.font = `bold ${nameFontSize}px Inter, sans-serif`;

        let lines = wrapText(ctx, userName, nameMaxWidth);
        // Kalau barisnya kebanyakan, kecilkan font
        if (lines.length > 2) {
          nameFontSize = 70;
          ctx.font = `bold ${nameFontSize}px Inter, sans-serif`;
          lines = wrapText(ctx, userName, nameMaxWidth);
        }

        const nameLineHeight = nameFontSize * 1.1;
        const nameBaseY = rankY - 70; // Jarak dari rank ke baris terakhir nama

        lines.reverse().forEach((line, index) => {
          ctx.fillText(line.trim(), marginLeft, nameBaseY - (index * nameLineHeight));
        });

        // 3. Paling Atas: Secondary Badge (Konsisten Menjaga Kesehatan)
        const totalNameHeight = lines.length * nameLineHeight;
        const secBadgeY = nameBaseY - totalNameHeight - 80;
        const secBadgeX = marginLeft;
        const secBadgeWidth = 480;
        const secBadgeHeight = 75;

        // Glassmorphism effect
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        const r2 = 38;
        ctx.beginPath();
        ctx.moveTo(secBadgeX + r2, secBadgeY);
        ctx.lineTo(secBadgeX + secBadgeWidth - r2, secBadgeY);
        ctx.quadraticCurveTo(secBadgeX + secBadgeWidth, secBadgeY, secBadgeX + secBadgeWidth, secBadgeY + r2);
        ctx.lineTo(secBadgeX + secBadgeWidth, secBadgeY + secBadgeHeight - r2);
        ctx.quadraticCurveTo(secBadgeX + secBadgeWidth, secBadgeY + secBadgeHeight, secBadgeX + secBadgeWidth - r2, secBadgeY + secBadgeHeight);
        ctx.lineTo(secBadgeX + r2, secBadgeY + secBadgeHeight);
        ctx.quadraticCurveTo(secBadgeX, secBadgeY + secBadgeHeight, secBadgeX, secBadgeY + secBadgeHeight - r2);
        ctx.lineTo(secBadgeX, secBadgeY + r2);
        ctx.quadraticCurveTo(secBadgeX, secBadgeY, secBadgeX + r2, secBadgeY);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 30px Inter, sans-serif';
        ctx.fillText('Konsisten Menjaga Kesehatan', secBadgeX + 35, secBadgeY + 48);

        // --- Poin (Tetap di Kanan Bawah tapi ngga ketabrak nama) ---
        ctx.textAlign = 'right';
        ctx.font = 'bold 120px Inter, sans-serif';
        ctx.fillText(`${points}`, canvasSize - 60, canvasSize - 100);

        ctx.font = 'bold 32px Inter, sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.fillText('Poin dikumpulkan', canvasSize - 60, canvasSize - 60);

        setProcessedImage(canvas.toDataURL('image/png'));
        setIsProcessing(false);
      };
    };
  };

  const downloadImage = () => {
    if (!processedImage) return;
    const link = document.createElement('a');
    link.download = `GulaWise-Achievement-${userName}.png`;
    link.href = processedImage;
    link.click();
  };

  return (
    <div className="mt-10 bg-[#ffff] p-6 rounded-[2.5rem] border border-[#e8e5d8]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h4 className="text-lg font-bold text-[#1c2b13]">Bagikan Pencapaianmu</h4>
          <p className="text-xs text-[#808080]">Upload foto olahragamu dan dapatkan badge spesial ala Strava!</p>
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 px-6 py-3 bg-[#689449] text-white rounded-2xl text-sm font-bold hover:bg-[#5a803f] transition-all shadow-md active:scale-95"
        >
          <Camera className="w-5 h-5" />
          Pilih Foto
        </button>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageUpload}
        accept="image/*"
        className="hidden"
      />

      <AnimatePresence>
        {processedImage && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative group rounded-[2rem] overflow-hidden shadow-2xl border-8 border-white"
          >
            <img src={processedImage} alt="Preview" className="w-full h-auto" />

            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center gap-4">
              <button
                onClick={() => {
                  setProcessedImage(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="bg-white/20 backdrop-blur-md hover:bg-white/40 text-white px-6 py-2 rounded-full text-xs font-bold transition-all"
              >
                Ganti Foto
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!processedImage && !isProcessing && (
        <div className="border-2 border-dashed border-[#e8e5d8] rounded-[2rem] h-80 flex flex-col items-center justify-center text-[#a0a0a0] bg-white/50 group hover:border-[#689449] transition-colors cursor-pointer" onClick={() => fileInputRef.current?.click()}>
          <div className="w-16 h-16 bg-[#e1f2dd] rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Camera className="w-8 h-8 text-[#1c2b13] opacity-60" />
          </div>
          <p className="text-sm font-bold text-[#4e5a44]">Klik untuk pilih foto olahragamu</p>
          <p className="text-[10px] mt-1 opacity-60">Format PNG atau JPG (Maks 5MB)</p>
        </div>
      )}

      {isProcessing && (
        <div className="h-80 flex flex-col items-center justify-center text-[#689449]">
          <div className="w-10 h-10 border-4 border-[#689449] border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-sm font-bold">Sedang memproses foto...</p>
        </div>
      )}

      {/* Social Share & Download Section */}
      <div className="mt-8 pt-6 border-t border-[#e8e5d8]">
        <p className="text-xs font-bold text-[#4e5a44] mb-4">Bagikan lewat:</p>
        <div className="flex items-center gap-3">
          <button
            disabled={!processedImage}
            onClick={() => {
              window.open('https://www.instagram.com/', '_blank');
            }}
            className="w-14 h-14 rounded-2xl border border-[#e8e5d8] bg-white flex items-center justify-center transition-all hover:border-pink-500 hover:text-pink-500 disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed group"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7 group-hover:scale-110 transition-transform">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
            </svg>
          </button>

          <button
            disabled={!processedImage}
            onClick={() => {
              const text = encodeURIComponent(`Lihat pencapaian kesehatanku di GulaWise! Aku berada di Top ${rank} di ${city} dengan ${points} poin!`);
              window.open(`https://wa.me/?text=${text}`, '_blank');
            }}
            className="w-14 h-14 rounded-2xl border border-[#e8e5d8] bg-white flex items-center justify-center transition-all hover:border-green-500 hover:text-green-500 disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed group"
          >
            <svg viewBox="0 0 24 24" className="w-7 h-7 fill-current group-hover:scale-110 transition-transform">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
          </button>

          <button
            onClick={downloadImage}
            disabled={!processedImage}
            className="flex-1 bg-white hover:bg-gray-50 text-[#1c2b13] border border-[#e8e5d8] py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            <Download className="w-5 h-5 group-hover:translate-y-0.5 transition-transform" />
            Unduh Gambar
          </button>
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default AchievementShare;
