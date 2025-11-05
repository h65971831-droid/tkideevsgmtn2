export default async function handler(req, res) {
    try {
      if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Method Not Allowed' });
      }
  
      // Eğer FormData gönderiyorsan:
      // const formData = await req.formData(); // <-- Node'da native yok, gerekirse 'formidable' kullan
      // ama çoğu durumda body-parser ya da JSON kullanırsın
  
      // Her şey yolundaysa:
      res.status(200).json({ success: true, message: 'ok' });
    } catch (error) {
      console.error('get-status error:', error);
      res.status(500).json({ success: false, error: 'Server error' });
    }
  }
  