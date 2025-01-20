const db = require('../models/db'); // Adatbázis kapcsolat importálása

const User = {
    findById: async (id) => {
        const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [id]);
        return rows[0];
    }
};

module.exports = User;
