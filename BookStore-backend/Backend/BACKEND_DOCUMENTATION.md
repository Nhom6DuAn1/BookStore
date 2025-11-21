# Backend Documentation - BookStore Project

## Tổng quan
Dự án BookStore được xây dựng với Node.js, Express.js, MongoDB (Mongoose), sử dụng Passport.js cho authentication và JWT cho API authentication.

## Cấu trúc thư mục

```
BanSach/
├── app.js                 # File chính, khởi tạo Express app
├── bin/
│   └── www               # Server entry point
├── controllers/
│   ├── authController.js # Xử lý authentication (register, login, logout, password reset)
│   └── bookController.js # Xử lý logic sách (CRUD, search, filter)
├── middleware/
│   ├── auth.js           # Authentication middleware (ensureAuthenticated, ensureAdmin)
│   └── upload.js         # Multer middleware cho file upload
├── models/
│   ├── User.js           # User model (username, password, role, avatar)
│   ├── Book.js           # Book model (title, author, description, price, category, coverImage)
│   └── Category.js       # Category model (name)
├── routes/
│   ├── index.js          # Routes chính (home, profile, auth)
│   ├── users.js          # User routes (hiện tại empty)
│   └── books.js          # Book routes (list, detail, create)
└── seed.js               # Database seeding script
```

## Models

### User Model
```javascript
{
  username: String (required, unique),
  password: String (required, hashed with bcrypt),
  role: String (enum: ['customer', 'admin'], default: 'customer'),
  avatar: String,
  resetPasswordToken: String,
  resetPasswordExpires: Date
}
```
- Password được hash tự động trước khi save
- Có method `comparePassword()` để so sánh password

### Book Model
```javascript
{
  title: String (required),
  author: String (required),
  description: String (required),
  price: Number (required),
  category: ObjectId (ref: 'Category', required),
  coverImage: String (required),
  createdAt: Date,
  updatedAt: Date
}
```

### Category Model
```javascript
{
  name: String (required, unique)
}
```

## Coin System Features

### Coin Wallet System
- **Tỷ giá**: 2000 VND = 1 Coin
- **Phương thức nạp tiền**: MoMo, VNPay, Chuyển khoản ngân hàng
- **Lịch sử giao dịch**: Đầy đủ tracking tất cả giao dịch

### Digital Book Access
- **Mua quyền truy cập**: Dùng Coin để mua quyền đọc sách
- **Book Reader**: Giao diện đọc sách trực tuyến
- **Bookmark & Progress**: Lưu tiến độ đọc và đánh dấu trang

## Models (Updated)

### User Model
```javascript
{
  username: String (required, unique),
  password: String (required, hashed with bcrypt),
  role: String (enum: ['customer', 'admin'], default: 'customer'),
  avatar: String,
  coinBalance: Number (default: 0),
  resetPasswordToken: String,
  resetPasswordExpires: Date
}
```

### Book Model  
```javascript
{
  title: String (required),
  author: String (required),
  description: String (required),
  price: Number (required),
  coinPrice: Number,
  isDigitalAvailable: Boolean (default: true),
  category: ObjectId (ref: 'Category', required),
  coverImage: String (required),
  createdAt: Date,
  updatedAt: Date
}
```

### CoinTransaction Model
```javascript
{
  user: ObjectId (ref: 'User', required),
  type: String (enum: ['topup', 'purchase', 'bonus'], required),
  amount: Number (required),
  previousBalance: Number (required),
  newBalance: Number (required),
  description: String (required),
  metadata: Object,
  createdAt: Date
}
```

### BookAccess Model
```javascript
{
  user: ObjectId (ref: 'User', required),
  book: ObjectId (ref: 'Book', required),
  purchaseDate: Date (default: now),
  coinsPaid: Number (required),
  lastReadPage: Number (default: 0),
  totalPages: Number (default: 100),
  bookmarks: [Number],
  isActive: Boolean (default: true)
}
```

## API Endpoints

### Coin System APIs

#### GET `/coins/wallet`
- **Mô tả**: Hiển thị ví Coin và lịch sử giao dịch
- **Authentication**: Required (session)

#### GET `/coins/topup`
- **Mô tả**: Form nạp tiền Coin
- **Authentication**: Required (session)

#### POST `/coins/topup`
- **Mô tả**: Xử lý nạp tiền Coin
- **Body**: `{ amount: number, paymentMethod: string }`
- **Payment Methods**: 'momo', 'vnpay', 'bank'

#### POST `/coins/admin/bonus/:userId`
- **Mô tả**: Admin tặng Coin cho user
- **Authentication**: Admin required
- **Body**: `{ amount: number, description: string }`

### Book Access APIs

#### POST `/access/purchase/:bookId`
- **Mô tả**: Mua quyền truy cập sách bằng Coin
- **Authentication**: Required (session)

#### GET `/access/library`
- **Mô tả**: Danh sách sách đã mua
- **Authentication**: Required (session)

#### GET `/access/read/:bookId`
- **Mô tả**: Đọc sách (Book Reader)
- **Authentication**: Required (session)

#### POST `/access/progress/:bookId`
- **Mô tả**: Cập nhật tiến độ đọc
- **Body**: `{ page: number, totalPages: number }`

#### POST `/access/bookmark/:bookId`
- **Mô tả**: Thêm/xóa bookmark
- **Body**: `{ page: number }`

### Authentication APIs

#### POST `/api/register`
- **Mô tả**: Đăng ký user mới
- **Body**: `{ username: string, password: string }`
- **Validation**: 
  - Username: required, min 1 character
  - Password: required, min 6 characters
- **Response**: 
  ```json
  {
    "message": "Registration successful",
    "user": { "id": "...", "username": "...", "role": "..." },
    "token": "jwt_token"
  }
  ```

#### POST `/api/login`
- **Mô tả**: Đăng nhập user
- **Body**: `{ username: string, password: string }`
- **Validation**: Username và password required
- **Response**: 
  ```json
  {
    "message": "Login successful",
    "user": { "id": "...", "username": "...", "role": "...", "avatar": "..." },
    "token": "jwt_token"
  }
  ```

#### POST `/api/forgot-password`
- **Mô tả**: Gửi email reset password
- **Body**: `{ username: string }`
- **Validation**: Username required
- **Response**: 
  ```json
  {
    "message": "If an account with that username exists, a reset link has been sent."
  }
  ```

#### GET `/api/profile`
- **Mô tả**: Lấy thông tin profile user
- **Authentication**: Required (JWT token)
- **Headers**: `Authorization: Bearer <token>`
- **Response**: 
  ```json
  {
    "user": { "id": "...", "username": "...", "role": "...", "avatar": "..." }
  }
  ```

### Book APIs

#### GET `/api/books`
- **Mô tả**: Lấy danh sách sách với filter/search
- **Query Parameters**:
  - `search`: Tìm kiếm theo title (case-insensitive)
  - `category`: Lọc theo category ID
  - `minPrice`: Giá tối thiểu
  - `maxPrice`: Giá tối đa
- **Response**: 
  ```json
  {
    "books": [...],
    "categories": [...]
  }
  ```
- **Note**: CoverImage được convert thành full URL

#### GET `/api/books/:id`
- **Mô tả**: Lấy chi tiết một cuốn sách
- **Response**: 
  ```json
  {
    "book": { ... }
  }
  ```

#### GET `/api/categories`
- **Mô tả**: Lấy danh sách tất cả categories
- **Response**: 
  ```json
  {
    "categories": [...]
  }
  ```

## Web Routes (EJS Views)

### Authentication Routes
- `GET /register` - Form đăng ký
- `POST /register` - Xử lý đăng ký
- `GET /login` - Form đăng nhập
- `POST /login` - Xử lý đăng nhập (Passport)
- `GET /logout` - Đăng xuất
- `GET /forgot-password` - Form quên mật khẩu
- `POST /forgot-password` - Gửi email reset
- `GET /reset-password/:token` - Form reset password
- `POST /reset-password/:token` - Xử lý reset password

### Book Routes
- `GET /books` - Danh sách sách (có search/filter)
- `GET /books/new` - Form thêm sách (Admin only)
- `POST /books/new` - Xử lý thêm sách (Admin only)
- `GET /books/:id` - Chi tiết sách
- `GET /books/categories/new` - Form thêm category (Admin only)
- `POST /books/categories/new` - Xử lý thêm category (Admin only)

### Profile Routes
- `GET /profile` - Trang profile (Authenticated)
- `POST /profile/upload` - Upload avatar (Authenticated)
- `POST /profile/change-password` - Đổi mật khẩu (Authenticated)

## Middleware

### Authentication Middleware (`middleware/auth.js`)
- `ensureAuthenticated`: Kiểm tra user đã đăng nhập (session)
- `forwardAuthenticated`: Chuyển hướng nếu đã đăng nhập
- `ensureAdmin`: Kiểm tra user có role admin

### JWT Authentication (`app.js`)
- `authenticateToken`: Middleware kiểm tra JWT token cho API
  - Header: `Authorization: Bearer <token>`
  - Lưu user vào `req.user`

### Upload Middleware (`middleware/upload.js`)
- Sử dụng Multer
- Destination: `./public/uploads/`
- File size limit: 1MB
- File types: jpeg, jpg, png, gif
- Field name: `myImage`

## Authentication

### Session-based (Web)
- Sử dụng Passport.js với Local Strategy
- Session stored in MongoDB (connect-mongo)
- Flash messages cho thông báo

### JWT-based (API)
- Token expires in 7 days
- Secret key từ `process.env.JWT_SECRET`
- Token được trả về sau khi register/login thành công

## Dependencies

### Core
- `express`: Web framework
- `mongoose`: MongoDB ODM
- `dotenv`: Environment variables

### Authentication
- `passport`: Authentication middleware
- `passport-local`: Local strategy
- `express-session`: Session management
- `connect-mongo`: MongoDB session store
- `connect-flash`: Flash messages
- `jsonwebtoken`: JWT tokens
- `bcrypt`: Password hashing

### Validation & Security
- `express-validator`: Input validation
- `cors`: CORS support

### File Handling
- `multer`: File upload

### Email
- `nodemailer`: Email sending (for password reset)

### Other
- `ejs`: Template engine
- `morgan`: HTTP request logger
- `cookie-parser`: Cookie parser

## Environment Variables

Cần tạo file `.env` với các biến sau:

```env
MONGODB_URI=mongodb://localhost:27017/bookstore
JWT_SECRET=your_jwt_secret_key_here
SESSION_SECRET=your_session_secret_key_here
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password
PORT=3000
```

## Database

### MongoDB Connection
- Connection string từ `process.env.MONGODB_URI`
- Fallback: `mongodb://localhost:27017/bookstore`
- Sử dụng `useNewUrlParser` và `useUnifiedTopology`

### Seeding
- File `seed.js` để seed dữ liệu mẫu
- Chạy: `node seed.js`
- Xóa dữ liệu cũ và thêm categories + books mới

## Security Notes

1. **Password**: Được hash với bcrypt (10 rounds) trước khi lưu
2. **JWT Secret**: Nên sử dụng strong random string
3. **Session Secret**: Nên sử dụng strong random string
4. **CORS**: Hiện tại cho phép tất cả origins (`*`) - nên hạn chế trong production
5. **File Upload**: Giới hạn 1MB, chỉ cho phép images
6. **Password Reset**: Token expires sau 1 giờ

## Error Handling

- API errors trả về JSON với format: `{ error: "message" }`
- Web errors sử dụng flash messages và render error page
- 404 errors được handle bởi Express error handler

## File Structure Notes

- Controllers chứa business logic
- Models định nghĩa database schema
- Routes định nghĩa URL mapping
- Middleware xử lý authentication, validation, upload
- Public folder chứa static files (images, CSS, JS)
- Views folder chứa EJS templates

## Development

### Start server
```bash
npm start          # Production
npm run dev        # Development (with nodemon)
```

### Seed database
```bash
node seed.js
```

## API Usage Example

### Register
```javascript
POST /api/register
Content-Type: application/json

{
  "username": "user123",
  "password": "password123"
}
```

### Login
```javascript
POST /api/login
Content-Type: application/json

{
  "username": "user123",
  "password": "password123"
}
```

### Get Books (with filter)
```javascript
GET /api/books?search=gatsby&category=123&minPrice=10&maxPrice=20
```

### Get Profile (Authenticated)
```javascript
GET /api/profile
Authorization: Bearer <jwt_token>
```

## Notes

- Backend hỗ trợ cả web views (EJS) và API (JSON)
- Authentication có 2 cách: Session (web) và JWT (API)
- Admin routes được protect bởi `ensureAdmin` middleware
- File uploads được lưu trong `public/uploads/`
- Images được serve như static files từ `/uploads/`

