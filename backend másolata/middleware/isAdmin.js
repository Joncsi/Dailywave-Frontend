const User = require('../models/user');

module.exports = async (req, res, next) => {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: 'Bejelentkezés szükséges.' });
    }

    try {
        const user = await User.findById(req.session.userId);
        if (user && user.role === 1) {
            return next();
        }
        return res.status(403).json({ message: 'Nincs admin jogosultság.' });
    } catch (error) {
        console.error('Hiba admin ellenőrzésekor:', error);
        return res.status(500).json({ message: 'Szerverhiba.' });
    }
};
