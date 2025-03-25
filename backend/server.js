const express = require("express");
const app = express();
const axios = require("axios"); // Import axios for HTTP requests
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors"); // Import CORS

// Enable CORS for all routes
app.use(cors()); // You can specify options here if needed, e.g., { origin: '*' } or specific domains like { origin: 'http://example.com' }
app.use(express.json()); // Middleware to parse JSON body

// Connect to SQLite database (or create it if it doesn't exist)
const db = new sqlite3.Database("./database.sqlite", (err) => {
  if (err) {
    console.error("Error opening database", err.message);
  } else {
    console.log("Connected to SQLite database");

    db.run(
      `
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                last_name TEXT,
                name TEXT,
                email TEXT UNIQUE,
                password TEXT
            )
        `,
      (err) => {
        if (err) {
          console.error("Error creating users table", err.message);
        }
      }
    );

    db.run(
      `
            CREATE TABLE IF NOT EXISTS services (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                description TEXT,
                price REAL NOT NULL,
                available BOOLEAN DEFAULT 1,
                user_id INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        `,
      (err) => {
        if (err) {
          console.error("Error creating services table", err.message);
        }
      }
    );
  }
});

// Default route
app.get("/", (req, res) => {
  res.send("Welcome to the Node.js Server!");
});

// Register a user (Insert into DB)
app.post("/register", (req, res) => {
  const { last_name, name, email, password } = req.body;
  db.run(
    `INSERT INTO users (last_name, name, email, password) VALUES (?, ?, ?, ?)`,
    [last_name, name, email, password],
    (err) => {
      if (err) {
        return res
          .status(500)
          .json({ message: "Error registering user", error: err.message });
      }
      res.json({ message: "User registered successfully" });
    }
  );
});

// Login route (Check user in DB)
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  db.get(
    `SELECT * FROM users WHERE email = ? AND password = ?`,
    [email, password],
    async (err, row) => {
      if (err) {
        return res
          .status(500)
          .json({ message: "Database error", error: err.message });
      }
      if (row) {
        // Call Python API to check if the user can connect
        try {
          const response = await axios.get(
            `http://127.0.0.1:5000/can_connect`,
            {
              params: { user_id: 1 },
              headers: {
                "Content-Type": "application/json",
              },
            }
          );

          if (response.data.message === "User can connect") {
            res.json({ message: "Login successful", user: row });
          } else {
            res.status(403).json({ message: "User exceeded the limit" });
          }
        } catch (error) {
          console.error(
            "Error calling Python API:",
            error.response ? error.response.data : error.message
          );
          res.status(500).json({
            message: "Error checking connection limit",
            error: error.response ? error.response.data : error.message,
          });
        }
      } else {
        res.status(401).json({ message: "Invalid credentials" });
      }
    }
  );
});

// Route to display all services (items for sale)
app.get("/services", (req, res) => {
  const query = "SELECT * FROM services WHERE available = 1"; // Example query for available items
  db.all(query, [], (err, rows) => {
    if (err) {
      return res
        .status(500)
        .json({ message: "Error fetching items", error: err.message });
    }
    res.json(rows);
  });
});

// Route to display a specific service by ID
app.get("/services/:id", (req, res) => {
  const serviceId = req.params.id;
  const query = "SELECT * FROM services WHERE id = ?";
  db.get(query, [serviceId], (err, row) => {
    if (err) {
      return res
        .status(500)
        .json({ message: "Error fetching item", error: err.message });
    }
    if (!row) {
      return res.status(404).json({ message: "Item not found" });
    }
    res.json(row);
  });
});

// Route to create a new service (item for sale)
app.post("/services", (req, res) => {
  const { title, description, price, user_id } = req.body;

  // Validate required fields
  if (!title || !price || !user_id) {
    return res
      .status(400)
      .json({ message: "Missing required fields (title, price, user_id)" });
  }

  const query =
    "INSERT INTO services (title, description, price, available, user_id) VALUES (?, ?, ?, ?, ?)";
  db.run(query, [title, description, price, 1, user_id], function (err) {
    if (err) {
      return res
        .status(500)
        .json({ message: "Error creating item", error: err.message });
    }
    res.json({ message: "Item created successfully", id: this.lastID });
  });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
