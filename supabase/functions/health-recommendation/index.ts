import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log('body.messages:', JSON.stringify(body.messages));
    // Mode chat: terima array messages langsung
    if (body.messages) {
      const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${Deno.env.get("GROQ_API_KEY")}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: body.messages,
          max_tokens: 800,
          temperature: 0.7,
        }),
      });

      const groqData = await groqRes.json();
      const recommendation = groqData.choices?.[0]?.message?.content ?? "Gagal mendapatkan respons.";

      return new Response(JSON.stringify({ recommendation }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Mode awal: generate rekomendasi dari data tracker
    const {
      nama,
      durasi_tidur,
      aktivitas_ringan,
      aktivitas_berat,
      gizi_protein,
      gizi_karbo,
      gizi_serat,
      gizi_cairan,
      stress,
    } = body;

    const giziTerpenuhi: string[] = [];
    const giziKurang: string[] = [];

    if (gizi_protein) giziTerpenuhi.push("protein"); else giziKurang.push("protein");
    if (gizi_karbo) giziTerpenuhi.push("karbohidrat"); else giziKurang.push("karbohidrat");
    if (gizi_serat) giziTerpenuhi.push("serat"); else giziKurang.push("serat");
    if (gizi_cairan) giziTerpenuhi.push("cairan/hidrasi"); else giziKurang.push("cairan/hidrasi");

    const giziContext = giziTerpenuhi.length > 0
      ? `Gizi terpenuhi: ${giziTerpenuhi.join(", ")}. ${giziKurang.length > 0 ? `Gizi belum terpenuhi: ${giziKurang.join(", ")}.` : "Semua gizi terpenuhi!"}`
      : "Tidak ada gizi yang terpenuhi hari ini.";

    const systemPrompt = `Kamu adalah asisten kesehatan GulaWise yang ramah, personal, dan peduli. Kamu membantu pengguna memahami kondisi kesehatan hariannya dan memberikan saran yang memotivasi. Gunakan bahasa Indonesia yang hangat dan tidak menghakimi. Jawab pertanyaan follow-up secara singkat dan relevan.`;

    const userPrompt = `Berikan rekomendasi kesehatan personal berdasarkan data aktivitas harian berikut untuk pengguna bernama ${nama}.

Data kesehatan hari ini:
- Durasi tidur: ${durasi_tidur} jam
- Aktivitas ringan (jalan kaki, naik tangga, dll): ${aktivitas_ringan} menit
- Aktivitas berat (badminton, futsal, gym, dll): ${aktivitas_berat} menit
- ${giziContext}
- Tingkat stres: ${stress}/10

Pedoman kesehatan WHO:
- Tidur ideal: 7-9 jam per malam
- Aktivitas fisik ringan: minimal 30 menit/hari
- Aktivitas fisik berat: minimal 75 menit/minggu
- Gizi seimbang: protein, karbohidrat, serat, dan cairan harus terpenuhi setiap hari
- Stres: skor di atas 7 perlu perhatian khusus

Tulis respons dengan format:
1. Sapa ${nama} dan ringkas kondisi hari ini dalam 1-2 kalimat menggunakan data spesifik
2. Evaluasi singkat setiap aspek yang perlu diperhatikan
3. Minimal 3 saran konkret dan spesifik untuk besok`;

    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get("GROQ_API_KEY")}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
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