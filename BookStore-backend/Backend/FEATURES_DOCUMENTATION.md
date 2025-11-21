# Chức năng Đánh giá và Đọc thử Sách

## Tổng quan

Đã thêm 2 chức năng mới vào hệ thống BookStore:

1. **Đánh giá, bình luận sách** - Cho phép khách hàng đánh giá và bình luận về sách đã mua
2. **Đọc thử sách** - Cho phép người dùng đọc thử 3-5 chương đầu của sách

## 1. Chức năng Đánh giá, Bình luận

### Quy định:
- Chỉ khách hàng đã mua sách mới được đánh giá
- Đánh giá có thể được sửa trong vòng **7 ngày** kể từ khi tạo
- Mỗi khách hàng chỉ được đánh giá 1 lần cho mỗi cuốn sách
- Điểm đánh giá từ 1-5 sao
- Bình luận tối đa 1000 ký tự

### Các tính năng:
- ✅ Tạo đánh giá mới
- ✅ Chỉnh sửa đánh giá (trong 7 ngày)
- ✅ Xóa đánh giá
- ✅ Xem danh sách đánh giá theo sách
- ✅ Tính toán điểm trung bình và số lượng đánh giá
- ✅ Hiển thị trạng thái "đã chỉnh sửa" nếu review bị sửa

### Routes:
```
GET  /reviews/books/:bookId         - Xem tất cả đánh giá của sách
GET  /reviews/books/:bookId/new     - Form tạo đánh giá mới
POST /reviews/books/:bookId         - Tạo đánh giá mới
GET  /reviews/:id/edit              - Form chỉnh sửa đánh giá
PUT  /reviews/:id                   - Cập nhật đánh giá
DELETE /reviews/:id                 - Xóa đánh giá
```

### Models:
- **Review**: Lưu thông tin đánh giá (rating, comment, user, book, timestamps)
- **Book**: Thêm trường `averageRating`, `totalReviews`

## 2. Chức năng Đọc thử Sách

### Quy định:
- Mỗi sách có thể có **3-5 chương đầu** để đọc thử
- Nội dung đọc thử công khai, không cần đăng nhập
- Admin có thể tạo/sửa/xóa nội dung đọc thử
- Có thể bật/tắt tính năng đọc thử cho từng sách

### Các tính năng:
- ✅ Xem nội dung đọc thử (public)
- ✅ Đọc từng chương riêng lẻ
- ✅ Mục lục với navigation
- ✅ Tạo nội dung đọc thử (Admin)
- ✅ Chỉnh sửa nội dung đọc thử (Admin)
- ✅ Xóa nội dung đọc thử (Admin)
- ✅ Đếm số từ tự động

### Routes:
```
# Public routes (không cần đăng nhập)
GET  /preview/books/:bookId                    - Xem nội dung đọc thử
GET  /preview/books/:bookId/chapter/:number    - Xem chương cụ thể
GET  /preview/api/books/:bookId                - API lấy thông tin preview

# Admin routes (cần đăng nhập)
GET  /preview/books/:bookId/new                - Form tạo preview (Admin)
POST /preview/books/:bookId                    - Tạo preview (Admin)
GET  /preview/books/:bookId/edit               - Form chỉnh sửa (Admin)
PUT  /preview/books/:bookId                    - Cập nhật preview (Admin)
DELETE /preview/books/:bookId                  - Xóa preview (Admin)
```

### Models:
- **PreviewContent**: Lưu nội dung đọc thử
- **Book**: Thêm trường `hasPreview`

## 3. Cài đặt và Chạy thử

### Cài đặt dependencies mới:
```bash
npm install method-override
```

### Chạy seed data test:
```bash
node seed-reviews-previews.js
```

### Cấu trúc file đã thêm:

```
models/
├── Review.js                    # Model đánh giá
├── PreviewContent.js           # Model nội dung đọc thử
└── Book.js (updated)           # Thêm fields mới

controllers/
├── reviewController.js         # Controller đánh giá
└── previewController.js        # Controller đọc thử

routes/
├── reviews.js                  # Routes đánh giá
└── preview.js                  # Routes đọc thử

views/
├── reviews/
│   ├── index.ejs              # Danh sách đánh giá
│   ├── new.ejs                # Form tạo đánh giá
│   └── edit.ejs               # Form chỉnh sửa
├── preview/
│   ├── new.ejs                # Form tạo preview (Admin)
│   └── edit.ejs               # Form chỉnh sửa preview (Admin)
└── books/
    ├── preview.ejs            # Trang đọc thử
    ├── chapter.ejs            # Trang đọc chương
    └── show.ejs (updated)     # Thêm nút đánh giá & đọc thử
```

## 4. Hướng dẫn sử dụng

### Cho khách hàng:
1. **Đánh giá sách**: Sau khi mua sách, vào trang chi tiết sách → "Viết đánh giá"
2. **Đọc thử**: Vào trang chi tiết sách → "Đọc thử ngay" (nếu có)
3. **Xem đánh giá**: Vào trang chi tiết sách → "Xem đánh giá"

### Cho Admin:
1. **Thêm nội dung đọc thử**: Trang chi tiết sách → "Thêm nội dung đọc thử"
2. **Quản lý đánh giá**: Xem trong trang đánh giá của từng sách
3. **Chỉnh sửa preview**: Trang chi tiết sách → "Chỉnh sửa nội dung đọc thử"

## 5. Validation và Bảo mật

### Review:
- ✅ Kiểm tra quyền đánh giá (phải mua sách trước)
- ✅ Kiểm tra thời gian sửa đánh giá (7 ngày)
- ✅ Validate input (rating 1-5, comment <= 1000 chars)
- ✅ Chống duplicate review

### Preview:
- ✅ Validate số lượng chương (3-5)
- ✅ Kiểm tra quyền admin
- ✅ Validate nội dung không rỗng

## 6. API Endpoints (cho Frontend/Mobile)

### Review API:
```
GET  /api/books/:bookId/reviews     - Lấy danh sách review
POST /api/books/:bookId/reviews     - Tạo review mới
PUT  /api/reviews/:id               - Cập nhật review
DELETE /api/reviews/:id             - Xóa review
```

### Preview API:
```
GET  /preview/api/books/:bookId     - Lấy thông tin preview
```

## 7. Database Schema

### Review Collection:
```javascript
{
  user: ObjectId,           // User ID
  book: ObjectId,           // Book ID  
  rating: Number,           // 1-5
  comment: String,          // <= 1000 chars
  createdAt: Date,
  updatedAt: Date,
  isEdited: Boolean,
  originalCreatedAt: Date
}
```

### PreviewContent Collection:
```javascript
{
  book: ObjectId,           // Book ID (unique)
  chapters: [{
    chapterNumber: Number,
    title: String,
    content: String,
    wordCount: Number
  }],
  totalChapters: Number,    // 3-5
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Updated Book Collection:
```javascript
{
  // ... existing fields
  averageRating: Number,    // 0-5, calculated
  totalReviews: Number,     // calculated
  hasPreview: Boolean,      // true if preview exists
  stock: Number,            // inventory
  publishedDate: Date,
  isbn: String
}
```