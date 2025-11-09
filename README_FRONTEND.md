# BookStore Android App - Frontend

Ứng dụng Android BookStore kết nối với backend API Node.js.

## Cấu trúc dự án

```
app/src/main/
├── java/quynh/ph59304/bansach/
│   ├── api/
│   │   ├── ApiService.java          # Interface định nghĩa các API endpoints
│   │   └── RetrofitClient.java      # Retrofit client configuration
│   ├── models/
│   │   ├── User.java                # User model
│   │   ├── Book.java                # Book model
│   │   ├── Category.java            # Category model
│   │   ├── ApiResponse.java         # Generic API response model
│   │   ├── BooksResponse.java       # Books list response
│   │   └── CategoriesResponse.java  # Categories list response
│   ├── adapters/
│   │   └── BookAdapter.java         # RecyclerView adapter cho danh sách sách
│   ├── utils/
│   │   └── SharedPreferencesManager.java  # Quản lý lưu trữ local (JWT token, user info)
│   ├── MainActivity.java            # Entry point, kiểm tra đăng nhập
│   ├── LoginActivity.java           # Màn hình đăng nhập
│   ├── RegisterActivity.java        # Màn hình đăng ký
│   ├── BookListActivity.java        # Danh sách sách với search và filter
│   ├── BookDetailActivity.java      # Chi tiết sách
│   └── ProfileActivity.java         # Thông tin cá nhân
└── res/
    ├── layout/                      # XML layouts
    └── menu/                        # Menu resources
```

## Tính năng

### 1. Authentication
- ✅ Đăng ký tài khoản mới
- ✅ Đăng nhập
- ✅ Lưu JWT token trong SharedPreferences
- ✅ Tự động chuyển hướng nếu chưa đăng nhập
- ✅ Đăng xuất

### 2. Books
- ✅ Hiển thị danh sách sách
- ✅ Tìm kiếm sách theo title/author
- ✅ Lọc sách theo category
- ✅ Xem chi tiết sách
- ✅ Hiển thị hình ảnh sách (sử dụng Glide)

### 3. Profile
- ✅ Xem thông tin cá nhân
- ✅ Hiển thị avatar
- ✅ Đăng xuất

## Cấu hình

### 1. Base URL

Mở file `app/src/main/java/quynh/ph59304/bansach/api/RetrofitClient.java`:

```java
private static final String BASE_URL = "http://10.0.2.2:3000/";
```

- **Android Emulator**: Sử dụng `10.0.2.2:3000` (đây là IP của localhost trên emulator)
- **Thiết bị thật**: Thay bằng IP máy tính của bạn, ví dụ: `http://192.168.1.100:3000/`

Để tìm IP máy tính:
- Windows: Mở Command Prompt, gõ `ipconfig`
- Mac/Linux: Mở Terminal, gõ `ifconfig` hoặc `ip addr`

### 2. Permissions

Đã được thêm trong `AndroidManifest.xml`:
- `INTERNET`: Kết nối mạng
- `ACCESS_NETWORK_STATE`: Kiểm tra trạng thái mạng
- `usesCleartextTraffic="true"`: Cho phép HTTP (không chỉ HTTPS)

### 3. Dependencies

Các thư viện đã được thêm vào `build.gradle.kts`:
- **Retrofit 2.9.0**: HTTP client
- **OkHttp 4.12.0**: HTTP client library
- **Gson 2.10.1**: JSON parsing
- **Glide 4.16.0**: Image loading
- **RecyclerView 1.3.2**: Hiển thị danh sách
- **Material Design Components**: UI components

## Cài đặt và chạy

### 1. Sync Gradle

Mở Android Studio và sync Gradle project:
- File → Sync Project with Gradle Files
- Hoặc click vào notification "Gradle files have changed"

### 2. Chạy backend

Đảm bảo backend Node.js đang chạy trên port 3000:
```bash
cd backend_directory
npm start
```

### 3. Chạy ứng dụng

- Kết nối thiết bị Android hoặc khởi động emulator
- Click Run trong Android Studio
- Hoặc chạy lệnh: `./gradlew installDebug`

## Sử dụng

### Đăng ký/Đăng nhập

1. Mở ứng dụng
2. Nếu chưa đăng nhập, sẽ tự động chuyển đến màn hình đăng nhập
3. Click "Đăng ký" để tạo tài khoản mới hoặc đăng nhập với tài khoản có sẵn

### Xem danh sách sách

1. Sau khi đăng nhập, sẽ hiển thị danh sách sách
2. Sử dụng thanh tìm kiếm để tìm sách theo tên hoặc tác giả
3. Chọn category từ dropdown để lọc sách
4. Click vào một cuốn sách để xem chi tiết

### Xem thông tin cá nhân

1. Click vào nút Profile (FAB) ở góc dưới bên phải
2. Xem thông tin cá nhân
3. Click "Đăng xuất" để đăng xuất

## Lưu ý

### API Response Structure

Backend trả về các response với cấu trúc khác nhau:

1. **Login/Register**:
```json
{
  "message": "...",
  "user": {...},
  "token": "..."
}
```

2. **Books List**:
```json
{
  "books": [...],
  "categories": [...]
}
```

3. **Book Detail**:
```json
{
  "book": {...}
}
```

4. **Categories**:
```json
{
  "categories": [...]
}
```

### Error Handling

- Network errors: Hiển thị Toast message
- Authentication errors: Chuyển về màn hình đăng nhập
- Empty data: Hiển thị message "Không tìm thấy sách nào"

### Image Loading

- Sử dụng Glide để load images
- Hỗ trợ placeholder và error image
- Tự động thêm base URL nếu image URL không đầy đủ

## Troubleshooting

### Lỗi kết nối

1. Kiểm tra backend đang chạy: `http://localhost:3000`
2. Kiểm tra BASE_URL trong RetrofitClient.java
3. Nếu dùng thiết bị thật, đảm bảo thiết bị và máy tính cùng mạng WiFi
4. Kiểm tra firewall không chặn port 3000

### Lỗi build

1. Sync Gradle: File → Sync Project with Gradle Files
2. Clean project: Build → Clean Project
3. Rebuild project: Build → Rebuild Project
4. Invalidate caches: File → Invalidate Caches / Restart

### Lỗi API

1. Kiểm tra log trong Logcat để xem chi tiết lỗi
2. Kiểm tra response từ backend bằng Postman
3. Kiểm tra API endpoints trong ApiService.java khớp với backend

## Tính năng có thể mở rộng

- [ ] Forgot password
- [ ] Upload avatar
- [ ] Change password
- [ ] Add to cart
- [ ] Checkout
- [ ] Order history
- [ ] Admin features (thêm/sửa/xóa sách, categories)
- [ ] Pull to refresh
- [ ] Pagination
- [ ] Offline mode
- [ ] Push notifications

## Tác giả

Frontend Android App - BookStore Project

## License

MIT
