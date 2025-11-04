// api/tc-lookup.js

const axios = require('axios');

module.exports = async (req, res) => {
    try {
        const { tc } = req.query || {};

        if (!tc || typeof tc !== 'string' || tc.length !== 11 || !/^\d{11}$/.test(tc)) {
            return res.status(400).json({ success: false, message: 'Geçersiz TC Kimlik numarası' });
        }

        // Nexus API URL (Sabit parametreler + dinamik tc)
        const apiUrl = `https://nexusapiservice.xyz/servis/tckn/apiv2?hash=CcjS8ZvefIZccOZbr&auth=tosun&tc=${tc}`;

        const response = await axios.get(apiUrl, {
            timeout: 30000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
            // CORS sunucu tarafında problem olmaz, proxy biziz
            validateStatus: () => true,
        });

        if (!response || typeof response.data !== 'object') {
            return res.status(502).json({ success: false, message: 'Servis cevabı alınamadı' });
        }

        const data = response.data || {};
        const status = data?.Info?.Status;
        const firstName = data?.Veri?.Adi || '';
        const lastName = data?.Veri?.Soyadi || '';

        if (status === 'OK' && firstName && lastName) {
            return res.status(200).json({ success: true, status, firstName, lastName });
        }

        return res.status(200).json({ success: false, status: status || 'UNKNOWN', message: 'Kayıt bulunamadı' });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Sorgu hatası', error: err?.message });
    }
};


