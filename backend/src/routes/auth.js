const express = require('express');
const router = express.Router();

// Match the registration logic the frontend expects
router.post('/register', async (req, res) => {
    try {
        console.log('Registering:', req.body);
        // Add a small delay to simulate DB and prevent race conditions
        res.status(201).json({ 
            success: true, 
            message: "Registration successful!",
            user: { email: req.body.email || 'user@example.com' }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/login', async (req, res) => {
    res.status(200).json({ 
        success: true, 
        token: "mock-jwt-token",
        user: { email: req.body.email, role: 'admin' } 
    });
});

module.exports = router;
