const axios = require('axios');

// Helper to get M-Pesa OAuth Token
const getMpesaToken = async () => {
    const auth = Buffer.from(`${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`).toString('base64');
    const res = await axios.get('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
        headers: { Authorization: `Basic ${auth}` }
    });
    return res.data.access_token;
};

exports.createLead = async (req, res) => {
    const { name, phone, amount } = req.body;
    
    // Logic: Standardize for 254...
    const formattedPhone = phone.startsWith('0') ? '254' + phone.substring(1) : phone;

    try {
        // If an amount is provided, trigger STK Push immediately
        if (amount) {
            const token = await getMpesaToken();
            const timestamp = new Date().toISOString().replace(/[-:T.Z]/g, "").slice(0, 14);
            const password = Buffer.from(`${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`).toString('base64');

            await axios.post('https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest', {
                BusinessShortCode: process.env.MPESA_SHORTCODE,
                Password: password,
                Timestamp: timestamp,
                TransactionType: "CustomerPayBillOnline",
                Amount: amount,
                PartyA: formattedPhone,
                PartyB: process.env.MPESA_SHORTCODE,
                PhoneNumber: formattedPhone,
                CallBackURL: `${process.env.BASE_URL}/api/mpesa/callback`,
                AccountReference: "BiasharaOS",
                TransactionDesc: `Payment for ${name}`
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
        }

        res.status(201).json({ message: "Lead created and STK Push initiated", status: "success" });
    } catch (error) {
        console.error("M-Pesa Error:", error.response?.data || error.message);
        res.status(500).json({ error: "Failed to process M-Pesa request" });
    }
};
