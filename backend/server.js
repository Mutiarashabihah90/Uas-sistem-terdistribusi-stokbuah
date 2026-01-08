require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const app = express();

app.use(express.json());
app.use(cors());

// Konfigurasi Koneksi Database
const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'db_toko'
});

db.connect((err) => {
    if (err) {
        console.error("Gagal koneksi database:", err);
    } else {
        console.log("Database Terhubung (Satu Server untuk Semua Fitur)!");
    }
});

// --- BAGIAN AUTH (PORT 3001 SEBELUMNYA) ---
app.post('/register', async (req, res) => {
    const { username, password, email } = req.body;
    const hashedPass = await bcrypt.hash(password, 10);
    db.query('INSERT INTO users (username, password, email) VALUES (?, ?, ?)', 
    [username, hashedPass, email], (err) => {
        if (err) return res.status(500).json({ message: "Gagal daftar akun" });
        res.json({ message: "Pendaftaran berhasil!" });
    });
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    db.query('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
        if (err || results.length === 0) return res.status(401).json({ message: "User tidak ditemukan" });
        const valid = await bcrypt.compare(password, results[0].password);
        if (!valid) return res.status(401).json({ message: "Password salah" });
        res.json({ message: "Login Berhasil!" });
    });
});

// --- BAGIAN STOK BUAH (PORT 3002 SEBELUMNYA) ---
app.get('/buah', (req, res) => {
    db.query('SELECT * FROM buah', (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

app.post('/buah', (req, res) => {
    const { nama, stok, harga } = req.body;
    db.query('INSERT INTO buah (nama, stok, harga) VALUES (?, ?, ?)', 
    [nama, stok, harga], (err) => {
        if (err) return res.status(500).json({ message: "Gagal simpan data" });
        res.json({ message: "Data buah berhasil ditambah!" });
    });
});

// Jalankan di satu port saja
const PORT = 3001;
app.listen(PORT, () => console.log(`Server gabungan jalan di port ${PORT}`));