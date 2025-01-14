const express = require('express');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const mysql = require('mysql2');
const validator = require('validator');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const app = express();

dotenv.config();
const PORT = process.env.PORT;
const HOSTNAME = process.env.HOSTNAME;

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    timezone: 'Z',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const limiter = rateLimit({
    windowMs: 1000 * 60 * 15,
    max: 1000
});

const uploadDir = 'uploads/';
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const now = new Date().toISOString().split('T')[0];
        cb(null, `${req.user.id}-${now}-${file.originalname}`);
    }
});
const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: function (req, file, cb) {
        const filetypes = /jpeg|jpg|png|gif|webp|avif/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);

        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb(new Error('Csak képformátumok megengedettek'));
        }
    }
});

const JWT_SECRET = process.env.JWT_SECRET;
function authenticateToken(req, res, next) {
    const token = req.cookies.auth_token;

    if (!token) {
        return res.status(403).json({ error: 'Nincsen tokened he' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Van tokened, de nem jáó' });
        }
        req.user = user;
        next();
    });
};

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(limiter);
app.use(cookieParser());
app.use(cors({
    origin: 'http://127.0.0.1:5500', // A frontend URL-je
    credentials: true,
}));

app.use('/uploads', authenticateToken, express.static(path.join(__dirname, 'uploads')));

// --- restAPI végpontok ---

// regisztráció
app.post('/api/register', async (req, res) => {
    const { email, password, name } = req.body;
    const errors = [];

    if (!validator.isEmail(email)) {
        errors.push({ error: 'Nem valós email' });
    }

    if (!validator.isLength(password, { min: 6 })) {
        errors.push({ error: 'A jelszónak minimum 6 karakterből kell állnia' });
    }

    if (validator.isEmpty(name)) {
        errors.push({ error: 'Töltsd ki a nevet' });
    }

    if (errors.length > 0) {
        return res.status(400).json({ errors });
    }

    try {
        // Ellenőrzés: e-mail vagy név már létezik-e
        const checkSql = 'SELECT * FROM users WHERE email = ? OR username = ?';
        pool.query(checkSql, [email, name], async (err, result) => {
            if (err) {
                console.error('Hiba az ellenőrzés során:', err);
                return res.status(500).json({ error: 'Hiba történt a regisztráció során' });
            }

            if (result.length > 0) {
                const conflicts = [];
                if (result.some(user => user.email === email)) {
                    conflicts.push('Az email már foglalt');
                }
                if (result.some(user => user.username === name)) {
                    conflicts.push('A felhasználónév már foglalt');
                }
                return res.status(400).json({ errors: conflicts.map(error => ({ error })) });
            }

            // Ha nincs ütközés, folytatódhat a regisztráció
            const hash = await bcrypt.hash(password, 10);
            const sql = 'INSERT INTO users (email, password, role, profile_picture, username) VALUES (?, ?, ?, ?, ?)';
            pool.query(sql, [email, hash, 'user', 'default.png', name], (err2, result) => {
                if (err2) {
                    console.error('Hiba az adatbázisba írás során:', err2);
                    return res.status(500).json({ error: 'Hiba történt a regisztráció során' });
                }
                return res.status(201).json({ message: 'Sikeres regisztráció' });
            });
        });
    } catch (err) {
        console.error('Hiba történt a regisztráció során:', err);
        return res.status(500).json({ error: 'Hiba történt a szerveren' });
    }
});



// login
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;

    const errors = [];
    if (!validator.isEmail(email)) {
        errors.push({ error: 'Add meg az email címet' });
    }

    if (validator.isEmpty(password)) {
        errors.push({ error: 'Add meg a jelszót' });
    }

    if (errors.length > 0) {
        return res.status(400).json({ errors });
    }

    const sql = 'SELECT * FROM users WHERE email LIKE ?';
    pool.query(sql, [email], (err, result) => {
        if (err) {
            console.error('SQL Hiba:', err); // Kivételes hiba kiírása
            return res.status(500).json({ error: 'Belső hiba történt a szerveren' });
        }

        if (result.length === 0) {
            return res.status(401).json({ error: 'Helytelen email cím vagy jelszó' }); // Egyértelmű üzenet
        }

        const user = result[0];
        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) {
                console.error('Jelszó összehasonlítási hiba:', err); // Hiba kiírása
                return res.status(500).json({ error: 'Hiba történt a jelszó ellenőrzésében' });
            }
            if (isMatch) {
                const token = jwt.sign(
                    { id: user.user_id },
                    JWT_SECRET,
                    { expiresIn: '1y' }
                );

                res.cookie('auth_token', token, {
                    httpOnly: true,
                    secure: true,
                    sameSite: 'none',
                    maxAge: 3600000 * 24 * 31 * 12
                });

                return res.status(200).json({ message: 'Sikeres bejelentkezés' });
            } else {
                return res.status(401).json({ error: 'Helytelen email cím vagy jelszó' }); // Egyértelmű üzenet
            }
        });
    });
});

// profil name szerkesztése
app.put('/api/editProfileName', authenticateToken, (req, res) => {
    const name = req.body.name;
    const user_id = req.user.id;

    if (!name) {
        return res.status(400).json({ error: 'A név nem lehet üres' });
    }

    const sqlCheck = 'SELECT username FROM users WHERE user_id = ?';
    pool.query(sqlCheck, [user_id], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Hiba történt a felhasználó adatainak lekérése során' });
        }

        const currentName = result[0].username;
        if (name === currentName) {
            return res.status(400).json({ error: 'Az új név nem lehet azonos a jelenlegi névvel!' });
        }

        const checkSql = 'SELECT username FROM users WHERE username = ? AND user_id != ?';
        pool.query(checkSql, [name, user_id], (err2, result2) => {
            if (err2) {
                return res.status(500).json({ error: 'Hiba történt a név ellenőrzése során' });
            }

            if (result2.length > 0) {
                return res.status(400).json({ error: 'Ez a név már foglalt' });
            }

            const sql = 'UPDATE users SET username = ? WHERE user_id = ?';
            pool.query(sql, [name, user_id], (err3, result3) => {
                if (err3) {
                    return res.status(500).json({ error: 'Hiba történt a név frissítése során' });
                }

                // Visszaküldjük az új nevet
                res.status(200).json({ message: 'Név sikeresen módosítva!', name: name });
            });
        });
    });
});

app.get('/api/profile/getProfileName', authenticateToken, (req, res) => {
    const user_id = req.user.id;
    const sql = 'SELECT username FROM users WHERE user_id = ?';
    pool.query(sql, [user_id], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Hiba történt a felhasználó adatainak lekérése során' });
        }

        if (result.length === 0) {
            return res.status(404).json({ error: 'Felhasználó nem található' });
        }

        res.status(200).json({ name: result[0].username });
    });
});

app.put('/api/editProfilePsw', authenticateToken, (req, res) => {
    const psw = req.body.psw;
    const user_id = req.user.id;

    const salt = 10;

    // Ha a jelszó üres vagy nem elég hosszú
    if (!psw || !validator.isLength(psw, { min: 6 })) {
        return res.status(400).json({ error: 'A jelszónak legalább 6 karakterből kell állnia' });
    }

    bcrypt.hash(psw, salt, (err, hash) => {
        if (err) {
            return res.status(500).json({ error: 'Hiba a sózáskor' });
        }

        const sql = 'UPDATE users SET password = COALESCE(NULLIF(?, ""), password) WHERE user_id = ?';
        pool.query(sql, [hash, user_id], (err, result) => {
            if (err) {
                return res.status(500).json({ error: 'Hiba az SQL-ben' });
            }

            return res.status(200).json({ message: 'Jelszó frissítve' });
        });
    });
});

app.put('/api/editProfilePic', authenticateToken, (req, res) => {
    const user_id = req.user.id;

    if (!req.files || !req.files.profile_picture) {
        return res.status(400).json({ error: 'Nincs kiválasztott fájl!' });
    }

    const profilePic = req.files.profile_pic;
    
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(profilePic.mimetype)) {
        return res.status(400).json({ error: 'Csak képfájlok engedélyezettek!' });
    }

    const uploadPath = path.join(__dirname, 'uploads', profilePic.name);

    profilePic.mv(uploadPath, (err) => {
        if (err) {
            return res.status(500).json({ error: 'Hiba a fájl feltöltésekor' });
        }

        const sql = 'UPDATE users SET profile_picture = ? WHERE user_id = ?';
        pool.query(sql, [profilePic.name, user_id], (err, result) => {
            if (err) {
                return res.status(500).json({ error: 'Hiba az adatbázis frissítésekor' });
            }

            return res.status(200).json({ message: 'Profilkép frissítve' });
        });
    });
});

app.post('/api/logout', authenticateToken, (req, res) => {
    //res.clearCookie('token');
    res.status(200).json({ message: 'Sikeres kijelentkezés' });
});

app.listen(PORT, HOSTNAME, () => {
    console.log(`IP: http://${HOSTNAME}:${PORT}`);
});