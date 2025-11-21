const Book = require('../models/Book');
const PreviewContent = require('../models/PreviewContent');
const Category = require('../models/Category');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Multer config for digital content file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../public/uploads/digital-content/'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'content-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: function (req, file, cb) {
    // Accept text files, PDF, and common ebook formats
    const allowedTypes = [
      'text/plain',
      'application/pdf',
      'application/epub+zip',
      'application/x-mobipocket-ebook'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ hỗ trợ file .txt, .pdf, .epub, .mobi'));
    }
  }
});

const digitalContentController = {
  // Hiển thị danh sách nội dung số
  getDigitalContents: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = 10;
      const skip = (page - 1) * limit;
      
      // Lọc theo tìm kiếm
      const search = req.query.search || '';
      const categoryFilter = req.query.category || '';
      const statusFilter = req.query.status || '';

      // Tạo query cho Book
      let bookQuery = {};
      
      if (search) {
        bookQuery.$or = [
          { title: { $regex: search, $options: 'i' } },
          { author: { $regex: search, $options: 'i' } }
        ];
      }
      
      if (categoryFilter) {
        bookQuery.category = categoryFilter;
      }

      if (statusFilter === 'digital') {
        bookQuery.isDigitalAvailable = true;
      } else if (statusFilter === 'preview') {
        bookQuery.hasPreview = true;
      }

      // Lấy danh sách sách
      const books = await Book.find(bookQuery)
        .populate('category', 'name')
        .sort({ title: 1 })
        .skip(skip)
        .limit(limit);

      // Lấy thông tin preview content cho các sách
      const booksWithPreview = await Promise.all(
        books.map(async (book) => {
          const bookObj = book.toObject();
          const previewContent = await PreviewContent.findOne({ book: book._id });
          bookObj.previewContent = previewContent;
          return bookObj;
        })
      );

      // Đếm tổng số sách
      const totalBooks = await Book.countDocuments(bookQuery);
      const totalPages = Math.ceil(totalBooks / limit);

      // Lấy danh mục cho filter
      const categories = await Category.find().sort({ name: 1 });

      // Thống kê nội dung số
      const digitalStats = await Book.aggregate([
        {
          $group: {
            _id: null,
            totalBooks: { $sum: 1 },
            digitalAvailable: {
              $sum: { $cond: [{ $eq: ['$isDigitalAvailable', true] }, 1, 0] }
            },
            withPreview: {
              $sum: { $cond: [{ $eq: ['$hasPreview', true] }, 1, 0] }
            },
            averagePrice: { $avg: '$coinPrice' }
          }
        }
      ]);

      const stats = digitalStats[0] || {
        totalBooks: 0,
        digitalAvailable: 0,
        withPreview: 0,
        averagePrice: 0
      };

      res.render('admin/digital-content/index', {
        title: 'Quản lý nội dung số',
        books: booksWithPreview,
        categories,
        stats,
        pagination: {
          current: page,
          total: totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
          next: page + 1,
          prev: page - 1
        },
        filters: {
          search,
          category: categoryFilter,
          status: statusFilter
        },
        currentUser: req.user
      });
    } catch (error) {
      console.error('Error in getDigitalContents:', error);
      req.flash('error_msg', 'Có lỗi xảy ra khi tải danh sách nội dung số');
      res.redirect('/admin');
    }
  },

  // Hiển thị form quản lý nội dung cho 1 sách
  getManageBookContent: async (req, res) => {
    try {
      const { id } = req.params;
      const book = await Book.findById(id).populate('category', 'name');
      
      if (!book) {
        req.flash('error_msg', 'Không tìm thấy sách');
        return res.redirect('/admin/digital-content');
      }

      const previewContent = await PreviewContent.findOne({ book: id });

      res.render('admin/digital-content/manage', {
        title: `Quản lý nội dung: ${book.title}`,
        book,
        previewContent,
        currentUser: req.user
      });
    } catch (error) {
      console.error('Error in getManageBookContent:', error);
      req.flash('error_msg', 'Có lỗi xảy ra khi tải thông tin sách');
      res.redirect('/admin/digital-content');
    }
  },

  // Cập nhật cài đặt digital cho sách
  updateDigitalSettings: async (req, res) => {
    try {
      const { id } = req.params;
      const {
        isDigitalAvailable,
        coinPrice,
        hasPreview
      } = req.body;

      const book = await Book.findById(id);
      if (!book) {
        req.flash('error_msg', 'Không tìm thấy sách');
        return res.redirect('/admin/digital-content');
      }

      // Cập nhật thông tin digital
      book.isDigitalAvailable = isDigitalAvailable === 'on';
      book.hasPreview = hasPreview === 'on';
      
      if (coinPrice && parseInt(coinPrice) >= 0) {
        book.coinPrice = parseInt(coinPrice);
      }

      await book.save();

      req.flash('success_msg', `Đã cập nhật cài đặt digital cho "${book.title}"`);
      res.redirect(`/admin/digital-content/${id}/manage`);
    } catch (error) {
      console.error('Error in updateDigitalSettings:', error);
      req.flash('error_msg', 'Có lỗi xảy ra khi cập nhật cài đặt');
      res.redirect('/admin/digital-content');
    }
  },

  // Upload file nội dung số
  uploadDigitalContent: [
    upload.single('contentFile'),
    async (req, res) => {
      try {
        const { id } = req.params;
        const book = await Book.findById(id);
        
        if (!book) {
          req.flash('error_msg', 'Không tìm thấy sách');
          return res.redirect('/admin/digital-content');
        }

        if (!req.file) {
          req.flash('error_msg', 'Vui lòng chọn file để upload');
          return res.redirect(`/admin/digital-content/${id}/manage`);
        }

        // Store file path in book metadata
        book.digitalContentPath = req.file.path;
        book.digitalContentFilename = req.file.filename;
        book.digitalContentSize = req.file.size;
        book.digitalContentType = req.file.mimetype;
        
        await book.save();

        req.flash('success_msg', `Đã upload nội dung số cho "${book.title}" thành công`);
        res.redirect(`/admin/digital-content/${id}/manage`);
      } catch (error) {
        console.error('Error in uploadDigitalContent:', error);
        req.flash('error_msg', 'Có lỗi xảy ra khi upload file');
        res.redirect('/admin/digital-content');
      }
    }
  ],

  // Tạo/cập nhật nội dung preview
  updatePreviewContent: async (req, res) => {
    try {
      const { id } = req.params;
      const { chapters } = req.body;

      const book = await Book.findById(id);
      if (!book) {
        req.flash('error_msg', 'Không tìm thấy sách');
        return res.redirect('/admin/digital-content');
      }

      // Parse chapters data
      const chaptersData = [];
      for (let i = 0; i < chapters.length; i++) {
        if (chapters[i].title && chapters[i].content) {
          chaptersData.push({
            chapterNumber: i + 1,
            title: chapters[i].title,
            content: chapters[i].content
          });
        }
      }

      if (chaptersData.length < 3 || chaptersData.length > 5) {
        req.flash('error_msg', 'Preview phải có từ 3 đến 5 chương');
        return res.redirect(`/admin/digital-content/${id}/manage`);
      }

      // Tìm hoặc tạo preview content
      let previewContent = await PreviewContent.findOne({ book: id });
      
      if (previewContent) {
        previewContent.chapters = chaptersData;
        previewContent.updatedAt = new Date();
      } else {
        previewContent = new PreviewContent({
          book: id,
          chapters: chaptersData
        });
      }

      await previewContent.save();

      // Cập nhật book hasPreview = true
      book.hasPreview = true;
      await book.save();

      req.flash('success_msg', `Đã cập nhật nội dung preview cho "${book.title}"`);
      res.redirect(`/admin/digital-content/${id}/manage`);
    } catch (error) {
      console.error('Error in updatePreviewContent:', error);
      req.flash('error_msg', error.message || 'Có lỗi xảy ra khi cập nhật preview');
      res.redirect('/admin/digital-content');
    }
  },

  // Xóa nội dung preview
  deletePreviewContent: async (req, res) => {
    try {
      const { id } = req.params;
      
      const book = await Book.findById(id);
      if (!book) {
        req.flash('error_msg', 'Không tìm thấy sách');
        return res.redirect('/admin/digital-content');
      }

      await PreviewContent.findOneAndDelete({ book: id });
      
      book.hasPreview = false;
      await book.save();

      req.flash('success_msg', `Đã xóa nội dung preview cho "${book.title}"`);
      res.redirect(`/admin/digital-content/${id}/manage`);
    } catch (error) {
      console.error('Error in deletePreviewContent:', error);
      req.flash('error_msg', 'Có lỗi xảy ra khi xóa preview content');
      res.redirect('/admin/digital-content');
    }
  },

  // Xóa file nội dung số
  deleteDigitalFile: async (req, res) => {
    try {
      const { id } = req.params;
      
      const book = await Book.findById(id);
      if (!book) {
        req.flash('error_msg', 'Không tìm thấy sách');
        return res.redirect('/admin/digital-content');
      }

      // Xóa file vật lý nếu tồn tại
      if (book.digitalContentPath) {
        try {
          await fs.unlink(book.digitalContentPath);
        } catch (fileError) {
          console.log('File already deleted or not found:', fileError.message);
        }
      }

      // Xóa thông tin file trong database
      book.digitalContentPath = undefined;
      book.digitalContentFilename = undefined;
      book.digitalContentSize = undefined;
      book.digitalContentType = undefined;
      book.isDigitalAvailable = false;
      
      await book.save();

      req.flash('success_msg', `Đã xóa file nội dung số cho "${book.title}"`);
      res.redirect(`/admin/digital-content/${id}/manage`);
    } catch (error) {
      console.error('Error in deleteDigitalFile:', error);
      req.flash('error_msg', 'Có lỗi xảy ra khi xóa file');
      res.redirect('/admin/digital-content');
    }
  },

  // Cập nhật hàng loạt
  bulkUpdateDigitalStatus: async (req, res) => {
    try {
      const { bookIds, action, coinPrice } = req.body;
      
      if (!bookIds || !Array.isArray(bookIds)) {
        req.flash('error_msg', 'Vui lòng chọn ít nhất một sách');
        return res.redirect('/admin/digital-content');
      }

      let updateData = {};
      let message = '';

      switch (action) {
        case 'enable_digital':
          updateData = { isDigitalAvailable: true };
          message = 'Đã bật tính năng digital';
          break;
        case 'disable_digital':
          updateData = { isDigitalAvailable: false };
          message = 'Đã tắt tính năng digital';
          break;
        case 'enable_preview':
          updateData = { hasPreview: true };
          message = 'Đã bật tính năng preview';
          break;
        case 'disable_preview':
          updateData = { hasPreview: false };
          message = 'Đã tắt tính năng preview';
          break;
        case 'set_coin_price':
          if (!coinPrice || parseInt(coinPrice) < 0) {
            req.flash('error_msg', 'Vui lòng nhập giá coin hợp lệ');
            return res.redirect('/admin/digital-content');
          }
          updateData = { coinPrice: parseInt(coinPrice) };
          message = `Đã đặt giá coin thành ${coinPrice}`;
          break;
        default:
          req.flash('error_msg', 'Hành động không hợp lệ');
          return res.redirect('/admin/digital-content');
      }

      const result = await Book.updateMany(
        { _id: { $in: bookIds } },
        updateData
      );

      req.flash('success_msg', `${message} cho ${result.modifiedCount} sách`);
      res.redirect('/admin/digital-content');
    } catch (error) {
      console.error('Error in bulkUpdateDigitalStatus:', error);
      req.flash('error_msg', 'Có lỗi xảy ra khi cập nhật hàng loạt');
      res.redirect('/admin/digital-content');
    }
  },

  // API để lấy thông tin preview
  getPreviewAPI: async (req, res) => {
    try {
      const { id } = req.params;
      const previewContent = await PreviewContent.findOne({ book: id })
        .populate('book', 'title author price coinPrice');

      if (!previewContent) {
        return res.status(404).json({ error: 'Không tìm thấy nội dung preview' });
      }

      res.json({
        success: true,
        data: previewContent.getPreviewSummary()
      });
    } catch (error) {
      console.error('Error in getPreviewAPI:', error);
      res.status(500).json({ error: 'Có lỗi xảy ra' });
    }
  }
};

module.exports = digitalContentController;