const express = require('express');
const mysql = require('mysql2');
require('dotenv').config();

const app = express();
app.use(express.json());

// Database Connection
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
});

db.connect((err) => {
    if (err) {
        console.log('Error connecting to the database', err);
        return;
    }
    console.log('Connected to the database');
});

// Adding School API
app.post('/addSchool', (req, res) => {
    const { name, address, latitude, longitude } = req.body;

    // Validation
    if (!name || !address || !latitude || !longitude) {
        return res.status(400).json({
            message: 'All fields are required.'
        });
    }

    const query = `INSERT INTO schools (name, address, latitude, longitude) VALUES (?, ?, ?, ?)`;

    db.query(query, [name, address, latitude, longitude], (err, results) => {
        if (err) {
            console.error('Error adding school: ', err);
            return res.status(500).json({ message: 'Internal server error.' });
        }
        res.status(201).json({
            message: 'School added successfully.',
            schoolID: results.insertID
        });
    });
});


// Listing School API
app.get('/listSchools', (req, res) => {
    console.log(req.url, req.method);
    const { latitude, longitude } = req.query;

    if (!latitude || !longitude) {
        return res.status(400).json({
            message: 'User latitude and longitude are required.'
        });
    }

    const userLat = parseFloat(latitude);
    const userLon = parseFloat(longitude);

    const query = `SELECT *, 
                   (6371 * acos(cos(radians(?)) * cos(radians(latitude)) * cos(radians(longitude) - radians(?)) + sin(radians(?)) * sin(radians(latitude)))) AS distance 
                   FROM schools 
                   ORDER BY distance`;

    db.query(query, [userLat, userLon, userLat], (err, results) => {
        if (err) {
            console.err('Error fetching schools: ', err);
            return res.status(500).json({
                message: 'Internal server error.'
            });
        }
        res.json(results);
    });
});

// Starting the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})