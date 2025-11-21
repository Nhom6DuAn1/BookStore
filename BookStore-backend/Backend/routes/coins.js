const express = require('express');
const router = express.Router();
const coinController = require('../controllers/coinController');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

// All routes require authentication
router.use(isAuthenticated);

// GET /coins/wallet - Xem ví coin
router.get('/wallet', coinController.showWallet);

// GET /coins/topup - Trang nạp coin
router.get('/topup', coinController.showTopUp);

// POST /coins/topup - Xử lý nạp coin
router.post('/topup', coinController.processTopUp);

// GET /coins/history - Lịch sử giao dịch
router.get('/history', coinController.showTransactionHistory);

// API routes
// GET /coins/api/balance - Lấy số dư coin
router.get('/api/balance', coinController.getBalance);

// POST /coins/api/payment-callback - Callback từ payment gateway (simulation)
router.post('/api/payment-callback', coinController.paymentCallback);

// Admin routes
// POST /coins/admin/give-bonus - Tặng coin bonus (Admin only)
router.post('/admin/give-bonus', isAdmin, coinController.adminGiveBonus);

module.exports = router;