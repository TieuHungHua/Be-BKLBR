# Notification Module - Nhắc Hạn Trả Tự Động

## Tổng Quan

Module này xử lý việc gửi push notifications nhắc hạn trả sách tự động cho người dùng.

## Cấu Trúc

```
notification/
├── firebase-admin.service.ts    # Firebase Admin SDK service
├── notification.service.ts       # Service chính với cron job và logic
├── notification.controller.ts    # API endpoints
├── notification.module.ts        # Module definition
└── dto/
    └── update-fcm-token.dto.ts   # DTO cho update FCM token
```

## Tính Năng

- ✅ Cron job chạy lúc 8:00 sáng hàng ngày
- ✅ Gửi thông báo ở các mốc: -3 ngày, -1 ngày, và đúng ngày (0)
- ✅ Batch processing (50 user/batch) để đảm bảo tỷ lệ gửi >95%
- ✅ Retry mechanism (tối đa 3 lần)
- ✅ Log tất cả notifications vào `NotificationLog`

## Setup Nhanh

1. **Cài đặt dependencies** (đã cài):
   ```bash
   npm install @nestjs/schedule firebase-admin
   ```

2. **Thêm Firebase config vào `.env`**:
   ```env
   FIREBASE_PROJECT_ID="bk-library-e0771"
   FIREBASE_CLIENT_EMAIL="firebase-adminsdk-fbsvc@bk-library-e0771.iam.gserviceaccount.com"
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   FIREBASE_DATABASE_URL="https://bk-library-e0771-default-rtdb.asia-southeast1.firebasedatabase.app"
   ```

3. **Chạy migration**:
   ```bash
   npx prisma migrate dev --name add_notification_fields
   ```

## API Endpoints

### PUT /notifications/fcm-token
Cập nhật FCM token cho user (React Native app gọi)

### POST /notifications/trigger-reminder
Trigger manual reminder để test (không cần đợi 8:00 sáng)

## Xem Chi Tiết

Xem file `backend/docs/api-notifications.md` để biết chi tiết về:
- Setup đầy đủ
- API documentation
- React Native integration
- Troubleshooting
- Performance tuning
