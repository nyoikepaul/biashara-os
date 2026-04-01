const express = require('express');
const router = express.Router();

router.get('/customers', (req, res) => {
  // Required for free ngrok tunnels to work with fetch()
  res.setHeader('ngrok-skip-browser-warning', 'true');
  
  res.json([
    { id: 1, name: "Nairobi Supplies Ltd", email: "info@nairobisupplies.co.ke", status: "Active", phone: "+254 700 000000" },
    { id: 2, name: "Mombasa Millers", email: "sales@mombasamillers.com", status: "Lead", phone: "+254 711 111111" }
  ]);
});

module.exports = router;
