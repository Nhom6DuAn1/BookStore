# Hướng dẫn cấu hình MongoDB Atlas

## Vấn đề: Không kết nối được MongoDB Atlas

### Bước 1: Tạo file .env

Tạo file `.env` trong thư mục `Backend` với nội dung sau:

```env
# MongoDB Atlas Connection String
# LƯU Ý: Thêm tên database vào sau .net/ (ví dụ: /bookstore)
MONGODB_URI=mongodb+srv://phamthiquynh012024_db_user:YhSRsd1s45KRmIG4@bookstore.vbtsllm.mongodb.net/bookstore?retryWrites=true&w=majority

# Session Secret
SESSION_SECRET=your_secret_key_change_this_in_production

# JWT Secret
JWT_SECRET=your_jwt_secret_change_this_in_production

# Email Configuration (optional)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password
```

### Bước 2: Kiểm tra MongoDB Atlas Settings

#### 2.1. Kiểm tra IP Whitelist
1. Đăng nhập vào [MongoDB Atlas](https://cloud.mongodb.com)
2. Vào **Network Access** → **IP Access List**
3. Đảm bảo có một trong các IP sau:
   - `0.0.0.0/0` (cho phép tất cả IP - chỉ dùng cho development)
   - Hoặc IP cụ thể của máy bạn

#### 2.2. Kiểm tra Database User
1. Vào **Database Access** → **Database Users**
2. Đảm bảo user `phamthiquynh012024_db_user` có quyền:
   - **Read and write to any database**
   - Hoặc ít nhất có quyền trên database `bookstore`

#### 2.3. Kiểm tra Cluster Status
1. Vào **Clusters** → Kiểm tra cluster `bookstore` đang chạy
2. Nếu cluster đang sleep, click **Resume** để khởi động

### Bước 3: Kiểm tra Connection String

Connection string phải có format:
```
mongodb+srv://username:password@cluster.mongodb.net/database_name?options
```

**Quan trọng**: Phải có tên database sau `.net/` (ví dụ: `/bookstore`)

### Bước 4: Test Connection

Chạy lệnh sau để test connection:
```bash
node test-connection.js
```

Hoặc chạy server:
```bash
npm start
```

## Các lỗi thường gặp

### 1. Lỗi IP Whitelist
**Lỗi**: `IP not whitelisted` hoặc `MongoNetworkError`

**Giải pháp**: 
- Thêm IP `0.0.0.0/0` vào IP Access List
- Đợi 2-3 phút để thay đổi có hiệu lực

### 2. Lỗi Authentication
**Lỗi**: `Authentication failed` hoặc `bad auth`

**Giải pháp**:
- Kiểm tra username và password trong connection string
- Đảm bảo user có quyền truy cập database

### 3. Lỗi Timeout
**Lỗi**: `MongoServerSelectionError` hoặc `timeout`

**Giải pháp**:
- Kiểm tra kết nối internet
- Kiểm tra firewall/proxy settings
- Đảm bảo cluster đang chạy (không sleep)

### 4. Lỗi Database Not Found
**Lỗi**: Database không tồn tại

**Giải pháp**:
- MongoDB Atlas sẽ tự tạo database khi bạn kết nối lần đầu
- Hoặc tạo database thủ công trong Atlas UI

## Liên hệ hỗ trợ

Nếu vẫn gặp vấn đề, vui lòng:
1. Chụp screenshot lỗi từ terminal
2. Chụp screenshot MongoDB Atlas settings (IP Access List, Database Users)
3. Gửi thông tin để được hỗ trợ

