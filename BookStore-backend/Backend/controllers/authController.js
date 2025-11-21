const { body, validationResult } = require('express-validator');
const passport = require('passport');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const User = require('../models/User');

// Display register form
exports.getRegister = (req, res) => {
  res.render('register', { title: 'Register', errors: [] });
};

// Handle register
exports.postRegister = [
  body('username').isLength({ min: 1 }).withMessage('Username is required.'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long.'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error('Passwords do not match.');
    }
    return true;
  }),
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.render('register', { title: 'Register', errors: errors.array() });
    }

    try {
      const existingUser = await User.findOne({ username: req.body.username });
      if (existingUser) {
        return res.render('register', { title: 'Register', errors: [{ msg: 'Username already exists.' }] });
      }
      const user = new User({
        username: req.body.username,
        password: req.body.password
      });
      await user.save();
      req.login(user, (err) => {
        if (err) return next(err);
        res.redirect('/');
      });
    } catch (err) {
      return next(err);
    }
  }
];

// Display login form
exports.getLogin = (req, res) => {
  res.render('login', { title: 'Login', message: req.flash('error') });
};

// Handle login
exports.postLogin = [
  passport.authenticate('local', {
    failureRedirect: '/login',
    failureFlash: true
  }),
  (req, res) => {
    // Redirect based on user role
    if (req.user && req.user.role === 'admin') {
      return res.redirect('/admin');
    } else {
      return res.redirect('/books');
    }
  }
];

// Handle logout
exports.getLogout = (req, res, next) => {
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
};

// Display forgot password form
exports.getForgotPassword = (req, res) => {
  res.render('forgot-password', { title: 'Forgot Password' });
};

// Handle forgot password
exports.postForgotPassword = async (req, res, next) => {
  try {
    const token = crypto.randomBytes(20).toString('hex');
    const user = await User.findOne({ username: req.body.username });

    if (!user) {
      req.flash('error', 'No account with that email address exists.');
      return res.redirect('/forgot-password');
    }

    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const mailOptions = {
      to: user.username,
      from: 'passwordreset@demo.com',
      subject: 'Node.js Password Reset',
      text: `You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n
        Please click on the following link, or paste this into your browser to complete the process:\n\n
        http://${req.headers.host}/reset-password/${token}\n\n
        If you did not request this, please ignore this email and your password will remain unchanged.\n`
    };

    await transporter.sendMail(mailOptions);
    req.flash('info', `An e-mail has been sent to ${user.username} with further instructions.`);
    res.redirect('/forgot-password');
  } catch (err) {
    next(err);
  }
};

// Display reset password form
exports.getResetPassword = async (req, res, next) => {
    try {
        const user = await User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } });
        if (!user) {
            req.flash('error', 'Password reset token is invalid or has expired.');
            return res.redirect('/forgot-password');
        }
        res.render('reset-password', { title: 'Reset Password', token: req.params.token });
    } catch (err) {
        next(err);
    }
};

// Handle reset password
exports.postResetPassword = async (req, res, next) => {
    try {
        const user = await User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } });

        if (!user) {
            req.flash('error', 'Password reset token is invalid or has expired.');
            return res.redirect('back');
        }

        if (req.body.password === req.body.confirmPassword) {
            user.password = req.body.password;
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;
            await user.save();
            
            req.flash('success_msg', 'Password has been updated.');
            res.redirect('/login');
        } else {
            req.flash('error', 'Passwords do not match.');
            return res.redirect('back');
        }
    } catch (err) {
        next(err);
    }
};

// Handle change password
exports.postChangePassword = async (req, res, next) => {
    const { currentPassword, newPassword, confirmNewPassword } = req.body;

    // Check if new passwords match
    if (newPassword !== confirmNewPassword) {
        req.flash('password_error', 'New passwords do not match.');
        return res.redirect('/profile');
    }

    try {
        const user = await User.findById(req.user._id || req.user.id);

        // Check if current password is correct
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            req.flash('password_error', 'Current password is incorrect.');
            return res.redirect('/profile');
        }

        // Update password
        user.password = newPassword;
        await user.save();

        // Log user out and redirect to login
        req.logout(function(err) {
            if (err) { return next(err); }
            req.flash('success_msg', 'Password changed successfully. Please log in again.');
            res.redirect('/login');
        });

    } catch (err) {
        next(err);
    }
};
