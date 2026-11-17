const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');

const app = express();
const PORT = process.env.AUTH_PORT || 5002;
const SECRET_KEY = process.env.SECRET_KEY || 'powerpulse_secret_super_key_jwt_token_2026';
const DB_PATH = process.env.DATABASE_PATH || path.resolve(__dirname, '../backend/powerpulse.db');

// Connect to SQLite Database
let db;
try {
  db = new DatabaseSync(DB_PATH);
  console.log(`[Node.js Auth Backend] Connected to SQLite database at ${DB_PATH}`);
} catch (err) {
  console.error(`[Node.js Auth Backend] Failed to connect to SQLite:`, err);
  process.exit(1);
}

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Strict Email Verification Regex & Fake Domain Blacklist
const STRICT_EMAIL_REGEX = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;
const SPECIAL_CHARS_REGEX = /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?/~`]/;
const DISPOSABLE_OR_FAKE_DOMAINS = new Set([
  'fake.com', 'test.com', 'example.com', 'sample.com', 'invalid.com', 'asdf.com',
  'dummy.com', 'foo.com', 'bar.com', 'none.com', 'tempmail.com', 'mailinator.com',
  '10minutemail.com', 'guerrillamail.com', 'trashmail.com', 'dispostable.com',
  'throwawaymail.com', 'sharklasers.com', 'yopmail.com', 'fakeinbox.com',
  'temp-mail.org', 'getairmail.com', 'discard.email', 'nada.ltd'
]);

function validateRealWorldEmail(emailClean) {
  if (!STRICT_EMAIL_REGEX.test(emailClean)) {
    throw { status: 400, detail: 'Please enter a valid email address with a proper domain (e.g. name@gmail.com).' };
  }
  const domain = emailClean.split('@')[1].toLowerCase();
  if (DISPOSABLE_OR_FAKE_DOMAINS.has(domain)) {
    throw { status: 400, detail: `The email domain '${domain}' is disposable or fake. Please use a real active email provider (e.g. Gmail, Outlook, Yahoo, University, or Company email).` };
  }
  const parts = domain.split('.');
  if (parts.length < 2 || parts[0].length < 2) {
    throw { status: 400, detail: `Invalid domain structure in '${domain}'. Please provide a valid domain name.` };
  }
  const tld = parts[parts.length - 1];
  if (!/^[a-zA-Z]{2,24}$/.test(tld)) {
    throw { status: 400, detail: `Invalid domain extension in '${domain}'. Please provide a valid email domain.` };
  }
}

function generateToken(userId) {
  const expiresInSeconds = 60 * 60 * 24 * 7; // 7 days
  return jwt.sign(
    {
      sub: String(userId),
      exp: Math.floor(Date.now() / 1000) + expiresInSeconds
    },
    SECRET_KEY,
    { algorithm: 'HS256' }
  );
}

// ----------------------------------------------------
// ROUTES
// ----------------------------------------------------

// Health Check
app.get(['/api/auth/health', '/health'], (req, res) => {
  res.json({
    status: 'healthy',
    service: 'PowerPulse AI Node.js Authentication Service',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// 1. REGISTER USER
app.post(['/api/auth/register', '/register'], (req, res) => {
  try {
    const { email, full_name, name, password } = req.body || {};
    const emailClean = (email || '').trim().toLowerCase();
    const nameClean = (full_name || name || '').trim();
    const pwd = password || '';

    // Validate inputs
    validateRealWorldEmail(emailClean);

    if (nameClean.length < 2) {
      return res.status(400).json({ detail: 'Full name must be at least 2 characters long.' });
    }

    if (pwd.length < 8) {
      return res.status(400).json({ detail: 'Password must be at least 8 characters long.' });
    }
    if (!/\d/.test(pwd)) {
      return res.status(400).json({ detail: 'Password must contain at least one numeric digit (0-9).' });
    }
    if (!SPECIAL_CHARS_REGEX.test(pwd)) {
      return res.status(400).json({ detail: 'Password must contain at least one special character (e.g. ! @ # $ % ^ & *).' });
    }
    if (!/[a-zA-Z]/.test(pwd)) {
      return res.status(400).json({ detail: 'Password must contain alphabetic characters.' });
    }

    // Check duplicate
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(emailClean);
    if (existing) {
      return res.status(400).json({ detail: 'An account with this email address already exists. Please sign in instead.' });
    }

    // Generate 6-Digit OTP code & expiry
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const hashedPassword = bcrypt.hashSync(pwd, 12);
    const createdAt = new Date().toISOString();

    const insertUser = db.prepare(`
      INSERT INTO users (email, full_name, hashed_password, is_verified, verification_code, verification_code_expires_at, is_active, created_at)
      VALUES (?, ?, ?, 0, ?, ?, 1, ?)
    `);
    const info = insertUser.run(emailClean, nameClean, hashedPassword, otpCode, expiresAt, createdAt);
    const userId = Number(info.lastInsertRowid);

    // Initialize default tariff & settings if not existing
    const existingTariff = db.prepare('SELECT id FROM electricity_tariffs WHERE user_id = ?').get(userId);
    if (!existingTariff) {
      db.prepare(`
        INSERT INTO electricity_tariffs (user_id, currency, tariff_per_kwh, fixed_monthly_charge, tax_rate_pct, is_active)
        VALUES (?, '₹', 7.50, 120.00, 5.0, 1)
      `).run(userId);
    }

    const existingSettings = db.prepare('SELECT id FROM user_settings WHERE user_id = ?').get(userId);
    if (!existingSettings) {
      db.prepare(`
        INSERT INTO user_settings (user_id, default_currency, default_tariff, theme, notifications_enabled)
        VALUES (?, '₹', 7.50, 'light', 1)
      `).run(userId);
    }

    const token = generateToken(userId);

    return res.status(201).json({
      access_token: token,
      token_type: 'bearer',
      user: {
        id: userId,
        email: emailClean,
        full_name: nameClean,
        is_active: true,
        is_verified: false,
        created_at: createdAt
      },
      is_verified: false,
      requires_verification: true,
      verification_code: otpCode,
      message: `Account created. A 6-digit security verification code has been dispatched to ${emailClean}.`
    });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ detail: err.detail });
    }
    console.error('[Node.js Auth] Registration error:', err);
    return res.status(500).json({ detail: 'An internal error occurred during registration.' });
  }
});

// 2. VERIFY 6-DIGIT OTP CODE
app.post(['/api/auth/verify-code', '/verify-code'], (req, res) => {
  try {
    const { email, code } = req.body || {};
    const emailClean = (email || '').trim().toLowerCase();
    const codeClean = (code || '').trim();

    const user = db.prepare('SELECT id, email, full_name, is_verified, verification_code, verification_code_expires_at, is_active, created_at FROM users WHERE email = ?').get(emailClean);
    if (!user) {
      return res.status(404).json({ detail: 'Account with this email does not exist.' });
    }

    if (user.is_verified) {
      const token = generateToken(user.id);
      return res.json({
        access_token: token,
        token_type: 'bearer',
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          is_active: Boolean(user.is_active),
          is_verified: true,
          created_at: user.created_at
        },
        is_verified: true,
        message: 'Account is already verified.'
      });
    }

    if (!user.verification_code || user.verification_code !== codeClean) {
      return res.status(400).json({ detail: "Invalid 6-digit verification code. Please check your email or click 'Resend Code'." });
    }

    // Expiration check
    if (user.verification_code_expires_at) {
      const expDate = new Date(user.verification_code_expires_at);
      if (new Date() > expDate) {
        return res.status(400).json({ detail: 'Verification code has expired. Please request a new code.' });
      }
    }

    // Mark verified
    db.prepare(`
      UPDATE users SET is_verified = 1, verification_code = NULL, verification_code_expires_at = NULL WHERE id = ?
    `).run(user.id);

    const token = generateToken(user.id);

    return res.json({
      access_token: token,
      token_type: 'bearer',
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        is_active: Boolean(user.is_active),
        is_verified: true,
        created_at: user.created_at
      },
      is_verified: true,
      requires_verification: false,
      verification_code: null,
      message: 'Email verified successfully! Welcome to PowerPulse AI.'
    });
  } catch (err) {
    console.error('[Node.js Auth] Verify code error:', err);
    return res.status(500).json({ detail: 'Failed to verify security code.' });
  }
});

// 3. RESEND VERIFICATION CODE
app.post(['/api/auth/resend-code', '/resend-code'], (req, res) => {
  try {
    const { email } = req.body || {};
    const emailClean = (email || '').trim().toLowerCase();

    const user = db.prepare('SELECT id, email FROM users WHERE email = ?').get(emailClean);
    if (!user) {
      return res.status(404).json({ detail: 'Account with this email does not exist.' });
    }

    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    db.prepare(`
      UPDATE users SET verification_code = ?, verification_code_expires_at = ? WHERE id = ?
    `).run(newOtp, expiresAt, user.id);

    return res.json({
      message: `A new 6-digit verification code has been dispatched to ${emailClean}.`,
      verification_code: newOtp
    });
  } catch (err) {
    console.error('[Node.js Auth] Resend code error:', err);
    return res.status(500).json({ detail: 'Failed to resend verification code.' });
  }
});

// 4. LOGIN USER
app.post(['/api/auth/login', '/login'], (req, res) => {
  try {
    const { email, password } = req.body || {};
    const emailClean = (email || '').trim().toLowerCase();
    const pwd = password || '';

    if (!emailClean || !pwd) {
      return res.status(400).json({ detail: 'Please provide both your email address and password.' });
    }

    const user = db.prepare('SELECT id, email, full_name, hashed_password, is_verified, is_active, created_at FROM users WHERE email = ?').get(emailClean);
    if (!user || !bcrypt.compareSync(pwd, user.hashed_password)) {
      return res.status(401).json({ detail: 'Incorrect email or password. Please verify your credentials or register a new account.' });
    }

    if (!user.is_active) {
      return res.status(403).json({ detail: 'Your account has been deactivated. Please contact support.' });
    }

    const token = generateToken(user.id);

    // If unverified, issue a fresh 6-digit OTP
    if (!user.is_verified) {
      const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

      db.prepare(`
        UPDATE users SET verification_code = ?, verification_code_expires_at = ? WHERE id = ?
      `).run(newOtp, expiresAt, user.id);

      return res.json({
        access_token: token,
        token_type: 'bearer',
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          is_active: true,
          is_verified: false,
          created_at: user.created_at
        },
        is_verified: false,
        requires_verification: true,
        verification_code: newOtp,
        message: `Email verification required. A 6-digit security code has been sent to ${emailClean}.`
      });
    }

    return res.json({
      access_token: token,
      token_type: 'bearer',
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        is_active: true,
        is_verified: true,
        created_at: user.created_at
      },
      is_verified: true,
      requires_verification: false,
      verification_code: null,
      message: null
    });
  } catch (err) {
    console.error('[Node.js Auth] Login error:', err);
    return res.status(500).json({ detail: 'An error occurred during authentication.' });
  }
});

// 5. CURRENT USER PROFILE (/me)
app.get(['/api/auth/me', '/me'], (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ detail: 'Not authenticated. Missing Bearer token.' });
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, SECRET_KEY, { algorithms: ['HS256'] });
    } catch {
      return res.status(401).json({ detail: 'Invalid or expired token.' });
    }

    const userId = Number(decoded.sub);
    const user = db.prepare('SELECT id, email, full_name, is_active, is_verified, created_at FROM users WHERE id = ?').get(userId);
    if (!user) {
      return res.status(404).json({ detail: 'User not found.' });
    }

    return res.json({
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      is_active: Boolean(user.is_active),
      is_verified: Boolean(user.is_verified),
      created_at: user.created_at
    });
  } catch (err) {
    console.error('[Node.js Auth] Profile fetch error:', err);
    return res.status(500).json({ detail: 'Failed to fetch user profile.' });
  }
});

// Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 [Node.js Authentication Server] running on http://0.0.0.0:${PORT}`);
});
