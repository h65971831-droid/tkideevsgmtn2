// api/update-iban.js
// IBAN bilgilerini günceller

const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://app:GucluSifre123%21@83.136.211.173:27017/toki?authSource=toki';
const MONGODB_DB = process.env.MONGODB_DB || 'toki';

let cachedClient = null;
let loggedConnection = false;

async function getClient(uri) {
    if (cachedClient) {
        try {
            await cachedClient.db('admin').command({ ping: 1 });
            return cachedClient;
        } catch (err) {
            console.log('[DB] Cached client disconnected, reconnecting...', err.message);
            try {
                await cachedClient.close();
            } catch (closeErr) {
                // Ignore close errors
            }
            cachedClient = null;
            loggedConnection = false;
        }
    }
    
    const client = new MongoClient(uri, { 
        retryWrites: true, 
        w: 'majority',
        serverSelectionTimeoutMS: 5000
    });
    
    try {
        await client.connect();
        if (!loggedConnection) {
            console.log('[DB] Connected to MongoDB successfully');
            loggedConnection = true;
        }
    } catch (err) {
        console.error('[DB] MongoDB connection failed:', err.message);
        cachedClient = null;
        loggedConnection = false;
        throw err;
    }
    cachedClient = client;
    return cachedClient;
}

module.exports = async (req, res) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }
    
    try {
        const { authority_name, iban, amount, code, description } = req.body;
        
        if (!authority_name || !iban || !amount || !code) {
            return res.status(400).json({ 
                success: false, 
                message: 'Tüm alanlar gereklidir (authority_name, iban, amount, code)' 
            });
        }
        
        const uri = MONGODB_URI;
        const dbName = MONGODB_DB;

        const client = await getClient(uri);
        const db = client.db(dbName);
        const col = db.collection('iban');
        
        // IBAN bilgilerini güncelle (varsa) veya oluştur
        const result = await col.updateOne(
            {}, // Tüm dokümanları bul (genellikle tek bir doküman olacak)
            {
                $set: {
                    authority_name: authority_name,
                    iban: iban,
                    amount: amount,
                    code: code,
                    description: description || ''
                }
            },
            { upsert: true } // Yoksa oluştur
        );
        
        return res.status(200).json({ 
            success: true,
            message: 'IBAN bilgileri başarıyla güncellendi',
            updated: result.modifiedCount > 0,
            created: result.upsertedCount > 0
        });
        
    } catch (err) {
        console.error('update-iban error:', err.message);
        
        if (err.message && (err.message.includes('Authentication failed') || err.message.includes('authentication') || err.message.includes('auth'))) {
            cachedClient = null;
            loggedConnection = false;
            
            return res.status(500).json({ 
                success: false, 
                message: 'Sunucu hatası', 
                error: 'Authentication failed. Lütfen MongoDB bağlantı bilgilerini kontrol edin.'
            });
        }
        
        return res.status(500).json({ 
            success: false, 
            message: 'Sunucu hatası', 
            error: err.message 
        });
    }
};

