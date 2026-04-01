exports.createLead = async (req, res) => {
  const { name, phone } = req.body;
  // Logic: Format phone for M-Pesa (e.g., 254...)
  const formattedPhone = phone.startsWith('0') ? '254' + phone.substring(1) : phone;
  
  res.status(201).json({ 
    message: "Lead '${name}' created", 
    phone: formattedPhone,
    status: "ready_for_mpesa" 
  });
};
