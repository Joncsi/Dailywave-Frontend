const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/dotenvConfig').config;

function authenticateToken(req, res, next) {
    const token = req.cookies.auth_token;

    if (!token) {
        return res.status(401).json({ error: 'Hozzáférés megtagadva, kérlek jelentkezz be!' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Érvénytelen vagy lejárt token!' });
        }
        req.user = user;
        next();
    });
};

module.exports = authenticateToken;