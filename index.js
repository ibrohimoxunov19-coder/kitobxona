// cloudflare-worker/index.js
// Bu faylni Cloudflare Workers ga deploy qiling
// https://workers.cloudflare.com

const BOT_TOKEN = "YOUR_TELEGRAM_BOT_TOKEN"; // @BotFather dan oling

addEventListener("fetch", event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  // CORS headers
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  try {
    const { telegramId, channelId } = await request.json();

    if (!telegramId || !channelId) {
      return new Response(JSON.stringify({ error: "telegramId va channelId kerak" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Telegram Bot API orqali a'zolikni tekshirish
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/getChatMember?chat_id=${channelId}&user_id=${telegramId}`;
    const res = await fetch(url);
    const data = await res.json();

    if (!data.ok) {
      return new Response(JSON.stringify({ isMember: false, error: data.description }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const status = data.result?.status;
    // member, administrator, creator = a'zo; left, kicked, restricted = a'zo emas
    const isMember = ["member", "administrator", "creator"].includes(status);

    return new Response(JSON.stringify({ isMember, status }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
}
