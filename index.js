require('dotenv').config();       // Load environment variables from .env file
const express = require('express');  // Express framework for building the server
const helmet = require('helmet');   // Helmet for securing HTTP headers
const path = require('path');        // Path module for handling file paths
const { ensureSchema } = require('./database'); // Import ensureSchema from database.js

const app = express();          // Create an Express application

// Middleware setup
app.use(helmet());      // Use Helmet to enhance API security
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true }));  // Parse URL-encoded request bodies
app.use(express.static(path.join(__dirname, 'public')));  

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', port: process.env.PORT }));

// Middleware to ensure table exists
app.use(async (req, res, next) => { await ensureSchema(); next(); });


app.listen(process.env.PORT || 3000, () => console.log(`Server running on port ${process.env.PORT || 3000}`)); 
