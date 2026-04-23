const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json();
    console.log("DATA DARI WEB:", JSON.stringify(body));

    const { order_id, amount, customer_email, customer_name, doctor_name } = body;

    // Validasi data dasar
    if (!amount || !order_id || !customer_email) {
      console.error("ERROR: Data tidak lengkap!", { amount, order_id, customer_email });
      return new Response(JSON.stringify({ error: "Data transaksi tidak lengkap" }), { status: 400, headers: corsHeaders });
    }

    const serverKey = Deno.env.get("MIDTRANS_SERVER_KEY");
    const encodedKey = btoa(`${serverKey}:`);

    const payload = {
      transaction_details: {
        order_id: order_id,
        gross_amount: Math.floor(Number(amount)),
      },
      customer_details: {
        first_name: customer_name || "Customer",
        email: customer_email,
      },
      item_details: [
        {
          id: "KONSULTASI-001",
          price: Math.floor(Number(amount)),
          quantity: 1,
          name: `Konsultasi ${doctor_name || "Dokter"}`.slice(0, 50),
        },
      ],
    };

    console.log("Kirim ke Midtrans...");
    const response = await fetch("https://app.sandbox.midtrans.com/snap/v1/transactions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Basic ${encodedKey}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    console.log("Hasil Midtrans:", JSON.stringify(data));

    if (response.ok && data.token) {
      return new Response(JSON.stringify({ token: data.token, redirect_url: data.redirect_url }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else {
      return new Response(JSON.stringify({ error: data.error_messages?.join(", ") || "Gagal membuat transaksi", detail: data }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

  } catch (err) {
    console.error("ERROR CRASH:", err.message);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});
