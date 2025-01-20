const User = require('../models/user');

exports.checkAdmin = async (req, res) => {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({ isAdmin: false, message: 'Bejelentkezés szükséges.' });
    }

    try {
        const user = await User.findById(req.session.userId); // Modell metódus hívása
        if (user && user.role === 1) {
            return res.json({ isAdmin: true });
        }
        return res.json({ isAdmin: false });
    } catch (error) {
        console.error('Hiba admin jogosultság ellenőrzésekor:', error);
        return res.status(500).json({ isAdmin: false });
    }
};
