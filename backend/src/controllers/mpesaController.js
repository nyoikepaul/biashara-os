const db = require('../lib/db');

exports.handleCallback = async (req, res) => {
    const { Body } = req.body;
    const resultCode = Body.stkCallback.ResultCode;
    const merchantRequestID = Body.stkCallback.MerchantRequestID;
    
    try {
        if (resultCode === 0) {
            // Logic: Payment Successful (ResultCode 0)
            const metadata = Body.stkCallback.CallbackMetadata.Item;
            const amount = metadata.find(item => item.Name === 'Amount').Value;
            const mpesaReceipt = metadata.find(item => item.Name === 'MpesaReceiptNumber').Value;
            const phone = metadata.find(item => item.Name === 'PhoneNumber').Value;

            console.log(`✅ Payment Received: ${amount} from ${phone}. Receipt: ${mpesaReceipt}`);

            // Logic: Update Customer Balance or Invoice Status in DB
            // await db.query('UPDATE customers SET balance = balance +  WHERE phone = ', [amount, phone]);
        } else {
            console.log(`❌ Payment Failed or Cancelled. Result Code: ${resultCode}`);
        }
        
        // Safaricom expects a 200 OK to acknowledge receipt
        res.status(200).json({ ResultCode: 0, ResultDesc: "Success" });
    } catch (error) {
        console.error("Callback Processing Error:", error);
        res.status(500).json({ ResultCode: 1, ResultDesc: "Internal Server Error" });
    }
};
