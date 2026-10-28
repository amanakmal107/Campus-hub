const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../db');
const { asyncHandler } = require('../middleware/errorHandler');

const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
  );
  const refreshToken = jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );
  return { accessToken, refreshToken };
};

const sendOtpNotification = (email, otp) => {
  console.log('\n┌────────────────────────────────────────────────────────┐');
  console.log('│ 📬 CampusHub Student Email OTP Verification            │');
  console.log(`│ Student Email: ${email.padEnd(39)} │`);
  console.log(`│ One-Time Password (OTP): [ ${otp} ]                     │`);
  console.log('│ Valid for: 10 minutes                                  │');
  console.log('└────────────────────────────────────────────────────────┘\n');
};

exports.register = asyncHandler(async (req, res) => {
  const { name, email, password, college, course, year } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email and password are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  const existing = await query('SELECT id, is_verified FROM users WHERE email = $1', [email.toLowerCase().trim()]);
  if (existing.rows.length) {
    const user = existing.rows[0];
    if (user.is_verified) {
      return res.status(409).json({ error: 'Email already registered and verified. Please log in.' });
    } else {
      // User registered earlier but didn't verify OTP, regenerate OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      await query(
        `UPDATE users SET otp_code = $1, otp_expires_at = NOW() + INTERVAL '10 minutes' WHERE id = $2`,
        [otp, user.id]
      );
      sendOtpNotification(email, otp);
      return res.status(200).json({
        message: 'Account pending verification. A fresh OTP has been sent.',
        email: email.toLowerCase().trim(),
        needsVerification: true,
        previewOtp: otp,
      });
    }
  }

  const hash = await bcrypt.hash(password, 10);
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  const { rows } = await query(
    `INSERT INTO users (name, email, password_hash, college, course, year, is_verified, otp_code, otp_expires_at)
     VALUES ($1, $2, $3, $4, $5, $6, FALSE, $7, NOW() + INTERVAL '10 minutes')
     RETURNING id, name, email, college, course, year, avatar_url, created_at`,
    [name.trim(), email.toLowerCase().trim(), hash, college, course, year ? parseInt(year) : null, otp]
  );

  const user = rows[0];
  sendOtpNotification(user.email, otp);

  res.status(201).json({
    message: 'Verification OTP sent to your college email!',
    email: user.email,
    needsVerification: true,
    previewOtp: otp,
  });
});

exports.verifyOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ error: 'Email and 6-digit OTP code are required' });
  }

  const { rows } = await query(
    'SELECT * FROM users WHERE email = $1',
    [email.toLowerCase().trim()]
  );

  if (!rows.length) {
    return res.status(404).json({ error: 'Student account not found' });
  }

  const user = rows[0];

  if (user.is_verified) {
    const { accessToken, refreshToken } = generateTokens(user.id);
    const { password_hash, refresh_token, otp_code, ...safeUser } = user;
    return res.json({
      message: 'Account is already verified!',
      user: safeUser,
      accessToken,
      refreshToken,
    });
  }

  if (!user.otp_code || user.otp_code !== otp.trim()) {
    return res.status(400).json({ error: 'Invalid verification code. Please check and try again.' });
  }

  if (new Date() > new Date(user.otp_expires_at)) {
    return res.status(400).json({ error: 'Verification code has expired. Please request a new OTP.' });
  }

  // Mark user verified
  const { accessToken, refreshToken } = generateTokens(user.id);

  const { rows: updatedRows } = await query(
    `UPDATE users 
     SET is_verified = TRUE, otp_code = NULL, otp_expires_at = NULL, refresh_token = $1, is_online = TRUE 
     WHERE id = $2 
     RETURNING id, name, email, college, course, year, bio, avatar_url, is_verified, created_at`,
    [refreshToken, user.id]
  );

  console.log(`✅ [OTP VERIFIED] Student ${user.email} successfully verified their email!`);

  res.json({
    message: 'Email verified successfully! Welcome to CampusHub.',
    user: updatedRows[0],
    accessToken,
    refreshToken,
  });
});

exports.resendOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const { rows } = await query(
    'SELECT id, email, is_verified FROM users WHERE email = $1',
    [email.toLowerCase().trim()]
  );

  if (!rows.length) {
    return res.status(404).json({ error: 'Student account not found' });
  }

  const user = rows[0];
  if (user.is_verified) {
    return res.status(400).json({ error: 'Account is already verified. You can log in directly.' });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  await query(
    `UPDATE users SET otp_code = $1, otp_expires_at = NOW() + INTERVAL '10 minutes' WHERE id = $2`,
    [otp, user.id]
  );

  sendOtpNotification(user.email, otp);

  res.json({
    message: 'A fresh 6-digit OTP code has been sent to your email!',
    email: user.email,
    previewOtp: otp,
  });
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const { rows } = await query(
    'SELECT * FROM users WHERE email = $1',
    [email.toLowerCase().trim()]
  );

  if (!rows.length) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const user = rows[0];
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  // Check email OTP verification
  if (!user.is_verified) {
    let otp = user.otp_code;
    const isExpired = !user.otp_expires_at || new Date() > new Date(user.otp_expires_at);

    if (!otp || isExpired) {
      otp = Math.floor(100000 + Math.random() * 900000).toString();
      await query(
        `UPDATE users SET otp_code = $1, otp_expires_at = NOW() + INTERVAL '10 minutes' WHERE id = $2`,
        [otp, user.id]
      );
      sendOtpNotification(user.email, otp);
    }

    return res.status(403).json({
      error: 'Your email has not been verified yet. Please enter the 6-digit OTP sent to your email.',
      needsVerification: true,
      email: user.email,
      previewOtp: otp,
    });
  }

  const { accessToken, refreshToken } = generateTokens(user.id);
  await query('UPDATE users SET refresh_token = $1, is_online = TRUE WHERE id = $2', [refreshToken, user.id]);

  const { password_hash, refresh_token, otp_code, otp_expires_at, ...safeUser } = user;

  res.json({ user: safeUser, accessToken, refreshToken });
});

exports.logout = asyncHandler(async (req, res) => {
  await query(
    'UPDATE users SET refresh_token = NULL, is_online = FALSE WHERE id = $1',
    [req.user.id]
  );
  res.json({ message: 'Logged out successfully' });
});

exports.me = asyncHandler(async (req, res) => {
  const { rows } = await query(
    'SELECT id, name, email, college, course, year, bio, avatar_url, is_online, is_verified, created_at FROM users WHERE id = $1',
    [req.user.id]
  );
  res.json({ user: rows[0] });
});

exports.refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(401).json({ error: 'Refresh token required' });
  }

  let decoded;
  try {
    decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch {
    return res.status(401).json({ error: 'Invalid refresh token' });
  }

  const { rows } = await query(
    'SELECT id FROM users WHERE id = $1 AND refresh_token = $2',
    [decoded.id, refreshToken]
  );

  if (!rows.length) {
    return res.status(401).json({ error: 'Refresh token revoked or invalid' });
  }

  const tokens = generateTokens(rows[0].id);
  await query('UPDATE users SET refresh_token = $1 WHERE id = $2', [tokens.refreshToken, rows[0].id]);

  res.json(tokens);
});
