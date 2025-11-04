// api/get-projects.js
// Returns projects for a given province code (01..81) from MongoDB 'cities' collection

const { MongoClient } = require('mongodb');

let cachedClient = null;

async function getClient(uri) {
    if (cachedClient) return cachedClient;
    const client = new MongoClient(uri, { retryWrites: true, w: 'majority' });
    await client.connect();
    cachedClient = client;
    return cachedClient;
}

module.exports = async (req, res) => {
    try {
        const { province } = req.query || {};
        if (!province) {
            return res.status(400).json({ success: false, message: 'province parametresi gerekli (01..81)' });
        }

        const uri = process.env.MONGODB_URI;
        const dbName = process.env.MONGODB_DB || 'toki';
        if (!uri) {
            return res.status(500).json({ success: false, message: 'MONGODB_URI tanımlı değil' });
        }

        const client = await getClient(uri);
        const col = client.db(dbName).collection('cities');

        const provinceCode = String(province).padStart(2, '0');
        const doc = await col.findOne({ provinceCode }, { projection: { _id: 0, projects: 1 } });

        res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
        return res.status(200).json({ success: true, projects: doc?.projects || [], project_details: [] });
    } catch (err) {
        console.error('get-projects error:', err.message);
        return res.status(500).json({ success: false, message: 'Sunucu hatası', error: err.message });
    }
};


