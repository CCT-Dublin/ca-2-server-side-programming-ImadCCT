require('dotenv').config();       // Load environment variables from .env file
const express = require('express');  // Express framework for building the server
const helmet = require('helmet');   // Helmet for securing HTTP headers
const path = require('path');        // Path module for handling file paths
const { ensureSchema, getPool } = require('./database'); // Import functions from database.js
const multer = require('multer');
const { parse } = require('csv-parse');
const fs = require('fs');
const xss = require('xss');

const upload = multer({ dest:'uploads/' });

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

// ------------------ Validation Function ------------------
function validateRecord(record){
  const errors = [];
  if(!/^[a-zA-Z0-9]{1,20}$/.test(record.first_name)) errors.push("Invalid first name");
  if(!/^[a-zA-Z0-9]{1,20}$/.test(record.second_name)) errors.push("Invalid second name");
  if(!/^\S+@\S+\.\S+$/.test(record.email)) errors.push("Invalid email");
  if(!/^\d{10}$/.test(record.phone_number)) errors.push("Invalid phone number");
  if(!/^\d[A-Za-z0-9]{5}$/.test(record.eircode)) errors.push("Invalid eircode");
  return errors;
}



// ------------------ Submit Form Route ------------------
app.post('/submit-form', async (req,res)=>{
  const record = req.body;
  console.log("Received record:", record); // <-- debug inside route

  // sanitize input
  for(let key in record) record[key] = xss(record[key]);

  // validate
  const errors = validateRecord(record);
  if(errors.length){
    console.log("Validation errors:", errors);
    return res.json({success:false, errors});
  }

  try {
    const pool = await getPool();
    const [result] = await pool.query(
      'INSERT INTO mysql_table (first_name, second_name, email, phone_number, eircode) VALUES (?, ?, ?, ?, ?)',
      [record.first_name, record.second_name, record.email, record.phone_number, record.eircode]
    );
    console.log("Insert result:", result);
    res.json({success:true});
  } catch(err){
    console.error("INSERT ERROR:", err);
    res.status(500).json({success:false, error: err.message});
  }
});


// ------------------ Upload CSV Route ------------------
app.post('/upload-csv', upload.single('file'), async (req, res) => {
  const filePath = req.file.path;
  const rows = [];
  const invalid = [];

  // Wrap parsing in a promise so we can await it
  const parseCSV = () => {
    return new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(parse({ columns: true, trim: true, skip_empty_lines: true }))
        .on('data', row => {
          for (let key in row) row[key] = xss(row[key]);
          const errors = validateRecord(row);
          if (errors.length) invalid.push({ row, errors });
          else rows.push(row);
        })
        .on('end', resolve)
        .on('error', reject);
    });
  };

  try {
    await parseCSV(); // wait until CSV is fully parsed
    const pool = await getPool();

    if (rows.length === 0) {
      return res.json({ inserted: 0, invalid });
    }

    // Insert all rows in a single query using multiple values
    const values = rows.map(r => [
      r.first_name, r.second_name, r.email, r.phone_number, r.eircode
    ]);

    const placeholders = values.map(() => '(?,?,?,?,?)').join(',');
    const flatValues = values.flat();

    const [result] = await pool.query(
      `INSERT INTO mysql_table (first_name, second_name, email, phone_number, eircode) VALUES ${placeholders}`,
      flatValues
    );

    console.log("Inserted CSV rows:", result.affectedRows);
    res.json({ inserted: result.affectedRows, invalid });

  } catch (err) {
    console.error("CSV INSERT ERROR:", err);
    res.status(500).json({ success: false, error: err.message });
  } finally {
    fs.unlinkSync(filePath);
  }
});




// ------------------ Security & Logging Middleware ------------------
app.use((req,res,next)=>{
  res.setHeader("Content-Security-Policy","default-src 'self'");
  next();
});

app.use((req,res,next)=>{ console.log(req.method, req.url); next(); });

// Force error test route
app.get('/force-error', (req, res) => { throw new Error("This is a test crash"); });

// ------------------ View Data Route ------------------
app.get('/view-data', async (req, res) => {
  try {
    const pool = await getPool();
    const [rows] = await pool.query('SELECT * FROM mysql_table');
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to fetch data' });
  }
});

// ------------------ 404 & Global Error Handlers ------------------
app.use((req, res) => { res.status(404).json({ success: false, error: "Route not found" }); });

app.use((err, req, res, next) => {
  console.error("ERROR:", err);
  res.status(500).json({ success: false, error: err.message });
});

// ------------------ Start Server ------------------
app.listen(process.env.PORT || 3000, () => console.log(`Server running on port ${process.env.PORT || 3000}`));
