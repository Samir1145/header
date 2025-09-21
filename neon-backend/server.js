const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// Load environment variables
require("dotenv").config();
console.log(process.env.DATABASE_URL);
// PostgreSQL connection configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Test database connection
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL connection error:', err);
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ 
    status: "healthy", 
    timestamp: new Date().toISOString(),
    service: "neon-claimant-api"
  });
});

// Main claimant search endpoint
app.get("/api/claimant/:number", async (req, res) => {
  const claimantNumber = req.params.number;

  if (!claimantNumber || claimantNumber.trim() === '') {
    return res.status(400).json({ 
      error: "Claimant number is required",
      message: "Please provide a valid claimant number"
    });
  }

  const query = `
  WITH claimant_details AS (
    SELECT *
    FROM public.claimants
    WHERE LOWER(claimant_number) = LOWER($1)
  ),
  all_payments AS (
    SELECT sr_no, claimant_number, payment_amount, bank_from, bank_to, account_number, date_transfer
    FROM public.payment_1 WHERE LOWER(claimant_number) = LOWER($1)
    UNION ALL
    SELECT sr_no, claimant_number, payment_amount, bank_from, bank_to, account_number, date_transfer
    FROM public.payment_2 WHERE LOWER(claimant_number) = LOWER($1)
    UNION ALL
    SELECT sr_no, claimant_number, payment_amount, bank_from, bank_to, account_number, date_transfer
    FROM public.payment_3 WHERE LOWER(claimant_number) = LOWER($1)
    UNION ALL
    SELECT sr_no, claimant_number, payment_amount, bank_from, bank_to, account_number, date_transfer
    FROM public.payment_4 WHERE LOWER(claimant_number) = LOWER($1)
    UNION ALL
    SELECT sr_no, claimant_number, payment_amount, bank_from, bank_to, account_number, date_transfer
    FROM public.payment_5 WHERE LOWER(claimant_number) = LOWER($1)
  )
  SELECT c.*, p.sr_no as payment_sr_no, p.payment_amount, p.bank_from, p.bank_to, p.account_number, p.date_transfer
  FROM claimant_details c
  JOIN all_payments p ON c.claimant_number = p.claimant_number
  ORDER BY p.date_transfer DESC
  `;

  try {
    console.log(`🔍 Searching for claimant: ${claimantNumber}`);
    const result = await pool.query(query, [claimantNumber]);
    
    console.log(`📊 Found ${result.rows.length} records for claimant ${claimantNumber}`);
    
    if (result.rows.length === 0) {
      return res.json([]);
    }
    
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Database query error:', err);
    
    // Return appropriate error response
    if (err.code === '42P01') {
      // Table doesn't exist
      res.status(500).json({ 
        error: "Database schema error",
        message: "Required tables (claimants, payment_1-5) do not exist in the database"
      });
    } else if (err.code === 'ECONNREFUSED') {
      // Connection refused
      res.status(500).json({ 
        error: "Database connection error",
        message: "Unable to connect to the database. Please check your connection settings."
      });
    } else {
      // Generic database error
      res.status(500).json({ 
        error: "Database error",
        message: "An error occurred while executing the query",
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  }
});

// Get database schema info endpoint
app.get("/api/schema", async (req, res) => {
  try {
    const tablesQuery = `
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name IN ('claimants', 'payment_1', 'payment_2', 'payment_3', 'payment_4', 'payment_5')
      ORDER BY table_name, ordinal_position
    `;
    
    const result = await pool.query(tablesQuery);
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Schema query error:', err);
    res.status(500).json({ 
      error: "Schema query error",
      message: err.message 
    });
  }
});

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "NEON Claimant Search API",
    version: "1.0.0",
    endpoints: {
      health: "/health",
      search: "/api/claimant/:number",
      schema: "/api/schema"
    },
    usage: "Use /api/claimant/{claimant_number} to search for claimant data"
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Unhandled error:', err);
  res.status(500).json({ 
    error: "Internal server error",
    message: "An unexpected error occurred"
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: "Not found",
    message: `Endpoint ${req.method} ${req.path} not found`
  });
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`🚀 NEON Claimant Search API running on port ${PORT}`);
  console.log(`📊 Database URL: ${process.env.DATABASE_URL ? 'Configured' : 'Not configured'}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
