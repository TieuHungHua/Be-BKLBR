# API Documentation: Push Notifications - Nhắc Hạn Trả Tự Động

## Tổng Quan

Tính năng nhắc hạn trả tự động sử dụng Firebase Cloud Messaging (FCM) để gửi thông báo push đến người dùng khi sách sắp hết hạn trả.

## Tính Năng

- ✅ Cron job tự động chạy lúc 8:00 sáng hàng ngày
- ✅ Gửi thông báo ở các mốc: -3 ngày, -1 ngày, và đúng ngày hết hạn (0)
- ✅ Chỉ gửi cho user có `is_push_enabled = true` và có `fcm_token`
- ✅ Xử lý batch (50 user mỗi đợt) để đảm bảo tỷ lệ gửi >95%
- ✅ Retry mechanism (tối đa 3 lần) khi gửi thất bại
- ✅ Log tất cả notifications vào bảng `NotificationLog`

## Setup

### 1. Cài Đặt Dependencies

```bash
npm install @nestjs/schedule firebase-admin
```

### 2. Cấu Hình Firebase Admin SDK

Thêm các biến môi trường sau vào file `.env`:

```env
# Firebase Admin SDK Configuration
FIREBASE_PROJECT_ID="bk-library-e0771"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-fbsvc@bk-library-e0771.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
FIREBASE_DATABASE_URL="https://bk-library-e0771-default-rtdb.asia-southeast1.firebasedatabase.app"
```

**Lưu ý**: 
- Lấy `FIREBASE_PRIVATE_KEY` từ Firebase Console > Project Settings > Service Accounts
- Download Service Account Key JSON và copy `private_key` vào `.env`
- Đảm bảo `\n` được giữ nguyên trong private key

### 3. Chạy Migration

```bash
npx prisma migrate dev --name add_notification_fields
```

Hoặc nếu đã có migration:

```bash
npx prisma migrate deploy
```

## API Endpoints

### 1. Cập Nhật FCM Token

**Endpoint**: `PUT /notifications/fcm-token`

**Authentication**: Required (JWT Bearer Token)

**Request Body**:

```json
{
  "fcmToken": "fcm_token_from_react_native_app",
  "isPushEnabled": true  // Optional, default: true
}
```

**Response**:

```json
{
  "message": "FCM token updated successfully",
  "user": {
    "id": "user-uuid",
    "username": "student123",
    "displayName": "Nguyễn Văn A",
    "fcmToken": "fcm_token_from_react_native_app",
    "isPushEnabled": true
  }
}
```

**Example cURL**:

```bash
curl -X PUT http://localhost:3000/notifications/fcm-token \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fcmToken": "fcm_token_example_123456",
    "isPushEnabled": true
  }'
```

### 2. Trigger Manual Reminder (Testing)

**Endpoint**: `POST /notifications/trigger-reminder`

**Authentication**: Required (JWT Bearer Token)

**Description**: Trigger manual reminder để test tính năng (không cần đợi đến 8:00 sáng)

**Response**:

```json
{
  "message": "Manual reminder triggered successfully",
  "count": 0
}
```

## Cron Job

Cron job tự động chạy lúc **8:00 sáng hàng ngày** (timezone: Asia/Ho_Chi_Minh).

**Logic**:
1. Query database để tìm các khoản mượn (`Borrow`) có:
   - `status = 'active'`
   - `dueAt` trong vòng 4 ngày tới
   - User có `is_push_enabled = true`
   - User có `fcm_token` không null

2. Lọc các khoản mượn ở các mốc:
   - **-3 ngày**: Còn 3 ngày nữa hết hạn
   - **-1 ngày**: Còn 1 ngày nữa hết hạn
   - **0 ngày**: Đúng ngày hết hạn

3. Xử lý batch:
   - Chia nhỏ danh sách thành các batch 50 user
   - Gửi tuần tự từng batch
   - Delay 1 giây giữa các batch

4. Retry mechanism:
   - Nếu gửi thất bại, retry tối đa 3 lần
   - Exponential backoff: 2s, 4s, 6s

## Database Schema

### User Model (Updated)

```prisma
model User {
  // ... existing fields
  fcmToken      String?  @map("fcm_token")
  isPushEnabled Boolean  @default(true) @map("is_push_enabled")
  // ...
}
```

### NotificationLog Model (New)

```prisma
model NotificationLog {
  id            String            @id @default(uuid())
  userId        String            @map("user_id")
  borrowId      String?           @map("borrow_id")
  title         String
  body          String
  status        NotificationStatus @default(pending)
  fcmToken      String?           @map("fcm_token")
  errorMessage  String?           @map("error_message")
  retryCount    Int               @default(0) @map("retry_count")
  sentAt        DateTime?         @map("sent_at")
  createdAt     DateTime          @default(now()) @map("created_at")

  user   User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  borrow Borrow? @relation(fields: [borrowId], references: [id], onDelete: SetNull)
}
```

## Notification Content

### -3 ngày trước hết hạn

```
Title: 📚 Nhắc nhở trả sách
Body: Sách "{bookTitle}" của bạn sẽ hết hạn sau 3 ngày nữa. Vui lòng chuẩn bị trả sách!
```

### -1 ngày trước hết hạn

```
Title: 📚 Nhắc nhở trả sách
Body: Sách "{bookTitle}" của bạn sẽ hết hạn vào ngày mai. Vui lòng chuẩn bị trả sách!
```

### Đúng ngày hết hạn

```
Title: 📚 Hạn trả sách hôm nay!
Body: Sách "{bookTitle}" của bạn hết hạn trả vào hôm nay. Vui lòng trả sách đúng hạn!
```

## React Native Integration

### 1. Cài Đặt Dependencies

```bash
npm install @react-native-firebase/app @react-native-firebase/messaging
```

### 2. Lấy FCM Token

```typescript
import messaging from '@react-native-firebase/messaging';

async function getFCMToken() {
  try {
    const token = await messaging().getToken();
    console.log('FCM Token:', token);
    return token;
  } catch (error) {
    console.error('Error getting FCM token:', error);
  }
}
```

### 3. Gửi Token Lên Backend

```typescript
import axios from 'axios';

async function updateFCMToken(token: string) {
  try {
    const response = await axios.put(
      'http://your-api-url/notifications/fcm-token',
      {
        fcmToken: token,
        isPushEnabled: true,
      },
      {
        headers: {
          Authorization: `Bearer ${yourJwtToken}`,
        },
      }
    );
    console.log('FCM token updated:', response.data);
  } catch (error) {
    console.error('Error updating FCM token:', error);
  }
}

// Sử dụng
const fcmToken = await getFCMToken();
if (fcmToken) {
  await updateFCMToken(fcmToken);
}
```

### 4. Xử Lý Notification Khi App Đang Chạy

```typescript
import messaging from '@react-native-firebase/messaging';

// Foreground messages
messaging().onMessage(async remoteMessage => {
  console.log('Notification received:', remoteMessage);
  // Hiển thị notification trong app
});

// Background messages
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('Background notification:', remoteMessage);
});
```

## Monitoring & Logs

Tất cả notifications được log vào bảng `NotificationLog` với các trạng thái:

- `pending`: Đang chờ gửi
- `sent`: Đã gửi thành công
- `failed`: Gửi thất bại sau MAX_RETRY lần

**Query logs**:

```sql
-- Xem tất cả notifications đã gửi
SELECT * FROM notification_logs 
WHERE status = 'sent' 
ORDER BY created_at DESC;

-- Xem notifications thất bại
SELECT * FROM notification_logs 
WHERE status = 'failed' 
ORDER BY created_at DESC;

-- Xem notifications của một user cụ thể
SELECT * FROM notification_logs 
WHERE user_id = 'user-uuid' 
ORDER BY created_at DESC;
```

## Troubleshooting

### 1. Firebase Admin SDK không khởi tạo

**Nguyên nhân**: Thiếu hoặc sai Firebase credentials trong `.env`

**Giải pháp**: 
- Kiểm tra lại `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`
- Đảm bảo `FIREBASE_PRIVATE_KEY` có đầy đủ `\n` và format đúng

### 2. Cron job không chạy

**Nguyên nhân**: 
- Server không chạy vào lúc 8:00 sáng
- Timezone không đúng

**Giải pháp**:
- Đảm bảo server chạy 24/7 (hoặc dùng scheduled task)
- Kiểm tra timezone trong cron job: `timeZone: 'Asia/Ho_Chi_Minh'`

### 3. Notifications không được gửi

**Nguyên nhân**:
- User không có `fcm_token`
- User có `is_push_enabled = false`
- FCM token không hợp lệ

**Giải pháp**:
- Kiểm tra `notification_logs` để xem error message
- Đảm bảo React Native app đã gửi FCM token lên backend
- Kiểm tra FCM token có hợp lệ không

### 4. Tỷ lệ gửi thấp (<95%)

**Nguyên nhân**:
- Batch size quá lớn
- Server bị quá tải

**Giải pháp**:
- Giảm `BATCH_SIZE` trong `NotificationService` (mặc định: 50)
- Tăng delay giữa các batch
- Kiểm tra server resources

## Performance

- **Batch Size**: 50 user mỗi đợt (có thể điều chỉnh)
- **Delay giữa batch**: 1 giây
- **Max Retry**: 3 lần
- **Retry Backoff**: Exponential (2s, 4s, 6s)

## Security

- ✅ FCM token chỉ được cập nhật bởi chính user đó (JWT authentication)
- ✅ Firebase Admin SDK credentials được lưu trong environment variables
- ✅ Private key không được commit vào git

## Next Steps

1. ✅ Setup Firebase Admin SDK
2. ✅ Implement cron job
3. ✅ Create API endpoints
4. ⏭️ Test với React Native app
5. ⏭️ Monitor notification logs
6. ⏭️ Optimize batch processing nếu cần
