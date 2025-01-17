const db = require('../models/db');
const bcrypt = require('bcrypt');
const sharp = require('sharp');
const validator = require('validator');
const path = require('path')

const editProfileName = (req, res) => {
    const username = req.body.username;
    const user_id = req.user.id;

    if (!username || validator.isEmpty(username.trim())) {
        return res.status(400).json({ error: 'A felhasználónév nem lehet üres' });
    }

    const sqlCheck = 'SELECT username FROM users WHERE user_id = ?';
    db.query(sqlCheck, [user_id], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Hiba történt a felhasználó adatainak lekérése során' });
        }

        const currentUsername = result[0].username;
        if (username === currentUsername) {
            return res.status(400).json({ error: 'Az új felhasználónév nem lehet azonos a jelenlegi névvel!' });
        }

        const checkSql = 'SELECT username FROM users WHERE username = ? AND user_id != ?';
        db.query(checkSql, [username, user_id], (err2, result2) => {
            if (err2) {
                return res.status(500).json({ error: 'Hiba történt a felhasználónév ellenőrzése során' });
            }

            if (result2.length > 0) {
                return res.status(400).json({ error: 'Ez a felhasználónév már foglalt' });
            }

            const sql = 'UPDATE users SET username = ? WHERE user_id = ?';
            db.query(sql, [username, user_id], (err3, result3) => {
                if (err3) {
                    return res.status(500).json({ error: 'Hiba történt a felhasználónév frissítése során' });
                }

                res.status(200).json({ message: 'Felhasználónév sikeresen módosítva!', username: username });
            });
        });
    });
};

const getProfileName = (req, res) => {
    const user_id = req.user.id;
    const sql = 'SELECT username FROM users WHERE user_id = ?';
    db.query(sql, [user_id], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Hiba történt a felhasználó adatainak lekérése során' });
        }

        if (result.length === 0) {
            return res.status(404).json({ error: 'Felhasználó nem található' });
        }

        res.status(200).json({ name: result[0].username });
    });
};

const editProfilePsw = (req, res) => {
    const psw = req.body.psw;
    const user_id = req.user.id;

    const salt = 10;

    if (!psw || !validator.isLength(psw, { min: 6 })) {
        return res.status(400).json({ error: 'A jelszónak legalább 6 karakterből kell állnia' });
    }

    bcrypt.hash(psw, salt, (err, hash) => {
        if (err) {
            return res.status(500).json({ error: 'Hiba a sózáskor' });
        }

        const sql = 'UPDATE users SET password = COALESCE(NULLIF(?, ""), password) WHERE user_id = ?';
        db.query(sql, [hash, user_id], (err, result) => {
            if (err) {
                return res.status(500).json({ error: 'Hiba az SQL-ben' });
            }

            return res.status(200).json({ message: 'Jelszó frissítve' });
        });
    });
};

const uploadDir = path.join(__dirname, 'uploads');

const editProfilePic = (req, res) => {
    const user_id = req.user.id;
    const profile_picture = req.file ? req.file.filename : null;

    const sql = 'UPDATE users SET profile_picture = COALESCE(NULLIF(?, ""), profile_picture) WHERE user_id = ?'

    db.query(sql, [profile_picture, user_id], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Hiba az SQL-ben' });
        }

        return res.status(200).json({ message: 'Profilkép frissítve ' });
    });
};
const getProfilePic = (req, res) => {
    const user_id = req.user.id;

    const sql = 'SELECT profile_picture FROM users WHERE user_id = ?';
    db.query(sql, [user_id], (err, result) => {
        if (err) {
            console.error('Error fetching profile picture:', err);
            return res.status(500).json({ error: 'Hiba történt a profilkép lekérése során' });
        }

        if (result.length === 0) {
            return res.status(404).json({ error: 'Felhasználó nem található' });
        }

        const profilePic = result[0].profile_picture;
        res.json({ profilePicUrl: profilePic ? `/uploads/${profilePic}` : null });  // Return the image URL
    });
};

module.exports = { editProfileName, editProfilePic, editProfilePsw, getProfileName, getProfilePic };