const express = require('express');
const router = express.Router();
const bookAccessController = require('../controllers/bookAccessController');
const { isAuthenticated } = require('../middleware/auth');

// All routes require authentication
router.use(isAuthenticated);

// GET /access/library - Xem thư viện sách đã mua
router.get('/library', bookAccessController.showLibrary);

// GET /access/books/:bookId/reader - Đọc sách (full content)
router.get('/books/:bookId/reader', bookAccessController.showBookReader);

// GET /access/books/:bookId/purchase - Form mua quyền truy cập
router.get('/books/:bookId/purchase', bookAccessController.showPurchaseForm);

// POST /access/books/:bookId/purchase - Mua quyền truy cập bằng coin
router.post('/books/:bookId/purchase', bookAccessController.purchaseAccess);

// PUT /access/books/:bookId/progress - Cập nhật tiến độ đọc
router.put('/books/:bookId/progress', bookAccessController.updateReadingProgress);

// POST /access/books/:bookId/bookmark - Thêm bookmark
router.post('/books/:bookId/bookmark', bookAccessController.addBookmark);

// API routes
// GET /access/api/books/:bookId/check - Kiểm tra quyền truy cập
router.get('/api/books/:bookId/check', bookAccessController.checkAccess);

module.exports = router;