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
    origin: 'http://127.0.0.1:5501', // A frontend URL-je
    credentials: true, // Ha sütiket (cookies) is használsz
}));
app.use('/uploads', authenticateToken, express.static(path.join(__dirname, 'uploads')));

// --- restAPI végpontok ---

// regisztráció
app.post('/api/register', (req, res) => {
    const { email, password, username } = req.body;
    const errors = [];

    if (!validator.isEmail(email)) {
        errors.push({ error: 'Nem valós email' });
    }

    if (!validator.isLength(password, { min: 6 })) {
        errors.push({ error: 'A jelszónak minimum 6 karakterből kell állnia' });
    }

    if (validator.isEmpty(username)) {
        errors.push({ error: 'Töltsd ki a nevet' });
    }

    if (errors.length > 0) {
        return res.status(400).json({ errors });
    }

    bcrypt.hash(password, 10, (err, hash) => {
        if (err) {
            return res.status(500).json({ error: 'Hiba a jelszó hash-elésekor' });
        }
        const sql = 'INSERT INTO users (email, password, role, profile_picture, username) VALUES (?, ?, ?, ?, ?)';
        pool.query(sql, [email, hash, 'user', 'default.png', username], (err2, result) => {
            if (err2) {
                if (err2.code === 'ER_DUP_ENTRY') {
                    return res.status(400).json({ error: 'Az email már foglalt' });
                }
                return res.status(500).json({ error: 'Hiba történt a regisztráció során' });
            }

            return res.status(201).json({ message: 'Sikeres regisztráció' });
        });
    });
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
            console.log(err);
            return res.status(500).json({ error: 'Hiba az SQL-ben' });
        }

        if (result.length === 0) {
            return res.status(404).json({ error: 'A felhasználó nem található' });
        }

        const user = result[0];
        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (isMatch) {
                const token = jwt.sign(
                    {
                        id: user.user_id
                    },
                    JWT_SECRET,
                    {
                        expiresIn: '1y'
                    }
                );

                // Token hozzáadása cookie-ként
                res.cookie('auth_token', token, {
                    httpOnly: true,
                    secure: true,
                    sameSite: 'none',
                    maxAge: 3600000 * 24 * 31 * 12
                });

                return res.status(200).json({ message: 'Sikeres bejelentkezés' });
            } else {
                return res.status(401).json({ error: 'Rossz a jelszó' });
            }
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