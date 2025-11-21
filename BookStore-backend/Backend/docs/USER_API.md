### User API - Tất cả chức năng trong một tài liệu

Tài liệu này gom toàn bộ phần API dành cho user (JWT, register, login, forgot-password, profile) vào một chỗ để bạn dễ xem và tái sử dụng. Phần mã chạy thực tế nằm ở `routes/apiUser.js` và `models/User.js`; dưới đây là tổng hợp ở dạng Markdown.

---

### Yêu cầu môi trường
- **JWT_SECRET**: Secret để ký JWT (bắt buộc)
- **EMAIL_USER**, **EMAIL_PASS**: Tài khoản email dùng để gửi mail reset password (Gmail)

---

### Các endpoint
- `POST /api/register`: Đăng ký tài khoản mới, trả về `{ message, user{id, username, role}, token }`
- `POST /api/login`: Đăng nhập, trả về `{ message, user{id, username, role, avatar}, token }`
- `POST /api/forgot-password`: Gửi email chứa link reset password, trả về `{ message }` (không tiết lộ tài khoản có tồn tại)
- `GET /api/profile`: Lấy profile user hiện tại (cần header `Authorization: Bearer <token>`)

---

### Middleware & Helpers
- `authenticateToken`: Đọc header Bearer token, xác thực JWT, nạp `req.user`
- `generateToken(userId)`: Tạo token hết hạn sau 7 ngày

---

### Mã nguồn đầy đủ - Router User API (`routes/apiUser.js`)

```javascript
const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const User = require('../models/User');

const router = express.Router();

// JWT Authentication middleware for API
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ error: 'JWT_SECRET is not configured.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid token.' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token.' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired.' });
    }
    console.error('Authentication error:', error);
    res.status(401).json({ error: 'Invalid token.' });
  }
};

const generateToken = (userId) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured.');
  }
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// ===== API REGISTER =====
router.post('/api/register', 
  body('username').isLength({ min: 1 }).withMessage('Username is required.'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long.'),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Validation failed',
          errors: errors.array() 
        });
      }

      const { username, password } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({ error: 'Username already exists.' });
      }

      // Create new user
      const user = new User({
        username,
        password
      });

      await user.save();

      // Generate token
      const token = generateToken(user._id);

      // Return user and token
      return res.status(201).json({
        message: 'Registration successful',
        user: {
          id: user._id.toString(),
          username: user.username,
          role: user.role
        },
        token
      });
    } catch (err) {
      console.error('Register error:', err);
      return res.status(500).json({ error: 'Server error: ' + err.message });
    }
  }
);

// ===== API LOGIN =====
router.post('/api/login',
  body('username').notEmpty().withMessage('Username is required.'),
  body('password').notEmpty().withMessage('Password is required.'),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Validation failed',
          errors: errors.array() 
        });
      }

      const { username, password } = req.body;

      // Find user
      const user = await User.findOne({ username });
      if (!user) {
        return res.status(401).json({ error: 'Invalid username or password.' });
      }

      // Check password
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid username or password.' });
      }

      // Generate token
      const token = generateToken(user._id);

      // Return user and token
      return res.json({
        message: 'Login successful',
        user: {
          id: user._id.toString(),
          username: user.username,
          role: user.role,
          avatar: user.avatar
        },
        token
      });
    } catch (err) {
      console.error('Login error:', err);
      return res.status(500).json({ error: 'Server error: ' + err.message });
    }
  }
);

// ===== API FORGOT PASSWORD =====
router.post('/api/forgot-password',
  body('username').notEmpty().withMessage('Username is required.'),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Validation failed',
          errors: errors.array() 
        });
      }

      const token = crypto.randomBytes(20).toString('hex');
      const user = await User.findOne({ username: req.body.username });

      if (!user) {
        // For security, don't reveal if user exists
        return res.json({ 
          message: 'If an account with that username exists, a reset link has been sent.' 
        });
      }

      user.resetPasswordToken = token;
      user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
      await user.save();

      // Send email
      const transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });

      const resetUrl = `http://${req.headers.host}/reset-password/${token}`;
      const mailOptions = {
        to: user.username,
        from: process.env.EMAIL_USER,
        subject: 'Password Reset Request',
        text: `You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n
          Please click on the following link, or paste this into your browser to complete the process:\n\n
          ${resetUrl}\n\n
          If you did not request this, please ignore this email and your password will remain unchanged.\n`
      };

      await transporter.sendMail(mailOptions);

      return res.json({ 
        message: 'If an account with that username exists, a reset link has been sent.' 
      });
    } catch (err) {
      console.error('Forgot password error:', err);
      return res.status(500).json({ error: 'Server error' });
    }
  }
);

// ===== API GET PROFILE (requires authentication) =====
router.get('/api/profile', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    return res.json({
      user: {
        id: user._id.toString(),
        username: user.username,
        role: user.role,
        avatar: user.avatar
      }
    });
  } catch (err) {
    console.error('Get profile error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
```

---

### Mã nguồn model User (`models/User.js`)

```javascript
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['customer', 'admin'], default: 'customer' },
  avatar: { type: String },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  // Account status
  isActive: { type: Boolean, default: true },
  // Coin wallet system
  coinBalance: {
    type: Number,
    default: 0,
    min: 0
  },
  profile: {
    fullName: { type: String },
    email: { type: String },
    phone: { type: String },
    address: { type: String },
    city: { type: String },
    postalCode: { type: String }
  }
}, { timestamps: true });

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

// Method to compare passwords
UserSchema.methods.comparePassword = function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to add coins to user balance
UserSchema.methods.addCoins = function(amount, description = '') {
  this.coinBalance += amount;
  return this.save();
};

// Method to deduct coins from user balance
UserSchema.methods.deductCoins = function(amount, description = '') {
  if (this.coinBalance < amount) {
    throw new Error('Insufficient coin balance');
  }
  this.coinBalance -= amount;
  return this.save();
};

// Method to check if user has enough coins
UserSchema.methods.hasEnoughCoins = function(amount) {
  return this.coinBalance >= amount;
};

module.exports = mongoose.model('User', UserSchema);
```

---

### Cách dùng nhanh
- Gửi `POST /api/register` với `{ username, password }` để tạo tài khoản và nhận token.
- Gửi `POST /api/login` với `{ username, password }` để nhận token.
- Gửi `POST /api/forgot-password` với `{ username }` để nhận email reset.
- Gửi `GET /api/profile` với header `Authorization: Bearer <token>` để lấy thông tin user.


