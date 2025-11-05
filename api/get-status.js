export const config = {
    runtime: 'edge', // ⚡ Edge Function (çok hızlı)
  };
  
  export default async function handler(req) {
    // Eğer POST dışında çağrılırsa:
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ success: false, message: 'Method Not Allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  
    // Hemen “ok” dön
    return new Response(JSON.stringify({ success: true, message: 'ok' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  