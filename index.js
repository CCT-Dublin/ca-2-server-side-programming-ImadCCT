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
app.get('/health', (req, res) => res.json({ status: 'ok', port: process.env.PORT })); // Health check endpoint

// Middleware to ensure table exists
app.use(async (req, res, next) => { await ensureSchema(); next(); });

// Import and use routes
app.listen(process.env.PORT || 3000, () => console.log(`Server running on port ${process.env.PORT || 3000}`)); 

const xss = require('xss');
const { getPool } = require('./database');

function validateRecord(record){
  const errors = [];
  if(!/^[a-zA-Z0-9]{1,20}$/.test(record.first_name)) errors.push("Invalid first name");
  if(!/^[a-zA-Z0-9]{1,20}$/.test(record.second_name)) errors.push("Invalid second name");
  if(!/^\S+@\S+\.\S+$/.test(record.email)) errors.push("Invalid email");
  if(!/^\d{10}$/.test(record.phone_number)) errors.push("Invalid phone number");
  if(!/^\d[A-Za-z0-9]{5}$/.test(record.eircode)) errors.push("Invalid eircode");
  return errors;
}

app.post('/submit-form', async (req,res)=>{
  const record = req.body;
  for(let key in record) record[key] = xss(record[key]);
  const errors = validateRecord(record);
  if(errors.length) return res.json({success:false, errors});
  const pool = await getPool();
  await pool.query('INSERT INTO mysql_table (first_name, second_name, email, phone_number, eircode) VALUES (?,?,?,?,?)',
    [record.first_name, record.second_name, record.email, record.phone_number, record.eircode]);
  res.json({success:true});
});

