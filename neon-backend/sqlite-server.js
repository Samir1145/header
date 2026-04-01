const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const initSqlJs = require("sql.js");
const fs = require("fs");
const path = require("path");

const crypto = require("crypto");

// Load environment variables
require("dotenv").config();

const app = express();

// CORS - restrict to known origins in production
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(",").map(s => s.trim())
    : ["http://localhost:5173", "http://localhost:4000", "http://localhost:9621"];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (curl, mobile apps, server-to-server)
        if (!origin) return callback(null, true);
        if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
        callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
}));

app.use(express.json({ limit: "1mb" }));

// JWT Secret - generate a random one if not provided (warn in production)
const JWT_SECRET = process.env.JWT_SECRET || (() => {
    const generated = crypto.randomBytes(32).toString("hex");
    if (process.env.NODE_ENV === "production") {
        console.error("⚠️  WARNING: JWT_SECRET not set! Using random secret. Tokens will NOT survive restarts.");
    }
    return generated;
})();
const JWT_EXPIRES_IN = "7d";

// Database file path
const dbPath = path.join(__dirname, "database.sqlite");

let db;

// ============================================
// DATABASE INITIALIZATION
// ============================================

async function initDatabase() {
    const SQL = await initSqlJs();

    // Load existing database or create new
    if (fs.existsSync(dbPath)) {
        const fileBuffer = fs.readFileSync(dbPath);
        db = new SQL.Database(fileBuffer);
        console.log(`✅ Loaded existing SQLite database from: ${dbPath}`);
    } else {
        db = new SQL.Database();
        console.log(`✅ Created new SQLite database at: ${dbPath}`);
    }

    // Create tables
    db.run(`
    -- Users table (replaces Firebase Auth + Firestore users)
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT,
      phone_number TEXT,
      role TEXT DEFAULT 'user' CHECK(role IN ('user', 'stakeholder', 'team', 'admin')),
      plan TEXT DEFAULT 'free' CHECK(plan IN ('free', 'premium', 'enterprise')),
      reset_token TEXT,
      reset_token_expiry TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    -- Navigation tabs config (replaces admin_feature_tabs)
    CREATE TABLE IF NOT EXISTS admin_feature_tabs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      config_key TEXT NOT NULL UNIQUE,
      config_value TEXT NOT NULL,
      updated_at TEXT DEFAULT (datetime('now'))
    );

    -- Site settings
    CREATE TABLE IF NOT EXISTS site_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      setting_key TEXT NOT NULL UNIQUE,
      setting_value TEXT NOT NULL,
      updated_at TEXT DEFAULT (datetime('now'))
    );

    -- Form schemas
    CREATE TABLE IF NOT EXISTS form_schemas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      category TEXT,
      schema TEXT NOT NULL,
      ui_schema TEXT,
      is_active INTEGER DEFAULT 1,
      created_by INTEGER,
      updated_by INTEGER,
      version INTEGER DEFAULT 1,
      tags TEXT,
      page_assignments TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    -- Form categories
    CREATE TABLE IF NOT EXISTS form_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      sort_order INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    -- Form submissions
    CREATE TABLE IF NOT EXISTS form_submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      form_id INTEGER,
      form_title TEXT,
      form_data TEXT NOT NULL,
      submitted_by INTEGER,
      status TEXT DEFAULT 'submitted' CHECK(status IN ('draft', 'submitted', 'reviewed', 'approved', 'rejected')),
      reviewer INTEGER,
      reviewed_at TEXT,
      review_notes TEXT,
      metadata TEXT,
      submitted_at TEXT DEFAULT (datetime('now'))
    );

    -- User Q&A logs
    CREATE TABLE IF NOT EXISTS user_qna (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      email TEXT,
      question TEXT NOT NULL,
      answer TEXT,
      ip_address TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- Resources
    CREATE TABLE IF NOT EXISTS resources (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      type TEXT,
      url TEXT,
      file_path TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `);

    saveDatabase();
    console.log("✅ Database schema initialized");
}

// Save database to file
function saveDatabase() {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
}

// Helper functions for sql.js
function getOne(sql, params = []) {
    const stmt = db.prepare(sql);
    stmt.bind(params);
    if (stmt.step()) {
        const row = stmt.getAsObject();
        stmt.free();
        return row;
    }
    stmt.free();
    return null;
}

function getAll(sql, params = []) {
    const stmt = db.prepare(sql);
    stmt.bind(params);
    const results = [];
    while (stmt.step()) {
        results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
}

function run(sql, params = []) {
    db.run(sql, params);
    saveDatabase();
    return { lastInsertRowid: db.exec("SELECT last_insert_rowid()")[0]?.values[0][0] };
}

// ============================================
// MIDDLEWARE
// ============================================

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({ error: "Access token required" });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: "Invalid or expired token" });
        }
        req.user = user;
        next();
    });
};

const optionalAuth = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (token) {
        jwt.verify(token, JWT_SECRET, (err, user) => {
            if (!err) {
                req.user = user;
            }
        });
    }
    next();
};

// ============================================
// AUTH ENDPOINTS
// ============================================

// Email validation helper
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

// Register
app.post("/api/auth/register", async (req, res) => {
    try {
        const { email, password, fullName, phoneNumber } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required" });
        }

        if (!isValidEmail(email)) {
            return res.status(400).json({ error: "Invalid email format" });
        }

        if (password.length < 8) {
            return res.status(400).json({ error: "Password must be at least 8 characters" });
        }

        if (fullName && fullName.length > 100) {
            return res.status(400).json({ error: "Full name must be 100 characters or less" });
        }

        // Check if user exists
        const existingUser = getOne("SELECT id FROM users WHERE email = ?", [email]);
        if (existingUser) {
            return res.status(400).json({ error: "Email already registered" });
        }

        // Hash password
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // Insert user
        const result = run(
            `INSERT INTO users (email, password_hash, full_name, phone_number, role, plan)
       VALUES (?, ?, ?, ?, 'user', 'free')`,
            [email, passwordHash, fullName || null, phoneNumber || null]
        );

        const userId = result.lastInsertRowid;

        // Generate JWT
        const token = jwt.sign(
            { userId, email, role: "user", plan: "free" },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        res.status(201).json({
            message: "Registration successful",
            token,
            user: {
                id: userId,
                email,
                fullName,
                role: "user",
                plan: "free"
            }
        });
    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ error: "Registration failed" });
    }
});

// Login
app.post("/api/auth/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required" });
        }

        // Find user
        const user = getOne("SELECT * FROM users WHERE email = ?", [email]);
        if (!user) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        // Verify password
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        // Generate JWT
        const token = jwt.sign(
            { userId: user.id, email: user.email, role: user.role, plan: user.plan },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        res.json({
            message: "Login successful",
            token,
            user: {
                id: user.id,
                email: user.email,
                fullName: user.full_name,
                role: user.role,
                plan: user.plan
            }
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ error: "Login failed" });
    }
});

// Get auth status
app.get("/api/auth/status", authenticateToken, (req, res) => {
    const user = getOne("SELECT id, email, full_name, role, plan FROM users WHERE id = ?", [req.user.userId]);

    if (!user) {
        return res.status(404).json({ error: "User not found" });
    }

    res.json({
        auth_configured: true,
        auth_mode: "sqlite",
        user: {
            id: user.id,
            email: user.email,
            fullName: user.full_name,
            role: user.role,
            plan: user.plan
        }
    });
});

// Forgot password — generates a reset token (no email sending in local dev)
app.post("/api/auth/forgot-password", (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: "Email is required" });
    }

    const user = getOne("SELECT id FROM users WHERE email = ?", [email]);
    if (user) {
        const resetToken = crypto.randomBytes(32).toString("hex");
        const expiry = new Date(Date.now() + 3600000).toISOString(); // 1 hour
        run(
            "UPDATE users SET reset_token = ?, reset_token_expiry = ?, updated_at = datetime('now') WHERE id = ?",
            [resetToken, expiry, user.id]
        );
        console.log(`🔑 Password reset token for ${email}: ${resetToken}`);
    }

    // Always return success to prevent email enumeration
    res.json({
        message: "If an account with that email exists, a password reset link has been sent."
    });
});

// Reset password with token
app.post("/api/auth/reset-password", async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({ error: "Token and new password are required" });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({ error: "Password must be at least 8 characters" });
        }

        const user = getOne(
            "SELECT id, reset_token_expiry FROM users WHERE reset_token = ?",
            [token]
        );

        if (!user) {
            return res.status(400).json({ error: "Invalid or expired reset token" });
        }

        if (new Date(user.reset_token_expiry) < new Date()) {
            return res.status(400).json({ error: "Reset token has expired" });
        }

        const passwordHash = await bcrypt.hash(newPassword, 10);
        run(
            "UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expiry = NULL, updated_at = datetime('now') WHERE id = ?",
            [passwordHash, user.id]
        );

        res.json({ message: "Password reset successful" });
    } catch (error) {
        console.error("Password reset error:", error);
        res.status(500).json({ error: "Password reset failed" });
    }
});

// ============================================
// USER ENDPOINTS
// ============================================

app.get("/api/users/me", authenticateToken, (req, res) => {
    const user = getOne(
        `SELECT id, email, full_name, phone_number, role, plan, created_at 
     FROM users WHERE id = ?`,
        [req.user.userId]
    );

    if (!user) {
        return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
});

app.put("/api/users/me", authenticateToken, (req, res) => {
    const { fullName, phoneNumber } = req.body;

    run(
        `UPDATE users SET full_name = ?, phone_number = ?, updated_at = datetime('now')
     WHERE id = ?`,
        [fullName, phoneNumber, req.user.userId]
    );

    res.json({ message: "Profile updated successfully" });
});

// ============================================
// ADMIN TABS ENDPOINTS
// ============================================

app.get("/api/admin/tabs", optionalAuth, (req, res) => {
    try {
        const config = getOne("SELECT config_value FROM admin_feature_tabs WHERE config_key = ?", ["access_config_new"]);

        if (config) {
            res.json(JSON.parse(config.config_value));
        } else {
            // Return default empty config
            res.json({});
        }
    } catch (error) {
        console.error("Error fetching tabs:", error);
        res.status(500).json({ error: "Failed to fetch tabs configuration" });
    }
});

app.put("/api/admin/tabs", authenticateToken, (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== "admin") {
            return res.status(403).json({ error: "Admin access required" });
        }

        const configValue = JSON.stringify(req.body);

        // Check if exists
        const existing = getOne("SELECT id FROM admin_feature_tabs WHERE config_key = ?", ["access_config_new"]);

        if (existing) {
            run(
                `UPDATE admin_feature_tabs SET config_value = ?, updated_at = datetime('now') WHERE config_key = ?`,
                [configValue, "access_config_new"]
            );
        } else {
            run(
                `INSERT INTO admin_feature_tabs (config_key, config_value) VALUES (?, ?)`,
                ["access_config_new", configValue]
            );
        }

        // Also save site settings to site_settings table for header display
        if (req.body.siteSettings) {
            const upsertSiteSetting = (key, value) => {
                const existing = getOne("SELECT id FROM site_settings WHERE setting_key = ?", [key]);
                if (existing) {
                    run(`UPDATE site_settings SET setting_value = ?, updated_at = datetime('now') WHERE setting_key = ?`, [value, key]);
                } else {
                    run(`INSERT INTO site_settings (setting_key, setting_value) VALUES (?, ?)`, [key, value]);
                }
            };

            if (req.body.siteSettings.siteTitle !== undefined) {
                upsertSiteSetting('siteTitle', req.body.siteSettings.siteTitle);
            }
            if (req.body.siteSettings.siteHeader !== undefined) {
                upsertSiteSetting('siteHeader', req.body.siteSettings.siteHeader);
            }
        }

        res.json({ message: "Tabs configuration updated successfully" });
    } catch (error) {
        console.error("Error updating tabs:", error);
        res.status(500).json({ error: "Failed to update tabs configuration" });
    }
});

// ============================================
// SITE SETTINGS ENDPOINTS
// ============================================

app.get("/api/settings/site", (req, res) => {
    try {
        const settings = getAll("SELECT setting_key, setting_value FROM site_settings");
        const result = {};
        settings.forEach(s => {
            result[s.setting_key] = s.setting_value;
        });
        res.json(result);
    } catch (error) {
        console.error("Error fetching site settings:", error);
        res.status(500).json({ error: "Failed to fetch site settings" });
    }
});

app.put("/api/settings/site", authenticateToken, (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({ error: "Admin access required" });
        }

        const { siteTitle, siteHeader } = req.body;

        const upsertSetting = (key, value) => {
            const existing = getOne("SELECT id FROM site_settings WHERE setting_key = ?", [key]);
            if (existing) {
                run(`UPDATE site_settings SET setting_value = ?, updated_at = datetime('now') WHERE setting_key = ?`, [value, key]);
            } else {
                run(`INSERT INTO site_settings (setting_key, setting_value) VALUES (?, ?)`, [key, value]);
            }
        };

        if (siteTitle !== undefined) upsertSetting("siteTitle", siteTitle);
        if (siteHeader !== undefined) upsertSetting("siteHeader", siteHeader);

        res.json({ message: "Site settings updated successfully" });
    } catch (error) {
        console.error("Error updating site settings:", error);
        res.status(500).json({ error: "Failed to update site settings" });
    }
});

// ============================================
// FORM SCHEMAS ENDPOINTS
// ============================================

app.get("/api/forms/schemas", optionalAuth, (req, res) => {
    try {
        const { category, pageId } = req.query;

        let sql = "SELECT * FROM form_schemas WHERE is_active = 1";
        const params = [];

        if (category) {
            sql += " AND category = ?";
            params.push(category);
        }

        sql += " ORDER BY created_at DESC";

        let schemas = getAll(sql, params);

        // Filter by pageId in memory (since json contains is not well supported)
        if (pageId) {
            schemas = schemas.filter(s => {
                const assignments = s.page_assignments ? JSON.parse(s.page_assignments) : [];
                return assignments.includes(pageId);
            });
        }

        // Parse JSON fields
        const result = schemas.map(s => ({
            ...s,
            schema: JSON.parse(s.schema || "{}"),
            ui_schema: s.ui_schema ? JSON.parse(s.ui_schema) : null,
            tags: s.tags ? JSON.parse(s.tags) : [],
            page_assignments: s.page_assignments ? JSON.parse(s.page_assignments) : []
        }));

        res.json(result);
    } catch (error) {
        console.error("Error fetching form schemas:", error);
        res.status(500).json({ error: "Failed to fetch form schemas" });
    }
});

app.post("/api/forms/schemas", authenticateToken, (req, res) => {
    try {
        const { title, description, category, schema, uiSchema, tags, pageAssignments } = req.body;

        const result = run(
            `INSERT INTO form_schemas (title, description, category, schema, ui_schema, tags, page_assignments, created_by, updated_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                title,
                description || null,
                category || null,
                JSON.stringify(schema),
                uiSchema ? JSON.stringify(uiSchema) : null,
                tags ? JSON.stringify(tags) : null,
                pageAssignments ? JSON.stringify(pageAssignments) : null,
                req.user.userId,
                req.user.userId
            ]
        );

        res.status(201).json({ id: result.lastInsertRowid, message: "Form schema created" });
    } catch (error) {
        console.error("Error creating form schema:", error);
        res.status(500).json({ error: "Failed to create form schema" });
    }
});

app.get("/api/forms/schemas/:id", (req, res) => {
    try {
        const schema = getOne("SELECT * FROM form_schemas WHERE id = ?", [req.params.id]);

        if (!schema) {
            return res.status(404).json({ error: "Form schema not found" });
        }

        res.json({
            ...schema,
            schema: JSON.parse(schema.schema || "{}"),
            ui_schema: schema.ui_schema ? JSON.parse(schema.ui_schema) : null,
            tags: schema.tags ? JSON.parse(schema.tags) : [],
            page_assignments: schema.page_assignments ? JSON.parse(schema.page_assignments) : []
        });
    } catch (error) {
        console.error("Error fetching form schema:", error);
        res.status(500).json({ error: "Failed to fetch form schema" });
    }
});

app.put("/api/forms/schemas/:id", authenticateToken, (req, res) => {
    try {
        const { title, description, category, schema, uiSchema, isActive, tags, pageAssignments } = req.body;
        const id = req.params.id;

        // Get current schema
        const current = getOne("SELECT * FROM form_schemas WHERE id = ?", [id]);
        if (!current) {
            return res.status(404).json({ error: "Form schema not found" });
        }

        run(
            `UPDATE form_schemas SET
        title = ?,
        description = ?,
        category = ?,
        schema = ?,
        ui_schema = ?,
        is_active = ?,
        tags = ?,
        page_assignments = ?,
        updated_by = ?,
        updated_at = datetime('now'),
        version = version + 1
      WHERE id = ?`,
            [
                title ?? current.title,
                description ?? current.description,
                category ?? current.category,
                schema ? JSON.stringify(schema) : current.schema,
                uiSchema ? JSON.stringify(uiSchema) : current.ui_schema,
                isActive !== undefined ? (isActive ? 1 : 0) : current.is_active,
                tags ? JSON.stringify(tags) : current.tags,
                pageAssignments ? JSON.stringify(pageAssignments) : current.page_assignments,
                req.user.userId,
                id
            ]
        );

        res.json({ message: "Form schema updated" });
    } catch (error) {
        console.error("Error updating form schema:", error);
        res.status(500).json({ error: "Failed to update form schema" });
    }
});

app.delete("/api/forms/schemas/:id", authenticateToken, (req, res) => {
    try {
        run("DELETE FROM form_schemas WHERE id = ?", [req.params.id]);
        res.json({ message: "Form schema deleted" });
    } catch (error) {
        console.error("Error deleting form schema:", error);
        res.status(500).json({ error: "Failed to delete form schema" });
    }
});

// ============================================
// FORM CATEGORIES ENDPOINTS
// ============================================

app.get("/api/forms/categories", (req, res) => {
    try {
        const categories = getAll("SELECT * FROM form_categories WHERE is_active = 1 ORDER BY sort_order");
        res.json(categories);
    } catch (error) {
        console.error("Error fetching categories:", error);
        res.status(500).json({ error: "Failed to fetch categories" });
    }
});

app.post("/api/forms/categories", authenticateToken, (req, res) => {
    try {
        const { name, description, order } = req.body;

        const result = run(
            `INSERT INTO form_categories (name, description, sort_order) VALUES (?, ?, ?)`,
            [name, description || null, order || 0]
        );

        res.status(201).json({ id: result.lastInsertRowid, message: "Category created" });
    } catch (error) {
        console.error("Error creating category:", error);
        res.status(500).json({ error: "Failed to create category" });
    }
});

// ============================================
// FORM SUBMISSIONS ENDPOINTS
// ============================================

app.get("/api/forms/submissions", authenticateToken, (req, res) => {
    try {
        const { formId, status } = req.query;

        let sql = "SELECT * FROM form_submissions WHERE 1=1";
        const params = [];

        if (formId) {
            sql += " AND form_id = ?";
            params.push(formId);
        }

        if (status) {
            sql += " AND status = ?";
            params.push(status);
        }

        // Non-admin users can only see their own submissions
        if (req.user.role !== "admin") {
            sql += " AND submitted_by = ?";
            params.push(req.user.userId);
        }

        sql += " ORDER BY submitted_at DESC";

        const submissions = getAll(sql, params);

        res.json(submissions.map(s => ({
            ...s,
            form_data: JSON.parse(s.form_data || "{}"),
            metadata: s.metadata ? JSON.parse(s.metadata) : null
        })));
    } catch (error) {
        console.error("Error fetching submissions:", error);
        res.status(500).json({ error: "Failed to fetch submissions" });
    }
});

app.post("/api/forms/submissions", authenticateToken, (req, res) => {
    try {
        const { formId, formTitle, formData, status, metadata } = req.body;

        const result = run(
            `INSERT INTO form_submissions (form_id, form_title, form_data, submitted_by, status, metadata)
       VALUES (?, ?, ?, ?, ?, ?)`,
            [
                formId,
                formTitle,
                JSON.stringify(formData),
                req.user.userId,
                status || "submitted",
                metadata ? JSON.stringify(metadata) : null
            ]
        );

        res.status(201).json({ id: result.lastInsertRowid, message: "Submission created" });
    } catch (error) {
        console.error("Error creating submission:", error);
        res.status(500).json({ error: "Failed to create submission" });
    }
});

app.put("/api/forms/submissions/:id", authenticateToken, (req, res) => {
    try {
        const { status, reviewNotes } = req.body;

        run(
            `UPDATE form_submissions SET
        status = COALESCE(?, status),
        review_notes = COALESCE(?, review_notes),
        reviewer = ?,
        reviewed_at = datetime('now')
      WHERE id = ?`,
            [status, reviewNotes, req.user.userId, req.params.id]
        );

        res.json({ message: "Submission updated" });
    } catch (error) {
        console.error("Error updating submission:", error);
        res.status(500).json({ error: "Failed to update submission" });
    }
});

// ============================================
// USER Q&A ENDPOINTS
// ============================================

app.get("/api/qna", authenticateToken, (req, res) => {
    try {
        // Only admin can see all Q&A
        if (req.user.role !== "admin") {
            return res.status(403).json({ error: "Admin access required" });
        }

        const qna = getAll("SELECT * FROM user_qna ORDER BY created_at DESC");
        res.json(qna);
    } catch (error) {
        console.error("Error fetching Q&A:", error);
        res.status(500).json({ error: "Failed to fetch Q&A logs" });
    }
});

app.post("/api/qna", optionalAuth, async (req, res) => {
    try {
        const { question, answer, email } = req.body;
        const ipAddress = req.headers["x-forwarded-for"] || req.socket.remoteAddress;

        const result = run(
            `INSERT INTO user_qna (user_id, email, question, answer, ip_address)
       VALUES (?, ?, ?, ?, ?)`,
            [
                req.user?.userId || null,
                email || req.user?.email || null,
                question,
                answer || null,
                ipAddress
            ]
        );

        res.status(201).json({ id: result.lastInsertRowid, message: "Q&A logged" });
    } catch (error) {
        console.error("Error logging Q&A:", error);
        res.status(500).json({ error: "Failed to log Q&A" });
    }
});

// ============================================
// ADMIN USER MANAGEMENT ENDPOINTS
// ============================================

// Get all users (admin only)
app.get("/api/admin/users", authenticateToken, (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({ error: "Admin access required" });
        }

        const users = getAll("SELECT id, email, full_name, role, plan, created_at FROM users ORDER BY created_at DESC");
        res.json(users);
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ error: "Failed to fetch users" });
    }
});

// Update user role (admin only, or promote first user to admin)
app.put("/api/admin/users/:id/role", authenticateToken, (req, res) => {
    try {
        const { role } = req.body;
        const targetUserId = parseInt(req.params.id);

        // Check if valid role
        if (!["user", "stakeholder", "team", "admin"].includes(role)) {
            return res.status(400).json({ error: "Invalid role" });
        }

        // Allow if current user is admin OR if this is the first user (id=1) promoting themselves
        const isAdmin = req.user.role === "admin";
        const isSelfPromotion = req.user.userId === targetUserId && targetUserId === 1;

        if (!isAdmin && !isSelfPromotion) {
            return res.status(403).json({ error: "Admin access required" });
        }

        run(
            "UPDATE users SET role = ?, updated_at = datetime('now') WHERE id = ?",
            [role, targetUserId]
        );

        res.json({ message: `User role updated to ${role}` });
    } catch (error) {
        console.error("Error updating user role:", error);
        res.status(500).json({ error: "Failed to update user role" });
    }
});

// Make first registered user an admin (bootstrap endpoint)
app.post("/api/admin/bootstrap", async (req, res) => {
    try {
        const { email, secret } = req.body;

        // Simple bootstrap security - require a secret or first user check
        const bootstrapSecret = process.env.BOOTSTRAP_SECRET || "make-me-admin";

        if (secret !== bootstrapSecret) {
            return res.status(403).json({ error: "Invalid bootstrap secret" });
        }

        const user = getOne("SELECT id, role FROM users WHERE email = ?", [email]);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        run("UPDATE users SET role = 'admin', updated_at = datetime('now') WHERE id = ?", [user.id]);

        res.json({ message: `User ${email} is now an admin` });
    } catch (error) {
        console.error("Error in bootstrap:", error);
        res.status(500).json({ error: "Bootstrap failed" });
    }
});

// Seed default navigation tabs (for initial setup)
app.post("/api/admin/seed", (req, res) => {
    try {
        const { secret } = req.body;
        const seedSecret = process.env.SEED_SECRET || "seed-default-data";

        if (secret !== seedSecret) {
            return res.status(403).json({ error: "Invalid seed secret" });
        }

        // Check if data already exists
        const existing = getOne("SELECT id FROM admin_feature_tabs WHERE config_key = ?", ["access_config_new"]);
        if (existing) {
            return res.status(200).json({ message: "Navigation tabs already seeded" });
        }

        // Default navigation configuration
        const defaultConfig = {
            "assets": {
                "public": true,
                "admin": true,
                "stakeholders": true,
                "team": true,
                "customHeading": "AskAtul",
                "order": 1,
                "subtabs": [
                    { "title": "Chat", "path": "/retrieval", "loginUrl": "" },
                    { "title": "Maps", "path": "/map", "loginUrl": "" }
                ]
            },
            "forms": {
                "public": true,
                "admin": true,
                "stakeholders": true,
                "team": true,
                "customHeading": "Forms",
                "order": 2,
                "subtabs": [
                    { "title": "Forms", "path": "/forms", "loginUrl": "" }
                ]
            },
            "admin": {
                "public": false,
                "admin": true,
                "stakeholders": false,
                "team": false,
                "customHeading": "Admin",
                "order": 3,
                "subtabs": [
                    { "title": "Documents", "path": "/access/idoc", "loginUrl": "" },
                    { "title": "Chat Logs", "path": "/access/ilog", "loginUrl": "" },
                    { "title": "Settings", "path": "/access/admin-features", "loginUrl": "" }
                ]
            },
            "siteSettings": {
                "siteTitle": "Rezolution Bazar",
                "siteHeader": "Powered by SQLite"
            }
        };

        run(
            `INSERT INTO admin_feature_tabs (config_key, config_value) VALUES (?, ?)`,
            ["access_config_new", JSON.stringify(defaultConfig)]
        );

        console.log("✅ Default navigation tabs seeded");
        res.status(201).json({ message: "Navigation tabs seeded successfully", config: defaultConfig });
    } catch (error) {
        console.error("Error seeding data:", error);
        res.status(500).json({ error: "Seed failed" });
    }
});

// ============================================
// RESOURCES ENDPOINTS
// ============================================

app.get("/api/resources", (req, res) => {
    try {
        const { type } = req.query;

        let sql = "SELECT * FROM resources WHERE is_active = 1";
        const params = [];

        if (type) {
            sql += " AND type = ?";
            params.push(type);
        }

        sql += " ORDER BY created_at DESC";

        const resources = getAll(sql, params);
        res.json(resources);
    } catch (error) {
        console.error("Error fetching resources:", error);
        res.status(500).json({ error: "Failed to fetch resources" });
    }
});

app.post("/api/resources", authenticateToken, (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({ error: "Admin access required" });
        }

        const { title, description, type, url, filePath } = req.body;

        if (!title) {
            return res.status(400).json({ error: "Title is required" });
        }

        const result = run(
            `INSERT INTO resources (title, description, type, url, file_path) VALUES (?, ?, ?, ?, ?)`,
            [title, description || null, type || null, url || null, filePath || null]
        );

        res.status(201).json({ id: result.lastInsertRowid, message: "Resource created" });
    } catch (error) {
        console.error("Error creating resource:", error);
        res.status(500).json({ error: "Failed to create resource" });
    }
});

app.delete("/api/resources/:id", authenticateToken, (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({ error: "Admin access required" });
        }

        run("UPDATE resources SET is_active = 0, updated_at = datetime('now') WHERE id = ?", [req.params.id]);
        res.json({ message: "Resource deleted" });
    } catch (error) {
        console.error("Error deleting resource:", error);
        res.status(500).json({ error: "Failed to delete resource" });
    }
});

// ============================================
// HEALTH & ROOT ENDPOINTS
// ============================================

app.get("/health", (req, res) => {
    res.json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        service: "rezolution-bazar-api",
        database: "sqlite"
    });
});

app.get("/", (req, res) => {
    res.json({
        message: "Rezolution Bazar API",
        version: "1.0.0",
        database: "SQLite",
        endpoints: {
            health: "/health",
            auth: {
                register: "POST /api/auth/register",
                login: "POST /api/auth/login",
                status: "GET /api/auth/status",
                forgotPassword: "POST /api/auth/forgot-password",
                resetPassword: "POST /api/auth/reset-password"
            },
            users: {
                me: "GET/PUT /api/users/me"
            },
            admin: {
                tabs: "GET/PUT /api/admin/tabs",
                siteSettings: "GET/PUT /api/settings/site"
            },
            forms: {
                schemas: "GET/POST /api/forms/schemas",
                schemaById: "GET/PUT/DELETE /api/forms/schemas/:id",
                categories: "GET/POST /api/forms/categories",
                submissions: "GET/POST /api/forms/submissions"
            },
            qna: "GET/POST /api/qna",
            resources: "GET/POST/DELETE /api/resources"
        }
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error("❌ Unhandled error:", err);
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

// Start server after database initialization
initDatabase().then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 Rezolution Bazar API running on port ${PORT}`);
        console.log(`📊 Database: SQLite (${dbPath})`);
        console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
    });
}).catch(err => {
    console.error("Failed to initialize database:", err);
    process.exit(1);
});

module.exports = app;
