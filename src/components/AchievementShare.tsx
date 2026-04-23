import React, { useRef, useState } from 'react';
import { Camera, Download, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

      // --- Draw Badge ---
      const isTop3 = rank <= 3;
      const badgeColor = rank === 1 ? '#eab308' : rank === 2 ? '#94a3b8' : rank === 3 ? '#b45309' : '#689449';
      
      const badgeX = 60;
      const badgeY = canvasSize - 160;
      const badgeWidth = 420;
      const badgeHeight = 70;
      
      // Draw rounded badge
      ctx.fillStyle = badgeColor;
      const r = 35;
      ctx.beginPath();
      ctx.moveTo(badgeX + r, badgeY);
      ctx.lineTo(badgeX + badgeWidth - r, badgeY);
      ctx.quadraticCurveTo(badgeX + badgeWidth, badgeY, badgeX + badgeWidth, badgeY + r);
      ctx.lineTo(badgeX + badgeWidth, badgeY + badgeHeight - r);
      ctx.quadraticCurveTo(badgeX + badgeWidth, badgeY + badgeHeight, badgeX + badgeWidth - r, badgeY + badgeHeight);
      ctx.lineTo(badgeX + r, badgeY + badgeHeight);
      ctx.quadraticCurveTo(badgeX, badgeY + badgeHeight, badgeX, badgeY + badgeHeight - r);
      ctx.lineTo(badgeX, badgeY + r);
      ctx.quadraticCurveTo(badgeX, badgeY, badgeX + r, badgeY);
      ctx.closePath();
      ctx.fill();

      // Text on Badge
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 28px Inter, sans-serif';
      ctx.textAlign = 'center';
      const badgeText = isTop3 ? `TOP ${rank} HEALTHY IN ${city.toUpperCase()}` : `HEALTHY CITIZEN OF ${city.toUpperCase()}`;
      ctx.fillText(badgeText, badgeX + (badgeWidth / 2), badgeY + 45);

      // --- Draw Stats ---
      ctx.textAlign = 'right';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 84px Inter, sans-serif';
      ctx.fillText(`${points}`, canvasSize - 60, canvasSize - 100);
      
      ctx.font = 'bold 24px Inter, sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.fillText('POINTS ACCUMULATED', canvasSize - 60, canvasSize - 60);

      // --- Draw Branding ---
      ctx.textAlign = 'left';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 42px Inter, sans-serif';
      ctx.fillText('GulaWise.', 60, 100);
      
      ctx.font = '24px Inter, sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.fillText(userName, 60, canvasSize - 60);

      setProcessedImage(canvas.toDataURL('image/png'));
      setIsProcessing(false);
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
    <div className="mt-10 bg-[#f8faf7] p-6 rounded-[2.5rem] border border-[#e8e5d8]">
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
            className="relative group rounded-[2rem] overflow-hidden shadow-2xl"
          >
            <img src={processedImage} alt="Preview" className="w-full h-auto" />
            
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center gap-4">
              <button
                onClick={downloadImage}
                className="flex items-center gap-2 px-8 py-4 bg-white text-[#689449] rounded-2xl font-bold shadow-xl hover:scale-105 transition-transform"
              >
                <Download className="w-6 h-6" />
                Simpan Gambar
              </button>
              <button
                onClick={() => {
                  setProcessedImage(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="text-white/60 hover:text-white text-sm font-medium transition-colors"
              >
                Ganti Foto
              </button>
            </div>
            
            <div className="absolute top-6 left-6 bg-white/20 backdrop-blur-xl px-4 py-1.5 rounded-full border border-white/30 text-xs text-white font-bold flex items-center gap-2">
              <div className="w-2 h-2 bg-[#689449] rounded-full animate-pulse" />
              SIAP DIBAGIKAN
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!processedImage && !isProcessing && (
        <div className="border-2 border-dashed border-[#e8e5d8] rounded-[2rem] h-64 flex flex-col items-center justify-center text-[#a0a0a0] bg-white/50">
          <Camera className="w-12 h-12 mb-3 opacity-30" />
          <p className="text-sm font-medium">Belum ada foto yang dipilih</p>
        </div>
      )}

      {isProcessing && (
        <div className="h-64 flex flex-col items-center justify-center text-[#689449]">
          <div className="w-10 h-10 border-4 border-[#689449] border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-sm font-bold">Sedang memproses foto...</p>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default AchievementShare;
