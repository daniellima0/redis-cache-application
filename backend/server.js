const express = require('express');
const app = express();
const sqlite3 = require('sqlite3').verbose();

app.use(express.json()); // Middleware to parse JSON body

// Connect to SQLite database (or create it if it doesn't exist)
const db = new sqlite3.Database('./database.sqlite', (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to SQLite database');

        // Create users table if it doesn't exist
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password TEXT
        )`);
    }
});

// Default route
app.get('/', (req, res) => {
    res.send('Welcome to the Node.js Server!');
});

// Register a user (Insert into DB)
app.post('/register', (req, res) => {
    const { username, password } = req.body;
    db.run(`INSERT INTO users (username, password) VALUES (?, ?)`, [username, password], (err) => {
        if (err) {
            return res.status(500).json({ message: 'Error registering user', error: err.message });
        }
        res.json({ message: 'User registered successfully' });
    });
});

// Login route (Check user in DB)
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    db.get(`SELECT * FROM users WHERE username = ? AND password = ?`, [username, password], (err, row) => {
        if (err) {
            return res.status(500).json({ message: 'Database error', error: err.message });
        }
        if (row) {
            res.json({ message: 'Login successful', user: row });
        } else {
            res.status(401).json({ message: 'Invalid credentials' });
        }
    });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
