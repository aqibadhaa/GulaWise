// Tambahkan ini di paling atas untuk memperbaiki error tipe data di editor
import "@supabase/functions-js/edge-runtime.d.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const {
      durasi_tidur,
      aktivitas_ringan,
      aktivitas_berat,
      gizi_protein,
      gizi_karbo,
      gizi_serat,
      gizi_cairan,
      stress,
      nama,
    } = body;

    // Bangun context gizi
    const giziList = [];
    if (gizi_protein) giziList.push("protein");
    if (gizi_karbo) giziList.push("karbohidrat");
    if (gizi_serat) giziList.push("serat");
    if (gizi_cairan) giziList.push("cairan/hidrasi");

    const giziTerpenuhi = giziList.length > 0
      ? `Gizi yang terpenuhi hari ini: ${giziList.join(", ")}.`
      : "Tidak ada gizi yang terpenuhi hari ini.";

    const prompt = `
Kamu adalah asisten kesehatan yang ramah dan peduli. Berikan rekomendasi kesehatan personal berdasarkan data aktivitas harian berikut untuk pengguna bernama ${nama ?? "pengguna"}.

Data kesehatan hari ini:
- Durasi tidur: ${durasi_tidur} jam
- Aktivitas ringan: ${aktivitas_ringan} menit
- Aktivitas berat: ${aktivitas_berat} menit
- ${giziTerpenuhi}
- Tingkat stres: ${stress}/10

Pedoman kesehatan WHO:
- Tidur ideal: 7-9 jam per malam
- Aktivitas fisik: minimal 150 menit/minggu aktivitas sedang ATAU 75 menit/minggu aktivitas berat
- Gizi seimbang: protein, karbohidrat, serat, dan cairan harus terpenuhi setiap hari
- Stres: skor di atas 7 perlu perhatian khusus

Berikan respons dalam format berikut:
1. Sapa pengguna secara personal dan ringkas kondisi hari ini dalam 1-2 kalimat.
2. Evaluasi singkat tiap aspek (tidur, aktivitas, gizi, stres).
3. Saran konkret untuk besok (minimal 3 saran spesifik).

Gunakan bahasa Indonesia yang hangat, personal, dan memotivasi. Jangan terlalu panjang.
    `.trim();

    const apiKey = Deno.env.get("GROQ_API_KEY");
    if (!apiKey) {
      throw new Error("GROQ_API_KEY is not set");
    }

    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 800,
        temperature: 0.7,
      }),
    });

    const groqData = await groqRes.json();
    const recommendation = groqData.choices?.[0]?.message?.content ?? "Gagal mendapatkan rekomendasi.";

    return new Response(JSON.stringify({ recommendation }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
