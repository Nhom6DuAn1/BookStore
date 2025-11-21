const PreviewContent = require('../models/PreviewContent');
const Book = require('../models/Book');

const previewController = {
    // Hiển thị nội dung đọc thử
    showPreview: async (req, res) => {
        try {
            const { bookId } = req.params;
            
            const book = await Book.findById(bookId);
            if (!book) {
                req.flash('error', 'Không tìm thấy sách');
                return res.redirect('/books');
            }

            const previewContent = await PreviewContent.findByBookId(bookId);
            if (!previewContent) {
                req.flash('error', 'Sách này chưa có nội dung đọc thử');
                return res.redirect(`/books/${bookId}`);
            }

            res.render('books/preview', {
                book,
                previewContent,
                title: `Đọc thử - ${book.title}`,
                messages: req.flash()
            });
        } catch (error) {
            console.error('Error showing preview:', error);
            req.flash('error', 'Có lỗi xảy ra khi tải nội dung đọc thử');
            res.redirect('/books');
        }
    },

    // Hiển thị form tạo preview content (dành cho admin)
    showCreateForm: async (req, res) => {
        try {
            const { bookId } = req.params;
            const book = await Book.findById(bookId);
            
            if (!book) {
                req.flash('error', 'Không tìm thấy sách');
                return res.redirect('/books');
            }

            // Check if preview already exists
            const existingPreview = await PreviewContent.findOne({ book: bookId });
            if (existingPreview) {
                req.flash('error', 'Sách này đã có nội dung đọc thử');
                return res.redirect(`/books/${bookId}/preview/edit`);
            }

            res.render('preview/new', {
                book,
                title: 'Tạo nội dung đọc thử',
                messages: req.flash()
            });
        } catch (error) {
            console.error('Error showing create preview form:', error);
            req.flash('error', 'Có lỗi xảy ra');
            res.redirect('/books');
        }
    },

    // Tạo preview content mới
    create: async (req, res) => {
        try {
            const { bookId } = req.params;
            const { chapters } = req.body;

            // Validate input
            if (!chapters || !Array.isArray(chapters) || chapters.length < 3 || chapters.length > 5) {
                req.flash('error', 'Nội dung đọc thử phải có từ 3 đến 5 chương');
                return res.redirect(`/books/${bookId}/preview/new`);
            }

            // Validate each chapter
            for (let i = 0; i < chapters.length; i++) {
                const chapter = chapters[i];
                if (!chapter.title || !chapter.content) {
                    req.flash('error', `Chương ${i + 1} thiếu tiêu đề hoặc nội dung`);
                    return res.redirect(`/books/${bookId}/preview/new`);
                }
            }

            // Check if preview already exists
            const existingPreview = await PreviewContent.findOne({ book: bookId });
            if (existingPreview) {
                req.flash('error', 'Sách này đã có nội dung đọc thử');
                return res.redirect(`/books/${bookId}`);
            }

            // Format chapters data
            const formattedChapters = chapters.map((chapter, index) => ({
                chapterNumber: index + 1,
                title: chapter.title.trim(),
                content: chapter.content.trim()
            }));

            // Create preview content
            const previewContent = new PreviewContent({
                book: bookId,
                chapters: formattedChapters
            });

            await previewContent.save();

            // Update book to mark it has preview
            await Book.findByIdAndUpdate(bookId, { hasPreview: true });

            req.flash('success', 'Nội dung đọc thử đã được tạo thành công');
            res.redirect(`/books/${bookId}`);
        } catch (error) {
            console.error('Error creating preview content:', error);
            req.flash('error', 'Có lỗi xảy ra khi tạo nội dung đọc thử');
            res.redirect(`/books/${req.params.bookId}/preview/new`);
        }
    },

    // Hiển thị form chỉnh sửa preview content
    showEditForm: async (req, res) => {
        try {
            const { bookId } = req.params;
            const book = await Book.findById(bookId);
            
            if (!book) {
                req.flash('error', 'Không tìm thấy sách');
                return res.redirect('/books');
            }

            const previewContent = await PreviewContent.findOne({ book: bookId });
            if (!previewContent) {
                req.flash('error', 'Không tìm thấy nội dung đọc thử');
                return res.redirect(`/books/${bookId}`);
            }

            res.render('preview/edit', {
                book,
                previewContent,
                title: 'Chỉnh sửa nội dung đọc thử',
                messages: req.flash()
            });
        } catch (error) {
            console.error('Error showing edit preview form:', error);
            req.flash('error', 'Có lỗi xảy ra');
            res.redirect('/books');
        }
    },

    // Cập nhật preview content
    update: async (req, res) => {
        try {
            const { bookId } = req.params;
            const { chapters, isActive } = req.body;

            // Validate input
            if (!chapters || !Array.isArray(chapters) || chapters.length < 3 || chapters.length > 5) {
                req.flash('error', 'Nội dung đọc thử phải có từ 3 đến 5 chương');
                return res.redirect(`/books/${bookId}/preview/edit`);
            }

            const previewContent = await PreviewContent.findOne({ book: bookId });
            if (!previewContent) {
                req.flash('error', 'Không tìm thấy nội dung đọc thử');
                return res.redirect(`/books/${bookId}`);
            }

            // Validate each chapter
            for (let i = 0; i < chapters.length; i++) {
                const chapter = chapters[i];
                if (!chapter.title || !chapter.content) {
                    req.flash('error', `Chương ${i + 1} thiếu tiêu đề hoặc nội dung`);
                    return res.redirect(`/books/${bookId}/preview/edit`);
                }
            }

            // Format chapters data
            const formattedChapters = chapters.map((chapter, index) => ({
                chapterNumber: index + 1,
                title: chapter.title.trim(),
                content: chapter.content.trim()
            }));

            // Update preview content
            previewContent.chapters = formattedChapters;
            previewContent.isActive = isActive === 'true';
            await previewContent.save();

            // Update book preview status
            await Book.findByIdAndUpdate(bookId, { hasPreview: previewContent.isActive });

            req.flash('success', 'Nội dung đọc thử đã được cập nhật thành công');
            res.redirect(`/books/${bookId}`);
        } catch (error) {
            console.error('Error updating preview content:', error);
            req.flash('error', 'Có lỗi xảy ra khi cập nhật nội dung đọc thử');
            res.redirect(`/books/${req.params.bookId}/preview/edit`);
        }
    },

    // Xóa preview content
    delete: async (req, res) => {
        try {
            const { bookId } = req.params;
            
            const previewContent = await PreviewContent.findOne({ book: bookId });
            if (!previewContent) {
                req.flash('error', 'Không tìm thấy nội dung đọc thử');
                return res.redirect(`/books/${bookId}`);
            }

            await PreviewContent.findByIdAndDelete(previewContent._id);

            // Update book to mark it doesn't have preview
            await Book.findByIdAndUpdate(bookId, { hasPreview: false });

            req.flash('success', 'Nội dung đọc thử đã được xóa thành công');
            res.redirect(`/books/${bookId}`);
        } catch (error) {
            console.error('Error deleting preview content:', error);
            req.flash('error', 'Có lỗi xảy ra khi xóa nội dung đọc thử');
            res.redirect(`/books/${req.params.bookId}`);
        }
    },

    // API để lấy thông tin preview
    getPreviewInfo: async (req, res) => {
        try {
            const { bookId } = req.params;
            
            const previewContent = await PreviewContent.findByBookId(bookId);
            if (!previewContent) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy nội dung đọc thử'
                });
            }

            const summary = previewContent.getPreviewSummary();
            
            res.json({
                success: true,
                data: summary
            });
        } catch (error) {
            console.error('Error getting preview info:', error);
            res.status(500).json({
                success: false,
                message: 'Có lỗi xảy ra khi lấy thông tin preview'
            });
        }
    },

    // Lấy một chương cụ thể
    getChapter: async (req, res) => {
        try {
            const { bookId, chapterNumber } = req.params;
            
            const previewContent = await PreviewContent.findByBookId(bookId);
            if (!previewContent) {
                req.flash('error', 'Không tìm thấy nội dung đọc thử');
                return res.redirect(`/books/${bookId}`);
            }

            const chapter = previewContent.chapters.find(
                ch => ch.chapterNumber === parseInt(chapterNumber)
            );

            if (!chapter) {
                req.flash('error', 'Không tìm thấy chương này');
                return res.redirect(`/books/${bookId}/preview`);
            }

            res.render('books/chapter', {
                book: previewContent.book,
                chapter,
                previewContent,
                title: `${chapter.title} - ${previewContent.book.title}`,
                messages: req.flash()
            });
        } catch (error) {
            console.error('Error getting chapter:', error);
            req.flash('error', 'Có lỗi xảy ra khi tải chương');
            res.redirect(`/books/${req.params.bookId}/preview`);
        }
    }
};

module.exports = previewController;